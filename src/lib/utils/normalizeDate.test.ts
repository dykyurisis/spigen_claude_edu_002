import { describe, it, expect } from 'vitest'
import { normalizeDate } from './normalizeDate'

describe('normalizeDate', () => {
  it('passes through YYYY-MM-DD', () => expect(normalizeDate('2026-03-01')).toBe('2026-03-01'))
  it('trims ISO 8601 with UTC offset', () => expect(normalizeDate('2026-03-01T23:59:46+00:00')).toBe('2026-03-01'))
  it('trims ISO 8601 with Z', () => expect(normalizeDate('2026-03-01T00:00:00Z')).toBe('2026-03-01'))
  it('converts YYYYMMDD', () => expect(normalizeDate('20260301')).toBe('2026-03-01'))
  it('returns empty string for null', () => expect(normalizeDate(null)).toBe(''))
  it('returns empty string for undefined', () => expect(normalizeDate(undefined)).toBe(''))
  it('trims whitespace', () => expect(normalizeDate('  20260301  ')).toBe('2026-03-01'))
  it('throws RangeError for unrecognized format', () => {
    expect(() => normalizeDate('01/03/2026')).toThrow(RangeError)
  })
})
