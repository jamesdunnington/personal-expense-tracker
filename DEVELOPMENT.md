# Development Guide

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd personal-expense-tracker
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env and add your database connection:
# DATABASE_URL=postgresql://user:password@host/database
# JWT_SECRET=your-random-secret-key-here
```

### 3. Database Setup

#### Option A: Using Neon (Recommended)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Run the schema:
```bash
# On Windows (PowerShell):
$env:PGPASSWORD='your-password'; psql -h your-host -U your-user -d your-db -f database/schema.sql

# On Mac/Linux:
psql your-connection-string < database/schema.sql
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb expense_tracker

# Run schema
psql expense_tracker < database/schema.sql

# Optional: Add seed data
psql expense_tracker < database/seed.sql
```

### 4. Run Development Servers

#### Terminal 1 - Frontend
```bash
npm run dev
```
Opens at http://localhost:5173

#### Terminal 2 - Backend API
```bash
npm run server:dev
```
API runs at http://localhost:3000

---

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-10-15T..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

### Health Check
```http
GET /api/health
```

---

## Frontend Development

### Adding a New Page

1. Create component in `src/pages/`
```jsx
// src/pages/NewPage.jsx
const NewPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Page</h1>
    </div>
  )
}

export default NewPage
```

2. Add route in `src/App.jsx`
```jsx
import NewPage from './pages/NewPage'

// Inside Routes component:
<Route path="/new-page" element={<NewPage />} />
```

3. Add navigation in `src/components/Layout.jsx`

### Using Tailwind Classes

Common patterns:
```jsx
// Button
<button className="btn-primary">Click Me</button>

// Input
<input className="input-field" />

// Card
<div className="card">
  Content here
</div>

// Stat Card (with colored left border)
<div className="stat-card border-success-500">
  Stats here
</div>
```

---

## Backend Development

### Adding New API Routes

1. Create controller in `server/controllers/`
```javascript
// server/controllers/transactionController.js
import pool from '../db.js'

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    )
    res.json({ transactions: result.rows })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
```

2. Create routes in `server/routes/`
```javascript
// server/routes/transactions.js
import express from 'express'
import { getTransactions } from '../controllers/transactionController.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, getTransactions)

export default router
```

3. Register routes in `server/index.js`
```javascript
import transactionRoutes from './routes/transactions.js'

app.use('/api/transactions', transactionRoutes)
```

---

## Testing

### Testing Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (use token from login response)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Database Queries

### Common Queries for Development

```sql
-- View all users
SELECT * FROM users;

-- View categories for a user
SELECT * FROM categories WHERE user_id = 1 ORDER BY type, name;

-- View transactions with category names
SELECT t.*, c.name as category_name 
FROM transactions t 
LEFT JOIN categories c ON t.category_id = c.id 
WHERE t.user_id = 1 
ORDER BY t.date DESC;

-- View tags for a transaction
SELECT t.name 
FROM tags t 
JOIN transaction_tags tt ON t.id = tt.tag_id 
WHERE tt.transaction_id = 1;
```

---

## Troubleshooting

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection errors
1. Check `.env` file has correct DATABASE_URL
2. Verify database is running
3. Check firewall/network settings for Neon

### CORS errors
- Ensure backend `FRONTEND_URL` in `.env` matches frontend URL
- Check CORS configuration in `server/index.js`

### JWT errors
- Generate a secure JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Update `.env` file with the generated secret

---

## Production Deployment

### Frontend (Netlify)

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

### Backend Options

#### Option 1: Netlify Functions
- Move API to `netlify/functions/`
- Use serverless functions

#### Option 2: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway up
```

---

## Code Style

- Use ES6+ features (const/let, arrow functions, async/await)
- Use meaningful variable names
- Add comments for complex logic
- Keep components small and focused
- Use proper error handling

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/transaction-management

# Commit changes
git add .
git commit -m "feat: add transaction CRUD operations"

# Push to remote
git push origin feature/transaction-management

# Create pull request on GitHub
```

---

## Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Database Docs](https://neon.tech/docs/introduction)

---

**Need help?** Check PROJECT_STATUS.md for current progress and PRD.md for full feature specifications.