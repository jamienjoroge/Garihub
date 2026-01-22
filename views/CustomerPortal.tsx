import React, { useState } from 'react';
import { ShieldCheck, History, Share2, FileText, QrCode, ChevronDown, Check, Car, UserCheck, AlertTriangle, ArrowRight, CheckCircle2, FileSearch, Lock, Search, Download, CreditCard, BadgeCheck, Calendar, Clock, DollarSign, Plus, X, Loader2 } from 'lucide-react';
import { Vehicle, ServiceRecord, Invoice, Appointment } from '../types';

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
    vehicleId: 'V-MY-001',
    date: '2023-11-15',
    garageName: 'Nairobi Auto Care',
    description: 'Major Service (100k km)',
    mileage: 98500,
    cost: 18500,
    items: ['Engine Oil', 'Oil Filter', 'Air Filter', 'Spark Plugs', 'Brake Pads'],
    hash: '0x8f2d3a...',
    previousHash: '0x7e1c2b...',
    timestamp: '2023-11-15T10:00:00Z',
    recordedBy: 'EMP-005',
    isVerified: true
  },
  {
    id: 'REC-2',
    vehicleId: 'V-MY-001',
    date: '2023-06-10',
    garageName: 'Express Garage Westlands',
    description: 'Brake Inspection & Alignment',
    mileage: 92000,
    cost: 4500,
    items: ['Wheel Alignment', 'Brake Fluid Top-up'],
    hash: '0x7e1c2b...',
    previousHash: 'GENESIS',
    timestamp: '2023-06-10T14:30:00Z',
    recordedBy: 'EMP-002',
    isVerified: true
  }
];

// Mock Invoices
const initialInvoices: Invoice[] = [
    { id: 'INV-2023-001', customerName: 'You', branchId: 'BR-HQ', jobId: 'JOB-99', amount: 18500, date: '2023-11-15', dueDate: '2023-11-15', status: 'PAID', items: [] },
    { id: 'INV-2023-002', customerName: 'You', branchId: 'BR-HQ', jobId: 'JOB-102', amount: 4500, date: '2023-12-20', dueDate: '2024-01-20', status: 'PENDING', items: [] } // Pending for demo
];

// Mock Reports (Some paid, some free)
const initialReports = [
    { id: 'RPT-001', title: 'Vehicle Valuation Report', date: '2023-11-10', type: 'VALUATION', cost: 2500, isPaid: false, size: '2.4 MB' },
    { id: 'RPT-002', title: 'Standard Service Check', date: '2023-06-10', type: 'SERVICE', cost: 0, isPaid: true, size: '1.1 MB' }
];

const CustomerPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'APPOINTMENTS' | 'BILLING' | 'REPORTS' | 'TRANSFER'>('DASHBOARD');
  const [history, setHistory] = useState<ServiceRecord[]>(initialHistory);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [reports, setReports] = useState(initialReports);
  const [appointments, setAppointments] = useState<Appointment[]>([
      { id: 'APT-1', customerName: 'You', vehiclePlate: 'KCD 888G', date: '2024-02-15', time: '10:00', serviceType: 'General Service', status: 'CONFIRMED' }
  ]);

  // --- Booking State ---
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({ date: '', time: '', type: 'General Service' });

  // --- Payment State ---
  const [payingItemId, setPayingItemId] = useState<string | null>(null); // ID of Invoice or Report
  const [paymentType, setPaymentType] = useState<'INVOICE' | 'REPORT' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Handlers
  const handleBookAppointment = () => {
      if(!newBooking.date || !newBooking.time) return;
      const apt: Appointment = {
          id: `APT-${Date.now()}`,
          customerName: 'You',
          vehiclePlate: mockVehicleData.plateNumber,
          date: newBooking.date,
          time: newBooking.time,
          serviceType: newBooking.type,
          status: 'PENDING'
      };
      setAppointments([...appointments, apt]);
      setShowBookingModal(false);
      setNewBooking({ date: '', time: '', type: 'General Service' });
      setActiveTab('APPOINTMENTS');
  };

  const handleProcessPayment = () => {
      setIsProcessingPayment(true);
      setTimeout(() => {
          if (paymentType === 'INVOICE') {
              setInvoices(invoices.map(inv => inv.id === payingItemId ? { ...inv, status: 'PAID' } : inv));
          } else if (paymentType === 'REPORT') {
              setReports(reports.map(rpt => rpt.id === payingItemId ? { ...rpt, isPaid: true } : rpt));
          }
          setIsProcessingPayment(false);
          setPayingItemId(null);
          setPaymentType(null);
      }, 1500);
  };

  // Transfer Logic Reuse
  const [transferStep, setTransferStep] = useState<'INPUT' | 'VERIFY' | 'SUCCESS'>('INPUT');
  const [transferData, setTransferData] = useState({ buyerPin: '', buyerPhone: '' });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Vehicle Header Card */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">OWNER</span>
               <span className="text-slate-300 text-xs flex items-center gap-1"><ShieldCheck size={12}/> Verified</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{mockVehicleData.plateNumber}</h1>
            <p className="text-slate-300 font-medium">{mockVehicleData.year} {mockVehicleData.make} {mockVehicleData.model}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                 <p className="text-xs text-slate-400">Next Service</p>
                 <p className="font-bold text-green-400">Feb 15, 2024</p>
             </div>
             <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                <QrCode size={32} />
             </div>
          </div>
        </div>
        
        {/* Navigation Tabs within Card */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-2">
            {[
                { id: 'DASHBOARD', label: 'History', icon: History }, 
                { id: 'APPOINTMENTS', label: 'Bookings', icon: Calendar },
                { id: 'BILLING', label: 'Invoices', icon: CreditCard },
                { id: 'REPORTS', label: 'Reports', icon: FileText },
                { id: 'TRANSFER', label: 'Transfer', icon: Share2 },
            ].map(tab => {
                const Icon = tab.icon;
                return (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-slate-900 shadow-md' 
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </div>
        <Car size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] p-6">
        
        {/* --- DASHBOARD / HISTORY --- */}
        {activeTab === 'DASHBOARD' && (
             <div className="space-y-8 relative animate-in fade-in">
                <h3 className="font-bold text-lg text-gray-800">Service History</h3>
                <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-100"></div>
                {history.map((record, idx) => (
                    <div key={record.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm -translate-x-1/2 bg-blue-500"></div>
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
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-400">Odometer: {record.mileage.toLocaleString()} km</p>
                            {record.isVerified && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><ShieldCheck size={12}/> Verified</span>}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- APPOINTMENTS --- */}
        {activeTab === 'APPOINTMENTS' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Your Appointments</h3>
                    <button 
                        onClick={() => setShowBookingModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={16}/> Book Service
                    </button>
                </div>

                <div className="space-y-3">
                    {appointments.map(apt => (
                        <div key={apt.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-center min-w-[60px]">
                                    <span className="block text-xs font-bold uppercase">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="block text-xl font-bold">{new Date(apt.date).getDate()}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{apt.serviceType}</h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <Clock size={14}/> {apt.time} • {apt.vehiclePlate}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {apt.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- BILLING / INVOICES --- */}
        {activeTab === 'BILLING' && (
            <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg text-gray-800">Invoices & Payments</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-4">Invoice #</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="p-4 font-medium">{inv.id}</td>
                                    <td className="p-4 text-gray-500">{inv.date}</td>
                                    <td className="p-4 font-bold">KES {inv.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {inv.status === 'PENDING' ? (
                                            <button 
                                                onClick={() => { setPayingItemId(inv.id); setPaymentType('INVOICE'); }}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-800"
                                            >
                                                Pay Now
                                            </button>
                                        ) : (
                                            <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-end w-full">
                                                <Download size={14}/> PDF
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- REPORTS (PREMIUM) --- */}
        {activeTab === 'REPORTS' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-purple-50 p-4 rounded-xl flex items-start gap-3 border border-purple-100">
                    <BadgeCheck size={24} className="text-purple-600 mt-1"/>
                    <div>
                        <h4 className="font-bold text-purple-900">Verified Inspection Reports</h4>
                        <p className="text-sm text-purple-700">Download official inspection certificates and valuation reports. Some reports may require a fee to unlock.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map(rpt => (
                        <div key={rpt.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${rpt.isPaid ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {rpt.isPaid ? <FileText size={20} /> : <Lock size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{rpt.title}</h4>
                                    <p className="text-xs text-gray-500">{rpt.date} • {rpt.size}</p>
                                </div>
                            </div>
                            <div>
                                {rpt.isPaid ? (
                                    <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Download">
                                        <Download size={20}/>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => { setPayingItemId(rpt.id); setPaymentType('REPORT'); }}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                                    >
                                        Buy @ {rpt.cost}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- TRANSFER TAB --- */}
        {activeTab === 'TRANSFER' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between mb-6 px-2">
                    {['Enter Details', 'Verify', 'Done'].map((step, idx) => {
                         const stepMap = ['INPUT', 'VERIFY', 'SUCCESS'];
                         const currentIdx = stepMap.indexOf(transferStep);
                         const isActive = currentIdx >= idx;
                         return (
                            <div key={step} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                                <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{step}</span>
                            </div>
                         );
                    })}
                </div>
                {transferStep === 'INPUT' && (
                    <div className="space-y-4 max-w-md mx-auto">
                        <label className="block text-sm font-medium text-gray-700">Buyer's KRA PIN</label>
                        <input className="w-full border p-2.5 rounded-lg" placeholder="A00..." value={transferData.buyerPin} onChange={e => setTransferData({...transferData, buyerPin: e.target.value})}/>
                        
                        <label className="block text-sm font-medium text-gray-700">Buyer's Phone</label>
                        <input className="w-full border p-2.5 rounded-lg" placeholder="07..." value={transferData.buyerPhone} onChange={e => setTransferData({...transferData, buyerPhone: e.target.value})}/>
                        
                        <button onClick={() => setTransferStep('VERIFY')} disabled={!transferData.buyerPin} className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold mt-4">Review Transfer</button>
                    </div>
                )}
                {transferStep === 'VERIFY' && (
                    <div className="text-center space-y-4">
                        <p>Transferring ownership to PIN <strong>{transferData.buyerPin}</strong>.</p>
                        <button onClick={() => setTimeout(() => setTransferStep('SUCCESS'), 1000)} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">Confirm Transfer</button>
                    </div>
                )}
                {transferStep === 'SUCCESS' && (
                    <div className="text-center p-8 bg-green-50 rounded-xl">
                        <CheckCircle2 className="mx-auto text-green-500 mb-2" size={48}/>
                        <h3 className="text-xl font-bold text-green-800">Transfer Initiated!</h3>
                        <p className="text-green-700 mt-2">The buyer will receive an SMS to accept the transfer.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Booking Modal */}
      {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Book Appointment</h3>
                      <button onClick={() => setShowBookingModal(false)}><X size={20} className="text-gray-400"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Service Type</label>
                          <select className="w-full border rounded-lg p-2" value={newBooking.type} onChange={(e) => setNewBooking({...newBooking, type: e.target.value})}>
                              <option>General Service</option>
                              <option>Repair/Diagnosis</option>
                              <option>Inspection</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Preferred Date</label>
                          <input type="date" className="w-full border rounded-lg p-2" value={newBooking.date} onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Preferred Time</label>
                          <input type="time" className="w-full border rounded-lg p-2" value={newBooking.time} onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}/>
                      </div>
                      <button onClick={handleBookAppointment} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Confirm Booking</button>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Processing Modal */}
      {payingItemId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs text-center p-8">
                  {isProcessingPayment ? (
                      <div className="py-8">
                          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4"/>
                          <p className="text-gray-600 font-medium">Processing M-PESA...</p>
                      </div>
                  ) : (
                      <>
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <DollarSign size={32}/>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Confirm Payment</h3>
                        <p className="text-gray-500 mb-6 text-sm">
                            Pay {paymentType === 'REPORT' ? 'KES 2,500' : 'invoice amount'} via M-PESA?
                        </p>
                        <div className="space-y-3">
                            <button onClick={handleProcessPayment} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700">Pay Now</button>
                            <button onClick={() => setPayingItemId(null)} className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium">Cancel</button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default CustomerPortal;