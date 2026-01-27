import React, { useState } from 'react';
import { Search, Car, History, FileText, PenTool, Shield, User, Fuel, GitCommit, Database, Plus, X, FolderOpen, Link as LinkIcon, CheckCircle, Lock, AlertOctagon, UserPlus, AlertCircle, Edit3 } from 'lucide-react';
import { Vehicle, JobCard, Inspection, ServiceRecord, LedgerEventType } from '../types';
import { apiClient } from '../services/apiClient';
import QRCode from 'react-qr-code';

interface VehicleRegistryProps {
    vehicles: Vehicle[];
    setVehicles: (vehicles: Vehicle[]) => void;
    jobs?: JobCard[];
    inspections?: Inspection[];
    serviceRecords?: ServiceRecord[];
    onCorrection?: (originalRecord: ServiceRecord, newMileage: number, reason: string) => void;
    onTransfer?: (vehicleId: string, newOwnerName: string, notes: string) => void;
}

const VehicleRegistry: React.FC<VehicleRegistryProps> = ({ 
    vehicles, setVehicles, jobs = [], inspections = [], serviceRecords = [], 
    onCorrection, onTransfer 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [remoteHistory, setRemoteHistory] = useState<any | null>(null);
  const [remoteInspections, setRemoteInspections] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null); // Ledger verification animation state

  // Workflows
  const [correctionTarget, setCorrectionTarget] = useState<ServiceRecord | null>(null);
  const [correctionForm, setCorrectionForm] = useState({ mileage: '', reason: '' });
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ newOwner: '', notes: '' });
  const [shareInfo, setShareInfo] = useState<{ tokenId: string; expiresAt: string } | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    plateNumber: '', make: '', model: '', year: new Date().getFullYear(), vin: '', ownerName: '', color: '', fuelType: 'PETROL', transmission: 'AUTOMATIC', engineSize: ''
  });

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber.includes(searchQuery.toUpperCase()) || 
    v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get Chain History (Immutable Ledger)
  const getLedger = (vehicleId: string) => {
      if (remoteHistory && remoteHistory.vehicleId === vehicleId) {
        const tl = remoteHistory.timeline || [];
        return tl.map((t: any, idx: number) => ({ id: `${vehicleId}-${idx}`, vehicleId, timestamp: t.date, description: t.details?.summary || t.type, eventType: 'SERVICE_RECORD' as any }));
      }
      return serviceRecords
        .filter(r => r.vehicleId === vehicleId)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleVerifyChain = () => {
      setVerifyingHash('START');
      setTimeout(() => setVerifyingHash('DONE'), 2000);
  };

  const handleAddVehicle = () => {
    if (newVehicle.plateNumber && newVehicle.make && newVehicle.model) {
      const vehicle: Vehicle = {
        id: `V${Date.now()}`,
        plateNumber: newVehicle.plateNumber.toUpperCase(),
        make: newVehicle.make, model: newVehicle.model, year: newVehicle.year || new Date().getFullYear(),
        vin: newVehicle.vin || 'N/A', ownerName: newVehicle.ownerName || 'Unknown', color: newVehicle.color,
        fuelType: newVehicle.fuelType as any, transmission: newVehicle.transmission as any, engineSize: newVehicle.engineSize
      };
      setVehicles([vehicle, ...vehicles]);
      setSelectedVehicle(vehicle);
      setIsAddModalOpen(false);
      setNewVehicle({ plateNumber: '', make: '', model: '', year: new Date().getFullYear(), vin: '', ownerName: '', color: '', fuelType: 'PETROL', transmission: 'AUTOMATIC', engineSize: '' });
    }
  };

  const submitCorrection = () => {
      if(onCorrection && correctionTarget && correctionForm.reason) {
          onCorrection(correctionTarget, parseInt(correctionForm.mileage) || correctionTarget.mileage, correctionForm.reason);
          setCorrectionTarget(null);
          setCorrectionForm({ mileage: '', reason: '' });
      }
  };

  const submitTransfer = () => {
      if(onTransfer && selectedVehicle && transferForm.newOwner) {
          onTransfer(selectedVehicle.id, transferForm.newOwner, transferForm.notes);
          setIsTransferModalOpen(false);
          setTransferForm({ newOwner: '', notes: '' });
          // Update local view immediately for better UX, though App state propagates down
          if(selectedVehicle) setSelectedVehicle({...selectedVehicle, ownerName: transferForm.newOwner});
      }
  };

  const handleShareHistory = async () => {
    if (!selectedVehicle) return;
    setIsSharing(true);
    const tokenId = `tok-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await apiClient.post(`/api/vehicles/${selectedVehicle.id}/share`, { tokenId, expiresAt, reason: 'resale' });
      setShareInfo({ tokenId, expiresAt });
    } catch {
    } finally {
      setIsSharing(false);
    }
  };

  const renderEventIcon = (type: LedgerEventType) => {
      switch(type) {
          case 'SERVICE_RECORD': return <FileText size={16}/>;
          case 'CORRECTION_ISSUED': return <AlertOctagon size={16}/>;
          case 'OWNERSHIP_TRANSFERRED': return <UserPlus size={16}/>;
          default: return <FileText size={16}/>;
      }
  };

  const renderEventColor = (type: LedgerEventType) => {
      switch(type) {
          case 'SERVICE_RECORD': return 'bg-slate-800 text-white';
          case 'CORRECTION_ISSUED': return 'bg-red-500 text-white';
          case 'OWNERSHIP_TRANSFERRED': return 'bg-blue-500 text-white';
          default: return 'bg-slate-800 text-white';
      }
  };

  return (
    <div className="p-8 h-full flex flex-col">
       <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Vehicle Registry</h2>
            <p className="text-gray-500">Decentralized Asset Management & Digital Logbook</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm">
            <Plus size={20} /> Add Vehicle
          </button>
       </header>

       <div className="flex gap-6 h-full overflow-hidden">
         {/* Search & List Panel */}
         <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search Plate, VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredVehicles.map(vehicle => (
                    <div key={vehicle.id} onClick={async () => { setSelectedVehicle(vehicle); try { const hist = await apiClient.get(`/api/vehicles/${vehicle.id}/history`); setRemoteHistory(hist); const insp = await apiClient.get(`/api/vehicles/${vehicle.id}/inspections`); setRemoteInspections(insp); } catch {} }} className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-slate-50 ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-gray-900">{vehicle.plateNumber}</h3>
                            <span className="text-xs font-medium text-gray-500">{vehicle.year}</span>
                        </div>
                        <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">Owner: {vehicle.ownerName}</p>
                    </div>
                ))}
            </div>
         </div>

         {/* Detail View Panel */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            {selectedVehicle ? (
                <div>
                    {/* Vehicle Header */}
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
                                    <Car size={32} className="text-slate-700" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{selectedVehicle.plateNumber}</h1>
                                    <p className="text-gray-500 font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                            <Shield size={12}/> Ownership Verified
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">VIN: {selectedVehicle.vin}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Current Owner: <strong>{selectedVehicle.ownerName}</strong></p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsTransferModalOpen(true)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <UserPlus size={16}/> Transfer Ownership
                                </button>
                                <button className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Edit Specs</button>
                                <button onClick={handleShareHistory} disabled={isSharing} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                                    {isSharing ? 'Sharing...' : 'Share history'}
                                </button>
                                {shareInfo && (
                                  <button onClick={async () => {
                                    const headers: Record<string,string> = {
                                      'x-tenant-id': (import.meta as any).env?.VITE_TENANT_ID || 't1',
                                      'x-branch-id': (import.meta as any).env?.VITE_BRANCH_ID || 'b1',
                                      'x-user-id': (import.meta as any).env?.VITE_USER_ID || 'u1',
                                    };
                                    const res = await fetch(`/api/vehicles/${selectedVehicle!.id}/history.pdf?tokenId=${shareInfo.tokenId}`, { headers });
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url; a.download = `vehicle-${selectedVehicle!.id}-history.pdf`; a.click(); URL.revokeObjectURL(url);
                                  }} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Download PDF</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Immutable Ledger */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <LinkIcon size={20} className="text-blue-500" /> Digital Service Ledger
                            </h3>
                            <button 
                                onClick={handleVerifyChain}
                                disabled={verifyingHash === 'START' || verifyingHash === 'DONE'}
                                className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-2 font-medium transition-all ${
                                    verifyingHash === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {verifyingHash === 'START' ? (
                                    <>Verifying Hashes...</>
                                ) : verifyingHash === 'DONE' ? (
                                    <><CheckCircle size={14}/> Chain Validated</>
                                ) : (
                                    <><Lock size={14}/> Verify Chain Integrity</>
                                )}
                            </button>
                        </div>
                        
                        <div className="relative pl-8 border-l-2 border-dashed border-gray-300 space-y-8">
                            {shareInfo && (() => {
                              const url = `${window.location.origin}/public/vehicles/${selectedVehicle.id}/history?token=${shareInfo.tokenId}`;
                              const remainingMs = new Date(shareInfo.expiresAt).getTime() - Date.now();
                              const remainingDays = Math.max(0, Math.floor(remainingMs / (1000*60*60*24)));
                              const expired = remainingMs <= 0;
                              return (
                                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-bold text-indigo-800">Share Link</div>
                                    <div className="font-mono text-indigo-700 text-xs break-all">{url}</div>
                                    <div className="text-xs text-indigo-700">Expires: {new Date(shareInfo.expiresAt).toLocaleString()} {expired ? (<span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700">expired</span>) : (<span className="ml-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Expires in {remainingDays} days</span>)}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <QRCode value={url} size={72} />
                                    <button disabled={expired} onClick={() => navigator.clipboard.writeText(url)} className={`px-2 py-1 rounded text-xs ${expired ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}>Copy</button>
                                  </div>
                                </div>
                              );
                            })()}
                            {getLedger(selectedVehicle.id).length > 0 ? (
                                getLedger(selectedVehicle.id).map((record, idx) => (
                                    <div key={record.id} className="relative group">
                                        <div className={`absolute -left-[41px] p-2 rounded-full border-2 border-white shadow-md z-10 transition-colors ${
                                            verifyingHash === 'START' ? 'bg-yellow-400 animate-pulse' : 
                                            verifyingHash === 'DONE' ? 'bg-green-500 text-white' : renderEventColor(record.eventType)
                                        }`}>
                                            {renderEventIcon(record.eventType)}
                                        </div>
                                        
                                        {/* Ledger Block */}
                                        <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all hover:border-blue-300 ${
                                            record.eventType === 'CORRECTION_ISSUED' ? 'bg-red-50 border-red-200' :
                                            record.eventType === 'OWNERSHIP_TRANSFERRED' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                                        }`}>
                                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-900 text-lg">{record.description}</h4>
                                                        {record.eventType === 'CORRECTION_ISSUED' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Correction</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-medium">{record.garageName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 mb-1">
                                                        {new Date(record.timestamp).toLocaleDateString()}
                                                    </span>
                                                    {record.mileage > 0 && <span className="text-xs font-bold text-blue-600">{record.mileage.toLocaleString()} km</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="text-sm text-gray-700 mb-4">
                                                {record.eventType === 'SERVICE_RECORD' && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {record.items.map((item, i) => (
                                                            <span key={i} className="bg-slate-50 px-2 py-1 rounded text-xs border border-slate-100">{item}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {record.eventType === 'CORRECTION_ISSUED' && (
                                                    <p className="text-red-700 text-xs italic">
                                                        Correction issued for Record ID: {record.referenceRecordId}. Reason: {record.metadata?.correctionReason}
                                                    </p>
                                                )}
                                                {record.eventType === 'OWNERSHIP_TRANSFERRED' && (
                                                    <p className="text-blue-700 text-xs italic">
                                                        Transferred to: {record.metadata?.newOwner}. Notes: {record.metadata?.transferNotes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Cryptographic Proof & Actions */}
                                            <div className="flex justify-between items-end">
                                                <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-200/50 font-mono text-[10px] text-slate-500 flex-1 mr-4">
                                                    <div className="flex justify-between mb-1">
                                                        <span>Hash:</span>
                                                        <span className="text-blue-600 truncate max-w-[150px]" title={record.hash}>{record.hash}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Prev:</span>
                                                        <span className="text-slate-400 truncate max-w-[150px]" title={record.previousHash}>{record.previousHash}</span>
                                                    </div>
                                                </div>
                                                
                                                {record.eventType === 'SERVICE_RECORD' && (
                                                    <button 
                                                        onClick={() => { setCorrectionTarget(record); setCorrectionForm({ mileage: record.mileage.toString(), reason: '' }); }}
                                                        className="text-xs flex items-center gap-1 text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                                                        title="Issue Correction"
                                                    >
                                                        <Edit3 size={14}/> Correct
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Connector */}
                                        {idx !== getLedger(selectedVehicle.id).length - 1 && (
                                            <div className="absolute left-[-25px] bottom-[-20px] w-0.5 h-8 bg-gray-300"></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Database size={32} className="mx-auto text-gray-300 mb-2"/>
                                    <p className="text-gray-500">No service blocks minted yet.</p>
                                    <p className="text-xs text-gray-400">Complete a Job Card to mint the first record.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Database size={64} className="mb-4 text-slate-200" />
                    <p className="font-medium text-lg">Select a vehicle to view its Chain of Trust</p>
                </div>
            )}
         </div>
       </div>

       {/* Add Vehicle Modal (Simplified) */}
       {isAddModalOpen && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                <h3 className="font-bold text-xl mb-4">Add Vehicle</h3>
                <input className="w-full border p-2 rounded mb-2" placeholder="Plate" value={newVehicle.plateNumber} onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value})} />
                <input className="w-full border p-2 rounded mb-4" placeholder="Make" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} />
                <button onClick={handleAddVehicle} className="w-full bg-blue-600 text-white p-2 rounded">Save</button>
            </div>
         </div>
       )}

       {/* Correction Modal */}
       {correctionTarget && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                   <div className="flex items-start gap-4 mb-4">
                       <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle size={24}/></div>
                       <div>
                           <h3 className="font-bold text-xl text-gray-900">Issue Record Correction</h3>
                           <p className="text-xs text-gray-500">This will append a new correction block. The original record remains in history.</p>
                       </div>
                   </div>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Corrected Mileage</label>
                           <input type="number" className="w-full border rounded-lg p-2" value={correctionForm.mileage} onChange={e => setCorrectionForm({...correctionForm, mileage: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Correction</label>
                           <textarea className="w-full border rounded-lg p-2" rows={3} value={correctionForm.reason} onChange={e => setCorrectionForm({...correctionForm, reason: e.target.value})} placeholder="e.g. Typo in original entry" />
                       </div>
                       <button onClick={submitCorrection} className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">Issue Correction Block</button>
                       <button onClick={() => setCorrectionTarget(null)} className="w-full text-gray-500 py-2">Cancel</button>
                   </div>
               </div>
           </div>
       )}

       {/* Transfer Modal */}
       {isTransferModalOpen && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                   <div className="flex items-start gap-4 mb-4">
                       <div className="bg-blue-100 p-2 rounded-full text-blue-600"><UserPlus size={24}/></div>
                       <div>
                           <h3 className="font-bold text-xl text-gray-900">Transfer Ownership</h3>
                           <p className="text-xs text-gray-500">This updates the current owner and logs a permanent transfer event.</p>
                       </div>
                   </div>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">New Owner Name</label>
                           <input type="text" className="w-full border rounded-lg p-2" value={transferForm.newOwner} onChange={e => setTransferForm({...transferForm, newOwner: e.target.value})} placeholder="Full Legal Name"/>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Notes</label>
                           <textarea className="w-full border rounded-lg p-2" rows={3} value={transferForm.notes} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} placeholder="e.g. Sold via dealership"/>
                       </div>
                       <button onClick={submitTransfer} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Confirm Transfer</button>
                       <button onClick={() => setIsTransferModalOpen(false)} className="w-full text-gray-500 py-2">Cancel</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default VehicleRegistry;