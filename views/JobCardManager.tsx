import React, { useState, useEffect } from 'react';
import { Plus, Search, BrainCircuit, CheckCircle2, Clock, Wrench, ChevronRight, FileText, Calendar as CalendarIcon, User, ArrowRight, LayoutGrid, X, Package, ShoppingCart, Timer, Pause, Play, StopCircle, BadgeCheck, AlertTriangle, ClipboardList, Filter, Lock, MoreHorizontal, Stethoscope, Bell, MessageSquare, ListChecks, CalendarDays, Phone, Car, Printer, ClipboardCheck, Loader2 } from 'lucide-react';
import { JobCard, JobStatus, Appointment, ServiceBay, Product, LaborLog, Branch, UserRole, DiagnosisItem, ServicePackage, TenantSettings, StockMovement, Account, JournalEntry } from '../types';
import { diagnoseIssue, estimateRepairCost } from '../services/geminiService';

interface JobCardManagerProps {
    jobs: JobCard[];
    onUpdateJob: (job: JobCard) => void;
    onCreateJob: (job: JobCard) => void;
    inventory: Product[];
    setInventory: (products: Product[]) => void;
    onViewOrder: (orderId: string) => void;
    highlightedJobId: string | null;
    serviceBays: ServiceBay[];
    setServiceBays: (bays: ServiceBay[]) => void;
    currentBranch: Branch;
    userRole: UserRole;
    onGenerateQuote: (job: JobCard) => void;
    servicePackages?: ServicePackage[];
    onCheckIn?: (job: JobCard, mode: 'SERVICE' | 'DIAGNOSIS', servicePackageId?: string, diagnosisFee?: number) => void;
    onBookAppointment?: (appointment: Appointment, vehicleDetails?: { make: string, model: string }) => void;
    tenantSettings?: TenantSettings;
    onStartInspection?: (job: JobCard) => void;
    stockMovements?: StockMovement[];
    setStockMovements?: (movements: StockMovement[]) => void;
    chartOfAccounts?: Account[];
    setChartOfAccounts?: (accounts: Account[]) => void;
    journalEntries?: JournalEntry[];
    setJournalEntries?: (entries: JournalEntry[]) => void;
}

const JobCardManager: React.FC<JobCardManagerProps> = ({ 
    jobs, onUpdateJob, onCreateJob, inventory, setInventory, onViewOrder, highlightedJobId, 
    serviceBays, setServiceBays, currentBranch, userRole, onGenerateQuote, servicePackages = [], 
    onCheckIn, onBookAppointment, tenantSettings, onStartInspection,
    stockMovements, setStockMovements, chartOfAccounts, setChartOfAccounts, journalEntries, setJournalEntries
}) => {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'APPOINTMENTS' | 'BAYS' | 'SCHEDULE'>('JOBS');

  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'ALL'>('ALL');
  const [filterTechnician, setFilterTechnician] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowJob, setWorkflowJob] = useState<JobCard | null>(null); 
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowTab, setWorkflowTab] = useState<'OVERVIEW' | 'DIAGNOSIS' | 'PARTS' | 'LABOR'>('OVERVIEW');
  const [showReport, setShowReport] = useState(false);

  // Async States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // General save/loading state

  const [checkInMode, setCheckInMode] = useState<'SERVICE' | 'DIAGNOSIS'>('SERVICE');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [diagnosisPaid, setDiagnosisPaid] = useState(false);
  const [diagnosisFee, setDiagnosisFee] = useState(1500);

  useEffect(() => {
      if (highlightedJobId) {
          const job = jobs.find(j => j.id === highlightedJobId);
          if (job) {
              setActiveTab('JOBS');
              setWorkflowJob(job);
              setWorkflowTab('OVERVIEW');
              setIsWorkflowModalOpen(true);
          }
      }
  }, [highlightedJobId, jobs]);

  const [appointments, setAppointments] = useState<Appointment[]>([
      { id: 'APT-001', customerName: 'Alice W.', vehiclePlate: 'KBA 111A', date: '2023-11-02', time: '09:00', serviceType: 'Full Service', status: 'CONFIRMED', phone: '0712345678' },
      { id: 'APT-002', customerName: 'Bob M.', vehiclePlate: 'KCC 222B', date: '2023-11-02', time: '11:00', serviceType: 'Brake Check', status: 'PENDING', phone: '0722334455' }
  ]);
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ customerName: '', vehiclePlate: '', date: '', time: '09:00', serviceType: 'General Service', phone: '', make: '', model: '' });
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedBay, setSelectedBay] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<DiagnosisItem>>({ description: '', severity: 'MEDIUM', proposedFix: '', estimatedLaborCost: 0, estimatedPartCost: 0 });
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);

  const availableTechnicians = [
      { id: 'EMP-001', name: 'David Omondi', rate: 800 },
      { id: 'EMP-002', name: 'Samuel K.', rate: 650 },
      { id: 'EMP-004', name: 'James W.', rate: 700 }
  ];

  const getTechStatus = (techId: string) => {
      const activeJob = jobs.find(j => j.technicianId === techId && j.status === JobStatus.IN_PROGRESS && j.branchId === currentBranch.id);
      return activeJob ? { status: 'BUSY', job: activeJob } : { status: 'AVAILABLE', job: null };
  };

  const filteredJobs = jobs.filter(job => {
      if (job.branchId !== currentBranch.id) return false;
      const matchesQuery = 
          job.vehicle.plateNumber.toLowerCase().includes(filterQuery.toLowerCase()) || 
          job.vehicle.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
          job.issueDescription.toLowerCase().includes(filterQuery.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
      const matchesTech = filterTechnician === 'ALL' || job.technicianId === filterTechnician;
      return matchesQuery && matchesStatus && matchesTech;
  });

  const filteredParts = inventory.filter(p => 
      (p.name.toLowerCase().includes(partSearch.toLowerCase()) || p.sku.toLowerCase().includes(partSearch.toLowerCase())) &&
      p.branchId === currentBranch.id
  );

  const handleCreateJob = () => {
    if (!newPlate || !newModel || !newOwner) { alert("Please fill in basic vehicle details."); return; }
    const newJob: JobCard = {
      id: `JOB-${Date.now()}`, branchId: currentBranch.id,
      vehicle: { id: `V${Date.now()}`, plateNumber: newPlate.toUpperCase(), make: 'Unknown', model: newModel, year: 2020, vin: 'N/A', ownerName: newOwner },
      status: JobStatus.DIAGNOSING, entryDate: new Date().toISOString(),
      issueDescription: checkInMode === 'SERVICE' ? (servicePackages.find(p => p.id === selectedPackageId)?.name || 'Service') : newDescription,
      estimatedCost: 0, partsUsed: [], laborLogs: [], diagnosis: []
    };
    if (onCheckIn) onCheckIn(newJob, checkInMode, selectedPackageId, diagnosisPaid ? diagnosisFee : 0);
    else onCreateJob(newJob);
    setIsModalOpen(false); setNewPlate(''); setNewModel(''); setNewDescription(''); setNewOwner(''); setCheckInMode('SERVICE'); setSelectedPackageId(''); setDiagnosisPaid(false);
  };

  const openWorkflowModal = (job: JobCard) => {
      setWorkflowJob(job); setSelectedTech(job.technicianId || ''); setSelectedBay(job.bayId || ''); setWorkflowTab('OVERVIEW'); setIsWorkflowModalOpen(true); setShowReport(false);
  };

  const handleUpdateStatus = () => {
      if (!workflowJob) return;
      let updatedJob = { ...workflowJob };
      let updatedBays = [...serviceBays];

      if (workflowJob.status === JobStatus.DIAGNOSING) updatedJob.status = JobStatus.ESTIMATING;
      else if (workflowJob.status === JobStatus.ESTIMATING) updatedJob.status = JobStatus.WAITING_APPROVAL;
      else if (workflowJob.status === JobStatus.WAITING_APPROVAL) updatedJob.status = JobStatus.READY;
      else if (workflowJob.status === JobStatus.READY) {
          if (!selectedTech || !selectedBay) { alert("Please select a technician and bay."); return; }
          const tech = availableTechnicians.find(t => t.id === selectedTech);
          updatedJob.status = JobStatus.IN_PROGRESS; updatedJob.technicianId = selectedTech; updatedJob.technicianName = tech?.name; updatedJob.bayId = selectedBay;
          const bayIndex = updatedBays.findIndex(b => b.id === selectedBay);
          if (bayIndex !== -1) updatedBays[bayIndex] = { ...updatedBays[bayIndex], status: 'OCCUPIED', currentJobId: updatedJob.id };
      } else if (workflowJob.status === JobStatus.IN_PROGRESS) {
          updatedJob.status = JobStatus.COMPLETED;
          if (updatedJob.bayId) {
             const bayIndex = updatedBays.findIndex(b => b.id === updatedJob.bayId);
             if (bayIndex !== -1) updatedBays[bayIndex] = { ...updatedBays[bayIndex], status: 'AVAILABLE', currentJobId: undefined };
          }
      }
      onUpdateJob(updatedJob); setServiceBays(updatedBays); setIsWorkflowModalOpen(false);
  };

  const handleAddDiagnosisItem = () => { if(newDiagnosis.description && workflowJob) { const item: DiagnosisItem = { id: `DX-${Date.now()}`, description: newDiagnosis.description!, severity: newDiagnosis.severity as any, proposedFix: newDiagnosis.proposedFix, estimatedLaborCost: Number(newDiagnosis.estimatedLaborCost)||0, estimatedPartCost: Number(newDiagnosis.estimatedPartCost)||0 }; const updatedJob = { ...workflowJob, diagnosis: [...(workflowJob.diagnosis || []), item] }; setWorkflowJob(updatedJob); onUpdateJob(updatedJob); setNewDiagnosis({ description: '', severity: 'MEDIUM', proposedFix: '', estimatedLaborCost: 0, estimatedPartCost: 0 }); } };
  
  const handleAddPartToJob = async () => {
      if (!workflowJob || !selectedPartId) return;
      
      const partIndex = inventory.findIndex(p => p.id === selectedPartId);
      if (partIndex === -1) {
          alert("Part not found.");
          return;
      }
      
      const part = inventory[partIndex];
      
      if (part.stockLevel < addQuantity) {
          alert(`Insufficient stock! Only ${part.stockLevel} units of ${part.name} available.`);
          return;
      }

      setIsSaving(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 600)); // Simulate

        const updatedInventory = [...inventory];
        updatedInventory[partIndex] = {
            ...part,
            stockLevel: part.stockLevel - addQuantity
        };
        setInventory(updatedInventory);

        if (setStockMovements && stockMovements) {
            const movement: StockMovement = {
                id: `MV-JOB-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                productId: part.id,
                branchId: currentBranch.id,
                type: 'JOB_USAGE',
                quantity: addQuantity,
                reason: `Used on Job ${workflowJob.id} (${workflowJob.vehicle.plateNumber})`
            };
            setStockMovements([movement, ...stockMovements]);
        }

        if (setJournalEntries && journalEntries && chartOfAccounts && setChartOfAccounts) {
            const costAmount = part.buyPrice * addQuantity;
            const je: JournalEntry = {
                id: `JE-COGS-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `COGS: ${addQuantity}x ${part.name} for Job ${workflowJob.id}`,
                branchId: currentBranch.id,
                reference: workflowJob.id,
                lines: [
                    { accountId: '5000', debit: costAmount, credit: 0 }, 
                    { accountId: '1500', debit: 0, credit: costAmount }
                ]
            };
            setJournalEntries([je, ...journalEntries]);

            const updatedAccounts = chartOfAccounts.map(acc => {
                if (acc.id === '5000') return { ...acc, balance: acc.balance + costAmount }; 
                if (acc.id === '1500') return { ...acc, balance: acc.balance - costAmount }; 
                return acc;
            });
            setChartOfAccounts(updatedAccounts);
        }

        const newPartItem = { 
            productId: part.id, 
            name: part.name, 
            quantity: addQuantity, 
            cost: part.buyPrice, 
            sellPrice: part.sellPrice 
        };
        
        const updatedJob = { 
            ...workflowJob, 
            partsUsed: [...(workflowJob.partsUsed || []), newPartItem] 
        };
        
        setWorkflowJob(updatedJob);
        onUpdateJob(updatedJob);
        
        setSelectedPartId('');
        setAddQuantity(1);
        setPartSearch('');
      } finally {
        setIsSaving(false);
      }
  };

  const handleCreateAppointment = () => { setIsAptModalOpen(false); }; // Mock
  
  const handleAiDiagnose = async () => {
      if(!workflowJob) return;
      setIsAiLoading(true);
      setAiError(null);
      setAiSuggestion(null);
      
      try {
          const suggestion = await diagnoseIssue(workflowJob.vehicle.model, workflowJob.issueDescription);
          setAiSuggestion(suggestion);
      } catch (error) {
          console.error("AI Error:", error);
          setAiError("Failed to generate diagnosis. Please try again or check internet connection.");
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleGenerateQuoteAction = () => { if(workflowJob) { onGenerateQuote(workflowJob); setIsWorkflowModalOpen(false); } };
  const handleClockIn = () => { if(workflowJob) { const updatedJob = {...workflowJob, laborLogs: [...(workflowJob.laborLogs||[]), {id: `L-${Date.now()}`, technicianId: workflowJob.technicianId!, technicianName: workflowJob.technicianName!, startTime: new Date().toISOString(), hourlyRate: 500, cost: 0}]}; setWorkflowJob(updatedJob); onUpdateJob(updatedJob); }};
  const handleClockOut = (id: string) => { if(workflowJob) { const updatedJob = {...workflowJob, laborLogs: workflowJob.laborLogs?.map(l => l.id === id ? {...l, endTime: new Date().toISOString(), durationMinutes: 60, cost: 500} : l)}; setWorkflowJob(updatedJob); onUpdateJob(updatedJob!); }};

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Job Management</h2>
          <p className="text-gray-500">{currentBranch.name} Workshop</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button onClick={() => setActiveTab('JOBS')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'JOBS' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Wrench size={16} /> Job Cards
            </button>
            <button onClick={() => setActiveTab('SCHEDULE')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'SCHEDULE' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Clock size={16} /> Schedule
            </button>
            <button onClick={() => setActiveTab('BAYS')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'BAYS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <LayoutGrid size={16} /> Service Bays
            </button>
            {userRole !== 'TECHNICIAN' && (
                <button onClick={() => setActiveTab('APPOINTMENTS')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'APPOINTMENTS' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <CalendarIcon size={16} /> Appointments
                </button>
            )}
        </div>
      </header>

      {activeTab === 'BAYS' && <div className="p-4 bg-white rounded-xl text-center text-gray-400">Bay Management View</div>}
      {activeTab === 'SCHEDULE' && <div className="p-4 bg-white rounded-xl text-center text-gray-400">Schedule View</div>}
      {activeTab === 'APPOINTMENTS' && <div className="p-4 bg-white rounded-xl text-center text-gray-400">Appointments View</div>}

      {activeTab === 'JOBS' && (
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} />
            </div>
            {userRole !== 'TECHNICIAN' && (
                <button onClick={() => setIsModalOpen(true)} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm">
                <Plus size={20} /> New Check-in
                </button>
            )}
        </div>

        <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 min-w-max pb-4">
                {['DIAGNOSING', 'WAITING_APPROVAL', 'READY', 'IN_PROGRESS', 'COMPLETED'].map(status => {
                    const jobsInStatus = filteredJobs.filter(j => j.status === status || (status === 'DIAGNOSING' && j.status === JobStatus.ESTIMATING) || (status === 'COMPLETED' && j.status === JobStatus.INVOICED));
                    if (jobsInStatus.length === 0) return null;
                    return (
                        <div key={status} className="w-80 flex-shrink-0">
                            <h3 className="font-bold text-gray-700 mb-4">{status.replace('_', ' ')}</h3>
                            <div className="space-y-3">
                                {jobsInStatus.map(job => (
                                    <div key={job.id} onClick={() => openWorkflowModal(job)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md">
                                        <div className="flex justify-between font-bold text-gray-800 text-sm mb-2">
                                            <span>{job.vehicle.plateNumber}</span>
                                            <span className="text-xs text-gray-500">{new Date(job.entryDate).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">{job.issueDescription}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>
      )}

      {isModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-96"><h3 className="font-bold mb-4">Check In</h3><button onClick={handleCreateJob} className="bg-blue-600 text-white px-4 py-2 rounded">Create</button><button onClick={() => setIsModalOpen(false)} className="ml-2 text-gray-500">Cancel</button></div></div>}

      {isWorkflowModalOpen && workflowJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                      <div>
                          <h3 className="font-bold text-xl text-gray-800">
                              {showReport ? 'Job Card Report' : 'Job Workflow'}
                          </h3>
                          <p className="text-sm text-gray-500">{workflowJob.vehicle.plateNumber} • {workflowJob.vehicle.model}</p>
                      </div>
                      <div className="flex gap-2">
                          {!showReport && (
                              <button onClick={() => setShowReport(true)} className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-gray-200" title="View Report">
                                  <Printer size={20}/>
                              </button>
                          )}
                          <button onClick={() => setIsWorkflowModalOpen(false)} className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-gray-200">
                              <X size={20}/>
                          </button>
                      </div>
                  </div>

                  <div className="flex border-b border-gray-100 px-6">
                      <button 
                        onClick={() => setWorkflowTab('OVERVIEW')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 ${workflowTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                      >
                        Overview
                      </button>
                      <button 
                        onClick={() => setWorkflowTab('DIAGNOSIS')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 ${workflowTab === 'DIAGNOSIS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                      >
                        Diagnosis
                      </button>
                      <button 
                        onClick={() => setWorkflowTab('PARTS')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 ${workflowTab === 'PARTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                      >
                        Parts
                      </button>
                      <button 
                        onClick={() => setWorkflowTab('LABOR')} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 ${workflowTab === 'LABOR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                      >
                        Labor
                      </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1">
                      {workflowTab === 'OVERVIEW' && (
                          <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                  <h4 className="font-bold text-gray-700 mb-2">Job Status: {workflowJob.status.replace('_', ' ')}</h4>
                                  <p className="text-sm text-gray-600">Current Assigned Tech: {workflowJob.technicianName || 'Unassigned'}</p>
                              </div>
                              
                              {/* Link to Inspection */}
                              <div className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm">
                                  <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><ClipboardCheck size={16} className="text-blue-600"/> Vehicle Inspection</h4>
                                  {workflowJob.inspectionId ? (
                                      <div className="flex items-center justify-between">
                                          <p className="text-sm text-gray-600">Inspection linked: <span className="font-mono">{workflowJob.inspectionId}</span></p>
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                                      </div>
                                  ) : (
                                      <div className="flex justify-between items-center">
                                          <p className="text-sm text-gray-500">No inspection report started for this job.</p>
                                          {onStartInspection && (
                                              <button 
                                                  onClick={() => {
                                                      onStartInspection(workflowJob);
                                                      setIsWorkflowModalOpen(false);
                                                  }}
                                                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                                              >
                                                  Launch Inspection
                                              </button>
                                          )}
                                      </div>
                                  )}
                              </div>

                              <div className="flex gap-4">
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-gray-500 block mb-1">Status</label>
                                      <div className="font-bold text-gray-900">{workflowJob.status}</div>
                                  </div>
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-gray-500 block mb-1">Technician</label>
                                      <div className="font-bold text-gray-900">{workflowJob.technicianName || 'Unassigned'}</div>
                                  </div>
                              </div>
                              
                              <button onClick={handleUpdateStatus} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                                  Update Status
                              </button>
                              
                              {userRole !== 'TECHNICIAN' && workflowJob.status === 'WAITING_APPROVAL' && (
                                <button onClick={handleGenerateQuoteAction} className="w-full mt-2 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700">
                                    Generate Quote
                                </button>
                              )}
                          </div>
                      )}
                      
                      {workflowTab === 'DIAGNOSIS' && (
                          <div className="space-y-4">
                              {workflowJob.diagnosis?.map(d => (
                                  <div key={d.id} className="p-3 bg-gray-50 rounded border border-gray-100">
                                      <div className="flex justify-between">
                                          <span className="font-bold text-sm">{d.description}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${d.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.severity}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">Est. Labor: {d.estimatedLaborCost} | Est. Parts: {d.estimatedPartCost}</div>
                                  </div>
                              ))}
                              
                              <div className="border-t pt-4">
                                  <textarea 
                                      className="w-full border rounded p-2 text-sm" 
                                      placeholder="New Diagnosis..."
                                      value={newDiagnosis.description}
                                      onChange={e => setNewDiagnosis({...newDiagnosis, description: e.target.value})}
                                  />
                                  <button onClick={handleAddDiagnosisItem} className="mt-2 text-sm bg-gray-200 px-3 py-1 rounded">Add Diagnosis</button>
                                  <button onClick={handleAiDiagnose} disabled={isAiLoading} className="mt-2 ml-2 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded flex items-center gap-1 inline-flex disabled:opacity-50">
                                      {isAiLoading ? <Loader2 size={14} className="animate-spin"/> : <BrainCircuit size={14} />} {isAiLoading ? 'Thinking...' : 'AI Assist'}
                                  </button>
                              </div>
                              {aiSuggestion && (
                                  <div className="bg-purple-50 p-3 rounded border border-purple-100 text-sm text-purple-800">
                                      <strong>AI Suggestion:</strong> {aiSuggestion}
                                  </div>
                              )}
                          </div>
                      )}

                      {workflowTab === 'PARTS' && (
                          <div className="space-y-4">
                               {workflowJob.partsUsed?.map(p => (
                                   <div key={p.productId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                       <span className="text-sm">{p.name} (x{p.quantity})</span>
                                       <span className="text-sm font-bold">KES {p.sellPrice * p.quantity}</span>
                                   </div>
                               ))}
                               <div className="border-t pt-4">
                                   <select className="w-full border rounded p-2 text-sm" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)} disabled={isSaving}>
                                       <option value="">Select Part</option>
                                       {inventory.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stockLevel})</option>)}
                                   </select>
                                   <input 
                                     type="number" 
                                     className="w-full border rounded p-2 text-sm mt-2" 
                                     value={addQuantity} 
                                     onChange={e => setAddQuantity(Number(e.target.value))}
                                     min={1}
                                     disabled={isSaving}
                                   />
                                   <button 
                                    onClick={handleAddPartToJob} 
                                    disabled={!selectedPartId || isSaving}
                                    className="mt-2 w-full bg-blue-600 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                   >
                                       {isSaving && <Loader2 size={14} className="animate-spin"/>} Add Part
                                   </button>
                               </div>
                          </div>
                      )}

                      {workflowTab === 'LABOR' && (
                          <div className="space-y-4">
                              {workflowJob.laborLogs?.map(l => (
                                  <div key={l.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div className="text-sm">
                                          <div>{l.technicianName}</div>
                                          <div className="text-xs text-gray-500">{new Date(l.startTime).toLocaleTimeString()} - {l.endTime ? new Date(l.endTime).toLocaleTimeString() : 'Active'}</div>
                                      </div>
                                      {!l.endTime && <button onClick={() => handleClockOut(l.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Stop</button>}
                                  </div>
                              ))}
                              <button onClick={handleClockIn} className="w-full bg-green-600 text-white py-2 rounded text-sm font-bold">Clock In</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default JobCardManager;