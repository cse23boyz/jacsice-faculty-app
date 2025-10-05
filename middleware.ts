import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the route is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Only check cookies in middleware (server-side)
    const adminToken = request.cookies.get('adminToken')?.value

    // If no admin token, redirect to admin login
    if (!adminToken) {
      return NextResponse.redirect(new URL('/auth/admin-login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}