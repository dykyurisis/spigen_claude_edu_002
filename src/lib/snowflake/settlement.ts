import 'server-only'

import { snowflakeQuery, type SettlementCountry } from './query'
import { toNum } from '@/lib/parsers/parseUtils'
import type { SettlementSku } from '@/types/snowflake'

/**
 * Per-SKU settlement aggregation for one marketplace and date window.
 *
 * The `amount` column is European-formatted text ("3,35"), so we normalise it
 * to a decimal in SQL. All maths is aggregated in Snowflake — only one summary
 * row per SKU comes back. `net` is the true settled cash (every line summed):
 * gross sales − refunds − fees − promotions − withheld VAT.
 */
export async function fetchSettlementBySku(
  country: SettlementCountry,
  from: string,
  to: string
): Promise<SettlementSku[]> {
  const sql = `
    SELECT
      sku AS SKU,
      SUM(CASE WHEN ad = 'Principal' AND tt = 'Order'  THEN amt ELSE 0 END) AS GROSS_SALES,
      SUM(CASE WHEN ad = 'Principal' AND tt = 'Refund' THEN amt ELSE 0 END) AS REFUNDS,
      SUM(CASE WHEN at = 'ItemFees'  THEN amt ELSE 0 END)                    AS FEES,
      SUM(CASE WHEN at = 'Promotion' THEN amt ELSE 0 END)                    AS PROMOTIONS,
      SUM(amt)                                                               AS NET,
      SUM(CASE WHEN ad = 'Principal' AND tt = 'Order' THEN qty ELSE 0 END)   AS UNITS
    FROM (
      SELECT
        "sku"                AS sku,
        "amount-type"        AS at,
        "amount-description" AS ad,
        "transaction-type"   AS tt,
        TRY_TO_DECIMAL(REPLACE("amount", ',', '.'), 18, 2) AS amt,
        TRY_TO_NUMBER("quantity-purchased")                AS qty
      FROM AMAZON_SELLER.V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2
      WHERE COUNTRY_CODE = '${country}'
        AND TRY_TO_DATE("posted-date", 'DD.MM.YYYY') BETWEEN '${from}' AND '${to}'
        AND "sku" IS NOT NULL AND "sku" <> ''
    )
    GROUP BY sku
    HAVING SUM(amt) <> 0
    ORDER BY GROSS_SALES DESC
  `
  const rows = await snowflakeQuery(sql)
  return rows.map((r) => ({
    sku: String(r.SKU ?? ''),
    grossSales: toNum(r.GROSS_SALES),
    refunds: toNum(r.REFUNDS),
    fees: toNum(r.FEES),
    promotions: toNum(r.PROMOTIONS),
    net: toNum(r.NET),
    units: toNum(r.UNITS),
  }))
}
