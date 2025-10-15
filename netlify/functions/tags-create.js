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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
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

    const { name } = JSON.parse(event.body)

    // Validation
    if (!name || !name.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: name' })
      }
    }

    // Check if tag with same name already exists for this user
    const existingCheck = await pool.query(
      'SELECT id FROM tags WHERE user_id = $1 AND name = $2',
      [userId, name.trim().toLowerCase()]
    )

    if (existingCheck.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tag with this name already exists' })
      }
    }

    // Create tag
    const result = await pool.query(
      `INSERT INTO tags (user_id, name) 
       VALUES ($1, $2) 
       RETURNING id, user_id, name, created_at`,
      [userId, name.trim().toLowerCase()]
    )

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Tag created successfully',
        tag: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Create tag error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error creating tag',
        message: error.message 
      })
    }
  }
}
