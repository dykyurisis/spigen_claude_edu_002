# PRD: Spigen DE Amazon Unified Analytics Dashboard

**Version:** 1.0  
**Date:** 2026-05-11  
**Stack:** Next.js 16 · TypeScript · Tailwind CSS  
**Storage (v1):** LocalStorage (Vercel 배포, 서버 DB 없음)

---

## 1. 배경 및 문제 정의

슈피겐 독일 법인(Amazon.de)은 SP·SB·SD 광고, 주문, 재고, 트래픽, 외부 채널 어트리뷰션 등 8종의 데이터를 Amazon Seller Central에서 **각각 별도 리포트**로 관리한다. 현재는:

- 광고 유형 간(SP/SB/SD) ROAS 비교가 불가능하다.
- Google Ads·Instagram·Facebook의 Amazon 기여 매출을 광고비와 함께 보는 뷰가 없다.
- 재고 소진 위험과 광고 예산 배분을 동시에 판단할 단일 화면이 없다.
- 리포트마다 어트리뷰션 윈도우가 달라 단순 합산 시 이중 계산이 발생한다.

---

## 2. 목표

| 목표 | 측정 지표 |
|------|----------|
| 광고·판매·트래픽 통합 뷰 제공 | 대시보드 1개에서 전체 채널 ROAS 조회 가능 |
| 예산 배분 의사결정 시간 단축 | 리포트 전환 횟수 0회 (단일 화면) |
| ASIN 단위 수익성 파악 | ASIN별 광고비 + 유기 매출 + 재고 현황 동시 표시 |

---

## 3. 사용자

**Primary:** 슈피겐 DE 광고 담당자 (1–2인)  
- 매일 캠페인 성과를 확인하고 예산·입찰가를 조정한다.
- CSV를 수동으로 다운로드 후 업로드하는 방식을 수용한다.

**Secondary:** 사업부 관리자  
- 주 1회 채널별 ROAS, 매출, 재고 요약을 확인한다.

---

## 4. 데이터 소스 & 스키마

### 4.1 파일 목록

| 파일명 | 유형 | 기본 조인 키 | 어트리뷰션 윈도우 |
|--------|------|-------------|-----------------|
| `zocoding_spCampaigns_sample.csv` | SP 광고 캠페인 | `campaignId`, `date` | 1d / 7d / **14d** / 30d |
| `zocoding_sbCampaigns_sample.csv` | SB 광고 캠페인 | `campaignId`, `date` | 클릭 기준 (14d 동등) |
| `zocoding_sdCampaigns_sample.csv` | SD 광고 캠페인 | `campaignId`, `date` | 클릭+뷰 분리 |
| `zocoding_order_sample.csv` | 주문 내역 | `asin`, `sku`, `purchase-date` | — |
| `zocoding_listing_sample.csv` | 상품 리스팅 | `asin1` (=ASIN), `seller-sku` | — |
| `zocoding_inventory_sample.csv` | FBA 재고 | `asin`, `sku`, `report_date` | — |
| `zocoding_traffic_sample.csv` | 트래픽 (ASIN별) | `(Child) ASIN`, `report_date` | — |
| `zocoding_attribution_sample.csv` | 외부 채널 어트리뷰션 | `campaignId`, `productAsin`, `date` | 14d 고정 |

### 4.2 조인 전략

```
SP/SB/SD campaigns ──campaignId──► Attribution ──productAsin──► Traffic
                                                              └──► Orders
                                                              └──► Listing (asin1)
                                                              └──► Inventory (asin)
```

**핵심 문제 및 처리 방침:**

| 불일치 | 처리 방침 |
|--------|----------|
| Traffic 컬럼명이 `(Child) ASIN` (공백·괄호 포함) | 파싱 시 `childAsin`으로 정규화 |
| Listing의 ASIN이 `asin1 / asin2 / asin3`으로 분산 | `asin1`을 primary로 사용, `asin2/3`은 별칭 |
| SP는 14d 윈도우 컬럼 명시 (`sales14d`), SB는 `salesClicks`, SD는 `salesClicks` | 비교 지표는 모두 **14d 기준**으로 통일 — SP: `sales14d`, SB: `salesClicks`, SD: `salesClicks` |
| Attribution은 캠페인 → ASIN 브릿지 역할 | 광고 캠페인에 직접 ASIN 없으므로 attribution을 통해 제품 매핑 |
| SD에 뷰 어트리뷰션(`salesViews`) 추가 존재 | 기본 표시는 클릭만, 뷰 포함 토글로 전환 가능 |

---

## 5. 기능 명세

### 5.1 공통 UX 요소

- **날짜 범위 선택기**: 사전 정의 구간(오늘, 7일, 30일, 커스텀) + 비교 기간 토글
- **파일 업로드 모달**: 8종 파일을 드래그앤드롭으로 업로드, 파일명으로 자동 타입 감지
- **통화**: 모든 금액은 EUR로 표시
- **새로고침 없이 파일 교체**: 동일 타입 재업로드 시 LocalStorage 덮어쓰기 후 즉시 반영
- **사이드바 내비게이션**: 5개 페이지 고정 메뉴

---

### 5.2 Page 1 — Overview (홈)

**목적:** 전체 성과를 30초 안에 파악하는 경영진 요약 뷰

#### KPI 카드 (상단 6개)

| 카드 | 계산식 | 데이터 소스 |
|------|--------|------------|
| 총 매출 | `sum(item-price)` | orders |
| 총 광고비 | `sum(spend_SP + cost_SB + cost_SD)` | SP+SB+SD |
| Blended ROAS | 총 매출 / 총 광고비 | orders + SP+SB+SD |
| 총 주문 수 | `count(amazon-order-id)` | orders |
| 평균 CVR | `avg(unit-session-percentage)` | traffic |
| Buy Box 점유율 | `avg(Featured Offer %)` | traffic |

#### 채널별 매출 기여 차트
- 도넛 차트: 유기(광고비 0), SP, SB, SD, Google Ads, Instagram, Facebook
- Attribution의 `attributedSales14d`를 외부 채널 기여로 집계
- Brand Halo 매출은 별도 색상으로 적층(stacked)

#### 일별 트렌드 라인
- x축: 날짜, y축(이중): 매출(EUR) + 광고비(EUR)
- 선택한 날짜 범위 내 SP+SB+SD 일별 spend와 orders 일별 revenue

---

### 5.3 Page 2 — 광고 성과 (Advertising)

**목적:** SP / SB / SD / 외부채널을 하나의 화면에서 비교

#### 상단 탭: `SP` · `SB` · `SD` · `Attribution` · `All`

#### 공통 캠페인 테이블

| 컬럼 | SP | SB | SD | Attribution |
|------|----|----|----|-------------|
| 캠페인명 | campaignName | campaignName | campaignName | campaignId |
| 노출 | impressions | impressions | impressions | — |
| 클릭 | clicks | clicks | clicks | — |
| CTR | clicks/impressions | clicks/impressions | clicks/impressions | — |
| 광고비 | spend | cost | cost | — |
| 광고 매출(14d) | sales14d | salesClicks | salesClicks | attributedSales14d |
| ROAS | sales14d/spend | salesClicks/cost | salesClicks/cost | attributedSales14d/— |
| ACoS | spend/sales14d | cost/salesClicks | cost/salesClicks | — |
| 예산 | campaignBudgetAmount | campaignBudgetAmount | campaignBudgetAmount | — |
| 예산 소진율 | spend/budget | cost/budget | cost/budget | — |
| 상태 | campaignStatus | campaignStatus | campaignStatus | — |

#### SB 전용 추가 컬럼
- `newToBrandPurchases`, `newToBrandSales`, `newToBrandPurchasesPercentage`
- `detailPageViews`, `brandedSearches`

#### SD 전용 추가 컬럼
- `cumulativeReach`
- 뷰 어트리뷰션 토글: `salesClicks` ↔ `salesClicks + salesViews` (있을 경우)

#### Attribution 탭
- Publisher 그룹: Google Ads / Instagram / Facebook
- 컬럼: Publisher, 캠페인 수, `attributedPurchases14d`, `attributedSales14d`, `attributedNewToBrandSales14d`, `brandHaloAttributedSales14d`
- Brand Halo vs Promoted 분리 표시

#### All 탭
- SP·SB·SD 캠페인을 단일 테이블로 병합 (광고 유형 컬럼 추가)
- Attribution은 별도 섹션으로 하단에 표시 (spend 데이터 없으므로 ROAS 계산 불가, 기여 매출만 표시)
- 매출은 모두 14d 기준으로 표시하여 비교 가능하게 정규화
- 어트리뷰션 윈도우 안내 툴팁 표시

---

### 5.4 Page 3 — 상품 성과 (Product)

**목적:** ASIN 단위로 광고·트래픽·매출을 통합 분석

#### ASIN 테이블

| 컬럼 | 소스 |
|------|------|
| ASIN | listing (asin1) |
| 상품명 | listing (item-name) |
| 세션 수 | traffic (Sessions - Total) |
| 페이지뷰 | traffic (Page Views - Total) |
| CVR | traffic (Unit session percentage) |
| Buy Box % | traffic (Featured Offer %) |
| 주문 수 | orders (count per ASIN) |
| 매출(EUR) | orders (sum of item-price) |
| 광고 매출(14d) | attribution (sum of attributedSales14d per productAsin) |
| Brand Halo 매출 | attribution (brandHaloAttributedSales14d) |
| FBA 가용 재고 | inventory (afn-fulfillable-quantity) |
| 예상 재고 소진일 | afn-fulfillable-quantity / (주문 수 / 날짜 범위일수) |

#### 클릭 드릴다운
- ASIN 행 클릭 → 사이드 패널:
  - 연결된 광고 캠페인 목록 (attribution.campaignId 통해)
  - 일별 세션·주문 트렌드
  - 재고 수준 게이지

---

### 5.5 Page 4 — 재고 (Inventory)

**목적:** FBA 재고 위험 조기 감지

#### 재고 상태 테이블

| 컬럼 | 소스 |
|------|------|
| ASIN / SKU | inventory |
| 상품명 | inventory (product-name) |
| 판매가 | inventory (your-price) |
| 판매 가능 재고 | afn-fulfillable-quantity |
| 예약 재고 | afn-reserved-quantity |
| 입고 중 | afn-inbound-working-quantity + afn-inbound-shipped-quantity |
| 입고 대기 | afn-inbound-receiving-quantity |
| 총 재고 | afn-total-quantity |
| 일 평균 판매량 | orders 기준 계산 |
| 예상 소진일 | afn-fulfillable-quantity / 일 평균 판매량 |
| 상태 뱃지 | 위험(<14일) / 주의(14-30일) / 정상(>30일) |

#### 요약 KPI
- 위험 재고 ASIN 수 / 주의 ASIN 수 / 입고 진행 중 ASIN 수

---

### 5.6 Page 5 — 외부 채널 어트리뷰션 (Attribution)

**목적:** Google Ads·Instagram·Facebook의 Amazon 기여 성과 분석

#### Publisher별 성과 카드
- Google Ads / Instagram / Facebook 각각:
  - `attributedPurchases14d`, `attributedSales14d`
  - `attributedNewToBrandPurchases14d`, `attributedNewToBrandSales14d`
  - `brandHaloAttributedSales14d`, `brandHaloAttributedPurchases14d`

#### 전환 유형 분리
- `productConversionType` 컬럼 기준: `Promoted` vs `Brand Halo` 비율 도넛 차트

#### NTB (New-to-Brand) 분석
- NTB 판매 비율: `attributedNewToBrandSales14d / attributedSales14d`
- Publisher별 NTB Rate 비교 바 차트

#### 캠페인 연결
- `campaignId`로 SP·SB·SD 캠페인명 룩업 후 표시 (매핑 불가 시 campaignId 원문 표시)

---

## 6. 지표 정의 (Metric Glossary)

| 지표명 | 정의 | 비고 |
|--------|------|------|
| **ROAS** | 광고 매출(14d) / 광고비 | SP: sales14d, SB/SD: salesClicks, Ext: attributedSales14d |
| **ACoS** | 광고비 / 광고 매출(14d) × 100 | % 표시 |
| **Blended ROAS** | 총 주문 매출 / 전체 광고비 합산 | SP+SB+SD 비용만 포함 (외부 매체비 미포함) |
| **CVR** | 주문 수 / 세션 수 | traffic의 unit-session-percentage 사용 |
| **NTB Rate** | NTB 구매 수 / 전체 구매 수 | SB/Attribution에서 계산 |
| **예상 소진일** | 가용 재고 / 일 평균 판매량 | 선택 날짜 범위 기준 계산 |
| **Brand Halo 매출** | 직접 광고하지 않은 ASIN에 기여된 매출 | attribution.brandHaloAttributedSales14d |
| **예산 소진율** | 당일 spend / campaignBudgetAmount | DAILY_BUDGET 타입만 |

---

## 7. 기술 아키텍처

### 7.1 폴더 구조

```
src/
├── app/
│   ├── page.tsx                  # Overview
│   ├── advertising/page.tsx
│   ├── product/page.tsx
│   ├── inventory/page.tsx
│   ├── attribution/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                       # KPI 카드, 테이블, 탭, 뱃지
│   ├── charts/                   # 도넛, 라인, 바 차트
│   ├── upload/                   # 파일 업로드 모달
│   └── layout/                   # 사이드바, 헤더
├── lib/
│   ├── parsers/                  # CSV 파서 (파일 타입별)
│   ├── store/                    # LocalStorage 관리 (Zustand 또는 Context)
│   ├── joins/                    # ASIN/SKU/campaignId 조인 로직
│   └── metrics/                  # 지표 계산 함수
└── types/
    └── data.ts                   # 8종 데이터 타입 정의
```

### 7.2 데이터 흐름

```
CSV 업로드
  → 브라우저 FileReader API
  → 타입별 CSV 파서 (컬럼 정규화 포함)
  → LocalStorage 저장 (파일 타입 키로 구분)
  → Zustand/Context store에 로드
  → 페이지별 조인·집계 함수
  → 차트·테이블 컴포넌트 렌더링
```

### 7.3 LocalStorage 구조

```typescript
interface StorageSchema {
  sp_campaigns:  SPCampaignRow[];
  sb_campaigns:  SBCampaignRow[];
  sd_campaigns:  SDCampaignRow[];
  orders:        OrderRow[];
  listing:       ListingRow[];
  inventory:     InventoryRow[];
  traffic:       TrafficRow[];
  attribution:   AttributionRow[];
  uploaded_at:   Record<DataType, string>; // ISO timestamp
}
```

### 7.4 라이브러리

| 용도 | 라이브러리 |
|------|-----------|
| CSV/XLSX 파싱 | `papaparse` (CSV), `xlsx` (XLSX) |
| 차트 | `recharts` |
| 상태 관리 | `zustand` |
| 날짜 처리 | `date-fns` |
| 테이블 | `@tanstack/react-table` |

---

## 8. V1 출시 범위

### In Scope

- [ ] CSV 수동 업로드 (8종, 파일명 자동 감지)
- [ ] LocalStorage 저장 및 세션 간 유지
- [ ] 날짜 범위 필터 (7일 / 30일 / 커스텀)
- [ ] Overview 페이지 (KPI 6개 + 도넛 + 라인 차트)
- [ ] Advertising 페이지 (SP·SB·SD·Attribution 탭, 캠페인 테이블)
- [ ] Product 페이지 (ASIN 테이블, 드릴다운 사이드 패널)
- [ ] Inventory 페이지 (재고 상태 테이블 + 위험 뱃지)
- [ ] Attribution 페이지 (Publisher 카드 + NTB 분석)
- [ ] ROAS / ACoS / Blended ROAS 계산
- [ ] SP 어트리뷰션 윈도우 14d 통일 처리

### Out of Scope (V2+)

- Amazon SP API / Advertising API 연동 (실시간 데이터)
- 서버 DB (PostgreSQL 등)
- 사용자 인증 / 멀티 유저
- 자동 리포트 다운로드 스케줄링
- 머신러닝 기반 예측 (입찰가 추천 등)
- SD 뷰 어트리뷰션 토글
- 다국가(DE 외) 지원

---

## 9. 알려진 제약 및 리스크

| 리스크 | 내용 | 완화 방안 |
|--------|------|----------|
| ASIN 매핑 누락 | Attribution의 `productAsin`이 listing에 없는 경우 | 매핑 불가 ASIN은 "Unknown Product"로 표시, 별도 경고 배너 |
| SP 이중 계산 | 1d/7d/14d/30d 중 복수 선택 시 매출 중복 | UI에서 14d 단일 기준 강제, 툴팁으로 설명 |
| SD 뷰+클릭 혼산 | `salesViews` 포함 시 SP와 비교 불가 | 기본값 클릭 전용, 뷰 포함은 V2 |
| LocalStorage 용량 | 대량 데이터 시 5MB 한계 | 파일당 최대 행 수 경고 (예: 50,000행 초과 시) |
| 날짜 형식 불일치 | SP/SB/SD는 `YYYY-MM-DD`, 주문은 ISO 8601, 재고·트래픽은 `YYYYMMDD` | 파서에서 `date-fns/parse`로 통일 정규화 |

---

## 10. 미결 사항 (Open Questions)

1. **파일명 자동 감지 규칙**: 현재 `zocoding_spCampaigns` 패턴 기반 — 파일명이 변경될 경우 수동 타입 지정 UI 필요 여부
2. **SD 뷰 어트리뷰션**: `salesViews` 컬럼이 실제 데이터에 존재하는지 확인 필요 (샘플에 없음)
3. **SB `sales` vs `salesClicks`**: SB 파일의 `sales` 컬럼과 `salesClicks` 컬럼의 정확한 차이 확인 필요 (샘플에서 모두 0)
4. **Attribution `adGroupId` 활용**: 그룹 레벨 분석이 필요한지 여부
5. **LocalStorage 암호화**: 매출·판매 데이터 민감도를 감안한 암호화 적용 여부

---

*이 PRD는 데이터 샘플 파일 분석 및 Spigen DE 운영 맥락을 기반으로 작성되었습니다.*
