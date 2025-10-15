import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const { Client } = pg

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔌 Connecting to Neon database...')
    await client.connect()
    console.log('✅ Connected successfully!')

    // Read the schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('📝 Running database schema...')
    await client.query(schema)
    console.log('✅ Database schema created successfully!')

    // Note: Seed data will be skipped as it requires a user to exist
    // Default categories and tags will be created automatically when users register

    console.log('\n✨ Database setup complete!')
    console.log('📊 Tables created:')
    const result = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `)
    result.rows.forEach(row => console.log(`   - ${row.tablename}`))

  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed')
  }
}

setupDatabase()
