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

    const { name, type, parentId } = JSON.parse(event.body)

    // Validation
    if (!name || !type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: name, type' })
      }
    }

    if (type !== 'income' && type !== 'expense') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Type must be either "income" or "expense"' })
      }
    }

    // Check if category with same name already exists for this user
    const existingCheck = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2 AND type = $3 AND (parent_id = $4 OR (parent_id IS NULL AND $4 IS NULL))',
      [userId, name.trim(), type, parentId || null]
    )

    if (existingCheck.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Category with this name already exists' })
      }
    }

    // If parentId provided, verify it belongs to user and is same type
    if (parentId) {
      const parentCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND type = $3 AND parent_id IS NULL',
        [parentId, userId, type]
      )

      if (parentCheck.rows.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid parent category' })
        }
      }
    }

    // Create category
    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type, parent_id, is_archived) 
       VALUES ($1, $2, $3, $4, false) 
       RETURNING id, user_id, name, type, parent_id, is_archived, created_at`,
      [userId, name.trim(), type, parentId || null]
    )

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Category created successfully',
        category: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Create category error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error creating category',
        message: error.message 
      })
    }
  }
}
