import { drizzle } from 'drizzle-orm/postgres-js'

import * as schema from './schema'

if (!process.env.DB_URL) throw new Error('missing db url')

export const db = drizzle(process.env.DB_URL, {
  casing: 'snake_case',
  schema
})
