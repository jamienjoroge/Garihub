import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import GarageDashboard from './views/GarageDashboard';
import JobCardManager from './views/JobCardManager';
import CustomerPortal from './views/CustomerPortal';
import CustomerManager from './views/CustomerManager';
import FinanceManager from './views/FinanceManager';
import SalesManager from './views/SalesManager';
import InspectionManager from './views/InspectionManager';
import VehicleRegistry from './views/VehicleRegistry';
import InventoryManager from './views/InventoryManager';
import HRManager from './views/HRManager';
import SettingsManager from './views/SettingsManager';
import ProjectManager from './views/ProjectManager';
import AssetManager from './views/AssetManager';
import { ViewState, UserRole, JobCard, SalesOrder, JobStatus, Product, Branch, ServiceBay, ServicePackage, Customer, Invoice, FixedAsset, Vehicle, Account, JournalEntry, Quotation, Appointment, Employee, TenantSettings, Inspection } from './types';
import { ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [role, setRole] = useState<UserRole>('MANAGER');

  // --- TENANT CONFIGURATION ---
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
      name: 'GariHub Motors Ltd',
      phone: '0722 123 456',
      email: 'info@garihub.co.ke',
      address: 'Industrial Area, Funzi Rd',
      currency: 'KES',
      tax: {
          enabled: true,
          rate: 16,
          pin: 'P051234567Z'
      },
      branding: {
          logoUrl: ''
      },
      invoiceTerms: 'All goods remain property of GariHub until paid in full.'
  });

  // --- BRANCH MANAGEMENT ---
  const [branches, setBranches] = useState<Branch[]>([
      { id: 'BR-HQ', name: 'Industrial Area (HQ)', location: 'Nairobi', isHeadquarters: true },
      { id: 'BR-WL', name: 'Westlands Branch', location: 'Nairobi', isHeadquarters: false },
      { id: 'BR-KS', name: 'Kisumu Branch', location: 'Kisumu', isHeadquarters: false }
  ]);
  const [currentBranch, setCurrentBranch] = useState<Branch>(branches[0]);

  // --- WORKSHOP CONFIGURATION ---
  const [serviceBays, setServiceBays] = useState<ServiceBay[]>([
      { id: 'BAY-1', name: 'Bay 1 (Lift)', type: 'LIFT', status: 'OCCUPIED', currentJobId: 'JOB-2024-001' },
      { id: 'BAY-2', name: 'Bay 2 (General)', type: 'GENERAL', status: 'AVAILABLE' },
      { id: 'BAY-3', name: 'Bay 3 (Pit)', type: 'PIT', status: 'MAINTENANCE' },
      { id: 'BAY-4', name: 'Bay 4 (Wash)', type: 'WASH', status: 'AVAILABLE' },
  ]);

  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([
      { id: 'SP-001', name: 'Minor Service', description: 'Oil Change, Oil Filter, Air Cleaner Dusting, 25-Point Check', basePrice: 3500, includesParts: false },
      { id: 'SP-002', name: 'Major Service', description: 'All Minor + Spark Plugs, Fuel Filter, Brake Fluid, Coolant, ATF Check', basePrice: 8500, includesParts: false },
      { id: 'SP-003', name: 'Computer Diagnosis (Paid)', description: 'OBD-II Scan and Report', basePrice: 1500, includesParts: false }
  ]);

  // --- GLOBAL MASTER DATA (Lifted for Tenancy/Branch Boundaries) ---
  const [employees, setEmployees] = useState<Employee[]>([
    { 
      id: 'EMP-001', name: 'David Omondi', branchIds: ['BR-HQ', 'BR-WL'], role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: 'Senior Mechanic',
      employmentType: 'FULL_TIME', 
      phone: '0711222333', idNumber: '22334455', kraPin: 'A00112233X', 
      baseSalary: 65000, status: 'ACTIVE', skills: ['Suspension', 'Engine'], joinedDate: '2022-01-15',
      statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
    },
    { 
      id: 'EMP-002', name: 'Samuel K.', branchIds: ['BR-HQ'], role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: 'Auto Electrician',
      employmentType: 'FREELANCE', 
      phone: '0722333444', idNumber: '33445566', kraPin: 'A00223344Y', 
      baseSalary: 0, commissionRate: 40, status: 'ACTIVE', skills: ['Electrical', 'Diagnostics'], joinedDate: '2023-05-10',
      statutoryDetails: { deductNSSF: false, deductSHIF: false, deductHousingLevy: false, deductPAYE: true }
    },
    { 
      id: 'EMP-003', name: 'Mercy Wanjiku', branchIds: ['BR-WL'], role: 'RECEPTIONIST', department: 'FRONT_OFFICE', jobTitle: 'Service Advisor',
      employmentType: 'CONTRACT', 
      phone: '0733444555', idNumber: '11223344', kraPin: 'A00334455Z', 
      baseSalary: 35000, status: 'ACTIVE', skills: ['Customer Service'], joinedDate: '2023-08-01',
      statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
    }
  ]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'V1',
      plateNumber: 'KCD 123A',
      make: 'Toyota',
      model: 'Fielder',
      year: 2015,
      vin: 'NZE141-908762',
      color: 'Silver',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      engineSize: '1500cc',
      ownerName: 'John Kamau'
    },
    {
      id: 'V2',
      plateNumber: 'KDE 456B',
      make: 'Subaru',
      model: 'Outback',
      year: 2018,
      vin: 'BS9-012345',
      color: 'Pearl White',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      engineSize: '2500cc',
      ownerName: 'Sarah Mwangi'
    },
    {
      id: 'V3',
      plateNumber: 'KDK 999L',
      make: 'Nissan',
      model: 'X-Trail',
      year: 2020,
      vin: 'NT32-555111',
      color: 'Black',
      fuelType: 'DIESEL',
      transmission: 'AUTOMATIC',
      engineSize: '2000cc',
      ownerName: 'Transport Co.'
    }
  ]);

  // --- FINANCE CORE (LIFTED) ---
  const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([
      // Assets
      { id: '1000', code: '1000', name: 'Cash on Hand', type: 'ASSET', subtype: 'Current', balance: 50000 },
      { id: '1010', code: '1010', name: 'Bank - KCB', type: 'ASSET', subtype: 'Current', balance: 450000 },
      { id: '1200', code: '1200', name: 'Accounts Receivable', type: 'ASSET', subtype: 'Current', balance: 45000 },
      { id: '1500', code: '1500', name: 'Inventory Asset', type: 'ASSET', subtype: 'Current', balance: 1200000 },
      // Liabilities
      { id: '2000', code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subtype: 'Current', balance: 45000 },
      { id: '2100', code: '2100', name: 'VAT Payable', type: 'LIABILITY', subtype: 'Current', balance: 18000 },
      // Equity
      { id: '3000', code: '3000', name: 'Owner Equity', type: 'EQUITY', subtype: 'Equity', balance: 1000000 },
      // Income
      { id: '4000', code: '4000', name: 'Sales - Service', type: 'INCOME', subtype: 'Revenue', balance: 0 },
      { id: '4100', code: '4100', name: 'Sales - Parts', type: 'INCOME', subtype: 'Revenue', balance: 0 },
      // Expenses
      { id: '5000', code: '5000', name: 'COGS - Parts', type: 'EXPENSE', subtype: 'Direct', balance: 0 },
      { id: '6000', code: '6000', name: 'Rent Expense', type: 'EXPENSE', subtype: 'Opex', balance: 80000 },
      { id: '6100', code: '6100', name: 'Utilities', type: 'EXPENSE', subtype: 'Opex', balance: 12500 },
  ]);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
      {
          id: 'JE-001',
          date: '2023-10-01',
          description: 'Initial Opening Balance',
          branchId: 'BR-HQ',
          lines: [
              { accountId: '1010', debit: 450000, credit: 0 },
              { accountId: '3000', debit: 0, credit: 450000 }
          ]
      }
  ]);

  // --- ASSETS STATE ---
  const [assets, setAssets] = useState<FixedAsset[]>([
      {
          id: 'AST-001',
          name: 'Twin Post Hydraulic Lift (4T)',
          serialNumber: 'LIFT-8829-X',
          category: 'MACHINERY',
          branchId: 'BR-HQ',
          location: 'BAY-1',
          purchaseDate: '2021-06-15',
          purchaseCost: 450000,
          salvageValue: 50000,
          usefulLifeYears: 10,
          status: 'ACTIVE',
          maintenanceLog: []
      },
      {
          id: 'AST-003',
          name: 'Isuzu NQR Recovery Truck',
          serialNumber: 'KCD 999X',
          category: 'VEHICLES',
          branchId: 'BR-HQ',
          location: 'Parking A',
          purchaseDate: '2019-03-20',
          purchaseCost: 3500000,
          salvageValue: 800000,
          usefulLifeYears: 7,
          status: 'MAINTENANCE',
          maintenanceLog: []
      }
  ]);

  // --- INSPECTIONS STATE (Lifted for Persistence) ---
  const [inspections, setInspections] = useState<Inspection[]>([
    {
      id: 'INS-2024-001',
      plateNumber: 'KDK 999L',
      model: 'Nissan X-Trail',
      type: 'PRE-PURCHASE',
      status: 'IN_PROGRESS',
      date: '2023-10-27'
    },
    {
      id: 'INS-2024-002',
      plateNumber: 'KCC 234P',
      model: 'Toyota Prado',
      type: 'VALUATION',
      status: 'COMPLETED',
      date: '2023-10-25',
      overallScore: 88
    }
  ]);

  // --- NAVIGATION HIGHLIGHT STATE ---
  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  // --- LIFTED STATE FOR INTEGRATION ---
  
  // 1. Inventory State
  const [products, setProducts] = useState<Product[]>([
    { id: 'P-001', sku: 'OIL-5W30', name: 'Synthetic Oil 5W30 (4L)', brand: 'TotalEnergies', category: 'SERVICE_PARTS', compatibleBrands: ['ALL'], compatibleModels: [], stockLevel: 15, minStockLevel: 10, buyPrice: 2800, sellPrice: 4500, supplierId: 'SUP-001', location: 'Shelf A1', costingMethod: 'WEIGHTED_AVERAGE', isTaxable: true, branchId: 'BR-HQ' },
    { id: 'P-002', sku: 'BRK-PAD-TOY', name: 'Front Brake Pads (Toyota)', brand: 'Toyota Genuine', category: 'BRAKES', compatibleBrands: ['TOYOTA'], compatibleModels: ['FIELDER', 'AXIO', 'VITZ'], stockLevel: 4, minStockLevel: 5, buyPrice: 1500, sellPrice: 3500, supplierId: 'SUP-001', location: 'Shelf B3', costingMethod: 'STANDARD_COST', isTaxable: true, branchId: 'BR-HQ' },
    { id: 'P-003', sku: 'SHK-ABS-SUB', name: 'Rear Shock Absorber', brand: 'KYB', category: 'SUSPENSION', compatibleBrands: ['SUBARU'], compatibleModels: ['OUTBACK', 'FORESTER'], stockLevel: 2, minStockLevel: 2, buyPrice: 6500, sellPrice: 9500, supplierId: 'SUP-002', location: 'Shelf C1', costingMethod: 'FIFO', isTaxable: true, branchId: 'BR-HQ' },
    { id: 'P-004', sku: 'OIL-5W30', name: 'Synthetic Oil 5W30 (4L)', brand: 'TotalEnergies', category: 'SERVICE_PARTS', compatibleBrands: ['ALL'], compatibleModels: [], stockLevel: 5, minStockLevel: 5, buyPrice: 2800, sellPrice: 4600, supplierId: 'SUP-001', location: 'Shelf W-1', costingMethod: 'WEIGHTED_AVERAGE', isTaxable: true, branchId: 'BR-WL' },
  ]);

  // 2. Jobs State
  const [jobs, setJobs] = useState<JobCard[]>([
    {
      id: 'JOB-2024-001',
      branchId: 'BR-HQ',
      vehicle: { id: 'V1', plateNumber: 'KCD 123A', make: 'Toyota', model: 'Fielder', year: 2015, vin: '...', ownerName: 'John Kamau' },
      status: JobStatus.IN_PROGRESS,
      entryDate: '2023-10-25T08:30:00',
      issueDescription: 'Suspension Noise',
      estimatedCost: 8500,
      technicianName: 'David Omondi',
      technicianId: 'EMP-001',
      bayId: 'BAY-1',
      partsUsed: []
    },
    {
      id: 'JOB-2024-002',
      branchId: 'BR-HQ',
      vehicle: { id: 'V2', plateNumber: 'KDE 456B', make: 'Subaru', model: 'Outback', year: 2018, vin: '...', ownerName: 'Sarah Mwangi' },
      status: JobStatus.DIAGNOSING,
      entryDate: '2023-10-26T09:15:00',
      issueDescription: 'Check engine light on, loss of power.',
      estimatedCost: 0,
      partsUsed: []
    }
  ]);

  // 3. Sales Orders & Quotes State (Quotes Lifted)
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([
      {
          id: 'SO-5001',
          branchId: 'BR-HQ',
          customerName: 'Transport Co. Ltd',
          vehiclePlate: 'KDK 999L',
          date: '2023-10-27',
          status: 'PENDING_JOB',
          totalAmount: 45000,
          items: [{ description: 'Fleet Service', quantity: 3, unitCost: 15000, total: 45000 }] 
      }
  ]);

  const [quotations, setQuotations] = useState<Quotation[]>([
    { 
        id: 'QT-1092', 
        branchId: 'BR-HQ',
        customerName: 'Peter Njoroge', 
        vehiclePlate: 'KBA 111Z', 
        date: '2023-10-28', 
        amount: 85000, 
        status: 'DRAFT', 
        items: [{ description: 'Engine Overhaul', quantity: 1, unitCost: 85000, total: 85000 }] 
    },
    { 
        id: 'QT-1095', 
        branchId: 'BR-WL',
        customerName: 'Alice Wambui', 
        vehiclePlate: 'KCD 222B', 
        date: '2023-10-29', 
        amount: 12000, 
        status: 'ACCEPTED', 
        items: [{ description: 'Body Paint Touchup', quantity: 1, unitCost: 12000, total: 12000 }] 
    }
  ]);

  // 4. Customers State
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'CUST-001',
      name: 'John Kamau',
      phone: '0712345678',
      email: 'john.k@example.com',
      kraPin: 'A001234567Z',
      lastVisit: '2023-10-25',
      totalSpend: 45000,
      segment: 'VIP',
      interactions: [
          { id: 'INT-1', date: '2023-10-20', type: 'CALL', summary: 'Service Reminder', details: 'Reminded client about 5000km service due.', loggedBy: 'Reception' },
          { id: 'INT-2', date: '2023-10-25', type: 'VISIT', summary: 'Vehicle Check-in', details: 'Client complained about suspension noise.', loggedBy: 'Reception' }
      ],
      vehicles: [
        { id: 'V1', plateNumber: 'KCD 123A', make: 'Toyota', model: 'Fielder', year: 2015, vin: '...', ownerName: 'John Kamau' }
      ]
    },
    {
      id: 'CUST-002',
      name: 'Sarah Mwangi',
      phone: '0722987654',
      email: 's.mwangi@example.com',
      kraPin: 'A009876543Y',
      lastVisit: '2023-09-15',
      totalSpend: 12500,
      segment: 'RETURNING',
      interactions: [
          { id: 'INT-3', date: '2023-09-15', type: 'NOTE', summary: 'Preferred Contact', details: 'Prefer WhatsApp over calls.', loggedBy: 'Reception' }
      ],
      vehicles: [
        { id: 'V2', plateNumber: 'KDE 456B', make: 'Subaru', model: 'Outback', year: 2018, vin: '...', ownerName: 'Sarah Mwangi' }
      ]
    }
  ]);

  // 5. Invoices (Global Source of Truth)
  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
        id: 'INV-2024-001', 
        branchId: 'BR-HQ',
        customerName: 'John Kamau', 
        jobId: 'JOB-2024-001', 
        amount: 12500, 
        taxAmount: 1724,
        date: '2023-10-25', 
        dueDate: '2023-11-25', 
        status: 'PAID', 
        paymentMethod: 'MPESA', 
        items: [{ description: 'Suspension Repair', quantity: 1, unitCost: 12500, total: 12500 }] 
    }
  ]);

  // --- INTEGRATION HANDLERS ---

  const handleBookAppointment = (apt: Appointment, vehicleDetails?: { make: string, model: string }) => {
      const cleanPlate = apt.vehiclePlate.toUpperCase();
      
      // 1. Check/Create Vehicle
      let targetVehicle = vehicles.find(v => v.plateNumber === cleanPlate);
      if (!targetVehicle) {
          targetVehicle = {
              id: `V-${Date.now()}`,
              plateNumber: cleanPlate,
              make: vehicleDetails?.make || 'Unknown',
              model: vehicleDetails?.model || 'Vehicle',
              year: new Date().getFullYear(),
              vin: 'N/A',
              ownerName: apt.customerName
          };
          setVehicles([targetVehicle, ...vehicles]);
      }

      // 2. Check/Create Customer
      // Simple matching by Phone first, then Name
      let targetCustomer = customers.find(c => c.phone === apt.phone || c.name === apt.customerName);
      
      if (!targetCustomer) {
          // New Customer
          const newCust: Customer = {
              id: `CUST-${Date.now()}`,
              name: apt.customerName,
              phone: apt.phone || '',
              email: '',
              lastVisit: 'Never',
              totalSpend: 0,
              segment: 'NEW',
              interactions: [
                  { id: `INT-${Date.now()}`, date: new Date().toISOString(), type: 'NOTE', summary: 'Auto-Created', details: 'Customer profile created via Appointment Booking.', loggedBy: 'System' }
              ],
              vehicles: [targetVehicle]
          };
          setCustomers([newCust, ...customers]);
      } else {
          // Existing Customer - Check if they have this vehicle
          const hasVehicle = targetCustomer.vehicles.find(v => v.plateNumber === cleanPlate);
          if (!hasVehicle) {
              const updatedCustomer = {
                  ...targetCustomer,
                  vehicles: [targetVehicle, ...targetCustomer.vehicles]
              };
              setCustomers(customers.map(c => c.id === targetCustomer.id ? updatedCustomer : c));
          }
      }
  };

  const handleCheckIn = (
    job: JobCard, 
    mode: 'SERVICE' | 'DIAGNOSIS', 
    servicePackageId?: string, 
    diagnosisFee?: number
  ) => {
      const initialStatus = mode === 'SERVICE' ? JobStatus.WAITING_APPROVAL : JobStatus.DIAGNOSING;
      
      const newJob = { 
          ...job, 
          status: initialStatus,
          estimatedCost: mode === 'DIAGNOSIS' && diagnosisFee ? diagnosisFee : job.estimatedCost 
      };
      
      setJobs([newJob, ...jobs]);

      if (mode === 'SERVICE' && servicePackageId) {
          const pkg = servicePackages.find(p => p.id === servicePackageId);
          if (pkg) {
              const newQuote: Quotation = {
                  id: `QT-${Date.now().toString().slice(-4)}`,
                  customerName: job.vehicle.ownerName,
                  vehiclePlate: job.vehicle.plateNumber,
                  branchId: job.branchId,
                  jobId: newJob.id,
                  date: new Date().toISOString().split('T')[0],
                  amount: pkg.basePrice,
                  status: 'DRAFT', 
                  items: [{
                      description: pkg.name,
                      quantity: 1,
                      unitCost: pkg.basePrice,
                      total: pkg.basePrice
                  }]
              };
              setQuotations([newQuote, ...quotations]);
              
              const updatedJob = { ...newJob, estimatedCost: pkg.basePrice };
              setJobs(prevJobs => prevJobs.map(j => j.id === newJob.id ? updatedJob : j));
              
              setHighlightedJobId(newJob.id);
              setCurrentView('JOBS'); 
          }
      } 
      else {
          setHighlightedJobId(newJob.id);
          setCurrentView('JOBS');
      }
  };

  const handleGenerateQuoteFromJob = (job: JobCard) => {
      if (!job.diagnosis) return;

      const quoteItems = job.diagnosis.map(d => ({
          description: d.proposedFix || d.description,
          quantity: 1,
          unitCost: (d.estimatedPartCost || 0) + (d.estimatedLaborCost || 0),
          total: (d.estimatedPartCost || 0) + (d.estimatedLaborCost || 0)
      }));

      const totalAmount = quoteItems.reduce((sum, item) => sum + item.total, 0);

      const newQuote: Quotation = {
          id: `QT-${Date.now().toString().slice(-4)}`,
          customerName: job.vehicle.ownerName,
          vehiclePlate: job.vehicle.plateNumber,
          branchId: job.branchId,
          jobId: job.id,
          date: new Date().toISOString().split('T')[0],
          amount: totalAmount,
          status: 'DRAFT',
          items: quoteItems
      };

      setQuotations([newQuote, ...quotations]);
      
      const updatedJob = { ...job, status: JobStatus.WAITING_APPROVAL, estimatedCost: totalAmount };
      handleUpdateJob(updatedJob);

      setCurrentView('SALES');
  };

  const handleCreateJobFromOrder = (order: SalesOrder) => {
    if (order.jobCardId) {
        const existingJob = jobs.find(j => j.id === order.jobCardId);
        if (existingJob) {
            const updatedJob: JobCard = {
                ...existingJob,
                status: JobStatus.READY, 
                salesOrderId: order.id,
                partsUsed: [] 
            };
            handleUpdateJob(updatedJob);
            
            const updatedOrders = salesOrders.map(so => 
                so.id === order.id 
                ? { ...so, status: 'JOB_IN_PROGRESS' } as SalesOrder 
                : so
            );
            setSalesOrders(updatedOrders);

            setCurrentView('JOBS');
            setHighlightedJobId(existingJob.id);
            setTimeout(() => setHighlightedJobId(null), 2000);
            return;
        }
    }

    const newJob: JobCard = {
        id: `JOB-${Date.now()}`,
        salesOrderId: order.id,
        branchId: order.branchId, 
        vehicle: {
            id: `V-TEMP-${Date.now()}`,
            plateNumber: order.vehiclePlate,
            make: 'Unknown',
            model: 'Check Order',
            year: new Date().getFullYear(),
            vin: 'N/A',
            ownerName: order.customerName
        },
        status: JobStatus.READY,
        entryDate: new Date().toISOString(),
        issueDescription: order.items.map(i => i.description).join(', '),
        estimatedCost: order.totalAmount,
        partsUsed: []
    };

    setJobs([newJob, ...jobs]);

    const updatedOrders = salesOrders.map(so => 
        so.id === order.id 
        ? { ...so, status: 'JOB_IN_PROGRESS', jobCardId: newJob.id } as SalesOrder 
        : so
    );
    setSalesOrders(updatedOrders);
    
    setCurrentView('JOBS');
    setHighlightedJobId(newJob.id);
    setTimeout(() => setHighlightedJobId(null), 2000);
  };

  const handleUpdateJob = (updatedJob: JobCard) => {
      const newJobList = jobs.map(j => j.id === updatedJob.id ? updatedJob : j);
      setJobs(newJobList);

      if (updatedJob.status === JobStatus.COMPLETED && updatedJob.salesOrderId) {
          const updatedOrders = salesOrders.map(so => 
              so.id === updatedJob.salesOrderId 
              ? { ...so, status: 'READY_TO_INVOICE' } as SalesOrder 
              : so
          );
          setSalesOrders(updatedOrders);
      }
  };

  const handleViewJob = (jobId: string) => {
      setCurrentView('JOBS');
      setHighlightedJobId(jobId);
      setTimeout(() => setHighlightedJobId(null), 3000);
  };

  const handleViewOrder = (orderId: string) => {
      setCurrentView('SALES');
      setHighlightedOrderId(orderId);
      setTimeout(() => setHighlightedOrderId(null), 3000);
  };

  // --- FINANCE INTEGRATION: ACCRUAL BASIS ---
  
  // 1. Invoice Created: DR Accounts Receivable, CR Sales
  // This is the handler passed to SalesManager to ensure single source of truth
  const handleInvoiceCreated = (invoice: Invoice) => {
      // 1. Update Global State
      setInvoices([invoice, ...invoices]);

      // 2. Post to GL
      const amount = invoice.amount;
      const tax = invoice.taxAmount || 0;
      const revenue = amount - tax;

      const je: JournalEntry = {
          id: `JE-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `Invoice Created #${invoice.id} (${invoice.customerName})`,
          reference: invoice.id,
          branchId: invoice.branchId,
          lines: [
              { accountId: '1200', debit: amount, credit: 0 }, // AR (Debit Asset) - Full Amount
              { accountId: '4000', debit: 0, credit: revenue }  // Sales Income (Credit Revenue) - Net
          ]
      };

      // Add VAT liability line if tax exists
      if (tax > 0) {
          je.lines.push({ accountId: '2100', debit: 0, credit: tax }); // VAT Payable (Credit Liability)
      }

      setJournalEntries([je, ...journalEntries]);
      
      // Update GL Balances
      const updatedAccounts = chartOfAccounts.map(acc => {
          if (acc.id === '1200') return { ...acc, balance: acc.balance + amount };
          if (acc.id === '4000') return { ...acc, balance: acc.balance + revenue };
          if (acc.id === '2100' && tax > 0) return { ...acc, balance: acc.balance + tax };
          return acc;
      });
      setChartOfAccounts(updatedAccounts);
  };

  // 2. Payment Received: DR Bank, CR Accounts Receivable
  const handleRecordPayment = (invoice: Invoice) => {
    // 1. Update Invoice Status
    const updatedInvoices = invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: 'PAID', paymentMethod: 'MPESA' } as Invoice : inv
    );
    setInvoices(updatedInvoices);

    // 2. Post to GL (Accrual Settlement)
    const amount = invoice.amount;
    const je: JournalEntry = {
        id: `JE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Payment for Invoice #${invoice.id} (${invoice.customerName})`,
        reference: invoice.id,
        branchId: invoice.branchId,
        lines: [
            { accountId: '1010', debit: amount, credit: 0 }, // Bank (Debit Asset)
            { accountId: '1200', debit: 0, credit: amount }  // AR (Credit Asset - Reduces AR)
        ]
    };
    setJournalEntries([je, ...journalEntries]);

    // 3. Update Account Balances
    const updatedAccounts = chartOfAccounts.map(acc => {
        if (acc.id === '1010') return { ...acc, balance: acc.balance + amount }; // Bank increases
        if (acc.id === '1200') return { ...acc, balance: acc.balance - amount }; // AR decreases
        return acc;
    });
    setChartOfAccounts(updatedAccounts);
  };

  // --- ACCESS CONTROL HELPER ---
  const isAccessAllowed = (view: ViewState): boolean => {
      if (role === 'MANAGER') return true;
      const permissions: Record<ViewState, UserRole[]> = {
          'DASHBOARD': ['RECEPTIONIST', 'TECHNICIAN', 'INSPECTOR', 'MANAGER'],
          'JOBS': ['RECEPTIONIST', 'TECHNICIAN', 'MANAGER'],
          'INSPECTIONS': ['INSPECTOR', 'MANAGER'],
          'VEHICLES': ['RECEPTIONIST', 'TECHNICIAN', 'MANAGER'],
          'CUSTOMERS': ['RECEPTIONIST', 'MANAGER'],
          'SALES': ['RECEPTIONIST', 'MANAGER'],
          'FINANCE': ['MANAGER'],
          'INVENTORY': ['TECHNICIAN', 'MANAGER'],
          'HR': ['MANAGER'],
          'SETTINGS': ['MANAGER'],
          'CUSTOMER_PORTAL': ['CUSTOMER'],
          'PROJECTS': ['MANAGER', 'TECHNICIAN'],
          'ASSETS': ['MANAGER']
      };
      if (view === 'CUSTOMER_PORTAL' && role === 'CUSTOMER') return true;
      if (role === 'CUSTOMER') return view === 'CUSTOMER_PORTAL';
      return permissions[view]?.includes(role) || false;
  };

  const renderContent = () => {
    if (!isAccessAllowed(currentView)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-sm">Your role ({role}) does not have permission to view this module.</p>
                <button onClick={() => setCurrentView('DASHBOARD')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Return to Dashboard</button>
            </div>
        );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <GarageDashboard 
          role={role}
          stats={{
            revenueMonth: chartOfAccounts.find(a => a.id === '4000')?.balance || 0, // Dynamic from GL
            carsInShop: jobs.filter(j => j.status !== JobStatus.COMPLETED && j.status !== JobStatus.INVOICED).length,
            pendingInvoices: invoices.filter(i => i.status === 'PENDING').length,
            customerSatisfaction: 4.8
          }} 
        />;
      case 'VEHICLES':
        return <VehicleRegistry 
            vehicles={vehicles}
            setVehicles={setVehicles}
        />;
      case 'JOBS':
        return <JobCardManager 
            jobs={jobs} 
            onUpdateJob={handleUpdateJob} 
            onCreateJob={(j) => setJobs([j, ...jobs])} // Keeps legacy ref just in case
            inventory={products} 
            setInventory={setProducts} 
            onViewOrder={handleViewOrder}
            highlightedJobId={highlightedJobId}
            serviceBays={serviceBays}
            setServiceBays={setServiceBays}
            currentBranch={currentBranch}
            userRole={role}
            onGenerateQuote={handleGenerateQuoteFromJob}
            servicePackages={servicePackages}
            onCheckIn={handleCheckIn}
            onBookAppointment={handleBookAppointment}
            tenantSettings={tenantSettings} // Pass for report generation
        />;
      case 'PROJECTS':
        return <ProjectManager 
            currentBranch={currentBranch} 
            userRole={role} 
            customers={customers}
            jobs={jobs}
            onCreateJob={(j) => setJobs([j, ...jobs])}
            salesOrders={salesOrders}
            setSalesOrders={setSalesOrders}
            invoices={invoices}
            setInvoices={setInvoices}
        />;
      case 'INSPECTIONS':
        return <InspectionManager 
            inspections={inspections} 
            setInspections={setInspections}
        />;
      case 'CUSTOMERS':
        return <CustomerManager userRole={role} customers={customers} setCustomers={setCustomers} />;
      case 'SALES':
        return <SalesManager 
            salesOrders={salesOrders}
            setSalesOrders={setSalesOrders}
            quotations={quotations}
            setQuotations={setQuotations}
            invoices={invoices} // Passed from App state
            onCreateJob={handleCreateJobFromOrder}
            onViewJob={handleViewJob}
            highlightedOrderId={highlightedOrderId}
            currentBranch={currentBranch}
            onRecordPayment={handleRecordPayment}
            onInvoiceCreated={handleInvoiceCreated} // Use handler that updates App state & GL
            tenantSettings={tenantSettings}
        />;
      case 'FINANCE':
        return <FinanceManager 
            currentBranch={currentBranch}
            chartOfAccounts={chartOfAccounts}
            setChartOfAccounts={setChartOfAccounts}
            journalEntries={journalEntries}
            setJournalEntries={setJournalEntries}
        />;
      case 'CUSTOMER_PORTAL':
        return <CustomerPortal />;
      case 'INVENTORY':
        return <InventoryManager 
            products={products}
            setProducts={setProducts}
            currentBranch={currentBranch}
            branches={branches}
            userRole={role}
        />;
      case 'ASSETS':
        return <AssetManager 
            assets={assets}
            setAssets={setAssets}
            serviceBays={serviceBays}
            currentBranch={currentBranch}
        />;
      case 'HR':
        return <HRManager 
            currentBranch={currentBranch}
            employees={employees}
            setEmployees={setEmployees}
            branches={branches} // Pass all branches for assignment
        />;
      case 'SETTINGS':
         return <SettingsManager 
            branches={branches}
            setBranches={setBranches}
            serviceBays={serviceBays}
            setServiceBays={setServiceBays}
            tenantSettings={tenantSettings}
            setTenantSettings={setTenantSettings}
         />;
      default:
        return <div className="flex items-center justify-center h-full text-slate-400">Page not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        role={role}
        setRole={setRole}
        currentBranch={currentBranch}
        branches={branches}
        setBranch={setCurrentBranch}
      />
      <main className="flex-1 h-full overflow-y-auto scroll-smooth">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;