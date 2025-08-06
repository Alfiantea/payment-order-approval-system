-- Fix the password hash to match the correct calculation
-- This is the correct SHA-256 hash of "changeMe123!salt123"
UPDATE users 
SET hashed_password = 'e258d248fda94c63753607f7c4494ee0fcbe92f1a76bfdac795c9d84101eb317'
WHERE email = 'admin@company.com';

-- Update all other users with the same hash for testing
UPDATE users 
SET hashed_password = 'e258d248fda94c63753607f7c4494ee0fcbe92f1a76bfdac795c9d84101eb317'
WHERE hashed_password IS NULL OR hashed_password = '';
