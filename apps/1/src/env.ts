// oxlint-disable no-process-env
/** biome-ignore-all lint/style/noProcessEnv: x */

import { createEnv } from '@t3-oss/env-nextjs'
import { vercel } from '@t3-oss/env-nextjs/presets-zod'

import { authEnv } from '@a/auth/env'
import { string, enum as zenum, url, number } from 'zod/v4'

export default createEnv({
  client: {},
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV
  },
  extends: [authEnv(), vercel()],
  server: {
    DB_URL: url(),
    S3_BUCKET: string(),
    S3_ENDPOINT: url(),
    LLM_BASE_URL: url(),
    TAVILY_API_KEYS: string()
      .transform(value => value.split(','))
      .pipe(string().trim().array()),
    TAVILY_EXHAUSTION_THRESHOLD: number().default(996)
  },
  shared: {
    NODE_ENV: zenum(['development', 'production', 'test']).default('development')
  },
  skipValidation: Boolean(process.env.CI) || process.env.npm_lifecycle_event === 'lint'
})
