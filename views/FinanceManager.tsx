import React, { useState } from 'react';
import { Plus, Filter, CreditCard, Banknote, Landmark, ArrowUpRight, ArrowDownLeft, X, PieChart, TrendingUp, FileText, BookOpen, ScrollText, Building2, MapPin } from 'lucide-react';
import { Expense, Account, JournalEntry, Branch } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface FinanceManagerProps {
    currentBranch: Branch;
    chartOfAccounts: Account[];
    setChartOfAccounts: (accounts: Account[]) => void;
    journalEntries: JournalEntry[];
    setJournalEntries: (entries: JournalEntry[]) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ currentBranch, chartOfAccounts, setChartOfAccounts, journalEntries, setJournalEntries }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GL' | 'JOURNAL' | 'COA'>('OVERVIEW');
  const [reportScope, setReportScope] = useState<'BRANCH' | 'CONSOLIDATED'>('BRANCH');

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState<{
      description: string;
      lines: { accountId: string; debit: number; credit: number }[];
  }>({
      description: '',
      lines: [
          { accountId: '', debit: 0, credit: 0 },
          { accountId: '', debit: 0, credit: 0 }
      ]
  });

  const profitLossData = [
      { month: 'Jul', revenue: 850000, expenses: 620000 },
      { month: 'Aug', revenue: 920000, expenses: 680000 },
      { month: 'Sep', revenue: 890000, expenses: 650000 },
      { month: 'Oct', revenue: 1250000, expenses: 750000 },
  ];

  // --- Logic for Consolidation vs Branch View ---
  const filteredJournalEntries = journalEntries.filter(je => 
      reportScope === 'CONSOLIDATED' ? true : je.branchId === currentBranch.id
  );

  const getMetrics = () => {
      // If Consolidated, we use the Master COA balances (assuming they represent the total truth from backend)
      if (reportScope === 'CONSOLIDATED') {
          return {
              assets: chartOfAccounts.filter(a => a.type === 'ASSET').reduce((s, a) => s + a.balance, 0),
              liabilities: chartOfAccounts.filter(a => a.type === 'LIABILITY').reduce((s, a) => s + a.balance, 0),
              equity: chartOfAccounts.filter(a => a.type === 'EQUITY').reduce((s, a) => s + a.balance, 0),
          };
      } 
      // If Branch, we calculate solely from the Branch's Journal Entries to ensure data integrity
      else {
          const balances: Record<string, number> = { ASSET: 0, LIABILITY: 0, EQUITY: 0 };
          
          filteredJournalEntries.forEach(je => {
              je.lines.forEach(line => {
                  const acc = chartOfAccounts.find(a => a.id === line.accountId);
                  if(!acc) return;
                  
                  // Accounting Equation Direction
                  if (['ASSET', 'EXPENSE'].includes(acc.type)) {
                      balances[acc.type] = (balances[acc.type] || 0) + (line.debit - line.credit);
                  } else {
                      balances[acc.type] = (balances[acc.type] || 0) + (line.credit - line.debit);
                  }
              });
          });
          
          return {
              assets: balances['ASSET'],
              liabilities: balances['LIABILITY'],
              equity: balances['EQUITY']
          };
      }
  };

  const metrics = getMetrics();

  // --- Handlers ---

  const handlePostJournal = () => {
      // Validate: Debits must equal Credits
      const totalDebit = newJournalEntry.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = newJournalEntry.lines.reduce((sum, l) => sum + l.credit, 0);

      if (totalDebit !== totalCredit) {
          alert(`Unbalanced Entry! Debits: ${totalDebit}, Credits: ${totalCredit}`);
          return;
      }
      if (totalDebit === 0) {
          alert("Entry cannot be zero.");
          return;
      }

      const entry: JournalEntry = {
          id: `JE-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: newJournalEntry.description,
          branchId: currentBranch.id, // Journal Entries are ALWAYS Branch-Level
          lines: newJournalEntry.lines
      };

      setJournalEntries([entry, ...journalEntries]);
      
      // Update Global Account Balances (Accumulating the effect)
      const updatedAccounts = [...chartOfAccounts];
      entry.lines.forEach(line => {
          const accIndex = updatedAccounts.findIndex(a => a.id === line.accountId);
          if(accIndex > -1) {
              const acc = updatedAccounts[accIndex];
              if(['ASSET', 'EXPENSE'].includes(acc.type)) {
                  acc.balance += (line.debit - line.credit);
              } else {
                  acc.balance += (line.credit - line.debit);
              }
          }
      });
      setChartOfAccounts(updatedAccounts);

      setShowJournalModal(false);
      setNewJournalEntry({ description: '', lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }] });
  };

  const addJournalLine = () => {
      setNewJournalEntry({
          ...newJournalEntry,
          lines: [...newJournalEntry.lines, { accountId: '', debit: 0, credit: 0 }]
      });
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
      const updatedLines = newJournalEntry.lines.map((line, i) => {
          if (i === index) return { ...line, [field]: value };
          return line;
      });
      setNewJournalEntry({ ...newJournalEntry, lines: updatedLines });
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Finance & Accounting</h2>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
              {reportScope === 'BRANCH' ? <MapPin size={14}/> : <Building2 size={14}/>}
              <p className="text-sm">
                  {reportScope === 'BRANCH' ? `Branch View: ${currentBranch.name}` : 'Consolidated Tenant View'}
              </p>
          </div>
        </div>
        
        <div className="flex gap-4">
            {/* Scope Toggle */}
            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                <button
                    onClick={() => setReportScope('BRANCH')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        reportScope === 'BRANCH' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Branch Level
                </button>
                <button
                    onClick={() => setReportScope('CONSOLIDATED')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        reportScope === 'CONSOLIDATED' ? 'bg-indigo-900 text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Tenant Consolidated
                </button>
            </div>

            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <PieChart size={16} /> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('GL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'GL' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <BookOpen size={16} /> General Ledger
                </button>
                <button 
                    onClick={() => setActiveTab('JOURNAL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'JOURNAL' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <ScrollText size={16} /> Journal
                </button>
                <button 
                    onClick={() => setActiveTab('COA')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'COA' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Landmark size={16} /> COA
                </button>
            </div>
        </div>
      </header>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-in fade-in">
              {/* Report Context Banner */}
              <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${reportScope === 'CONSOLIDATED' ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-white border-gray-200 text-gray-600'}`}>
                  <Filter size={16}/> 
                  Viewing <strong>{reportScope === 'CONSOLIDATED' ? 'All Entities' : currentBranch.name}</strong> Financial Position.
                  {reportScope === 'BRANCH' && <span className="text-xs text-gray-400 ml-auto">Derived from Branch Journal Entries</span>}
                  {reportScope === 'CONSOLIDATED' && <span className="text-xs text-indigo-400 ml-auto">Aggregated Tenant Balances</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Landmark size={24}/></div>
                     <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Asset Value</span>
                  </div>
                  <p className="text-sm text-gray-500">Total Assets</p>
                  <h3 className="text-2xl font-bold text-gray-900">KES {metrics.assets.toLocaleString()}</h3>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ArrowUpRight size={24}/></div>
                  </div>
                  <p className="text-sm text-gray-500">Total Liabilities</p>
                  <h3 className="text-2xl font-bold text-gray-900">KES {metrics.liabilities.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Banknote size={24}/></div>
                  </div>
                  <p className="text-sm text-gray-500">Net Equity</p>
                  <h3 className="text-2xl font-bold text-gray-900">KES {metrics.equity.toLocaleString()}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-600"/> Revenue vs Expenses
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={profitLossData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                            <RechartsTooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          </div>
      )}

      {/* --- CHART OF ACCOUNTS TAB (Tenant Level) --- */}
      {activeTab === 'COA' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col animate-in fade-in">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-600"/>
                      <h3 className="font-bold text-gray-700">Master Chart of Accounts</h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Tenant Level</span>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline">Download Master Structure</button>
              </div>
              <div className="overflow-auto flex-1">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0">
                          <tr>
                              <th className="p-4">Code</th>
                              <th className="p-4">Account Name</th>
                              <th className="p-4">Type</th>
                              <th className="p-4">Subtype</th>
                              <th className="p-4 text-right">Global Balance</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {chartOfAccounts.sort((a,b) => a.code.localeCompare(b.code)).map(account => (
                              <tr key={account.id} className="hover:bg-gray-50">
                                  <td className="p-4 font-mono text-gray-500">{account.code}</td>
                                  <td className="p-4 font-medium text-gray-900">{account.name}</td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                          account.type === 'ASSET' ? 'bg-green-100 text-green-700' :
                                          account.type === 'LIABILITY' ? 'bg-red-100 text-red-700' :
                                          account.type === 'INCOME' ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-700'
                                      }`}>
                                          {account.type}
                                      </span>
                                  </td>
                                  <td className="p-4 text-gray-500">{account.subtype}</td>
                                  <td className="p-4 text-right font-bold font-mono">
                                      {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- JOURNAL & GL TABS --- */}
      {(activeTab === 'JOURNAL' || activeTab === 'GL') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col animate-in fade-in">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-700">{activeTab === 'GL' ? 'General Ledger' : 'Journal Entries'}</h3>
                      {reportScope === 'BRANCH' && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Filtered: {currentBranch.name}</span>}
                  </div>
                  {activeTab === 'JOURNAL' && (
                      <button 
                        onClick={() => setShowJournalModal(true)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800"
                      >
                          <Plus size={16} /> New Entry
                      </button>
                  )}
              </div>
              
              <div className="overflow-auto flex-1 p-4 space-y-4">
                  {filteredJournalEntries.length > 0 ? (
                      filteredJournalEntries.map(entry => (
                          <div key={entry.id} className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-200">
                                  <div>
                                      <span className="font-bold text-gray-800 mr-3">{entry.date}</span>
                                      <span className="text-gray-600 font-medium">{entry.description}</span>
                                      <span className="text-xs text-gray-400 ml-2">#{entry.id}</span>
                                  </div>
                                  <span className={`text-xs border px-2 py-1 rounded ${entry.branchId === currentBranch.id ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                      {entry.branchId}
                                  </span>
                              </div>
                              <table className="w-full text-sm">
                                  <thead>
                                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                                          <th className="p-2 text-left w-1/2">Account</th>
                                          <th className="p-2 text-right">Debit</th>
                                          <th className="p-2 text-right">Credit</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {entry.lines.map((line, idx) => {
                                          const account = chartOfAccounts.find(a => a.id === line.accountId);
                                          return (
                                              <tr key={idx} className="hover:bg-slate-50">
                                                  <td className="p-2 pl-4">
                                                      <span className="font-medium text-gray-700">{account?.name || line.accountId}</span>
                                                      <span className="text-xs text-gray-400 ml-2 font-mono">{account?.code}</span>
                                                  </td>
                                                  <td className="p-2 text-right font-mono">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                                                  <td className="p-2 text-right font-mono">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-12 text-gray-400">
                          <ScrollText size={48} className="mx-auto mb-2 opacity-20"/>
                          <p>No journal entries found for this view scope.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Manual Journal Entry Modal */}
      {showJournalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-xl text-gray-800">New Manual Journal Entry</h3>
                      <button onClick={() => setShowJournalModal(false)}><X size={24} className="text-gray-400" /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-4">
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm border border-blue-100">
                          <MapPin size={16}/>
                          Posting to Branch: <strong>{currentBranch.name}</strong> (Branch-Level Entry)
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description / Memo</label>
                          <input 
                              type="text" 
                              className="w-full border rounded-lg p-2.5" 
                              placeholder="e.g. Depreciation of Equipment"
                              value={newJournalEntry.description}
                              onChange={(e) => setNewJournalEntry({...newJournalEntry, description: e.target.value})}
                          />
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                              <thead className="bg-gray-100 text-gray-600 font-bold">
                                  <tr>
                                      <th className="p-3 text-left">Account</th>
                                      <th className="p-3 text-right w-32">Debit</th>
                                      <th className="p-3 text-right w-32">Credit</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {newJournalEntry.lines.map((line, idx) => (
                                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                                          <td className="p-2">
                                              <select 
                                                  className="w-full border-none bg-transparent focus:ring-0"
                                                  value={line.accountId}
                                                  onChange={(e) => updateJournalLine(idx, 'accountId', e.target.value)}
                                              >
                                                  <option value="">Select Account</option>
                                                  {chartOfAccounts.map(acc => (
                                                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                  ))}
                                              </select>
                                          </td>
                                          <td className="p-2">
                                              <input 
                                                  type="number" 
                                                  className="w-full text-right border rounded p-1" 
                                                  value={line.debit}
                                                  onChange={(e) => updateJournalLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                                                  disabled={line.credit > 0}
                                              />
                                          </td>
                                          <td className="p-2">
                                              <input 
                                                  type="number" 
                                                  className="w-full text-right border rounded p-1" 
                                                  value={line.credit}
                                                  onChange={(e) => updateJournalLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                                                  disabled={line.debit > 0}
                                              />
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          <button onClick={addJournalLine} className="w-full py-2 text-center text-blue-600 hover:bg-blue-50 text-sm font-medium border-t border-gray-200">
                              + Add Line
                          </button>
                      </div>

                      <div className="flex justify-between items-center text-sm font-bold p-2 bg-blue-50 rounded-lg">
                          <span>Totals</span>
                          <div className="flex gap-8 mr-4">
                              <span className={newJournalEntry.lines.reduce((s,l) => s + l.debit, 0) !== newJournalEntry.lines.reduce((s,l) => s + l.credit, 0) ? 'text-red-600' : 'text-green-600'}>
                                  DR: {newJournalEntry.lines.reduce((s,l) => s + l.debit, 0).toLocaleString()}
                              </span>
                              <span className={newJournalEntry.lines.reduce((s,l) => s + l.debit, 0) !== newJournalEntry.lines.reduce((s,l) => s + l.credit, 0) ? 'text-red-600' : 'text-green-600'}>
                                  CR: {newJournalEntry.lines.reduce((s,l) => s + l.credit, 0).toLocaleString()}
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button onClick={() => setShowJournalModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600">Cancel</button>
                      <button onClick={handlePostJournal} className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">Post Entry</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FinanceManager;