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

    // Get category ID from path
    const categoryId = event.path.split('/').pop()
    const { name, isArchived } = JSON.parse(event.body)

    // Validation
    if (!name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: name' })
      }
    }

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id, type FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    )

    if (categoryCheck.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Category not found' })
      }
    }

    // Check if new name conflicts with existing category
    const existingCheck = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2 AND type = $3 AND id != $4',
      [userId, name.trim(), categoryCheck.rows[0].type, categoryId]
    )

    if (existingCheck.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Category with this name already exists' })
      }
    }

    // Update category
    const result = await pool.query(
      `UPDATE categories 
       SET name = $1, is_archived = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, name, type, parent_id, is_archived, created_at`,
      [name.trim(), isArchived || false, categoryId, userId]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Category updated successfully',
        category: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Update category error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error updating category',
        message: error.message 
      })
    }
  }
}
