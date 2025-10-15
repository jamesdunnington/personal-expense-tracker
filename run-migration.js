import pkg from 'pg'
const { Pool } = pkg
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function runMigration() {
  try {
    console.log('Running user_settings migration...')
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'database', 'migrations', '004_user_settings.sql'),
      'utf8'
    )
    
    await pool.query(sql)
    console.log('✅ Migration completed successfully')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
