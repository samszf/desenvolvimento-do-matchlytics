import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL
const databaseHost = process.env.PGHOST ?? process.env.POSTGRES_HOST
const databaseUser = process.env.PGUSER ?? process.env.POSTGRES_USER
const databasePassword = process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD
const databaseName = process.env.PGDATABASE ?? process.env.POSTGRES_DATABASE
const isLocalDatabase = !databaseUrl || /localhost|127\.0\.0\.1/.test(databaseUrl)

export const pool = !isLocalDatabase
  ? new Pool({ connectionString: databaseUrl! })
  : new Pool({ host: databaseHost, user: databaseUser, password: databasePassword, database: databaseName, port: 5432, ssl: databaseHost && !databaseHost.includes('localhost') ? { rejectUnauthorized: false } : undefined })
export const db = drizzle(pool, { schema })
