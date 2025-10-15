-- Seed data for default categories
-- This file contains the default income and expense categories from the PRD

-- Note: user_id should be replaced with actual user ID during user registration
-- These categories will be inserted when a new user registers

-- Income Categories (parent categories)
INSERT INTO categories (user_id, name, type, parent_id) VALUES
(1, 'Display Ads', 'income', NULL),
(1, 'Affiliate Marketing', 'income', NULL),
(1, 'Sponsored Content', 'income', NULL),
(1, 'Other Income', 'income', NULL);

-- Income Sub-categories
-- Display Ads sub-categories
INSERT INTO categories (user_id, name, type, parent_id) VALUES
(1, 'AdSense', 'income', (SELECT id FROM categories WHERE name = 'Display Ads' AND user_id = 1)),
(1, 'Mediavine', 'income', (SELECT id FROM categories WHERE name = 'Display Ads' AND user_id = 1)),
(1, 'Other Display', 'income', (SELECT id FROM categories WHERE name = 'Display Ads' AND user_id = 1));

-- Affiliate Marketing sub-categories
INSERT INTO categories (user_id, name, type, parent_id) VALUES
(1, 'Amazon Associates', 'income', (SELECT id FROM categories WHERE name = 'Affiliate Marketing' AND user_id = 1)),
(1, 'Other Affiliate', 'income', (SELECT id FROM categories WHERE name = 'Affiliate Marketing' AND user_id = 1));

-- Expense Categories (parent categories)
INSERT INTO categories (user_id, name, type, parent_id) VALUES
(1, 'Software/Tools', 'expense', NULL),
(1, 'Utilities', 'expense', NULL),
(1, 'Internet', 'expense', NULL),
(1, 'Equipment', 'expense', NULL),
(1, 'Marketing', 'expense', NULL),
(1, 'Professional Services', 'expense', NULL),
(1, 'Personal - Non-deductible', 'expense', NULL),
(1, 'Grocery', 'expense', NULL),
(1, 'Subscriptions', 'expense', NULL),
(1, 'Other Expenses', 'expense', NULL);

-- Sample Tags
INSERT INTO tags (user_id, name) VALUES
(1, 'personal'),
(1, 'business'),
(1, 'tax-review'),
(1, 'project-expense'),
(1, 'client-expense');

-- Sample Transactions (for testing)
INSERT INTO transactions (user_id, date, amount, type, category_id, description, is_tax_deductible, is_recurring) VALUES
(1, '2025-01-15', 450.00, 'income', 
  (SELECT id FROM categories WHERE name = 'AdSense' AND user_id = 1), 
  'January AdSense payout', FALSE, FALSE),

(1, '2025-01-20', 125.50, 'income', 
  (SELECT id FROM categories WHERE name = 'Amazon Associates' AND user_id = 1), 
  'Amazon Associates commission', FALSE, FALSE),

(1, '2025-01-05', 29.99, 'expense', 
  (SELECT id FROM categories WHERE name = 'Software/Tools' AND user_id = 1), 
  'Adobe Creative Cloud subscription', TRUE, TRUE),

(1, '2025-01-10', 59.90, 'expense', 
  (SELECT id FROM categories WHERE name = 'Internet' AND user_id = 1), 
  'Singtel Fiber 1Gbps', TRUE, TRUE),

(1, '2025-01-12', 120.00, 'expense', 
  (SELECT id FROM categories WHERE name = 'Utilities' AND user_id = 1), 
  'SP Services electricity bill', FALSE, TRUE),

(1, '2025-01-18', 85.40, 'expense', 
  (SELECT id FROM categories WHERE name = 'Grocery' AND user_id = 1), 
  'FairPrice grocery shopping', FALSE, FALSE);

-- Link transactions to tags
INSERT INTO transaction_tags (transaction_id, tag_id) VALUES
-- AdSense payment -> business
((SELECT id FROM transactions WHERE description = 'January AdSense payout'), 
 (SELECT id FROM tags WHERE name = 'business' AND user_id = 1)),

-- Amazon commission -> business
((SELECT id FROM transactions WHERE description = 'Amazon Associates commission'), 
 (SELECT id FROM tags WHERE name = 'business' AND user_id = 1)),

-- Adobe -> business
((SELECT id FROM transactions WHERE description = 'Adobe Creative Cloud subscription'), 
 (SELECT id FROM tags WHERE name = 'business' AND user_id = 1)),

-- Internet -> business
((SELECT id FROM transactions WHERE description = 'Singtel Fiber 1Gbps'), 
 (SELECT id FROM tags WHERE name = 'business' AND user_id = 1)),

-- Utilities -> personal
((SELECT id FROM transactions WHERE description = 'SP Services electricity bill'), 
 (SELECT id FROM tags WHERE name = 'personal' AND user_id = 1)),

-- Grocery -> personal
((SELECT id FROM transactions WHERE description = 'FairPrice grocery shopping'), 
 (SELECT id FROM tags WHERE name = 'personal' AND user_id = 1));