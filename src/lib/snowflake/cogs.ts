import 'server-only'

import { snowflakeQuery } from './query'
import { toNum } from '@/lib/parsers/parseUtils'

/**
 * Default USD per 1 EUR. Spigen's finished-goods standard cost lives in the
 * Spigen Inc. valuation area (BWKEY 2000), which is denominated in USD.
 * Adjustable in the UI. (BWKEY 1000 / Korea KRW costs are unreliable for
 * finished goods — they imply near-zero cost — so we use the USD basis.)
 */
export const DEFAULT_FX_USD_PER_EUR = 1.08

/**
 * Latest SAP standard unit cost (USD) per material, from the Spigen Inc.
 * valuation area (BWKEY 2000). Unit cost = STPRS / PEINH; the most recent
 * period (LFGJA, LFMON) wins. Returned as a Map keyed by material number.
 */
export async function fetchUnitCostUsdByMaterial(): Promise<Map<string, number>> {
  const sql = `
    WITH latest AS (
      SELECT
        MATNR,
        STPRS / PEINH AS unit_cost_usd,
        ROW_NUMBER() OVER (PARTITION BY MATNR ORDER BY LFGJA DESC, LFMON DESC) AS rn
      FROM SAP.MBEW
      WHERE BWKEY = '2000' AND STPRS > 0 AND PEINH > 0
    )
    SELECT MATNR, unit_cost_usd AS UNIT_COST_USD
    FROM latest
    WHERE rn = 1
  `
  const rows = await snowflakeQuery(sql)
  const map = new Map<string, number>()
  for (const r of rows) {
    const matnr = String(r.MATNR ?? '').trim()
    if (matnr) map.set(matnr, toNum(r.UNIT_COST_USD))
  }
  return map
}
