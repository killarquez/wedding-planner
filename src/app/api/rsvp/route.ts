import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { RsvpPipelineAgent } from '@/lib/agents/rsvpAgent';
import { sendRsvpConfirmationEmail } from '@/lib/email/dispatcher';
import { sendDiscordRsvpAlert } from '@/lib/alerts/discord';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('code') || searchParams.get('phone') || searchParams.get('lookup');

    if (!query) {
      return NextResponse.json({ error: 'Lookup parameter (code or phone) is required' }, { status: 400 });
    }

    const result = await WeddingDB.getPartyByCodeOrPhone(query);
    if (!result) {
      return NextResponse.json({ error: 'Invitation not found. Please verify your code or phone number.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      party: result.party,
      guests: result.guests
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Personalized Party RSVP Mode
    if (body.party_id || (body.guests && Array.isArray(body.guests))) {
      const result = await WeddingDB.submitPartyRsvp(body);

      // Trigger Agent B confirmation draft
      const primaryGuest = result.guests.find((g: any) => g.is_primary_contact) || result.guests[0];
      const plusOneGuests = result.guests.filter((g: any) => g.id !== primaryGuest?.id && g.rsvp_status === 'attending');

      let agentResponse = null;
      if (primaryGuest) {
        try {
          agentResponse = await RsvpPipelineAgent.processRsvpSubmission(
            result.party,
            primaryGuest,
            plusOneGuests
          );
        } catch (e) {
          console.warn('Agent confirmation generation warning:', e);
        }
      }

      // Dispatch Instant Discord Push Notification to Alfredo & Trang's Phones
      try {
        await sendDiscordRsvpAlert({
          party: result.party,
          primaryGuest: primaryGuest || { first_name: result.party.primary_guest_name, last_name: '', rsvp_status: 'attending', dietary_restrictions: [] } as any,
          allGuests: result.guests,
          attendingCount: result.attendingCount,
          declinedCount: result.declinedCount,
          specialMessage: body.special_message,
          songRequest: body.song_request?.song_title
        });
      } catch (err) {
        console.warn('Discord alert push warning:', err);
      }

      // Dispatch Transactional Confirmation Email via Resend with .ics Attachment
      const recipientEmail = body.contact_email || result.party.contact_email || primaryGuest?.email;
      let emailResult = null;
      if (recipientEmail && primaryGuest) {
        try {
          emailResult = await sendRsvpConfirmationEmail({
            party: result.party,
            primaryGuest,
            allGuests: result.guests,
            attendingCount: result.attendingCount,
            recipientEmail
          });
        } catch (err) {
          console.warn('Resend email dispatch warning:', err);
        }
      }

      return NextResponse.json({
        success: true,
        party: result.party,
        primaryGuest,
        guests: result.guests,
        attendingCount: result.attendingCount,
        declinedCount: result.declinedCount,
        agentResponse,
        emailSent: emailResult?.success || false
      });
    }

    // 2. Legacy / Fallback Single Submission
    const {
      first_name,
      last_name,
      email,
      phone,
      rsvp_status,
      headcount,
      dietary_restrictions,
      dietary_notes,
      song_request,
      notes,
      relationship_tag,
      plus_ones
    } = body;

    if (!first_name || !last_name || !rsvp_status) {
      return NextResponse.json(
        { error: 'First name, last name, and RSVP status are required.' },
        { status: 400 }
      );
    }

    const { party, primaryGuest, plusOneGuests } = await WeddingDB.submitRsvp({
      first_name,
      last_name,
      email,
      phone,
      rsvp_status,
      headcount: headcount || 1 + (plus_ones?.length || 0),
      dietary_restrictions: dietary_restrictions || [],
      dietary_notes,
      song_request,
      notes,
      relationship_tag,
      plus_ones
    });

    // Run Agent B: Automated RSVP Pipeline & Instant Response
    const agentResponse = await RsvpPipelineAgent.processRsvpSubmission(
      party,
      primaryGuest,
      plusOneGuests
    );

    return NextResponse.json({
      success: true,
      party,
      primaryGuest,
      plusOneGuests,
      agentResponse
    });
  } catch (error: any) {
    console.error('Error processing RSVP:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing RSVP' },
      { status: 500 }
    );
  }
}
