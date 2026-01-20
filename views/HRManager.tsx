import React, { useState, useMemo } from 'react';
import { Users, UserPlus, DollarSign, FileText, Briefcase, Plus, Search, Filter, Phone, Calendar, Calculator, CheckCircle2, X, Tag, Settings, Printer, Download, Landmark, LayoutGrid, List, Edit, Trash2, UserMinus, AlertTriangle } from 'lucide-react';
import { Employee, EmploymentType, EmployeeRole, PayrollRecord, Department, PayrollConfig, Branch } from '../types';

interface HRManagerProps {
    currentBranch: Branch;
    employees: Employee[];
    setEmployees: (employees: Employee[]) => void;
    branches?: Branch[]; // Optional for backward compatibility but needed for multi-select
}

const HRManager: React.FC<HRManagerProps> = ({ currentBranch, employees, setEmployees, branches = [] }) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'PAYROLL' | 'RECRUIT'>('STAFF');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Retirement/Termination State
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [employeeToRetire, setEmployeeToRetire] = useState<Employee | null>(null);

  const [payrollMonth, setPayrollMonth] = useState('October 2023');
  const [processedPayroll, setProcessedPayroll] = useState<PayrollRecord[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // New Employee State includes Statutory Details
  const [newEmployee, setNewEmployee] = useState<Partial<Employee> & { statutoryDetails: { deductNSSF: boolean, deductSHIF: boolean, deductHousingLevy: boolean, deductPAYE: boolean } }>({
    name: '', role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: '', branchIds: [],
    employmentType: 'FULL_TIME', baseSalary: 0, commissionRate: 0, status: 'ACTIVE', skills: [],
    statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
  });

  // --- Filter Employees by Current Branch ---
  // Updated: Checks if currentBranch.id is in employee's branchIds array
  const branchEmployees = employees.filter(e => e.branchIds.includes(currentBranch.id));

  // --- Kenya Payroll Calculator 2024/2025 ---
  const calculateKenyanPayroll = (emp: Employee): PayrollRecord => {
    let gross = emp.baseSalary;
    
    if (emp.employmentType === 'FREELANCE') {
        gross = 45000; // Mock commission
    }

    const { statutoryDetails } = emp;

    let nssf = 0;
    if (statutoryDetails.deductNSSF) {
        const pensionable = Math.min(gross, 36000); 
        nssf = pensionable * 0.06; 
    }

    const taxableIncome = gross - nssf;

    let paye = 0;
    if (statutoryDetails.deductPAYE) {
        let tax = 0;
        let remaining = taxableIncome;

        if (remaining > 0) { const taxed = Math.min(remaining, 24000); tax += taxed * 0.1; remaining -= taxed; }
        if (remaining > 0) { const taxed = Math.min(remaining, 8333); tax += taxed * 0.25; remaining -= taxed; }
        if (remaining > 0) { const taxed = Math.min(remaining, 467667); tax += taxed * 0.30; remaining -= taxed; }
        if (remaining > 0) { const taxed = Math.min(remaining, 300000); tax += taxed * 0.325; remaining -= taxed; }
        if (remaining > 0) { tax += remaining * 0.35; }

        paye = Math.max(0, tax - 2400); 
    }

    let shif = 0;
    if (statutoryDetails.deductSHIF) {
        shif = gross * 0.0275;
        if (shif < 300 && gross > 0) shif = 300; 
    }

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
      const activeStaff = branchEmployees.filter(e => e.status === 'ACTIVE' || e.status === 'ON_LEAVE');
      const records = activeStaff.map(emp => calculateKenyanPayroll(emp));
      setProcessedPayroll(records);
  };

  const openAddModal = () => {
      setEditingId(null);
      setNewEmployee({
        name: '', role: 'TECHNICIAN', department: 'WORKSHOP', jobTitle: '', branchIds: [currentBranch.id],
        employmentType: 'FULL_TIME', baseSalary: 0, commissionRate: 0, status: 'ACTIVE', skills: [],
        statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
      });
      setShowAddModal(true);
  };

  const openEditModal = (emp: Employee) => {
      setEditingId(emp.id);
      setNewEmployee({ ...emp });
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

  const handleBranchToggle = (branchId: string) => {
      const currentIds = newEmployee.branchIds || [];
      if (currentIds.includes(branchId)) {
          setNewEmployee({ ...newEmployee, branchIds: currentIds.filter(id => id !== branchId) });
      } else {
          setNewEmployee({ ...newEmployee, branchIds: [...currentIds, branchId] });
      }
  };

  const handleSaveEmployee = () => {
    if (!newEmployee.name || !newEmployee.role || !newEmployee.jobTitle) return;

    // Ensure at least one branch
    const finalBranchIds = (newEmployee.branchIds && newEmployee.branchIds.length > 0) ? newEmployee.branchIds : [currentBranch.id];

    if (editingId) {
        // Edit Mode
        const updatedEmployees = employees.map(emp => {
            if (emp.id === editingId) {
                return {
                    ...emp,
                    ...newEmployee,
                    branchIds: finalBranchIds,
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
            branchIds: finalBranchIds,
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

  const filteredEmployees = branchEmployees.filter(emp => {
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
          <p className="text-gray-500">Managing staff for: <span className="font-bold text-slate-800">{currentBranch.name}</span></p>
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
                    {/* ... Filters ... */}
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
                                emp.status === 'RETIRED' || emp.status === 'TERMINATED' ? 'border-gray-200 opacity-75 bg-gray-50' : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                            }`}>
                                {/* ... Card Content ... */}
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm bg-slate-100 text-slate-600">
                                            {emp.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{emp.name}</h4>
                                            <p className="text-sm font-medium text-blue-600">{emp.jobTitle}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => openEditModal(emp)} className="text-gray-400 hover:text-blue-600 p-1"><Edit size={16} /></button>
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Assigned Branches:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {emp.branchIds.map(bid => {
                                            const bName = branches.find(b => b.id === bid)?.name || bid;
                                            return <span key={bid} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{bName}</span>
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600 mb-4 relative z-10 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {emp.phone}</div>
                                    <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400"/> {emp.employmentType}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // ... List View Implementation ...
                    <div>List View Placeholder</div>
                )}
            </div>
        </div>
      )}

      {/* ... PAYROLL TAB ... */}

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-xl text-gray-800">{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
                    <button onClick={() => setShowAddModal(false)}><X size={24} className="text-gray-400" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Basic Info Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" className="w-full border rounded-lg p-2.5" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                            <input type="text" className="w-full border rounded-lg p-2.5" value={newEmployee.jobTitle} onChange={(e) => setNewEmployee({...newEmployee, jobTitle: e.target.value})}/>
                        </div>
                    </div>

                    {/* Branch Assignment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Branch(es)</label>
                        <div className="flex flex-wrap gap-2">
                            {branches.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => handleBranchToggle(b.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 ${
                                        newEmployee.branchIds?.includes(b.id) 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                        : 'bg-white border-gray-200 text-gray-600'
                                    }`}
                                >
                                    {newEmployee.branchIds?.includes(b.id) && <CheckCircle2 size={14}/>}
                                    {b.name}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Multi-branch assignment allows access to specific branch data.</p>
                    </div>

                    {/* ... Other Inputs (Role, Department, Contact) ... */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select className="w-full border rounded-lg p-2.5 bg-white" value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value as EmployeeRole})}>
                                <option value="TECHNICIAN">Technician</option>
                                <option value="RECEPTIONIST">Receptionist</option>
                                <option value="MANAGER">Manager</option>
                                {/* ... */}
                            </select>
                        </div>
                        {/* ... */}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-white">Cancel</button>
                    <button onClick={handleSaveEmployee} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Employee</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HRManager;