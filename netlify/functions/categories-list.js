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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
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

    // Get all categories with their subcategories
    const result = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.type,
        c.parent_id,
        c.is_archived,
        COALESCE(
          json_agg(
            json_build_object('id', sc.id, 'name', sc.name)
            ORDER BY sc.name
          ) FILTER (WHERE sc.id IS NOT NULL),
          '[]'
        ) as subcategories
       FROM categories c
       LEFT JOIN categories sc ON c.id = sc.parent_id AND sc.is_archived = false
       WHERE c.user_id = $1 AND c.parent_id IS NULL AND c.is_archived = false
       GROUP BY c.id, c.name, c.type, c.parent_id, c.is_archived
       ORDER BY c.type, c.name`,
      [userId]
    )

    // Organize categories by type
    const income = result.rows.filter(cat => cat.type === 'income')
    const expense = result.rows.filter(cat => cat.type === 'expense')

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        categories: {
          income,
          expense
        }
      })
    }
  } catch (error) {
    console.error('Get categories error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error fetching categories' })
    }
  }
}
