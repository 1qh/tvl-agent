import { createEnv } from '@t3-oss/env-nextjs'
import { string } from 'zod/v4'

const env = createEnv({
    server: {
      AUTH_GOOGLE_ID: string().min(1),
      AUTH_GOOGLE_SECRET: string().min(1)
    },
    experimental__runtimeEnv: {},
    skipValidation: Boolean(process.env.CI) || process.env.npm_lifecycle_event === 'lint'
  }),
  authEnv = () => env

export { env, authEnv }
