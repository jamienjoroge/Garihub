# Customer Mobile UX Contract & Vehicle History Export

Last updated: 2026-01-23T00:05:00Z

## Screens & API Mapping

### 1. Vehicle List
- Purpose: Show vehicles the garage has serviced for the authenticated customer.
- API calls:
  - `GET /api/vehicles` (read-only, aggregated view; implementation deferred)
- Data fields:
  - `vehicleId`
  - `make`
  - `model`
  - `year`
  - `vin`
  - `lastServiceDate` (derived from latest `ServiceRecordMinted` or `JobCardCreated`)
  - `lastInspectionResult` (derived from latest `InspectionRecorded`)
- Notes:
  - Backed by ledger replay only.
  - No per-vehicle history fetches in list view.
  - Endpoint declared for UX contract completeness; not yet implemented.
- Access: Authenticated (internal user/customer app session)

### 2. Vehicle Detail
- Purpose: Show vehicle master details and quick KPIs.
- API calls:
  - `GET /api/vehicles/:vehicleId/history`
- Data shape:
  - `vehicleId`, `make`, `model`, `year`, `vin`
  - KPIs: `timeline.length`, latest `InvoiceGenerated.totalAmount`, latest `InspectionRecorded.passed`
- Access: Authenticated

- KPIs are derived at read time and never persisted:
  - `timeline.length` → count of replayed vehicle events
  - `latest invoice total` → last `InvoiceGenerated.totalAmount`
  - `latest inspection pass/fail` → last `InspectionRecorded.result`

### 3. Vehicle History Timeline
- Purpose: Chronological, immutable service history.
- API calls:
  - `GET /api/vehicles/:vehicleId/history`
- Data shape (from `VehicleHistoryView`):
  - `vehicleId`, `make`, `model`, `year`, `vin`
  - `timeline[]` ordered by `date`, items:
    - `type` = `JobCardCreated` | `ServiceRecordMinted` | `InspectionRecorded` | `InvoiceGenerated`
    - `date`
    - `details` (jobId/summary/mileage/invoice totals/inspection findings)
- Access: Authenticated or public (with token via shared link)

### 4. Inspection Summary
- Purpose: Latest inspection status and history.
- API calls:
  - `GET /api/vehicles/:vehicleId/inspections`
- Data shape (from `InspectionSummaryView`):
  - `vehicleId`
  - `inspections[]` with `id`, `type`, `date`, `passed`
  - `lastInspectionDate`, `lastResult`, `inspectionCount`
- Access: Authenticated or public (with token via shared link)

### 5. Share Vehicle History
- Purpose: Create read-only, time-bound access for third parties.
- API calls:
  - `POST /api/vehicles/:vehicleId/share`
- Data shape (request):
  - `tokenId`, `expiresAt`, `reason` = `owner_view` | `resale` | `inspection`
- Data shape (response):
  - `event_name` = `VehicleHistoryAccessGranted`
  - `payload` = `vehicleId`, `tokenId`, `expiresAt`, `issuedBy`, `reason`
- Access: Authenticated; idempotent via `x-correlation-id`

### 6. View Shared Vehicle (Read-Only)
- Purpose: Third-party view via public link.
- API calls:
  - `GET /public/vehicles/:vehicleId/history?token=...`
  - `GET /public/vehicles/:vehicleId/inspections?token=...`
- Data shape: same as internal `VehicleHistoryView` and `InspectionSummaryView` outputs
- Access: Public (token-gated); no session; read-only

## Export & Verification Artifacts

### Vehicle History PDF (Read-Only)
- Source: `VehicleHistoryView` + `InspectionSummaryView` via ledger replay only
- Contents:
  - Vehicle details: `vehicleId`, `make`, `model`, `year`, `vin`
  - Timeline: `JobCardCreated`, `ServiceRecordMinted`, `InspectionRecorded`, `InvoiceGenerated` with dates
  - Inspection outcomes summary (`lastInspectionDate`, `lastResult`, list of findings)
  - Invoice summaries: `invoiceId`, `totalAmount`, `date`
- Generation flow:
  - Fetch read models → format into sections → render PDF (no writes, no state changes)
- Compliance:
  - Stable ordering by `date`
  - Timestamps included; content traceable to ledger events

### QR Code (Public Verification)
- Content: Public URL + token
  - `https://<host>/public/vehicles/<vehicleId>/history?token=<tokenId>`
- Placement:
  - Windshield sticker, inspection report, resale listing
- Validation:
  - Public endpoints verify token → vehicleId match and `expiresAt > now`
  - No writes; read-only access

## API Usage Table

- `GET /api/vehicles/:vehicleId/history`
  - Headers: `x-tenant-id`
  - Response: `VehicleHistoryView`
- `GET /api/vehicles/:vehicleId/inspections`
  - Headers: `x-tenant-id`
  - Response: `InspectionSummaryView`
- `POST /api/vehicles/:vehicleId/share`
  - Headers: `x-tenant-id`, `x-user-id`, `x-branch-id`, `x-correlation-id`
  - Body: `tokenId`, `expiresAt`, `reason`
  - Response: `VehicleHistoryAccessGranted` event
- `GET /public/vehicles/:vehicleId/history?token=...`
  - Headers: `x-tenant-id`
  - Response: `VehicleHistoryView` (read-only)
- `GET /public/vehicles/:vehicleId/inspections?token=...`
  - Headers: `x-tenant-id`
  - Response: `InspectionSummaryView` (read-only)

## Views: Internal vs Public

- Internal (authenticated): full detail timelines; ability to initiate share (no domain writes beyond `share`)
- Public (token-gated): identical read outputs; strictly read-only; token must match vehicle and be unexpired

## Security Rules

- For public vehicle endpoints, `x-tenant-id` must match the tenant that issued the access token; otherwise return `403` AuthorizationError.

STOP HERE

Next session recommendation: Define customer notifications (email/SMS) on inspection completion and service record minting, with opt-in preferences and audit-safe delivery logs.