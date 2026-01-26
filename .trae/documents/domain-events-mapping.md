# Automotive Garage Management System - Domain Events Mapping

## 1. Job Management Lifecycle Events

### Job Creation Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| JobCardCreated | New job card created from appointment or direct intake | `handleCreateJobFromOrder` or `handleCheckIn` | JobCard, Customer, Vehicle, SalesOrder | INSERT job_cards, UPDATE sales_orders (if from order) | Log customer_id, vehicle_id, created_by, branch_id | Must have valid customer and vehicle, assign sequential job number |
| JobCardUpdated | Job details modified (description, priority, assigned_to) | `handleUpdateJob` | JobCard, Employee (technician) | UPDATE job_cards | Log all field changes with old/new values | Only assigned technician or manager can update, track status changes |
| JobStatusChanged | Job progresses through workflow stages | Status dropdown selection | JobCard | UPDATE job_cards.status | Log status transition with timestamp and user | Valid transitions: DIAGNOSING→ESTIMATING→WAITING_APPROVAL→READY→IN_PROGRESS→COMPLETED |
| JobAssigned | Technician assigned to job | Technician selection in job form | JobCard, Employee | UPDATE job_cards.assigned_to | Log assignment with technician_id and timestamp | Only one primary technician, notify assigned employee |
| JobDiagnosisCompleted | AI or manual diagnosis finished | `handleAiDiagnose` or manual entry | JobCard, ServiceRecord | UPDATE job_cards.diagnosis, INSERT service_records | Log diagnosis method (AI/manual), confidence score | Diagnosis must be reviewed before proceeding to estimation |
| JobEstimateGenerated | Cost estimate created from diagnosis | `handleGenerateQuoteFromJob` | Quotation, JobCard | INSERT quotations, UPDATE job_cards.status | Log estimate generation with breakdown | Must include parts and labor breakdown, valid for 30 days |
| JobApproved | Customer approves estimate and work begins | Approval action in UI | JobCard, SalesOrder | UPDATE job_cards.status, INSERT sales_orders | Log approval with customer consent | Requires customer signature/confirmation, convert to billable order |
| JobStarted | Technician begins actual work | Start job button | JobCard, LaborLog | UPDATE job_cards.status, INSERT labor_logs | Log start time and technician | Can only start if status is READY, track actual vs estimated time |
| JobPaused | Work temporarily stopped | Pause job button | JobCard, LaborLog | UPDATE job_cards.status, UPDATE labor_logs.end_time | Log pause reason and duration | Track waiting time separately from productive time |
| JobResumed | Work continues after pause | Resume job button | JobCard, LaborLog | UPDATE job_cards.status, INSERT new labor_logs row | Log resume time | Continue tracking labor time from pause point |
| JobCompleted | All work finished, ready for billing | Complete job button | JobCard, ServiceRecord | UPDATE job_cards.status, INSERT service_records | Log completion with final notes | Must have all parts used recorded, labor time validated |
| JobCancelled | Job cancelled before completion | Cancel job action | JobCard, Inventory (if parts returned) | UPDATE job_cards.status, UPDATE inventory for returns | Log cancellation reason and user | Return any unused parts to inventory, notify customer |
| ServiceRecordMinted | Blockchain-inspired immutable service record created | `handleMintServiceRecord` | ServiceRecord, Vehicle | INSERT service_records with hash | Log blockchain hash and previous service hash | Create cryptographic link to previous service, include vehicle mileage |

### Parts and Labor Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| PartAddedToJob | Part allocated to job from inventory | Add part button in job form | JobCard, Product, Inventory | UPDATE inventory.quantity, INSERT job_parts | Log part_id, quantity, cost_price | Check availability first, FIFO cost allocation |
| PartRemovedFromJob | Part returned to inventory | Remove part action | JobCard, Product, Inventory | UPDATE inventory.quantity, DELETE job_parts | Log return reason and quantity | Only if job not completed, restore original cost |
| LaborTimeRecorded | Technician time tracked against job | Timer start/stop or manual entry | LaborLog, JobCard | INSERT/UPDATE labor_logs | Log start/end times, technician_id, description | Minimum billing increments, overtime rules apply |
| LaborRateApplied | Hourly rate determined for billing | Rate calculation based on technician level | LaborLog, Employee | SELECT employee.hourly_rate | Log rate applied and basis | Different rates for different technician levels |

## 2. Customer Relationship Events

### Customer Management Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| CustomerRegistered | New customer onboarded | Customer form submission | Customer, ContactInfo | INSERT customers, INSERT contact_infos | Log registration source (walk-in/online/referral) | Unique phone/email validation, assign customer number |
| CustomerUpdated | Customer information modified | Edit customer action | Customer, ContactInfo | UPDATE customers/contact_infos | Log all field changes | Cannot change customer_id, track communication preferences |
| VehicleRegistered | Vehicle added to customer profile | Vehicle registration in intake | Vehicle, Customer | INSERT vehicles | Log VIN, registration, make/model/year | VIN must be unique, validate against government database |
| CustomerSegmented | Customer assigned to marketing segment | AI segmentation or manual assignment | Customer | UPDATE customers.segment | Log segmentation criteria and method | Segments: VIP, NEW, RETURNING, AT_RISK, CORPORATE |
| CustomerCommunicationLogged | Interaction recorded (call/SMS/email) | Manual entry or system integration | CustomerInteraction | INSERT customer_interactions | Log type, content, direction (in/out), channel | Include follow-up required flag, link to job if applicable |
| AppointmentBooked | Service appointment scheduled | `handleBookAppointment` | Appointment, Customer, Vehicle | INSERT appointments | Log requested services, preferred time | Check technician availability, send confirmation |
| AppointmentRescheduled | Appointment time changed | Reschedule action | Appointment | UPDATE appointments.scheduled_time | Log old and new time, reason | Notify customer and technician, check conflicts |
| AppointmentCancelled | Appointment removed from schedule | Cancel appointment | Appointment | UPDATE appointments.status | Log cancellation reason and user | Allow cancellation up to 24 hours before, track no-shows |
| CustomerFeedbackReceived | Post-service feedback collected | Feedback form or survey | CustomerFeedback | INSERT customer_feedback | Log rating, comments, service_id | Link to specific service, trigger follow-up if rating < 3 |
| WarrantyClaimInitiated | Customer requests warranty service | Warranty claim form | WarrantyClaim, JobCard | INSERT warranty_claims, INSERT job_cards | Log claim details, original service | Validate warranty period and coverage terms |

### Marketing Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| MarketingCampaignGenerated | AI creates personalized campaign | `handleGenerateMarketingCampaign` | MarketingCampaign | INSERT marketing_campaigns | Log prompt, generated content, target segment | Target specific customer segments, include unsubscribe |
| MarketingMessageSent | SMS/email delivered to customer | Campaign execution | MarketingMessage | INSERT marketing_messages | Log delivery status, bounce/complaint | Respect opt-out preferences, limit frequency |
| CustomerRespondedToCampaign | Customer interacts with marketing | Click/reply tracking | MarketingMessage | UPDATE marketing_messages.response | Log response type and timestamp | Track conversion to appointment or service |

## 3. Sales and Invoicing Events

### Quotation Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| QuotationCreated | Price quote generated for customer | `handleGenerateQuoteFromJob` | Quotation, JobCard | INSERT quotations | Log quote basis (job/diagnosis), expiry date | Auto-calculate taxes, valid for 30 days by default |
| QuotationRevised | Quote modified and re-issued | Edit quotation action | Quotation | UPDATE quotations (new version) | Log revision reason, version number | Maintain quote history, notify customer of changes |
| QuotationExpired | Quote validity period ended | Scheduled job or manual check | Quotation | UPDATE quotations.status | Log expiry timestamp | Notify customer, allow extension upon request |
| QuotationConvertedToOrder | Customer accepts quote | `handleConvertQuoteToOrder` | SalesOrder, Quotation | INSERT sales_orders, UPDATE quotations.status | Log conversion with quote reference | Copy all line items, preserve pricing |

### Order Management Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| SalesOrderCreated | New order from quote or direct | Quote conversion or direct order | SalesOrder, Customer | INSERT sales_orders | Log order source (quote/direct), customer_id | Generate sequential order number, set initial status |
| SalesOrderUpdated | Order details modified | Edit order action | SalesOrder, SalesOrderItem | UPDATE sales_orders/items | Log all changes with before/after values | Cannot modify if invoiced, manager approval for price changes |
| SalesOrderItemAdded | Additional service/product added | Add item to order | SalesOrderItem, Inventory | INSERT sales_order_items (check availability) | Log item details, pricing | Update order total, check inventory availability |
| SalesOrderItemRemoved | Item cancelled from order | Remove item action | SalesOrderItem, Inventory (if released) | DELETE sales_order_items | Log removal reason, restock if needed | Update order total, release reserved inventory |
| SalesOrderCancelled | Entire order cancelled | Cancel order action | SalesOrder, Inventory (if applicable) | UPDATE sales_orders.status | Log cancellation reason, user | Release all reserved inventory, notify customer |

### Invoice Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| InvoiceGenerated | Bill created from order | `handleGenerateInvoiceFromOrder` | Invoice, SalesOrder, JournalEntry | INSERT invoices, INSERT journal_entries | Log invoice number, tax breakdown | Sequential numbering, include all taxes, link to GL |
| InvoiceUpdated | Invoice details modified | Edit invoice (limited fields) | Invoice | UPDATE invoices | Log changes with reason | Cannot modify if paid, manager approval required |
| InvoiceSent | Invoice delivered to customer | Send invoice action | Invoice | UPDATE invoices.sent_status | Log delivery method, timestamp | Email/SMS/print options, include payment instructions |
| PaymentRecorded | Customer payment received | `handleRecordPayment` | Payment, Invoice, JournalEntry | INSERT payments, UPDATE invoices.status, INSERT journal_entries | Log payment method, reference, amount | Update invoice status, allocate to oldest invoice first |
| PaymentAllocated | Payment applied to specific invoices | Payment allocation screen | PaymentAllocation | INSERT payment_allocations | Log allocation details, remaining balance | Follow payment allocation rules, update customer balance |
| CreditNoteIssued | Refund or adjustment processed | Credit note creation | CreditNote, Invoice, JournalEntry | INSERT credit_notes, INSERT journal_entries | Log reason, original invoice, approval | Manager approval required, affect sales returns account |
| InvoiceWrittenOff | Uncollectible invoice removed | Write-off action | Invoice, JournalEntry | UPDATE invoices.status, INSERT journal_entries | Log write-off reason, approval, bad debt expense | Manager approval, affect bad debt expense account |

## 4. Inventory Management Events

### Stock Movement Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| StockReceived | Goods received from supplier | `submitGoodsReceipt` | GoodsReceipt, Product, Inventory | INSERT goods_receipts, UPDATE inventory.quantity | Log receipt number, supplier, quantities | Match against purchase order, update average cost |
| StockIssued | Parts used for job/service | Part allocation to job | Inventory, JobCard | UPDATE inventory.quantity | Log job_id, part_id, quantity, cost | Check availability first, FIFO cost allocation |
| StockTransferred | Inventory moved between branches | `handleStockTransfer` | StockTransfer, Inventory (2 branches) | INSERT stock_transfers, UPDATE inventory (source and dest) | Log transfer details, sending/receiving user | Deduct from source, add to destination, track in transit |
| StockAdjusted | Manual quantity correction | Stock adjustment form | Inventory, StockAdjustment | INSERT stock_adjustments, UPDATE inventory.quantity | Log reason, adjustment type (gain/loss), approval | Manager approval required, affect inventory variance account |
| StockReordered | Automatic reorder triggered | Reorder point reached | PurchaseOrder, Product | INSERT purchase_orders | Log reorder trigger, supplier, quantities | Check supplier lead time, consolidate with other items |
| StockDisposed | Damaged/expired items removed | Disposal form | Inventory, DisposalRecord | UPDATE inventory.quantity, INSERT disposal_records | Log disposal reason, method, quantities | Approval required, affect inventory loss account |

### Purchase Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| PurchaseOrderCreated | New order to supplier | Create PO action | PurchaseOrder, Product | INSERT purchase_orders | Log supplier, expected delivery, terms | Check supplier credit limit, consolidate requisitions |
| PurchaseOrderApproved | Manager authorizes purchase | Approve PO action | PurchaseOrder | UPDATE purchase_orders.status | Log approver, timestamp | Within purchasing limits, preferred supplier |
| PurchaseOrderSent | PO transmitted to supplier | Send PO action | PurchaseOrder | UPDATE purchase_orders.sent_status | Log transmission method, confirmation | Email/fax/EDI options, include delivery instructions |
| PurchaseOrderModified | PO details changed before receipt | Edit PO action | PurchaseOrder, PurchaseOrderItem | UPDATE purchase_orders/items | Log changes with reason | Cannot modify if partially received, notify supplier |
| PurchaseOrderCancelled | PO cancelled | Cancel PO action | PurchaseOrder | UPDATE purchase_orders.status | Log cancellation reason, user | Notify supplier, cancel any related shipments |

## 5. Financial Events

### Journal Entry Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| JournalEntryPosted | Double-entry transaction recorded | `handlePostJournal` | JournalEntry, JournalEntryItem | INSERT journal_entries, INSERT journal_entry_items | Log entry number, description, reference | Debits must equal credits, valid account numbers |
| JournalEntryReversed | Previous entry corrected | Reverse entry action | JournalEntry (new reversal), Original | INSERT reversal journal_entries | Log original entry, reversal reason | Same amount, opposite signs, link to original |
| RecurringJournalGenerated | Automatic periodic entry created | Scheduled job | JournalEntry | INSERT journal_entries | Log generation basis, period | Depreciation, accruals, allocations |
| YearEndClosingEntries | Year-end closing transactions | Year-end process | JournalEntry (multiple) | INSERT multiple journal_entries | Log closing date, retained earnings | Close income/expense to retained earnings |

### Tax Calculation Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| VATCalculated | VAT computed on taxable supplies | Invoice/quote generation | Invoice/Quotation, TaxLine | INSERT tax_lines | Log tax rate (16%), taxable amount | Kenya VAT rate 16%, separate tax lines |
| VATReturnFiled | Monthly VAT return submitted | VAT return generation | TaxReturn, JournalEntry | INSERT tax_returns, INSERT journal_entries | Log return period, amounts, filing date | Due by 20th of following month |
| PAYECalculated | Employee tax computed | Payroll processing | PayrollRecord, Employee | UPDATE payroll_records.paye | Log gross pay, deductions, PAYE | Kenya PAYE brackets, monthly calculation |
| NSSFContributed | Pension contribution processed | Payroll processing | PayrollRecord | UPDATE payroll_records.nssf | Log tier 1/tier 2 contributions | Tier 1: KES 360/month, Tier 2: 6% of eligible pay |
| SHIFContribution | Health insurance contribution | Payroll processing | PayrollRecord | UPDATE payroll_records.shif | Log 2.75% of gross pay | Kenya SHIF rate 2.75% effective 2024 |
| HousingLevyDeducted | Affordable housing levy | Payroll processing | PayrollRecord | UPDATE payroll_records.housing_levy | Log 1.5% of gross pay | Kenya Housing Levy 1.5% (employee) |

### Asset Depreciation Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| DepreciationCalculated | Monthly depreciation computed | Scheduled job | FixedAsset, JournalEntry | UPDATE fixed_assets.accumulated_depreciation, INSERT journal_entries | Log method, rate, period | Straight-line method, useful life based on asset type |
| AssetDisposed | Asset sold or scrapped | Disposal form | FixedAsset, JournalEntry | UPDATE fixed_assets.status, INSERT journal_entries | Log disposal proceeds, gain/loss | Remove from books, recognize gain/loss |
| AssetRevalued | Asset fair value adjusted | Revaluation form | FixedAsset, JournalEntry | UPDATE fixed_assets.revalued_amount, INSERT journal_entries | Log revaluation basis, appraiser | Professional valuation, affect revaluation reserve |

## 6. HR Events

### Employee Management Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| EmployeeOnboarded | New employee added to system | Employee form submission | Employee, ContactInfo | INSERT employees, INSERT contact_infos | Log hire date, employment type, branch | Unique employee number, statutory registrations |
| EmployeeUpdated | Employee details modified | Edit employee action | Employee | UPDATE employees | Log changes with effective dates | Cannot change employee_id, track position changes |
| EmployeeTerminated | Employment ended | Termination action | Employee | UPDATE employees.status, termination_date | Log termination reason, last day | Calculate final pay, benefits cessation |
| EmployeeTransferred | Moved between branches | Transfer action | Employee | UPDATE employees.branch_id | Log transfer date, from/to branches | Update access permissions, payroll location |
| LeaveApplied | Employee requests time off | Leave application form | LeaveRequest, Employee | INSERT leave_requests | Log leave type, dates, reason | Check leave balance, manager approval required |
| LeaveApproved | Manager authorizes leave | Approve leave action | LeaveRequest | UPDATE leave_requests.status | Log approver, approval date | Update leave balance, notify employee |
| LeaveCancelled | Approved leave withdrawn | Cancel leave action | LeaveRequest | UPDATE leave_requests.status | Log cancellation reason | Restore leave balance if applicable |

### Payroll Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| PayrollProcessed | Monthly payroll calculated | `processPayroll` function | PayrollRecord, Employee | INSERT payroll_records | Log pay period, processed by | Calculate all statutory deductions |
| PayrollApproved | Manager authorizes payment | Approve payroll action | PayrollRecord | UPDATE payroll_records.status | Log approver, approval timestamp | Final review before payment |
| PayrollPaid | Employee payment processed | Payment execution | PayrollRecord, JournalEntry | UPDATE payroll_records.paid_status, INSERT journal_entries | Log payment method, reference | Generate pay slips, update employee records |
| OvertimeCalculated | Extra hours computed | Timesheet approval | PayrollRecord | UPDATE payroll_records.overtime_pay | Log overtime hours, rate | 1.5x normal rate for >45 hours/week |
| BonusProcessed | Performance bonus added | Bonus calculation | PayrollRecord | UPDATE payroll_records.bonus | Log bonus type, amount, basis | Manager approval, affect payroll tax |
| DeductionProcessed | Employee deduction applied | Deduction form | PayrollRecord, EmployeeDeduction | INSERT employee_deductions, UPDATE payroll_records | Log deduction type, amount, beneficiary | Court order or voluntary, affect net pay |

## 7. AI Integration Events

### Diagnostic AI Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| AiDiagnosisRequested | AI analysis initiated | `handleAiDiagnose` button | AiDiagnosis, JobCard | INSERT ai_diagnoses | Log symptoms, vehicle details, request time | Rate limiting per API key, cost tracking |
| AiDiagnosisCompleted | AI returns diagnostic results | Gemini API response | AiDiagnosis, JobCard | UPDATE ai_diagnoses with results | Log confidence score, processing time | Review required before customer presentation |
| AiCostEstimateGenerated | AI predicts repair costs | `estimateRepairCost` call | AiCostEstimate, JobCard | INSERT ai_cost_estimates | Log estimate breakdown, confidence | Compare with manual estimates, variance alerts |
| AiDiagnosisRejected | Technician overrides AI suggestion | Override action | AiDiagnosis | UPDATE ai_diagnoses.status | Log rejection reason, technician_id | Track AI accuracy, improve models |

### Marketing AI Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| AiMarketingCampaignGenerated | AI creates personalized campaign | `handleGenerateMarketingCampaign` | MarketingCampaign, AiMarketingSuggestion | INSERT ai_marketing_suggestions | Log target segment, prompt, generated content | Review before sending, compliance check |
| AiCustomerReportGenerated | Technical explanation simplified | `generateCustomerReport` | CustomerReport, AiSimplification | INSERT ai_simplifications | Log technical text, simplified version | Accuracy review required, customer-friendly language |
| AiResponseAnalyzed | Customer feedback sentiment analyzed | Feedback processing | CustomerFeedback, AiSentiment | INSERT ai_sentiments | Log sentiment score, key phrases | Trigger alerts for negative sentiment |

## 8. Multi-Tenant Events

### Branch Operations Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| BranchCreated | New branch location added | Branch setup form | Branch, TenantConfig | INSERT branches, INSERT tenant_configs | Log branch code, address, manager | Unique branch code, inherit tenant settings |
| BranchConfigurationUpdated | Branch settings modified | Settings update | TenantConfig | UPDATE tenant_configs | Log configuration changes | Affect only future transactions, not historical |
| UserBranchAccessGranted | User given access to branch | Access management | UserBranchAccess | INSERT user_branch_accesses | Log user_id, branch_id, role | Role-based permissions, audit trail |
| UserBranchAccessRevoked | Branch access removed | Access removal | UserBranchAccess | DELETE user_branch_accesses | Log revocation reason, user | Immediate effect, transfer active sessions |

### Inter-Branch Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| InterBranchTransferInitiated | Stock/service request sent | Transfer request form | StockTransfer, Inventory | INSERT stock_transfers (status: REQUESTED) | Log requesting branch, items, reason | Check availability at source, approval workflow |
| InterBranchTransferApproved | Source branch authorizes transfer | Approve transfer action | StockTransfer | UPDATE stock_transfers.status | Log approver, approval time | Deduct from source inventory, mark in-transit |
| InterBranchTransferShipped | Items sent to destination | Ship transfer action | StockTransfer | UPDATE stock_transfers.status, shipping_info | Log shipment details, tracking | Update in-transit inventory, notify destination |
| InterBranchTransferReceived | Destination confirms receipt | Receive transfer action | StockTransfer, Inventory (destination) | UPDATE stock_transfers.status, UPDATE inventory.quantity | Log receiver, receipt condition | Add to destination inventory, close transfer |
| InterBranchServiceRequested | Service requested from other branch | Service request form | InterBranchService, JobCard | INSERT inter_branch_services | Log requesting branch, service type, urgency | Check capacity at providing branch, cost allocation |
| InterBranchServiceCompleted | Service delivered to requesting branch | Complete service action | InterBranchService | UPDATE inter_branch_services.status | Log completion details, charges | Invoice requesting branch, update service records |

### Consolidated Reporting Events
| Event Name | Description | Triggering Action | Affected Entities | Database Transactions | Audit/Logging | Business Rules |
|------------|-------------|-------------------|-------------------|----------------------|---------------|----------------|
| ConsolidatedFinancialReportGenerated | Multi-branch financial summary | Report generation | ConsolidatedReport | INSERT consolidated_reports | Log report period, branches included | Eliminate inter-branch transactions, currency conversion |
| BranchPerformanceCalculated | Individual branch KPI computed | Monthly calculation | BranchPerformance | INSERT branch_performances | Log metrics: revenue, profit, customer satisfaction | Compare against targets, identify trends |
| CrossBranchCustomerActivity | Customer services at multiple branches | Customer activity analysis | CustomerActivity | INSERT customer_activities | Log services by branch, customer journey | Identify loyal customers, cross-selling opportunities |

---

## Audit and Compliance Requirements

### General Audit Trail
- All financial transactions must have balanced debits and credits
- User authentication required for all state-changing operations
- Timestamp and user_id logged for all create/update/delete operations
- Old values preserved for all updates (history tables or change logs)
- Sequential numbering for all document types (invoices, orders, receipts)
- Approval workflows for amounts above user authorization limits

### Tax Compliance
- Kenya VAT (16%) calculated and tracked separately
- PAYE, NSSF, SHIF, Housing Levy computed per current rates
- Monthly tax returns generated with audit trails
- Multi-currency support with exchange rate history
- Retain all tax records for minimum 5 years

### Data Retention
- Customer data retained for 7 years after last transaction
- Financial records retained permanently
- Employee records retained for 7 years after termination
- Service history retained for vehicle lifetime
- Marketing consent tracked with opt-out history

### Security Requirements
- Role-based access control with regular reviews
- Sensitive data encryption at rest and in transit
- API rate limiting and cost tracking
- Backup and disaster recovery procedures
- Multi-factor authentication for administrative functions