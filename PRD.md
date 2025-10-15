# Personal & Business Expense Tracker for Content Creators

**Version:** 1.0  
**Date:** 2025-01-15  
**Project Owner:** jamesdunnington  
**Status:** Ready for Development

---

## **1. EXECUTIVE SUMMARY**

A full-stack PWA expense tracker designed for content creators in Singapore to manage personal and business finances, track income from multiple sources (display ads, affiliate marketing), categorize expenses with tax-deductible flags, and generate IRAS-compliant quarterly and yearly P&L reports. The system supports multi-device sync, offline functionality, CSV imports, and future AI-powered financial insights.

---

## **2. TARGET USER**

- **Primary User:** Content Creator (jamesdunnington)
- **Location:** Singapore
- **Use Case:** Daily expense/income logging, tax compliance (IRAS), quarterly reporting
- **Devices:** Mobile (Android PWA) + Desktop (Web)
- **Technical Proficiency:** Moderate (comfortable with CLI tools, GitHub, Netlify)

---

## **3. CORE FEATURES & REQUIREMENTS**

### **3.1 User Authentication & Multi-Device Sync**

**Priority:** Phase 1 (MVP)

- **Authentication Method:** Email/Password (simpler setup, no complex OAuth console configuration)
- **Features:**
  - User registration with email verification
  - Secure login (JWT-based tokens)
  - Password reset via email
  - Session persistence across devices
  - Real-time sync across mobile and desktop
  - Logout functionality

**Technical Notes:**
- Store authentication tokens securely
- Use Neon PostgreSQL for user data
- Implement password hashing (bcrypt)

---

### **3.2 Transaction Management**

**Priority:** Phase 1 (MVP)

#### **Transaction Types:**
1. **Income**
2. **Expense**

#### **Transaction Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Date | Date | Yes | Calendar picker |
| Amount | Decimal (SGD) | Yes | Positive numbers only |
| Type | Enum | Yes | Income or Expense |
| Category | Dropdown | Yes | See section 3.3 |
| Sub-category | Dropdown | Yes | Dynamic based on category |
| Description | Text | Optional | Max 500 characters |
| Tax-deductible | Boolean | Yes | Checkbox (default: false) |
| Tags | Multi-select | Optional | Custom tags (e.g., #personal, #business) |
| Is Recurring | Boolean | No | Set if transaction is recurring |

#### **Transaction Actions:**
- ✅ Add new transaction
- ✅ Edit existing transaction
- ✅ Delete transaction (with confirmation)
- ✅ Duplicate transaction (quick re-entry)
- ✅ Bulk delete (select multiple)
- ✅ Search & Filter (by date range, category, tags, tax-deductible status)

---

### **3.3 Dynamic Category Management**

**Priority:** Phase 1 (MVP)

#### **Default Income Categories:**
- Display Ads (Sub: AdSense, Mediavine, Other)
- Affiliate Marketing (Sub: Amazon, Other)
- Sponsored Content
- Other Income

#### **Default Expense Categories:**
- Software/Tools
- Utilities
- Internet
- Equipment
- Marketing
- Professional Services
- Personal - Non-deductible
- Grocery
- Subscriptions
- Other Expenses

#### **Category Management Features:**
- ✅ Add new categories/sub-categories
- ✅ Edit category names
- ✅ Delete categories with smart handling:
  - **If category has transactions:** Archive category (remains visible for historical transactions only)
  - **If category is empty:** Permanently delete
  - Show warning with transaction count before deletion
- ✅ Reassign transactions to different categories during edit

---

### **3.4 Tag System**

**Priority:** Phase 1 (MVP)

- **Purpose:** Flexible categorization beyond primary categories
- **Use Cases:** 
  - #personal vs #business
  - #project-name
  - #client-name
  - #tax-review (items needing review)

- **Features:**
  - Create tags on-the-fly during transaction entry
  - Multi-tag support (one transaction can have multiple tags)
  - Tag-based filtering in reports
  - Tag management page (rename, delete, merge tags)

---

### **3.5 Recurring Transactions**

**Priority:** Phase 1 (MVP)

#### **Frequency Options:**
- Weekly (every 7 days)
- Monthly (same day each month)
- Yearly (same date each year)

#### **Recurring Transaction Features:**
- Set up recurring rule during transaction creation
- Auto-generate transactions on schedule (via backend cron job or scheduled task)
- **Management:**
  - View all recurring rules in dedicated page
  - Edit recurring rule (amount, category, frequency)
  - Pause recurring rule (stop auto-generation temporarily)
  - Delete recurring rule (stop future generations)
  - Option to delete/keep existing generated transactions

#### **UI Flow:**
1. Create transaction as normal
2. Toggle "Make Recurring"
3. Select frequency
4. Set start date and optional end date
5. Save → System generates first occurrence immediately, schedules future ones

---

### **3.6 Offline Functionality**

**Priority:** Phase 1 (MVP)

**Critical Requirement:** App must function without internet connection

#### **Offline Capabilities:**
- View recent transactions (cached locally)
- Add new transactions (stored locally)
- Edit existing transactions (queued for sync)
- View cached reports

#### **Sync Behavior:**
- When online: Auto-sync every 30 seconds
- When back online: Upload queued transactions in chronological order
- Conflict resolution: Last-write-wins (with timestamp)
- Visual indicator: Show "Offline" badge and pending sync count

**Technical Implementation:**
- Service Workers for offline caching
- IndexedDB for local transaction storage
- Background sync API

---

### **3.7 CSV Import**

**Priority:** Phase 2

#### **Import Features:**
- Upload CSV file (bank statements)
- Column mapping interface:
  - Date → Date field
  - Amount → Amount field
  - Description → Description field
  - Auto-detect common formats (SGD banks)
  
- **Import Preview:**
  - Show first 10 rows before import
  - Allow manual edits before confirmation
  - Duplicate detection (by date + amount + description similarity)

- **Post-Import:**
  - Bulk-assign category to imported transactions
  - Bulk-add tags to imported batch
  - Import history log (track what was imported when)

#### **Supported CSV Format:**
```csv
Date,Description,Amount,Type
2025-01-15,Netflix Subscription,-15.99,Expense
2025-01-20,AdSense Payment,450.00,Income
```

---

### **3.8 Professional P&L Reporting**

**Priority:** Phase 1 (MVP)

#### **Report Types:**

##### **A) Yearly P&L Statement**
- Calendar year: January 1 - December 31
- **Structure:**
  ```
  INCOME
    Display Ads
      - AdSense: $X,XXX.XX
      - Mediavine: $X,XXX.XX
    Affiliate Marketing
      - Amazon: $X,XXX.XX
    Total Income: $XX,XXX.XX
  
  EXPENSES
    Software/Tools: $X,XXX.XX
    Utilities: $X,XXX.XX
    Internet: $X,XXX.XX
    [... all expense categories]
    Total Expenses: $XX,XXX.XX
  
  NET PROFIT/LOSS: $XX,XXX.XX
  
  TAX SUMMARY
    Tax-Deductible Expenses: $XX,XXX.XX
    Non-Deductible Expenses: $XX,XXX.XX
  ```

##### **B) Monthly P&L Breakdown**
- 12-month table view
- Columns: Month | Income | Expenses | Net Profit/Loss | Tax-Deductible
- Month-over-month comparison percentages

##### **C) Quarterly Reports (IRAS Compliance)**
- Q1: Jan-Mar
- Q2: Apr-Jun
- Q3: Jul-Sep
- Q4: Oct-Dec

- **Each Quarter Shows:**
  - Total income (by sub-category)
  - Total expenses (by sub-category)
  - Tax-deductible expense summary
  - Net profit/loss

#### **Export Options:**
- 📄 PDF (formatted for IRAS submission)
- 📊 CSV (raw data)
- 📈 Excel-compatible (.xlsx)

#### **Report Filters:**
- Date range selector
- Include/exclude specific categories
- Tax-deductible only
- Filter by tags (#business only)

---

### **3.9 Dashboard (Landing Page)**

**Priority:** Phase 1 (MVP)

#### **Dashboard Components:**

**Top Section:**
- Current month net profit/loss (large display)
- Year-to-date net profit/loss
- Quick stats: Total income (MTD), Total expenses (MTD)

**Middle Section:**
- Recent transactions (last 10)
- Quick-add button (floating action button)

**Bottom Section:**
- Monthly trend chart (line graph: income vs expenses, last 6 months)
- Top 5 expense categories (pie chart or bar chart)

**Actions:**
- ➕ Quick Add Transaction (FAB - Floating Action Button)
- 📊 View Full Reports
- ⚙️ Settings

---

### **3.10 Data Visualization**

**Priority:** Phase 2

- **Monthly Spending Trends:** Line chart (income vs expenses over time)
- **Category Breakdown:** Pie chart (expense distribution by category)
- **Income Sources:** Bar chart (compare AdSense vs Affiliate vs Others)
- **Tax-Deductible Overview:** Donut chart (deductible vs non-deductible)

**Library:** Chart.js or Recharts (React-compatible)

---

## **4. FUTURE ENHANCEMENTS**

### **4.1 AI-Powered Insights (OpenAI Integration)**

**Priority:** Phase 3 (3 months after launch)

#### **Features:**
- **Expense Analysis:**
  - "You spent 30% more on Software/Tools this month compared to last month"
  - "Your grocery spending is trending upward"
  
- **Money-Saving Suggestions:**
  - "Consider annual billing for subscriptions to save 15%"
  - "You have 3 overlapping software tools that could be consolidated"

- **Tax Optimization:**
  - "This expense may qualify as tax-deductible under Singapore IRAS rules"
  - "Review these transactions for potential tax deductions"

- **Anomaly Detection:**
  - "Unusual expense detected: $500 on Utilities (typical: $120)"

#### **Implementation:**
- Settings page: Add OpenAI API key input
- Chat interface: Ask questions about finances
- Scheduled analysis: Weekly AI-generated insights email

**Technical:**
- Use OpenAI GPT-4 API
- Send anonymized transaction data for analysis
- Store API key in .env (encrypted in database)

---

## **5. TECHNICAL SPECIFICATIONS**

### **5.1 Tech Stack**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Vite + React | Fast development, modern build tool |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Backend | Neon PostgreSQL | Serverless Postgres database |
| API | REST API (or GraphQL) | Backend communication |
| Deployment | Netlify | Frontend hosting + serverless functions |
| Authentication | JWT + bcrypt | Secure token-based auth |
| PWA | Workbox + Service Workers | Offline functionality, installable |
| Version Control | GitHub | Code repository |
| CLI Tools | GitHub CLI, Neon CLI, Netlify CLI | Deployment automation |

---

### **5.2 Database Schema**

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tags Table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule_id INTEGER REFERENCES recurring_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Transaction Tags (many-to-many)
CREATE TABLE transaction_tags (
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Recurring Rules Table
CREATE TABLE recurring_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CSV Import History
CREATE TABLE import_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  rows_imported INTEGER,
  imported_at TIMESTAMP DEFAULT NOW()
);

-- OpenAI Settings (Phase 3)
CREATE TABLE ai_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  api_key_encrypted TEXT,
  last_analysis TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **5.3 Environment Variables (.env.example)**

```env
# Database
DATABASE_URL=postgresql://user:password@host/database
NEON_DATABASE_URL=

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Email (for password reset)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=

# OpenAI (Phase 3)
OPENAI_API_KEY=

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

---

## **6. DEVELOPMENT PHASES**

### **Phase 1: MVP (Core Functionality)** - 4-6 weeks

**Week 1-2: Setup & Authentication**
- [ ] Initialize Vite + React project
- [ ] Set up Tailwind CSS
- [ ] Set up Neon database
- [ ] Implement user authentication (email/password)
- [ ] Create login/register UI
- [ ] Deploy to Netlify

**Week 3-4: Transaction Management**
- [ ] Design and implement database schema
- [ ] Create transaction CRUD API endpoints
- [ ] Build transaction list UI
- [ ] Build add/edit transaction forms
- [ ] Implement category management
- [ ] Implement tag system
- [ ] Add search & filter functionality

**Week 5-6: Reports & PWA**
- [ ] Build dashboard with stats
- [ ] Implement yearly P&L report
- [ ] Implement monthly breakdown
- [ ] Implement quarterly reports
- [ ] Configure PWA (manifest + service worker)
- [ ] Test offline functionality
- [ ] Add dummy seed data for testing

---

### **Phase 2: Advanced Features** - 3-4 weeks

- [ ] Recurring transactions
- [ ] CSV import
- [ ] Data visualization charts

---

### **Phase 3: AI Integration** - 2-3 weeks (3 months after launch)

- [ ] OpenAI API integration
- [ ] AI-powered financial insights
- [ ] Chat interface

---

## **7. TESTING DATA**

```javascript
const dummyData = [
  { date: '2025-01-15', type: 'income', category: 'Display Ads', subCategory: 'AdSense', amount: 450.00, taxDeductible: false, tags: ['business'], description: 'January AdSense payout' },
  { date: '2025-01-20', type: 'income', category: 'Affiliate Marketing', subCategory: 'Amazon', amount: 125.50, taxDeductible: false, tags: ['business'], description: 'Amazon Associates commission' },
  { date: '2025-01-05', type: 'expense', category: 'Software/Tools', amount: 29.99, taxDeductible: true, tags: ['business'], description: 'Adobe Creative Cloud subscription' },
  { date: '2025-01-10', type: 'expense', category: 'Internet', amount: 59.90, taxDeductible: true, tags: ['business'], description: 'Singtel Fiber 1Gbps', recurring: true, frequency: 'monthly' },
  { date: '2025-01-12', type: 'expense', category: 'Utilities', amount: 120.00, taxDeductible: false, tags: ['personal'], description: 'SP Services electricity bill', recurring: true, frequency: 'monthly' },
  { date: '2025-01-18', type: 'expense', category: 'Grocery', amount: 85.40, taxDeductible: false, tags: ['personal'], description: 'FairPrice grocery shopping' },
];
```

---

## **8. GLOSSARY**

- **PWA:** Progressive Web App
- **IRAS:** Inland Revenue Authority of Singapore
- **P&L:** Profit & Loss statement
- **JWT:** JSON Web Token
- **SGD:** Singapore Dollar

---

**PRD Prepared By:** GitHub Copilot  
**PRD Approved By:** jamesdunnington  
**Date:** 2025-01-15  
**Status:** ✅ Approved - Ready for Development