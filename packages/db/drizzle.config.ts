import type { Config } from 'drizzle-kit'

if (!process.env.DB_URL) throw new Error('missing db url')

export default {
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DB_URL
  },
  dialect: 'postgresql',
  schema: './src/schema.ts'
} satisfies Config
