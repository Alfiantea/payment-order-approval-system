import fs from 'fs';
import path from 'path';
import pool from '../db';

const migrate = async () => {
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(__dirname, '../../../payment/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.up.sql')) {
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        console.log(`Migration ${file} applied successfully.`);
      }
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    client.release();
  }
};

migrate()
  .then(() => {
    console.log('Migrations completed successfully.');
    pool.end();
  })
  .catch(() => {
    pool.end();
  });
