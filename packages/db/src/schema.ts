import type { AppUsage } from 'types'

import { VISIBILITIES } from 'constant'
import {
  boolean,
  foreignKey,
  jsonb,
  // biome-ignore lint/nursery/noDeprecatedImports: x
  primaryKey,
  pgTable as t,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

const user = t('user', {
    createdAt: timestamp().defaultNow().notNull(),
    email: text().notNull().unique(),
    emailVerified: boolean().default(false).notNull(),
    id: text().primaryKey(),
    image: text(),
    isAnonymous: boolean(),
    name: text().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  }),
  session = t('session', {
    createdAt: timestamp().defaultNow().notNull(),
    expiresAt: timestamp().notNull(),
    id: text().primaryKey(),
    ipAddress: text(),
    token: text().notNull().unique(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  }),
  account = t('account', {
    accessToken: text(),
    accessTokenExpiresAt: timestamp(),
    accountId: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    id: text().primaryKey(),
    idToken: text(),
    password: text(),
    providerId: text().notNull(),
    refreshToken: text(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  }),
  verification = t('verification', {
    createdAt: timestamp().defaultNow().notNull(),
    expiresAt: timestamp().notNull(),
    id: text().primaryKey(),
    identifier: text().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    value: text().notNull()
  }),
  chat = t('Chat', {
    createdAt: timestamp().defaultNow().notNull(),
    feedbackCreatedAt: timestamp(),
    feedbackText: text(),
    feedbackType: varchar(),
    id: uuid().primaryKey().notNull().defaultRandom(),
    isBookmarked: boolean().default(false).notNull(),
    lastContext: jsonb().$type<AppUsage | null>(),
    title: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id),
    visibility: varchar({ enum: VISIBILITIES }).notNull().default('private')
  }),
  message = t('Message', {
    chatId: uuid()
      .notNull()
      .references(() => chat.id),
    createdAt: timestamp().defaultNow().notNull(),
    id: uuid().primaryKey().notNull().defaultRandom(),
    parts: jsonb().notNull(),
    role: varchar().notNull()
  }),
  vote = t(
    'Vote',
    {
      chatId: uuid()
        .notNull()
        .references(() => chat.id),
      isUpvoted: boolean().notNull(),
      messageId: uuid()
        .notNull()
        .references(() => message.id)
    },
    tb => [primaryKey({ columns: [tb.chatId, tb.messageId] })]
  ),
  stream = t(
    'Stream',
    {
      chatId: uuid().notNull(),
      createdAt: timestamp().defaultNow().notNull(),
      id: uuid().notNull().defaultRandom()
    },
    tb => [
      foreignKey({
        columns: [tb.chatId],
        foreignColumns: [chat.id]
      }),
      primaryKey({ columns: [tb.id] })
    ]
  )

type Account = typeof account.$inferSelect
type Chat = typeof chat.$inferSelect
type DBMessage = typeof message.$inferSelect
type Session = Omit<typeof session.$inferSelect, 'ipAddress' | 'userAgent'>
type Stream = typeof stream.$inferSelect
type User = typeof user.$inferSelect
type Verification = typeof verification.$inferSelect
type Vote = typeof vote.$inferSelect

export { account, chat, message, session, stream, user, verification, vote }
export type { Account, Chat, DBMessage, Session, Stream, User, Verification, Vote }
