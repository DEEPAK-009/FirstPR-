const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { databaseUrl } = require('../config/env');

let pool = null;

const getPool = () => {
  if (!pool && databaseUrl) {
    const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
    });
  }

  return pool;
};

const query = async (text, params) => {
  const currentPool = getPool();
  if (!currentPool) {
    throw new Error('Database is not configured (DATABASE_URL is missing)');
  }
  return currentPool.query(text, params);
};

const initDb = async () => {
  if (!databaseUrl) {
    console.log('PostgreSQL: DATABASE_URL not set. Running in stateless mode.');
    return false;
  }

  try {
    const schemaSql = fs.readFileSync(
      path.resolve(__dirname, 'schema.sql'),
      'utf8'
    );

    const client = await getPool().connect();
    try {
      await client.query(schemaSql);
      console.log('PostgreSQL: Database connected and schema initialized successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('PostgreSQL initialization error:', error.message);
    return false;
  }
};

module.exports = {
  query,
  getPool,
  initDb
};
