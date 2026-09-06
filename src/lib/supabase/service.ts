import { createAdminClient } from './admin';
import {
  Party,
  Guest,
  Table,
  Expense,
  Milestone,
  SongRequest,
  PartyRsvpSubmission,
  TableHierarchy
} from '../types';

export class SupabaseService {
  private static getClient() {
    const client = createAdminClient();
    if (!client) {
      throw new Error('Supabase client is not configured');
    }
    return client;
  }

  // ==========================================
  // 1. PARTIES & GUESTS
  // ==========================================

  public static async getGuests(): Promise<Guest[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Guest[];
  }

  public static async getParties(): Promise<Party[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Party[];
  }

  public static async getPartiesWithGuests(): Promise<Array<Party & { guests: Guest[] }>> {
    const [parties, guests] = await Promise.all([
      this.getParties(),
      this.getGuests()
    ]);

    // Attach guest summaries to parties if needed
    return parties.map(party => {
      const partyGuests = guests.filter(g => g.party_id === party.id);
      return {
        ...party,
        guests: partyGuests
      };
    });
  }

  public static async getPartyByCodeOrPhone(query: string): Promise<{ party: Party; guests: Guest[] } | null> {
    if (!query || !query.trim()) return null;
    const supabase = this.getClient();
    const trimmed = query.trim().toUpperCase();
    const digitsOnly = query.replace(/\D/g, '');

    // 1. Check invitation code (case-insensitive)
    const { data: codeMatches } = await supabase
      .from('parties')
      .select('*')
      .ilike('invitation_code', trimmed);

    let party: Party | null = (codeMatches && codeMatches.length > 0) ? codeMatches[0] as Party : null;

    // 2. Check phone number on party if not found
    if (!party && digitsOnly.length >= 7) {
      const { data: allParties } = await supabase.from('parties').select('*');
      if (allParties) {
        party = (allParties.find((p: Party) => {
          const pDigits = (p.contact_phone || '').replace(/\D/g, '');
          return pDigits && (pDigits.includes(digitsOnly) || digitsOnly.includes(pDigits));
        }) || null) as Party | null;
      }
    }

    // 3. Check guest phone if not found
    if (!party && digitsOnly.length >= 7) {
      const { data: allGuests } = await supabase.from('guests').select('*');
      if (allGuests) {
        const matchingGuest = allGuests.find((g: Guest) => {
          const gDigits = (g.phone || '').replace(/\D/g, '');
          return gDigits && (gDigits.includes(digitsOnly) || digitsOnly.includes(gDigits));
        });
        if (matchingGuest) {
          const { data: matchedParty } = await supabase
            .from('parties')
            .select('*')
            .eq('id', matchingGuest.party_id)
            .single();
          if (matchedParty) party = matchedParty as Party;
        }
      }
    }

    if (!party) return null;

    // Fetch all guests in this party
    const { data: partyGuests, error: gError } = await supabase
      .from('guests')
      .select('*')
      .eq('party_id', party.id)
      .order('is_primary_contact', { ascending: false });

    if (gError) throw new Error(gError.message);

    return {
      party,
      guests: (partyGuests || []) as Guest[]
    };
  }

  public static async submitPartyRsvp(payload: PartyRsvpSubmission): Promise<{
    party: Party;
    guests: Guest[];
    attendingCount: number;
    declinedCount: number;
  }> {
    const supabase = this.getClient();

    // 1. Fetch current party
    const { data: party, error: pError } = await supabase
      .from('parties')
      .select('*')
      .eq('id', payload.party_id)
      .single();

    if (pError || !party) {
      throw new Error(`Party with id "${payload.party_id}" not found`);
    }

    // 2. Update party fields
    const updatedPartyData: Partial<Party> = {
      contact_email: payload.contact_email || party.contact_email,
      contact_phone: payload.contact_phone || party.contact_phone,
      notes: payload.special_message
        ? `[Note]: ${payload.special_message} | ${party.notes || ''}`.trim()
        : party.notes
    };

    const { data: updatedParty, error: partyUpdateError } = await supabase
      .from('parties')
      .update(updatedPartyData)
      .eq('id', payload.party_id)
      .select()
      .single();

    if (partyUpdateError) throw new Error(partyUpdateError.message);

    // 3. Update guest records
    let attendingCount = 0;
    let declinedCount = 0;
    const now = new Date().toISOString();

    for (const update of payload.guests) {
      if (update.rsvp_status === 'attending') attendingCount++;
      if (update.rsvp_status === 'declined') declinedCount++;

      const isNewGuest = update.guest_id.startsWith('new-') || update.guest_id.startsWith('guest-new-');

      if (isNewGuest) {
        // Insert newly added party guest
        const newGuestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await supabase.from('guests').insert({
          id: newGuestId,
          party_id: payload.party_id,
          first_name: (update.first_name || 'Guest').trim(),
          last_name: (update.last_name || '').trim(),
          rsvp_status: update.rsvp_status,
          headcount: 1,
          dietary_restrictions: update.dietary_restrictions || [],
          dietary_notes: update.dietary_notes || null,
          is_primary_contact: false,
          relationship_tag: party.relationship_tag || 'general',
          created_at: now,
          updated_at: now
        });
      } else {
        // Update existing guest
        const updateData: any = {
          rsvp_status: update.rsvp_status,
          dietary_restrictions: update.dietary_restrictions || [],
          dietary_notes: update.dietary_notes || null,
          updated_at: now
        };
        if (update.first_name) updateData.first_name = update.first_name;
        if (update.last_name !== undefined) updateData.last_name = update.last_name;

        await supabase
          .from('guests')
          .update(updateData)
          .eq('id', update.guest_id)
          .eq('party_id', payload.party_id);
      }
    }

    // 4. Insert song request if provided
    if (payload.song_request?.song_title && payload.song_request.song_title.trim()) {
      await supabase.from('song_requests').insert({
        id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        guest_name: party.primary_guest_name,
        song_title: payload.song_request.song_title.trim(),
        artist: payload.song_request.artist?.trim() || 'Guest Request',
        genre: 'other',
        notes: `Requested by ${party.primary_guest_name} during personalized party RSVP`,
        status: 'queued',
        created_at: now
      });
    }

    // 5. Fetch updated guests
    const { data: updatedGuests } = await supabase
      .from('guests')
      .select('*')
      .eq('party_id', payload.party_id)
      .order('is_primary_contact', { ascending: false });

    return {
      party: updatedParty as Party,
      guests: (updatedGuests || []) as Guest[],
      attendingCount,
      declinedCount
    };
  }

  public static async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('guests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Guest;
  }

  public static async deleteGuest(id: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  public static async createParty(data: {
    primary_guest_name: string;
    contact_phone?: string;
    contact_email?: string;
    total_invited?: number;
    invitation_code?: string;
    guest_names?: string[];
    relationship_tag?: TableHierarchy;
    notes?: string;
  }): Promise<{ party: Party; guests: Guest[] }> {
    const supabase = this.getClient();
    const now = new Date().toISOString();
    const partyId = `party-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Generate unique code if not provided
    const code = (
      data.invitation_code ||
      `${data.primary_guest_name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
    ).toUpperCase();

    const newParty: Party = {
      id: partyId,
      primary_guest_name: data.primary_guest_name,
      invitation_code: code,
      total_invited: data.total_invited || (data.guest_names ? data.guest_names.length : 1),
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      notes: data.notes,
      created_at: now
    };

    const { data: createdParty, error: pError } = await supabase
      .from('parties')
      .insert(newParty)
      .select()
      .single();

    if (pError) throw new Error(pError.message);

    // Create guests
    const names = data.guest_names && data.guest_names.length > 0
      ? data.guest_names
      : [data.primary_guest_name];

    const newGuests: Guest[] = names.map((fullName, idx) => {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || fullName;
      const lastName = parts.slice(1).join(' ');

      return {
        id: `guest-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        party_id: partyId,
        first_name: firstName,
        last_name: lastName,
        email: idx === 0 ? data.contact_email : undefined,
        phone: idx === 0 ? data.contact_phone : undefined,
        rsvp_status: 'pending',
        headcount: 1,
        dietary_restrictions: [],
        table_id: null,
        table_seat_number: null,
        is_primary_contact: idx === 0,
        relationship_tag: data.relationship_tag || 'general',
        plus_one_names: [],
        created_at: now,
        updated_at: now
      };
    });

    const { data: createdGuests, error: gError } = await supabase
      .from('guests')
      .insert(newGuests)
      .select();

    if (gError) throw new Error(gError.message);

    return {
      party: createdParty as Party,
      guests: (createdGuests || []) as Guest[]
    };
  }

  public static async deleteParty(partyId: string): Promise<boolean> {
    const supabase = this.getClient();
    await supabase.from('guests').delete().eq('party_id', partyId);
    const { error } = await supabase.from('parties').delete().eq('id', partyId);
    if (error) throw new Error(error.message);
    return true;
  }

  public static async updateParty(
    partyId: string,
    updates: Partial<Omit<Party, 'id' | 'created_at'>>
  ): Promise<Party> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('parties')
      .update(updates)
      .eq('id', partyId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Party;
  }

  public static async bulkImportParties(rows: Array<{
    name: string;
    code?: string;
    total?: number;
    email?: string;
    phone?: string;
    guests?: string[];
    tag?: string;
    notes?: string;
  }>): Promise<{
    imported_parties: number;
    imported_guests: number;
    parties: Party[];
    guests: Guest[];
  }> {
    let importedParties = 0;
    let importedGuests = 0;

    for (const r of rows) {
      if (!r.name) continue;
      const guestNames = r.guests && r.guests.length > 0 ? r.guests : [r.name];
      await this.createParty({
        primary_guest_name: r.name,
        invitation_code: r.code,
        total_invited: r.total || guestNames.length,
        contact_email: r.email,
        contact_phone: r.phone,
        guest_names: guestNames,
        relationship_tag: (r.tag as TableHierarchy) || 'general',
        notes: r.notes
      });
      importedParties++;
      importedGuests += guestNames.length;
    }

    const [parties, guests] = await Promise.all([this.getParties(), this.getGuests()]);
    return {
      imported_parties: importedParties,
      imported_guests: importedGuests,
      parties,
      guests
    };
  }

  // ==========================================
  // 2. TABLES & SEATING
  // ==========================================

  public static async getTablesWithGuests(): Promise<{
    tables: Table[];
    math: {
      confirmed_headcount: number;
      required_10_top_tables: number;
      empty_seats: number;
      fill_rate_percent: number;
      total_tables: number;
      total_capacity: number;
      assigned_guests_count: number;
      unassigned_guests_count: number;
    };
  }> {
    const supabase = this.getClient();
    const [tablesRes, guestsRes] = await Promise.all([
      supabase.from('tables').select('*').order('table_number', { ascending: true }),
      supabase.from('guests').select('*')
    ]);

    if (tablesRes.error) throw new Error(tablesRes.error.message);
    if (guestsRes.error) throw new Error(guestsRes.error.message);

    const tables = (tablesRes.data || []) as Table[];
    const guests = (guestsRes.data || []) as Guest[];

    const attendingGuests = guests.filter(g => g.rsvp_status === 'attending');
    const confirmedHeadcount = attendingGuests.reduce((acc, g) => acc + (g.headcount || 1), 0);

    const tablesWithGuests = tables.map(table => {
      const seated = guests.filter(g => g.table_id === table.id);
      return {
        ...table,
        assigned_count: seated.length,
        guests: seated
      };
    });

    const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 10), 0);
    const assignedCount = guests.filter(g => g.table_id && g.rsvp_status === 'attending').length;
    const unassignedCount = guests.filter(g => !g.table_id && g.rsvp_status === 'attending').length;
    const emptySeats = Math.max(0, totalCapacity - assignedCount);
    const fillRate = totalCapacity > 0 ? Math.round((assignedCount / totalCapacity) * 100) : 0;

    return {
      tables: tablesWithGuests,
      math: {
        confirmed_headcount: confirmedHeadcount,
        required_10_top_tables: Math.ceil(confirmedHeadcount / 10),
        empty_seats: emptySeats,
        fill_rate_percent: fillRate,
        total_tables: tables.length,
        total_capacity: totalCapacity,
        assigned_guests_count: assignedCount,
        unassigned_guests_count: unassignedCount
      }
    };
  }

  public static async assignGuestToTable(
    guestId: string,
    tableId: string | null,
    seatNumber?: number | null
  ): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('guests')
      .update({
        table_id: tableId,
        table_seat_number: seatNumber !== undefined ? seatNumber : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', guestId);

    if (error) throw new Error(error.message);
    return true;
  }

  public static async addTable(
    name: string,
    hierarchy_tag: TableHierarchy = 'general',
    capacity: number = 10
  ): Promise<Table> {
    const supabase = this.getClient();
    const { data: existing } = await supabase.from('tables').select('table_number').order('table_number', { ascending: false }).limit(1);
    const nextNum = (existing && existing.length > 0) ? (existing[0].table_number + 1) : 1;

    const newTable: Table = {
      id: `table-${nextNum}-${Date.now()}`,
      table_number: nextNum,
      name: name || `Bàn ${nextNum}: Tiệc Cưới`,
      capacity,
      hierarchy_tag,
      stage_position: 'center'
    };

    const { data, error } = await supabase.from('tables').insert(newTable).select().single();
    if (error) throw new Error(error.message);
    return data as Table;
  }

  public static async deleteTable(tableId: string): Promise<boolean> {
    const supabase = this.getClient();
    // Unassign seated guests
    await supabase.from('guests').update({ table_id: null, table_seat_number: null }).eq('table_id', tableId);
    const { error } = await supabase.from('tables').delete().eq('id', tableId);
    if (error) throw new Error(error.message);
    return true;
  }

  // ==========================================
  // 3. BUDGET & EXPENSES
  // ==========================================

  public static async getExpenses(): Promise<Expense[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('payment_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Expense[];
  }

  public static async getBudgetMetrics(): Promise<any> {
    const expenses = await this.getExpenses();
    const totalEstimated = expenses.reduce((acc, e) => acc + Number(e.estimated_cost || 0), 0);
    const totalInvoiced = expenses.reduce((acc, e) => acc + Number(e.actual_invoiced || 0), 0);
    const totalPaid = expenses.reduce((acc, e) => acc + Number(e.deposit_paid || 0), 0);
    const remainingBalance = expenses.reduce((acc, e) => acc + Number(e.remaining_balance || 0), 0);

    const now = new Date();
    const due7 = expenses.filter(e => {
      if (e.payment_status === 'paid') return false;
      const diff = (new Date(e.payment_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    const due14 = expenses.filter(e => {
      if (e.payment_status === 'paid') return false;
      const diff = (new Date(e.payment_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7 && diff <= 14;
    });

    const due30 = expenses.filter(e => {
      if (e.payment_status === 'paid') return false;
      const diff = (new Date(e.payment_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 14 && diff <= 30;
    });

    let targetBudgetCap: number | undefined;
    try {
      const supabase = this.getClient();
      const { data } = await supabase
        .from('agent_logs')
        .select('details')
        .eq('action', 'wedding_settings')
        .order('id', { ascending: false })
        .limit(1);
      if (data && data[0]?.details?.target_budget_cap) {
        targetBudgetCap = Number(data[0].details.target_budget_cap);
      }
    } catch (e) {
      // ignore
    }

    return {
      target_budget_cap: targetBudgetCap,
      total_estimated: totalEstimated,
      total_budget_estimated: totalEstimated,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_deposit_paid: totalPaid,
      remaining_balance: remainingBalance,
      remaining_balance_due: remainingBalance,
      due_within_7_days: due7,
      due_within_14_days: due14,
      due_within_30_days: due30
    };
  }

  public static async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const supabase = this.getClient();
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('expenses').insert(newExp).select().single();
    if (error) throw new Error(error.message);
    return data as Expense;
  }

  public static async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Expense;
  }

  public static async deleteExpense(id: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // ==========================================
  // 4. MILESTONES & TIMELINE
  // ==========================================

  public static async getMilestones(): Promise<Milestone[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('target_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Milestone[];
  }

  public static async addMilestone(data: Omit<Milestone, 'id' | 'updated_at'>): Promise<Milestone> {
    const supabase = this.getClient();
    const newMs: Milestone = {
      ...data,
      id: `ms-${Date.now()}`,
      updated_at: new Date().toISOString()
    };

    const { data: created, error } = await supabase.from('milestones').insert(newMs).select().single();
    if (error) throw new Error(error.message);
    return created as Milestone;
  }

  public static async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('milestones')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Milestone;
  }

  // ==========================================
  // 5. MASTER DJ QUEUE
  // ==========================================

  public static async getSongRequests(): Promise<SongRequest[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('song_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as SongRequest[];
  }

  public static async addSongRequest(data: Omit<SongRequest, 'id' | 'created_at'>): Promise<SongRequest> {
    const supabase = this.getClient();
    const newSong: SongRequest = {
      ...data,
      id: `song-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    const { data: created, error } = await supabase.from('song_requests').insert(newSong).select().single();
    if (error) throw new Error(error.message);
    return created as SongRequest;
  }

  public static async updateSongRequest(id: string, updates: Partial<SongRequest>): Promise<SongRequest | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('song_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SongRequest;
  }
}
