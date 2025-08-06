-- Add new fields to payment_orders table
ALTER TABLE payment_orders 
DROP COLUMN vendor_email,
DROP COLUMN currency,
ADD COLUMN po_type VARCHAR(50) NOT NULL DEFAULT 'Payment Request' CHECK (po_type IN ('Petty Cash', 'Payment Request', 'Cash Advance')),
ADD COLUMN department VARCHAR(50) NOT NULL DEFAULT 'MCorp' CHECK (department IN ('MCorp', 'MarkPlus inc', 'MarkPlus Institute', 'Markteers')),
ADD COLUMN project_name VARCHAR(255) NOT NULL,
ADD COLUMN po_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN acknowledge_by BIGINT REFERENCES users(id),
ADD COLUMN approval_by BIGINT REFERENCES users(id);

-- Create PO items table
CREATE TABLE po_items (
  id BIGSERIAL PRIMARY KEY,
  payment_order_id BIGINT NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
  unit_price DOUBLE PRECISION NOT NULL,
  total_price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make attachments mandatory by adding a constraint
-- We'll handle this in the application logic since we can't enforce file uploads at DB level
