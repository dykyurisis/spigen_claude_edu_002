import { DataType } from '@/types/data'
import { parseSPCampaigns } from './parseSPCampaigns'
import { parseSBCampaigns } from './parseSBCampaigns'
import { parseSDCampaigns } from './parseSDCampaigns'
import { parseOrders } from './parseOrders'
import { parseListing } from './parseListing'
import { parseInventory } from './parseInventory'
import { parseTraffic } from './parseTraffic'
import { parseAttribution } from './parseAttribution'

const FILE_TYPE_MAP: Array<[RegExp, DataType]> = [
  [/spcampaigns|sp_campaigns/i, 'sp_campaigns'],
  [/sbcampaigns|sb_campaigns/i, 'sb_campaigns'],
  [/sdcampaigns|sd_campaigns/i, 'sd_campaigns'],
  [/order/i, 'orders'],
  [/listing/i, 'listing'],
  [/inventory/i, 'inventory'],
  [/traffic/i, 'traffic'],
  [/attribution/i, 'attribution'],
]

export function detectFileType(filename: string): DataType | null {
  for (const [pattern, type] of FILE_TYPE_MAP) {
    if (pattern.test(filename)) return type
  }
  return null
}

export function parseCSV(dataType: DataType, csvText: string): unknown[] {
  switch (dataType) {
    case 'sp_campaigns': return parseSPCampaigns(csvText)
    case 'sb_campaigns': return parseSBCampaigns(csvText)
    case 'sd_campaigns': return parseSDCampaigns(csvText)
    case 'orders':       return parseOrders(csvText)
    case 'listing':      return parseListing(csvText)
    case 'inventory':    return parseInventory(csvText)
    case 'traffic':      return parseTraffic(csvText)
    case 'attribution':  return parseAttribution(csvText)
  }
}
