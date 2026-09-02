import { NextRequest, NextResponse } from 'next/server';
import { VenueSourcingAgent, VenueSearchCriteria } from '@/lib/agents/venueAgent';
import { WeddingDB } from '@/lib/db';

export async function GET() {
  try {
    const venues = WeddingDB.getSourcedVenues();
    return NextResponse.json({ venues });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const criteria: VenueSearchCriteria = {
      city: body.city || 'Westminster / Little Saigon',
      expectedGuests: Number(body.expectedGuests || 90),
      tablesNeeded: Number(body.tablesNeeded || 9),
      hostSuppliedDrinks: body.hostSuppliedDrinks !== undefined ? body.hostSuppliedDrinks : true,
      asianBanquetCourses: Number(body.asianBanquetCourses || 8),
      requireAvStage: body.requireAvStage !== undefined ? body.requireAvStage : true,
      budgetPerTableMax: Number(body.budgetPerTableMax || 850)
    };

    const results = await VenueSourcingAgent.searchAndRankVenues(criteria);
    return NextResponse.json({
      success: true,
      criteria,
      count: results.length,
      venues: results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
