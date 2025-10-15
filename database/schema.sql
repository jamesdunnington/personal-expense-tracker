-- Personal Expense Tracker Database Schema
-- Database: PostgreSQL (Neon)

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS transaction_tags CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS recurring_rules CASCADE;
DROP TABLE IF EXISTS import_history CASCADE;
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories Table (supports hierarchical categories with parent_id)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name, type, parent_id)
);

-- Tags Table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Recurring Rules Table (must be created before transactions)
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

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule_id INTEGER REFERENCES recurring_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Transaction Tags (many-to-many relationship)
CREATE TABLE transaction_tags (
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
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

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_subcategory_id ON transactions(subcategory_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_recurring_rules_user_id ON recurring_rules(user_id);
CREATE INDEX idx_recurring_rules_next_occurrence ON recurring_rules(next_occurrence);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for new users (to be done via application logic)
-- This will be handled in the user registration process