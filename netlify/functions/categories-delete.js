import pg from 'pg'
import jwt from 'jsonwebtoken'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Verify JWT token and get user ID
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded.userId
  } catch (error) {
    return null
  }
}

export const handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Verify authentication
    const token = event.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No token provided' })
      }
    }

    const userId = verifyToken(token)
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    // Get category ID from path
    const categoryId = event.path.split('/').pop()

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    )

    if (categoryCheck.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Category not found' })
      }
    }

    // Check if category is used in transactions
    const transactionCheck = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE (category_id = $1 OR subcategory_id = $1) AND user_id = $2',
      [categoryId, userId]
    )

    const transactionCount = parseInt(transactionCheck.rows[0].count)

    if (transactionCount > 0) {
      // Archive instead of delete if used in transactions
      await pool.query(
        'UPDATE categories SET is_archived = true WHERE id = $1 AND user_id = $2',
        [categoryId, userId]
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Category archived (used in ${transactionCount} transactions)`,
          archived: true
        })
      }
    }

    // Delete category (will cascade to subcategories due to FK)
    await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Category deleted successfully',
        archived: false
      })
    }
  } catch (error) {
    console.error('Delete category error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error deleting category',
        message: error.message 
      })
    }
  }
}
