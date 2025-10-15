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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  }

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
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

    const { name, currency, date_format, theme, language } = JSON.parse(event.body)

    // Update user name if provided
    if (name !== undefined) {
      await pool.query(
        `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
        [name, userId]
      )
    }

    // Upsert user settings if any preference provided
    if (currency !== undefined || date_format !== undefined || theme !== undefined || language !== undefined) {
      await pool.query(
        `INSERT INTO user_settings (user_id, currency, date_format, theme, language)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           currency = COALESCE($2, user_settings.currency),
           date_format = COALESCE($3, user_settings.date_format),
           theme = COALESCE($4, user_settings.theme),
           language = COALESCE($5, user_settings.language),
           updated_at = NOW()`,
        [userId, currency, date_format, theme, language]
      )
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Settings updated successfully',
        settings: { currency, date_format, theme, language }
      })
    }
  } catch (error) {
    console.error('Update settings error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update settings' })
    }
  }
}
