const test = require('node:test');
const assert = require('node:assert/strict');

const { runWithConcurrency } = require('../utils/runWithConcurrency');

test('runWithConcurrency preserves result order while capping active work', async () => {
  let activeCount = 0;
  let maxActiveCount = 0;

  const results = await runWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    activeCount += 1;
    maxActiveCount = Math.max(maxActiveCount, activeCount);

    await new Promise((resolve) => setTimeout(resolve, 5));

    activeCount -= 1;
    return value * 2;
  });

  assert.deepEqual(results, [2, 4, 6, 8]);
  assert.equal(maxActiveCount, 2);
});
