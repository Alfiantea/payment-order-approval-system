-- Add password field to users table
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'changeMe123!';

-- Add unit field to po_items table
ALTER TABLE po_items 
ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'pcs';

-- Update existing users with default password
UPDATE users 
SET password = 'changeMe123!'
WHERE password IS NULL OR password = '';
