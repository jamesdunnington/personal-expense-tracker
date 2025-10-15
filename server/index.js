import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Expense Tracker API is running' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`🔗 API URL: http://localhost:${PORT}/api`)
})

export default app