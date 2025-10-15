import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkUsersTable() {
  try {
    console.log('Checking users table structure...')
    
    const structure = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('Users table structure:')
    console.table(structure.rows)
    
    // Check if name column exists
    const hasName = structure.rows.some(row => row.column_name === 'name')
    console.log('\nHas name column:', hasName)
    
    if (!hasName) {
      console.log('\n⚠️ name column does NOT exist. Adding it now...')
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name VARCHAR(255)
      `)
      console.log('✅ name column added successfully')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await pool.end()
  }
}

checkUsersTable()
