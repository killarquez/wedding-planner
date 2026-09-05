import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { Party, Guest, Table } from '@/lib/types';
import { sendDiscordCheckinAlert } from '@/lib/alerts/discord';

function extractCheckInInfo(party: any) {
  let isCheckedIn = !!party.checked_in;
  let checkedInAt: string | null = party.checked_in_at || null;
  let checkedInBy: string | null = null;

  if (party.notes && typeof party.notes === 'string') {
    const match = party.notes.match(/\[CHECKED_IN:([^:\]]+)(?::([^\]]+))?\]/);
    if (match) {
      isCheckedIn = true;
      checkedInAt = match[1];
      checkedInBy = match[2] || 'Greeter Desk';
    }
  }

  return { isCheckedIn, checkedInAt, checkedInBy };
}

function cleanQueryCode(input: string): string {
  let str = input.trim();
  try {
    if (str.includes('invite=') || str.includes('code=')) {
      const url = new URL(str.startsWith('http') ? str : `https://wedding.au-tomato.com/${str}`);
      const inv = url.searchParams.get('invite') || url.searchParams.get('code');
      if (inv) str = inv;
    } else if (str.includes('/invite/')) {
      const parts = str.split('/invite/');
      if (parts[1]) str = parts[1].split(/[?#/]/)[0];
    }
  } catch (e) {
    // fallback
  }
  return str.trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('query') || searchParams.get('code') || searchParams.get('phone') || '';
    const query = cleanQueryCode(rawQuery);

    // Fetch all tables to resolve seating
    const tables = await WeddingDB.getTablesWithGuests();
    const tableMap = new Map<string, Table>();
    tables.forEach((t: Table) => tableMap.set(t.id, t));

    // Fetch all parties with guests for overall check-in metrics
    const allPartiesWithGuests = await WeddingDB.getPartiesWithGuests();

    let totalAttendingGuests = 0;
    let checkedInGuestsCount = 0;
    let totalAttendingParties = 0;
    let checkedInPartiesCount = 0;
    const recentCheckIns: Array<{
      partyId: string;
      primaryGuestName: string;
      invitationCode: string;
      headcount: number;
      checkedInAt: string;
      tableInfo: string;
    }> = [];

    allPartiesWithGuests.forEach(p => {
      const attending = p.guests.filter((g: Guest) => g.rsvp_status === 'attending');
      if (attending.length > 0) {
        totalAttendingParties++;
        totalAttendingGuests += attending.length;

        const info = extractCheckInInfo(p);
        if (info.isCheckedIn) {
          checkedInPartiesCount++;
          checkedInGuestsCount += attending.length;

          // Find table for recent list
          const firstWithTable = attending.find((g: Guest) => g.table_id);
          const t = firstWithTable?.table_id ? tableMap.get(firstWithTable.table_id) : null;
          const tableInfo = t ? `Table ${t.table_number}: ${t.name}` : 'Unassigned';

          recentCheckIns.push({
            partyId: p.id,
            primaryGuestName: p.primary_guest_name,
            invitationCode: p.invitation_code,
            headcount: attending.length,
            checkedInAt: info.checkedInAt || new Date().toISOString(),
            tableInfo
          });
        }
      }
    });

    // Sort recent checkins newest first
    recentCheckIns.sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());

    const floorStats = {
      totalAttendingGuests,
      checkedInGuestsCount,
      percentCheckedIn: totalAttendingGuests > 0 ? Math.round((checkedInGuestsCount / totalAttendingGuests) * 100) : 0,
      totalAttendingParties,
      checkedInPartiesCount,
      recentCheckIns: recentCheckIns.slice(0, 8)
    };

    // If no query provided, return just the stats and all attending parties summary
    if (!query) {
      return NextResponse.json({
        stats: floorStats,
        parties: allPartiesWithGuests.map(p => {
          const attending = p.guests.filter((g: Guest) => g.rsvp_status === 'attending');
          const firstWithTable = attending.find((g: Guest) => g.table_id);
          const t = firstWithTable?.table_id ? tableMap.get(firstWithTable.table_id) : null;
          const info = extractCheckInInfo(p);

          return {
            id: p.id,
            primary_guest_name: p.primary_guest_name,
            invitation_code: p.invitation_code,
            attending_count: attending.length,
            attending_names: attending.map(g => `${g.first_name || ''} ${g.last_name || ''}`.trim()),
            table: t ? { table_number: t.table_number, name: t.name } : null,
            is_checked_in: info.isCheckedIn,
            checked_in_at: info.checkedInAt
          };
        })
      });
    }

    // Lookup party by code, phone, or name
    let matchedParty = await WeddingDB.getPartyByCodeOrPhone(query);

    // If not found by code or phone, search through all parties by primary name or guest names
    if (!matchedParty) {
      const qLower = query.toLowerCase();
      const found = allPartiesWithGuests.find(p => {
        if (p.primary_guest_name?.toLowerCase().includes(qLower)) return true;
        if (p.invitation_code?.toLowerCase().includes(qLower)) return true;
        return p.guests.some((g: Guest) =>
          `${g.first_name || ''} ${g.last_name || ''}`.toLowerCase().includes(qLower)
        );
      });

      if (found) {
        matchedParty = { party: found, guests: found.guests };
      }
    }

    if (!matchedParty) {
      return NextResponse.json({
        error: 'No wedding invitation found matching code or name',
        stats: floorStats
      }, { status: 404 });
    }

    const { party, guests } = matchedParty;
    const attendingGuests = guests.filter((g: Guest) => g.rsvp_status === 'attending');
    const checkInInfo = extractCheckInInfo(party);

    // Resolve assigned table from attending guests
    let assignedTable: Table | null = null;
    for (const g of attendingGuests) {
      if (g.table_id && tableMap.has(g.table_id)) {
        assignedTable = tableMap.get(g.table_id)!;
        break;
      }
    }

    // Aggregate dietary restrictions and special notes
    const dietaryAlerts: Array<{ guestName: string; restrictions: string[]; notes?: string }> = [];
    attendingGuests.forEach((g: Guest) => {
      if ((g.dietary_restrictions && g.dietary_restrictions.length > 0) || g.dietary_notes) {
        dietaryAlerts.push({
          guestName: `${g.first_name || ''} ${g.last_name || ''}`.trim() || party.primary_guest_name,
          restrictions: g.dietary_restrictions || [],
          notes: g.dietary_notes
        });
      }
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        primary_guest_name: party.primary_guest_name,
        invitation_code: party.invitation_code,
        total_invited: party.total_invited,
        relationship_tag: party.relationship_tag,
        contact_phone: party.contact_phone,
        notes: party.notes,
        is_checked_in: checkInInfo.isCheckedIn,
        checked_in_at: checkInInfo.checkedInAt,
        checked_in_by: checkInInfo.checkedInBy
      },
      attending_headcount: attendingGuests.length,
      attending_guests: attendingGuests.map((g: Guest) => ({
        id: g.id,
        name: `${g.first_name || ''} ${g.last_name || ''}`.trim(),
        is_primary: g.is_primary_contact,
        dietary_restrictions: g.dietary_restrictions || [],
        dietary_notes: g.dietary_notes,
        table_seat_number: g.table_seat_number
      })),
      table: assignedTable ? {
        id: assignedTable.id,
        table_number: assignedTable.table_number,
        name: assignedTable.name,
        capacity: assignedTable.capacity,
        hierarchy_tag: assignedTable.hierarchy_tag,
        stage_position: assignedTable.stage_position
      } : null,
      dietary_alerts: dietaryAlerts,
      stats: floorStats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { party_id, greeter_name } = body;

    if (!party_id) {
      return NextResponse.json({ error: 'party_id is required' }, { status: 400 });
    }

    const parties = await WeddingDB.getPartiesWithGuests();
    const targetParty = parties.find(p => p.id === party_id);

    if (!targetParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const greeter = (greeter_name || 'Greeter Desk').trim();
    const tag = `[CHECKED_IN:${now}:${greeter}]`;

    // Strip existing tag if present, then prepend fresh tag
    let updatedNotes = targetParty.notes || '';
    updatedNotes = updatedNotes.replace(/\[CHECKED_IN:[^\]]+\]\s*/g, '').trim();
    updatedNotes = `${tag} ${updatedNotes}`.trim();

    const updated = await WeddingDB.updateParty(party_id, {
      notes: updatedNotes
    });

    // Dispatch Discord arrival notification
    try {
      const attending = targetParty.guests?.filter((g: any) => g.rsvp_status === 'attending') || [];
      const firstWithTable = attending.find((g: any) => g.table_id);
      const tables = await WeddingDB.getTablesWithGuests();
      const t = firstWithTable?.table_id ? tables.find(tb => tb.id === firstWithTable.table_id) : null;
      const tableInfo = t ? `Table ${t.table_number}: ${t.name}` : 'General Buffer Table';

      sendDiscordCheckinAlert({
        partyName: targetParty.primary_guest_name,
        invitationCode: targetParty.invitation_code,
        headcount: attending.length || targetParty.total_invited,
        tableInfo,
        greeterName: greeter
      }).catch(console.error);
    } catch (err) {
      console.warn('Discord check-in alert warning:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Party ${targetParty.primary_guest_name} successfully checked in!`,
      checked_in: true,
      checked_in_at: now,
      checked_in_by: greeter,
      party: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const party_id = searchParams.get('party_id');

    if (!party_id) {
      return NextResponse.json({ error: 'party_id is required' }, { status: 400 });
    }

    const parties = await WeddingDB.getPartiesWithGuests();
    const targetParty = parties.find(p => p.id === party_id);

    if (!targetParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    let updatedNotes = targetParty.notes || '';
    updatedNotes = updatedNotes.replace(/\[CHECKED_IN:[^\]]+\]\s*/g, '').trim();

    const updated = await WeddingDB.updateParty(party_id, {
      notes: updatedNotes
    });

    return NextResponse.json({
      success: true,
      message: `Check-in reverted for ${targetParty.primary_guest_name}`,
      checked_in: false,
      party: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
