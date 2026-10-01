const test = require('node:test');
const assert = require('node:assert/strict');

const { buildQuery } = require('../utils/queryBuilder');

test('buildQuery joins valid skills and quotes multi-word skills', () => {
  const query = buildQuery(['React', 'machine learning', '  ']);

  assert.equal(
    query,
    '(React OR "machine learning") state:open type:issue comments:<10'
  );
});

test('buildQuery rejects empty skill lists', () => {
  assert.throws(
    () => buildQuery([' ', '']),
    /At least one valid skill is required/
  );
});
