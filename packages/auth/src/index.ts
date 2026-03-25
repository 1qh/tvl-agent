import type { BetterAuthOptions } from 'better-auth'

import { db } from '@a/db/client'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { anonymous } from 'better-auth/plugins'

import { env } from '../env'

type Auth = ReturnType<typeof initAuth>
type Session = Auth['$Infer']['Session']

const initAuth = () =>
  betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    emailAndPassword: {
      autoSignIn: true,
      enabled: true,
      minPasswordLength: 1
    },
    onAPIError: {
      onError: (error, ctx) => {
        console.error('BETTER AUTH API ERROR', error, ctx)
      }
    },
    plugins: [anonymous({ disableDeleteAnonymousUser: true }), nextCookies()],
    socialProviders: {
      google: {
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET
      }
    },
    trustedOrigins: ['*']
  } satisfies BetterAuthOptions)

export { initAuth }
export type { Auth, Session }
