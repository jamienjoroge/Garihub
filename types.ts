export enum JobStatus {
  PENDING = 'PENDING',            // Vehicle arrived, basic details taken
  DIAGNOSING = 'DIAGNOSING',      // Technician performing initial checks
  ESTIMATING = 'ESTIMATING',      // Diagnosis done, creating Quote
  WAITING_APPROVAL = 'WAITING_APPROVAL', // Quote sent to customer
  READY = 'READY',                // Approved, waiting for bay/tech
  IN_PROGRESS = 'IN_PROGRESS',    // Currently in a Bay
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED'
}

// --- ERP CORE: MULTI-BRANCH ---
export interface Branch {
  id: string;
  name: string;
  location: string;
  isHeadquarters: boolean;
}

export interface ServicePackage {
  id: string;
  name: string; // e.g. "Minor Service"
  description: string;
  basePrice: number;
  includesParts: boolean;
}

// --- ERP CORE: ACCOUNTING ---
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export interface Account {
  id: string;
  code: string; // e.g., 1000
  name: string; // e.g., Cash on Hand
  type: AccountType;
  subtype?: string; // e.g., Current Asset
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string; // Link to Invoice ID or Bill ID
  branchId: string;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
}

// --- ERP CORE: ADVANCED INVENTORY ---
export type StockMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  branchId: string; // Where the stock is moving TO or FROM
  type: StockMovementType;
  quantity: number;
  reason?: string; // e.g., "Damaged", "Stock Take Correction"
  referenceId?: string; // PO ID, Invoice ID, or Transfer ID
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color?: string;
  fuelType?: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
  transmission?: 'AUTOMATIC' | 'MANUAL';
  engineSize?: string;
  ownerName: string;
}

export interface CustomerInteraction {
  id: string;
  date: string;
  type: 'CALL' | 'EMAIL' | 'SMS' | 'NOTE' | 'VISIT';
  summary: string;
  details?: string;
  loggedBy: string; // User who logged it
}

export type CustomerSegment = 'VIP' | 'NEW' | 'RETURNING' | 'AT_RISK' | 'CORPORATE';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  kraPin?: string;
  vehicles: Vehicle[];
  lastVisit: string;
  totalSpend: number;
  segment: CustomerSegment;
  interactions: CustomerInteraction[];
  notes?: string;
}

export interface InvoiceItem {
  id?: number | string; 
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  jobId: string;
  projectId?: string; // Linked Restoration Project
  salesOrderId?: string; // Link to Sales Order
  branchId: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod?: 'MPESA' | 'CASH' | 'BANK';
  items: InvoiceItem[];
}

export interface Quotation {
  id: string;
  customerName: string;
  vehiclePlate: string;
  branchId: string;
  jobId?: string; // Linked Job
  date: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  items: InvoiceItem[];
}

export interface SalesOrder {
  id: string;
  quotationId?: string; // Originating Quote
  jobCardId?: string; // Linked Job Card
  projectId?: string; // Linked Restoration Project
  branchId: string;
  customerName: string;
  vehiclePlate: string;
  date: string;
  totalAmount: number;
  // Lifecycle Status
  status: 'PENDING_JOB' | 'JOB_IN_PROGRESS' | 'JOB_COMPLETED' | 'READY_TO_INVOICE' | 'INVOICED'; 
  items: InvoiceItem[];
}

export interface Expense {
  id: string;
  category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'SUPPLIES' | 'MARKETING' | 'OTHER';
  description: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING';
  paidBy: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  garageName: string;
  description: string;
  mileage: number;
  cost: number;
  items: string[];
}

export interface ServiceBay {
  id: string;
  name: string;
  type: 'GENERAL' | 'LIFT' | 'PIT' | 'WASH';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentJobId?: string;
}

export interface LaborLog {
  id: string;
  technicianId: string;
  technicianName: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  hourlyRate: number;
  cost: number;
}

export interface DiagnosisItem {
  id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  proposedFix?: string;
  estimatedPartCost?: number;
  estimatedLaborCost?: number;
  technicianNotes?: string;
}

export interface JobCard {
  id: string;
  salesOrderId?: string; // Linked Order
  projectId?: string; // Linked Restoration Project
  branchId: string;
  vehicle: Vehicle;
  status: JobStatus;
  entryDate: string;
  issueDescription: string;
  technicianNotes?: string;
  estimatedCost: number;
  finalCost?: number;
  technicianId?: string; // Linked to Employee
  technicianName?: string;
  bayId?: string; // Linked to ServiceBay
  aiDiagnosis?: string;
  diagnosis?: DiagnosisItem[]; // New diagnosis workflow
  inspectionId?: string; // Linked to Inspection
  partsUsed?: { productId: string; name: string; quantity: number; cost: number; sellPrice: number }[];
  laborLogs?: LaborLog[];
}

export interface Appointment {
  id: string;
  customerName: string;
  vehiclePlate: string;
  date: string;
  time: string;
  serviceType: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  phone?: string;
}

// HR & Employee Types
export type EmploymentType = 'FULL_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERN';
export type EmployeeRole = 'TECHNICIAN' | 'MANAGER' | 'RECEPTIONIST' | 'INSPECTOR' | 'CLEANER' | 'ACCOUNTANT' | 'STORE_KEEPER';
export type Department = 'WORKSHOP' | 'FRONT_OFFICE' | 'FINANCE' | 'OPERATIONS' | 'SALES' | 'INVENTORY';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole; // System Access Level
  department: Department;
  jobTitle: string; // Specific Position (e.g. Senior Mechanic)
  employmentType: EmploymentType;
  phone: string;
  idNumber: string; // National ID
  kraPin?: string;
  baseSalary: number; // Monthly for FT, Hourly/PerJob for Freelance
  commissionRate?: number; // %
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RETIRED';
  skills: string[]; // e.g., ['Electrician', 'Engine Specialist']
  joinedDate: string;
  // Master Data for Statutory
  statutoryDetails: {
      deductNSSF: boolean;
      deductSHIF: boolean;
      deductHousingLevy: boolean;
      deductPAYE: boolean;
  };
}

export interface PayrollConfig {
    deductNSSF: boolean;
    deductSHIF: boolean; // Replaces NHIF
    deductHousingLevy: boolean;
    deductPAYE: boolean;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  grossPay: number;
  deductions: {
    nssf: number;
    shif: number; // Social Health Insurance Fund (2.75%)
    paye: number;
    housingLevy: number; // 1.5%
    advances: number;
    other: number;
  };
  taxableIncome: number;
  netPay: number;
  status: 'PROCESSED' | 'PAID' | 'PENDING';
}

export interface DashboardStats {
  revenueMonth: number;
  carsInShop: number;
  pendingInvoices: number;
  customerSatisfaction: number;
}

// Inventory & Supplier Types
export type PartCategory = 'ENGINE' | 'SUSPENSION' | 'DRIVE_TRAIN' | 'BODY' | 'ELECTRICAL' | 'SERVICE_PARTS' | 'BRAKES';
export type CostingMethod = 'FIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: 'COD' | 'NET30';
  balanceOwing: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string; // Product Manufacturer/Brand (e.g. Bosch, Denso)
  category: PartCategory;
  compatibleBrands: string[]; // e.g. ['TOYOTA', 'SUBARU']
  compatibleModels: string[]; // e.g. ['FIELDER', 'OUTBACK']
  stockLevel: number;
  minStockLevel?: number;
  buyPrice: number;
  sellPrice: number;
  supplierId: string;
  location?: string; // Shelf A2
  costingMethod?: CostingMethod;
  isTaxable?: boolean; // VAT 16%
  branchId?: string; // Which branch owns this stock record
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  dateCreated: string;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  totalCost: number;
  items: { productId: string; quantity: number; unitCost: number }[];
}

export interface GoodsReceipt {
  id: string;
  poId: string;
  supplierId: string;
  dateReceived: string;
  deliveryNoteNumber: string; // Physical paper ref
  items: { productId: string; quantityReceived: number; unitCost: number }[];
  totalValue: number;
  status: 'PENDING_BILL' | 'BILLED'; // Has this been converted to a financial bill?
}

// --- FIXED ASSETS ---
export interface FixedAsset {
    id: string;
    name: string;
    serialNumber: string;
    category: 'MACHINERY' | 'TOOLS' | 'FURNITURE' | 'IT_EQUIPMENT' | 'VEHICLES';
    branchId: string;
    location?: string; // Can be linked to Service Bay ID
    purchaseDate: string;
    purchaseCost: number;
    salvageValue: number; // Value at end of life
    usefulLifeYears: number;
    status: 'ACTIVE' | 'MAINTENANCE' | 'DISPOSED';
    maintenanceLog: AssetMaintenance[];
}

export interface AssetMaintenance {
    id: string;
    date: string;
    type: 'PREVENTIVE' | 'REPAIR' | 'UPGRADE';
    description: string;
    cost: number;
    performedBy: string; // Vendor or Employee
    nextServiceDate?: string;
    invoiceRef?: string;
}

// --- RESTORATION PROJECT MANAGEMENT ---
export interface ProjectTask {
    id: string;
    description: string;
    status: 'PENDING' | 'JOB_CREATED' | 'COMPLETED';
    jobCardId?: string; // Link to the specific job card handling this task
}

export interface ProjectPhase {
    id: string;
    name: string; // e.g., "Disassembly", "Metal Work", "Paint", "Assembly"
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'HALTED';
    startDate?: string;
    endDate?: string;
    budgetAllocation: number; // How much of the budget is for this phase
    actualCost: number;
    completionPercentage: number;
    tasks: ProjectTask[]; // Granular tasks within the phase
}

export interface ProjectUpdate {
    id: string;
    date: string;
    title: string;
    description: string;
    imageUrl?: string;
    phaseId: string;
}

export interface RestorationProject {
    id: string;
    name: string; // e.g. "1969 Mustang Restoration"
    customerId: string; // Linked Customer
    customerName: string;
    vehicleId: string; // Linked Vehicle
    vehicleDescription: string; // "1969 Ford Mustang"
    branchId: string;
    startDate: string;
    estimatedCompletionDate: string;
    totalBudget: number;
    totalSpent: number;
    depositAmount: number;
    status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    phases: ProjectPhase[];
    updates: ProjectUpdate[];
}

export type ViewState = 'DASHBOARD' | 'JOBS' | 'INSPECTIONS' | 'VEHICLES' | 'CUSTOMERS' | 'SALES' | 'FINANCE' | 'INVENTORY' | 'HR' | 'CUSTOMER_PORTAL' | 'SETTINGS' | 'PROJECTS' | 'ASSETS';
export type UserRole = 'MANAGER' | 'RECEPTIONIST' | 'TECHNICIAN' | 'INSPECTOR' | 'CUSTOMER';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}