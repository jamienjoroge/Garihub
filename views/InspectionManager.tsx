import React, { useState } from 'react';
import { ClipboardCheck, Search, Plus, Camera, CheckCircle2, AlertTriangle, XCircle, FileText, BadgeCheck, ShieldCheck, Printer, Share2 } from 'lucide-react';
import { Inspection, InspectionItem } from '../types';

interface InspectionManagerProps {
    inspections: Inspection[];
    setInspections: (inspections: Inspection[]) => void;
}

const InspectionManager: React.FC<InspectionManagerProps> = ({ inspections, setInspections }) => {
  // Local state only for the active working session
  const [activeInspection, setActiveInspection] = useState<Inspection | null>(null);
  const [checklist, setChecklist] = useState<InspectionItem[]>([
    { id: '1', category: 'Engine', label: 'Oil Level & Quality', status: 'PENDING' },
    { id: '2', category: 'Engine', label: 'Belts & Hoses Condition', status: 'PENDING' },
    { id: '3', category: 'Suspension', label: 'Shock Absorbers', status: 'PENDING' },
    { id: '4', category: 'Brakes', label: 'Pad Thickness > 3mm', status: 'PENDING' },
    { id: '5', category: 'Body', label: 'Paint Consistency', status: 'PENDING' },
    { id: '6', category: 'Interior', label: 'Dashboard Warnings', status: 'PENDING' },
  ]);

  const startNewInspection = () => {
      const newInsp: Inspection = {
          id: `INS-${Date.now()}`,
          plateNumber: 'NEW',
          model: 'Unknown',
          type: 'PRE-PURCHASE',
          status: 'IN_PROGRESS',
          date: new Date().toISOString().split('T')[0]
      };
      // Don't add to main list until finalized or saved draft? 
      // For simplicity, add immediately to list as In Progress
      setInspections([newInsp, ...inspections]);
      setActiveInspection(newInsp);
      // Reset checklist for new inspection
      setChecklist(checklist.map(i => ({...i, status: 'PENDING'}))); 
  };

  const openInspection = (ins: Inspection) => {
      setActiveInspection(ins);
      // If it has saved checklist data, load it (mock logic for now since checklist isn't fully in type yet, assume default or persisted)
      // For this prototype, we'll just reset if it's a different one, or if persisted data existed we'd load it.
      // Ideally Inspection type should have `checklist` property. I added it to types.ts.
      if (ins.checklist) {
          setChecklist(ins.checklist);
      } else {
          // Reset default if no saved data
           setChecklist(checklist.map(i => ({...i, status: 'PENDING'}))); 
      }
  };

  const updateItemStatus = (id: string, status: InspectionItem['status']) => {
    if (activeInspection?.status === 'COMPLETED') return; // Prevent edits if completed
    const newChecklist = checklist.map(item => item.id === id ? { ...item, status } : item);
    setChecklist(newChecklist);
    
    // Auto-save progress to global state
    if (activeInspection) {
        const updated = { ...activeInspection, checklist: newChecklist };
        setInspections(inspections.map(i => i.id === activeInspection.id ? updated : i));
        setActiveInspection(updated);
    }
  };

  const handleGenerateReport = async () => {
    if (!activeInspection) return;
    
    // Ensure all items checked
    if (checklist.some(i => i.status === 'PENDING')) {
        alert("Please complete all checklist items before finalizing.");
        return;
    }

    if (!window.confirm("Finalize this inspection? This will lock the report.")) return;

    const passCount = checklist.filter(i => i.status === 'PASS').length;
    const score = Math.round((passCount / checklist.length) * 100);

    const updatedInspection: Inspection = {
        ...activeInspection,
        status: 'COMPLETED',
        overallScore: score,
        checklist: checklist
    };

    setInspections(inspections.map(i => i.id === updatedInspection.id ? updatedInspection : i));
    setActiveInspection(updatedInspection);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Vehicle Inspections</h2>
          <p className="text-gray-500">Perform standardized pre-purchase and safety checks.</p>
        </div>
        {!activeInspection && (
          <button 
            onClick={startNewInspection}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={20} />
            <span>New Inspection</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex gap-6 h-full overflow-hidden">
        
        {/* Inspection List (Sidebar) */}
        <div className={`w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${activeInspection ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Search inspections..." className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-300" />
                 </div>
            </div>
            <div className="overflow-y-auto flex-1">
                {inspections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                            <ClipboardCheck size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No Inspections</h3>
                        <p className="text-sm text-gray-500">
                            Scheduled and past inspections will appear here.
                        </p>
                    </div>
                ) : (
                    inspections.map(ins => (
                        <div 
                            key={ins.id} 
                            onClick={() => openInspection(ins)}
                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-slate-50 transition-colors ${activeInspection?.id === ins.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-gray-800">{ins.plateNumber}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ins.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {ins.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{ins.model}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <BadgeCheck size={14} /> {ins.type}
                                <span>•</span>
                                {ins.date}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Active Inspection Workspace */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
             {activeInspection ? (
                 <>
                    {/* Workspace Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-900">{activeInspection.plateNumber}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${activeInspection.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {activeInspection.type}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                {activeInspection.status === 'COMPLETED' ? `Certified on ${activeInspection.date}` : 'Inspection in progress'}
                            </p>
                        </div>
                        
                        {activeInspection.status === 'IN_PROGRESS' && (
                            <div className="flex gap-2">
                                <button className="text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <Camera size={16} /> Add Photos
                                </button>
                                <button 
                                    onClick={handleGenerateReport}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700"
                                >
                                    <FileText size={16} /> Finalize Report
                                </button>
                            </div>
                        )}
                        {activeInspection.status === 'COMPLETED' && (
                            <div className="flex gap-2">
                                <button className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                    <Share2 size={16}/> Share
                                </button>
                                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800">
                                    <Printer size={16}/> Print Certificate
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        
                        {/* --- CERTIFICATE VIEW (Read Only) --- */}
                        {activeInspection.status === 'COMPLETED' ? (
                            <div className="p-8 max-w-3xl mx-auto">
                                <div className="border-4 border-double border-slate-200 p-8 rounded-xl bg-white relative">
                                    {/* Watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                                        <BadgeCheck size={300}/>
                                    </div>

                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest mb-2">Vehicle Inspection Certificate</h2>
                                        <p className="text-slate-500">Verified by GariHub Systems</p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold border border-green-200">
                                            <ShieldCheck size={20}/>
                                            Overall Score: {activeInspection.overallScore}%
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mb-8 border-b border-slate-100 pb-8">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Vehicle</p>
                                            <p className="font-bold text-lg">{activeInspection.model}</p>
                                            <p className="font-mono text-slate-600">{activeInspection.plateNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Inspection Date</p>
                                            <p className="font-bold text-lg">{activeInspection.date}</p>
                                            <p className="text-slate-600">ID: {activeInspection.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="font-bold text-slate-800">Key Findings</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {checklist.filter(i => i.status !== 'PASS').length === 0 ? (
                                                <p className="text-green-600 italic col-span-2 text-center py-4">No issues detected. Vehicle passed all checks.</p>
                                            ) : (
                                                checklist.filter(i => i.status !== 'PASS').map(item => (
                                                    <div key={item.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                                        {item.status === 'FAIL' ? <XCircle size={20} className="text-red-500 shrink-0"/> : <AlertTriangle size={20} className="text-orange-500 shrink-0"/>}
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-800">{item.label}</p>
                                                            <p className="text-xs text-slate-600 uppercase">{item.category}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-end">
                                        <div className="text-center">
                                            <div className="h-12 w-32 border-b border-slate-300 mb-2"></div>
                                            <p className="text-xs text-slate-400 uppercase">Authorized Inspector</p>
                                        </div>
                                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-800 rounded-lg"></div> 
                                            {/* QR Code Placeholder */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* --- CHECKLIST WORKSPACE (Editable) --- */
                            <div className="p-6">
                                <div className="space-y-6">
                                    {['Engine', 'Suspension', 'Brakes', 'Body', 'Interior'].map(cat => {
                                        const items = checklist.filter(i => i.category === cat);
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={cat} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <h4 className="font-bold text-slate-700 mb-3 uppercase text-xs tracking-wider">{cat}</h4>
                                                <div className="space-y-3">
                                                    {items.map(item => (
                                                        <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
                                                            <span className="text-gray-700 font-medium">{item.label}</span>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => updateItemStatus(item.id, 'PASS')}
                                                                    className={`p-1.5 rounded-md transition-all ${item.status === 'PASS' ? 'bg-green-100 text-green-600 ring-2 ring-green-500' : 'text-gray-300 hover:bg-gray-100'}`}
                                                                >
                                                                    <CheckCircle2 size={20} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => updateItemStatus(item.id, 'WARN')}
                                                                    className={`p-1.5 rounded-md transition-all ${item.status === 'WARN' ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-500' : 'text-gray-300 hover:bg-gray-100'}`}
                                                                >
                                                                    <AlertTriangle size={20} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => updateItemStatus(item.id, 'FAIL')}
                                                                    className={`p-1.5 rounded-md transition-all ${item.status === 'FAIL' ? 'bg-red-100 text-red-600 ring-2 ring-red-500' : 'text-gray-300 hover:bg-gray-100'}`}
                                                                >
                                                                    <XCircle size={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                 </>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                     <ClipboardCheck size={64} className="mb-4 text-gray-200" />
                     <p className="text-lg font-medium">Select an inspection to view details</p>
                     <p className="text-sm">or start a new pre-purchase inspection</p>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default InspectionManager;