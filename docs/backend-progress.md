# Backend Progress Tracker
⚠️ Status definitions:
- IN_PROGRESS = Code exists but is not executable end-to-end
- IMPLEMENTED = Fully wired, callable, validated, and idempotent
- TESTED = Covered by automated or manual verification

Last updated: 2026-01-23T04:20:00Z

This tracker records backend implementation status per domain event. Status values: NOT_STARTED | IN_PROGRESS | IMPLEMENTED | TESTED.

## Format
- Domain module
- Event name
- Status
- Files created/updated
- API endpoints involved
- Open questions or blockers
- Last updated timestamp

---

## Core Infrastructure
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Core Infrastructure | EventLedger | IMPLEMENTED | src/backend/core/event-ledger/Ledger.ts | | FS-based JSONL storage; SHA-256 hash for ServiceRecordMinted | 2026-01-22T00:10:00Z |
| Core Infrastructure | Database – Postgres EventLedger | IN_PROGRESS | src/backend/db/migrations/001_event_ledger.sql, src/backend/core/event-ledger/PostgresLedger.ts, src/backend/db/pg.ts | | Toggle via LEDGER_BACKEND env; default FS; tests gated by env | 2026-01-26T00:10:00Z |

## Job Management
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Job Management | JobCardCreated | IMPLEMENTED | src/backend/modules/job-management/app/services.ts | `POST /api/jobs` | External gateways needed for existence checks | 2026-01-22T00:15:00Z |
| Job Management | JobCompleted | IMPLEMENTED | src/backend/modules/job-management/app/services.ts | `POST /api/jobs/:id/complete` | Requires parts and labor present via read model | 2026-01-22T00:15:00Z |
| Job Management | JobStatusChanged | NOT_STARTED | | `POST /api/jobs/:id/status` | Valid transitions enforcement | 2026-01-22T00:00:00Z |
| Job Management | JobAssigned | NOT_STARTED | | `POST /api/jobs/:id/assign` | Role-based authorization checks | 2026-01-22T00:00:00Z |
| Job Management | JobDiagnosisCompleted | NOT_STARTED | | `POST /api/jobs/:id/diagnosis` | AI/manual review step | 2026-01-22T00:00:00Z |
| Job Management | JobEstimateGenerated | NOT_STARTED | | `POST /api/jobs/:id/estimate` | Parts/labor breakdown validation | 2026-01-22T00:00:00Z |
| Job Management | JobApproved | NOT_STARTED | | `POST /api/jobs/:id/approve` | Customer consent capture | 2026-01-22T00:00:00Z |
| Job Management | JobStarted | NOT_STARTED | | `POST /api/jobs/:id/start` | READY-only precondition | 2026-01-22T00:00:00Z |
| Job Management | JobPaused | NOT_STARTED | | `POST /api/jobs/:id/pause` | Pause reason tracking | 2026-01-22T00:00:00Z |
| Job Management | JobResumed | NOT_STARTED | | `POST /api/jobs/:id/resume` | Labor split handling | 2026-01-22T00:00:00Z |
| Job Management | JobCancelled | NOT_STARTED | | `POST /api/jobs/:id/cancel` | Inventory returns handling | 2026-01-22T00:00:00Z |
| Job Management | ServiceRecordMinted | NOT_STARTED | | `POST /api/service-records` | Hash-chain and immutability guarantees | 2026-01-22T00:00:00Z |
| Job Management | PartAddedToJob | NOT_STARTED | | `POST /api/jobs/:id/parts` | FIFO costing enforcement | 2026-01-22T00:00:00Z |
| Job Management | PartRemovedFromJob | NOT_STARTED | | `DELETE /api/jobs/:id/parts/:partId` | Restore original cost on returns | 2026-01-22T00:00:00Z |
| Job Management | LaborTimeRecorded | NOT_STARTED | | `POST /api/jobs/:id/labor` | Minimum billing increments, overtime | 2026-01-22T00:00:00Z |
| Job Management | LaborRateApplied | NOT_STARTED | | `POST /api/jobs/:id/labor/rate` | Technician level-based rates | 2026-01-22T00:00:00Z |

## Job Management – HTTP Layer
| Domain Module | Event Name | Scope | Status | Files Created/Updated | API Endpoints | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Job Management | JobCardCreated | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/jobs.ts, src/backend/http/metadata.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/jobs` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:28:00Z |
| Job Management | JobStarted | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/jobs.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/jobs/:id/start` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:28:00Z |
| Job Management | PartAddedToJob | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/jobs.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/jobs/:id/parts` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:28:00Z |
| Job Management | LaborTimeRecorded | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/jobs.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/jobs/:id/labor` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:28:00Z |
| Job Management | JobCompleted | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/jobs.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/jobs/:id/complete` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:28:00Z |

## Customer & Vehicles
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Customer & Vehicles | CustomerRegistered | NOT_STARTED | | `POST /api/customers` | Unique phone/email validation source | 2026-01-22T00:00:00Z |
| Customer & Vehicles | VehicleRegistered | NOT_STARTED | | `POST /api/vehicles` | VIN uniqueness & gov DB validation | 2026-01-22T00:00:00Z |
| Customer & Vehicles | AppointmentBooked | NOT_STARTED | | `POST /api/appointments` | Technician availability check | 2026-01-22T00:00:00Z |

## Sales & Invoicing
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Sales & Invoicing | QuotationCreated | NOT_STARTED | | `POST /api/quotations` | Tax breakdown lines | 2026-01-22T00:00:00Z |
| Sales & Invoicing | SalesOrderCreated | NOT_STARTED | | `POST /api/orders` | Sequential order numbers | 2026-01-22T00:00:00Z |
| Sales & Invoicing | InvoiceGenerated | NOT_STARTED | | `POST /api/invoices` | Kenya VAT 16% compliance | 2026-01-22T00:00:00Z |
| Sales & Invoicing | PaymentRecorded | NOT_STARTED | | `POST /api/payments` | Allocation rules | 2026-01-22T00:00:00Z |

## Inventory
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Inventory | StockReceived | NOT_STARTED | | `POST /api/inventory/receipts` | PO matching & average cost | 2026-01-22T00:00:00Z |
| Inventory | StockIssued | NOT_STARTED | | `POST /api/inventory/issue` | FIFO costing enforcement | 2026-01-22T00:00:00Z |
| Inventory | StockAdjusted | NOT_STARTED | | `POST /api/inventory/adjustments` | Manager approval workflow | 2026-01-22T00:00:00Z |

## Finance & Accounting
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Finance & Accounting | GenerateInvoice (Command) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/commands.ts | HIGH | HTTP endpoint not yet exposed | 2026-01-22T00:40:00Z |
| Finance & Accounting | InvoiceGenerated (Event) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:40:00Z |
| Finance & Accounting | VATCalculated (Event) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:40:00Z |
| Finance & Accounting | JournalEntryPosted (Event) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:40:00Z |
| Finance & Accounting | FinanceService.generateInvoice | SERVICE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:40:00Z |
| Finance & Accounting | InvoiceView | READ | IMPLEMENTED | src/backend/modules/finance-accounting/read/models.ts | MEDIUM | Performance tuning for large ledgers | 2026-01-22T00:40:00Z |
| Finance & Accounting | VatLedgerView (monthly) | READ | IMPLEMENTED | src/backend/modules/finance-accounting/read/models.ts | HIGH | None | 2026-01-22T00:40:00Z |
| Finance & Accounting | AccountBalanceView | READ | IMPLEMENTED | src/backend/modules/finance-accounting/read/models.ts | HIGH | None | 2026-01-22T00:40:00Z |

## Finance & Accounting – HTTP Layer
| Domain Module | Artifact | Scope | Status | Files Created/Updated | API Endpoints | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Finance & Accounting | GenerateInvoice | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/invoices.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/invoices` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:45:00Z |
> Covered by integration tests (success, error mapping, idempotency)

## Finance & Accounting – Payments & Receipts
| Domain Module | Artifact | Scope | Status | Files Created/Updated | API Endpoints | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Finance & Accounting | RecordPayment (Command) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/commands.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | PaymentRecorded (Event) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | JournalEntryPosted (Event) | WRITE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | FinanceService.recordPayment | SERVICE | IMPLEMENTED | src/backend/modules/finance-accounting/write/services.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | PaymentsView | READ | IMPLEMENTED | src/backend/modules/finance-accounting/read/models.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | OutstandingInvoicesView | READ | IMPLEMENTED | src/backend/modules/finance-accounting/read/models.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | CashBalanceView | READ | IMPLEMENTED | src/backend/modules/finance-accounting/read/models.ts | HIGH | None | 2026-01-22T00:55:00Z |
| Finance & Accounting | RecordPayment | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/payments.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/payments` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T00:55:00Z |
> Covered by integration tests (success, error mapping, idempotency)

## HR & Payroll
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| HR & Payroll | PayrollProcessed | NOT_STARTED | | `POST /api/hr/payroll/process` | Statutory deductions correctness | 2026-01-22T00:00:00Z |
| HR & Payroll | PayrollApproved | NOT_STARTED | | `POST /api/hr/payroll/approve` | Approval limits & audit | 2026-01-22T00:00:00Z |
| HR & Payroll | PayrollPaid | NOT_STARTED | | `POST /api/hr/payroll/pay` | Journal linkage | 2026-01-22T00:00:00Z |

## AI Integrations
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| AI Integrations | AiDiagnosisRequested | NOT_STARTED | | `POST /api/ai/diagnose` | API rate limit & cost tracking | 2026-01-22T00:00:00Z |
| AI Integrations | AiDiagnosisCompleted | NOT_STARTED | | `POST /api/ai/diagnose/callback` | Review gate before use | 2026-01-22T00:00:00Z |

## Multi-Tenant & Branch Control
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Multi-Tenant & Branch Control | BranchCreated | NOT_STARTED | | `POST /api/branches` | Unique branch code policy | 2026-01-22T00:00:00Z |
| Multi-Tenant & Branch Control | UserBranchAccessGranted | NOT_STARTED | | `POST /api/branches/:id/access` | Role-based permissions | 2026-01-22T00:00:00Z |

## Reporting & Read Models
| Domain Module | Event Name | Status | Files Created/Updated | API Endpoints | Open Questions / Blockers | Last Updated |
|---|---|---|---|---|---|---|
| Reporting & Read Models | ConsolidatedFinancialReportGenerated | NOT_STARTED | | `GET /api/reports/consolidated` | Inter-branch eliminations | 2026-01-22T00:00:00Z |
| Reporting & Read Models | BranchPerformanceCalculated | NOT_STARTED | | `GET /api/reports/branch-performance` | KPI definitions | 2026-01-22T00:00:00Z |
## Manager Dashboard – Read Models
| Domain Module | Artifact | Scope | Status | Files Created/Updated | API Endpoints | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Reporting & Read Models | ManagerMonthlySummary | READ | IMPLEMENTED | src/backend/modules/reporting-read-models/manager.ts | `GET /api/manager/summary` | HIGH | Cash per-branch balance refinement | 2026-01-22T01:20:00Z |
| Reporting & Read Models | JobProfitabilityView | READ | IMPLEMENTED | src/backend/modules/reporting-read-models/manager.ts | `GET /api/manager/jobs/profitability` | HIGH | Vehicle linkage relies on JobCardCreated | 2026-01-22T01:20:00Z |
## Customer Vehicle History & Inspections
| Domain Module | Artifact | Scope | Status | Files Created/Updated | API Endpoints | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Customer & Vehicles | ServiceRecordMinted (Event) | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/events.ts, write/services.ts |  | HIGH | Hash chaining via EventLedger | 2026-01-22T01:35:00Z |
| Customer & Vehicles | InspectionRecorded (Event) | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/events.ts, write/services.ts |  | HIGH | None | 2026-01-22T01:35:00Z |
| Customer & Vehicles | MintServiceRecord (Command) | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/commands.ts |  | HIGH | None | 2026-01-22T01:35:00Z |
| Customer & Vehicles | RecordInspection (Command) | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/commands.ts |  | HIGH | None | 2026-01-22T01:35:00Z |
| Customer & Vehicles | CustomerVehicleService | SERVICE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/services.ts |  | HIGH | None | 2026-01-22T01:35:00Z |
| Customer & Vehicles | VehicleHistoryView | READ | IMPLEMENTED | src/backend/modules/customer-vehicles/read/models.ts | `GET /api/vehicles/:vehicleId/history` | HIGH | None | 2026-01-22T01:35:00Z |
| Customer & Vehicles | InspectionSummaryView | READ | IMPLEMENTED | src/backend/modules/customer-vehicles/read/models.ts | `GET /api/vehicles/:vehicleId/inspections` | HIGH | None | 2026-01-22T01:35:00Z |
| Customer & Vehicles | RecordInspection | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/vehicles.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/vehicles/:vehicleId/inspections` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T01:35:00Z |
> Read models and HTTP endpoints powered entirely by ledger replay; write path emits immutable events suitable for resale/pre-purchase audit.
## Customer Mobile Access & Public Vehicle History
| Domain Module | Artifact | Scope | Status | Files Created/Updated | API Endpoints | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Customer & Vehicles | VehicleHistoryAccessGranted (Event) | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/events.ts, write/accessService.ts |  | HIGH | None | 2026-01-22T01:50:00Z |
| Customer & Vehicles | GrantVehicleHistoryAccess (Command) | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/commands.ts |  | HIGH | None | 2026-01-22T01:50:00Z |
| Customer & Vehicles | VehicleAccessService.grant | SERVICE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/accessService.ts |  | HIGH | None | 2026-01-22T01:50:00Z |
| Customer & Vehicles | Token Access Views | READ | IMPLEMENTED | src/backend/modules/customer-vehicles/read/access.ts | `GET /public/vehicles/:vehicleId/history` `GET /public/vehicles/:vehicleId/inspections` | HIGH | Token expiry and vehicle match enforced | 2026-01-22T01:50:00Z |
| Customer & Vehicles | Share Access | HTTP | IMPLEMENTED | src/backend/http/server.ts, src/backend/http/controllers/vehicles.ts, src/backend/http/errors.ts, src/backend/http/idempotency.ts | `POST /api/vehicles/:vehicleId/share` | HIGH | Retry-safe; idempotent via tenant_id + correlation_id | 2026-01-22T01:50:00Z |
> Public endpoints are strictly read-only and validated via token + expiry; suitable for resale and inspection verification use cases.
## Notifications – Delivery Worker (Stub)
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | Worker | WORKER | IMPLEMENTED | src/backend/workers/notifications/worker.ts, providerStub.ts, run.mjs | HIGH | Provider integration, retries, rate limiting | 2026-01-23T00:08:00Z |
| Notifications | Worker Tests | TEST | IMPLEMENTED | src/backend/workers/notifications/__tests__/worker.test.ts | HIGH | CI wiring | 2026-01-23T00:08:00Z |

## Notifications – SMS Provider Adapter
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | Provider Interface | PROVIDER | IMPLEMENTED | src/backend/workers/notifications/providers/INotificationProvider.ts | HIGH | None | 2026-01-23T00:20:00Z |
| Notifications | SmsProvider | PROVIDER | IMPLEMENTED | src/backend/workers/notifications/providers/SmsProvider.ts | MEDIUM | Real API integration, credentials management | 2026-01-23T00:20:00Z |
| Notifications | Worker Injection | WORKER | IMPLEMENTED | src/backend/workers/notifications/worker.ts, run.mjs | HIGH | Error handling and retries | 2026-01-23T00:20:00Z |
| Notifications | Provider Tests | TEST | IMPLEMENTED | src/backend/workers/notifications/__tests__/provider.test.ts | HIGH | CI wiring | 2026-01-23T00:20:00Z |
## Notifications – Retries & Rate Limiting
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | Retry & Attempt Events | WRITE | IMPLEMENTED | src/backend/modules/notifications/write/events.ts | HIGH | Policy tuning | 2026-01-23T00:35:00Z |
| Notifications | Outbox (due-only) & History (attempts) | READ | IMPLEMENTED | src/backend/modules/notifications/read/models.ts | HIGH | Performance on large ledgers | 2026-01-23T00:35:00Z |
| Notifications | Worker (retries + rate limiting) | WORKER | IMPLEMENTED | src/backend/workers/notifications/worker.ts | HIGH | Backoff windows, configurability | 2026-01-23T00:35:00Z |
| Notifications | Tests | TEST | IMPLEMENTED | src/backend/workers/notifications/__tests__/retries.test.ts | MEDIUM | CI wiring, time control for backoff | 2026-01-23T00:35:00Z |
## Notifications – Cost Tracking & Budgets
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | Cost & Budget Events | WRITE | IMPLEMENTED | src/backend/modules/notifications/write/events.ts | HIGH | Real provider billing integration | 2026-01-23T00:50:00Z |
| Notifications | Spend & Budget Views | READ | IMPLEMENTED | src/backend/modules/notifications/read/models.ts | HIGH | Performance on large ledgers | 2026-01-23T00:50:00Z |
| Notifications | Worker (costs + budget enforcement) | WORKER | IMPLEMENTED | src/backend/workers/notifications/worker.ts | HIGH | Configurable limits per tenant | 2026-01-23T00:50:00Z |
| Notifications | Tests | TEST | IMPLEMENTED | src/backend/workers/notifications/__tests__/costs.test.ts | MEDIUM | CI wiring | 2026-01-23T00:50:00Z |
## Notifications – Real SMS Gateway
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | AfricasTalkingSmsProvider | PROVIDER | IMPLEMENTED | src/backend/workers/notifications/providers/AfricasTalkingSmsProvider.ts | MEDIUM | Delivery receipts, real creds management | 2026-01-23T01:05:00Z |
| Notifications | Failure Normalization | PROVIDER | IMPLEMENTED | src/backend/workers/notifications/providers/normalizeSmsFailure.ts | HIGH | Extend mappings per provider docs | 2026-01-23T01:05:00Z |
| Notifications | Worker Integration | WORKER | IMPLEMENTED | src/backend/workers/notifications/worker.ts | HIGH | Advanced retry categories | 2026-01-23T01:05:00Z |
| Notifications | Tests | TEST | IMPLEMENTED | src/backend/workers/notifications/__tests__/normalizeSmsFailure.test.ts | HIGH | CI wiring | 2026-01-23T01:05:00Z |
## Notifications – Delivery Receipts Webhook
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | DeliveryReceiptReceived (Event) | WRITE | IMPLEMENTED | src/backend/modules/notifications/write/events.ts, write/receiptService.ts | HIGH | Reconciliation policies | 2026-01-23T01:20:00Z |
| Notifications | SMS Receipt Webhook | HTTP | IMPLEMENTED | src/backend/http/controllers/webhooks.ts, src/backend/http/server.ts | HIGH | Provider signature verification | 2026-01-23T01:20:00Z |
| Notifications | Receipt Views | READ | IMPLEMENTED | src/backend/modules/notifications/read/models.ts | MEDIUM | UI association & reporting | 2026-01-23T01:20:00Z |
| Notifications | Tests | TEST | IMPLEMENTED | src/backend/http/__tests__/webhooks.int.test.ts | MEDIUM | CI wiring | 2026-01-23T01:20:00Z |
## Notifications – Reconciliation
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | NotificationDeliveryReconciled (Event) | WRITE | IMPLEMENTED | src/backend/modules/notifications/write/events.ts, write/reconcileService.ts | HIGH | Policy expansion | 2026-01-23T01:35:00Z |
| Notifications | ReconcileService | WORKER/BATCH | IMPLEMENTED | src/backend/modules/notifications/write/reconcileService.ts | HIGH | Scheduling strategies | 2026-01-23T01:35:00Z |
| Notifications | Admin Trigger (optional) | HTTP | IMPLEMENTED | src/backend/http/controllers/admin.ts, src/backend/http/server.ts | MEDIUM | AuthN/Z hardening | 2026-01-23T01:35:00Z |
| Notifications | Tests | TEST | IMPLEMENTED | src/backend/modules/notifications/__tests__/reconcile.test.ts | MEDIUM | CI wiring, detailed scenarios | 2026-01-23T01:35:00Z |
## Notifications – Proof Views
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | Proof Projections | READ | IMPLEMENTED | src/backend/modules/notifications/read/proof.ts | HIGH | Perf on large ledgers | 2026-01-23T01:50:00Z |
| Notifications | Proof Endpoints | HTTP | IMPLEMENTED | src/backend/http/controllers/notificationsProof.ts, src/backend/http/server.ts | HIGH | AuthN/Z | 2026-01-23T01:50:00Z |
| Notifications | Proof Tests | TEST | IMPLEMENTED | src/backend/modules/notifications/__tests__/proof.read.test.ts, src/backend/http/__tests__/notificationsProof.int.test.ts | MEDIUM | CI wiring | 2026-01-23T01:50:00Z |
## Notifications – Public Proof Access
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Notifications | NotificationProofAccessGranted (Event) | WRITE | IMPLEMENTED | src/backend/modules/notifications/write/events.ts, write/accessService.ts | HIGH | Admin issuance endpoint optional | 2026-01-23T02:05:00Z |
| Notifications | Token Access Views | READ | IMPLEMENTED | src/backend/modules/notifications/read/access.ts | HIGH | None | 2026-01-23T02:05:00Z |
| Notifications | Public Proof Endpoint | HTTP | IMPLEMENTED | src/backend/http/controllers/notificationsPublic.ts, src/backend/http/server.ts | HIGH | AuthN/Z | 2026-01-23T02:05:00Z |
| Notifications | Tests | TEST | IMPLEMENTED | src/backend/http/__tests__/notificationsPublic.int.test.ts | MEDIUM | CI wiring | 2026-01-23T02:05:00Z |
## Orchestration – Default Behaviors
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Cross-Domain | Orchestration Rules | WRITE | IMPLEMENTED | src/backend/orchestration/rules.ts | HIGH | Additional rules, config | 2026-01-23T02:20:00Z |
| Cross-Domain | Orchestration Tests | TEST | IMPLEMENTED | src/backend/orchestration/__tests__/rules.test.ts | MEDIUM | CI wiring | 2026-01-23T02:20:00Z |
## UI Wiring – MVP (Manager)
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Frontend | API Client Layer | READ | IMPLEMENTED | services/apiClient.ts | HIGH | Base URL/env config for prod | 2026-01-23T02:35:00Z |
| Frontend | Job Lifecycle Wiring | UI | IMPLEMENTED | views/JobCardManager.tsx | MEDIUM | Full validation and error UI | 2026-01-23T02:35:00Z |
| Frontend | Invoice & Payment Wiring | UI | IMPLEMENTED | views/SalesManager.tsx | MEDIUM | Robust forms, edge cases | 2026-01-23T02:35:00Z |
| Frontend | Vehicle History Wiring | UI | IMPLEMENTED | views/VehicleRegistry.tsx | MEDIUM | Timeline fidelity & inspections | 2026-01-23T02:35:00Z |
| Frontend | Job Parts Wiring | UI | IMPLEMENTED | views/JobCardManager.tsx | MEDIUM | Error surfacing & inventory sync | 2026-01-23T02:50:00Z |
| Frontend | Manager Dashboard Wiring | UI | IMPLEMENTED | views/GarageDashboard.tsx | MEDIUM | KPI expansion, profitability UI | 2026-01-23T02:50:00Z |
## UI Wiring – Share & Public Views
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Frontend | Vehicle Share UI | UI | IMPLEMENTED | views/VehicleRegistry.tsx | MEDIUM | QR library integration | 2026-01-23T03:05:00Z |
| Frontend | Public Vehicle Viewer | UI | IMPLEMENTED | views/PublicVehicleViewer.tsx, App.tsx | HIGH | Styling enhancements | 2026-01-23T03:05:00Z |
| Frontend | Public Notification Proof Viewer | UI | IMPLEMENTED | views/PublicNotificationProofViewer.tsx, App.tsx | HIGH | Detailed layout | 2026-01-23T03:05:00Z |
## Customer Mobile – Shell
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Customer & Vehicles | Vehicle List Projection | READ | IMPLEMENTED | src/backend/modules/customer-vehicles/read/list.ts | MEDIUM | Customer linkage refinement | 2026-01-23T03:25:00Z |
| Customer & Vehicles | GET /api/vehicles (customer) | HTTP | IMPLEMENTED | src/backend/http/controllers/customerVehiclesList.ts, src/backend/http/server.ts | HIGH | Auth framework | 2026-01-23T03:25:00Z |
| Frontend | Customer Vehicles List UI | UI | IMPLEMENTED | views/CustomerVehiclesList.tsx, App.tsx, Sidebar.tsx | HIGH | Detail navigation | 2026-01-23T03:25:00Z |
| Notifications | Preferences Event & Service | WRITE | IMPLEMENTED | src/backend/modules/customer-vehicles/write/preferencesService.ts, events.ts, notifications service update | HIGH | Schema consolidation | 2026-01-23T03:25:00Z |
| Backend | PUT /api/me/preferences/notifications | HTTP | IMPLEMENTED | src/backend/http/controllers/preferences.ts, src/backend/http/server.ts | HIGH | Validation | 2026-01-23T03:25:00Z |
| Frontend | Customer Preferences UI | UI | IMPLEMENTED | views/CustomerPreferences.tsx, App.tsx, Sidebar.tsx | HIGH | Persisted defaults | 2026-01-23T03:25:00Z |

Next session starting point:
- Add QR rendering with a lightweight lib and improve token expiry UX.
- Implement customer notifications inbox read view from ledger replay.
## Customer Mobile – Inbox & Share UX
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Frontend | QR Rendering | UI | IMPLEMENTED | views/VehicleRegistry.tsx, package.json | HIGH | Replace with real lib in prod | 2026-01-23T03:45:00Z |
| Frontend | Token Expiry UX | UI | IMPLEMENTED | views/VehicleRegistry.tsx | HIGH | Live countdown refinements | 2026-01-23T03:45:00Z |
| Notifications | Inbox Projection | READ | IMPLEMENTED | src/backend/modules/notifications/read/inbox.ts | HIGH | Status nuances | 2026-01-23T03:45:00Z |
| Notifications | GET /api/me/notifications | HTTP | IMPLEMENTED | src/backend/http/controllers/notificationsInbox.ts, server.ts | HIGH | AuthN/Z | 2026-01-23T03:45:00Z |
| Frontend | Customer Notifications Inbox | UI | IMPLEMENTED | views/CustomerNotifications.tsx, App.tsx, Sidebar.tsx | HIGH | Proof deep-linking | 2026-01-23T03:45:00Z |

Next session starting point:
- PDF export for vehicle history + QR and improved token UX (
- Customer notifications inbox enhancements and OTP-based auth if moving to pilot).
## Vehicle History – PDF Export
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Customer & Vehicles | PDF Generator | READ | IMPLEMENTED | src/backend/modules/customer-vehicles/read/pdf.ts | HIGH | QR embed in PDF | 2026-01-23T04:00:00Z |
| Customer & Vehicles | GET /api/vehicles/:vehicleId/history.pdf | HTTP | IMPLEMENTED | src/backend/http/controllers/vehiclePdf.ts, server.ts | HIGH | File naming & branding | 2026-01-23T04:00:00Z |
| Frontend | Download PDF Button | UI | IMPLEMENTED | views/VehicleRegistry.tsx | HIGH | Tokenless variant | 2026-01-23T04:00:00Z |
| Backend | PDF Endpoint Tests | TEST | IMPLEMENTED | src/backend/http/__tests__/vehicle.pdf.int.test.ts | MEDIUM | CI wiring | 2026-01-23T04:00:00Z |
 
## Database – Postgres EventLedger
| Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|
| Migration (event_ledger) | DB | IMPLEMENTED | src/backend/db/migrations/001_event_ledger.sql | HIGH | Additional constraints and retention policies | 2026-01-26T00:10:00Z |
| Ledger Adapter | CORE | IMPLEMENTED | src/backend/core/event-ledger/PostgresLedger.ts | HIGH | Performance tuning, batching | 2026-01-26T00:10:00Z |
| Connection Layer | CORE | IMPLEMENTED | src/backend/db/pg.ts | HIGH | Pool config and TLS for prod | 2026-01-26T00:10:00Z |
| Toggle | CORE | IMPLEMENTED | src/backend/core/event-ledger/Ledger.ts | HIGH | None | 2026-01-26T00:10:00Z |
| Tests | TEST | IN_PROGRESS | src/backend/core/event-ledger/__tests__/postgres.ledger.int.test.ts | MEDIUM | Requires DATABASE_URL and pg dependency | 2026-01-26T00:10:00Z |
## Auth – OTP
| Domain Module | Artifact | Scope | Status | Files Created/Updated | Confidence | Remaining Gaps | Last Updated |
|---|---|---|---|---|---|---|---|
| Auth | OTP Events & Commands | WRITE | IMPLEMENTED | src/backend/modules/auth/write/events.ts, write/commands.ts | HIGH | Code delivery integration | 2026-01-23T04:20:00Z |
| Auth | AuthService (request/verify) | WRITE | IMPLEMENTED | src/backend/modules/auth/write/services.ts, token.ts | HIGH | JWT standardization | 2026-01-23T04:20:00Z |
| Auth | HTTP Endpoints | HTTP | IMPLEMENTED | src/backend/http/controllers/auth.ts, server.ts | HIGH | Rate limiting, abuse prevention | 2026-01-23T04:20:00Z |
| Frontend | Login UI | UI | IMPLEMENTED | views/Login.tsx, App.tsx, services/apiClient.ts | HIGH | Role-based redirects | 2026-01-23T04:20:00Z |
| Auth | Tests | TEST | IMPLEMENTED | src/backend/http/__tests__/auth.int.test.ts | MEDIUM | CI wiring | 2026-01-23T04:20:00Z |