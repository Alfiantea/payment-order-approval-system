-- Add password column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'changeMe123!';

-- Drop hashed_password column if it exists (from previous migrations)
ALTER TABLE users 
DROP COLUMN IF EXISTS hashed_password;

-- Update existing users with default password where password is null or empty
UPDATE users 
SET password = 'changeMe123!'
WHERE password IS NULL OR password = '';
