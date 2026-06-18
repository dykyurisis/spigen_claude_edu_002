import { describe, it, expect } from 'vitest'
import {
  calcReturnRate, calcFeeRate, calcNetRate, calcNetMargin,
  buildProfitInputs, computeProfit, computeProfitRows,
} from './profitMetrics'
import type { SettlementSku } from '@/types/snowflake'

const sku = (over: Partial<SettlementSku>): SettlementSku => ({
  sku: 'ACS07386PAN', grossSales: 1000, refunds: -100, fees: -200,
  promotions: -50, net: 650, units: 100, ...over,
})

describe('rate helpers', () => {
  it('return rate uses refund magnitude over gross', () => {
    expect(calcReturnRate(-100, 1000)).toBe(10)
  })
  it('fee rate uses fee magnitude over gross', () => {
    expect(calcFeeRate(-250, 1000)).toBe(25)
  })
  it('net rate is net over gross', () => {
    expect(calcNetRate(650, 1000)).toBe(65)
  })
  it('net margin is profit over net', () => {
    expect(calcNetMargin(130, 650)).toBe(20)
  })
  it('all rate helpers guard against divide-by-zero', () => {
    expect(calcReturnRate(-100, 0)).toBe(0)
    expect(calcFeeRate(-100, 0)).toBe(0)
    expect(calcNetRate(100, 0)).toBe(0)
    expect(calcNetMargin(100, 0)).toBe(0)
  })
})

describe('buildProfitInputs', () => {
  it('matches each SKU to its material cost', () => {
    const costs = new Map([['ACS07386', 10.8]])
    const [row] = buildProfitInputs([sku({})], costs)
    expect(row.material).toBe('ACS07386')
    expect(row.unitCostUsd).toBe(10.8)
  })
  it('leaves unitCostUsd null when no material matches', () => {
    const [row] = buildProfitInputs([sku({ sku: 'ZZZ99999XXX' })], new Map())
    expect(row.unitCostUsd).toBeNull()
  })
})

describe('computeProfit', () => {
  it('costs a matched row at the FX rate', () => {
    // 10.80 USD / 1.08 = €10 per unit; 100 units → €1000 COGS; net 650 → -350 profit
    const input = buildProfitInputs([sku({})], new Map([['ACS07386', 10.8]]))[0]
    const r = computeProfit(input, 1.08)
    expect(r.unitCostEur).toBe(10)
    expect(r.cogs).toBe(1000)
    expect(r.netProfit).toBe(-350)
    expect(r.costed).toBe(true)
  })
  it('treats an unmatched row as zero COGS (profit = net)', () => {
    const input = buildProfitInputs([sku({ sku: 'ZZZ99999XXX' })], new Map())[0]
    const r = computeProfit(input, 1.08)
    expect(r.cogs).toBe(0)
    expect(r.netProfit).toBe(650)
    expect(r.costed).toBe(false)
    expect(r.unitCostEur).toBeNull()
  })
  it('guards against a zero/invalid FX rate', () => {
    const input = buildProfitInputs([sku({})], new Map([['ACS07386', 10.8]]))[0]
    const r = computeProfit(input, 0)
    expect(r.cogs).toBe(0)
    expect(r.costed).toBe(false)
  })
})

describe('computeProfitRows', () => {
  it('costs every row', () => {
    const inputs = buildProfitInputs([sku({}), sku({ sku: 'AGL06954EUP' })], new Map([['ACS07386', 10.8]]))
    const rows = computeProfitRows(inputs, 1.08)
    expect(rows).toHaveLength(2)
    expect(rows[0].costed).toBe(true)
    expect(rows[1].costed).toBe(false)
  })
})
