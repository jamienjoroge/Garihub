import React, { useState } from 'react';
import { Save, Building, Landmark, Bell, Shield, Upload, Mail, Phone, MapPin, Wrench, FileText, Plus, Trash2, Server, Wifi, WifiOff, Key, Lock, FileKey } from 'lucide-react';
import { Branch, ServiceBay, TenantSettings } from '../types';

interface SettingsManagerProps {
    branches?: Branch[];
    setBranches?: (branches: Branch[]) => void;
    serviceBays?: ServiceBay[];
    setServiceBays?: (bays: ServiceBay[]) => void;
    tenantSettings?: TenantSettings;
    setTenantSettings?: (settings: TenantSettings) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ branches = [], setBranches, serviceBays = [], setServiceBays, tenantSettings, setTenantSettings }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'BRANCHES' | 'WORKSHOP' | 'TAX' | 'DOCS'>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);

  // Local state for inline adding
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLoc, setNewBranchLoc] = useState('');
  const [newBayName, setNewBayName] = useState('');
  const [newBayType, setNewBayType] = useState<ServiceBay['type']>('GENERAL');

  // Guard if settings not passed
  if (!tenantSettings || !setTenantSettings) return <div>Loading Settings...</div>;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleAddBranch = () => {
      if (newBranchName && setBranches) {
          const newBranch: Branch = {
              id: `BR-${Date.now()}`,
              name: newBranchName,
              location: newBranchLoc || 'Nairobi',
              isHeadquarters: false
          };
          setBranches([...branches, newBranch]);
          setNewBranchName('');
          setNewBranchLoc('');
      }
  };

  const handleDeleteBranch = (id: string) => {
      if (setBranches) {
          if (confirm('Are you sure? This may affect linked inventory and employees.')) {
              setBranches(branches.filter(b => b.id !== id));
          }
      }
  };

  const handleAddBay = () => {
      if (newBayName && setServiceBays) {
          const newBay: ServiceBay = {
              id: `BAY-${Date.now()}`,
              name: newBayName,
              type: newBayType,
              status: 'AVAILABLE'
          };
          setServiceBays([...serviceBays, newBay]);
          setNewBayName('');
      }
  };

  const handleDeleteBay = (id: string) => {
      if (setServiceBays) {
          setServiceBays(serviceBays.filter(b => b.id !== id));
      }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">ERP Configuration</h2>
        <p className="text-gray-500">Manage company profile, branches, workshop resources, and tenant settings.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 h-full">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
            {[
              { id: 'PROFILE', label: 'Garage Profile', icon: Building },
              { id: 'BRANCHES', label: 'Branch Management', icon: MapPin },
              { id: 'WORKSHOP', label: 'Workshop Layout', icon: Wrench },
              { id: 'TAX', label: 'Tax & Compliance', icon: Landmark },
              { id: 'DOCS', label: 'Documents', icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-8 overflow-y-auto">
          
          {/* --- PROFILE TAB --- */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Garage Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input 
                      type="text" 
                      value={tenantSettings.name} 
                      onChange={(e) => setTenantSettings({...tenantSettings, name: e.target.value})}
                      className="w-full border rounded-lg p-2.5" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Contact</label>
                  <input 
                      type="text" 
                      value={tenantSettings.phone}
                      onChange={(e) => setTenantSettings({...tenantSettings, phone: e.target.value})} 
                      className="w-full border rounded-lg p-2.5" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                      type="email" 
                      value={tenantSettings.email} 
                      onChange={(e) => setTenantSettings({...tenantSettings, email: e.target.value})}
                      className="w-full border rounded-lg p-2.5" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                  <input 
                      type="text" 
                      value={tenantSettings.address} 
                      onChange={(e) => setTenantSettings({...tenantSettings, address: e.target.value})}
                      className="w-full border rounded-lg p-2.5" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- BRANCHES TAB --- */}
          {activeTab === 'BRANCHES' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Add New Branch</h4>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              placeholder="Branch Name (e.g. Mombasa Rd)" 
                              className="flex-1 border rounded-lg p-2.5 text-sm"
                              value={newBranchName}
                              onChange={(e) => setNewBranchName(e.target.value)}
                          />
                          <input 
                              type="text" 
                              placeholder="Location / City" 
                              className="w-1/3 border rounded-lg p-2.5 text-sm"
                              value={newBranchLoc}
                              onChange={(e) => setNewBranchLoc(e.target.value)}
                          />
                          <button 
                              onClick={handleAddBranch}
                              className="bg-slate-900 text-white px-4 rounded-lg text-sm font-medium hover:bg-slate-800"
                          >
                              Add
                          </button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {branches.map(branch => (
                          <div key={branch.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${branch.isHeadquarters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                      <Building size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900">{branch.name}</h4>
                                      <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/> {branch.location}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  {branch.isHeadquarters && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">HQ</span>}
                                  {!branch.isHeadquarters && (
                                      <button 
                                        onClick={() => handleDeleteBranch(branch.id)}
                                        className="text-red-400 hover:text-red-600 p-1 rounded"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- WORKSHOP TAB --- */}
          {activeTab === 'WORKSHOP' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Add Service Bay</h4>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              placeholder="Bay Name (e.g. Lift 3)" 
                              className="flex-1 border rounded-lg p-2.5 text-sm"
                              value={newBayName}
                              onChange={(e) => setNewBayName(e.target.value)}
                          />
                          <select 
                              className="border rounded-lg p-2.5 text-sm bg-white"
                              value={newBayType}
                              onChange={(e) => setNewBayType(e.target.value as any)}
                          >
                              <option value="GENERAL">General Bay</option>
                              <option value="LIFT">Hydraulic Lift</option>
                              <option value="PIT">Inspection Pit</option>
                              <option value="WASH">Wash Area</option>
                          </select>
                          <button 
                              onClick={handleAddBay}
                              className="bg-slate-900 text-white px-4 rounded-lg text-sm font-medium hover:bg-slate-800"
                          >
                              Add
                          </button>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceBays.map(bay => (
                          <div key={bay.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                              <div>
                                  <h4 className="font-bold text-gray-800">{bay.name}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${bay.type === 'LIFT' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>{bay.type}</span>
                              </div>
                              <button onClick={() => handleDeleteBay(bay.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- TAX TAB --- */}
          {activeTab === 'TAX' && (
            <div className="space-y-8 animate-in fade-in">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Financial Compliance</h3>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Shield size={20} className="text-blue-600 mt-1"/>
                  <div>
                      <h4 className="font-bold text-blue-900">Tenant-Specific Compliance</h4>
                      <p className="text-sm text-blue-700">Settings here affect how tax is calculated on invoices and reports for your tenant instance.</p>
                  </div>
              </div>

              <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
                      <input 
                        type="checkbox" 
                        checked={tenantSettings.tax.enabled}
                        onChange={(e) => setTenantSettings({...tenantSettings, tax: {...tenantSettings.tax, enabled: e.target.checked}})}
                        className="w-5 h-5 text-blue-600 rounded" 
                      />
                      <div>
                          <p className="font-medium text-gray-900">Enable VAT Calculation</p>
                          <p className="text-xs text-gray-500">Automatically apply tax to invoices based on rate.</p>
                      </div>
                  </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN Number</label>
                  <input 
                    type="text" 
                    value={tenantSettings.tax.pin}
                    onChange={(e) => setTenantSettings({...tenantSettings, tax: {...tenantSettings.tax, pin: e.target.value}})}
                    className="w-full border rounded-lg p-2.5 uppercase font-mono" 
                  />
                </div>
                {tenantSettings.tax.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                      <input 
                        type="number" 
                        value={tenantSettings.tax.rate}
                        onChange={(e) => setTenantSettings({...tenantSettings, tax: {...tenantSettings.tax, rate: Number(e.target.value)}})}
                        className="w-full border rounded-lg p-2.5" 
                      />
                    </div>
                )}
              </div>

              {/* Invoice Numbering Config */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                  <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase flex items-center gap-2">
                      <FileKey size={16}/> Invoice Numbering (KRA Friendly)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                          <input 
                              type="text" 
                              value={tenantSettings.invoiceConfig.prefix}
                              onChange={(e) => setTenantSettings({
                                  ...tenantSettings, 
                                  invoiceConfig: { ...tenantSettings.invoiceConfig, prefix: e.target.value }
                              })}
                              className="w-full border rounded-lg p-2.5"
                              placeholder="e.g. INV-2024-"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Next Sequence Number</label>
                          <input 
                              type="number" 
                              value={tenantSettings.invoiceConfig.sequence}
                              onChange={(e) => setTenantSettings({
                                  ...tenantSettings, 
                                  invoiceConfig: { ...tenantSettings.invoiceConfig, sequence: parseInt(e.target.value) }
                              })}
                              className="w-full border rounded-lg p-2.5"
                          />
                          <p className="text-xs text-gray-500 mt-1">This will be the ID of the next invoice generated.</p>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* --- DOCS TAB --- */}
          {activeTab === 'DOCS' && (
              <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Document Content</h3>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions (Footer)</label>
                      <textarea 
                          className="w-full border rounded-lg p-3 min-h-[100px]"
                          value={tenantSettings.invoiceTerms}
                          onChange={(e) => setTenantSettings({...tenantSettings, invoiceTerms: e.target.value})}
                      />
                  </div>
              </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button 
                onClick={handleSave}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-70"
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : <><Save size={18} /> Save Config</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;