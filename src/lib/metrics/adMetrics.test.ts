import { describe, it, expect } from 'vitest'
import { calcROAS, calcACoS, calcCVR, calcNTBRate } from './adMetrics'

describe('calcROAS', () => {
  it('returns revenue/spend', () => expect(calcROAS(100, 25)).toBe(4))
  it('returns 0 when spend is 0', () => expect(calcROAS(100, 0)).toBe(0))
})
describe('calcACoS', () => {
  it('returns spend/revenue*100', () => expect(calcACoS(25, 100)).toBe(25))
  it('returns 0 when revenue is 0', () => expect(calcACoS(25, 0)).toBe(0))
})
describe('calcCVR', () => {
  it('returns units/sessions*100', () => expect(calcCVR(10, 200)).toBe(5))
  it('returns 0 when sessions is 0', () => expect(calcCVR(10, 0)).toBe(0))
})
describe('calcNTBRate', () => {
  it('returns ntb/total*100', () => expect(calcNTBRate(30, 100)).toBe(30))
  it('returns 0 when total is 0', () => expect(calcNTBRate(30, 0)).toBe(0))
})
