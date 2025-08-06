CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'finance_staff', 'approver', 'acknowledger', 'verifier')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_orders (
  id BIGSERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_email VARCHAR(255),
  amount DOUBLE PRECISION NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  due_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'acknowledge', 'approval', 'posting', 'scheduling', 'last_approval', 'verification', 'release_payment', 'paid', 'rejected')),
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_order_history (
  id BIGSERIAL PRIMARY KEY,
  payment_order_id BIGINT NOT NULL REFERENCES payment_orders(id),
  status VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
  id BIGSERIAL PRIMARY KEY,
  payment_order_id BIGINT NOT NULL REFERENCES payment_orders(id),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (email, name, role) VALUES
('admin@company.com', 'Admin User', 'admin'),
('finance@company.com', 'Finance Staff', 'finance_staff'),
('approver@company.com', 'Approver User', 'approver'),
('acknowledger@company.com', 'Acknowledger User', 'acknowledger'),
('verifier@company.com', 'Verifier User', 'verifier');
