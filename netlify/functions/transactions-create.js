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

    const { 
      date, 
      amount, 
      type, 
      categoryId, 
      subCategoryId, 
      description, 
      isTaxDeductible,
      tags 
    } = JSON.parse(event.body)
    
    console.log('Creating transaction:', { date, amount, type, categoryId, subCategoryId, userId })

    // Validation
    if (!date || !amount || !type || !categoryId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: date, amount, type, categoryId' })
      }
    }

    if (type !== 'income' && type !== 'expense') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Type must be either "income" or "expense"' })
      }
    }

    if (amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount must be greater than 0' })
      }
    }

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    )

    console.log('Category check:', { categoryId, userId, found: categoryCheck.rows.length })

    if (categoryCheck.rows.length === 0) {
      // Check if user has any categories at all
      const userCategoriesCount = await pool.query(
        'SELECT COUNT(*) FROM categories WHERE user_id = $1',
        [userId]
      )
      console.log('User total categories:', userCategoriesCount.rows[0].count)
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Invalid category. User has ${userCategoriesCount.rows[0].count} categories.` 
        })
      }
    }

    // Verify sub-category if provided
    if (subCategoryId) {
      const subCategoryCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND parent_id = $3',
        [subCategoryId, userId, categoryId]
      )

      if (subCategoryCheck.rows.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid sub-category' })
        }
      }
    }

    // Create transaction
    const result = await pool.query(
      `INSERT INTO transactions 
        (user_id, date, amount, type, category_id, subcategory_id, description, is_tax_deductible) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, user_id, date, amount, type, category_id, subcategory_id, description, is_tax_deductible, created_at, updated_at`,
      [userId, date, amount, type, categoryId, subCategoryId || null, description || null, isTaxDeductible || false]
    )

    const transaction = result.rows[0]

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        // Verify tag belongs to user
        const tagCheck = await pool.query(
          'SELECT id FROM tags WHERE id = $1 AND user_id = $2',
          [tagId, userId]
        )

        if (tagCheck.rows.length > 0) {
          await pool.query(
            'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)',
            [transaction.id, tagId]
          )
        }
      }
    }

    // Fetch complete transaction with category and tags - simplified without FILTER
    const completeTransaction = await pool.query(
      `SELECT 
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
       WHERE t.id = $1`,
      [transaction.id]
    )

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Transaction created successfully',
        transaction: completeTransaction.rows[0]
      })
    }
  } catch (error) {
    console.error('Create transaction error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error creating transaction',
        detail: error.message 
      })
    }
  }
}
