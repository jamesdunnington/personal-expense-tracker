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

// Create default categories for new user
async function createDefaultCategories(userId) {
  try {
    // Income categories
    const incomeCategories = [
      { name: 'Display Ads', subcategories: ['AdSense', 'Mediavine', 'Other Display'] },
      { name: 'Affiliate Marketing', subcategories: ['Amazon Associates', 'Other Affiliate'] },
      { name: 'Sponsored Content', subcategories: [] },
      { name: 'Other Income', subcategories: [] }
    ]

    // Expense categories
    const expenseCategories = [
      'Software/Tools',
      'Utilities',
      'Internet',
      'Equipment',
      'Marketing',
      'Professional Services',
      'Personal - Non-deductible',
      'Grocery',
      'Subscriptions',
      'Other Expenses'
    ]

    // Insert income categories
    for (const category of incomeCategories) {
      const parentResult = await pool.query(
        'INSERT INTO categories (user_id, name, type, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, category.name, 'income', null]
      )

      const parentId = parentResult.rows[0].id

      // Insert subcategories
      for (const subcat of category.subcategories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, type, parent_id) VALUES ($1, $2, $3, $4)',
          [userId, subcat, 'income', parentId]
        )
      }
    }

    // Insert expense categories
    for (const category of expenseCategories) {
      await pool.query(
        'INSERT INTO categories (user_id, name, type, parent_id) VALUES ($1, $2, $3, $4)',
        [userId, category, 'expense', null]
      )
    }

    // Create default tags
    const defaultTags = ['personal', 'business', 'tax-review']
    for (const tag of defaultTags) {
      await pool.query(
        'INSERT INTO tags (user_id, name) VALUES ($1, $2)',
        [userId, tag]
      )
    }

    console.log(`✅ Created default categories and tags for user ${userId}`)
  } catch (error) {
    console.error('Error creating default categories:', error)
    throw error
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
    const { email, password } = JSON.parse(event.body)

    // Validation
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide email and password' })
      }
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters' })
      }
    }

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (userExists.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User already exists with this email' })
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    )

    const user = newUser.rows[0]

    // Create default categories for the new user
    await createDefaultCategories(user.id)

    // Generate token
    const token = generateToken(user.id)

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        }
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error during registration' })
    }
  }
}
