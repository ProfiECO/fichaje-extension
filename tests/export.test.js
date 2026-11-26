import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summaryCsv } from '../src/features/tracking/export.js';

test('exports seven daily totals with a BOM and no credentials', () => {
  const csv = summaryCsv(
    [
      { log_type: 'IN', time: '2026-11-02 08:00:00' },
      { log_type: 'OUT', time: '2026-11-02 12:30:00' },
    ],
    new Date(2026, 10, 2),
    new Date(2026, 10, 4),
  );
  assert.ok(csv.startsWith('\uFEFF'));
  assert.equal(csv.split('\r\n').length, 8);
  assert.ok(csv.includes('"2026-11-02";"4h 30m";"270"'));
  assert.ok(csv.includes('"2026-11-08";"0h 00m";"0"'));
});
