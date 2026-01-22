import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Package, ShoppingCart, Truck, AlertTriangle, ArrowDown, ArrowUp, X, LayoutGrid, List, Trash2, Save, BadgeDollarSign, PieChart, ClipboardList, CheckSquare, FileText, Repeat, Warehouse, Loader2 } from 'lucide-react';
import { Product, Supplier, PurchaseOrder, PartCategory, CostingMethod, GoodsReceipt, Branch, StockMovement, UserRole, JournalEntry, Account } from '../types';

interface InventoryManagerProps {
    products: Product[];
    setProducts: (products: Product[]) => void;
    currentBranch: Branch;
    branches: Branch[];
    userRole: UserRole;
    stockMovements: StockMovement[];
    setStockMovements: (movements: StockMovement[]) => void;
    journalEntries?: JournalEntry[];
    setJournalEntries?: (entries: JournalEntry[]) => void;
    chartOfAccounts?: Account[];
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, setProducts, currentBranch, branches, userRole, stockMovements, setStockMovements, journalEntries, setJournalEntries, chartOfAccounts }) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'SUPPLIERS' | 'PO' | 'RECEIPTS' | 'MOVEMENTS'>('STOCK');
  const [supplierViewMode, setSupplierViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // --- Loading & Error States ---
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Force Technicians to Stock view only if they try to switch
  useEffect(() => {
      if (userRole === 'TECHNICIAN' && activeTab !== 'STOCK' && activeTab !== 'MOVEMENTS') {
          setActiveTab('STOCK');
      }
  }, [userRole, activeTab]);

  // --- Mock Data (Suppliers/POs remain local for now) ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 'SUP-001', name: 'Nairobi Auto Spares Ltd', contactPerson: 'James M.', phone: '0722000000', email: 'sales@nas.co.ke', paymentTerms: 'NET30', balanceOwing: 45000 },
    { id: 'SUP-002', name: 'Japan Parts Direct', contactPerson: 'Kenji', phone: '0733000000', email: 'orders@jpd.com', paymentTerms: 'COD', balanceOwing: 0 },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    { id: 'PO-1001', supplierId: 'SUP-001', dateCreated: '2023-10-20', status: 'RECEIVED', totalCost: 45000, items: [{ productId: 'P-001', quantity: 10, unitCost: 2800 }] },
    { id: 'PO-1002', supplierId: 'SUP-002', dateCreated: '2023-10-25', status: 'ORDERED', totalCost: 19500, items: [{ productId: 'P-003', quantity: 3, unitCost: 6500 }] }
  ]);

  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([
    { id: 'GRN-501', poId: 'PO-1001', supplierId: 'SUP-001', dateCreated: '2023-10-22', dateReceived: '2023-10-22', deliveryNoteNumber: 'DN-8842', items: [{ productId: 'P-001', quantityReceived: 10, unitCost: 2800 }], totalValue: 28000, status: 'BILLED' }
  ]);

  // ... (Other state: Product Forms, Transfer Modal, PO Creation, etc. same as before)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product> & { brandInput: string, modelInput: string }>({ name: '', sku: '', brand: '', category: 'SERVICE_PARTS', brandInput: '', modelInput: '', stockLevel: 0, minStockLevel: undefined, buyPrice: 0, sellPrice: 0, supplierId: '', location: '', costingMethod: 'WEIGHTED_AVERAGE', isTaxable: true, branchId: currentBranch.id });
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ toBranchId: '', productId: '', quantity: 0 });
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [newPO, setNewPO] = useState<{ supplierId: string; items: { productId: string; quantity: number; unitCost: number }[]; }>({ supplierId: '', items: [] });
  const [poItemInput, setPoItemInput] = useState<{ productId: string; quantity: number }>({ productId: '', quantity: 1 });
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [grnDeliveryNote, setGrnDeliveryNote] = useState('');
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({}); 
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PartCategory | 'ALL'>('ALL');
  
  const branchProducts = products.filter(p => p.branchId === currentBranch.id);
  const filteredProducts = branchProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const totalInventoryValue = branchProducts.reduce((sum, p) => sum + (p.stockLevel * p.buyPrice), 0);

  // --- Handlers ---

  const handleStockTransfer = async () => { /* ... (Same as before) ... */
      if(!transferData.toBranchId || !transferData.productId || transferData.quantity <= 0) return;
      if(transferData.toBranchId === currentBranch.id) { setError("Cannot transfer to same branch."); return; }
      setIsBusy(true); setError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const sourceProd = products.find(p => p.id === transferData.productId);
        if(!sourceProd || sourceProd.stockLevel < transferData.quantity) { setError("Insufficient stock for transfer."); setIsBusy(false); return; }
        const destBranchName = branches.find(b => b.id === transferData.toBranchId)?.name;
        const sourceBranchName = currentBranch.name;
        const destProd = products.find(p => p.sku === sourceProd.sku && p.branchId === transferData.toBranchId);
        let updatedProducts = [...products];
        let newMovements = [...stockMovements];
        updatedProducts = updatedProducts.map(p => p.id === sourceProd.id ? { ...p, stockLevel: p.stockLevel - transferData.quantity } : p);
        newMovements.push({ id: `MV-OUT-${Date.now()}`, date: new Date().toISOString().split('T')[0], productId: sourceProd.id, branchId: currentBranch.id, type: 'TRANSFER_OUT', quantity: transferData.quantity, reason: `Transfer to ${destBranchName}`, });
        if (destProd) {
            updatedProducts = updatedProducts.map(p => p.id === destProd.id ? { ...p, stockLevel: p.stockLevel + transferData.quantity } : p);
            newMovements.push({ id: `MV-IN-${Date.now()}`, date: new Date().toISOString().split('T')[0], productId: destProd.id, branchId: transferData.toBranchId, type: 'TRANSFER_IN', quantity: transferData.quantity, reason: `Transfer from ${sourceBranchName}`, });
        } else {
            const newDestProd: Product = { ...sourceProd, id: `P-${Date.now()}-T${Math.floor(Math.random() * 100)}`, branchId: transferData.toBranchId, stockLevel: transferData.quantity, location: 'Receiving' };
            updatedProducts.push(newDestProd);
            newMovements.push({ id: `MV-IN-${Date.now()}`, date: new Date().toISOString().split('T')[0], productId: newDestProd.id, branchId: transferData.toBranchId, type: 'TRANSFER_IN', quantity: transferData.quantity, reason: `Transfer from ${sourceBranchName} (New Item)`, });
        }
        setStockMovements(newMovements);
        setProducts(updatedProducts);
        setIsTransferModalOpen(false);
        setTransferData({ toBranchId: '', productId: '', quantity: 0 });
      } catch (err) { setError("Transfer failed. Please try again."); } finally { setIsBusy(false); }
  };
  
  const openReceiveModal = (po: PurchaseOrder) => {
      setReceivingPO(po); setGrnDeliveryNote(''); const qtyMap: Record<string, number> = {}; po.items.forEach(item => { qtyMap[item.productId] = item.quantity; }); setReceiveQuantities(qtyMap); setIsReceiveModalOpen(true);
  };

  const submitGoodsReceipt = async () => {
    if (!receivingPO || !grnDeliveryNote) return;
    setIsBusy(true); setError(null);
    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        // 1. Create GRN
        const receivedItems = receivingPO.items.map(item => ({ productId: item.productId, quantityReceived: receiveQuantities[item.productId] || 0, unitCost: item.unitCost })).filter(i => i.quantityReceived > 0);
        const totalValue = receivedItems.reduce((acc, item) => acc + (item.quantityReceived * item.unitCost), 0);
        const grn: GoodsReceipt = { id: `GRN-${Date.now().toString().slice(-6)}`, poId: receivingPO.id, supplierId: receivingPO.supplierId, dateCreated: new Date().toISOString().split('T')[0], dateReceived: new Date().toISOString().split('T')[0], deliveryNoteNumber: grnDeliveryNote, items: receivedItems, totalValue: totalValue, status: 'PENDING_BILL' };
        setGoodsReceipts([grn, ...goodsReceipts]);

        // 2. Update Stock Levels
        const updatedProducts = [...products];
        const newMovements: StockMovement[] = [];
        receivedItems.forEach(item => {
            const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (prodIndex !== -1) {
                updatedProducts[prodIndex] = { ...updatedProducts[prodIndex], stockLevel: updatedProducts[prodIndex].stockLevel + item.quantityReceived };
                newMovements.push({ id: `MV-${Date.now()}-${item.productId}`, date: new Date().toISOString().split('T')[0], productId: item.productId, branchId: currentBranch.id, type: 'PURCHASE', quantity: item.quantityReceived, referenceId: grn.id });
            }
        });
        setProducts(updatedProducts);
        setStockMovements([...newMovements, ...stockMovements]);

        // 3. Update PO Status
        const updatedPOs = purchaseOrders.map(p => p.id === receivingPO.id ? { ...p, status: 'RECEIVED' as const } : p);
        setPurchaseOrders(updatedPOs);

        // 4. POST TO GL (Inventory Asset vs Accounts Payable)
        if (setJournalEntries && journalEntries) {
            const je: JournalEntry = {
                id: `JE-GRN-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `Goods Received - PO #${receivingPO.id}`,
                branchId: currentBranch.id,
                lines: [
                    { accountId: '1500', debit: totalValue, credit: 0 }, // DR Inventory Asset
                    { accountId: '2000', debit: 0, credit: totalValue }  // CR Accounts Payable
                ]
            };
            setJournalEntries([je, ...journalEntries]);
        }

        setIsReceiveModalOpen(false);
        setActiveTab('RECEIPTS');
    } catch (err) { setError("Failed to process GRN."); } finally { setIsBusy(false); }
  };

  const openAddModal = () => { /* ... */ setIsProductModalOpen(true); };
  const handleSaveProduct = async () => { /* ... */ setIsProductModalOpen(false); };
  const handleCreatePO = async () => { /* ... */ setIsCreatePOModalOpen(false); };
  const handleAddPOItem = () => { /* ... */ };

  const tabs = [{ id: 'STOCK', icon: Package, label: 'Stock List', restricted: false }, { id: 'MOVEMENTS', icon: Repeat, label: 'Movements', restricted: false }, { id: 'PO', icon: ShoppingCart, label: 'Purchases', restricted: true }, { id: 'RECEIPTS', icon: ClipboardList, label: 'GRNs', restricted: true }, { id: 'SUPPLIERS', icon: Truck, label: 'Suppliers', restricted: true }];

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div><h2 className="text-3xl font-bold text-gray-800">Inventory Management</h2><p className="text-gray-500">Branch: <span className="font-semibold text-blue-600">{currentBranch.name}</span></p></div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">{tabs.filter(tab => !tab.restricted || userRole !== 'TECHNICIAN').map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}><tab.icon size={16} /> {tab.label}</button>))}</div>
      </header>

      {/* Global Error Banner */}
      {error && (<div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in"><AlertTriangle size={20} className="shrink-0"/><p className="text-sm font-medium">{error}</p><button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded"><X size={16}/></button></div>)}

      {/* --- STOCK LIST VIEW --- */}
      {activeTab === 'STOCK' && (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
            {/* Valuation Summary - Hidden for Technicians */}
            {userRole !== 'TECHNICIAN' && (<div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between"><div className="flex items-center gap-4"><div className="bg-green-100 p-3 rounded-full text-green-700"><BadgeDollarSign size={24} /></div><div><p className="text-sm text-gray-500 font-medium">Branch Inventory Value</p><h3 className="text-xl font-bold text-gray-900">KES {totalInventoryValue.toLocaleString()}</h3></div></div></div>)}
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white"><div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search Part Name, SKU..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>{userRole !== 'TECHNICIAN' && (<div className="flex gap-2"><button onClick={() => setIsTransferModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Repeat size={16} /> Transfer Stock</button><button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus size={16} /> Add Product</button></div>)}</div>
            {/* Table */}
            <div className="flex-1 overflow-auto"><table className="w-full text-left"><thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider sticky top-0"><tr><th className="p-4">Product Details</th><th className="p-4">Category</th><th className="p-4">Stock</th><th className="p-4">Location (Bin)</th>{userRole !== 'TECHNICIAN' && <th className="p-4">Asset Value</th>}{userRole !== 'TECHNICIAN' && <th className="p-4">Action</th>}</tr></thead><tbody className="divide-y divide-gray-100">{filteredProducts.map(p => (<tr key={p.id} className="hover:bg-gray-50/50"><td className="p-4"><p className="font-bold text-gray-900 text-sm">{p.name}</p><p className="text-xs text-blue-600 font-medium mb-0.5">{p.brand}</p><p className="text-xs text-gray-500 font-mono">SKU: {p.sku}</p></td><td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">{p.category.replace('_', ' ')}</span></td><td className="p-4"><div className="flex items-center gap-2"><span className={`font-bold ${p.minStockLevel !== undefined && p.stockLevel <= p.minStockLevel ? 'text-red-600' : 'text-gray-800'}`}>{p.stockLevel}</span>{p.minStockLevel !== undefined && p.stockLevel <= p.minStockLevel && (<AlertTriangle size={14} className="text-red-500" />)}</div><p className="text-[10px] text-gray-400">Min: {p.minStockLevel ?? 'N/A'}</p></td><td className="p-4 text-sm font-mono text-gray-600">{p.location || 'Unassigned'}</td>{userRole !== 'TECHNICIAN' && (<td className="p-4"><div className="font-medium text-gray-800 text-sm">KES {(p.stockLevel * p.buyPrice).toLocaleString()}</div></td>)}{userRole !== 'TECHNICIAN' && (<td className="p-4"><button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button></td>)}</tr>))}</tbody></table></div>
        </div>
      )}

      {/* --- MOVEMENTS TAB (AUDIT LOG) --- */}
      {activeTab === 'MOVEMENTS' && (
          <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in"><div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Stock Movement Log</h3><p className="text-xs text-gray-500 mt-1">Audit trail for {currentBranch.name}</p></div><div className="overflow-auto flex-1"><table className="w-full text-left"><thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase sticky top-0"><tr><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Product</th><th className="p-4 text-center">Qty</th><th className="p-4">Reference / Reason</th></tr></thead><tbody className="divide-y divide-gray-100">{stockMovements.filter(m => m.branchId === currentBranch.id).map(move => { const prod = products.find(p => p.id === move.productId); return (<tr key={move.id} className="hover:bg-gray-50"><td className="p-4 text-sm text-gray-500">{move.date}</td><td className="p-4"><span className={`text-xs px-2 py-1 rounded font-bold ${['PURCHASE', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(move.type) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{move.type}</span></td><td className="p-4 font-medium text-sm">{prod?.name || 'Unknown Item'}</td><td className="p-4 text-center font-mono font-bold">{move.quantity}</td><td className="p-4 text-sm text-gray-600">{move.reason || move.referenceId}</td></tr>); })}</tbody></table></div></div>
      )}

      {/* --- PO & RECEIPT TABS OMITTED FOR BREVITY --- */}
      {activeTab === 'RECEIPTS' && (
          <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Goods Received Notes (GRN)</h3></div>
              <div className="overflow-auto flex-1">
                  <table className="w-full text-left"><thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase sticky top-0"><tr><th className="p-4">GRN #</th><th className="p-4">PO Ref</th><th className="p-4">Supplier</th><th className="p-4">Date Received</th><th className="p-4">Total Value</th><th className="p-4">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                      {goodsReceipts.map(grn => {
                          const supplier = suppliers.find(s => s.id === grn.supplierId);
                          return (
                              <tr key={grn.id} className="hover:bg-gray-50"><td className="p-4 font-medium text-gray-900">{grn.id}</td><td className="p-4 text-sm text-blue-600">{grn.poId}</td><td className="p-4 text-sm text-gray-600">{supplier?.name}</td><td className="p-4 text-sm text-gray-500">{grn.dateReceived}</td><td className="p-4 font-bold text-gray-900">KES {grn.totalValue.toLocaleString()}</td><td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{grn.status}</span></td></tr>
                          );
                      })}
                  </tbody></table>
              </div>
          </div>
      )}
      
      {/* ... Modals (Transfer, PO, Receive) ... */}
      {isReceiveModalOpen && receivingPO && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"><div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-xl text-gray-800">Receive Goods (GRN)</h3><button onClick={() => setIsReceiveModalOpen(false)}><X size={24} className="text-gray-400"/></button></div><div className="p-6 space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note Number</label><input type="text" className="w-full border rounded-lg p-2.5" value={grnDeliveryNote} onChange={e => setGrnDeliveryNote(e.target.value)} placeholder="Enter vendor delivery note ref"/></div><div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-100 text-gray-600"><tr><th className="p-3 text-left">Item</th><th className="p-3 text-right">Ordered</th><th className="p-3 text-right">Received</th></tr></thead><tbody>{receivingPO.items.map((item, idx) => { const prod = products.find(p => p.id === item.productId); return (<tr key={idx} className="border-b border-gray-100 last:border-0"><td className="p-3">{prod?.name}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3"><input type="number" className="w-20 border rounded p-1 text-right" value={receiveQuantities[item.productId] || 0} onChange={(e) => setReceiveQuantities({...receiveQuantities, [item.productId]: parseInt(e.target.value) || 0})}/></td></tr>); })}</tbody></table></div></div><div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50"><button onClick={() => setIsReceiveModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-600">Cancel</button><button onClick={submitGoodsReceipt} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700" disabled={isBusy}>{isBusy ? <Loader2 size={16} className="animate-spin"/> : <CheckSquare size={16}/>} Confirm Receipt</button></div></div>
          </div>
      )}
    </div>
  );
};

export default InventoryManager;