import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function addSubcategoryColumn() {
  try {
    console.log('Adding subcategory_id column to transactions table...\n')
    
    // Add the column
    await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
    `)
    
    console.log('✅ Column added successfully!')
    
    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_subcategory_id ON transactions(subcategory_id)
    `)
    
    console.log('✅ Index created!')
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'subcategory_id'
    `)
    
    if (result.rows.length > 0) {
      console.log('\n📋 Verified: subcategory_id column exists')
      console.log(`   Type: ${result.rows[0].data_type}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

addSubcategoryColumn()
