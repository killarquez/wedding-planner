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
  RsvpStatus,
  TableHierarchy,
  PartyRsvpSubmission,
  GuestRsvpUpdate
} from './types';
import {
  initialGuests,
  initialParties,
  initialTables,
  initialExpenses,
  initialMilestones,
  initialSongRequests,
  initialSourcedVenues
} from './seedData';
import { createAdminClient } from './supabase/admin';

interface DatabaseState {
  parties: Party[];
  guests: Guest[];
  tables: Table[];
  expenses: Expense[];
  milestones: Milestone[];
  song_requests: SongRequest[];
  venues: VenueSourcingResult[];
  agent_logs: Array<{ timestamp: string; agent: string; action: string; details?: any }>;
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
    parties: [...initialParties],
    guests: [...initialGuests],
    tables: [...initialTables],
    expenses: [...initialExpenses],
    milestones: [...initialMilestones],
    song_requests: [...initialSongRequests],
    venues: [...initialSourcedVenues],
    agent_logs: [
      {
        timestamp: new Date().toISOString(),
        agent: 'System',
        action: 'Database initialized with wedding celebration seed data'
      }
    ]
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

// Helper DB API Singleton with Supabase synchronization
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

  // Check if Supabase connection is available
  public static isSupabaseConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  // Sync state from Supabase if connected
  public static async syncFromSupabase(): Promise<boolean> {
    const supabase = createAdminClient();
    if (!supabase) return false;

    try {
      const [
        { data: parties },
        { data: guests },
        { data: tables },
        { data: expenses },
        { data: milestones },
        { data: songs },
        { data: venues }
      ] = await Promise.all([
        supabase.from('parties').select('*'),
        supabase.from('guests').select('*'),
        supabase.from('tables').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('milestones').select('*'),
        supabase.from('song_requests').select('*'),
        supabase.from('venues').select('*')
      ]);

      if (parties && guests && tables) {
        this.updateState(state => {
          if (parties.length > 0) state.parties = parties as Party[];
          if (guests.length > 0) state.guests = guests as Guest[];
          if (tables.length > 0) state.tables = tables as Table[];
          if (expenses && expenses.length > 0) state.expenses = expenses as Expense[];
          if (milestones && milestones.length > 0) state.milestones = milestones as Milestone[];
          if (songs && songs.length > 0) state.song_requests = songs as SongRequest[];
          if (venues && venues.length > 0) state.venues = venues as VenueSourcingResult[];
        });
        return true;
      }
    } catch (err) {
      console.warn('Supabase sync error, using local state:', err);
    }
    return false;
  }

  // --- Reset / Seed ---
  public static resetToSeed(): DatabaseState {
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

    // Sync seed to Supabase if configured
    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('guests').delete().neq('id', '0');
          await supabase.from('parties').delete().neq('id', '0');
          await supabase.from('tables').delete().neq('id', '0');
          await supabase.from('expenses').delete().neq('id', '0');
          await supabase.from('milestones').delete().neq('id', '0');
          await supabase.from('song_requests').delete().neq('id', '0');
          await supabase.from('venues').delete().neq('id', '0');

          await supabase.from('parties').insert(initialParties);
          await supabase.from('tables').insert(initialTables);
          await supabase.from('guests').insert(initialGuests);
          await supabase.from('expenses').insert(initialExpenses);
          await supabase.from('milestones').insert(initialMilestones);
          await supabase.from('song_requests').insert(initialSongRequests);
          await supabase.from('venues').insert(initialSourcedVenues);
        } catch (e) {
          console.warn('Could not sync seed to Supabase:', e);
        }
      })();
    }

    return fresh;
  }

  // --- Guests & Parties ---
  public static getGuests(): Guest[] {
    const state = this.getState();
    return state.guests;
  }

  public static getParties(): Party[] {
    const state = this.getState();
    return state.parties;
  }

  public static getPartyByCodeOrPhone(query: string): { party: Party; guests: Guest[] } | null {
    if (!query || !query.trim()) return null;
    const state = this.getState();
    const trimmed = query.trim().toLowerCase();
    const digitsOnly = query.replace(/\D/g, '');

    // 1. Match invitation code exactly (case-insensitive)
    let party = state.parties.find(p => p.invitation_code.trim().toLowerCase() === trimmed);

    // 2. Match party ID exactly
    if (!party) {
      party = state.parties.find(p => p.id.toLowerCase() === trimmed);
    }

    // 3. Match phone number (if 7+ digits provided)
    if (!party && digitsOnly.length >= 7) {
      party = state.parties.find(p => {
        const partyDigits = (p.contact_phone || '').replace(/\D/g, '');
        return partyDigits && (partyDigits.includes(digitsOnly) || digitsOnly.includes(partyDigits));
      });

      // Also check guests' phone numbers
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

    // 4. Fuzzy match by Primary Guest Name (if query is at least 3 letters)
    if (!party && trimmed.length >= 3) {
      party = state.parties.find(p => p.primary_guest_name.toLowerCase().includes(trimmed));
      if (!party) {
        const guestWithName = state.guests.find(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(trimmed));
        if (guestWithName) {
          party = state.parties.find(p => p.id === guestWithName.party_id);
        }
      }
    }

    if (!party) return null;

    const guests = state.guests.filter(g => g.party_id === party!.id);
    return { party, guests };
  }

  public static getPartiesWithGuests(): Array<Party & { guests: Guest[]; confirmed_count: number }> {
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

  public static submitPartyRsvp(payload: PartyRsvpSubmission): {
    party: Party;
    guests: Guest[];
    attendingCount: number;
    declinedCount: number;
    songRequestCreated?: SongRequest;
  } {
    const state = this.getState();
    let party = state.parties.find(
      p => p.id === payload.party_id || 
      (payload.invitation_code && p.invitation_code.toLowerCase() === payload.invitation_code.toLowerCase())
    );

    if (!party) {
      throw new Error('Party not found for RSVP submission');
    }

    let songRequestCreated: SongRequest | undefined;
    let attendingCount = 0;
    let declinedCount = 0;

    this.updateState(s => {
      // 1. Update party record
      const pIdx = s.parties.findIndex(p => p.id === party!.id);
      if (pIdx !== -1) {
        s.parties[pIdx] = {
          ...s.parties[pIdx],
          contact_email: payload.contact_email || s.parties[pIdx].contact_email,
          contact_phone: payload.contact_phone || s.parties[pIdx].contact_phone,
          special_message: payload.special_message || s.parties[pIdx].special_message,
        };
        party = s.parties[pIdx];
      }

      // 2. Update individual guest records
      payload.guests.forEach(update => {
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

      // 3. Insert song request if provided
      if (payload.song_request?.song_title && payload.song_request.song_title.trim()) {
        songRequestCreated = {
          id: `song-${Date.now()}`,
          guest_name: party!.primary_guest_name,
          song_title: payload.song_request.song_title.trim(),
          artist: payload.song_request.artist?.trim() || 'Guest Request',
          genre: 'other',
          notes: `Requested by ${party!.primary_guest_name} during personalized party RSVP`,
          status: 'queued',
          created_at: new Date().toISOString()
        };
        s.song_requests.push(songRequestCreated);
      }

      // 4. Log to agent_logs
      s.agent_logs.push({
        timestamp: new Date().toISOString(),
        agent: 'RSVP Engine',
        action: `Personalized RSVP submitted for ${party!.primary_guest_name}: ${attendingCount} attending, ${declinedCount} declined`
      });
    });

    // Supabase sync in background if connected
    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('parties').update({
            contact_email: party!.contact_email,
            contact_phone: party!.contact_phone,
            notes: party!.special_message ? `Special Message: ${party!.special_message}` : party!.notes
          }).eq('id', party!.id);

          for (const update of payload.guests) {
            await supabase.from('guests').update({
              rsvp_status: update.rsvp_status,
              dietary_restrictions: update.dietary_restrictions || [],
              dietary_notes: update.dietary_notes || null,
              updated_at: new Date().toISOString()
            }).eq('id', update.guest_id);
          }

          if (songRequestCreated) {
            await supabase.from('song_requests').insert(songRequestCreated);
          }
        } catch (e) {
          console.warn('Supabase party RSVP sync error:', e);
        }
      })();
    }

    const updatedGuests = this.getState().guests.filter(g => g.party_id === party!.id);
    return { party: party!, guests: updatedGuests, attendingCount, declinedCount, songRequestCreated };
  }

  public static createParty(data: {
    primary_guest_name: string;
    contact_phone?: string;
    contact_email?: string;
    total_invited?: number;
    invitation_code?: string;
    guest_names?: string[];
    relationship_tag?: TableHierarchy;
    notes?: string;
  }): { party: Party; guests: Guest[] } {
    const partyId = `party-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const guestNames = data.guest_names && data.guest_names.length > 0 
      ? data.guest_names 
      : [data.primary_guest_name];
    const totalInvited = data.total_invited || guestNames.length;
    const relTag = data.relationship_tag || 'general';

    // Generate code if not provided
    const codeBase = data.primary_guest_name.split(' ').pop()?.toUpperCase().replace(/[^A-Z]/g, '') || 'GUEST';
    const invitationCode = data.invitation_code || `INV-${codeBase}-${Math.floor(100 + Math.random() * 900)}`;

    const newParty: Party = {
      id: partyId,
      primary_guest_name: data.primary_guest_name.trim(),
      invitation_code: invitationCode,
      total_invited: totalInvited,
      contact_email: data.contact_email?.trim() || undefined,
      contact_phone: data.contact_phone?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      created_at: new Date().toISOString()
    };

    const newGuests: Guest[] = guestNames.map((name, idx) => {
      const parts = name.trim().split(' ');
      const firstName = parts.slice(0, -1).join(' ') || name.trim();
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
      return {
        id: `guest-${Date.now()}-${idx + 1}-${Math.floor(Math.random() * 1000)}`,
        party_id: partyId,
        first_name: firstName,
        last_name: lastName,
        phone: idx === 0 ? data.contact_phone?.trim() : undefined,
        email: idx === 0 ? data.contact_email?.trim() : undefined,
        rsvp_status: 'pending',
        headcount: 1,
        dietary_restrictions: [],
        table_id: null,
        is_primary_contact: idx === 0,
        relationship_tag: relTag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    this.updateState(s => {
      s.parties.push(newParty);
      s.guests.push(...newGuests);
      s.agent_logs.push({
        timestamp: new Date().toISOString(),
        agent: 'Party Manager',
        action: `Created new party ${newParty.primary_guest_name} with ${newGuests.length} guests (Code: ${newParty.invitation_code})`
      });
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('parties').insert(newParty);
          await supabase.from('guests').insert(newGuests);
        } catch (e) {
          console.warn('Supabase createParty error:', e);
        }
      })();
    }

    return { party: newParty, guests: newGuests };
  }

  public static bulkImportParties(rows: Array<{
    primary_guest_name: string;
    contact_phone?: string;
    contact_email?: string;
    guest_names?: string[];
    relationship_tag?: TableHierarchy;
    notes?: string;
  }>): { partiesCreated: number; guestsCreated: number } {
    let partiesCreated = 0;
    let guestsCreated = 0;

    for (const row of rows) {
      if (!row.primary_guest_name || !row.primary_guest_name.trim()) continue;
      this.createParty(row);
      partiesCreated++;
      guestsCreated += (row.guest_names && row.guest_names.length > 0 ? row.guest_names.length : 1);
    }

    return { partiesCreated, guestsCreated };
  }

  public static deleteParty(partyId: string): boolean {
    let deleted = false;
    this.updateState(s => {
      const prevCount = s.parties.length;
      s.parties = s.parties.filter(p => p.id !== partyId);
      s.guests = s.guests.filter(g => g.party_id !== partyId);
      deleted = s.parties.length < prevCount;
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('guests').delete().eq('party_id', partyId);
          await supabase.from('parties').delete().eq('id', partyId);
        } catch (e) {
          console.warn('Supabase deleteParty error:', e);
        }
      })();
    }

    return deleted;
  }

  public static submitRsvp(payload: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    rsvp_status: RsvpStatus;
    headcount: number;
    dietary_restrictions: string[];
    dietary_notes?: string;
    song_request?: string;
    notes?: string;
    relationship_tag?: TableHierarchy;
    plus_ones?: Array<{ name: string; dietary_restrictions?: string[]; dietary_notes?: string }>;
  }): { party: Party; primaryGuest: Guest; plusOneGuests: Guest[] } {
    const partyId = `party-${Date.now()}`;
    const primaryGuestId = `guest-${Date.now()}-1`;
    const relTag: TableHierarchy = payload.relationship_tag || 'general';

    const party: Party = {
      id: partyId,
      primary_guest_name: `${payload.first_name} ${payload.last_name}`.trim(),
      invitation_code: `RSVP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      total_invited: payload.headcount,
      contact_email: payload.email,
      contact_phone: payload.phone,
      notes: payload.notes,
      created_at: new Date().toISOString()
    };

    const primaryGuest: Guest = {
      id: primaryGuestId,
      party_id: partyId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      rsvp_status: payload.rsvp_status,
      headcount: 1,
      dietary_restrictions: payload.dietary_restrictions || [],
      dietary_notes: payload.dietary_notes,
      song_request: payload.song_request,
      notes: payload.notes,
      table_id: null,
      is_primary_contact: true,
      relationship_tag: relTag,
      plus_one_names: payload.plus_ones?.map(p => p.name) || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const plusOneGuests: Guest[] = (payload.plus_ones || []).map((p, idx) => {
      const parts = p.name.trim().split(' ');
      const firstName = parts.slice(0, -1).join(' ') || p.name;
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
      return {
        id: `guest-${Date.now()}-${idx + 2}`,
        party_id: partyId,
        first_name: firstName,
        last_name: lastName,
        rsvp_status: payload.rsvp_status,
        headcount: 1,
        dietary_restrictions: p.dietary_restrictions || [],
        dietary_notes: p.dietary_notes,
        table_id: null,
        is_primary_contact: false,
        relationship_tag: relTag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    this.updateState(state => {
      state.parties.push(party);
      state.guests.push(primaryGuest, ...plusOneGuests);

      // Append song request if present
      if (payload.song_request && payload.song_request.trim()) {
        state.song_requests.push({
          id: `song-${Date.now()}`,
          guest_name: `${payload.first_name} ${payload.last_name}`,
          song_title: payload.song_request,
          artist: 'Guest Requested',
          genre: 'other',
          notes: `Requested via RSVP form by ${payload.first_name}`,
          status: 'queued',
          created_at: new Date().toISOString()
        });
      }

      state.agent_logs.push({
        timestamp: new Date().toISOString(),
        agent: 'RSVP Agent',
        action: `New RSVP processed for ${party.primary_guest_name} (${payload.rsvp_status.toUpperCase()}) with ${payload.headcount} guest(s)`
      });
    });

    // Asynchronously push to Supabase if connected
    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('parties').insert(party);
          await supabase.from('guests').insert([primaryGuest, ...plusOneGuests]);
          if (payload.song_request && payload.song_request.trim()) {
            await supabase.from('song_requests').insert({
              id: `song-${Date.now()}`,
              guest_name: `${payload.first_name} ${payload.last_name}`,
              song_title: payload.song_request,
              artist: 'Guest Requested',
              genre: 'other',
              notes: `Requested via RSVP form by ${payload.first_name}`,
              status: 'queued',
              created_at: new Date().toISOString()
            });
          }
          await supabase.from('agent_logs').insert({
            agent: 'RSVP Agent',
            action: `New RSVP processed for ${party.primary_guest_name} (${payload.rsvp_status.toUpperCase()})`
          });
        } catch (e) {
          console.warn('Supabase RSVP insert error:', e);
        }
      })();
    }

    return { party, primaryGuest, plusOneGuests };
  }

  public static updateGuest(id: string, updates: Partial<Guest>): Guest | null {
    let updated: Guest | null = null;
    this.updateState(state => {
      const index = state.guests.findIndex(g => g.id === id);
      if (index !== -1) {
        state.guests[index] = {
          ...state.guests[index],
          ...updates,
          updated_at: new Date().toISOString()
        };
        updated = state.guests[index];
      }
    });

    const supabase = createAdminClient();
    if (supabase && updated) {
      (async () => {
        try {
          await supabase.from('guests').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase guest update error:', e);
        }
      })();
    }

    return updated;
  }

  public static deleteGuest(id: string): boolean {
    let deleted = false;
    this.updateState(state => {
      const initialLen = state.guests.length;
      state.guests = state.guests.filter(g => g.id !== id);
      deleted = state.guests.length < initialLen;
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('guests').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase guest delete error:', e);
        }
      })();
    }

    return deleted;
  }

  public static assignGuestToTable(guestId: string, tableId: string | null): boolean {
    let success = false;
    this.updateState(state => {
      const guest = state.guests.find(g => g.id === guestId);
      if (guest) {
        guest.table_id = tableId;
        guest.updated_at = new Date().toISOString();
        success = true;
      }
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('guests').update({ table_id: tableId, updated_at: new Date().toISOString() }).eq('id', guestId);
        } catch (e) {
          console.warn('Supabase table assign error:', e);
        }
      })();
    }

    return success;
  }

  public static autoAssignGuestsByHierarchy(): { assignedCount: number; tables: Table[] } {
    let assignedCount = 0;
    this.updateState(state => {
      const unassigned = state.guests.filter(g => g.rsvp_status === 'attending' && !g.table_id);
      
      for (const guest of unassigned) {
        const eligibleTables = state.tables.filter(t => {
          const currentCount = state.guests.filter(g => g.table_id === t.id && g.rsvp_status === 'attending').length;
          return currentCount < t.capacity && (t.hierarchy_tag === guest.relationship_tag || t.hierarchy_tag === 'general');
        });

        const targetTable = eligibleTables[0] || state.tables.find(t => {
          const currentCount = state.guests.filter(g => g.table_id === t.id && g.rsvp_status === 'attending').length;
          return currentCount < t.capacity;
        });

        if (targetTable) {
          guest.table_id = targetTable.id;
          guest.updated_at = new Date().toISOString();
          assignedCount++;
        }
      }

      state.agent_logs.push({
        timestamp: new Date().toISOString(),
        agent: 'Seating Agent',
        action: `Smart auto-assigned ${assignedCount} confirmed guests based on cultural hierarchy tags`
      });
    });

    const tables = this.getTablesWithGuests();
    return { assignedCount, tables };
  }

  // --- Tables & Seating Math ---
  public static getTablesWithGuests(): Table[] {
    const state = this.getState();
    return state.tables.map(table => {
      const assignedGuests = state.guests.filter(
        g => g.table_id === table.id && g.rsvp_status === 'attending'
      );
      return {
        ...table,
        assigned_count: assignedGuests.length,
        guests: assignedGuests
      };
    });
  }

  public static addTable(name: string, hierarchyTag: TableHierarchy = 'general', capacity: number = 10): Table {
    const state = this.getState();
    const nextNumber = state.tables.length + 1;
    const newTable: Table = {
      id: `table-${Date.now()}`,
      table_number: nextNumber,
      name: name || `Bàn ${nextNumber}: Banquet Table`,
      capacity: capacity || 10,
      hierarchy_tag: hierarchyTag,
      stage_position: 'center'
    };

    this.updateState(s => {
      s.tables.push(newTable);
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('tables').insert(newTable);
        } catch (e) {
          console.warn('Supabase addTable error:', e);
        }
      })();
    }

    return newTable;
  }

  public static deleteTable(tableId: string): boolean {
    let removed = false;
    this.updateState(state => {
      state.guests.forEach(g => {
        if (g.table_id === tableId) {
          g.table_id = null;
        }
      });
      const len = state.tables.length;
      state.tables = state.tables.filter(t => t.id !== tableId);
      removed = state.tables.length < len;
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('tables').delete().eq('id', tableId);
        } catch (e) {
          console.warn('Supabase deleteTable error:', e);
        }
      })();
    }

    return removed;
  }

  public static getBanquetTableMath() {
    const state = this.getState();
    const confirmedCount = state.guests.filter(g => g.rsvp_status === 'attending').length;
    const standardTableSize = 10;
    
    const requiredTables = confirmedCount > 0 ? Math.ceil(confirmedCount / standardTableSize) : 0;
    const totalCapacityConfigured = state.tables.reduce((sum, t) => sum + t.capacity, 0);
    const assignedCount = state.guests.filter(g => g.rsvp_status === 'attending' && g.table_id).length;
    const unassignedCount = confirmedCount - assignedCount;
    const emptySeatsInActiveTables = Math.max(0, requiredTables * standardTableSize - confirmedCount);
    const fillRatePercent = totalCapacityConfigured > 0 ? Math.round((confirmedCount / totalCapacityConfigured) * 100) : 0;

    return {
      confirmed_headcount: confirmedCount,
      required_10_top_tables: requiredTables,
      total_tables_configured: state.tables.length,
      total_capacity_configured: totalCapacityConfigured,
      assigned_count: assignedCount,
      unassigned_count: unassignedCount,
      empty_seats_in_active_tables: emptySeatsInActiveTables,
      fill_rate_percent: fillRatePercent
    };
  }

  // --- Expenses & Budget ---
  public static getExpenses(): Expense[] {
    return this.getState().expenses;
  }

  public static addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'remaining_balance'>): Expense {
    const remaining = Math.max(0, (expense.actual_invoiced || expense.estimated_cost) - (expense.deposit_paid || 0));
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      remaining_balance: remaining,
      created_at: new Date().toISOString()
    };

    this.updateState(state => {
      state.expenses.push(newExp);
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('expenses').insert(newExp);
        } catch (e) {
          console.warn('Supabase addExpense error:', e);
        }
      })();
    }

    return newExp;
  }

  public static updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    let updated: Expense | null = null;
    this.updateState(state => {
      const idx = state.expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        const current = state.expenses[idx];
        const next = { ...current, ...updates };
        next.remaining_balance = Math.max(0, (next.actual_invoiced || next.estimated_cost) - (next.deposit_paid || 0));
        state.expenses[idx] = next;
        updated = next;
      }
    });

    const supabase = createAdminClient();
    if (supabase && updated) {
      (async () => {
        try {
          await supabase.from('expenses').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateExpense error:', e);
        }
      })();
    }

    return updated;
  }

  public static deleteExpense(id: string): boolean {
    let deleted = false;
    this.updateState(state => {
      const len = state.expenses.length;
      state.expenses = state.expenses.filter(e => e.id !== id);
      deleted = state.expenses.length < len;
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('expenses').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase deleteExpense error:', e);
        }
      })();
    }

    return deleted;
  }

  public static getBudgetMetrics() {
    const expenses = this.getExpenses();
    const totalEstimated = expenses.reduce((sum, e) => sum + Number(e.estimated_cost || 0), 0);
    const totalInvoiced = expenses.reduce((sum, e) => sum + Number(e.actual_invoiced || 0), 0);
    const totalDepositPaid = expenses.reduce((sum, e) => sum + Number(e.deposit_paid || 0), 0);
    const remainingBalance = expenses.reduce((sum, e) => sum + Number(e.remaining_balance || 0), 0);

    const today = new Date('2026-08-30');
    const dueWithin7: Expense[] = [];
    const dueWithin14: Expense[] = [];
    const dueWithin30: Expense[] = [];

    expenses.forEach(exp => {
      if (exp.payment_status === 'pending' && exp.remaining_balance > 0) {
        const dueDate = new Date(exp.payment_due_date);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          dueWithin7.push(exp);
        } else if (diffDays <= 14) {
          dueWithin14.push(exp);
        } else if (diffDays <= 30) {
          dueWithin30.push(exp);
        }
      }
    });

    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.actual_invoiced || e.estimated_cost);
    });

    return {
      total_budget_estimated: totalEstimated,
      total_invoiced: totalInvoiced,
      total_deposit_paid: totalDepositPaid,
      remaining_balance_due: remainingBalance,
      due_within_7_days: dueWithin7,
      due_within_14_days: dueWithin14,
      due_within_30_days: dueWithin30,
      category_breakdown: categoryTotals
    };
  }

  // --- Milestones ---
  public static getMilestones(): Milestone[] {
    return this.getState().milestones;
  }

  public static updateMilestone(id: string, updates: Partial<Milestone>): Milestone | null {
    let updated: Milestone | null = null;
    this.updateState(state => {
      const idx = state.milestones.findIndex(m => m.id === id);
      if (idx !== -1) {
        state.milestones[idx] = {
          ...state.milestones[idx],
          ...updates,
          updated_at: new Date().toISOString()
        };
        updated = state.milestones[idx];
      }
    });

    const supabase = createAdminClient();
    if (supabase && updated) {
      (async () => {
        try {
          await supabase.from('milestones').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateMilestone error:', e);
        }
      })();
    }

    return updated;
  }

  public static addMilestone(milestone: Omit<Milestone, 'id' | 'updated_at'>): Milestone {
    const newMs: Milestone = {
      ...milestone,
      id: `ms-${Date.now()}`,
      updated_at: new Date().toISOString()
    };
    this.updateState(s => {
      s.milestones.push(newMs);
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('milestones').insert(newMs);
        } catch (e) {
          console.warn('Supabase addMilestone error:', e);
        }
      })();
    }

    return newMs;
  }

  // --- DJ Songs ---
  public static getSongRequests(): SongRequest[] {
    return this.getState().song_requests;
  }

  public static updateSongRequest(id: string, updates: Partial<SongRequest>): SongRequest | null {
    let updated: SongRequest | null = null;
    this.updateState(state => {
      const idx = state.song_requests.findIndex(s => s.id === id);
      if (idx !== -1) {
        state.song_requests[idx] = { ...state.song_requests[idx], ...updates };
        updated = state.song_requests[idx];
      }
    });

    const supabase = createAdminClient();
    if (supabase && updated) {
      (async () => {
        try {
          await supabase.from('song_requests').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateSongRequest error:', e);
        }
      })();
    }

    return updated;
  }

  // --- Venues ---
  public static getSourcedVenues(): VenueSourcingResult[] {
    return this.getState().venues;
  }

  public static addSourcedVenue(venue: VenueSourcingResult) {
    this.updateState(state => {
      state.venues.push(venue);
      state.agent_logs.push({
        timestamp: new Date().toISOString(),
        agent: 'Venue Sourcing Agent',
        action: `Added sourced venue "${venue.name}" with score ${venue.score}`
      });
    });

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('venues').insert(venue);
        } catch (e) {
          console.warn('Supabase addVenue error:', e);
        }
      })();
    }
  }

  // --- Logs & Briefing ---
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

    const supabase = createAdminClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('agent_logs').insert({ agent, action, details });
        } catch (e) {
          console.warn('Supabase addAgentLog error:', e);
        }
      })();
    }
  }

  public static generateDailyBriefing(): DailyBriefing {
    const state = this.getState();
    const guests = state.guests;
    const totalInvited = guests.length;
    const confirmed = guests.filter(g => g.rsvp_status === 'attending').length;
    const declined = guests.filter(g => g.rsvp_status === 'declined').length;
    const pending = guests.filter(g => g.rsvp_status === 'pending').length;
    const parties = state.parties.length;

    const banquetMath = this.getBanquetTableMath();
    const budget = this.getBudgetMetrics();

    const weddingDate = new Date('2026-09-12');
    const today = new Date('2026-08-30');
    const daysUntil = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const overdueMs = state.milestones.filter(m => m.status !== 'completed' && new Date(m.target_date) < today);
    const upcomingMs = state.milestones.filter(m => m.status !== 'completed' && new Date(m.target_date) >= today);

    const pendingGuests = guests.filter(g => g.rsvp_status === 'pending');

    return {
      date: '2026-08-30',
      days_until_wedding: daysUntil,
      rsvp_summary: {
        total_invited: totalInvited,
        confirmed_attending: confirmed,
        declined: declined,
        pending: pending,
        total_parties: parties
      },
      banquet_math: {
        confirmed_headcount: banquetMath.confirmed_headcount,
        required_10_top_tables: banquetMath.required_10_top_tables,
        empty_seats: banquetMath.empty_seats_in_active_tables,
        fill_rate_percent: banquetMath.fill_rate_percent
      },
      financial_alerts: {
        total_budget: budget.total_budget_estimated,
        total_invoiced: budget.total_invoiced,
        total_paid: budget.total_deposit_paid,
        remaining_balance: budget.remaining_balance_due,
        due_within_7_days: budget.due_within_7_days,
        due_within_14_days: budget.due_within_14_days,
        due_within_30_days: budget.due_within_30_days
      },
      critical_milestones: {
        overdue: overdueMs,
        upcoming_sprint: upcomingMs
      },
      agent_actions_taken: state.agent_logs.slice(-5).map(l => `[${l.agent}] ${l.action}`),
      chaser_recommendations: {
        pending_guest_count: pendingGuests.length,
        t21_candidates: pendingGuests.slice(0, 2),
        t7_candidates: pendingGuests.slice(2)
      }
    };
  }
}
