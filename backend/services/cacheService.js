const { query } = require('../db');

const DEFAULT_TTL_SECONDS = 1200; // 20 minutes
const memoryCache = new Map();

/**
 * Builds a deterministic canonical cache key for a search query.
 * e.g. ['Node.js', 'JavaScript'] and ['javascript', 'node.js'] -> 'v1:javascript,node.js|conf:0.4'
 */
const buildCacheKey = (skills = [], minConfidence = 0) => {
  const normalizedSkills = (Array.isArray(skills) ? skills : [skills])
    .map((s) => String(s || '').trim().toLowerCase())
    .filter(Boolean)
    .sort();

  const numConfidence = Number(minConfidence);
  const normalizedConfidence = Number.isFinite(numConfidence)
    ? Math.max(0, Math.min(1, numConfidence > 1 ? numConfidence / 100 : numConfidence)).toFixed(2)
    : '0.00';

  return `v1:${normalizedSkills.join(',')}|conf:${normalizedConfidence}`;
};

/**
 * Retrieves cached search response.
 * Checks fast in-memory map first, then falls back to PostgreSQL.
 */
const getCachedSearch = async (cacheKey) => {
  if (!cacheKey) return null;

  const now = Date.now();

  // Tier 1: In-memory cache (0ms)
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry) {
    if (memEntry.expiresAt > now) {
      return memEntry.data;
    }
    memoryCache.delete(cacheKey);
  }

  // Tier 2: PostgreSQL search_cache table
  try {
    const result = await query(
      'SELECT response_data, expires_at FROM search_cache WHERE cache_key = $1 AND expires_at > NOW()',
      [cacheKey]
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      const expiresAtMs = new Date(row.expires_at).getTime();

      if (expiresAtMs > now) {
        // Backfill Tier 1 in-memory cache
        memoryCache.set(cacheKey, {
          data: row.response_data,
          expiresAt: expiresAtMs
        });
        return row.response_data;
      }
    }
  } catch (err) {
    // Database might be uninitialized, offline, or in stateless mode - proceed gracefully
    console.warn('Cache DB lookup skipped:', err.message);
  }

  return null;
};

/**
 * Stores search response in both in-memory map and PostgreSQL search_cache table.
 */
const setCachedSearch = async (cacheKey, data, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  if (!cacheKey || !data) return;

  const expiresAtMs = Date.now() + ttlSeconds * 1000;
  const expiresAtDate = new Date(expiresAtMs);

  // Tier 1: In-memory
  memoryCache.set(cacheKey, {
    data,
    expiresAt: expiresAtMs
  });

  // Tier 2: PostgreSQL (async upsert)
  try {
    await query(
      `INSERT INTO search_cache (cache_key, response_data, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (cache_key) DO UPDATE
       SET response_data = EXCLUDED.response_data,
           expires_at = EXCLUDED.expires_at,
           created_at = NOW()`,
      [cacheKey, JSON.stringify(data), expiresAtDate]
    );
  } catch (err) {
    console.warn('Cache DB write skipped:', err.message);
  }
};

/**
 * Periodic cleanup of expired entries
 */
const pruneExpiredCache = async () => {
  const now = Date.now();

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }

  try {
    await query('DELETE FROM search_cache WHERE expires_at < NOW()');
  } catch (err) {
    // Ignore cleanup error if DB not connected
  }
};

// Prune every 10 minutes
const cleanupInterval = setInterval(pruneExpiredCache, 10 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

module.exports = {
  buildCacheKey,
  getCachedSearch,
  setCachedSearch,
  pruneExpiredCache,
  DEFAULT_TTL_SECONDS
};
