import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkUserData(userId) {
  try {
    console.log(`\n=== Checking data for user ID: ${userId} ===\n`)
    
    // Check user exists
    const userResult = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [userId]
    )
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found:', userResult.rows[0])
    
    // Check categories
    const categoriesResult = await pool.query(
      'SELECT id, name, type, parent_id FROM categories WHERE user_id = $1 ORDER BY type, name',
      [userId]
    )
    
    console.log(`\n📁 Categories (${categoriesResult.rows.length} total):`)
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: "${cat.name}", Type: ${cat.type}, Parent: ${cat.parent_id || 'none'}`)
    })
    
    // Check tags
    const tagsResult = await pool.query(
      'SELECT id, name FROM tags WHERE user_id = $1',
      [userId]
    )
    
    console.log(`\n🏷️  Tags (${tagsResult.rows.length} total):`)
    tagsResult.rows.forEach(tag => {
      console.log(`  - ID: ${tag.id}, Name: "${tag.name}"`)
    })
    
    // Check transactions
    const transactionsResult = await pool.query(
      'SELECT id, date, amount, type, description FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 5',
      [userId]
    )
    
    console.log(`\n💰 Recent Transactions (showing ${transactionsResult.rows.length} of total):`)
    if (transactionsResult.rows.length === 0) {
      console.log('  No transactions yet')
    } else {
      transactionsResult.rows.forEach(tx => {
        console.log(`  - ID: ${tx.id}, Date: ${tx.date}, Amount: $${tx.amount}, Type: ${tx.type}`)
      })
    }
    
    console.log('\n=== Check complete ===\n')
    
  } catch (error) {
    console.error('Error checking user data:', error)
  } finally {
    await pool.end()
  }
}

// Get user ID from command line argument
const userId = process.argv[2]

if (!userId) {
  console.log('Usage: node check-user-data.js <userId>')
  console.log('Example: node check-user-data.js 3')
  process.exit(1)
}

checkUserData(parseInt(userId))
