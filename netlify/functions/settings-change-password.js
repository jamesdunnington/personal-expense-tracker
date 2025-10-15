const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
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

    const { currentPassword, newPassword } = JSON.parse(event.body)

    if (!currentPassword || !newPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Current password and new password are required' })
      }
    }

    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'New password must be at least 6 characters' })
      }
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
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

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Current password is incorrect' })
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password changed successfully' })
    }
  } catch (error) {
    console.error('Change password error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to change password' })
    }
  }
}
