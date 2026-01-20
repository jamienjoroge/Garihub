import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, FileText, CheckCircle2, X, Printer, Send, Search, Trash2, Calendar, User, Briefcase, DollarSign, ArrowRight, ClipboardList, Wrench, PackageCheck } from 'lucide-react';
import { Invoice, Quotation, SalesOrder, InvoiceItem, Branch } from '../types';

interface SalesManagerProps {
    salesOrders: SalesOrder[];
    setSalesOrders: (orders: SalesOrder[]) => void;
    quotations: Quotation[];
    setQuotations: (quotes: Quotation[]) => void;
    onCreateJob: (order: SalesOrder) => void;
    onViewJob: (jobId: string) => void;
    highlightedOrderId: string | null;
    currentBranch: Branch;
    onRecordPayment: (invoice: Invoice) => void;
}

const SalesManager: React.FC<SalesManagerProps> = ({ salesOrders, setSalesOrders, quotations, setQuotations, onCreateJob, onViewJob, highlightedOrderId, currentBranch, onRecordPayment }) => {
  const [activeTab, setActiveTab] = useState<'QUOTATIONS' | 'ORDERS' | 'INVOICES'>('ORDERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle auto-switching to Order tab if highlightedOrderId is present
  useEffect(() => {
      if (highlightedOrderId) {
          setActiveTab('ORDERS');
      }
  }, [highlightedOrderId]);

  // --- Mock Data for Local Items ---
  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
        id: 'INV-2024-001', 
        branchId: 'BR-HQ',
        customerName: 'John Kamau', 
        jobId: 'JOB-2024-001', 
        amount: 12500, 
        date: '2023-10-25', 
        dueDate: '2023-11-25', 
        status: 'PAID', 
        paymentMethod: 'MPESA', 
        items: [{ description: 'Suspension Repair', quantity: 1, unitCost: 12500, total: 12500 }] 
    }
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
      customerName: '',
      jobId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ id: Date.now(), description: '', quantity: 1, unitCost: 0 }]
  });

  // --- WORKFLOW HANDLERS ---

  // 1. Convert Quote -> Sales Order
  const handleConvertQuoteToOrder = (quote: Quotation) => {
      const newOrder: SalesOrder = {
          id: `SO-${Date.now().toString().slice(-4)}`,
          quotationId: quote.id,
          jobCardId: quote.jobId, // Pass linked Job ID if exists
          branchId: quote.branchId,
          customerName: quote.customerName,
          vehiclePlate: quote.vehiclePlate,
          date: new Date().toISOString().split('T')[0],
          totalAmount: quote.amount,
          status: quote.jobId ? 'JOB_IN_PROGRESS' : 'PENDING_JOB', // If coming from a job, it's already in progress
          items: quote.items
      };

      setSalesOrders([newOrder, ...salesOrders]);
      setQuotations(quotations.map(q => q.id === quote.id ? { ...q, status: 'CONVERTED' } : q));
      
      // If it has a Job ID, we need to notify the parent app to update the Job status too, 
      // but SalesOrder creation logic in App.tsx handles job updates if we call the createJob handler.
      // However, here we are just creating the order. The App level handler `handleCreateJobFromOrder` handles logic.
      // In this specific flow (Diagnosis -> Quote -> Order), the Job ALREADY exists.
      // We trigger the callback to update the existing job state.
      if (quote.jobId) {
          onCreateJob(newOrder); // Reuse this to update the existing job linkage
      }

      setActiveTab('ORDERS');
  };

  // 2. Order -> Invoice
  const handleGenerateInvoiceFromOrder = (order: SalesOrder) => {
      const invoice: Invoice = {
          id: `INV-${Date.now().toString().slice(-4)}`,
          salesOrderId: order.id,
          branchId: order.branchId,
          customerName: order.customerName,
          jobId: order.jobCardId || 'JOB-LINKED',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: order.totalAmount,
          status: 'PENDING',
          items: order.items
      };

      setInvoices([invoice, ...invoices]);
      
      const updatedOrders = salesOrders.map(so => 
        so.id === order.id ? { ...so, status: 'INVOICED' as const } : so
      );
      setSalesOrders(updatedOrders);
      
      setActiveTab('INVOICES');
  };

  // --- Invoice Creation Helpers ---
  const handleAddItem = () => {
      setNewInvoiceData({
          ...newInvoiceData,
          items: [...newInvoiceData.items, { id: Date.now(), description: '', quantity: 1, unitCost: 0 }]
      });
  };

  const handleRemoveItem = (id: number) => {
      if (newInvoiceData.items.length === 1) return; 
      setNewInvoiceData({
          ...newInvoiceData,
          items: newInvoiceData.items.filter(item => item.id !== id)
      });
  };

  const handleItemChange = (id: number, field: string, value: string | number) => {
      setNewInvoiceData({
          ...newInvoiceData,
          items: newInvoiceData.items.map(item => {
              if (item.id === id) {
                  return { ...item, [field]: value };
              }
              return item;
          })
      });
  };

  const calculateTotals = () => {
      const subtotal = newInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
      const vat = subtotal * 0.16;
      const total = subtotal + vat;
      return { subtotal, vat, total };
  };

  const handleSaveInvoice = () => {
      if (!newInvoiceData.customerName) {
          alert('Please fill in all required fields.');
          return;
      }
      const { total } = calculateTotals();
      const invoice: Invoice = {
          id: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
          customerName: newInvoiceData.customerName,
          branchId: currentBranch.id, // Assign current branch
          jobId: newInvoiceData.jobId || 'N/A',
          date: newInvoiceData.date,
          dueDate: newInvoiceData.dueDate,
          amount: total,
          status: 'PENDING',
          items: newInvoiceData.items.map(i => ({
              description: i.description,
              quantity: i.quantity,
              unitCost: i.unitCost,
              total: i.quantity * i.unitCost
          }))
      };
      setInvoices([invoice, ...invoices]);
      setShowCreateInvoiceModal(false);
  };

  const handleLocalRecordPayment = () => {
    if (selectedInvoice) {
        // Call the parent handler to update global GL/Accounts
        onRecordPayment(selectedInvoice);

        // Update local state to reflect paid status immediately in UI
        const updatedInvoices = invoices.map(inv => 
            inv.id === selectedInvoice.id ? { ...inv, status: 'PAID', paymentMethod: 'MPESA' } as Invoice : inv
        );
        setInvoices(updatedInvoices);
        
        setShowPaymentModal(false);
        setSelectedInvoice(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'ACCEPTED': return 'bg-green-100 text-green-700';
      case 'CONVERTED': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'SENT': return 'bg-blue-100 text-blue-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'INVOICED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const { subtotal, vat, total } = calculateTotals();

  // Filtering by Branch
  const branchFilteredInvoices = invoices.filter(inv => inv.branchId === currentBranch.id);
  const branchFilteredQuotations = quotations.filter(qt => qt.branchId === currentBranch.id);
  const branchFilteredOrders = salesOrders.filter(so => so.branchId === currentBranch.id);

  // Search Filtering
  const filteredInvoices = branchFilteredInvoices.filter(inv => 
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredQuotations = branchFilteredQuotations.filter(qt => 
    qt.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    qt.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOrders = branchFilteredOrders.filter(so => 
    so.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    so.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales & Invoicing</h2>
          <p className="text-gray-500">{currentBranch.name} • Order-to-Cash Workflow</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('QUOTATIONS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'QUOTATIONS' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <FileText size={16} /> Quotes
            </button>
            <button 
                onClick={() => setActiveTab('ORDERS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ORDERS' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <ClipboardList size={16} /> Orders
            </button>
            <button 
                onClick={() => setActiveTab('INVOICES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'INVOICES' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <DollarSign size={16} /> Invoices
            </button>
        </div>
      </header>

      {/* --- QUOTATIONS TAB --- */}
      {activeTab === 'QUOTATIONS' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col animate-in fade-in">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                  type="text" 
                  placeholder="Search quotations..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <button className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-purple-700">
                <Plus size={16} /> New Estimate
            </button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm sticky top-0">
              <tr>
                <th className="p-4">Quote #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotations.map((qt) => (
                <tr key={qt.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-900">{qt.id}</td>
                  <td className="p-4 text-gray-700">
                      {qt.customerName}
                      {qt.jobId && <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">From Diagnosis</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{qt.vehiclePlate}</td>
                  <td className="p-4 text-sm text-gray-500">{qt.date}</td>
                  <td className="p-4 font-bold text-gray-900">KES {qt.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(qt.status)}`}>
                      {qt.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                     {qt.status === 'ACCEPTED' && (
                        <button 
                            onClick={() => handleConvertQuoteToOrder(qt)}
                            className="text-white bg-orange-500 hover:bg-orange-600 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm"
                        >
                            Convert to Order <ArrowRight size={12}/>
                        </button>
                     )}
                     {qt.status === 'DRAFT' && (
                         <button className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 bg-blue-50 px-2 py-1.5 rounded">
                             Send to Customer
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

      {/* ... (Orders and Invoices tabs remain largely same but benefit from prop data) ... */}
      {/* --- SALES ORDERS TAB --- */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col animate-in fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search orders..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
                {filteredOrders.map(order => (
                    <div 
                        key={order.id} 
                        className={`border rounded-xl p-5 hover:shadow-md transition-all relative overflow-hidden ${
                            highlightedOrderId === order.id ? 'border-blue-400 shadow-lg bg-blue-50/50 ring-2 ring-blue-200' : 'border-gray-200'
                        }`}
                    >
                        {/* Status Bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                            order.status === 'READY_TO_INVOICE' ? 'bg-green-500' :
                            order.status === 'INVOICED' ? 'bg-gray-300' : 'bg-blue-500'
                        }`}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    {order.id} 
                                    {order.quotationId && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 rounded">From {order.quotationId}</span>}
                                </h4>
                                <p className="text-sm text-gray-600">{order.customerName} • {order.vehiclePlate}</p>
                            </div>
                            <span className="font-bold text-lg text-gray-800">KES {order.totalAmount.toLocaleString()}</span>
                        </div>

                        {/* Progress Stepper */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg">
                             <div className={`flex items-center gap-1 ${order.status === 'PENDING_JOB' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                 <ClipboardList size={14} /> Order
                             </div>
                             <ArrowRight size={12} className="text-gray-300"/>
                             <div className={`flex items-center gap-1 ${['JOB_IN_PROGRESS', 'JOB_COMPLETED', 'READY_TO_INVOICE', 'INVOICED'].includes(order.status) ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                 <Wrench size={14} /> Job
                             </div>
                             <ArrowRight size={12} className="text-gray-300"/>
                             <div className={`flex items-center gap-1 ${order.status === 'READY_TO_INVOICE' || order.status === 'INVOICED' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                                 <PackageCheck size={14} /> Complete
                             </div>
                             <ArrowRight size={12} className="text-gray-300"/>
                             <div className={`flex items-center gap-1 ${order.status === 'INVOICED' ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>
                                 <DollarSign size={14} /> Invoiced
                             </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-2">
                            {order.status === 'PENDING_JOB' && (
                                <button
                                    onClick={() => onCreateJob(order)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                                >
                                    Convert to Job <ArrowRight size={12}/>
                                </button>
                            )}
                            {order.status === 'JOB_IN_PROGRESS' && (
                                <button 
                                    onClick={() => onViewJob(order.jobCardId!)}
                                    className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50 flex items-center gap-1"
                                >
                                    View Job <ArrowRight size={12}/>
                                </button>
                            )}
                            {order.status === 'READY_TO_INVOICE' && (
                                <button 
                                    onClick={() => handleGenerateInvoiceFromOrder(order)}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1 shadow-sm"
                                >
                                    Generate Invoice <DollarSign size={12}/>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* ... (Invoice Tab and Modals) ... */}
      {/* --- INVOICES TAB --- */}
      {activeTab === 'INVOICES' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col animate-in fade-in">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search invoices..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setShowCreateInvoiceModal(true)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-700"
                >
                    <Plus size={16} /> New Invoice
                </button>
             </div>
             <div className="overflow-auto flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm sticky top-0">
                      <tr>
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-medium text-gray-900">{inv.id}</td>
                          <td className="p-4 text-gray-700">
                              <div>{inv.customerName}</div>
                              <div className="text-xs text-gray-500">{inv.jobId}</div>
                          </td>
                          <td className="p-4 text-sm text-gray-500">{inv.date}</td>
                          <td className="p-4 text-sm text-gray-500">{inv.dueDate}</td>
                          <td className="p-4 font-bold text-gray-900">KES {inv.amount.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(inv.status)}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2">
                             <button className="text-gray-400 hover:text-blue-600 p-1" title="Print"><Printer size={16} /></button>
                             <button className="text-gray-400 hover:text-blue-600 p-1" title="Email"><Send size={16} /></button>
                             {inv.status === 'PENDING' && (
                                 <button 
                                    onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true); }}
                                    className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2 py-1 rounded hover:bg-green-100"
                                 >
                                     Pay
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

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-xl text-gray-800">Create New Invoice</h3>
                      <button onClick={() => setShowCreateInvoiceModal(false)}><X size={24} className="text-gray-400" /></button>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                              <input 
                                  type="text" 
                                  className="w-full border rounded-lg p-2.5" 
                                  value={newInvoiceData.customerName}
                                  onChange={(e) => setNewInvoiceData({...newInvoiceData, customerName: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Related Job ID (Optional)</label>
                              <input 
                                  type="text" 
                                  className="w-full border rounded-lg p-2.5" 
                                  value={newInvoiceData.jobId}
                                  onChange={(e) => setNewInvoiceData({...newInvoiceData, jobId: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                              <input 
                                  type="date" 
                                  className="w-full border rounded-lg p-2.5" 
                                  value={newInvoiceData.date}
                                  onChange={(e) => setNewInvoiceData({...newInvoiceData, date: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                              <input 
                                  type="date" 
                                  className="w-full border rounded-lg p-2.5" 
                                  value={newInvoiceData.dueDate}
                                  onChange={(e) => setNewInvoiceData({...newInvoiceData, dueDate: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                          <h4 className="font-bold text-gray-800 mb-2">Line Items</h4>
                          <div className="space-y-2">
                              {newInvoiceData.items.map((item) => (
                                  <div key={item.id} className="flex gap-2 items-start">
                                      <input 
                                          type="text" 
                                          placeholder="Description" 
                                          className="flex-1 border rounded-lg p-2 text-sm"
                                          value={item.description}
                                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                      />
                                      <input 
                                          type="number" 
                                          placeholder="Qty" 
                                          className="w-16 border rounded-lg p-2 text-sm"
                                          value={item.quantity}
                                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                      />
                                      <input 
                                          type="number" 
                                          placeholder="Price" 
                                          className="w-24 border rounded-lg p-2 text-sm"
                                          value={item.unitCost}
                                          onChange={(e) => handleItemChange(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                      />
                                      <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                              <button onClick={handleAddItem} className="text-sm text-blue-600 font-medium hover:underline">+ Add Item</button>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg flex justify-end">
                          <div className="text-right space-y-1">
                              <p className="text-sm text-gray-500">Subtotal: KES {subtotal.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">VAT (16%): KES {vat.toLocaleString()}</p>
                              <p className="font-bold text-lg text-gray-900">Total: KES {total.toLocaleString()}</p>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button onClick={() => setShowCreateInvoiceModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600">Cancel</button>
                      <button onClick={handleSaveInvoice} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">Create Invoice</button>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                   <div className="p-6 text-center">
                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                           <DollarSign size={32} />
                       </div>
                       <h3 className="font-bold text-xl text-gray-900 mb-2">Record Payment</h3>
                       <p className="text-gray-500 mb-6">
                           Confirm payment of <span className="font-bold text-gray-900">KES {selectedInvoice.amount.toLocaleString()}</span> for Invoice #{selectedInvoice.id}?
                       </p>
                       <div className="flex gap-3">
                           <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium">Cancel</button>
                           <button onClick={handleLocalRecordPayment} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">Confirm Paid</button>
                       </div>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default SalesManager;