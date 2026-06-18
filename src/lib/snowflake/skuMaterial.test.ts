import { describe, it, expect } from 'vitest'
import { skuToMaterial } from './skuMaterial'

describe('skuToMaterial', () => {
  it('strips a plain account suffix', () => {
    expect(skuToMaterial('ACS07386PAN')).toBe('ACS07386')
    expect(skuToMaterial('064GL25168PAN')).toBe('064GL25168')
    expect(skuToMaterial('AGL06954EUP')).toBe('AGL06954')
    expect(skuToMaterial('609CS25836PAN')).toBe('609CS25836')
  })

  it('handles coupon / promotional wrapped SKUs', () => {
    expect(skuToMaterial('amzn.gr.ACS08330PAN-tToPUaJSlJyBH0FET-LN')).toBe('ACS08330')
  })

  it('is case insensitive', () => {
    expect(skuToMaterial('acs07386pan')).toBe('ACS07386')
  })

  it('returns empty string for empty input', () => {
    expect(skuToMaterial('')).toBe('')
  })

  it('leaves an already-clean material number untouched', () => {
    expect(skuToMaterial('ACS00403')).toBe('ACS00403')
  })
})
