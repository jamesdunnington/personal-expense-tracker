import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkSchema() {
  try {
    console.log('Checking transactions table schema...\n')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Transactions table columns:')
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkSchema()
