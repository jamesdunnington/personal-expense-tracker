# Expense Tracker

A full-stack PWA expense tracker designed for content creators in Singapore to manage personal and business finances, track income from multiple sources (display ads, affiliate marketing), categorize expenses with tax-deductible flags, and generate IRAS-compliant quarterly and yearly P&L reports.

## 🚀 Features

- 💰 Track income and expenses with tax-deductible flags
- 📊 Generate yearly, monthly, and quarterly P&L reports
- 🏷️ Dynamic categories and custom tags (#personal, #business)
- 📱 PWA - Install on Android devices
- 🔄 Offline functionality with sync
- 🔁 Recurring transactions (weekly, monthly, yearly)
- 📥 CSV import for bank statements
- 🤖 AI-powered insights (Phase 3)

## 🛠️ Tech Stack

- **Frontend:** Vite + React + Tailwind CSS
- **Database:** Neon (PostgreSQL)
- **Deployment:** Netlify
- **Authentication:** JWT-based
- **PWA:** Service Workers for offline support

## 📋 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jamesdunnington/expense-tracker.git
cd expense-tracker

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your credentials

# Set up database
# 1. Create a Neon database at https://neon.tech
# 2. Run the schema: psql <connection-string> < database/schema.sql
# 3. (Optional) Add seed data: psql <connection-string> < database/seed.sql

# Run development server
npm run dev