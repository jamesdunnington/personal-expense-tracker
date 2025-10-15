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

    const body = JSON.parse(event.body)
    const { 
      id,
      date, 
      amount, 
      type, 
      categoryId, 
      subCategoryId, 
      description, 
      isTaxDeductible,
      tags 
    } = body

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Transaction ID is required' })
      }
    }

    // Verify transaction belongs to user
    const transactionCheck = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (transactionCheck.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      }
    }

    // Validation
    if (amount && amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount must be greater than 0' })
      }
    }

    if (type && type !== 'income' && type !== 'expense') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Type must be either "income" or "expense"' })
      }
    }

    // Verify category if provided
    if (categoryId) {
      const categoryCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
        [categoryId, userId]
      )

      if (categoryCheck.rows.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid category' })
        }
      }
    }

    // Build update query dynamically
    const updates = []
    const values = []
    let paramIndex = 1

    if (date !== undefined) {
      updates.push(`date = $${paramIndex}`)
      values.push(date)
      paramIndex++
    }

    if (amount !== undefined) {
      updates.push(`amount = $${paramIndex}`)
      values.push(amount)
      paramIndex++
    }

    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`)
      values.push(type)
      paramIndex++
    }

    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex}`)
      values.push(categoryId)
      paramIndex++
    }

    if (subCategoryId !== undefined) {
      updates.push(`sub_category_id = $${paramIndex}`)
      values.push(subCategoryId || null)
      paramIndex++
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(description || null)
      paramIndex++
    }

    if (isTaxDeductible !== undefined) {
      updates.push(`is_tax_deductible = $${paramIndex}`)
      values.push(isTaxDeductible)
      paramIndex++
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Update transaction
    if (updates.length > 0) {
      values.push(id, userId)
      const query = `
        UPDATE transactions 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `
      await pool.query(query, values)
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await pool.query('DELETE FROM transaction_tags WHERE transaction_id = $1', [id])

      // Add new tags
      if (Array.isArray(tags) && tags.length > 0) {
        for (const tagId of tags) {
          // Verify tag belongs to user
          const tagCheck = await pool.query(
            'SELECT id FROM tags WHERE id = $1 AND user_id = $2',
            [tagId, userId]
          )

          if (tagCheck.rows.length > 0) {
            await pool.query(
              'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)',
              [id, tagId]
            )
          }
        }
      }
    }

    // Fetch updated transaction with all details
    const result = await pool.query(
      `SELECT 
        t.*,
        c.name as category_name,
        c.type as category_type,
        sc.name as sub_category_name,
        COALESCE(
          json_agg(
            json_build_object('id', tg.id, 'name', tg.name)
          ) FILTER (WHERE tg.id IS NOT NULL),
          '[]'
        ) as tags
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories sc ON t.sub_category_id = sc.id
       LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       WHERE t.id = $1
       GROUP BY t.id, c.name, c.type, sc.name`,
      [id]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Transaction updated successfully',
        transaction: result.rows[0]
      })
    }
  } catch (error) {
    console.error('Update transaction error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error updating transaction' })
    }
  }
}
