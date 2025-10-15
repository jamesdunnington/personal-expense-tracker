import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function testQueries() {
  try {
    console.log('Testing simplified query...')
    
    const userId = 3 // Your user ID
    
    // Test the transactions list query
    const result = await pool.query(`
      SELECT 
        t.id,
        t.user_id,
        t.date,
        t.amount,
        t.type,
        t.category_id,
        t.subcategory_id,
        t.description,
        t.is_tax_deductible,
        t.created_at,
        t.updated_at,
        c.name as category_name,
        c.type as category_type,
        sc.name as subcategory_name,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name))
            FROM transaction_tags tt
            JOIN tags tg ON tt.tag_id = tg.id
            WHERE tt.transaction_id = t.id
          ),
          '[]'::json
        ) as tags
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN categories sc ON t.subcategory_id = sc.id
      WHERE t.user_id = $1
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `, [userId])
    
    console.log('✅ Query successful!')
    console.log('Results:', result.rows.length, 'transactions')
    console.log('Sample:', JSON.stringify(result.rows[0], null, 2))
    
  } catch (error) {
    console.error('❌ Query failed:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Detail:', error.detail)
    console.error('Position:', error.position)
    console.error('Stack:', error.stack)
  } finally {
    await pool.end()
  }
}

testQueries()
