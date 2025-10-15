const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Verify JWT token
    const token = event.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No token provided' })
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    // Get user profile and settings
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.created_at,
              COALESCE(s.currency, 'SGD') as currency,
              COALESCE(s.date_format, 'dd/MM/yyyy') as date_format,
              COALESCE(s.theme, 'light') as theme,
              COALESCE(s.language, 'en') as language
       FROM users u
       LEFT JOIN user_settings s ON u.id = s.user_id
       WHERE u.id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    const user = userResult.rows[0]

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
        settings: {
          currency: user.currency,
          date_format: user.date_format,
          theme: user.theme,
          language: user.language
        }
      })
    }
  } catch (error) {
    console.error('Get settings error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get settings',
        details: error.message 
      })
    }
  }
}
