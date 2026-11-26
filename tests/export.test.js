import assert from 'node:assert/strict'
import { test } from 'vitest'
import { summaryCsv } from '@/features/tracking/export.ts'

test('exports seven daily totals with a BOM and no credentials', () => {
  const csv = summaryCsv(
    [
      { log_type: 'IN', time: '2026-11-02 08:00:00' },
      { log_type: 'OUT', time: '2026-11-02 12:30:00' }
    ],
    new Date(2026, 10, 2),
    new Date(2026, 10, 4)
  )
  assert.ok(csv.startsWith('\uFEFF'))
  assert.equal(csv.split('\r\n').length, 8)
  assert.ok(csv.includes('"2026-11-02";"4h 30m";"270"'))
  assert.ok(csv.includes('"2026-11-08";"0h 00m";"0"'))
})

test('exports only the selected week checkins and preserves seconds', async () => {
  const { checkinsCsv } = await import('@/features/tracking/export.ts')
  const csv = checkinsCsv(
    [
      { log_type: 'IN', time: '2026-11-01 22:00:00' },
      { log_type: 'OUT', time: '2026-11-02 02:00:15' },
      { log_type: 'IN', time: '2026-11-08 09:12:34' },
      { log_type: 'OUT', time: '2026-11-09 10:00:00' }
    ],
    new Date(2026, 10, 4)
  )
  assert.equal(csv.split('\r\n').length, 3)
  assert.ok(csv.includes('"2026-11-02";"02:00:15";"Salida"'))
  assert.ok(csv.includes('"2026-11-08";"09:12:34";"Entrada"'))
  assert.ok(!csv.includes('2026-11-01'))
  assert.ok(!csv.includes('2026-11-09'))
})
