import React, { useState } from 'react';
import { LayoutDashboard, Wrench, Package, Users, Settings, Car, LogOut, Wallet, ClipboardCheck, Database, Briefcase, ShoppingCart, PieChart, ChevronLeft, Menu, MapPin, Hammer, Monitor } from 'lucide-react';
import { ViewState, UserRole, Branch } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentBranch: Branch;
  branches: Branch[];
  setBranch: (branch: Branch) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, role, setRole, currentBranch, branches, setBranch }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, roles: ['MANAGER', 'TECHNICIAN', 'RECEPTIONIST', 'INSPECTOR'] },
    { id: 'PROJECTS', label: 'Restoration Projects', icon: Hammer, roles: ['MANAGER', 'TECHNICIAN'] },
    { id: 'JOBS', label: 'Jobs & Appointments', icon: Wrench, roles: ['MANAGER', 'TECHNICIAN', 'RECEPTIONIST'] },
    { id: 'CUSTOMERS', label: 'Customers & CRM', icon: Users, roles: ['MANAGER', 'RECEPTIONIST'] },
    { id: 'VEHICLES', label: 'Vehicle Registry', icon: Database, roles: ['MANAGER', 'RECEPTIONIST', 'TECHNICIAN'] },
    { id: 'INSPECTIONS', label: 'Inspections', icon: ClipboardCheck, roles: ['MANAGER', 'INSPECTOR'] },
    { id: 'HR', label: 'HR & Staff', icon: Briefcase, roles: ['MANAGER'] },
    { id: 'SALES', label: 'Sales & Invoicing', icon: ShoppingCart, roles: ['MANAGER', 'RECEPTIONIST'] },
    { id: 'FINANCE', label: 'Accounting (ERP)', icon: PieChart, roles: ['MANAGER'] },
    { id: 'INVENTORY', label: 'Inventory & Stock', icon: Package, roles: ['MANAGER', 'TECHNICIAN'] },
    { id: 'ASSETS', label: 'Fixed Assets', icon: Monitor, roles: ['MANAGER'] },
    { id: 'SETTINGS', label: 'Configuration', icon: Settings, roles: ['MANAGER'] },
    { id: 'CUSTOMER_PORTAL', label: 'My Vehicle', icon: Car, roles: ['CUSTOMER'] },
    { id: 'CUSTOMER_VEHICLES_LIST', label: 'My Vehicles', icon: Car, roles: ['CUSTOMER'] },
    { id: 'CUSTOMER_PREFERENCES', label: 'Preferences', icon: Settings, roles: ['CUSTOMER'] },
    { id: 'CUSTOMER_NOTIFICATIONS', label: 'Notifications', icon: ClipboardCheck, roles: ['CUSTOMER'] },
  ];

  return (
    <div 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col h-screen transition-all duration-300 shadow-xl z-50 flex-shrink-0`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-slate-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-20`}>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent truncate">
              GariHub
            </h1>
            <p className="text-xs text-slate-400 mt-1 truncate">ERP v2.0</p>
          </div>
        )}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Branch Switcher */}
      {!isCollapsed && role !== 'CUSTOMER' && (
          <div className="px-4 pt-4 pb-2">
              <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block tracking-wider">Current Branch</label>
              <div className="relative">
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <select 
                    value={currentBranch.id}
                    onChange={(e) => setBranch(branches.find(b => b.id === e.target.value) || branches[0])}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-2 py-2 border border-slate-700 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
                  >
                      {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
              </div>
          </div>
      )}

      {/* Nav Items - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {menuItems.filter(item => item.roles.includes(role)).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'CUSTOMER_VEHICLES_LIST') { window.location.assign('/customer/vehicles'); return; }
                if (item.id === 'CUSTOMER_PREFERENCES') { window.location.assign('/customer/preferences'); return; }
                if (item.id === 'CUSTOMER_NOTIFICATIONS') { window.location.assign('/customer/notifications'); return; }
                setCurrentView(item.id as ViewState);
              }}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={`shrink-0 ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
              {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / Role Simulator */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        {!isCollapsed ? (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
              <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block">Simulate Role</label>
              <select 
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setRole(newRole);
                  if (newRole === 'CUSTOMER') setCurrentView('CUSTOMER_PORTAL');
                  else setCurrentView('DASHBOARD');
                }}
                className="w-full bg-slate-800 text-slate-300 text-sm rounded p-2 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-750"
              >
                <option value="MANAGER">Manager</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="INSPECTOR">Inspector</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>
        ) : (
             <div className="mb-4 flex justify-center">
                 <div 
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 cursor-help" 
                    title={`Current Role: ${role}`}
                 >
                     {role.charAt(0)}
                 </div>
             </div>
        )}
        
        <button
          onClick={() => { try { localStorage.removeItem('authToken'); } catch {} window.location.assign('/'); }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm w-full px-2 py-2 rounded-lg hover:bg-slate-800`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;