import React, { useState } from 'react';
import { Monitor, TrendingDown, Wrench, Plus, Archive, AlertTriangle, Calendar, DollarSign, MapPin, Calculator, X, Save, Box, ArrowRight, ClipboardList, CheckCircle2, History, FileText, AlertCircle } from 'lucide-react';
import { FixedAsset, ServiceBay, Branch, AssetMaintenance } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface AssetManagerProps {
    assets: FixedAsset[];
    setAssets: (assets: FixedAsset[]) => void;
    serviceBays: ServiceBay[];
    currentBranch: Branch;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, setAssets, serviceBays, currentBranch }) => {
    const [activeTab, setActiveTab] = useState<'REGISTRY' | 'DEPRECIATION' | 'MAINTENANCE'>('REGISTRY');
    const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Maintenance Form State ---
    const [maintenanceForm, setMaintenanceForm] = useState<Partial<AssetMaintenance>>({
        description: '', cost: 0, performedBy: '', type: 'REPAIR', date: new Date().toISOString().split('T')[0], nextServiceDate: '', invoiceRef: ''
    });

    // --- Asset Form State ---
    const [newAsset, setNewAsset] = useState<Partial<FixedAsset>>({
        name: '',
        category: 'MACHINERY',
        purchaseCost: 0,
        usefulLifeYears: 5,
        salvageValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
    });

    // --- Helpers ---
    const calculateBookValue = (asset: FixedAsset) => {
        const purchaseDate = new Date(asset.purchaseDate);
        const today = new Date();
        const yearsElapsed = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        const yearlyDepreciation = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears;
        const totalDepreciation = yearlyDepreciation * yearsElapsed;
        
        const currentVal = asset.purchaseCost - totalDepreciation;
        return Math.max(currentVal, asset.salvageValue); // Value cannot dip below salvage
    };

    const getDepreciationSchedule = (asset: FixedAsset) => {
        const schedule = [];
        const yearlyDepr = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears;
        let currentVal = asset.purchaseCost;
        const purchaseYear = new Date(asset.purchaseDate).getFullYear();
        const currentYear = new Date().getFullYear();

        for (let i = 0; i <= asset.usefulLifeYears; i++) {
            const year = purchaseYear + i;
            const isCurrent = year === currentYear;
            schedule.push({
                year: year,
                value: Math.max(currentVal, asset.salvageValue),
                depreciation: i === 0 ? 0 : yearlyDepr,
                isCurrent: isCurrent
            });
            currentVal -= yearlyDepr;
        }
        return schedule;
    };

    const getAssetHealth = (asset: FixedAsset) => {
        const totalMaintCost = asset.maintenanceLog.reduce((sum, log) => sum + log.cost, 0);
        const ratio = totalMaintCost / asset.purchaseCost;
        if (ratio > 0.5) return { status: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-50' };
        if (ratio > 0.3) return { status: 'WARNING', color: 'text-orange-600', bg: 'bg-orange-50' };
        return { status: 'GOOD', color: 'text-green-600', bg: 'bg-green-50' };
    };

    // --- Handlers ---
    const handleAddAsset = () => {
        if (newAsset.name && newAsset.purchaseCost) {
            const asset: FixedAsset = {
                id: `AST-${Date.now()}`,
                branchId: currentBranch.id,
                serialNumber: newAsset.serialNumber || 'N/A',
                name: newAsset.name!,
                category: newAsset.category as any,
                purchaseDate: newAsset.purchaseDate!,
                purchaseCost: Number(newAsset.purchaseCost),
                salvageValue: Number(newAsset.salvageValue),
                usefulLifeYears: Number(newAsset.usefulLifeYears),
                status: 'ACTIVE',
                location: newAsset.location,
                maintenanceLog: []
            };
            setAssets([...assets, asset]);
            setIsAddModalOpen(false);
            setNewAsset({ name: '', category: 'MACHINERY', purchaseCost: 0, usefulLifeYears: 5, salvageValue: 0, purchaseDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' });
        }
    };

    const handleLogMaintenance = () => {
        if (!selectedAsset || !maintenanceForm.description || !maintenanceForm.cost) return;
        const log: AssetMaintenance = {
            id: `LOG-${Date.now()}`,
            date: maintenanceForm.date!,
            type: maintenanceForm.type as any,
            description: maintenanceForm.description,
            cost: Number(maintenanceForm.cost),
            performedBy: maintenanceForm.performedBy || 'Internal Tech',
            nextServiceDate: maintenanceForm.nextServiceDate,
            invoiceRef: maintenanceForm.invoiceRef
        };
        const updatedAsset = {
            ...selectedAsset,
            maintenanceLog: [log, ...selectedAsset.maintenanceLog],
            status: maintenanceForm.type === 'REPAIR' ? 'ACTIVE' : selectedAsset.status // If repaired, set back to active
        };
        setAssets(assets.map(a => a.id === selectedAsset.id ? updatedAsset : a));
        setSelectedAsset(updatedAsset);
        setMaintenanceForm({ description: '', cost: 0, performedBy: '', type: 'REPAIR', date: new Date().toISOString().split('T')[0], nextServiceDate: '', invoiceRef: '' });
    };

    const branchAssets = assets.filter(a => a.branchId === currentBranch.id);
    const totalAssetValue = branchAssets.reduce((sum, a) => sum + calculateBookValue(a), 0);

    // Filter logic for Registry
    const machineryAssets = branchAssets.filter(a => a.category === 'MACHINERY');
    const toolAssets = branchAssets.filter(a => a.category === 'TOOLS');

    return (
        <div className="p-8 h-full flex flex-col bg-gray-50">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Fixed Assets</h2>
                    <p className="text-gray-500">Equipment tracking, resource allocation, and depreciation.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => setActiveTab('REGISTRY')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'REGISTRY' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Box size={16} /> Registry
                    </button>
                    <button onClick={() => setActiveTab('DEPRECIATION')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'DEPRECIATION' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <TrendingDown size={16} /> Depreciation
                    </button>
                    <button onClick={() => setActiveTab('MAINTENANCE')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'MAINTENANCE' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Wrench size={16} /> Maintenance
                    </button>
                </div>
            </header>

            {/* Top Stats - Only show in Registry for cleaner UI */}
            {activeTab === 'REGISTRY' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Book Value</p>
                            <h3 className="text-2xl font-bold text-gray-900">KES {totalAssetValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={24}/></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Active Equipment</p>
                            <h3 className="text-2xl font-bold text-gray-900">{branchAssets.filter(a => a.status === 'ACTIVE').length} Units</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Monitor size={24}/></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Under Maintenance</p>
                            <h3 className="text-2xl font-bold text-gray-900">{branchAssets.filter(a => a.status === 'MAINTENANCE').length} Units</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Wrench size={24}/></div>
                    </div>
                </div>
            )}

            {/* --- REGISTRY TAB --- */}
            {activeTab === 'REGISTRY' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Asset List</h3>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={18} /> Register Asset
                        </button>
                    </div>

                    {branchAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-gray-300">
                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                <Box size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Fixed Assets Configured</h3>
                            <p className="text-gray-500 max-w-md text-center mb-6">
                                Track machinery, tools, and equipment to manage depreciation and maintenance schedules.
                            </p>
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm"
                            >
                                Register First Asset
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {branchAssets.map(asset => {
                                const bay = serviceBays.find(b => b.id === asset.location);
                                const health = getAssetHealth(asset);
                                return (
                                    <div key={asset.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                                        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                    {asset.category === 'MACHINERY' ? <Monitor size={20}/> : <Wrench size={20}/>}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{asset.name}</h4>
                                                    <p className="text-xs text-gray-500 font-mono">{asset.serialNumber}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                                asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                                asset.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {asset.status}
                                            </span>
                                        </div>
                                        <div className="p-5 space-y-3 flex-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Purchase Date</span>
                                                <span className="font-medium text-gray-900">{asset.purchaseDate}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Book Value</span>
                                                <span className="font-bold text-gray-900">KES {calculateBookValue(asset).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Location</span>
                                                <span className="font-medium text-indigo-600 flex items-center gap-1">
                                                    <MapPin size={12}/> {bay ? bay.name : asset.location || 'Unassigned'}
                                                </span>
                                            </div>
                                            {health.status !== 'GOOD' && (
                                                <div className={`mt-2 p-2 rounded text-xs flex items-center gap-2 ${health.bg} ${health.color}`}>
                                                    <AlertTriangle size={12}/> High Maintenance Costs
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 p-3 border-t border-gray-100 flex gap-2">
                                            <button onClick={() => { setSelectedAsset(asset); setActiveTab('DEPRECIATION'); }} className="flex-1 text-xs font-medium text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 py-2 rounded transition-all">
                                                View Schedule
                                            </button>
                                            <button onClick={() => { setSelectedAsset(asset); setActiveTab('MAINTENANCE'); }} className="flex-1 text-xs font-medium text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 py-2 rounded transition-all">
                                                Log Repair
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* --- DEPRECIATION TAB --- */}
            {activeTab === 'DEPRECIATION' && selectedAsset && (
                <div className="flex flex-col h-full animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Calculator size={24} className="text-emerald-600"/> 
                                    Financial Schedule: {selectedAsset.name}
                                </h3>
                                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                    <span><strong>Acquisition Cost:</strong> KES {selectedAsset.purchaseCost.toLocaleString()}</span>
                                    <span>•</span>
                                    <span><strong>Useful Life:</strong> {selectedAsset.usefulLifeYears} Years</span>
                                    <span>•</span>
                                    <span><strong>Salvage Value:</strong> KES {selectedAsset.salvageValue.toLocaleString()}</span>
                                </div>
                            </div>
                            <button onClick={() => setActiveTab('REGISTRY')} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"><X size={24}/></button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 flex-1">
                            {/* Chart */}
                            <div className="flex-1 min-h-[300px] flex flex-col">
                                <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Book Value Trajectory</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getDepreciationSchedule(selectedAsset)}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="year" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Book Value']}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Schedule Table */}
                            <div className="w-full lg:w-96 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50/50">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                                        <tr>
                                            <th className="p-3">Year</th>
                                            <th className="p-3 text-right">Expense</th>
                                            <th className="p-3 text-right">Net Book Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {getDepreciationSchedule(selectedAsset).map((row) => (
                                            <tr key={row.year} className={row.isCurrent ? 'bg-green-50' : 'hover:bg-gray-50'}>
                                                <td className="p-3 font-medium text-gray-900">
                                                    {row.year}
                                                    {row.isCurrent && <span className="ml-2 text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded">Current</span>}
                                                </td>
                                                <td className="p-3 text-right text-red-600 font-mono">
                                                    {row.depreciation > 0 ? `(${Math.round(row.depreciation).toLocaleString()})` : '-'}
                                                </td>
                                                <td className="p-3 text-right font-bold text-gray-800 font-mono">
                                                    {Math.round(row.value).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-100 mt-6 pt-4 flex justify-end">
                            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-800">
                                <ClipboardList size={16}/> Post Current Expense to GL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAINTENANCE TAB --- */}
            {activeTab === 'MAINTENANCE' && selectedAsset && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col animate-in fade-in overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Wrench size={20} className="text-orange-600"/> 
                                {selectedAsset.name} Maintenance
                            </h3>
                            <p className="text-gray-500 text-sm">Serial: {selectedAsset.serialNumber}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-white border rounded text-xs font-medium text-gray-600 flex flex-col items-center justify-center">
                                <span className="text-[10px] uppercase text-gray-400">Total Spent</span>
                                <span>KES {selectedAsset.maintenanceLog.reduce((s, l) => s + l.cost, 0).toLocaleString()}</span>
                            </div>
                            <button onClick={() => setActiveTab('REGISTRY')} className="text-gray-400 hover:text-gray-600 p-2"><X size={24}/></button>
                        </div>
                    </div>
                    
                    <div className="flex flex-1 overflow-hidden">
                        {/* History List */}
                        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Service History</h4>
                            <div className="space-y-4">
                                {selectedAsset.maintenanceLog.length > 0 ? (
                                    selectedAsset.maintenanceLog.map(log => (
                                        <div key={log.id} className="relative pl-6 border-l-2 border-gray-200 pb-4 last:pb-0">
                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${log.type === 'PREVENTIVE' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${log.type === 'PREVENTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {log.type}
                                                        </span>
                                                        <h4 className="font-bold text-gray-800 mt-1">{log.description}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-sm font-bold text-gray-900">KES {log.cost.toLocaleString()}</span>
                                                        <span className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 flex flex-wrap gap-4 mt-2 pt-2 border-t border-gray-50">
                                                    <span className="flex items-center gap-1"><Wrench size={12}/> By: {log.performedBy}</span>
                                                    {log.invoiceRef && <span className="flex items-center gap-1"><FileText size={12}/> Ref: {log.invoiceRef}</span>}
                                                    {log.nextServiceDate && <span className="flex items-center gap-1 text-blue-600 font-medium"><Calendar size={12}/> Next Due: {log.nextServiceDate}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Archive size={48} className="mx-auto mb-4 opacity-20"/>
                                        <p>No maintenance records found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Log Form */}
                        <div className="w-80 p-6 bg-gray-50 overflow-y-auto">
                            <h4 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
                                <Plus size={16} className="text-blue-600"/> Log New Service
                            </h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
                                    <select 
                                        className="w-full border rounded-lg p-2 text-sm bg-white"
                                        value={maintenanceForm.type}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value as any})}
                                    >
                                        <option value="PREVENTIVE">Preventive Maintenance</option>
                                        <option value="REPAIR">Repair (Breakdown)</option>
                                        <option value="UPGRADE">Upgrade / Part Replacement</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date Performed</label>
                                    <input 
                                        type="date" 
                                        className="w-full border rounded-lg p-2 text-sm" 
                                        value={maintenanceForm.date}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                    <textarea 
                                        rows={3}
                                        className="w-full border rounded-lg p-2 text-sm" 
                                        placeholder="Details of work done..."
                                        value={maintenanceForm.description}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cost (KES)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-lg p-2 text-sm font-medium" 
                                        placeholder="0.00"
                                        value={maintenanceForm.cost}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Service Provider</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded-lg p-2 text-sm" 
                                        placeholder="e.g. Vendor Name or Internal"
                                        value={maintenanceForm.performedBy}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, performedBy: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Ref (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded-lg p-2 text-sm" 
                                        placeholder="INV-XXXX"
                                        value={maintenanceForm.invoiceRef}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, invoiceRef: e.target.value})}
                                    />
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <label className="block text-xs font-medium text-blue-600 mb-1">Next Service Due (Optional)</label>
                                    <input 
                                        type="date" 
                                        className="w-full border rounded-lg p-2 text-sm bg-blue-50 border-blue-100" 
                                        value={maintenanceForm.nextServiceDate}
                                        onChange={(e) => setMaintenanceForm({...maintenanceForm, nextServiceDate: e.target.value})}
                                    />
                                </div>

                                <button 
                                    onClick={handleLogMaintenance}
                                    className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 flex items-center justify-center gap-2 mt-2"
                                >
                                    <Save size={16}/> Save Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Asset Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-800">Register New Asset</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X size={24} className="text-gray-400"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                                <input type="text" className="w-full border rounded-lg p-2.5" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. 2-Post Hydraulic Lift"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                    <input type="text" className="w-full border rounded-lg p-2.5" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select className="w-full border rounded-lg p-2.5" value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value as any})}>
                                        <option value="MACHINERY">Machinery</option>
                                        <option value="TOOLS">Tools</option>
                                        <option value="FURNITURE">Furniture</option>
                                        <option value="IT_EQUIPMENT">IT Equipment</option>
                                        <option value="VEHICLES">Company Vehicle</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost (KES)</label>
                                    <input type="number" className="w-full border rounded-lg p-2.5" value={newAsset.purchaseCost} onChange={e => setNewAsset({...newAsset, purchaseCost: parseInt(e.target.value)})}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                                    <input type="date" className="w-full border rounded-lg p-2.5" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Useful Life (Years)</label>
                                    <input type="number" className="w-full border rounded-lg p-2.5" value={newAsset.usefulLifeYears} onChange={e => setNewAsset({...newAsset, usefulLifeYears: parseInt(e.target.value)})}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salvage Value</label>
                                    <input type="number" className="w-full border rounded-lg p-2.5" value={newAsset.salvageValue} onChange={e => setNewAsset({...newAsset, salvageValue: parseInt(e.target.value)})}/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Service Bay</label>
                                <select className="w-full border rounded-lg p-2.5" value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})}>
                                    <option value="">-- General / Unassigned --</option>
                                    {serviceBays.map(bay => (
                                        <option key={bay.id} value={bay.id}>{bay.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Linking to a bay helps with resource planning.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-white">Cancel</button>
                            <button onClick={handleAddAsset} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Register Asset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManager;