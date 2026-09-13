import { createAdminClient } from './admin';
import {
  Party,
  Guest,
  Table,
  Expense,
  Milestone,
  SongRequest,
  PartyRsvpSubmission,
  TableHierarchy,
  InspirationLink
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
      const primaryGuest = partyGuests.find(g => g.is_primary_contact) || partyGuests[0];
      return {
        ...party,
        relationship_tag: party.relationship_tag || primaryGuest?.relationship_tag || 'general',
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
    const allowedFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'rsvp_status',
      'headcount',
      'dietary_restrictions',
      'dietary_notes',
      'song_request',
      'notes',
      'table_id',
      'table_seat_number',
      'is_primary_contact',
      'relationship_tag',
      'plus_one_names'
    ];
    const filteredUpdate: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    for (const key of allowedFields) {
      if (key in updates && (updates as any)[key] !== undefined) {
        filteredUpdate[key] = (updates as any)[key];
      }
    }

    const { data, error } = await supabase
      .from('guests')
      .update(filteredUpdate)
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
    const { relationship_tag, ...partyFields } = updates as any;

    // Propagate relationship_tag to all member guests in the party
    if (relationship_tag) {
      await supabase
        .from('guests')
        .update({
          relationship_tag,
          updated_at: new Date().toISOString()
        })
        .eq('party_id', partyId);
    }

    // Filter to only legitimate columns present in Supabase parties table
    const allowedFields = [
      'primary_guest_name',
      'invitation_code',
      'total_invited',
      'contact_email',
      'contact_phone',
      'notes'
    ];
    const filteredUpdate: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in partyFields && partyFields[key] !== undefined) {
        filteredUpdate[key] = partyFields[key];
      }
    }

    const { data, error } = await supabase
      .from('parties')
      .update(filteredUpdate)
      .eq('id', partyId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ...(data as Party), relationship_tag };
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

  private static hydrateExpense(row: any): Expense {
    if (!row) return row;
    let notes = row.notes || '';
    let paymentMethod = row.payment_method;
    const match = notes.match(/<!--PAYMENT_METHOD:(.*?)-->/);
    if (match) {
      paymentMethod = match[1].trim();
      notes = notes.replace(/<!--PAYMENT_METHOD:.*?-->/, '').trim();
    }
    return {
      ...row,
      notes,
      payment_method: paymentMethod || 'Zelle'
    };
  }

  public static async getExpenses(): Promise<Expense[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('payment_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(r => this.hydrateExpense(r));
  }

  public static async getExpenseById(id: string): Promise<Expense | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.hydrateExpense(data);
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
    let categoryBudgets: Record<string, any> = {};
    try {
      const supabase = this.getClient();
      const { data } = await supabase
        .from('agent_logs')
        .select('details')
        .eq('action', 'wedding_settings')
        .order('id', { ascending: false })
        .limit(1);
      if (data && data[0]?.details) {
        if (data[0].details.target_budget_cap) {
          targetBudgetCap = Number(data[0].details.target_budget_cap);
        }
        if (data[0].details.categories) {
          categoryBudgets = data[0].details.categories;
        }
      }
    } catch (e) {
      // ignore
    }

    const totalTargetAllocated = Object.values(categoryBudgets).reduce(
      (sum: number, cat: any) => sum + Number(cat.estimated_cost || 0),
      0
    );

    return {
      target_budget_cap: targetBudgetCap || totalTargetAllocated,
      category_budgets: categoryBudgets,
      total_target_allocated: totalTargetAllocated,
      total_estimated: totalEstimated,
      total_budget_estimated: totalTargetAllocated > 0 ? totalTargetAllocated : totalEstimated,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_deposit_paid: totalPaid,
      remaining_balance: remainingBalance,
      remaining_balance_due: remainingBalance,
      uncommitted_budget: Math.max(0, (targetBudgetCap || totalTargetAllocated) - totalInvoiced),
      due_within_7_days: due7,
      due_within_14_days: due14,
      due_within_30_days: due30
    };
  }

  public static async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const supabase = this.getClient();
    const paymentMethod = expense.payment_method || 'Zelle';
    let userNotes = (expense.notes || '').replace(/<!--PAYMENT_METHOD:.*?-->/, '').trim();
    userNotes = `${userNotes}\n\n<!--PAYMENT_METHOD:${paymentMethod}-->`.trim();

    const payload: any = {
      ...expense,
      notes: userNotes,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    delete payload.payment_method;

    const { data, error } = await supabase.from('expenses').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return this.hydrateExpense(data);
  }

  public static async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const supabase = this.getClient();
    let cleanUpdates: any = { ...updates };

    if (updates.payment_method !== undefined || updates.notes !== undefined) {
      const existing = await this.getExpenseById(id);
      const paymentMethod = updates.payment_method !== undefined ? updates.payment_method : (existing?.payment_method || 'Zelle');
      const baseNotes = (updates.notes !== undefined ? updates.notes : (existing?.notes || '')).replace(/<!--PAYMENT_METHOD:.*?-->/, '').trim();
      cleanUpdates.notes = `${baseNotes}\n\n<!--PAYMENT_METHOD:${paymentMethod}-->`.trim();
    }
    delete cleanUpdates.payment_method;

    const { data, error } = await supabase
      .from('expenses')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.hydrateExpense(data);
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

  // ==========================================
  // 6. INSPIRATION & LINK VAULT
  // ==========================================

  private static hydrateLink(row: any): InspirationLink {
    if (!row) return row;
    let notes = row.notes || '';
    let contractMeta: any = {};
    const match = notes.match(/<!--CONTRACT_META:(.*?)-->/);
    if (match) {
      try {
        contractMeta = JSON.parse(match[1]);
        notes = notes.replace(/<!--CONTRACT_META:.*?-->/, '').trim();
      } catch (e) {
        // ignore parse error
      }
    }

    return {
      id: row.id,
      url: row.url || '',
      title: row.title || 'Untitled Link',
      description: row.description || '',
      image_url: row.image_url || null,
      site_name: row.site_name || '',
      category: row.category || 'decor',
      submitted_by: row.submitted_by || 'Alfredo',
      notes,
      status: row.status || 'saved',
      discord_thread_id: row.discord_thread_id || null,
      discord_message_id: row.discord_message_id || null,
      discord_thread_url: row.discord_thread_url || null,
      estimated_cost: row.estimated_cost !== null && row.estimated_cost !== undefined ? Number(row.estimated_cost) : null,
      converted_to_expense_id: row.converted_to_expense_id || null,
      is_contract: row.is_contract !== undefined ? Boolean(row.is_contract) : Boolean(contractMeta.is_contract),
      document_url: row.document_url !== undefined ? row.document_url : (contractMeta.document_url || null),
      document_filename: row.document_filename !== undefined ? row.document_filename : (contractMeta.document_filename || null),
      document_type: row.document_type !== undefined ? row.document_type : (contractMeta.document_type || null),
      vendor_name: row.vendor_name !== undefined ? row.vendor_name : (contractMeta.vendor_name || null),
      deposit_amount: row.deposit_amount !== undefined ? row.deposit_amount : (contractMeta.deposit_amount ?? null),
      balance_due: row.balance_due !== undefined ? row.balance_due : (contractMeta.balance_due ?? null),
      payment_due_date: row.payment_due_date !== undefined ? row.payment_due_date : (contractMeta.payment_due_date || null),
      contract_terms: row.contract_terms !== undefined ? row.contract_terms : (contractMeta.contract_terms || null),
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString()
    };
  }

  public static async getLinks(category?: string, status?: string): Promise<InspirationLink[]> {
    const supabase = this.getClient();
    let query = supabase
      .from('inspiration_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(r => this.hydrateLink(r));
  }

  public static async getLinkById(id: string): Promise<InspirationLink | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('inspiration_links')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.hydrateLink(data);
  }

  public static async createLink(data: {
    url?: string;
    title: string;
    description?: string;
    image_url?: string | null;
    site_name?: string;
    category?: any;
    submitted_by?: string;
    notes?: string;
    status?: any;
    discord_thread_id?: string | null;
    discord_message_id?: string | null;
    discord_thread_url?: string | null;
    estimated_cost?: number | null;
    is_contract?: boolean;
    document_url?: string | null;
    document_filename?: string | null;
    document_type?: 'pdf' | 'image' | null;
    vendor_name?: string | null;
    deposit_amount?: number | null;
    balance_due?: number | null;
    payment_due_date?: string | null;
    contract_terms?: string | null;
  }): Promise<InspirationLink> {
    const supabase = this.getClient();
    const now = new Date().toISOString();

    const isContract = data.is_contract || data.document_type === 'pdf' || !!data.vendor_name;
    const contractMeta = {
      is_contract: isContract,
      document_url: data.document_url || null,
      document_filename: data.document_filename || null,
      document_type: data.document_type || null,
      vendor_name: data.vendor_name || null,
      deposit_amount: data.deposit_amount !== undefined ? data.deposit_amount : null,
      balance_due: data.balance_due !== undefined ? data.balance_due : null,
      payment_due_date: data.payment_due_date || null,
      contract_terms: data.contract_terms || null
    };

    let userNotes = (data.notes || '').trim();
    if (isContract || data.document_url || data.vendor_name) {
      userNotes = `${userNotes}\n\n<!--CONTRACT_META:${JSON.stringify(contractMeta)}-->`.trim();
    }

    const payload = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: data.url || '',
      title: data.title || 'Untitled Link',
      description: data.description || '',
      image_url: data.image_url || null,
      site_name: data.site_name || '',
      category: data.category || 'decor',
      submitted_by: data.submitted_by || 'Alfredo',
      notes: userNotes,
      status: data.status || 'saved',
      discord_thread_id: data.discord_thread_id || null,
      discord_message_id: data.discord_message_id || null,
      discord_thread_url: data.discord_thread_url || null,
      estimated_cost: data.estimated_cost || null,
      created_at: now,
      updated_at: now
    };

    const { data: created, error } = await supabase
      .from('inspiration_links')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.hydrateLink(created);
  }

  public static async updateLink(
    id: string,
    updates: Partial<InspirationLink>
  ): Promise<InspirationLink | null> {
    const supabase = this.getClient();

    // Check if contract fields are being updated
    const hasContractUpdates =
      updates.is_contract !== undefined ||
      updates.vendor_name !== undefined ||
      updates.deposit_amount !== undefined ||
      updates.balance_due !== undefined ||
      updates.payment_due_date !== undefined ||
      updates.contract_terms !== undefined ||
      updates.document_url !== undefined;

    let cleanUpdates: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (hasContractUpdates) {
      const existing = await this.getLinkById(id);
      const contractMeta = {
        is_contract: updates.is_contract !== undefined ? updates.is_contract : existing?.is_contract,
        document_url: updates.document_url !== undefined ? updates.document_url : existing?.document_url,
        document_filename: updates.document_filename !== undefined ? updates.document_filename : existing?.document_filename,
        document_type: updates.document_type !== undefined ? updates.document_type : existing?.document_type,
        vendor_name: updates.vendor_name !== undefined ? updates.vendor_name : existing?.vendor_name,
        deposit_amount: updates.deposit_amount !== undefined ? updates.deposit_amount : existing?.deposit_amount,
        balance_due: updates.balance_due !== undefined ? updates.balance_due : existing?.balance_due,
        payment_due_date: updates.payment_due_date !== undefined ? updates.payment_due_date : existing?.payment_due_date,
        contract_terms: updates.contract_terms !== undefined ? updates.contract_terms : existing?.contract_terms
      };

      const baseNotes = (updates.notes !== undefined ? updates.notes : (existing?.notes || '')).replace(/<!--CONTRACT_META:.*?-->/, '').trim();
      cleanUpdates.notes = `${baseNotes}\n\n<!--CONTRACT_META:${JSON.stringify(contractMeta)}-->`.trim();
    }

    // Remove fields not present in Supabase table columns
    delete cleanUpdates.is_contract;
    delete cleanUpdates.document_url;
    delete cleanUpdates.document_filename;
    delete cleanUpdates.document_type;
    delete cleanUpdates.vendor_name;
    delete cleanUpdates.deposit_amount;
    delete cleanUpdates.balance_due;
    delete cleanUpdates.payment_due_date;
    delete cleanUpdates.contract_terms;

    const { data, error } = await supabase
      .from('inspiration_links')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.hydrateLink(data);
  }

  public static async deleteLink(id: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('inspiration_links')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}
