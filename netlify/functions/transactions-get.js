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

    // Get transaction ID from path
    const transactionId = event.queryStringParameters?.id

    if (!transactionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Transaction ID is required' })
      }
    }

    // Fetch transaction with all details
    const result = await pool.query(
      `SELECT 
        t.*,
        c.name as category_name,
        c.type as category_type,
        sc.name as sub_category_name,
        COALESCE(
          json_agg(
            json_build_object('id', tg.id, 'name', tg.name)
          ) FILTER (WHERE tg.id IS NOT NULL),
          '[]'
        ) as tags
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories sc ON t.sub_category_id = sc.id
       LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       WHERE t.id = $1 AND t.user_id = $2
       GROUP BY t.id, c.name, c.type, sc.name`,
      [transactionId, userId]
    )

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transaction: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Get transaction error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error fetching transaction' })
    }
  }
}
