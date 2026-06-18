/**
 * Map an Amazon Seller SKU to its SAP material number (ARTNR / MATNR).
 *
 * Amazon SKUs are the SAP material code plus a trailing account/marketplace
 * suffix of uppercase letters, e.g.
 *   ACS07386PAN   -> ACS07386
 *   064GL25168PAN -> 064GL25168
 *   AGL06954EUP   -> AGL06954
 * Promotional / coupon SKUs wrap the real SKU, e.g.
 *   amzn.gr.ACS08330PAN-tToPUaJSlJyBH0FET-LN -> ACS08330
 *
 * SAP material numbers in this warehouse always end in a digit, so the suffix
 * is the run of trailing letters after the final digit.
 */
export function skuToMaterial(sku: string): string {
  if (!sku) return ''
  let s = sku.toUpperCase().trim()
  s = s.split('-')[0] // drop coupon junk after the first hyphen
  s = s.split('.').pop() ?? s // drop an "amzn.gr." style prefix
  return s.replace(/[A-Z]+$/, '') // strip the trailing account-suffix letters
}
