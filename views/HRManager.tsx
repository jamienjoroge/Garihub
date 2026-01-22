import React, { useState, useMemo } from 'react';
import { Users, UserPlus, DollarSign, FileText, Briefcase, Plus, Search, Filter, Phone, Calendar, Calculator, CheckCircle2, X, Tag, Settings, Printer, Download, Landmark, LayoutGrid, List, Edit, Trash2, UserMinus, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Employee, EmploymentType, EmployeeRole, PayrollRecord, Department, PayrollConfig, Branch } from '../types';

interface HRManagerProps {
    currentBranch: Branch;
    employees: Employee[];
    setEmployees: (employees: Employee[]) => void;
    branches?: Branch[];
}

const HRManager: React.FC<HRManagerProps> = ({ currentBranch, employees, setEmployees, branches = [] }) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'PAYROLL' | 'RECRUIT' | 'REPORTS'>('STAFF');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    role: 'TECHNICIAN',
    department: 'WORKSHOP',
    employmentType: 'FULL_TIME',
    baseSalary: 0,
    status: 'ACTIVE',
    branchIds: [currentBranch.id],
    statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
  });

  const filteredEmployees = employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            emp.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesBranch = emp.branchIds.includes(currentBranch.id);
      
      return matchesSearch && matchesDept && matchesBranch;
  });

  const handleSaveEmployee = () => {
      if (!newEmployee.name || !newEmployee.idNumber) return;
      
      const employee: Employee = {
          id: editingId || `EMP-${Date.now()}`,
          name: newEmployee.name!,
          role: newEmployee.role as EmployeeRole,
          department: newEmployee.department as Department,
          employmentType: newEmployee.employmentType as EmploymentType,
          phone: newEmployee.phone || '',
          idNumber: newEmployee.idNumber || '',
          kraPin: newEmployee.kraPin,
          baseSalary: Number(newEmployee.baseSalary),
          status: newEmployee.status as any || 'ACTIVE',
          branchIds: newEmployee.branchIds || [currentBranch.id],
          skills: [],
          jobTitle: newEmployee.jobTitle || newEmployee.role || 'Staff',
          joinedDate: newEmployee.joinedDate || new Date().toISOString().split('T')[0],
          statutoryDetails: newEmployee.statutoryDetails || { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
      };

      if (editingId) {
          setEmployees(employees.map(e => e.id === editingId ? employee : e));
      } else {
          setEmployees([...employees, employee]);
      }
      setShowAddModal(false);
      setEditingId(null);
      setNewEmployee({ 
          name: '', role: 'TECHNICIAN', department: 'WORKSHOP', employmentType: 'FULL_TIME', 
          baseSalary: 0, status: 'ACTIVE', branchIds: [currentBranch.id],
          statutoryDetails: { deductNSSF: true, deductSHIF: true, deductHousingLevy: true, deductPAYE: true }
      });
  };

  const calculatePayroll = (emp: Employee): PayrollRecord => {
      const gross = emp.baseSalary;
      const nssf = emp.statutoryDetails.deductNSSF ? 1080 : 0; // Simplified Tier 2
      const shif = emp.statutoryDetails.deductSHIF ? gross * 0.0275 : 0;
      const housing = emp.statutoryDetails.deductHousingLevy ? gross * 0.015 : 0;
      // Simplified PAYE (Tax bands would be complex, using flat estimation for demo)
      const taxable = gross - nssf;
      const paye = emp.statutoryDetails.deductPAYE ? (taxable > 24000 ? (taxable * 0.3) - 2400 : 0) : 0; 
      
      const totalDeductions = nssf + shif + housing + paye;
      
      return {
          id: `PR-${Date.now()}-${emp.id}`,
          employeeId: emp.id,
          employeeName: emp.name,
          month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          grossPay: gross,
          deductions: {
              nssf,
              shif,
              housingLevy: housing,
              paye,
              advances: 0,
              other: 0
          },
          taxableIncome: taxable,
          netPay: gross - totalDeductions,
          status: 'PENDING'
      };
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">HR & Payroll</h2>
          <p className="text-gray-500">{currentBranch.name} • Staff Management</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
             <button onClick={() => setActiveTab('STAFF')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'STAFF' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Users size={16} /> Staff
            </button>
            <button onClick={() => setActiveTab('PAYROLL')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PAYROLL' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <DollarSign size={16} /> Payroll
            </button>
        </div>
      </header>

      {/* STAFF TAB */}
      {activeTab === 'STAFF' && (
          <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <div className="flex gap-4">
                       <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search employees..." 
                                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                       </div>
                       <select 
                            className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value as any)}
                       >
                           <option value="ALL">All Departments</option>
                           <option value="WORKSHOP">Workshop</option>
                           <option value="FRONT_OFFICE">Front Office</option>
                           <option value="FINANCE">Finance</option>
                           <option value="OPERATIONS">Operations</option>
                       </select>
                   </div>
                   <button 
                        onClick={() => { setEditingId(null); setShowAddModal(true); }}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700"
                   >
                        <UserPlus size={16} /> Add Employee
                   </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredEmployees.map(emp => (
                          <div key={emp.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white relative group">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                          {emp.name.substring(0,2).toUpperCase()}
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-gray-900">{emp.name}</h4>
                                          <p className="text-xs text-gray-500">{emp.jobTitle}</p>
                                      </div>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {emp.status}
                                  </span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600 mb-4">
                                  <div className="flex justify-between">
                                      <span className="text-gray-400">Department</span>
                                      <span className="font-medium">{emp.department}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-gray-400">Phone</span>
                                      <span className="font-medium">{emp.phone}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-gray-400">Type</span>
                                      <span className="font-medium">{emp.employmentType.replace('_', ' ')}</span>
                                  </div>
                              </div>
                              <div className="flex gap-2 pt-3 border-t border-gray-50">
                                  <button onClick={() => { setEditingId(emp.id); setNewEmployee(emp); setShowAddModal(true); }} className="flex-1 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded hover:bg-blue-100">Edit Profile</button>
                                  <button className="flex-1 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 rounded hover:bg-gray-100">View Payslips</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* PAYROLL TAB */}
      {activeTab === 'PAYROLL' && (
          <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Payroll Simulation ({new Date().toLocaleString('default', { month: 'long' })})</h3>
                  <button className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                      <FileSpreadsheet size={16}/> Process Payroll
                  </button>
              </div>
              <div className="overflow-auto flex-1">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                          <tr>
                              <th className="p-3">Employee</th>
                              <th className="p-3 text-right">Gross Pay</th>
                              <th className="p-3 text-right">NSSF</th>
                              <th className="p-3 text-right">SHIF</th>
                              <th className="p-3 text-right">Housing</th>
                              <th className="p-3 text-right">PAYE</th>
                              <th className="p-3 text-right">Net Pay</th>
                              <th className="p-3 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredEmployees.map(emp => {
                              const pr = calculatePayroll(emp);
                              return (
                                  <tr key={emp.id} className="hover:bg-gray-50">
                                      <td className="p-3 font-medium text-gray-900">{pr.employeeName}</td>
                                      <td className="p-3 text-right">{pr.grossPay.toLocaleString()}</td>
                                      <td className="p-3 text-right text-red-600">({pr.deductions.nssf.toLocaleString()})</td>
                                      <td className="p-3 text-right text-red-600">({pr.deductions.shif.toLocaleString()})</td>
                                      <td className="p-3 text-right text-red-600">({pr.deductions.housingLevy.toLocaleString()})</td>
                                      <td className="p-3 text-right text-red-600">({pr.deductions.paye.toLocaleString()})</td>
                                      <td className="p-3 text-right font-bold text-green-700">{pr.netPay.toLocaleString()}</td>
                                      <td className="p-3 text-center">
                                          <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded">PENDING</span>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-xl text-gray-800">{editingId ? 'Edit Employee' : 'New Employee'}</h3>
                      <button onClick={() => setShowAddModal(false)}><X size={24} className="text-gray-400" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                              <input className="w-full border rounded-lg p-2.5" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                              <input className="w-full border rounded-lg p-2.5" value={newEmployee.idNumber} onChange={e => setNewEmployee({...newEmployee, idNumber: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                              <select className="w-full border rounded-lg p-2.5" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as EmployeeRole})}>
                                  <option value="TECHNICIAN">Technician</option>
                                  <option value="MANAGER">Manager</option>
                                  <option value="RECEPTIONIST">Receptionist</option>
                                  <option value="INSPECTOR">Inspector</option>
                                  <option value="ACCOUNTANT">Accountant</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                              <select className="w-full border rounded-lg p-2.5" value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value as Department})}>
                                  <option value="WORKSHOP">Workshop</option>
                                  <option value="FRONT_OFFICE">Front Office</option>
                                  <option value="FINANCE">Finance</option>
                                  <option value="OPERATIONS">Operations</option>
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                              <select className="w-full border rounded-lg p-2.5" value={newEmployee.employmentType} onChange={e => setNewEmployee({...newEmployee, employmentType: e.target.value as EmploymentType})}>
                                  <option value="FULL_TIME">Full Time</option>
                                  <option value="CONTRACT">Contract</option>
                                  <option value="FREELANCE">Freelance</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (KES)</label>
                              <input type="number" className="w-full border rounded-lg p-2.5" value={newEmployee.baseSalary} onChange={e => setNewEmployee({...newEmployee, baseSalary: parseInt(e.target.value)})} />
                          </div>
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input className="w-full border rounded-lg p-2.5" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                          <input className="w-full border rounded-lg p-2.5 uppercase" value={newEmployee.kraPin} onChange={e => setNewEmployee({...newEmployee, kraPin: e.target.value})} />
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-gray-700 text-sm mb-2">Statutory Deductions</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                              <label className="flex items-center gap-2"><input type="checkbox" checked={newEmployee.statutoryDetails?.deductNSSF} onChange={e => setNewEmployee({...newEmployee, statutoryDetails: {...newEmployee.statutoryDetails!, deductNSSF: e.target.checked}})} /> Deduct NSSF</label>
                              <label className="flex items-center gap-2"><input type="checkbox" checked={newEmployee.statutoryDetails?.deductSHIF} onChange={e => setNewEmployee({...newEmployee, statutoryDetails: {...newEmployee.statutoryDetails!, deductSHIF: e.target.checked}})} /> Deduct SHIF</label>
                              <label className="flex items-center gap-2"><input type="checkbox" checked={newEmployee.statutoryDetails?.deductHousingLevy} onChange={e => setNewEmployee({...newEmployee, statutoryDetails: {...newEmployee.statutoryDetails!, deductHousingLevy: e.target.checked}})} /> Deduct Housing Levy</label>
                              <label className="flex items-center gap-2"><input type="checkbox" checked={newEmployee.statutoryDetails?.deductPAYE} onChange={e => setNewEmployee({...newEmployee, statutoryDetails: {...newEmployee.statutoryDetails!, deductPAYE: e.target.checked}})} /> Deduct PAYE</label>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-white">Cancel</button>
                      <button onClick={handleSaveEmployee} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Employee</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default HRManager;