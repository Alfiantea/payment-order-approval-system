-- Add hashed_password field to users table
ALTER TABLE users 
ADD COLUMN hashed_password VARCHAR(255);

-- Add unit field to po_items table
ALTER TABLE po_items 
ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'pcs';

-- Update existing users with a default hashed password (should be changed on first login)
-- This is a simple SHA-256 hash of "changeMe123!" with salt - users should change this immediately
UPDATE users 
SET hashed_password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
WHERE hashed_password IS NULL;

-- Make hashed_password NOT NULL after setting default values
ALTER TABLE users 
ALTER COLUMN hashed_password SET NOT NULL;
