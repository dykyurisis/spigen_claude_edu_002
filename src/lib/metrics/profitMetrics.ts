import type { SettlementSku, ProfitInputRow, ProfitRow } from '@/types/snowflake'
import { skuToMaterial } from '@/lib/snowflake/skuMaterial'

/** Refund value as a % of gross sales. Refunds arrive negative; report magnitude. */
export const calcReturnRate = (refunds: number, gross: number) =>
  gross === 0 ? 0 : (Math.abs(refunds) / gross) * 100

/** Total Amazon fees as a % of gross sales. */
export const calcFeeRate = (fees: number, gross: number) =>
  gross === 0 ? 0 : (Math.abs(fees) / gross) * 100

/** Net settlement payout as a % of gross sales ("take-home rate"). */
export const calcNetRate = (net: number, gross: number) =>
  gross === 0 ? 0 : (net / gross) * 100

/** Net margin = profit / net settlement, as a %. */
export const calcNetMargin = (netProfit: number, net: number) =>
  net === 0 ? 0 : (netProfit / net) * 100

/**
 * Attach each settlement SKU to its SAP standard cost (USD). No FX applied yet —
 * the USD cost is carried through so the UI can re-cost interactively.
 */
export function buildProfitInputs(
  settlement: SettlementSku[],
  unitCostUsdByMaterial: Map<string, number>
): ProfitInputRow[] {
  return settlement.map((s) => {
    const material = skuToMaterial(s.sku)
    const unitCostUsd = unitCostUsdByMaterial.get(material) ?? null
    return { ...s, material, unitCostUsd }
  })
}

/**
 * Cost a single row at a USD→EUR rate (USD per 1 EUR).
 * COGS = units × (unitCostUsd / fxUsdPerEur). Unmatched rows contribute no COGS.
 */
export function computeProfit(row: ProfitInputRow, fxUsdPerEur: number): ProfitRow {
  const costed = row.unitCostUsd != null && fxUsdPerEur > 0
  const unitCostEur = costed ? (row.unitCostUsd as number) / fxUsdPerEur : null
  const cogs = unitCostEur != null ? row.units * unitCostEur : 0
  const netProfit = row.net - cogs
  return {
    ...row,
    unitCostEur,
    cogs,
    netProfit,
    netMargin: calcNetMargin(netProfit, row.net),
    costed,
  }
}

/** Cost every row at the given FX rate. */
export const computeProfitRows = (rows: ProfitInputRow[], fxUsdPerEur: number): ProfitRow[] =>
  rows.map((r) => computeProfit(r, fxUsdPerEur))
