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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'PUT') {
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

    // Get tag ID from path
    const tagId = event.path.split('/').pop()
    const { name } = JSON.parse(event.body)

    // Validation
    if (!name || !name.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: name' })
      }
    }

    // Verify tag belongs to user
    const tagCheck = await pool.query(
      'SELECT id FROM tags WHERE id = $1 AND user_id = $2',
      [tagId, userId]
    )

    if (tagCheck.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Tag not found' })
      }
    }

    // Check if new name conflicts with existing tag
    const existingCheck = await pool.query(
      'SELECT id FROM tags WHERE user_id = $1 AND name = $2 AND id != $3',
      [userId, name.trim().toLowerCase(), tagId]
    )

    if (existingCheck.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tag with this name already exists' })
      }
    }

    // Update tag
    const result = await pool.query(
      `UPDATE tags 
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, name, created_at`,
      [name.trim().toLowerCase(), tagId, userId]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Tag updated successfully',
        tag: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Update tag error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error updating tag',
        message: error.message 
      })
    }
  }
}
