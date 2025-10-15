import pg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  })
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
    const { email, password } = JSON.parse(event.body)

    // Validation
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide email and password' })
      }
    }

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    const user = result.rows[0]

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Generate token
    const token = generateToken(user.id)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        }
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error during login' })
    }
  }
}
