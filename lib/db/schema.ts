import { boolean, integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const verification = pgTable('verification', { id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').defaultNow(), updatedAt: timestamp('updatedAt').defaultNow() })
export const maps = pgTable('maps', { id: text('id').primaryKey(), name: text('name').notNull().unique(), active: boolean('active').notNull().default(true), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const matches = pgTable('matches', { id: text('id').primaryKey(), userId: text('userId').notNull(), mapId: text('mapId').notNull(), playedAt: timestamp('playedAt').notNull(), result: text('result').notNull(), playerScore: integer('playerScore').notNull(), opponentScore: integer('opponentScore').notNull(), duration: integer('duration'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow() })
export const matchStatistics = pgTable('match_statistics', { id: text('id').primaryKey(), matchId: text('matchId').notNull().unique(), kills: integer('kills'), deaths: integer('deaths'), assists: integer('assists'), headshots: integer('headshots'), adr: numeric('adr'), kast: numeric('kast'), ctKills: integer('ctKills'), ctDeaths: integer('ctDeaths'), ctAssists: integer('ctAssists'), ctHeadshots: integer('ctHeadshots'), ctAdr: numeric('ctAdr'), trKills: integer('trKills'), trDeaths: integer('trDeaths'), trAssists: integer('trAssists'), trHeadshots: integer('trHeadshots'), trAdr: numeric('trAdr') })
