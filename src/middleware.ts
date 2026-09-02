import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const { supabaseResponse, user, isConfigured } = await updateSession(request);

    // If Supabase is configured in environment, enforce authentication
    if (isConfigured) {
      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check allowed admin emails if configured
      const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

      if (allowedEmails.length > 0) {
        const userEmail = (user.email || '').toLowerCase();
        if (!allowedEmails.includes(userEmail)) {
          // Logged in but not authorized couple email
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('error', 'unauthorized_email');
          return NextResponse.redirect(loginUrl);
        }
      }

      return supabaseResponse;
    }
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
