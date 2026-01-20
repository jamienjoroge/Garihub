import React, { useState, useMemo } from 'react';
import { Users, UserPlus, DollarSign, FileText, Briefcase, Plus, Search, Filter, Phone, Calendar, Calculator, CheckCircle2, X, Tag, Settings, Printer, Download, Landmark, LayoutGrid, List, Edit, Trash2, UserMinus, AlertTriangle } from 'lucide-react';
import { Employee, EmploymentType, EmployeeRole, PayrollRecord, Department, PayrollConfig } from '../types';

const HRManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'PAYROLL' | 'RECRUIT'>('STAFF');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Retirement/Termination State
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [employeeToRetire, setEmployeeToRetire] = useState<Employee | null>(null);

  // --- Mock Data ---
  const [employees, setEmployees] = useState<Employee[]>([
    { 
      id: 'EMP-001', name: 'David Omondi', role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: 'Senior Mechanic',
      employmentType: 'FULL_TIME', 
      phone: '0711222333', idNumber: '22334455', kraPin: 'A00112233X', 
      baseSalary: 65000, status: 'ACTIVE', skills: ['Suspension', 'Engine'], joinedDate: '2022-01-15',
      statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
    },
    { 
      id: 'EMP-002', name: 'Samuel K.', role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: 'Auto Electrician',
      employmentType: 'FREELANCE', 
      phone: '0722333444', idNumber: '33445566', kraPin: 'A00223344Y', 
      baseSalary: 0, commissionRate: 40, status: 'ACTIVE', skills: ['Electrical', 'Diagnostics'], joinedDate: '2023-05-10',
      statutoryDetails: { deductNSSF: false, deductSHIF: false, deductHousingLevy: false, deductPAYE: true } // Freelance with only Withholding tax (simulated as PAYE here for simplicity)
    },
    { 
      id: 'EMP-003', name: 'Mercy Wanjiku', role: 'RECEPTIONIST', department: 'FRONT_OFFICE', jobTitle: 'Service Advisor',
      employmentType: 'CONTRACT', 
      phone: '0733444555', idNumber: '11223344', kraPin: 'A00334455Z', 
      baseSalary: 35000, status: 'ACTIVE', skills: ['Customer Service'], joinedDate: '2023-08-01',
      statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
    }
  ]);

  const [payrollMonth, setPayrollMonth] = useState('October 2023');
  const [processedPayroll, setProcessedPayroll] = useState<PayrollRecord[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // New Employee State includes Statutory Details
  const [newEmployee, setNewEmployee] = useState<Partial<Employee> & { statutoryDetails: { deductNSSF: boolean, deductSHIF: boolean, deductHousingLevy: boolean, deductPAYE: boolean } }>({
    name: '', role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: '', 
    employmentType: 'FULL_TIME', baseSalary: 0, commissionRate: 0, status: 'ACTIVE', skills: [],
    statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
  });

  // --- Kenya Payroll Calculator 2024/2025 ---
  const calculateKenyanPayroll = (emp: Employee): PayrollRecord => {
    let gross = emp.baseSalary;
    
    // Simple logic for Freelance/Commission (Mock avg for demo)
    if (emp.employmentType === 'FREELANCE') {
        gross = 45000; // Assuming estimated commission for the month
    }

    const { statutoryDetails } = emp;

    // 1. NSSF (Tier 1 & 2) - Employee Share (6%)
    // Max pensionable earnings ~36,000 (Revised NSSF Act)
    // Tier 1 on 6,000, Tier 2 on balance up to 36,000.
    // Max deduction is approx 2,160.
    let nssf = 0;
    if (statutoryDetails.deductNSSF) {
        const pensionable = Math.min(gross, 36000); // Cap at 36k for Tier 2
        nssf = pensionable * 0.06; 
    }

    // 2. Taxable Income
    const taxableIncome = gross - nssf;

    // 3. PAYE (Graduated Scale 2024/25)
    // Bands: First 24k @10%, Next 8,333 @25%, Next 467,667 @30%, etc.
    // Personal Relief: 2,400
    let paye = 0;
    if (statutoryDetails.deductPAYE) {
        let tax = 0;
        let remaining = taxableIncome;

        // Band 1: 24,000 @ 10%
        if (remaining > 0) {
            const taxed = Math.min(remaining, 24000);
            tax += taxed * 0.1;
            remaining -= taxed;
        }
        // Band 2: 8,333 @ 25%
        if (remaining > 0) {
            const taxed = Math.min(remaining, 8333);
            tax += taxed * 0.25;
            remaining -= taxed;
        }
        // Band 3: 467,667 @ 30%
        if (remaining > 0) {
            const taxed = Math.min(remaining, 467667);
            tax += taxed * 0.30;
            remaining -= taxed;
        }
        // Band 4: 300,000 @ 32.5%
        if (remaining > 0) {
            const taxed = Math.min(remaining, 300000);
            tax += taxed * 0.325;
            remaining -= taxed;
        }
        // Band 5: Above @ 35%
        if (remaining > 0) {
            tax += remaining * 0.35;
        }

        paye = Math.max(0, tax - 2400); // Deduct Personal Relief
    }

    // 4. SHIF (Social Health Insurance Fund) - 2.75% of Gross
    let shif = 0;
    if (statutoryDetails.deductSHIF) {
        shif = gross * 0.0275;
        // SHIF has a floor of 300 usually, but let's stick to % for now
        if (shif < 300 && gross > 0) shif = 300; 
    }

    // 5. Housing Levy - 1.5% of Gross
    let housingLevy = 0;
    if (statutoryDetails.deductHousingLevy) {
        housingLevy = gross * 0.015;
    }

    const totalDeductions = nssf + paye + shif + housingLevy;

    return {
        id: `PR-${Date.now()}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: payrollMonth,
        grossPay: gross,
        taxableIncome: taxableIncome,
        deductions: {
            nssf: Math.round(nssf),
            paye: Math.round(paye),
            shif: Math.round(shif),
            housingLevy: Math.round(housingLevy),
            advances: 0,
            other: 0
        },
        netPay: Math.round(gross - totalDeductions),
        status: 'PROCESSED'
    };
  };

  const handleRunPayroll = () => {
      // Filter out retired/terminated employees from new payroll runs if desired
      // For now, let's assume we pay everyone who is in the list, or filter
      const activeStaff = employees.filter(e => e.status === 'ACTIVE' || e.status === 'ON_LEAVE');
      const records = activeStaff.map(emp => calculateKenyanPayroll(emp));
      setProcessedPayroll(records);
  };

  const openAddModal = () => {
      setEditingId(null);
      setNewEmployee({
        name: '', role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: '', 
        employmentType: 'FULL_TIME', baseSalary: 0, commissionRate: 0, status: 'ACTIVE', skills: [],
        statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
      });
      setShowAddModal(true);
  };

  const openEditModal = (emp: Employee) => {
      setEditingId(emp.id);
      setNewEmployee({
          ...emp
      });
      setShowAddModal(true);
  };

  const openRetireModal = (emp: Employee) => {
      setEmployeeToRetire(emp);
      setShowRetireModal(true);
  };

  const handleRetireEmployee = () => {
      if (!employeeToRetire) return;
      
      const updatedEmployees = employees.map(emp => {
          if (emp.id === employeeToRetire.id) {
              return { ...emp, status: 'RETIRED' } as Employee;
          }
          return emp;
      });
      setEmployees(updatedEmployees);
      setShowRetireModal(false);
      setEmployeeToRetire(null);
  };

  const handleSaveEmployee = () => {
    if (!newEmployee.name || !newEmployee.role || !newEmployee.jobTitle) return;

    if (editingId) {
        // Edit Mode
        const updatedEmployees = employees.map(emp => {
            if (emp.id === editingId) {
                return {
                    ...emp,
                    ...newEmployee,
                    // Ensure numbers are numbers
                    baseSalary: Number(newEmployee.baseSalary),
                    commissionRate: Number(newEmployee.commissionRate),
                } as Employee;
            }
            return emp;
        });
        setEmployees(updatedEmployees);
    } else {
        // Add Mode
        const emp: Employee = {
            id: `EMP-${Date.now()}`,
            name: newEmployee.name!,
            role: newEmployee.role as EmployeeRole,
            department: newEmployee.department as Department,
            jobTitle: newEmployee.jobTitle!,
            employmentType: newEmployee.employmentType as EmploymentType,
            phone: newEmployee.phone || '',
            idNumber: newEmployee.idNumber || '',
            kraPin: newEmployee.kraPin || '',
            baseSalary: Number(newEmployee.baseSalary),
            commissionRate: Number(newEmployee.commissionRate),
            status: 'ACTIVE',
            skills: newEmployee.skills || [],
            joinedDate: new Date().toISOString().split('T')[0],
            statutoryDetails: newEmployee.statutoryDetails!
        };
        setEmployees([...employees, emp]);
    }

    setShowAddModal(false);
  };

  const filteredEmployees = employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
  });

  const getDepartmentColor = (dept: Department) => {
      switch(dept) {
          case 'WORKSHOP': return 'bg-orange-100 text-orange-700';
          case 'FRONT_OFFICE': return 'bg-blue-100 text-blue-700';
          case 'FINANCE': return 'bg-green-100 text-green-700';
          case 'SALES': return 'bg-purple-100 text-purple-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">HR & Staff Management</h2>
          <p className="text-gray-500">Manage technicians, freelance contracts, and payroll processing.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {[
                { id: 'STAFF', icon: Users, label: 'Staff Directory' },
                { id: 'PAYROLL', icon: DollarSign, label: 'Payroll & Benefits' },
                { id: 'RECRUIT', icon: UserPlus, label: 'Recruitment' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </header>

      {/* --- STAFF DIRECTORY --- */}
      {activeTab === 'STAFF' && (
        <div className="flex flex-col h-full animate-in fade-in bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                 <div className="flex gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search staff by name or position..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 border border-gray-200 rounded-lg bg-white">
                        <Filter size={16} className="text-gray-500"/>
                        <select 
                            className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer py-2 outline-none"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value as any)}
                        >
                            <option value="ALL">All Departments</option>
                            <option value="WORKSHOP">Workshop</option>
                            <option value="FRONT_OFFICE">Front Office</option>
                            <option value="SALES">Sales</option>
                            <option value="FINANCE">Finance</option>
                            <option value="OPERATIONS">Operations</option>
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-200 p-1 rounded-lg ml-3">
                        <button 
                            onClick={() => setViewMode('GRID')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid size={18}/>
                        </button>
                        <button 
                            onClick={() => setViewMode('LIST')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List size={18}/>
                        </button>
                    </div>
                 </div>
                 <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 ml-4 shadow-sm">
                    <Plus size={16} /> Add Employee
                 </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {viewMode === 'GRID' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map(emp => (
                            <div key={emp.id} className={`bg-white p-6 rounded-xl border transition-all relative overflow-hidden group ${
                                emp.status === 'RETIRED' || emp.status === 'TERMINATED' 
                                ? 'border-gray-200 opacity-75 bg-gray-50' 
                                : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                            }`}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-white rounded-bl-full z-0 pointer-events-none"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm ${
                                            emp.status === 'RETIRED' ? 'bg-gray-200 text-gray-500' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {emp.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{emp.name}</h4>
                                            <p className="text-sm font-medium text-blue-600">{emp.jobTitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => openEditModal(emp)}
                                            className="text-gray-400 hover:text-blue-600 p-1 rounded bg-white hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getDepartmentColor(emp.department)}`}>
                                        {emp.department.replace('_', ' ')}
                                    </span>
                                    {emp.status === 'RETIRED' ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-gray-300 bg-gray-200 text-gray-600">
                                            RETIRED
                                        </span>
                                    ) : (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                                            emp.employmentType === 'FREELANCE' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                                            emp.employmentType === 'FULL_TIME' ? 'border-green-200 text-green-700 bg-green-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                                        }`}>
                                            {emp.employmentType.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4 relative z-10 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {emp.phone}</div>
                                    <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400"/> {emp.employmentType === 'FREELANCE' ? 'Commission Based' : `KES ${emp.baseSalary.toLocaleString()}/mo`}</div>
                                    <div className="flex items-center gap-2"><Landmark size={14} className="text-gray-400"/> KRA: {emp.kraPin}</div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-50 relative z-10">
                                    <button className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors">View Profile</button>
                                    {emp.status === 'ACTIVE' && (
                                        <button 
                                            onClick={() => openRetireModal(emp)}
                                            className="px-3 text-sm font-medium text-red-600 hover:text-red-700 border border-red-100 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            title="Retire/Offboard"
                                        >
                                            <UserMinus size={16} /> Retire
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider sticky top-0">
                            <tr>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Role & Dept</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Type & Pay</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className={`hover:bg-gray-50/50 ${emp.status === 'RETIRED' ? 'bg-gray-50' : ''}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm ${
                                                emp.status === 'RETIRED' ? 'bg-gray-200 text-gray-500' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {emp.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${emp.status === 'RETIRED' ? 'text-gray-500' : 'text-gray-900'}`}>{emp.name}</p>
                                                <p className="text-xs text-gray-500">{emp.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-medium text-gray-800">{emp.jobTitle}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDepartmentColor(emp.department)}`}>
                                            {emp.department.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2"><Phone size={14}/> {emp.phone}</div>
                                        <div className="text-xs text-gray-400 mt-1">ID: {emp.idNumber}</div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <p className="font-medium text-gray-900">{emp.employmentType.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500">
                                            {emp.employmentType === 'FREELANCE' ? 'Commission' : `KES ${emp.baseSalary.toLocaleString()}`}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                            emp.status === 'RETIRED' ? 'bg-gray-200 text-gray-600' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => openEditModal(emp)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {emp.status === 'ACTIVE' && (
                                                <button 
                                                    onClick={() => openRetireModal(emp)}
                                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Retire Employee"
                                                >
                                                    <UserMinus size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      )}

      {/* --- PAYROLL TAB --- */}
      {activeTab === 'PAYROLL' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in">
             <div className="p-6 border-b border-gray-100 bg-gray-50 space-y-4">
                 <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-gray-800">Payroll Processing</h3>
                        <p className="text-sm text-gray-500">Compliance Mode: Per Employee Master Data</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            <FileText size={16} /> Tax Reports (P10)
                        </button>
                        <button 
                            onClick={handleRunPayroll}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 shadow-sm"
                        >
                            <Calculator size={16} /> Calculate & Run
                        </button>
                    </div>
                 </div>
            </div>

            <div className="overflow-auto flex-1">
                {processedPayroll.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider sticky top-0">
                            <tr>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Gross Pay</th>
                                <th className="p-4 text-gray-500">NSSF</th>
                                <th className="p-4 text-gray-500">Taxable</th>
                                <th className="p-4 text-blue-600">PAYE</th>
                                <th className="p-4 text-orange-600">Housing Levy</th>
                                <th className="p-4 text-purple-600">SHIF</th>
                                <th className="p-4 text-right font-bold">Net Pay</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {processedPayroll.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-medium text-gray-900">{record.employeeName}</td>
                                    <td className="p-4 font-medium">KES {record.grossPay.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-gray-500">{record.deductions.nssf.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-gray-500">{record.taxableIncome.toLocaleString()}</td>
                                    <td className="p-4 text-sm font-medium text-blue-700">{record.deductions.paye.toLocaleString()}</td>
                                    <td className="p-4 text-sm font-medium text-orange-700">{record.deductions.housingLevy.toLocaleString()}</td>
                                    <td className="p-4 text-sm font-medium text-purple-700">{record.deductions.shif.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-gray-900 bg-green-50/50">KES {record.netPay.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => setSelectedPayslip(record)}
                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50" title="View Payslip"
                                        >
                                            <FileText size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Calculator size={48} className="mb-4 text-gray-300" />
                        <p className="font-medium">No payroll data generated for this period.</p>
                        <p className="text-sm">Click "Calculate & Run" to process salaries.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- RECRUITMENT TAB --- */}
      {activeTab === 'RECRUIT' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <div className="bg-gray-100 p-8 rounded-full">
                <UserPlus size={48} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-700">No Open Requisitions</h3>
              <p className="max-w-md text-center text-sm">Create job postings for Technicians or Support Staff. You can manage candidates and schedule interviews here.</p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Create Job Posting</button>
          </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
               <h3 className="font-bold text-xl text-gray-800">{editingId ? 'Edit Employee Profile' : 'Onboard New Employee'}</h3>
               <button onClick={() => setShowAddModal(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" className="w-full border rounded-lg p-2.5" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} placeholder="e.g. John Doe" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Position / Title</label>
                    <input type="text" className="w-full border rounded-lg p-2.5" value={newEmployee.jobTitle} onChange={e => setNewEmployee({...newEmployee, jobTitle: e.target.value})} placeholder="e.g. Senior Mechanic" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select className="w-full border rounded-lg p-2.5" value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value as any})}>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="FRONT_OFFICE">Front Office</option>
                        <option value="SALES">Sales</option>
                        <option value="FINANCE">Finance</option>
                        <option value="OPERATIONS">Operations</option>
                        <option value="INVENTORY">Inventory</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Role (Access)</label>
                    <select className="w-full border rounded-lg p-2.5 bg-gray-50" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as any})}>
                        <option value="TECHNICIAN">Technician</option>
                        <option value="MANAGER">Manager</option>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="INSPECTOR">Inspector</option>
                        <option value="STORE_KEEPER">Store Keeper</option>
                        <option value="ACCOUNTANT">Accountant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <select className="w-full border rounded-lg p-2.5" value={newEmployee.employmentType} onChange={e => setNewEmployee({...newEmployee, employmentType: e.target.value as any})}>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="FREELANCE">Freelance</option>
                        <option value="INTERN">Intern</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                     <input type="text" className="w-full border rounded-lg p-2.5" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} placeholder="07XX XXX XXX" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                     <input type="text" className="w-full border rounded-lg p-2.5" value={newEmployee.idNumber} onChange={e => setNewEmployee({...newEmployee, idNumber: e.target.value})} />
                  </div>
               </div>

               <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                   <input type="text" className="w-full border rounded-lg p-2.5 uppercase" value={newEmployee.kraPin} onChange={e => setNewEmployee({...newEmployee, kraPin: e.target.value})} placeholder="A00..." />
               </div>

               {newEmployee.employmentType === 'FREELANCE' ? (
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                       <input type="number" className="w-full border rounded-lg p-2.5" placeholder="e.g. 40" value={newEmployee.commissionRate} onChange={e => setNewEmployee({...newEmployee, commissionRate: parseInt(e.target.value)})} />
                   </div>
               ) : (
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Gross Salary (KES)</label>
                       <input type="number" className="w-full border rounded-lg p-2.5" value={newEmployee.baseSalary} onChange={e => setNewEmployee({...newEmployee, baseSalary: parseInt(e.target.value)})} />
                   </div>
               )}

               {/* Statutory & Tax Settings */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Landmark size={14} /> Statutory & Tax Configuration
                    </h4>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-600">Deduct NSSF (Pension)</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={newEmployee.statutoryDetails?.deductNSSF}
                                    onChange={e => setNewEmployee({...newEmployee, statutoryDetails: { ...newEmployee.statutoryDetails!, deductNSSF: e.target.checked } })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-600">Deduct SHIF (Health)</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={newEmployee.statutoryDetails?.deductSHIF}
                                    onChange={e => setNewEmployee({...newEmployee, statutoryDetails: { ...newEmployee.statutoryDetails!, deductSHIF: e.target.checked } })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-600">Deduct Housing Levy</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={newEmployee.statutoryDetails?.deductHousingLevy}
                                    onChange={e => setNewEmployee({...newEmployee, statutoryDetails: { ...newEmployee.statutoryDetails!, deductHousingLevy: e.target.checked } })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-600">Deduct PAYE (Income Tax)</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={newEmployee.statutoryDetails?.deductPAYE}
                                    onChange={e => setNewEmployee({...newEmployee, statutoryDetails: { ...newEmployee.statutoryDetails!, deductPAYE: e.target.checked } })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                        </label>
                    </div>
               </div>

            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
               <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white">Cancel</button>
               <button onClick={handleSaveEmployee} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm">{editingId ? 'Update Employee' : 'Save Employee'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Retire/Terminate Confirmation Modal */}
      {showRetireModal && employeeToRetire && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                  <div className="p-6">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Confirm Retirement/Exit</h3>
                      <p className="text-gray-600 text-center mb-6">
                          Are you sure you want to mark <strong>{employeeToRetire.name}</strong> as retired? 
                          This will deactivate their access to the system but preserve their historical payroll data.
                      </p>
                      
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setShowRetireModal(false)}
                              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={handleRetireEmployee}
                              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium shadow-sm"
                          >
                              Confirm Exit
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Payslip View Modal */}
      {selectedPayslip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Action Bar */}
                  <div className="bg-slate-800 text-white p-4 flex justify-between items-center no-print">
                      <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Payslip Preview</h3>
                      <div className="flex gap-2">
                          <button className="bg-white/10 hover:bg-white/20 p-2 rounded text-sm flex items-center gap-1 transition-colors">
                              <Printer size={16} /> Print
                          </button>
                          <button className="bg-white/10 hover:bg-white/20 p-2 rounded text-sm flex items-center gap-1 transition-colors">
                              <Download size={16} /> Download PDF
                          </button>
                          <button onClick={() => setSelectedPayslip(null)} className="bg-white/10 hover:bg-red-500/80 p-2 rounded text-sm transition-colors ml-2">
                              <X size={16} />
                          </button>
                      </div>
                  </div>

                  {/* Payslip Content (A4 style ratio) */}
                  <div className="p-8 overflow-y-auto bg-gray-100 flex justify-center">
                      <div className="bg-white p-8 shadow-sm w-full max-w-lg border border-gray-200 text-sm">
                          {/* Header */}
                          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                              <div>
                                  <h1 className="text-2xl font-bold text-slate-900 uppercase">GariHub Motors</h1>
                                  <p className="text-gray-500">P.O. Box 1234, Nairobi, Kenya</p>
                                  <p className="text-gray-500">KRA PIN: P051122334Z</p>
                              </div>
                              <div className="text-right">
                                  <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest">Payslip</h2>
                                  <p className="font-bold text-slate-800 mt-1">{selectedPayslip.month}</p>
                              </div>
                          </div>

                          {/* Employee Details */}
                          <div className="grid grid-cols-2 gap-4 mb-6 text-gray-700 bg-slate-50 p-4 rounded-lg">
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Employee Name</p>
                                  <p className="font-bold">{selectedPayslip.employeeName}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Employee ID</p>
                                  <p className="font-bold">{selectedPayslip.employeeId}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">KRA PIN</p>
                                  <p className="font-bold">{employees.find(e => e.id === selectedPayslip.employeeId)?.kraPin || 'N/A'}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase">Designation</p>
                                  <p className="font-bold">{employees.find(e => e.id === selectedPayslip.employeeId)?.jobTitle || 'N/A'}</p>
                              </div>
                          </div>

                          {/* Earnings Section */}
                          <div className="mb-6">
                              <h4 className="font-bold text-slate-800 border-b border-gray-200 pb-1 mb-2 uppercase text-xs tracking-wider">Earnings</h4>
                              <div className="flex justify-between py-1">
                                  <span>Basic Salary</span>
                                  <span className="font-medium">KES {selectedPayslip.grossPay.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-1 text-gray-500">
                                  <span>Allowances</span>
                                  <span>KES 0.00</span>
                              </div>
                              <div className="flex justify-between py-2 border-t border-gray-200 mt-2 font-bold text-slate-800">
                                  <span>Gross Pay</span>
                                  <span>KES {selectedPayslip.grossPay.toLocaleString()}</span>
                              </div>
                          </div>

                          {/* Deductions Section */}
                          <div className="mb-6">
                              <h4 className="font-bold text-slate-800 border-b border-gray-200 pb-1 mb-2 uppercase text-xs tracking-wider">Statutory Deductions</h4>
                              <div className="space-y-1 text-gray-700">
                                  <div className="flex justify-between">
                                      <span>NSSF (Tier 1 & 2)</span>
                                      <span>KES {selectedPayslip.deductions.nssf.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span>SHIF (2.75%)</span>
                                      <span>KES {selectedPayslip.deductions.shif.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span>Housing Levy (1.5%)</span>
                                      <span>KES {selectedPayslip.deductions.housingLevy.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span>PAYE (Tax)</span>
                                      <span>KES {selectedPayslip.deductions.paye.toLocaleString()}</span>
                                  </div>
                              </div>
                              <div className="flex justify-between py-2 border-t border-gray-200 mt-2 font-bold text-red-600">
                                  <span>Total Deductions</span>
                                  <span>KES {(selectedPayslip.deductions.nssf + selectedPayslip.deductions.shif + selectedPayslip.deductions.paye + selectedPayslip.deductions.housingLevy).toLocaleString()}</span>
                              </div>
                          </div>

                          {/* Net Pay */}
                          <div className="bg-slate-900 text-white p-4 rounded-lg flex justify-between items-center shadow-lg">
                              <div>
                                  <p className="text-xs text-slate-400 uppercase font-bold">Net Payable Amount</p>
                                  <p className="text-xs text-slate-500">Transfer via Bank/M-Pesa</p>
                              </div>
                              <div className="text-2xl font-bold">
                                  KES {selectedPayslip.netPay.toLocaleString()}
                              </div>
                          </div>
                          
                          <p className="text-center text-xs text-gray-400 mt-8">Generated by GariHub HR System</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default HRManager;