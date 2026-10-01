const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeMinConfidence } = require('../controllers/issueController');

test('normalizeMinConfidence accepts percentages and fractions', () => {
  assert.equal(normalizeMinConfidence(40), 0.4);
  assert.equal(normalizeMinConfidence('0.75'), 0.75);
});

test('normalizeMinConfidence clamps out-of-range values', () => {
  assert.equal(normalizeMinConfidence(-10), 0);
  assert.equal(normalizeMinConfidence(150), 1);
});

test('normalizeMinConfidence rejects non-numeric values', () => {
  assert.throws(
    () => normalizeMinConfidence('high'),
    /minConfidence must be a valid number/
  );
});
