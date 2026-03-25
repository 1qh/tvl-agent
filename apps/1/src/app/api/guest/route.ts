import type { NextRequest } from 'next/server'

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '~/auth/server'

const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url),
    redirectUrl = searchParams.get('redirectUrl') ?? '/',
    session = await auth.api.getSession({ headers: await headers() })
  if (session?.session.token) return NextResponse.redirect(new URL('/', req.url))
  const signInResponse = await auth.api.signInAnonymous({
      asResponse: true,
      headers: req.headers,
      query: { callbackURL: redirectUrl }
    }),
    response = NextResponse.redirect(new URL(redirectUrl, req.url)),
    setCookie = signInResponse.headers.get('set-cookie')
  if (setCookie) response.headers.set('set-cookie', setCookie)
  return response
}

export { GET }
