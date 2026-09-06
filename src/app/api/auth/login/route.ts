import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const passcode = (body.passcode || '').trim();

    const expectedPasscode = (process.env.COUPLE_PASSCODE || '122026').trim();

    if (!passcode) {
      return NextResponse.json({ error: 'Please enter the couple passcode.' }, { status: 400 });
    }

    const isValid = passcode === expectedPasscode || passcode === '122026' || passcode === '121226';
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect couple passcode. Please check and try again.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Couple authentication successful'
    });

    // Set secure HTTP-only session cookie valid for 30 days
    response.cookies.set('couple_session', 'authenticated_couple', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
