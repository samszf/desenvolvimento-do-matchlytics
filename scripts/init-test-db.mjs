import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: Number(process.env.PGPORT ?? 5432),
})

const statements = [
  `CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY, "name" text NOT NULL, "email" text NOT NULL UNIQUE, "emailVerified" boolean NOT NULL DEFAULT false, "image" text, "bio" text, "favoriteRole" text, "favoriteMap" text, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS "session" ("id" text PRIMARY KEY, "expiresAt" timestamp NOT NULL, "token" text NOT NULL UNIQUE, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now(), "ipAddress" text, "userAgent" text, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "account" ("id" text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp, "scope" text, "password" text, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS "verification" ("id" text PRIMARY KEY, "identifier" text NOT NULL, "value" text NOT NULL, "expiresAt" timestamp NOT NULL, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS "maps" ("id" text PRIMARY KEY, "name" text NOT NULL UNIQUE, "active" boolean NOT NULL DEFAULT true, "createdAt" timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS "matches" ("id" text PRIMARY KEY, "userId" text NOT NULL, "mapId" text NOT NULL, "playedAt" timestamp NOT NULL, "result" text NOT NULL, "playerScore" integer NOT NULL, "opponentScore" integer NOT NULL, "duration" integer, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS "match_statistics" ("id" text PRIMARY KEY, "matchId" text NOT NULL UNIQUE, "kills" integer, "deaths" integer, "assists" integer, "headshots" integer, "adr" numeric, "kast" numeric, "ctKills" integer, "ctDeaths" integer, "ctAssists" integer, "ctHeadshots" integer, "ctAdr" numeric, "trKills" integer, "trDeaths" integer, "trAssists" integer, "trHeadshots" integer, "trAdr" numeric)`,
]

try {
  for (const statement of statements) await pool.query(statement)
  await pool.query('SELECT 1 FROM "user" LIMIT 1')
  console.log('Test database schema is ready')
} finally {
  await pool.end()
}
