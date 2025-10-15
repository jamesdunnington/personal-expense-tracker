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

    // Get transaction ID from query params
    const transactionId = event.queryStringParameters?.id

    if (!transactionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Transaction ID is required' })
      }
    }

    // Verify transaction belongs to user
    const transactionCheck = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    )

    if (transactionCheck.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      }
    }

    // Delete transaction tags first (foreign key constraint)
    await pool.query(
      'DELETE FROM transaction_tags WHERE transaction_id = $1',
      [transactionId]
    )

    // Delete transaction
    await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Transaction deleted successfully'
      })
    }
  } catch (error) {
    console.error('Delete transaction error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error deleting transaction' })
    }
  }
}
