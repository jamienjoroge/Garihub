import React, { useState } from 'react';
import { Save, Building, Landmark, Bell, Shield, Upload, Mail, Phone, MapPin, Wrench, FileText, Plus, Trash2, Server, Wifi, WifiOff, Key, Lock, FileKey } from 'lucide-react';
import { Branch, ServiceBay } from '../types';

interface SettingsManagerProps {
    branches?: Branch[];
    setBranches?: (branches: Branch[]) => void;
    serviceBays?: ServiceBay[];
    setServiceBays?: (bays: ServiceBay[]) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ branches = [], setBranches, serviceBays = [], setServiceBays }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'BRANCHES' | 'WORKSHOP' | 'TAX' | 'DOCS'>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);

  // --- Profile State ---
  const [garageProfile, setGarageProfile] = useState({
    name: 'GariHub Motors Ltd',
    phone: '0722 123 456',
    email: 'info@garihub.co.ke',
    address: 'Industrial Area, Funzi Rd',
    website: 'www.garihub.co.ke',
    logoUrl: ''
  });

  // --- Tax State ---
  const [taxConfig, setTaxConfig] = useState({
    kraPin: 'P051234567Z',
    vatRate: 16,
    currency: 'KES',
    enableStockTax: true
  });

  // --- e-TIMS State ---
  const [etimsConfig, setEtimsConfig] = useState({
      enabled: true,
      environment: 'SANDBOX', // SANDBOX | PRODUCTION
      deviceSerial: 'BAZ-8839201',
      unitId: '00000000000',
      clientKey: '',
      clientSecret: '',
      certPass: '',
      isConnected: false,
      lastSync: 'Never'
  });

  // --- Document State ---
  const [docConfig, setDocConfig] = useState({
      invoicePrefix: 'INV-',
      quotePrefix: 'QT-',
      poPrefix: 'PO-',
      termsAndConditions: 'All goods remain property of GariHub until paid in full. Warranty void if seal broken.',
      footerText: 'Thank you for your business!'
  });

  // --- Local States for Add Modals (Inline) ---
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLoc, setNewBranchLoc] = useState('');
  const [newBayName, setNewBayName] = useState('');
  const [newBayType, setNewBayType] = useState<ServiceBay['type']>('GENERAL');

  // --- Handlers ---

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call persistence
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleTestEtims = () => {
      setIsSaving(true); // Re-using loading state for button
      setTimeout(() => {
          setEtimsConfig(prev => ({ 
              ...prev, 
              isConnected: true, 
              lastSync: new Date().toLocaleString() 
          }));
          setIsSaving(false);
          alert("Connection to KRA OSCU Server successful!");
      }, 2000);
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
        <p className="text-gray-500">Manage company profile, branches, workshop resources, and system settings.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 h-full">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
            {[
              { id: 'PROFILE', label: 'Garage Profile', icon: Building },
              { id: 'BRANCHES', label: 'Branch Management', icon: MapPin },
              { id: 'WORKSHOP', label: 'Workshop Layout', icon: Wrench },
              { id: 'TAX', label: 'Tax & e-TIMS', icon: Landmark },
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
              
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                    <Upload size={24} className="text-gray-400"/>
                </div>
                <div>
                    <h4 className="font-medium text-gray-900">Company Logo</h4>
                    <p className="text-sm text-gray-500">Used on Invoices and Job Cards.</p>
                    <button className="text-blue-600 text-sm font-medium mt-1">Upload New</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        value={garageProfile.name} 
                        onChange={(e) => setGarageProfile({...garageProfile, name: e.target.value})}
                        className="w-full pl-10 border rounded-lg p-2.5" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Contact</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        value={garageProfile.phone}
                        onChange={(e) => setGarageProfile({...garageProfile, phone: e.target.value})} 
                        className="w-full pl-10 border rounded-lg p-2.5" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="email" 
                        value={garageProfile.email} 
                        onChange={(e) => setGarageProfile({...garageProfile, email: e.target.value})}
                        className="w-full pl-10 border rounded-lg p-2.5" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        value={garageProfile.address} 
                        onChange={(e) => setGarageProfile({...garageProfile, address: e.target.value})}
                        className="w-full pl-10 border rounded-lg p-2.5" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- BRANCHES TAB --- */}
          {activeTab === 'BRANCHES' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-xl font-bold text-gray-800">Branch Configuration</h3>
                      <span className="text-sm text-gray-500">Multi-tenant Setup</span>
                  </div>

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
                  <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-xl font-bold text-gray-800">Workshop Layout</h3>
                      <p className="text-sm text-gray-500">Configure Service Bays & Workstations</p>
                  </div>

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
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                      bay.type === 'LIFT' ? 'bg-indigo-100 text-indigo-700' :
                                      bay.type === 'PIT' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>{bay.type}</span>
                              </div>
                              <button 
                                  onClick={() => handleDeleteBay(bay.id)}
                                  className="text-gray-400 hover:text-red-500"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- TAX & E-TIMS TAB --- */}
          {activeTab === 'TAX' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-800">Financial Compliance</h3>
                  <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${etimsConfig.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {etimsConfig.isConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
                          {etimsConfig.isConnected ? 'OSCU Connected' : 'OSCU Disconnected'}
                      </span>
                  </div>
              </div>

              {/* Basic Tax Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN Number</label>
                  <input 
                    type="text" 
                    value={taxConfig.kraPin}
                    onChange={(e) => setTaxConfig({...taxConfig, kraPin: e.target.value})}
                    className="w-full border rounded-lg p-2.5 uppercase font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default VAT Rate (%)</label>
                  <input 
                    type="number" 
                    value={taxConfig.vatRate}
                    onChange={(e) => setTaxConfig({...taxConfig, vatRate: Number(e.target.value)})}
                    className="w-full border rounded-lg p-2.5" 
                  />
                </div>
              </div>

              {/* e-TIMS Configuration Panel */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-800">
                          <Server size={18} />
                          <h4 className="font-bold">e-TIMS Device Configuration</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={etimsConfig.enabled} 
                            onChange={e => setEtimsConfig({...etimsConfig, enabled: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-2 text-sm font-medium text-gray-900">Enable Integration</span>
                      </label>
                  </div>
                  
                  {etimsConfig.enabled && (
                      <div className="p-6 space-y-5">
                          {/* Environment Toggle */}
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">System Environment</label>
                              <div className="flex p-1 bg-white border border-gray-300 rounded-lg w-fit">
                                  <button 
                                    onClick={() => setEtimsConfig({...etimsConfig, environment: 'SANDBOX'})}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${etimsConfig.environment === 'SANDBOX' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}
                                  >
                                      Sandbox (Test)
                                  </button>
                                  <button 
                                    onClick={() => setEtimsConfig({...etimsConfig, environment: 'PRODUCTION'})}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${etimsConfig.environment === 'PRODUCTION' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}
                                  >
                                      Production
                                  </button>
                              </div>
                          </div>

                          {/* Device IDs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Serial Number</label>
                                  <div className="relative">
                                      <Server size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                      <input 
                                          type="text" 
                                          value={etimsConfig.deviceSerial} 
                                          onChange={(e) => setEtimsConfig({...etimsConfig, deviceSerial: e.target.value})}
                                          className="w-full pl-10 border rounded-lg p-2.5 font-mono text-sm"
                                          placeholder="e.g. BAZ-XXXXXXXX"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Payer Unit ID</label>
                                  <input 
                                      type="text" 
                                      value={etimsConfig.unitId} 
                                      onChange={(e) => setEtimsConfig({...etimsConfig, unitId: e.target.value})}
                                      className="w-full border rounded-lg p-2.5 font-mono text-sm"
                                      placeholder="Assigned Unit ID"
                                  />
                              </div>
                          </div>

                          {/* API Credentials */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">OSCU Client Key</label>
                                  <div className="relative">
                                      <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                      <input 
                                          type="password" 
                                          value={etimsConfig.clientKey} 
                                          onChange={(e) => setEtimsConfig({...etimsConfig, clientKey: e.target.value})}
                                          className="w-full pl-10 border rounded-lg p-2.5 font-mono text-sm"
                                          placeholder="••••••••••••••••"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">OSCU Client Secret</label>
                                  <div className="relative">
                                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                      <input 
                                          type="password" 
                                          value={etimsConfig.clientSecret} 
                                          onChange={(e) => setEtimsConfig({...etimsConfig, clientSecret: e.target.value})}
                                          className="w-full pl-10 border rounded-lg p-2.5 font-mono text-sm"
                                          placeholder="••••••••••••••••"
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* Certificate Upload */}
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Digital Certificate (.p12/.pfx)</label>
                              <div className="flex gap-4">
                                  <div className="flex-1 flex items-center gap-2 border rounded-lg p-2.5 bg-white text-gray-500 text-sm">
                                      <FileKey size={16} />
                                      <span>certificate_ke.p12</span>
                                  </div>
                                  <button className="bg-white border border-gray-300 text-gray-700 px-4 rounded-lg text-sm font-medium hover:bg-gray-50">
                                      Browse
                                  </button>
                              </div>
                              <div className="mt-2">
                                  <input 
                                      type="password" 
                                      value={etimsConfig.certPass} 
                                      onChange={(e) => setEtimsConfig({...etimsConfig, certPass: e.target.value})}
                                      className="w-full md:w-1/2 border rounded-lg p-2.5 text-sm"
                                      placeholder="Certificate Password"
                                  />
                              </div>
                          </div>

                          {/* Action Footer */}
                          <div className="flex justify-between items-center pt-2">
                              <p className="text-xs text-gray-500">
                                  Last Sync: <span className="font-mono">{etimsConfig.lastSync}</span>
                              </p>
                              <button 
                                  onClick={handleTestEtims}
                                  disabled={isSaving}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors ${
                                      etimsConfig.isConnected 
                                      ? 'bg-green-100 text-green-700 border border-green-200' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                              >
                                  {isSaving ? 'Connecting...' : etimsConfig.isConnected ? <><Shield size={16}/> Secured</> : 'Test Connectivity'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* Other Tax Settings */}
              <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-white">
                      <input 
                        type="checkbox" 
                        checked={taxConfig.enableStockTax}
                        onChange={(e) => setTaxConfig({...taxConfig, enableStockTax: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded" 
                      />
                      <div>
                          <p className="font-medium text-gray-900">Apply VAT to Inventory Purchasing</p>
                          <p className="text-xs text-gray-500">Include input tax in inventory valuation calculations.</p>
                      </div>
                  </label>
              </div>
            </div>
          )}

          {/* --- DOCS TAB --- */}
          {activeTab === 'DOCS' && (
              <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Document Sequences & Content</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                          <input 
                              type="text" 
                              className="w-full border rounded-lg p-2.5 font-mono"
                              value={docConfig.invoicePrefix}
                              onChange={(e) => setDocConfig({...docConfig, invoicePrefix: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quote Prefix</label>
                          <input 
                              type="text" 
                              className="w-full border rounded-lg p-2.5 font-mono"
                              value={docConfig.quotePrefix}
                              onChange={(e) => setDocConfig({...docConfig, quotePrefix: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PO Prefix</label>
                          <input 
                              type="text" 
                              className="w-full border rounded-lg p-2.5 font-mono"
                              value={docConfig.poPrefix}
                              onChange={(e) => setDocConfig({...docConfig, poPrefix: e.target.value})}
                          />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions (Footer)</label>
                      <textarea 
                          className="w-full border rounded-lg p-3 min-h-[100px]"
                          value={docConfig.termsAndConditions}
                          onChange={(e) => setDocConfig({...docConfig, termsAndConditions: e.target.value})}
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