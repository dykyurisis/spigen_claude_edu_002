import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set as idbSet, del } from 'idb-keyval'
import {
  StorageSchema, DataType,
  SPCampaignRow, SBCampaignRow, SDCampaignRow,
  OrderRow, ListingRow, InventoryRow, TrafficRow, AttributionRow,
} from '@/types/data'

const idbStorage = createJSONStorage(() => ({
  getItem: (name: string) => get<string>(name).then(v => v ?? null),
  setItem: (name: string, value: string) => idbSet(name, value),
  removeItem: (name: string) => del(name),
}))

type DataTypeRowMap = {
  sp_campaigns: SPCampaignRow[]; sb_campaigns: SBCampaignRow[]
  sd_campaigns: SDCampaignRow[]; orders: OrderRow[]; listing: ListingRow[]
  inventory: InventoryRow[]; traffic: TrafficRow[]; attribution: AttributionRow[]
}

interface DashboardState extends StorageSchema {
  setData: <K extends DataType>(type: K, rows: DataTypeRowMap[K]) => void
  setDateRange: (from: string, to: string) => void
  clearAll: () => void
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

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'spigen-de-dashboard-v1',
      storage: idbStorage,
      partialize: (s) => ({
        spCampaigns: s.spCampaigns, sbCampaigns: s.sbCampaigns,
        sdCampaigns: s.sdCampaigns, orders: s.orders, listing: s.listing,
        inventory: s.inventory, traffic: s.traffic, attribution: s.attribution,
        uploadedAt: s.uploadedAt, dateRange: s.dateRange,
      }),
    }
  )
)
