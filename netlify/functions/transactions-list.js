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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
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

    // Parse query parameters for filtering
    const params = event.queryStringParameters || {}
    let { 
      type, 
      categoryId, 
      startDate, 
      endDate, 
      search,
      limit = 100,
      offset = 0 
    } = params

    // Convert empty strings to null
    type = type && type.trim() ? type : null
    categoryId = categoryId && categoryId.trim() ? categoryId : null
    startDate = startDate && startDate.trim() ? startDate : null
    endDate = endDate && endDate.trim() ? endDate : null
    search = search && search.trim() ? search : null

    // Build dynamic query - simplified without FILTER clause
    let query = `
      SELECT 
        t.id,
        t.user_id,
        t.date,
        t.amount,
        t.type,
        t.category_id,
        t.subcategory_id,
        t.description,
        t.is_tax_deductible,
        t.created_at,
        t.updated_at,
        c.name as category_name,
        c.type as category_type,
        sc.name as subcategory_name,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name))
            FROM transaction_tags tt
            JOIN tags tg ON tt.tag_id = tg.id
            WHERE tt.transaction_id = t.id
          ),
          '[]'::json
        ) as tags
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN categories sc ON t.subcategory_id = sc.id
      WHERE t.user_id = $1
    `

    const queryParams = [userId]
    let paramIndex = 2

    // Add filters
    if (type) {
      query += ` AND t.type = $${paramIndex}`
      queryParams.push(type)
      paramIndex++
    }

    if (categoryId) {
      query += ` AND (t.category_id = $${paramIndex} OR t.sub_category_id = $${paramIndex})`
      queryParams.push(categoryId)
      paramIndex++
    }

    if (startDate) {
      query += ` AND t.date >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND t.date <= $${paramIndex}`
      queryParams.push(endDate)
      paramIndex++
    }

    if (search) {
      query += ` AND t.description ILIKE $${paramIndex}`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    query += `
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(parseInt(limit), parseInt(offset))

    // Execute query
    const result = await pool.query(query, queryParams)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM transactions WHERE user_id = $1'
    const countParams = [userId]
    let countParamIndex = 2

    if (type) {
      countQuery += ` AND type = $${countParamIndex}`
      countParams.push(type)
      countParamIndex++
    }

    if (categoryId) {
      countQuery += ` AND (category_id = $${countParamIndex} OR sub_category_id = $${countParamIndex})`
      countParams.push(categoryId)
      countParamIndex++
    }

    if (startDate) {
      countQuery += ` AND date >= $${countParamIndex}`
      countParams.push(startDate)
      countParamIndex++
    }

    if (endDate) {
      countQuery += ` AND date <= $${countParamIndex}`
      countParams.push(endDate)
      countParamIndex++
    }

    if (search) {
      countQuery += ` AND description ILIKE $${countParamIndex}`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    const countResult = await pool.query(countQuery, countParams)
    const totalCount = parseInt(countResult.rows[0].count)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transactions: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + result.rows.length < totalCount
        }
      })
    }
  } catch (error) {
    console.error('List transactions error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error fetching transactions',
        message: error.message 
      })
    }
  }
}
