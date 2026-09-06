import fs from 'fs';
import path from 'path';
import {
  Guest,
  Party,
  Table,
  Expense,
  Milestone,
  SongRequest,
  VenueSourcingResult,
  DailyBriefing,
  TableHierarchy,
  PartyRsvpSubmission,
  WeddingSettings
} from './types';
import {
  initialGuests,
  initialParties,
  initialTables,
  initialExpenses,
  initialMilestones,
  initialSongRequests,
  initialSourcedVenues,
  defaultWeddingSettings
} from './seedData';
import { createAdminClient } from './supabase/admin';
import { SupabaseService } from './supabase/service';

interface DatabaseState {
  parties: Party[];
  guests: Guest[];
  tables: Table[];
  expenses: Expense[];
  milestones: Milestone[];
  song_requests: SongRequest[];
  venues: VenueSourcingResult[];
  agent_logs: Array<{ timestamp: string; agent: string; action: string; details?: any }>;
  settings?: WeddingSettings;
}

// Global in-memory cache to support fast hot reloads + filesystem backup
const DATA_FILE_PATH = path.join(process.cwd(), '.data', 'db.json');

function ensureDataDirExists() {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      // Fallback in-memory
    }
  }
}

function loadState(): DatabaseState {
  try {
    ensureDataDirExists();
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read db.json, initializing with default seed', err);
  }

  const defaultState: DatabaseState = {
    parties: [],
    guests: [],
    tables: [...initialTables],
    expenses: [],
    milestones: [],
    song_requests: [],
    venues: [...initialSourcedVenues],
    agent_logs: []
  };

  saveState(defaultState);
  return defaultState;
}

function saveState(state: DatabaseState) {
  try {
    ensureDataDirExists();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write db.json, using in-memory state', err);
  }
}

export class WeddingDB {
  private static getState(): DatabaseState {
    return loadState();
  }

  private static updateState(updater: (state: DatabaseState) => void): DatabaseState {
    const state = loadState();
    updater(state);
    saveState(state);
    return state;
  }

  public static isSupabaseConfigured(): boolean {
    const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    return hasUrl && hasKey;
  }

  // --- Reset / Seed ---
  public static async resetToSeed(): Promise<DatabaseState> {
    const fresh: DatabaseState = {
      parties: JSON.parse(JSON.stringify(initialParties)),
      guests: JSON.parse(JSON.stringify(initialGuests)),
      tables: JSON.parse(JSON.stringify(initialTables)),
      expenses: JSON.parse(JSON.stringify(initialExpenses)),
      milestones: JSON.parse(JSON.stringify(initialMilestones)),
      song_requests: JSON.parse(JSON.stringify(initialSongRequests)),
      venues: JSON.parse(JSON.stringify(initialSourcedVenues)),
      agent_logs: [
        {
          timestamp: new Date().toISOString(),
          agent: 'System',
          action: 'Database reset to default seed state'
        }
      ]
    };
    saveState(fresh);

    const supabase = createAdminClient();
    if (supabase) {
      try {
        await supabase.from('guests').delete().neq('id', '0');
        await supabase.from('parties').delete().neq('id', '0');
        await supabase.from('tables').delete().neq('id', '0');
        await supabase.from('expenses').delete().neq('id', '0');
        await supabase.from('milestones').delete().neq('id', '0');
        await supabase.from('song_requests').delete().neq('id', '0');

        await supabase.from('parties').insert(initialParties);
        await supabase.from('tables').insert(initialTables);
        await supabase.from('guests').insert(initialGuests);
        await supabase.from('expenses').insert(initialExpenses);
        await supabase.from('milestones').insert(initialMilestones);
        await supabase.from('song_requests').insert(initialSongRequests);
      } catch (e) {
        console.warn('Could not sync seed to Supabase:', e);
      }
    }

    return fresh;
  }

  public static async clearAllGuestsAndParties(): Promise<{
    deletedGuests: number;
    deletedParties: number;
    deletedSongs: number;
    deletedExpenses: number;
    deletedMilestones: number;
  }> {
    let deletedGuests = 0;
    let deletedParties = 0;
    let deletedSongs = 0;
    let deletedExpenses = 0;
    let deletedMilestones = 0;

    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { count: gCount } = await supabase.from('guests').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
        const { count: pCount } = await supabase.from('parties').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
        const { count: sCount } = await supabase.from('song_requests').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
        const { count: eCount } = await supabase.from('expenses').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
        const { count: mCount } = await supabase.from('milestones').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
        deletedGuests = gCount || 0;
        deletedParties = pCount || 0;
        deletedSongs = sCount || 0;
        deletedExpenses = eCount || 0;
        deletedMilestones = mCount || 0;
      } catch (e) {
        console.warn('Could not clear Supabase data:', e);
      }
    }

    this.updateState(s => {
      s.guests = [];
      s.parties = [];
      s.song_requests = [];
      s.expenses = [];
      s.milestones = [];
      s.agent_logs = [];
    });

    return { deletedGuests, deletedParties, deletedSongs, deletedExpenses, deletedMilestones };
  }

  // ==========================================
  // GUESTS & PARTIES
  // ==========================================

  public static async getGuests(): Promise<Guest[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const guests = await SupabaseService.getGuests();
        this.updateState(s => { s.guests = guests; });
        return guests;
      } catch (e) {
        console.warn('Supabase getGuests error, using local state:', e);
      }
    }
    return this.getState().guests;
  }

  public static async getParties(): Promise<Party[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const parties = await SupabaseService.getParties();
        this.updateState(s => { s.parties = parties; });
        return parties;
      } catch (e) {
        console.warn('Supabase getParties error, using local state:', e);
      }
    }
    return this.getState().parties;
  }

  public static async getPartiesWithGuests(): Promise<Array<Party & { guests: Guest[]; confirmed_count?: number }>> {
    if (this.isSupabaseConfigured()) {
      try {
        const parties = await SupabaseService.getPartiesWithGuests();
        return parties.map(p => ({
          ...p,
          confirmed_count: p.guests.filter((g: Guest) => g.rsvp_status === 'attending').length
        }));
      } catch (e) {
        console.warn('Supabase getPartiesWithGuests error, using local state:', e);
      }
    }

    const state = this.getState();
    return state.parties.map(party => {
      const partyGuests = state.guests.filter(g => g.party_id === party.id);
      const confirmedCount = partyGuests.filter(g => g.rsvp_status === 'attending').length;
      return {
        ...party,
        guests: partyGuests,
        confirmed_count: confirmedCount
      };
    });
  }

  public static async getPartyByCodeOrPhone(query: string): Promise<{ party: Party; guests: Guest[] } | null> {
    if (!query || !query.trim()) return null;

    if (this.isSupabaseConfigured()) {
      try {
        const result = await SupabaseService.getPartyByCodeOrPhone(query);
        if (result) return result;
      } catch (e) {
        console.warn('Supabase getPartyByCodeOrPhone error, checking local state:', e);
      }
    }

    const state = this.getState();
    const trimmed = query.trim().toLowerCase();
    const digitsOnly = query.replace(/\D/g, '');

    let party = state.parties.find(p => p.invitation_code.trim().toLowerCase() === trimmed);
    if (!party) party = state.parties.find(p => p.id.toLowerCase() === trimmed);

    if (!party && digitsOnly.length >= 7) {
      party = state.parties.find(p => {
        const pDigits = (p.contact_phone || '').replace(/\D/g, '');
        return pDigits && (pDigits.includes(digitsOnly) || digitsOnly.includes(pDigits));
      });
      if (!party) {
        const guestWithPhone = state.guests.find(g => {
          const gDigits = (g.phone || '').replace(/\D/g, '');
          return gDigits && (gDigits.includes(digitsOnly) || digitsOnly.includes(gDigits));
        });
        if (guestWithPhone) {
          party = state.parties.find(p => p.id === guestWithPhone.party_id);
        }
      }
    }

    if (!party && trimmed.length >= 3) {
      party = state.parties.find(p => p.primary_guest_name.toLowerCase().includes(trimmed));
    }

    if (!party) return null;
    const guests = state.guests.filter(g => g.party_id === party!.id);
    return { party, guests };
  }

  public static async submitPartyRsvp(payload: PartyRsvpSubmission): Promise<{
    party: Party;
    guests: Guest[];
    attendingCount: number;
    declinedCount: number;
    songRequestCreated?: SongRequest;
  }> {
    if (this.isSupabaseConfigured()) {
      try {
        const result = await SupabaseService.submitPartyRsvp(payload);
        return result;
      } catch (e) {
        console.warn('Supabase submitPartyRsvp error, applying local update:', e);
      }
    }

    // Local in-memory fallback
    const state = this.getState();
    let party = state.parties.find(
      p => p.id === payload.party_id ||
      (payload.invitation_code && p.invitation_code.toLowerCase() === payload.invitation_code.toLowerCase())
    );

    if (!party) throw new Error('Party not found for RSVP submission');

    let attendingCount = 0;
    let declinedCount = 0;

    this.updateState(s => {
      const pIdx = s.parties.findIndex(p => p.id === party!.id);
      if (pIdx !== -1) {
        s.parties[pIdx] = {
          ...s.parties[pIdx],
          contact_email: payload.contact_email || s.parties[pIdx].contact_email,
          contact_phone: payload.contact_phone || s.parties[pIdx].contact_phone,
          special_message: payload.special_message || s.parties[pIdx].special_message
        };
        party = s.parties[pIdx];
      }

      payload.guests.forEach(update => {
        const isNew = update.guest_id.startsWith('new-') || update.guest_id.startsWith('guest-new-');
        if (isNew) {
          if (update.rsvp_status === 'attending') attendingCount++;
          if (update.rsvp_status === 'declined') declinedCount++;
          s.guests.push({
            id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            party_id: party!.id,
            first_name: update.first_name || 'Guest',
            last_name: update.last_name || '',
            rsvp_status: update.rsvp_status,
            headcount: 1,
            dietary_restrictions: update.dietary_restrictions || [],
            dietary_notes: update.dietary_notes || undefined,
            is_primary_contact: false,
            relationship_tag: party!.relationship_tag || 'general',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          return;
        }

        const gIdx = s.guests.findIndex(g => g.id === update.guest_id && g.party_id === party!.id);
        if (gIdx !== -1) {
          if (update.rsvp_status === 'attending') attendingCount++;
          if (update.rsvp_status === 'declined') declinedCount++;

          s.guests[gIdx] = {
            ...s.guests[gIdx],
            first_name: update.first_name || s.guests[gIdx].first_name,
            last_name: update.last_name !== undefined ? update.last_name : s.guests[gIdx].last_name,
            rsvp_status: update.rsvp_status,
            dietary_restrictions: update.dietary_restrictions || [],
            dietary_notes: update.dietary_notes || undefined,
            updated_at: new Date().toISOString()
          };
        }
      });
    });

    const updatedGuests = this.getState().guests.filter(g => g.party_id === party!.id);
    return {
      party,
      guests: updatedGuests,
      attendingCount,
      declinedCount
    };
  }

  public static async submitRsvp(payload: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    rsvp_status: 'attending' | 'declined';
    headcount: number;
    dietary_restrictions?: string[];
    dietary_notes?: string;
    song_request?: string;
    notes?: string;
    relationship_tag?: TableHierarchy;
    plus_ones?: Array<{ name: string; dietary_restrictions?: string[]; dietary_notes?: string }>;
  }): Promise<{ party: Party; primaryGuest: Guest; plusOneGuests: Guest[] }> {
    const primaryName = `${payload.first_name} ${payload.last_name}`.trim();
    const guestNames = [primaryName, ...(payload.plus_ones || []).map(p => p.name)];

    const { party, guests } = await this.createParty({
      primary_guest_name: primaryName,
      contact_phone: payload.phone,
      contact_email: payload.email,
      total_invited: payload.headcount,
      guest_names: guestNames,
      relationship_tag: payload.relationship_tag || 'general',
      notes: payload.notes
    });

    const primaryGuest = guests[0];
    const plusOneGuests = guests.slice(1);

    await this.submitPartyRsvp({
      party_id: party.id,
      contact_email: payload.email,
      contact_phone: payload.phone,
      song_request: payload.song_request ? { song_title: payload.song_request } : undefined,
      guests: guests.map((g, idx) => ({
        guest_id: g.id,
        rsvp_status: payload.rsvp_status,
        dietary_restrictions: idx === 0 ? (payload.dietary_restrictions || []) : (payload.plus_ones?.[idx - 1]?.dietary_restrictions || []),
        dietary_notes: idx === 0 ? payload.dietary_notes : (payload.plus_ones?.[idx - 1]?.dietary_notes)
      }))
    });

    return { party, primaryGuest, plusOneGuests };
  }

  public static async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const updated = await SupabaseService.updateGuest(id, updates);
        if (updated) {
          this.updateState(s => {
            const idx = s.guests.findIndex(g => g.id === id);
            if (idx !== -1) s.guests[idx] = updated;
          });
          return updated;
        }
      } catch (e) {
        console.warn('Supabase updateGuest error, using local state:', e);
      }
    }

    let updated: Guest | null = null;
    this.updateState(s => {
      const idx = s.guests.findIndex(g => g.id === id);
      if (idx !== -1) {
        s.guests[idx] = { ...s.guests[idx], ...updates, updated_at: new Date().toISOString() };
        updated = s.guests[idx];
      }
    });
    return updated;
  }

  public static async deleteGuest(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        await SupabaseService.deleteGuest(id);
      } catch (e) {
        console.warn('Supabase deleteGuest error:', e);
      }
    }

    let deleted = false;
    this.updateState(s => {
      const initLen = s.guests.length;
      s.guests = s.guests.filter(g => g.id !== id);
      deleted = s.guests.length < initLen;
    });
    return deleted;
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
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.createParty(data);
      } catch (e) {
        console.warn('Supabase createParty error, falling back to local:', e);
      }
    }

    const now = new Date().toISOString();
    const partyId = `party-${Date.now()}`;
    const code = (
      data.invitation_code ||
      `${data.primary_guest_name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
    ).toUpperCase();

    const party: Party = {
      id: partyId,
      primary_guest_name: data.primary_guest_name,
      invitation_code: code,
      total_invited: data.total_invited || (data.guest_names?.length || 1),
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      notes: data.notes,
      created_at: now
    };

    const names = data.guest_names && data.guest_names.length > 0 ? data.guest_names : [data.primary_guest_name];
    const guests: Guest[] = names.map((fullName, idx) => {
      const parts = fullName.trim().split(' ');
      return {
        id: `guest-${Date.now()}-${idx}`,
        party_id: partyId,
        first_name: parts[0] || fullName,
        last_name: parts.slice(1).join(' '),
        rsvp_status: 'pending',
        headcount: 1,
        dietary_restrictions: [],
        table_id: null,
        is_primary_contact: idx === 0,
        relationship_tag: data.relationship_tag || 'general',
        created_at: now,
        updated_at: now
      };
    });

    this.updateState(s => {
      s.parties.push(party);
      s.guests.push(...guests);
    });

    return { party, guests };
  }

  public static async deleteParty(partyId: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.deleteParty(partyId);
      } catch (e) {
        console.warn('Supabase deleteParty error:', e);
      }
    }

    let deleted = false;
    this.updateState(s => {
      s.guests = s.guests.filter(g => g.party_id !== partyId);
      const initLen = s.parties.length;
      s.parties = s.parties.filter(p => p.id !== partyId);
      deleted = s.parties.length < initLen;
    });
    return deleted;
  }

  public static async updateParty(
    partyId: string,
    updates: Partial<Omit<Party, 'id' | 'created_at'>>
  ): Promise<Party> {
    if (this.isSupabaseConfigured()) {
      try {
        const updated = await SupabaseService.updateParty(partyId, updates);
        this.updateState(s => {
          const idx = s.parties.findIndex(p => p.id === partyId);
          if (idx !== -1) s.parties[idx] = { ...s.parties[idx], ...updates };
        });
        return updated;
      } catch (e) {
        console.warn('Supabase updateParty error, falling back to local:', e);
      }
    }

    let updated: Party | null = null;
    this.updateState(s => {
      const idx = s.parties.findIndex(p => p.id === partyId);
      if (idx !== -1) {
        s.parties[idx] = { ...s.parties[idx], ...updates };
        updated = s.parties[idx];
      }
    });

    if (!updated) throw new Error(`Party with id "${partyId}" not found`);
    return updated;
  }

  public static async bulkImportParties(rows: any[]): Promise<any> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.bulkImportParties(rows);
      } catch (e) {
        console.warn('Supabase bulkImportParties error:', e);
      }
    }

    let partiesCreated = 0;
    let guestsCreated = 0;
    for (const r of rows) {
      if (!r.primary_guest_name && !r.name) continue;
      await this.createParty({
        primary_guest_name: r.primary_guest_name || r.name,
        contact_phone: r.contact_phone || r.phone,
        contact_email: r.contact_email || r.email,
        guest_names: r.guest_names || r.guests,
        relationship_tag: r.relationship_tag || r.tag,
        notes: r.notes
      });
      partiesCreated++;
      guestsCreated += (r.guest_names || r.guests || [1]).length;
    }
    return { partiesCreated, guestsCreated };
  }

  // ==========================================
  // TABLES & SEATING
  // ==========================================

  public static async getTablesWithGuests(): Promise<Table[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const { tables } = await SupabaseService.getTablesWithGuests();
        this.updateState(s => { s.tables = tables; });
        return tables;
      } catch (e) {
        console.warn('Supabase getTablesWithGuests error:', e);
      }
    }

    const state = this.getState();
    return state.tables.map(table => {
      const seated = state.guests.filter(g => g.table_id === table.id);
      return {
        ...table,
        assigned_count: seated.length,
        guests: seated
      };
    });
  }

  public static async getBanquetTableMath(): Promise<any> {
    if (this.isSupabaseConfigured()) {
      try {
        const { math } = await SupabaseService.getTablesWithGuests();
        return math;
      } catch (e) {
        console.warn('Supabase getBanquetTableMath error:', e);
      }
    }

    const state = this.getState();
    const guests = state.guests;
    const attending = guests.filter(g => g.rsvp_status === 'attending');
    const confirmedHeadcount = attending.reduce((acc, g) => acc + (g.headcount || 1), 0);
    const totalCapacity = state.tables.reduce((acc, t) => acc + t.capacity, 0);
    const seatedCount = guests.filter(g => g.table_id && g.rsvp_status === 'attending').length;
    const emptySeats = Math.max(0, totalCapacity - seatedCount);
    const fillRate = totalCapacity > 0 ? Math.round((seatedCount / totalCapacity) * 100) : 0;

    return {
      confirmed_headcount: confirmedHeadcount,
      required_10_top_tables: Math.ceil(confirmedHeadcount / 10),
      empty_seats_in_active_tables: emptySeats,
      fill_rate_percent: fillRate,
      active_tables_count: state.tables.length,
      assigned_guests_count: seatedCount,
      unassigned_attending_guests_count: attending.length - seatedCount
    };
  }

  public static async assignGuestToTable(guestId: string, tableId: string | null): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        await SupabaseService.assignGuestToTable(guestId, tableId);
      } catch (e) {
        console.warn('Supabase assignGuestToTable error:', e);
      }
    }

    let success = false;
    this.updateState(s => {
      const guest = s.guests.find(g => g.id === guestId);
      if (guest) {
        guest.table_id = tableId;
        guest.updated_at = new Date().toISOString();
        success = true;
      }
    });
    return success;
  }

  public static async autoAssignGuestsByHierarchy(): Promise<{ assignedCount: number; tables: Table[] }> {
    const guests = await this.getGuests();
    const tables = await this.getTablesWithGuests();
    let assignedCount = 0;

    const unassigned = guests.filter(g => g.rsvp_status === 'attending' && !g.table_id);
    for (const guest of unassigned) {
      const targetTable = tables.find(t => (t.assigned_count || 0) < t.capacity);
      if (targetTable) {
        await this.assignGuestToTable(guest.id, targetTable.id);
        targetTable.assigned_count = (targetTable.assigned_count || 0) + 1;
        assignedCount++;
      }
    }

    const updatedTables = await this.getTablesWithGuests();
    return { assignedCount, tables: updatedTables };
  }

  public static async addTable(name: string, hierarchy_tag: TableHierarchy = 'general', capacity: number = 10): Promise<Table> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.addTable(name, hierarchy_tag, capacity);
      } catch (e) {
        console.warn('Supabase addTable error:', e);
      }
    }

    const state = this.getState();
    const nextNumber = state.tables.length + 1;
    const newTable: Table = {
      id: `table-${Date.now()}`,
      table_number: nextNumber,
      name: name || `Bàn ${nextNumber}: Tiệc Cưới`,
      capacity,
      hierarchy_tag,
      stage_position: 'center',
      assigned_count: 0,
      guests: []
    };

    this.updateState(s => { s.tables.push(newTable); });
    return newTable;
  }

  public static async deleteTable(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.deleteTable(id);
      } catch (e) {
        console.warn('Supabase deleteTable error:', e);
      }
    }

    let deleted = false;
    this.updateState(s => {
      s.guests.forEach(g => { if (g.table_id === id) g.table_id = null; });
      const initLen = s.tables.length;
      s.tables = s.tables.filter(t => t.id !== id);
      deleted = s.tables.length < initLen;
    });
    return deleted;
  }

  // ==========================================
  // BUDGET & EXPENSES
  // ==========================================

  public static async getExpenses(): Promise<Expense[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const expenses = await SupabaseService.getExpenses();
        this.updateState(s => { s.expenses = expenses; });
        return expenses;
      } catch (e) {
        console.warn('Supabase getExpenses error:', e);
      }
    }
    return this.getState().expenses;
  }

  public static async getBudgetMetrics(): Promise<any> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.getBudgetMetrics();
      } catch (e) {
        console.warn('Supabase getBudgetMetrics error:', e);
      }
    }

    const settings = await this.getSettings();
    const expenses = this.getState().expenses;
    const totalEstimated = expenses.reduce((acc, e) => acc + Number(e.estimated_cost || 0), 0);
    const totalInvoiced = expenses.reduce((acc, e) => acc + Number(e.actual_invoiced || 0), 0);
    const totalDepositPaid = expenses.reduce((acc, e) => acc + Number(e.deposit_paid || 0), 0);
    const remainingBalance = expenses.reduce((acc, e) => acc + Number(e.remaining_balance || 0), 0);

    return {
      target_budget_cap: settings.target_budget_cap || 35000,
      total_budget_estimated: totalEstimated,
      total_invoiced: totalInvoiced,
      total_deposit_paid: totalDepositPaid,
      remaining_balance_due: remainingBalance,
      due_within_7_days: [],
      due_within_14_days: [],
      due_within_30_days: []
    };
  }

  // ==========================================
  // WEDDING SETTINGS & SETUP QUESTIONNAIRE
  // ==========================================

  public static async getSettings(): Promise<WeddingSettings> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data } = await supabase
            .from('agent_logs')
            .select('*')
            .eq('action', 'wedding_settings')
            .order('id', { ascending: false })
            .limit(1);
          if (data && data.length > 0 && data[0].details) {
            const parsed = data[0].details as WeddingSettings;
            this.updateState(s => { s.settings = parsed; });
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Supabase getSettings error, using local state:', e);
      }
    }

    const state = this.getState();
    if (state.settings) {
      return state.settings;
    }

    return defaultWeddingSettings;
  }

  public static async saveSettings(settings: WeddingSettings): Promise<{
    settings: WeddingSettings;
    expenses: Expense[];
    metrics: any;
  }> {
    const supabase = createAdminClient();

    // 1. Persist settings to Supabase
    if (supabase) {
      try {
        await supabase.from('agent_logs').insert({
          agent: 'SetupWizard',
          action: 'wedding_settings',
          details: settings
        });
      } catch (e) {
        console.warn('Could not save settings log to Supabase:', e);
      }
    }

    // 2. Persist to local state
    this.updateState(s => {
      s.settings = settings;
    });

    // 3. Clear old expenses and sync true setup expenses
    if (supabase) {
      try {
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Error clearing expenses for setup sync:', e);
      }
    }
    this.updateState(s => { s.expenses = []; });

    // 4. Generate real expense items for each category
    const categoryEntries = Object.entries(settings.categories);
    const newExpenses: Expense[] = [];

    for (let i = 0; i < categoryEntries.length; i++) {
      const [catKey, catData] = categoryEntries[i];
      if (catData.estimated_cost > 0 || catData.deposit_paid > 0) {
        const exp: Expense = {
          id: `exp-setup-${i + 1}-${Date.now()}`,
          category: catKey as any,
          vendor_name: catData.vendor_name || 'Vendor',
          item_description: catData.notes || `${catKey} commitment`,
          estimated_cost: Number(catData.estimated_cost || 0),
          actual_invoiced: Number(catData.estimated_cost || 0),
          deposit_paid: Number(catData.deposit_paid || 0),
          remaining_balance: Math.max(0, Number(catData.estimated_cost || 0) - Number(catData.deposit_paid || 0)),
          payment_due_date: catData.payment_due_date || settings.wedding_date,
          payment_status: Number(catData.deposit_paid || 0) >= Number(catData.estimated_cost || 0) ? 'paid' : 'pending',
          notes: catData.notes,
          created_at: new Date().toISOString()
        };
        newExpenses.push(exp);
      }
    }

    if (newExpenses.length > 0) {
      if (supabase) {
        try {
          await supabase.from('expenses').insert(newExpenses);
        } catch (e) {
          console.warn('Error inserting setup expenses into Supabase:', e);
        }
      }
      this.updateState(s => { s.expenses = newExpenses; });
    }

    const metrics = await this.getBudgetMetrics();
    return { settings, expenses: newExpenses, metrics };
  }

  public static async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.addExpense(expense);
      } catch (e) {
        console.warn('Supabase addExpense error:', e);
      }
    }

    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.updateState(s => { s.expenses.push(newExp); });
    return newExp;
  }

  public static async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const updated = await SupabaseService.updateExpense(id, updates);
        if (updated) {
          this.updateState(s => {
            const idx = s.expenses.findIndex(e => e.id === id);
            if (idx !== -1) s.expenses[idx] = updated;
          });
          return updated;
        }
      } catch (e) {
        console.warn('Supabase updateExpense error:', e);
      }
    }

    let updated: Expense | null = null;
    this.updateState(s => {
      const idx = s.expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        s.expenses[idx] = { ...s.expenses[idx], ...updates };
        updated = s.expenses[idx];
      }
    });
    return updated;
  }

  public static async deleteExpense(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.deleteExpense(id);
      } catch (e) {
        console.warn('Supabase deleteExpense error:', e);
      }
    }

    let deleted = false;
    this.updateState(s => {
      const initLen = s.expenses.length;
      s.expenses = s.expenses.filter(e => e.id !== id);
      deleted = s.expenses.length < initLen;
    });
    return deleted;
  }

  // ==========================================
  // MILESTONES & TIMELINE
  // ==========================================

  public static async getMilestones(): Promise<Milestone[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const ms = await SupabaseService.getMilestones();
        this.updateState(s => { s.milestones = ms; });
        return ms;
      } catch (e) {
        console.warn('Supabase getMilestones error:', e);
      }
    }
    return this.getState().milestones;
  }

  public static async addMilestone(milestone: Omit<Milestone, 'id' | 'updated_at'>): Promise<Milestone> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.addMilestone(milestone);
      } catch (e) {
        console.warn('Supabase addMilestone error:', e);
      }
    }

    const newMs: Milestone = {
      ...milestone,
      id: `ms-${Date.now()}`,
      updated_at: new Date().toISOString()
    };
    this.updateState(s => { s.milestones.push(newMs); });
    return newMs;
  }

  public static async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const updated = await SupabaseService.updateMilestone(id, updates);
        if (updated) {
          this.updateState(s => {
            const idx = s.milestones.findIndex(m => m.id === id);
            if (idx !== -1) s.milestones[idx] = updated;
          });
          return updated;
        }
      } catch (e) {
        console.warn('Supabase updateMilestone error:', e);
      }
    }

    let updated: Milestone | null = null;
    this.updateState(s => {
      const idx = s.milestones.findIndex(m => m.id === id);
      if (idx !== -1) {
        s.milestones[idx] = { ...s.milestones[idx], ...updates, updated_at: new Date().toISOString() };
        updated = s.milestones[idx];
      }
    });
    return updated;
  }

  // ==========================================
  // DJ QUEUE
  // ==========================================

  public static async getSongRequests(): Promise<SongRequest[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const songs = await SupabaseService.getSongRequests();
        this.updateState(s => { s.song_requests = songs; });
        return songs;
      } catch (e) {
        console.warn('Supabase getSongRequests error:', e);
      }
    }
    return this.getState().song_requests;
  }

  public static async addSongRequest(song: Omit<SongRequest, 'id' | 'created_at'>): Promise<SongRequest> {
    if (this.isSupabaseConfigured()) {
      try {
        return await SupabaseService.addSongRequest(song);
      } catch (e) {
        console.warn('Supabase addSongRequest error:', e);
      }
    }

    const newSong: SongRequest = {
      ...song,
      id: `song-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.updateState(s => { s.song_requests.push(newSong); });
    return newSong;
  }

  public static async updateSongRequest(id: string, updates: Partial<SongRequest>): Promise<SongRequest | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const updated = await SupabaseService.updateSongRequest(id, updates);
        if (updated) {
          this.updateState(s => {
            const idx = s.song_requests.findIndex(sng => sng.id === id);
            if (idx !== -1) s.song_requests[idx] = updated;
          });
          return updated;
        }
      } catch (e) {
        console.warn('Supabase updateSongRequest error:', e);
      }
    }

    let updated: SongRequest | null = null;
    this.updateState(s => {
      const idx = s.song_requests.findIndex(sng => sng.id === id);
      if (idx !== -1) {
        s.song_requests[idx] = { ...s.song_requests[idx], ...updates };
        updated = s.song_requests[idx];
      }
    });
    return updated;
  }

  // ==========================================
  // VENUES & AGENTS
  // ==========================================

  public static getSourcedVenues(): VenueSourcingResult[] {
    return this.getState().venues;
  }

  public static getAgentLogs() {
    return this.getState().agent_logs;
  }

  public static addAgentLog(agent: string, action: string, details?: any) {
    this.updateState(state => {
      state.agent_logs.push({
        timestamp: new Date().toISOString(),
        agent,
        action,
        details
      });
    });
  }

  public static async generateDailyBriefing(): Promise<DailyBriefing> {
    const guests = await this.getGuests();
    const parties = await this.getParties();
    const milestones = await this.getMilestones();
    const banquetMath = await this.getBanquetTableMath();
    const budget = await this.getBudgetMetrics();

    const totalInvited = guests.length;
    const confirmed = guests.filter(g => g.rsvp_status === 'attending').length;
    const declined = guests.filter(g => g.rsvp_status === 'declined').length;
    const pending = guests.filter(g => g.rsvp_status === 'pending').length;

    const weddingDate = new Date('2026-12-20');
    const today = new Date('2026-08-30');
    const daysUntil = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const overdueMs = milestones.filter(m => m.status !== 'completed' && new Date(m.target_date) < today);
    const upcomingMs = milestones.filter(m => m.status !== 'completed' && new Date(m.target_date) >= today);
    const pendingGuests = guests.filter(g => g.rsvp_status === 'pending');

    return {
      date: '2026-08-30',
      days_until_wedding: daysUntil,
      rsvp_summary: {
        total_invited: totalInvited,
        confirmed_attending: confirmed,
        declined: declined,
        pending: pending,
        total_parties: parties.length
      },
      banquet_math: {
        confirmed_headcount: banquetMath.confirmed_headcount,
        required_10_top_tables: banquetMath.required_10_top_tables,
        empty_seats: banquetMath.empty_seats || banquetMath.empty_seats_in_active_tables || 0,
        fill_rate_percent: banquetMath.fill_rate_percent
      },
      financial_alerts: {
        total_budget: budget.total_estimated || budget.total_budget_estimated || 0,
        total_invoiced: budget.total_invoiced || 0,
        total_paid: budget.total_paid || budget.total_deposit_paid || 0,
        remaining_balance: budget.remaining_balance || budget.remaining_balance_due || 0,
        due_within_7_days: budget.due_within_7_days || [],
        due_within_14_days: budget.due_within_14_days || [],
        due_within_30_days: budget.due_within_30_days || []
      },
      critical_milestones: {
        overdue: overdueMs,
        upcoming_sprint: upcomingMs
      },
      agent_actions_taken: this.getAgentLogs().slice(-5).map(l => `[${l.agent}] ${l.action}`),
      chaser_recommendations: {
        pending_guest_count: pendingGuests.length,
        t21_candidates: pendingGuests.slice(0, 2),
        t7_candidates: pendingGuests.slice(2)
      }
    };
  }
}
