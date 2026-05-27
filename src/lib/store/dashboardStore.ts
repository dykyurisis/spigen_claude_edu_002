import { create } from 'zustand'
import {
  StorageSchema, DataType,
  SPCampaignRow, SBCampaignRow, SDCampaignRow,
  OrderRow, ListingRow, InventoryRow, TrafficRow, AttributionRow,
} from '@/types/data'

type DataTypeRowMap = {
  sp_campaigns: SPCampaignRow[]; sb_campaigns: SBCampaignRow[]
  sd_campaigns: SDCampaignRow[]; orders: OrderRow[]; listing: ListingRow[]
  inventory: InventoryRow[]; traffic: TrafficRow[]; attribution: AttributionRow[]
}

interface DashboardState extends StorageSchema {
  setData: <K extends DataType>(type: K, rows: DataTypeRowMap[K]) => void
  setDateRange: (from: string, to: string) => void
  clearAll: () => void
  hydrateAll: (data: Omit<StorageSchema, 'uploadedAt' | 'dateRange'>) => void
  mobileSidebarOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
}

const KEY_MAP: Record<DataType, keyof StorageSchema> = {
  sp_campaigns: 'spCampaigns', sb_campaigns: 'sbCampaigns',
  sd_campaigns: 'sdCampaigns', orders: 'orders', listing: 'listing',
  inventory: 'inventory', traffic: 'traffic', attribution: 'attribution',
}

const empty: StorageSchema = {
  spCampaigns: [], sbCampaigns: [], sdCampaigns: [],
  orders: [], listing: [], inventory: [], traffic: [], attribution: [],
  uploadedAt: {}, dateRange: null,
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  ...empty,
  setData: (type, rows) => {
    const key = KEY_MAP[type]
    set((s) => ({
      [key]: rows,
      uploadedAt: { ...s.uploadedAt, [type]: new Date().toISOString() },
    } as Partial<DashboardState>))
  },
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  clearAll: () => set(empty),
  hydrateAll: (data) => set({
    spCampaigns: data.spCampaigns,
    sbCampaigns: data.sbCampaigns,
    sdCampaigns: data.sdCampaigns,
    orders: data.orders,
    listing: data.listing,
    inventory: data.inventory,
    traffic: data.traffic,
    attribution: data.attribution,
  }),
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
}))
