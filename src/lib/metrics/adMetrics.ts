import { SPCampaignRow, SBCampaignRow, SDCampaignRow } from '@/types/data'

export const calcROAS = (revenue: number, spend: number) => spend === 0 ? 0 : revenue / spend
export const calcACoS = (spend: number, revenue: number) => revenue === 0 ? 0 : (spend / revenue) * 100
export const calcCVR = (units: number, sessions: number) => sessions === 0 ? 0 : (units / sessions) * 100
export const calcNTBRate = (ntb: number, total: number) => total === 0 ? 0 : (ntb / total) * 100

export function calcBlendedROAS(
  totalRevenue: number,
  sp: SPCampaignRow[], sb: SBCampaignRow[], sd: SDCampaignRow[]
): number {
  const totalSpend =
    sp.reduce((s, r) => s + r.spend, 0) +
    sb.reduce((s, r) => s + r.cost, 0) +
    sd.reduce((s, r) => s + r.cost, 0)
  return calcROAS(totalRevenue, totalSpend)
}
