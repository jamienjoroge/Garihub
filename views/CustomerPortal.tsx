import React, { useState } from 'react';
import { ShieldCheck, History, Share2, FileText, QrCode, ChevronDown, Check, Car, UserCheck, AlertTriangle, ArrowRight, CheckCircle2, FileSearch, Lock, Search, Download, CreditCard, BadgeCheck } from 'lucide-react';
import { Vehicle, ServiceRecord } from '../types';

const mockVehicleData: Vehicle = {
  id: 'V-MY-001',
  plateNumber: 'KCD 888G',
  make: 'Mazda',
  model: 'CX-5',
  year: 2017,
  vin: 'JMZKF123456789',
  ownerName: 'You'
};

const initialHistory: ServiceRecord[] = [
  {
    id: 'REC-1',
    date: '2023-11-15',
    garageName: 'Nairobi Auto Care',
    description: 'Major Service (100k km)',
    mileage: 98500,
    cost: 18500,
    items: ['Engine Oil', 'Oil Filter', 'Air Filter', 'Spark Plugs', 'Brake Pads']
  },
  {
    id: 'REC-2',
    date: '2023-06-10',
    garageName: 'Express Garage Westlands',
    description: 'Brake Inspection & Alignment',
    mileage: 92000,
    cost: 4500,
    items: ['Wheel Alignment', 'Brake Fluid Top-up']
  }
];

const CustomerPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'DOCS' | 'TRANSFER' | 'CHECK'>('HISTORY');
  const [history, setHistory] = useState<ServiceRecord[]>(initialHistory);
  
  // Transfer Logic State
  const [transferStep, setTransferStep] = useState<'INPUT' | 'VERIFY' | 'SUCCESS'>('INPUT');
  const [transferData, setTransferData] = useState({
    buyerPin: '',
    buyerPhone: '',
    price: '',
    mileage: ''
  });

  // Due Diligence State
  const [checkPlate, setCheckPlate] = useState('');
  const [checkStep, setCheckStep] = useState<'SEARCH' | 'FOUND' | 'PAYING' | 'VIEW'>('SEARCH');
  const [foundCar, setFoundCar] = useState<any>(null);

  const handleInitiateTransfer = () => {
    if (transferData.buyerPin && transferData.buyerPhone) {
      setTransferStep('VERIFY');
    }
  };

  const handleConfirmTransfer = () => {
    setTimeout(() => {
        setTransferStep('SUCCESS');
        const newRecord: ServiceRecord = {
            id: `REC-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            garageName: 'NTSA / GariHub System',
            description: 'Ownership Transfer Initiated',
            mileage: parseInt(transferData.mileage) || 98500,
            cost: 2500,
            items: [
                `Transfer initiated to PIN: ${transferData.buyerPin}`,
                `Sale Price Reported: KES ${(parseInt(transferData.price) || 0).toLocaleString()}`,
                'Pending Buyer Acceptance'
            ]
        };
        setHistory([newRecord, ...history]);
    }, 1000);
  };

  const resetTransfer = () => {
      setTransferStep('INPUT');
      setTransferData({ buyerPin: '', buyerPhone: '', price: '', mileage: '' });
      setActiveTab('HISTORY');
  };

  // Check Handlers
  const handleCheckSearch = () => {
    if(!checkPlate) return;
    // Simulate search
    setTimeout(() => {
        setFoundCar({
            plate: checkPlate.toUpperCase(),
            make: 'Subaru',
            model: 'Forester XT',
            year: 2014,
            records: 8,
            lastMileage: 112000,
            compliant: true
        });
        setCheckStep('FOUND');
    }, 1000);
  };

  const handlePurchaseReport = () => {
      setCheckStep('PAYING');
      setTimeout(() => {
          setCheckStep('VIEW');
      }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      {/* Vehicle Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">OWNER</span>
               <span className="text-slate-300 text-xs flex items-center gap-1"><ShieldCheck size={12}/> Verified</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{mockVehicleData.plateNumber}</h1>
            <p className="text-slate-300 font-medium">{mockVehicleData.year} {mockVehicleData.make} {mockVehicleData.model}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
            <QrCode size={32} />
          </div>
        </div>
        
        <div className="relative z-10 mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Mileage</p>
            <p className="font-semibold">98,500 km</p>
          </div>
          <div>
             <p className="text-xs text-slate-400 mb-1">Next Service</p>
             <p className="font-semibold text-green-400">In 3 mos</p>
          </div>
          <div>
             <p className="text-xs text-slate-400 mb-1">Est. Value</p>
             <p className="font-semibold">KES 2.4M</p>
          </div>
        </div>
        <Car size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
      </div>

      {/* Action Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {[
            { id: 'HISTORY', label: 'Service History', icon: History }, 
            { id: 'DOCS', label: 'Documents', icon: FileText },
            { id: 'TRANSFER', label: 'Resale & Share', icon: Share2 },
            { id: 'CHECK', label: 'Car Check', icon: FileSearch }
        ].map(tab => {
            const Icon = tab.icon;
            return (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                </button>
            )
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] p-6">
        {activeTab === 'HISTORY' && (
             <div className="space-y-8 relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                {history.map((record, idx) => (
                    <div key={record.id} className="relative pl-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm -translate-x-1/2 ${record.description.includes('Transfer') ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                             <div>
                                <h3 className="font-bold text-gray-900">{record.description}</h3>
                                <p className="text-sm text-gray-500">{record.garageName}</p>
                             </div>
                             <span className="text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded self-start mt-1 sm:mt-0">
                                {record.date}
                             </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-2">
                            <ul className="list-disc list-inside space-y-1">
                                {record.items.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <p className="text-xs text-gray-400">Verified Odometer: {record.mileage.toLocaleString()} km</p>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'DOCS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Logbook Copy', 'Insurance Sticker', 'Inspection Cert 2023', 'Inspection Cert 2022'].map((doc, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors group">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-100">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{doc}</p>
                            <p className="text-xs text-gray-500">PDF • 1.2 MB</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'TRANSFER' && (
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-6 px-2">
                    {['Enter Details', 'Verify', 'Done'].map((step, idx) => {
                         const stepMap = ['INPUT', 'VERIFY', 'SUCCESS'];
                         const currentIdx = stepMap.indexOf(transferStep);
                         const isActive = currentIdx >= idx;
                         
                         return (
                            <div key={step} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {isActive && idx < currentIdx ? <Check size={14}/> : idx + 1}
                                </div>
                                <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{step}</span>
                            </div>
                         );
                    })}
                </div>

                {transferStep === 'INPUT' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <h3 className="text-amber-900 font-bold flex items-center gap-2 mb-2">
                                <Share2 size={18} /> Resale Packet
                            </h3>
                            <p className="text-sm text-amber-800 mb-4">
                                Generate a secure, time-limited link for potential buyers to view the verified service history and inspection reports of this vehicle.
                            </p>
                            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Generate Buyer Link
                            </button>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-bold text-gray-900 mb-2">Initiate Ownership Transfer</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Enter the buyer's details to start the KRA-integrated transfer process.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Buyer KRA PIN</label>
                                    <input 
                                        type="text" 
                                        placeholder="A00..." 
                                        className="w-full border rounded-lg p-2.5 text-sm uppercase" 
                                        value={transferData.buyerPin}
                                        onChange={(e) => setTransferData({...transferData, buyerPin: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Buyer Phone</label>
                                    <input 
                                        type="text" 
                                        placeholder="07..." 
                                        className="w-full border rounded-lg p-2.5 text-sm" 
                                        value={transferData.buyerPhone}
                                        onChange={(e) => setTransferData({...transferData, buyerPhone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Agreed Price (KES)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        className="w-full border rounded-lg p-2.5 text-sm" 
                                        value={transferData.price}
                                        onChange={(e) => setTransferData({...transferData, price: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Mileage (km)</label>
                                    <input 
                                        type="number" 
                                        placeholder="98500" 
                                        className="w-full border rounded-lg p-2.5 text-sm" 
                                        value={transferData.mileage}
                                        onChange={(e) => setTransferData({...transferData, mileage: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleInitiateTransfer}
                                disabled={!transferData.buyerPin || !transferData.buyerPhone}
                                className="mt-4 w-full bg-slate-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Verify & Proceed <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {transferStep === 'VERIFY' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900">Buyer Identity Verified</h4>
                                <p className="text-sm text-blue-700">Name: <span className="font-semibold">JAMES OMONDI (ID: *****123)</span></p>
                                <p className="text-xs text-blue-600 mt-1">KRA PIN: {transferData.buyerPin}</p>
                            </div>
                         </div>

                         <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                             <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase">Transfer Summary</h4>
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Vehicle</span>
                                    <span className="font-medium">{mockVehicleData.plateNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Sale Price</span>
                                    <span className="font-medium">KES {(parseInt(transferData.price) || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Transfer Fee (NTSA)</span>
                                    <span className="font-medium">KES 2,500</span>
                                </div>
                             </div>
                         </div>

                         <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <p>Warning: This action will initiate the legal transfer of ownership. Once the buyer accepts, you will lose access to this vehicle's digital logbook.</p>
                         </div>

                         <div className="flex gap-3">
                             <button onClick={() => setTransferStep('INPUT')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50">
                                 Back
                             </button>
                             <button onClick={handleConfirmTransfer} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800">
                                 Confirm Transfer
                             </button>
                         </div>
                    </div>
                )}

                {transferStep === 'SUCCESS' && (
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Transfer Initiated!</h3>
                        <p className="text-gray-500 max-w-sm mb-8">
                            We've sent a confirmation request to <span className="font-semibold">{transferData.buyerPhone}</span>. 
                            The digital logbook will be updated once the buyer accepts via eTIMS.
                        </p>
                        <button onClick={resetTransfer} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                            View Updated History
                        </button>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'CHECK' && (
            <div className="space-y-8 animate-in fade-in">
                {checkStep === 'SEARCH' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
                            <Search size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Due Diligence</h3>
                        <p className="text-gray-500 text-center max-w-md mb-8">
                            Buying a used car? Enter the number plate to access verified service history, accident records, and previous inspection reports.
                        </p>
                        <div className="w-full max-w-md relative">
                            <input 
                                type="text" 
                                placeholder="Enter Plate Number (e.g. KAA 123A)" 
                                className="w-full border-2 border-gray-200 rounded-xl p-4 pl-5 text-lg uppercase font-bold tracking-widest focus:border-blue-500 focus:outline-none"
                                value={checkPlate}
                                onChange={(e) => setCheckPlate(e.target.value)}
                            />
                            <button 
                                onClick={handleCheckSearch}
                                disabled={checkPlate.length < 6}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                )}

                {(checkStep === 'FOUND' || checkStep === 'PAYING') && foundCar && (
                    <div className="max-w-xl mx-auto">
                        <div className="bg-slate-900 text-white rounded-t-xl p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">{foundCar.plate}</h2>
                                <p className="text-slate-300">{foundCar.year} {foundCar.make} {foundCar.model}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Database Status</p>
                                <div className="flex items-center gap-1 text-green-400 font-bold">
                                    <BadgeCheck size={16} /> Verified
                                </div>
                            </div>
                        </div>
                        <div className="border border-gray-200 border-t-0 rounded-b-xl p-6 shadow-sm space-y-6">
                             {/* Masked Data Preview */}
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Service Records</p>
                                    <p className="font-bold text-gray-900 text-lg">{foundCar.records} Entries</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Last Mileage</p>
                                    <p className="font-bold text-gray-900 text-lg">{foundCar.lastMileage.toLocaleString()} km</p>
                                </div>
                             </div>

                             {checkStep === 'PAYING' ? (
                                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center animate-in fade-in">
                                     <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                     <p className="font-bold text-blue-900">Processing M-Pesa Request...</p>
                                     <p className="text-sm text-blue-700">Please check your phone to complete the payment of KES 1,500.</p>
                                 </div>
                             ) : (
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
                                    <Lock size={32} className="mx-auto text-yellow-600 mb-3" />
                                    <h4 className="font-bold text-gray-900 mb-2">Detailed Report Locked</h4>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Unlock the full digital logbook, including garage names, service details, and accident history for due diligence.
                                    </p>
                                    <div className="flex justify-center">
                                        <button 
                                            onClick={handlePurchaseReport}
                                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transform transition hover:-translate-y-0.5"
                                        >
                                            <CreditCard size={18} /> Pay KES 1,500 to Unlock
                                        </button>
                                    </div>
                                </div>
                             )}
                             
                             <button onClick={() => setCheckStep('SEARCH')} className="text-sm text-gray-500 hover:text-gray-900 w-full text-center">Cancel Search</button>
                        </div>
                    </div>
                )}

                {checkStep === 'VIEW' && foundCar && (
                    <div className="animate-in slide-in-from-bottom-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Digital Logbook Report</h3>
                                <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                            <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                <Download size={16} /> Download PDF
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 grid grid-cols-4 gap-4">
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Vehicle</span>
                                    <span className="font-bold text-gray-900">{foundCar.year} {foundCar.make} {foundCar.model}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Plate</span>
                                    <span className="font-bold text-gray-900">{foundCar.plate}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Last Mileage</span>
                                    <span className="font-bold text-gray-900">{foundCar.lastMileage.toLocaleString()} km</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Compliance</span>
                                    <span className="font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Clear</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h4 className="font-bold text-gray-900 mb-4">Service History Timeline</h4>
                                <div className="space-y-6 relative pl-4 border-l-2 border-gray-100">
                                    {[1,2,3].map((i) => (
                                        <div key={i} className="relative pl-6">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-gray-900">{i === 1 ? 'Major Service' : i === 2 ? 'Routine Check' : 'Oil Change'}</p>
                                                    <p className="text-sm text-gray-500">GariHub Industrial Area</p>
                                                </div>
                                                <span className="text-sm text-gray-500">2023-0{9-i}-15</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">Verified Mileage: {(foundCar.lastMileage - (i*5000)).toLocaleString()} km</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                             <button onClick={() => { setCheckStep('SEARCH'); setCheckPlate(''); }} className="text-blue-600 font-medium hover:underline">Start New Check</button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPortal;