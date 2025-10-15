import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '7d'
  })
}

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' })
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

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Server error during registration' })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' })
    }

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken(user.id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error during login' })
  }
}

// Get current user
export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Server error' })
  }
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