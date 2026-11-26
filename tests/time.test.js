import assert from 'node:assert/strict'
import { test } from 'vitest'
import { clock, duration, weekStart, weekSummary } from '@/shared/lib/time.ts'

const H = 3600000

test('weekStart is Monday 00:00', () => {
  assert.equal(
    weekStart(new Date(2026, 10, 4, 15)).toDateString(),
    new Date(2026, 10, 2).toDateString()
  )
  assert.equal(
    weekStart(new Date(2026, 10, 8, 23)).toDateString(),
    new Date(2026, 10, 2).toDateString()
  )
})

test('pairs IN/OUT per day and counts the open session until now', () => {
  const logs = [
    { log_type: 'IN', time: '2026-11-02 08:00:00' },
    { log_type: 'OUT', time: '2026-11-02 14:00:00' },
    { log_type: 'IN', time: '2026-11-02 15:00:00' },
    { log_type: 'OUT', time: '2026-11-02 17:30:00' },
    { log_type: 'IN', time: '2026-11-04 09:00:00' },
    { log_type: 'IN', time: '2026-11-04 09:05:00' }
  ]
  const days = weekSummary(logs, new Date(2026, 10, 4, 11))
  assert.equal(days[0].ms, 8.5 * H)
  assert.equal(days[1].ms, 0)
  assert.equal(days[2].ms, 2 * H)
})

test('splits sessions across midnight and ignores time before Monday', () => {
  const logs = [
    { log_type: 'IN', time: '2026-11-01 22:00:00' },
    { log_type: 'OUT', time: '2026-11-02 02:00:00' }
  ]
  assert.equal(weekSummary(logs, new Date(2026, 10, 4))[0].ms, 2 * H)
})

test('formatters', () => {
  assert.equal(duration(8.5 * H), '8h 30m')
  assert.equal(clock(H + 61000), '01:01:01')
})

test('historical weeks are bounded and do not include the running week', () => {
  const logs = [{ log_type: 'IN', time: '2026-11-01 22:00:00' }]
  const days = weekSummary(logs, new Date(2026, 10, 26), new Date(2026, 10, 2))
  assert.equal(
    days.reduce((sum, day) => sum + day.ms, 0),
    168 * H
  )
})

test('ignores future, invalid and untyped records without closing a session', () => {
  const logs = [
    { log_type: 'IN', time: '2026-11-02 09:00:00' },
    { log_type: '', time: '2026-11-02 09:30:00' },
    { log_type: 'OUT', time: 'invalid' },
    { log_type: 'OUT', time: '2026-11-02 14:00:00' }
  ]
  assert.equal(weekSummary(logs, new Date(2026, 10, 2, 11))[0].ms, 2 * H)
})

test('splits a session across the daylight saving boundary in local time', () => {
  const logs = [
    { log_type: 'IN', time: '2026-10-24 23:00:00' },
    { log_type: 'OUT', time: '2026-10-25 04:00:00' }
  ]
  const days = weekSummary(logs, new Date(2026, 9, 26), new Date(2026, 9, 19))
  const expected = new Date(2026, 9, 25, 4) - new Date(2026, 9, 25)
  assert.equal(days[5].ms, H)
  assert.equal(days[6].ms, expected)
})
