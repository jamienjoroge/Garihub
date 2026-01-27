import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Wrench, AlertCircle, DollarSign, Package, ClipboardCheck, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight, Briefcase, FileText, Activity, AlertTriangle, ShieldAlert, WifiOff, RefreshCcw } from 'lucide-react';
import { DashboardStats, UserRole, SystemAlert } from '../types';
import { apiClient } from '../services/apiClient';

interface DashboardProps {
  stats: DashboardStats;
  role: UserRole;
}

// --- MOCK DATA ---
const dataRevenue = [
  { name: 'Week 1', revenue: 150000, profit: 45000 },
  { name: 'Week 2', revenue: 230000, profit: 80000 },
  { name: 'Week 3', revenue: 185000, profit: 55000 },
  { name: 'Week 4', revenue: 320000, profit: 110000 },
];

const dataRevenueMix = [
  { name: 'Labor', value: 450000, color: '#3b82f6' }, // Blue
  { name: 'Parts', value: 650000, color: '#f59e0b' }, // Amber
  { name: 'Sublet', value: 150000, color: '#10b981' }, // Emerald
];

const dataEfficiency = [
  { name: 'Mon', jobs: 12 },
  { name: 'Tue', jobs: 19 },
  { name: 'Wed', jobs: 15 },
  { name: 'Thu', jobs: 22 },
  { name: 'Fri', jobs: 18 },
  { name: 'Sat', jobs: 25 },
];

const techLeaderboard = [
    { name: 'David Omondi', hours: 42, efficiency: 110 },
    { name: 'Samuel K.', hours: 38, efficiency: 95 },
    { name: 'James W.', hours: 35, efficiency: 88 },
];

const urgentActions = [
    { id: 1, type: 'APPROVAL', message: 'Quote #QT-1092 needs approval (>50k)', time: '2h ago' },
    { id: 2, type: 'STOCK', message: '5W30 Oil reached critical level (5L)', time: '4h ago' },
    { id: 3, type: 'JOB', message: 'KCD 123A stuck in "Waiting Parts" > 3 days', time: '1d ago' },
];

// --- MOCK SYSTEM ALERTS ---
const systemAlerts: SystemAlert[] = [
    {
        id: 'SYS-001',
        type: 'PaymentFailed',
        severity: 'HIGH',
        message: 'M-PESA Transaction Timeout',
        details: 'Invoice #INV-2024-009. Gateway response: 408 Request Timeout.',
        timestamp: '10 mins ago',
        status: 'OPEN'
    },
    {
        id: 'SYS-002',
        type: 'AiServiceUnavailable',
        severity: 'MEDIUM',
        message: 'Gemini Diagnosis Offline',
        details: 'Job #JOB-2024-001. API Quota Exceeded or Network Error.',
        timestamp: '1 hour ago',
        status: 'RESOLVED'
    },
    {
        id: 'SYS-003',
        type: 'StockTransferDiscrepancyDetected',
        severity: 'CRITICAL',
        message: 'Inventory Mismatch during Transfer',
        details: 'Transfer #TR-882 (HQ -> Westlands). Sent: 10, Received: 8.',
        timestamp: 'Yesterday',
        status: 'OPEN'
    },
    {
        id: 'SYS-004',
        type: 'TaxCalculationMismatchDetected',
        severity: 'HIGH',
        message: 'VAT Ledger Variance',
        details: 'Invoice #INV-2024-012. Calculated: 16%, Posted: 14%. Check Tax Settings.',
        timestamp: '2 days ago',
        status: 'OPEN'
    }
];

const GarageDashboard: React.FC<DashboardProps> = ({ stats, role }) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>(systemAlerts);
  const [summary, setSummary] = useState<any[] | null>(null);
  const [jobsProfit, setJobsProfit] = useState<any[] | null>(null);
  useEffect(() => {
    const month = new Date().toISOString().slice(0,7);
    apiClient.get(`/api/manager/summary?month=${month}`).then(setSummary).catch(() => {});
    apiClient.get(`/api/manager/jobs/profitability`).then(setJobsProfit).catch(() => {});
  }, []);
  const totalRevenue = summary ? Number(summary.reduce((s, r: any) => s + Number(r.totalRevenue || 0), 0).toFixed(2)) : stats.revenueMonth;
  const totalCOGS = summary ? Number(summary.reduce((s, r: any) => s + Number(r.totalCOGS || 0), 0).toFixed(2)) : 0;
  const grossProfit = summary ? Number((totalRevenue - totalCOGS).toFixed(2)) : (stats.revenueMonth * 0.22);
  const outstandingReceivables = summary ? Number(summary.reduce((s, r: any) => s + Number(r.outstandingReceivables || 0), 0).toFixed(2)) : 145000;

  const dismissAlert = (id: string) => {
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
  };

  const getAlertIcon = (type: string) => {
      switch(type) {
          case 'PaymentFailed': return <DollarSign size={16} className="text-red-600"/>;
          case 'AiServiceUnavailable': return <WifiOff size={16} className="text-orange-600"/>;
          case 'StockTransferDiscrepancyDetected': return <Package size={16} className="text-purple-600"/>;
          case 'TaxCalculationMismatchDetected': return <ShieldAlert size={16} className="text-red-600"/>;
          default: return <AlertCircle size={16}/>;
      }
  };

  // --- MANAGER DASHBOARD RENDER ---
  if (role === 'MANAGER') {
      return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Executive Overview</h2>
                    <p className="text-gray-500">Financial & Operational Command Center</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <FileText size={16}/> Download Report
                    </button>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2 shadow-sm">
                        <Activity size={16}/> Live Monitor
                    </button>
                </div>
            </div>

            {/* Financial Command Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} className="text-blue-600"/>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue (MTD)</p>
                    <h3 className="text-2xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600 font-medium">
                        <ArrowUpRight size={16}/> 12.5% vs last month
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Briefcase size={64} className="text-emerald-600"/>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Net Profit (Est.)</p>
                    <h3 className="text-2xl font-bold text-gray-900">KES {grossProfit.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600 font-medium">
                        <ArrowUpRight size={16}/> 22% Margin
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={64} className="text-orange-600"/>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Outstanding Invoices</p>
                    <h3 className="text-2xl font-bold text-gray-900">KES {outstandingReceivables.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-orange-600 font-medium">
                        <ArrowDownRight size={16}/> 3 Overdue &gt; 30 Days
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wrench size={64} className="text-purple-600"/>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Labor Utilization</p>
                    <h3 className="text-2xl font-bold text-gray-900">84%</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-purple-600 font-medium">
                        <Activity size={16}/> 4 Active Bays
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Chart Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Revenue & Profit Trend */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Financial Performance</h3>
                            <select className="bg-gray-50 border border-gray-200 rounded-lg text-xs py-1 px-2 text-gray-600 outline-none">
                                <option>Last 30 Days</option>
                                <option>This Quarter</option>
                            </select>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataRevenue}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <RechartsTooltip 
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProf)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Operational Insights Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Revenue Mix */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Revenue Mix</h3>
                            <div className="h-48 flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={dataRevenueMix} 
                                            innerRadius={60} 
                                            outerRadius={80} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                        >
                                            {dataRevenueMix.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 text-sm">
                                    {dataRevenueMix.map(item => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                                            <span className="text-gray-600">{item.name}</span>
                                            <span className="font-bold text-gray-900">{(item.value / 1250000 * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tech Leaderboard */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Technicians</h3>
                            <div className="space-y-4">
                                {techLeaderboard.map((tech, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{tech.name}</p>
                                                <p className="text-xs text-gray-500">{tech.hours} Billed Hours</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${tech.efficiency > 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {tech.efficiency}% Eff.
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Action Center */}
                <div className="space-y-6">
                    {/* System Health & Audit Log (New Section) */}
                    <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm ring-1 ring-red-50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={20} className="text-red-600" />
                                <h3 className="text-lg font-bold text-gray-800">System Alerts</h3>
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{alerts.filter(a => a.status === 'OPEN').length} Active</span>
                        </div>
                        <div className="space-y-3">
                            {alerts.length > 0 ? (
                                alerts.map(alert => (
                                    <div key={alert.id} className={`p-3 rounded-lg border flex items-start gap-3 ${alert.status === 'RESOLVED' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-red-100 shadow-sm'}`}>
                                        <div className={`p-1.5 rounded-md shrink-0 ${alert.status === 'RESOLVED' ? 'bg-gray-200' : 'bg-red-50'}`}>
                                            {getAlertIcon(alert.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-bold text-gray-800">{alert.type.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                <span className="text-[10px] text-gray-400">{alert.timestamp}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 italic">{alert.details}</p>
                                            {alert.status === 'OPEN' && (
                                                <button onClick={() => dismissAlert(alert.id)} className="mt-2 text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                                                    <CheckCircle2 size={10}/> Mark Resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">System Healthy. No anomalies detected.</p>
                            )}
                        </div>
                    </div>

                    {/* Urgent Actions */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                <AlertTriangle size={20}/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Tasks Required</h3>
                        </div>
                        <div className="space-y-3">
                            {urgentActions.map(action => (
                                <div key={action.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            action.type === 'APPROVAL' ? 'bg-purple-100 text-purple-700' :
                                            action.type === 'STOCK' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{action.type}</span>
                                        <span className="text-[10px] text-gray-400">{action.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium group-hover:text-blue-800">{action.message}</p>
                                    <button className="mt-2 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        Review <ArrowUpRight size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tax Compliance */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white/10 p-2 rounded-lg">
                                <FileText size={20}/>
                            </div>
                            <span className="bg-green-500/20 text-green-300 text-xs font-bold px-2 py-1 rounded border border-green-500/30">Compliant</span>
                        </div>
                        <h4 className="text-lg font-bold mb-1">e-TIMS Status</h4>
                        <p className="text-slate-400 text-sm mb-4">Last sync: Today, 09:41 AM</p>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex justify-between">
                                <span>VAT Liability</span>
                                <span className="font-mono text-white">KES 45,200</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Next Return</span>
                                <span className="font-mono text-white">Oct 20</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- STANDARD DASHBOARD FOR OTHER ROLES (Technician, Receptionist, Inspector) ---
  const getVisibleCards = () => {
    const commonCards = [];
    
    // Active Jobs - Tech, Receptionist
    if (['TECHNICIAN', 'RECEPTIONIST'].includes(role)) {
      commonCards.push(
        <div key="jobs" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Wrench size={24} />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">{role === 'TECHNICIAN' ? 'My Active Jobs' : 'Cars in Shop'}</p>
          <h3 className="text-2xl font-bold text-gray-900">{role === 'TECHNICIAN' ? 3 : stats.carsInShop}</h3>
        </div>
      );
    }

    // Inspection Stats - Inspector Only
    if (role === 'INSPECTOR') {
         commonCards.push(
            <div key="inspections_pending" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Clock size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Pending Inspections</p>
              <h3 className="text-2xl font-bold text-gray-900">4</h3>
            </div>
         );
         commonCards.push(
            <div key="inspections_done" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <ClipboardCheck size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Completed Today</p>
              <h3 className="text-2xl font-bold text-gray-900">8</h3>
            </div>
         );
    }

    // Inventory Alerts - Tech
    if (['TECHNICIAN'].includes(role)) {
      commonCards.push(
        <div key="inventory" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Package size={24} />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Low Stock</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">Inventory Alerts</p>
          <h3 className="text-2xl font-bold text-gray-900">3 Items</h3>
        </div>
      );
    }

    // Customer Satisfaction - Receptionist
    if (['RECEPTIONIST'].includes(role)) {
      commonCards.push(
        <div key="satisfaction" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <Users size={24} />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Customer Satisfaction</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction}/5.0</h3>
        </div>
      );
    }
    
    // Tech Efficiency - Technician Only
    if (role === 'TECHNICIAN') {
        commonCards.push(
            <div key="tech_efficiency" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CheckCircle2 size={24} />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Top 10%</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Weekly Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">92%</h3>
            </div>
          );
    }

    // Pending Invoices - Receptionist Only
    if (role === 'RECEPTIONIST') {
        commonCards.push(
            <div key="pending_invoices" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <AlertCircle size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">Pending Payments</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</h3>
            </div>
          );
    }

    return commonCards;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Overview</h2>
          <p className="text-gray-500 capitalize">Welcome back, {role.toLowerCase()}.</p>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
           <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-sm font-medium text-gray-600">System Operational</span>
        </div>
      </header>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getVisibleCards()}
      </div>

      {/* Charts Section - Conditional Rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Efficiency Chart - Technician */}
        {role === 'TECHNICIAN' && (
            <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Wrench size={20} className="text-purple-500"/> My Jobs Completed
            </h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line type="monotone" dataKey="jobs" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}

        {/* Receptionist View - Recent Activity */}
        {role === 'RECEPTIONIST' && (
            <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Appointments</h3>
                <div className="space-y-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg font-bold text-sm">09:00 AM</div>
                                <div>
                                    <p className="font-bold text-gray-900">Preventive Maintenance</p>
                                    <p className="text-sm text-gray-500">Toyota Hilux • KCD 123X</p>
                                </div>
                            </div>
                            <span className="text-xs bg-white border px-2 py-1 rounded text-gray-600">John Doe</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GarageDashboard;