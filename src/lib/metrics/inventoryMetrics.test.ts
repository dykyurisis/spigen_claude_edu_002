import { describe, it, expect } from 'vitest'
import { calcDaysOfStock, getStockStatus } from './inventoryMetrics'

describe('calcDaysOfStock', () => {
  it('returns stock/dailyRate', () => expect(calcDaysOfStock(300, 30, 10)).toBe(100))
  it('returns 0 when stock is 0', () => expect(calcDaysOfStock(0, 30, 10)).toBe(0))
  it('returns Infinity when no sales', () => expect(calcDaysOfStock(100, 0, 10)).toBe(Infinity))
})
describe('getStockStatus', () => {
  it('critical under 14 days', () => expect(getStockStatus(10)).toBe('critical'))
  it('warning 14-29 days', () => expect(getStockStatus(20)).toBe('warning'))
  it('ok at 30+ days', () => expect(getStockStatus(30)).toBe('ok'))
  it('ok when Infinity', () => expect(getStockStatus(Infinity)).toBe('ok'))
})
