-- Add hashed_password field to users table
ALTER TABLE users 
ADD COLUMN hashed_password VARCHAR(255);

-- Add unit field to po_items table
ALTER TABLE po_items 
ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'pcs';

-- Update existing users with a default hashed password (should be changed on first login)
-- This is a bcrypt hash of "changeMe123!" - users should change this immediately
UPDATE users 
SET hashed_password = '$2b$12$LQv3c1yqBwlVHpPjrCyeNOuzoHrVTjHp5UKP4xtaE2flXvwHZbHSi'
WHERE hashed_password IS NULL;

-- Make hashed_password NOT NULL after setting default values
ALTER TABLE users 
ALTER COLUMN hashed_password SET NOT NULL;
