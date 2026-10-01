const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCacheKey,
  getCachedSearch,
  setCachedSearch
} = require('../services/cacheService');

test('buildCacheKey is deterministic and ignores casing, order, and whitespace', () => {
  const key1 = buildCacheKey(['JavaScript', 'Node.js'], 40);
  const key2 = buildCacheKey(['node.js ', 'javascript'], 0.4);
  const key3 = buildCacheKey(['  JAVASCRIPT  ', 'NODE.JS'], '40');

  assert.equal(key1, key2);
  assert.equal(key2, key3);
  assert.equal(key1, 'v1:javascript,node.js|conf:0.40');
});

test('buildCacheKey handles empty or edge case inputs gracefully', () => {
  const keyEmpty = buildCacheKey([], 0);
  assert.equal(keyEmpty, 'v1:|conf:0.00');

  const keySingle = buildCacheKey('Python', 55);
  assert.equal(keySingle, 'v1:python|conf:0.55');
});

test('setCachedSearch and getCachedSearch retrieve cached responses in memory', async () => {
  const testKey = 'v1:test-skill|conf:0.50';
  const mockPayload = { issues: [{ id: 123, title: 'Test issue' }], total: 1 };

  await setCachedSearch(testKey, mockPayload, 5); // 5 sec TTL
  const cached = await getCachedSearch(testKey);

  assert.deepEqual(cached, mockPayload);
});
