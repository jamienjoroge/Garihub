Backend architecture: Modular Monolith aligning to domain events.

Modules:
- Job Management
- Customer & Vehicles
- Sales & Invoicing
- Inventory
- Finance & Accounting
- HR & Payroll
- AI Integrations
- Multi-Tenant & Branch Control
- Reporting & Read Models
- Core Infrastructure (Event Ledger)

Inter-module communication uses domain events persisted in the Event Ledger and read models for queries.