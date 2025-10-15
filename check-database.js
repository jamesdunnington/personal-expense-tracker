import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkDatabase() {
  try {
    console.log('Checking database...')
    
    // Check if user_settings table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_settings'
      )
    `)
    console.log('user_settings table exists:', tableCheck.rows[0].exists)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ user_settings table does NOT exist!')
      console.log('Running migration...')
      
      const fs = await import('fs')
      const path = await import('path')
      const { fileURLToPath } = await import('url')
      
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      
      const sql = fs.readFileSync(
        path.join(__dirname, 'database', 'migrations', '004_user_settings.sql'),
        'utf8'
      )
      
      await pool.query(sql)
      console.log('✅ Migration completed')
    } else {
      console.log('✅ user_settings table exists')
      
      // Check table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'user_settings'
        ORDER BY ordinal_position
      `)
      console.log('Table structure:')
      console.table(structure.rows)
      
      // Check if there are any rows
      const count = await pool.query('SELECT COUNT(*) FROM user_settings')
      console.log('Number of rows:', count.rows[0].count)
    }
    
    // Test the query from settings-get.js
    console.log('\n Testing settings-get query...')
    const testQuery = await pool.query(`
      SELECT u.id, u.email, u.name, u.created_at,
              COALESCE(s.currency, 'SGD') as currency,
              COALESCE(s.date_format, 'dd/MM/yyyy') as date_format,
              COALESCE(s.theme, 'light') as theme,
              COALESCE(s.language, 'en') as language
       FROM users u
       LEFT JOIN user_settings s ON u.id = s.user_id
       LIMIT 1
    `)
    console.log('Test query result:', testQuery.rows[0])
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await pool.end()
  }
}

checkDatabase()
