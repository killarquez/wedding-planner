import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Support custom invite URLs: /invite=CODE, /invite=CODE?rsvp, /invite/CODE, /invite/CODE?rsvp
  if (pathname.startsWith('/invite=') || pathname.startsWith('/invite/')) {
    const raw = pathname.startsWith('/invite=')
      ? pathname.slice('/invite='.length)
      : pathname.slice('/invite/'.length);
    const code = decodeURIComponent(raw).split('?')[0].split('/')[0];

    if (code) {
      const hasRsvp = request.nextUrl.searchParams.has('rsvp') || request.nextUrl.search.includes('rsvp');
      if (hasRsvp) {
        const rsvpUrl = new URL('/rsvp', request.url);
        rsvpUrl.searchParams.set('invite', code);
        return NextResponse.redirect(rsvpUrl);
      } else {
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('invite', code);
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  // If visiting /?invite=CODE&rsvp or /?code=CODE&rsvp, route directly to /rsvp
  if (pathname === '/' && (request.nextUrl.searchParams.has('rsvp') || request.nextUrl.search.includes('rsvp'))) {
    const code = request.nextUrl.searchParams.get('invite') || request.nextUrl.searchParams.get('code');
    if (code) {
      const rsvpUrl = new URL('/rsvp', request.url);
      rsvpUrl.searchParams.set('invite', code);
      return NextResponse.redirect(rsvpUrl);
    }
  }

  // Protect /admin routes strictly - Couple Only
  if (pathname.startsWith('/admin')) {
    // 1. Check for valid couple session cookie (Passcode authenticated)
    const coupleSession = request.cookies.get('couple_session')?.value;
    if (coupleSession === 'authenticated_couple') {
      return NextResponse.next();
    }

    // 2. Check for Supabase session if configured
    const { supabaseResponse, user, isConfigured } = await updateSession(request);
    if (isConfigured && user) {
      const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

      if (allowedEmails.length === 0 || allowedEmails.includes((user.email || '').toLowerCase())) {
        return supabaseResponse;
      }

      // User logged in but not on the couple whitelist
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized_email');
      return NextResponse.redirect(loginUrl);
    }

    // 3. Unauthenticated access - redirect to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Update session cookies for all other routes if Supabase is active
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, .mp3, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)',
  ],
};
