import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  await client.query('BEGIN');
  await client.query('DROP VIEW IF EXISTS "product_price_trends"');
  await client.query('DROP VIEW IF EXISTS "item_price_history"');
  await client.query('COMMIT');
  console.log('Removed legacy price views in dependency order.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
