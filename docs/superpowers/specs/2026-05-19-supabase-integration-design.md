# Supabase Integration Design
Date: 2026-05-19

## Goal
Replace IndexedDB with Supabase as the single source of truth for all dashboard data. Zustand remains as an in-memory UI cache. Data persists across browser refreshes and devices.

## Current Architecture
```
CSV Upload → Parser → Zustand (persist) → IndexedDB
Dashboard pages → useDashboardStore()
```

## Target Architecture
```
CSV Upload → Parser → Server Action → Supabase (upsert)
                    → Zustand (in-memory cache)
App Load → Supabase fetch → Zustand (hydrate)
Dashboard pages → useDashboardStore() [unchanged]
```

## Database Schema (8 tables)

### orders
Primary key: `amazon_order_id + sku`
Key columns: amazon_order_id, purchase_date, sku, asin, item_price, quantity, currency, ship_country, order_status

### inventory
Primary key: `sku + report_date`
Key columns: sku, fnsku, asin, product_name, afn_fulfillable_quantity, afn_total_quantity, report_date

### listing
Primary key: `seller_sku`
Key columns: item_name, seller_sku, asin1, price, status, fulfillment_channel

### traffic
Primary key: `child_asin + report_date`
Key columns: parent_asin, child_asin, sessions_total, page_views_total, buy_box_percentage, unit_session_percentage, ordered_product_sales, report_date

### attribution
Primary key: `date + campaign_id + ad_group_id + product_asin + publisher`
Key columns: date, campaign_id, publisher, attributed_sales_14d, attributed_purchases_14d, product_asin

### sp_campaigns
Primary key: `date + campaign_id`
Key columns: date, campaign_id, campaign_name, impressions, clicks, spend, sales_14d, campaign_status

### sb_campaigns
Primary key: `date + campaign_id`
Key columns: date, campaign_id, campaign_name, impressions, clicks, cost, sales_clicks, campaign_status

### sd_campaigns
Primary key: `date + campaign_id`
Key columns: date, campaign_id, campaign_name, impressions, clicks, cost, sales_clicks, campaign_status

## File Changes

### New files
- `src/lib/supabase/actions.ts` — Server Actions: upsertData(), fetchAllData()
- `src/lib/store/supabaseLoader.ts` — loadFromSupabase() helper

### Modified files
- `src/components/upload/FileDropzone.tsx` — call upsertData() after parse
- `src/lib/store/dashboardStore.ts` — remove IndexedDB persist, add loadFromSupabase on init
- `src/app/providers.tsx` — trigger Supabase hydration on mount

## Data Flow Detail

### Upload
1. User drops CSV → FileDropzone reads file
2. parseCSV() → rows[]
3. setData() updates Zustand (instant UI update)
4. upsertData(type, rows) → Server Action → Supabase upsert (background)

### App Load / Refresh
1. providers.tsx mounts
2. loadFromSupabase() called
3. fetch all 8 tables from Supabase
4. populate Zustand store
5. Dashboard renders with data

## RLS Policy
All tables: public read/write (no auth for now — single-user dashboard)

## Out of Scope
- User authentication
- Multi-tenant data isolation
- Real-time subscriptions
- Data deletion UI
