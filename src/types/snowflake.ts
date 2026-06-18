/** Per-SKU settlement aggregation from Amazon's V2 settlement report (EUR). */
export interface SettlementSku {
  sku: string
  /** Order principal (gross product sales), positive. */
  grossSales: number
  /** Refund principal, negative. */
  refunds: number
  /** All ItemFees (referral commission + FBA fulfilment + chargebacks, incl. refund credits), net — usually negative. */
  fees: number
  /** Promotion / coupon funding, usually negative. */
  promotions: number
  /** Actual settled cash for this SKU = sum of every settlement line (principal, tax, fees, promos, VAT). */
  net: number
  /** Units sold (order principal lines). */
  units: number
}

/** A settlement SKU enriched with its matched SAP standard cost (USD). */
export interface ProfitInputRow extends SettlementSku {
  /** SAP material number derived from the SKU. */
  material: string
  /** SAP standard unit cost in USD (BWKEY 2000), or null when no material matched. */
  unitCostUsd: number | null
}

/** A fully-costed profit row, computed at a given USD→EUR rate. */
export interface ProfitRow extends ProfitInputRow {
  /** Unit cost converted to EUR, or null when unmatched. */
  unitCostEur: number | null
  /** Cost of goods sold in EUR (units × unitCostEur). 0 when unmatched. */
  cogs: number
  /** Net settlement minus COGS. */
  netProfit: number
  /** netProfit / net × 100. */
  netMargin: number
  /** Whether a SAP cost was found for this SKU. */
  costed: boolean
}
