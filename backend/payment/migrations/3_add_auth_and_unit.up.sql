-- Add hashed_password field to users table
ALTER TABLE users 
ADD COLUMN hashed_password VARCHAR(255);

-- Add unit field to po_items table
ALTER TABLE po_items 
ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'pcs';

-- Update existing users with a default hashed password (should be changed on first login)
-- This is the SHA-256 hash of "changeMe123!" with salt "salt123" that matches our hashPassword function
UPDATE users 
SET hashed_password = 'e258d248fda94c63753607f7c4494ee0fcbe92f1a76bfdac795c9d84101eb317'
WHERE hashed_password IS NULL;

-- Make hashed_password NOT NULL after setting default values
ALTER TABLE users 
ALTER COLUMN hashed_password SET NOT NULL;
