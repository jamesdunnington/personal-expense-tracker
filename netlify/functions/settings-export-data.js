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

    // Get user profile
    const userResult = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    // Get all transactions with categories
    const transactionsResult = await pool.query(
      `SELECT 
        t.id,
        t.amount,
        t.type,
        t.description,
        t.date,
        t.created_at,
        c.name as category_name,
        sc.name as subcategory_name,
        COALESCE(
          json_agg(
            json_build_object('id', tg.id, 'name', tg.name)
          ) FILTER (WHERE tg.id IS NOT NULL),
          '[]'
        ) as tags
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories sc ON t.subcategory_id = sc.id
       LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       WHERE t.user_id = $1
       GROUP BY t.id, c.name, sc.name
       ORDER BY t.date DESC`,
      [userId]
    )

    // Get all categories with subcategories
    const categoriesResult = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.type,
        c.icon,
        c.color,
        c.is_default,
        c.is_archived,
        c.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sc.id,
              'name', sc.name,
              'icon', sc.icon,
              'color', sc.color,
              'is_archived', sc.is_archived
            )
          ) FILTER (WHERE sc.id IS NOT NULL),
          '[]'
        ) as subcategories
       FROM categories c
       LEFT JOIN categories sc ON sc.parent_id = c.id
       WHERE c.user_id = $1 AND c.parent_id IS NULL
       GROUP BY c.id
       ORDER BY c.name`,
      [userId]
    )

    // Get all tags
    const tagsResult = await pool.query(
      `SELECT 
        id,
        name,
        color,
        created_at,
        (SELECT COUNT(*) FROM transaction_tags WHERE tag_id = tags.id) as usage_count
       FROM tags
       WHERE user_id = $1
       ORDER BY name`,
      [userId]
    )

    // Get user settings
    const settingsResult = await pool.query(
      `SELECT currency, date_format, theme, language, created_at, updated_at
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    )

    const exportData = {
      exported_at: new Date().toISOString(),
      user: userResult.rows[0],
      settings: settingsResult.rows[0] || null,
      statistics: {
        total_transactions: transactionsResult.rows.length,
        total_categories: categoriesResult.rows.length,
        total_tags: tagsResult.rows.length
      },
      transactions: transactionsResult.rows,
      categories: categoriesResult.rows,
      tags: tagsResult.rows
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="expense-tracker-export-${new Date().toISOString().split('T')[0]}.json"`
      },
      body: JSON.stringify(exportData, null, 2)
    }
  } catch (error) {
    console.error('Export data error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to export data' })
    }
  }
}
