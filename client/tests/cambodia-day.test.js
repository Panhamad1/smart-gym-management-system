import test from 'node:test';
import assert from 'node:assert/strict';
import { cambodiaDate, cambodiaMidnight, dayAfter } from '../src/cambodia-day.js';

test('Cambodia day changes at 17:00 UTC and ends at the next local midnight', () => {
  assert.equal(cambodiaDate(new Date('2026-11-12T16:59:59.999Z')), '2026-11-12');
  assert.equal(cambodiaDate(new Date('2026-11-12T17:00:00.000Z')), '2026-11-13');
  assert.equal(cambodiaMidnight('2026-11-13'), Date.parse('2026-11-12T17:00:00Z'));
  assert.equal(dayAfter('2026-11-30'), Date.parse('2026-11-30T17:00:00Z'));
});
