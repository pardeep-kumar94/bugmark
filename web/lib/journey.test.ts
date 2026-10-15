import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossedMilestones } from './journey.ts';

test('reports each milestone once, including ones skipped by seeking', () => {
  assert.deepEqual(crossedMilestones([], 10), []);
  assert.deepEqual(crossedMilestones([], 25), [25]);
  assert.deepEqual(crossedMilestones([25], 30), []);
  assert.deepEqual(crossedMilestones([25], 80), [50, 75]);
  assert.deepEqual(crossedMilestones([25, 50, 75], 100), []);
});

test('ignores NaN before metadata loads', () => {
  assert.deepEqual(crossedMilestones([], Number.NaN), []);
});
