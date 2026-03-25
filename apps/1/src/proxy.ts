// oxlint-disable group-exports
import type { NextRequest } from 'next/server'

import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse as R } from 'next/server'

export const proxy = (req: NextRequest) => {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api/auth')) return R.next()
  if (pathname === '/api/guest') return R.next()
  if (!getSessionCookie(req)) return R.redirect(new URL(`/api/guest?redirectUrl=${encodeURIComponent(req.url)}`, req.url))
  return R.next()
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}
