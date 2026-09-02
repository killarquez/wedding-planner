import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { RsvpPipelineAgent } from '@/lib/agents/rsvpAgent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const { party, primaryGuest, plusOneGuests } = WeddingDB.submitRsvp({
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
