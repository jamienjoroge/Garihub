import React, { useState, useEffect } from 'react';
import { Plus, Search, BrainCircuit, CheckCircle2, Clock, Wrench, ChevronRight, FileText, Calendar as CalendarIcon, User, ArrowRight, LayoutGrid, X, Package, ShoppingCart, Timer, Pause, Play, StopCircle, BadgeCheck, AlertTriangle, ClipboardList, Filter, Lock, MoreHorizontal, Stethoscope, Bell, MessageSquare, ListChecks, CalendarDays, Phone, Car } from 'lucide-react';
import { JobCard, JobStatus, Appointment, ServiceBay, Product, LaborLog, Branch, UserRole, DiagnosisItem, ServicePackage } from '../types';
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
    // New Props for Check-in Logic
    servicePackages?: ServicePackage[];
    onCheckIn?: (job: JobCard, mode: 'SERVICE' | 'DIAGNOSIS', servicePackageId?: string, diagnosisFee?: number) => void;
    onBookAppointment?: (appointment: Appointment, vehicleDetails?: { make: string, model: string }) => void;
}

const JobCardManager: React.FC<JobCardManagerProps> = ({ jobs, onUpdateJob, onCreateJob, inventory, setInventory, onViewOrder, highlightedJobId, serviceBays, setServiceBays, currentBranch, userRole, onGenerateQuote, servicePackages = [], onCheckIn, onBookAppointment }) => {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'APPOINTMENTS' | 'BAYS' | 'SCHEDULE'>('JOBS');

  // --- Filter States ---
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'ALL'>('ALL');
  const [filterTechnician, setFilterTechnician] = useState<string>('ALL');

  // --- Job Workflow States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowJob, setWorkflowJob] = useState<JobCard | null>(null); 
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowTab, setWorkflowTab] = useState<'OVERVIEW' | 'DIAGNOSIS' | 'PARTS' | 'LABOR'>('OVERVIEW');

  // --- Check-In Modal States ---
  const [checkInMode, setCheckInMode] = useState<'SERVICE' | 'DIAGNOSIS'>('SERVICE');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [diagnosisPaid, setDiagnosisPaid] = useState(false);
  const [diagnosisFee, setDiagnosisFee] = useState(1500);

  // Auto-open modal if highlightedJobId matches a job
  useEffect(() => {
      if (highlightedJobId) {
          const job = jobs.find(j => j.id === highlightedJobId);
          if (job) {
              setActiveTab('JOBS');
              setWorkflowJob(job);
              setQuoteAmount(job.estimatedCost || 0);
              setSelectedTech(job.technicianId || '');
              setSelectedBay(job.bayId || '');
              setWorkflowTab('OVERVIEW');
              setIsWorkflowModalOpen(true);
          }
      }
  }, [highlightedJobId, jobs]);

  const [appointments, setAppointments] = useState<Appointment[]>([
      { id: 'APT-001', customerName: 'Alice W.', vehiclePlate: 'KBA 111A', date: '2023-11-02', time: '09:00', serviceType: 'Full Service', status: 'CONFIRMED', phone: '0712345678' },
      { id: 'APT-002', customerName: 'Bob M.', vehiclePlate: 'KCC 222B', date: '2023-11-02', time: '11:00', serviceType: 'Brake Check', status: 'PENDING', phone: '0722334455' }
  ]);
  
  // --- New Appointment States ---
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState<{
      customerName: string;
      vehiclePlate: string;
      date: string;
      time: string;
      serviceType: string;
      phone: string;
      make: string;
      model: string;
  }>({
      customerName: '', vehiclePlate: '', date: '', time: '09:00', serviceType: 'General Service', phone: '', make: '', model: ''
  });

  // --- Form States ---
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOwner, setNewOwner] = useState('');
  
  // --- Workflow Action States ---
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedBay, setSelectedBay] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Diagnosis State ---
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<DiagnosisItem>>({ description: '', severity: 'MEDIUM', proposedFix: '', estimatedLaborCost: 0, estimatedPartCost: 0 });

  // --- Parts Requisition State ---
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);

  // Mock available technicians with rates
  const availableTechnicians = [
      { id: 'EMP-001', name: 'David Omondi', rate: 800 },
      { id: 'EMP-002', name: 'Samuel K.', rate: 650 },
      { id: 'EMP-004', name: 'James W.', rate: 700 }
  ];

  // Helper: Check Tech Availability
  const getTechStatus = (techId: string) => {
      const activeJob = jobs.find(j => j.technicianId === techId && j.status === JobStatus.IN_PROGRESS && j.branchId === currentBranch.id);
      return activeJob ? { status: 'BUSY', job: activeJob } : { status: 'AVAILABLE', job: null };
  };

  // --- Filtering Logic ---
  const filteredJobs = jobs.filter(job => {
      // Branch Check
      if (job.branchId !== currentBranch.id) return false;

      const matchesQuery = 
          job.vehicle.plateNumber.toLowerCase().includes(filterQuery.toLowerCase()) || 
          job.vehicle.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
          job.issueDescription.toLowerCase().includes(filterQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
      
      const matchesTech = filterTechnician === 'ALL' || job.technicianId === filterTechnician;

      return matchesQuery && matchesStatus && matchesTech;
  });

  // --- Handlers ---

  const handleCreateJob = () => {
    if (!newPlate || !newModel || !newOwner) {
        alert("Please fill in basic vehicle details.");
        return;
    }

    const newJob: JobCard = {
      id: `JOB-${Date.now()}`,
      branchId: currentBranch.id, // Assign current branch
      vehicle: { 
        id: `V${Date.now()}`, 
        plateNumber: newPlate.toUpperCase(), 
        make: 'Unknown', 
        model: newModel, 
        year: 2020, 
        vin: 'N/A', 
        ownerName: newOwner
      },
      status: JobStatus.DIAGNOSING, // Will be overridden by onCheckIn
      entryDate: new Date().toISOString(),
      issueDescription: checkInMode === 'SERVICE' ? 
          (servicePackages.find(p => p.id === selectedPackageId)?.name || 'Service') : 
          newDescription,
      estimatedCost: 0,
      partsUsed: [],
      laborLogs: [],
      diagnosis: []
    };

    if (onCheckIn) {
        onCheckIn(newJob, checkInMode, selectedPackageId, diagnosisPaid ? diagnosisFee : 0);
    } else {
        onCreateJob(newJob); // Fallback
    }

    setIsModalOpen(false);
    // Reset Form
    setNewPlate(''); setNewModel(''); setNewDescription(''); setNewOwner('');
    setCheckInMode('SERVICE'); setSelectedPackageId(''); setDiagnosisPaid(false);
  };

  const handleAddDiagnosisItem = () => {
      if(!newDiagnosis.description || !workflowJob) return;
      const item: DiagnosisItem = {
          id: `DX-${Date.now()}`,
          description: newDiagnosis.description,
          severity: newDiagnosis.severity as any,
          proposedFix: newDiagnosis.proposedFix,
          estimatedLaborCost: Number(newDiagnosis.estimatedLaborCost) || 0,
          estimatedPartCost: Number(newDiagnosis.estimatedPartCost) || 0,
      };
      const updatedJob = { ...workflowJob, diagnosis: [...(workflowJob.diagnosis || []), item] };
      setWorkflowJob(updatedJob);
      onUpdateJob(updatedJob);
      setNewDiagnosis({ description: '', severity: 'MEDIUM', proposedFix: '', estimatedLaborCost: 0, estimatedPartCost: 0 });
  };

  const handleGenerateQuoteAction = () => {
      if(!workflowJob) return;
      onGenerateQuote(workflowJob);
      setIsWorkflowModalOpen(false);
  };

  const handleCreateAppointment = () => {
      if (!newAppointment.customerName || !newAppointment.vehiclePlate || !newAppointment.date) return;
      const apt: Appointment = {
          id: `APT-${Date.now().toString().slice(-4)}`,
          customerName: newAppointment.customerName,
          vehiclePlate: newAppointment.vehiclePlate.toUpperCase(),
          date: newAppointment.date,
          time: newAppointment.time || '09:00',
          serviceType: newAppointment.serviceType || 'General Service',
          status: 'PENDING',
          phone: newAppointment.phone
      };
      setAppointments([...appointments, apt]);
      setIsAptModalOpen(false);
      
      // Trigger parent handler to register client/vehicle
      if (onBookAppointment) {
          onBookAppointment(apt, { make: newAppointment.make, model: newAppointment.model });
      }

      setNewAppointment({ customerName: '', vehiclePlate: '', date: '', time: '09:00', serviceType: 'General Service', phone: '', make: '', model: '' });
  };

  const openWorkflowModal = (job: JobCard) => {
      setWorkflowJob(job);
      setQuoteAmount(job.estimatedCost || 0);
      setSelectedTech(job.technicianId || '');
      setSelectedBay(job.bayId || '');
      setWorkflowTab('OVERVIEW');
      setIsWorkflowModalOpen(true);
  };

  const handleClockIn = () => {
      if (!workflowJob || !workflowJob.technicianId) {
          alert("Assign a technician first before clocking in.");
          return;
      }
      const tech = availableTechnicians.find(t => t.id === workflowJob.technicianId);
      const newLog: LaborLog = {
          id: `LOG-${Date.now()}`,
          technicianId: workflowJob.technicianId,
          technicianName: workflowJob.technicianName || 'Unknown Tech',
          startTime: new Date().toISOString(),
          hourlyRate: tech ? tech.rate : 500,
          cost: 0
      };
      const updatedLogs = [...(workflowJob.laborLogs || []), newLog];
      const updatedJob = { ...workflowJob, laborLogs: updatedLogs };
      setWorkflowJob(updatedJob);
      onUpdateJob(updatedJob);
  };

  const handleClockOut = (logId: string) => {
      if (!workflowJob || !workflowJob.laborLogs) return;
      const updatedLogs = workflowJob.laborLogs.map(log => {
          if (log.id === logId && !log.endTime) {
              const endTime = new Date().toISOString();
              const start = new Date(log.startTime).getTime();
              const end = new Date(endTime).getTime();
              const durationMinutes = Math.round((end - start) / 60000);
              const cost = Math.ceil((durationMinutes / 60) * log.hourlyRate);
              return { ...log, endTime, durationMinutes, cost };
          }
          return log;
      });
      const updatedJob = { ...workflowJob, laborLogs: updatedLogs };
      setWorkflowJob(updatedJob);
      onUpdateJob(updatedJob);
  };

  const handleAddPartToJob = () => {
      if(!workflowJob || !selectedPartId) return;
      const part = inventory.find(p => p.id === selectedPartId);
      if(part) {
          if (addQuantity < 1) return;
          if (part.stockLevel < addQuantity) {
              alert(`Insufficient stock! Only ${part.stockLevel} units available.`);
              return;
          }
          const updatedInventory = inventory.map(p => 
              p.id === part.id ? { ...p, stockLevel: p.stockLevel - addQuantity } : p
          );
          setInventory(updatedInventory);
          const currentParts = workflowJob.partsUsed || [];
          const existingIndex = currentParts.findIndex(p => p.productId === part.id);
          let updatedParts;
          if (existingIndex >= 0) {
              updatedParts = [...currentParts];
              updatedParts[existingIndex] = {
                  ...updatedParts[existingIndex],
                  quantity: updatedParts[existingIndex].quantity + addQuantity
              };
          } else {
              updatedParts = [...currentParts, {
                  productId: part.id,
                  name: part.name,
                  quantity: addQuantity,
                  cost: part.buyPrice,
                  sellPrice: part.sellPrice
              }];
          }
          const updatedJob = { ...workflowJob, partsUsed: updatedParts };
          setWorkflowJob(updatedJob); 
          onUpdateJob(updatedJob); 
          setSelectedPartId(''); setPartSearch(''); setAddQuantity(1);
      } else {
          alert("Part out of stock or not found!");
      }
  };

  const handleUpdateStatus = () => {
      if (!workflowJob) return;
      let updatedJob = { ...workflowJob };
      let updatedBays = [...serviceBays];

      if (workflowJob.status === JobStatus.DIAGNOSING) {
          updatedJob.status = JobStatus.ESTIMATING;
      } else if (workflowJob.status === JobStatus.ESTIMATING) {
          // Handled by handleGenerateQuoteAction mostly, but allow manual
          updatedJob.status = JobStatus.WAITING_APPROVAL;
          updatedJob.estimatedCost = quoteAmount;
      } else if (workflowJob.status === JobStatus.WAITING_APPROVAL) {
          updatedJob.status = JobStatus.READY;
      } else if (workflowJob.status === JobStatus.READY) {
          if (!selectedTech || !selectedBay) {
              alert("Please select a technician and bay."); return;
          }
          const tech = availableTechnicians.find(t => t.id === selectedTech);
          const targetBay = updatedBays.find(b => b.id === selectedBay);
          if (targetBay && targetBay.status !== 'AVAILABLE' && targetBay.currentJobId !== updatedJob.id) {
              alert(`Service Bay ${targetBay.name} is currently occupied.`); return;
          }
          updatedJob.status = JobStatus.IN_PROGRESS;
          updatedJob.technicianId = selectedTech;
          updatedJob.technicianName = tech?.name;
          updatedJob.bayId = selectedBay;
          const bayIndex = updatedBays.findIndex(b => b.id === selectedBay);
          if (bayIndex !== -1) {
              updatedBays[bayIndex] = { ...updatedBays[bayIndex], status: 'OCCUPIED', currentJobId: updatedJob.id };
          }
          // Mobile Notification Simulation
          alert(`🔔 Mobile Notification sent to ${tech?.name}:\n"New Job Assigned: ${updatedJob.vehicle.plateNumber} at ${targetBay?.name}"`);
      } else if (workflowJob.status === JobStatus.IN_PROGRESS) {
          const hasRunningClock = updatedJob.laborLogs?.some(l => !l.endTime);
          if (hasRunningClock) {
              if (!window.confirm("Active timers found. Stop automatically?")) return;
              updatedJob.laborLogs = updatedJob.laborLogs?.map(log => {
                  if (!log.endTime) {
                      const endTime = new Date().toISOString();
                      return { ...log, endTime, durationMinutes: 60, cost: log.hourlyRate }; // simplified
                  }
                  return log;
              });
          }
          updatedJob.status = JobStatus.COMPLETED;
          if (updatedJob.bayId) {
             const bayIndex = updatedBays.findIndex(b => b.id === updatedJob.bayId);
             if (bayIndex !== -1) updatedBays[bayIndex] = { ...updatedBays[bayIndex], status: 'AVAILABLE', currentJobId: undefined };
          }
      }
      onUpdateJob(updatedJob);
      setServiceBays(updatedBays);
      setIsWorkflowModalOpen(false);
  };

  const handleAiDiagnose = async () => {
    if (!newModel || !newDescription) return;
    setIsAiLoading(true);
    const diagnosis = await diagnoseIssue(newModel, newDescription);
    setAiSuggestion(diagnosis);
    setIsAiLoading(false);
  };

  const filteredParts = inventory.filter(p => 
      (p.name.toLowerCase().includes(partSearch.toLowerCase()) || p.sku.toLowerCase().includes(partSearch.toLowerCase())) &&
      p.branchId === currentBranch.id
  );

  // Helper for timeline view
  const timeSlots = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  
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

      {/* --- SERVICE BAYS VIEW --- */}
      {activeTab === 'BAYS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
              {serviceBays.map(bay => {
                  const job = bay.currentJobId ? jobs.find(j => j.id === bay.currentJobId) : null;
                  return (
                      <div key={bay.id} className={`rounded-xl p-6 border-2 flex flex-col justify-between h-48 ${
                          bay.status === 'OCCUPIED' ? 'bg-red-50 border-red-200' :
                          bay.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'
                      }`}>
                          <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg text-gray-800">{bay.name}</h3>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                  bay.status === 'OCCUPIED' ? 'bg-red-200 text-red-800' :
                                  bay.status === 'AVAILABLE' ? 'bg-green-200 text-green-800' : 'bg-gray-300 text-gray-700'
                              }`}>{bay.status}</span>
                          </div>
                          
                          {bay.status === 'OCCUPIED' && job ? (
                              <div className="mt-4 bg-white/60 p-3 rounded-lg backdrop-blur-sm cursor-pointer" onClick={() => openWorkflowModal(job)}>
                                  <p className="font-bold text-gray-900">{job.vehicle.plateNumber}</p>
                                  <p className="text-xs text-gray-600 truncate">{job.issueDescription}</p>
                                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                      <User size={12}/> {job.technicianName}
                                  </div>
                              </div>
                          ) : (
                              <div className="mt-4 flex flex-col items-center justify-center h-full text-gray-400">
                                  <p className="text-sm font-medium">{bay.status === 'MAINTENANCE' ? 'Closed for Repairs' : 'Ready for Vehicle'}</p>
                              </div>
                          )}
                      </div>
                  )
              })}
          </div>
      )}

      {/* --- SCHEDULE (TIMELINE) VIEW --- */}
      {activeTab === 'SCHEDULE' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col animate-in fade-in">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-700">Workshop Schedule (Today)</h3>
                  <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> In Progress</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div> Diagnosis</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Completed</div>
                  </div>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                  {/* Timeline Header */}
                  <div className="flex" style={{ minWidth: '1000px' }}>
                      <div className="w-32 flex-shrink-0 bg-white sticky left-0 z-10 font-bold text-gray-500 text-sm border-r border-gray-100 pr-4 flex items-center">
                          Service Bay
                      </div>
                      <div className="flex-1 flex relative">
                          {timeSlots.map(hour => (
                              <div key={hour} className="flex-1 border-l border-gray-100 h-8 text-xs text-gray-400 pl-2">
                                  {hour}:00
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Bay Rows */}
                  <div className="mt-4 space-y-6" style={{ minWidth: '1000px' }}>
                      {serviceBays.map(bay => {
                          const activeJob = jobs.find(j => j.id === bay.currentJobId);
                          // Determine color based on job status
                          let jobColorClass = 'bg-gray-200 border-gray-300';
                          if (activeJob?.status === JobStatus.IN_PROGRESS) jobColorClass = 'bg-indigo-100 border-indigo-300 text-indigo-800';
                          else if (activeJob?.status === JobStatus.ESTIMATING) jobColorClass = 'bg-orange-100 border-orange-300 text-orange-800';
                          else if (activeJob?.status === JobStatus.COMPLETED) jobColorClass = 'bg-green-100 border-green-300 text-green-800';

                          return (
                              <div key={bay.id} className="flex h-16 relative group">
                                  {/* Bay Name Column */}
                                  <div className="w-32 flex-shrink-0 flex flex-col justify-center sticky left-0 z-10 bg-white border-r border-gray-100 pr-4">
                                      <h4 className="font-bold text-gray-800 text-sm">{bay.name}</h4>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${bay.status === 'OCCUPIED' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                          {bay.status}
                                      </span>
                                  </div>

                                  {/* Timeline Track */}
                                  <div className="flex-1 relative bg-gray-50/50 rounded-lg border border-dashed border-gray-200 overflow-hidden">
                                      {/* Hour Grids */}
                                      <div className="absolute inset-0 flex pointer-events-none">
                                          {timeSlots.map(hour => (
                                              <div key={hour} className="flex-1 border-l border-gray-100 h-full"></div>
                                          ))}
                                      </div>

                                      {/* Render Active Job Block */}
                                      {activeJob ? (
                                          // Simulate positioning: Start at 9 AM (Index 1) span 3 hours for demo visualization
                                          // In a real app, calculate left/width % based on activeJob.entryDate or activeJob.laborLogs[0].startTime
                                          <div 
                                              className={`absolute top-2 bottom-2 left-[15%] w-[25%] rounded-md border shadow-sm p-2 cursor-pointer hover:shadow-md transition-all z-20 ${jobColorClass}`}
                                              onClick={() => openWorkflowModal(activeJob)}
                                          >
                                              <div className="flex justify-between items-start">
                                                  <span className="font-bold text-xs truncate">{activeJob.vehicle.plateNumber}</span>
                                                  {activeJob.status === JobStatus.IN_PROGRESS && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                                              </div>
                                              <p className="text-[10px] opacity-80 truncate">{activeJob.technicianName || 'Unassigned'}</p>
                                              <p className="text-[10px] font-medium mt-1 truncate">{activeJob.issueDescription}</p>
                                          </div>
                                      ) : (
                                          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 pointer-events-none">
                                              Free Slot
                                          </div>
                                      )}
                                      
                                      {/* Current Time Indicator (Visual Mock at ~11:30 AM) */}
                                      <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-red-400 z-30 pointer-events-none">
                                          <div className="w-2 h-2 bg-red-400 rounded-full -ml-[3px] -mt-1 shadow-sm"></div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* --- APPOINTMENTS VIEW --- */}
      {activeTab === 'APPOINTMENTS' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-700">Scheduled Visits</h3>
                  <button 
                    onClick={() => setIsAptModalOpen(true)}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-purple-700 transition-colors shadow-sm"
                  >
                     <Plus size={16} /> Book Visit
                  </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                  {appointments.map(apt => (
                      <div key={apt.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white relative">
                           {/* ... Appointment Card Content ... */}
                           <div className="flex justify-between items-start mb-3">
                               <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex flex-col items-center justify-center font-bold border border-purple-100">
                                       <span className="text-[10px] uppercase text-purple-400">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                                       <span className="text-lg leading-none">{apt.date.split('-')[2]}</span>
                                   </div>
                                   <div>
                                       <p className="text-sm font-bold text-gray-900">{apt.time}</p>
                                       <p className="text-xs text-gray-500">{apt.customerName}</p>
                                   </div>
                               </div>
                               <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">{apt.status}</span>
                           </div>
                           <h4 className="font-bold text-gray-800 mb-1">{apt.vehiclePlate}</h4>
                           <p className="text-sm text-gray-600 flex items-center gap-1"><Wrench size={12}/> {apt.serviceType}</p>
                           {apt.phone && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Phone size={10}/> {apt.phone}</p>}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- JOBS WORKFLOW VIEW --- */}
      {activeTab === 'JOBS' && (
      <div className="flex flex-col h-full">
        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by Plate, Model or Issue..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[160px]">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white appearance-none cursor-pointer text-sm font-medium text-gray-700"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as JobStatus | 'ALL')}
                >
                    <option value="ALL">All Statuses</option>
                    <option value={JobStatus.PENDING}>Pending</option>
                    <option value={JobStatus.DIAGNOSING}>Diagnosing</option>
                    <option value={JobStatus.ESTIMATING}>Estimating</option>
                    <option value={JobStatus.WAITING_APPROVAL}>Waiting Approval</option>
                    <option value={JobStatus.READY}>Ready for Bay</option>
                    <option value={JobStatus.IN_PROGRESS}>In Progress</option>
                    <option value={JobStatus.WAITING_PARTS}>Waiting Parts</option>
                    <option value={JobStatus.COMPLETED}>Completed</option>
                    <option value={JobStatus.INVOICED}>Invoiced</option>
                </select>
                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
            </div>

            {/* Technician Filter */}
            <div className="relative min-w-[160px]">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white appearance-none cursor-pointer text-sm font-medium text-gray-700"
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                >
                    <option value="ALL">All Technicians</option>
                    {availableTechnicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                </select>
                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
            </div>

            {/* Restrict Job Creation for Technicians */}
            {userRole !== 'TECHNICIAN' && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm"
                >
                <Plus size={20} /> New Check-in
                </button>
            )}
        </div>

        {/* Jobs List - Grouped by Workflow Stage */}
        <div className="flex-1 overflow-x-auto">
            {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                    <Wrench size={48} className="mb-4 text-gray-200" />
                    <p className="text-lg font-medium">No jobs found for this branch.</p>
                    <p className="text-sm">Create a new job card or switch branch.</p>
                </div>
            ) : (
            <div className="flex gap-6 min-w-max pb-4">
                {/* Stage 1: Diagnosis */}
                <div className="w-80 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                        <h3 className="font-bold text-gray-700">Diagnosis</h3>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{filteredJobs.filter(j => j.status === JobStatus.DIAGNOSING || j.status === JobStatus.ESTIMATING).length}</span>
                    </div>
                    <div className="space-y-3">
                        {filteredJobs.filter(j => j.status === JobStatus.DIAGNOSING || j.status === JobStatus.ESTIMATING).map(job => (
                            <JobCardItem key={job.id} job={job} onClick={() => openWorkflowModal(job)} highlighted={highlightedJobId === job.id} userRole={userRole} />
                        ))}
                    </div>
                </div>

                {/* Stage 2: Approval */}
                <div className="w-80 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <h3 className="font-bold text-gray-700">Waiting Approval</h3>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{filteredJobs.filter(j => j.status === JobStatus.WAITING_APPROVAL).length}</span>
                    </div>
                    <div className="space-y-3">
                        {filteredJobs.filter(j => j.status === JobStatus.WAITING_APPROVAL).map(job => (
                            <JobCardItem key={job.id} job={job} onClick={() => openWorkflowModal(job)} highlighted={highlightedJobId === job.id} userRole={userRole} />
                        ))}
                    </div>
                </div>

                {/* Stage 3: Ready to Assign */}
                <div className="w-80 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <h3 className="font-bold text-gray-700">Ready for Bay</h3>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{filteredJobs.filter(j => j.status === JobStatus.READY).length}</span>
                    </div>
                    <div className="space-y-3">
                        {filteredJobs.filter(j => j.status === JobStatus.READY).map(job => (
                            <JobCardItem key={job.id} job={job} onClick={() => openWorkflowModal(job)} highlighted={highlightedJobId === job.id} userRole={userRole} />
                        ))}
                    </div>
                </div>

                 {/* Stage 4: In Progress */}
                 <div className="w-80 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                        <h3 className="font-bold text-gray-700">In Progress</h3>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{filteredJobs.filter(j => j.status === JobStatus.IN_PROGRESS).length}</span>
                    </div>
                    <div className="space-y-3">
                        {filteredJobs.filter(j => j.status === JobStatus.IN_PROGRESS).map(job => (
                            <JobCardItem key={job.id} job={job} onClick={() => openWorkflowModal(job)} highlighted={highlightedJobId === job.id} userRole={userRole} />
                        ))}
                    </div>
                </div>

                {/* Stage 5: Completed */}
                {(filterStatus === JobStatus.COMPLETED || filterStatus === 'ALL') && (
                    <div className="w-80 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <h3 className="font-bold text-gray-700">Completed</h3>
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{filteredJobs.filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.INVOICED).length}</span>
                        </div>
                        <div className="space-y-3">
                            {filteredJobs.filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.INVOICED).map(job => (
                                <JobCardItem key={job.id} job={job} onClick={() => openWorkflowModal(job)} highlighted={highlightedJobId === job.id} userRole={userRole} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
      </div>
      )}

      {/* Book Visit Modal */}
      {isAptModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-xl text-gray-800">Schedule Appointment</h3>
                      <button onClick={() => setIsAptModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <div className="p-6 space-y-5 overflow-y-auto">
                      {/* Vehicle & Customer Section */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                              <Car size={16}/> Vehicle & Customer
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Plate Number</label>
                                  <input 
                                      type="text" 
                                      className="w-full border rounded-lg p-2 uppercase font-medium text-sm" 
                                      placeholder="KAA 123A"
                                      value={newAppointment.vehiclePlate}
                                      onChange={(e) => setNewAppointment({...newAppointment, vehiclePlate: e.target.value.toUpperCase()})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Owner Name</label>
                                  <input 
                                      type="text" 
                                      className="w-full border rounded-lg p-2 text-sm" 
                                      placeholder="John Doe"
                                      value={newAppointment.customerName}
                                      onChange={(e) => setNewAppointment({...newAppointment, customerName: e.target.value})}
                                  />
                              </div>
                          </div>
                          
                          {/* New: Make and Model */}
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Make</label>
                                  <input 
                                      type="text" 
                                      className="w-full border rounded-lg p-2 text-sm" 
                                      placeholder="e.g. Toyota"
                                      value={newAppointment.make}
                                      onChange={(e) => setNewAppointment({...newAppointment, make: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Model</label>
                                  <input 
                                      type="text" 
                                      className="w-full border rounded-lg p-2 text-sm" 
                                      placeholder="e.g. Vitz"
                                      value={newAppointment.model}
                                      onChange={(e) => setNewAppointment({...newAppointment, model: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                              <input 
                                  type="text" 
                                  className="w-full border rounded-lg p-2 text-sm" 
                                  placeholder="07XX XXX XXX"
                                  value={newAppointment.phone}
                                  onChange={(e) => setNewAppointment({...newAppointment, phone: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Date & Time Section */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                              <div className="relative">
                                  <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                      type="date" 
                                      className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm"
                                      min={new Date().toISOString().split('T')[0]}
                                      value={newAppointment.date}
                                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                              <select 
                                  className="w-full border rounded-lg p-2 text-sm"
                                  value={newAppointment.time}
                                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                              >
                                  <option value="08:00">08:00 AM</option>
                                  <option value="09:00">09:00 AM</option>
                                  <option value="10:00">10:00 AM</option>
                                  <option value="11:00">11:00 AM</option>
                                  <option value="12:00">12:00 PM</option>
                                  <option value="13:00">01:00 PM</option>
                                  <option value="14:00">02:00 PM</option>
                                  <option value="15:00">03:00 PM</option>
                                  <option value="16:00">04:00 PM</option>
                              </select>
                          </div>
                      </div>

                      {/* Service Type */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service Required</label>
                          <select 
                              className="w-full border rounded-lg p-2.5 text-sm bg-white mb-2"
                              value={newAppointment.serviceType}
                              onChange={(e) => setNewAppointment({...newAppointment, serviceType: e.target.value})}
                          >
                              <option value="General Service">General Service</option>
                              <option value="Inspection / Diagnosis">Inspection / Diagnosis</option>
                              <option value="Repair">Specific Repair</option>
                              <option value="Consultation">Consultation</option>
                          </select>
                          <textarea 
                              className="w-full border rounded-lg p-2 text-sm" 
                              rows={2} 
                              placeholder="Additional notes (e.g., 'Strange noise from engine')..."
                              // Simplified to just append to serviceType if we wanted, 
                              // but for UI mock let's just let it be visual since Appointment type is simple.
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button 
                          onClick={() => setIsAptModalOpen(false)} 
                          className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleCreateAppointment}
                          disabled={!newAppointment.customerName || !newAppointment.vehiclePlate || !newAppointment.date}
                          className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-bold shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                          Confirm Booking <CalendarIcon size={16} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* New Job Modal (Check-in) - Redesigned */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                  <h3 className="font-bold text-xl text-gray-800">New Vehicle Check-in</h3>
                  <p className="text-xs text-gray-500">{currentBranch.name} Reception</p>
              </div>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* 1. Vehicle Details */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600"/> Step 1: Vehicle Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                            <input type="text" value={newPlate} onChange={(e) => setNewPlate(e.target.value)} className="w-full border rounded-lg p-2.5 uppercase font-bold" placeholder="KAA 123B" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                            <input type="text" value={newModel} onChange={(e) => setNewModel(e.target.value)} className="w-full border rounded-lg p-2.5" placeholder="e.g. Toyota Vitz" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer / Owner</label>
                            <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="w-full border rounded-lg p-2.5" placeholder="Customer Name" />
                        </div>
                    </div>
                </div>

                {/* 2. Service Type Selection */}
                <div>
                    <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                        <ListChecks size={16} className="text-blue-600"/> Step 2: Service Type
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button 
                            onClick={() => setCheckInMode('SERVICE')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${checkInMode === 'SERVICE' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <FileText className={checkInMode === 'SERVICE' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                                {checkInMode === 'SERVICE' && <CheckCircle2 size={20} className="text-blue-600" />}
                            </div>
                            <h5 className="font-bold text-gray-900">Standard Service</h5>
                            <p className="text-xs text-gray-500 mt-1">Pre-defined packages. Quote generated immediately.</p>
                        </button>

                        <button 
                            onClick={() => setCheckInMode('DIAGNOSIS')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${checkInMode === 'DIAGNOSIS' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Stethoscope className={checkInMode === 'DIAGNOSIS' ? 'text-orange-600' : 'text-gray-400'} size={24} />
                                {checkInMode === 'DIAGNOSIS' && <CheckCircle2 size={20} className="text-orange-600" />}
                            </div>
                            <h5 className="font-bold text-gray-900">Diagnosis / Repair</h5>
                            <p className="text-xs text-gray-500 mt-1">Unknown issue. Technician diagnosis required.</p>
                        </button>
                    </div>

                    {/* Conditional Input based on Mode */}
                    {checkInMode === 'SERVICE' ? (
                        <div className="animate-in fade-in">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Service Package</label>
                            <select 
                                className="w-full border rounded-lg p-3 bg-white"
                                value={selectedPackageId}
                                onChange={(e) => setSelectedPackageId(e.target.value)}
                            >
                                <option value="">-- Choose Package --</option>
                                {servicePackages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} - KES {pkg.basePrice.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            {selectedPackageId && (
                                <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                                    <CheckCircle2 size={14}/> Quote for KES {servicePackages.find(p => p.id === selectedPackageId)?.basePrice.toLocaleString()} will be created automatically.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                                <textarea 
                                    className="w-full border rounded-lg p-3 min-h-[80px]"
                                    placeholder="Describe the customer's complaint (e.g. Engine knocking, Check engine light)"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>
                            
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-orange-600 rounded" 
                                        checked={diagnosisPaid}
                                        onChange={(e) => setDiagnosisPaid(e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-800">Charge Diagnosis Fee?</span>
                                </label>
                                {diagnosisPaid && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Amount:</span>
                                        <input 
                                            type="number" 
                                            className="w-24 border rounded p-1 text-right text-sm" 
                                            value={diagnosisFee}
                                            onChange={(e) => setDiagnosisFee(Number(e.target.value))}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* AI Assist */}
                            <div className="flex justify-end">
                                <button onClick={handleAiDiagnose} disabled={isAiLoading || !newDescription} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <BrainCircuit size={14}/> {isAiLoading ? 'Analyzing...' : 'AI Suggestions'}
                                </button>
                            </div>
                            {aiSuggestion && <p className="text-sm text-indigo-700 bg-indigo-50 p-3 rounded border border-indigo-100">{aiSuggestion}</p>}
                        </div>
                    )}
                </div>

            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white font-medium">Cancel</button>
              <button 
                onClick={handleCreateJob} 
                disabled={!newPlate || !newModel || (checkInMode === 'SERVICE' && !selectedPackageId) || (checkInMode === 'DIAGNOSIS' && !newDescription)}
                className={`px-6 py-2.5 rounded-lg text-white font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${checkInMode === 'SERVICE' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                  {checkInMode === 'SERVICE' ? (
                      <>Check In & Create Quote <FileText size={18}/></>
                  ) : (
                      <>Check In for Diagnosis <Stethoscope size={18}/></>
                  )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Action Modal */}
      {isWorkflowModalOpen && workflowJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                      <div>
                          <h3 className="font-bold text-xl text-gray-800">Job Workflow</h3>
                          <p className="text-sm text-gray-500">{workflowJob.vehicle.plateNumber} • {workflowJob.vehicle.model}</p>
                      </div>
                      <button onClick={() => setIsWorkflowModalOpen(false)}><X size={24} className="text-gray-400" /></button>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-100 bg-white">
                      <button onClick={() => setWorkflowTab('OVERVIEW')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${workflowTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
                      <button onClick={() => setWorkflowTab('DIAGNOSIS')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${workflowTab === 'DIAGNOSIS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Diagnosis ({workflowJob.diagnosis?.length || 0})</button>
                      <button onClick={() => setWorkflowTab('PARTS')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${workflowTab === 'PARTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Parts ({workflowJob.partsUsed?.length || 0})</button>
                      <button onClick={() => setWorkflowTab('LABOR')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${workflowTab === 'LABOR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Labor & Time</button>
                  </div>

                  <div className="p-6 space-y-6">
                      
                      {/* --- OVERVIEW TAB --- */}
                      {workflowTab === 'OVERVIEW' && (
                          <>
                            {workflowJob.salesOrderId && (
                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between items-center mb-4">
                                    <div className="text-sm text-blue-800 flex items-center gap-2">
                                        <ClipboardList size={16} />
                                        <span>Linked Order: <strong>{workflowJob.salesOrderId}</strong></span>
                                    </div>
                                    {userRole !== 'TECHNICIAN' && (
                                        <button 
                                            onClick={() => onViewOrder(workflowJob.salesOrderId!)}
                                            className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                                        >
                                            View Order
                                        </button>
                                    )}
                                </div>
                            )}

                            {(workflowJob.status === JobStatus.DIAGNOSING || workflowJob.status === JobStatus.ESTIMATING) && (
                                <div className="text-center bg-orange-50 p-6 rounded-xl border border-orange-100">
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-4">
                                        <Stethoscope size={24} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">Diagnosis In Progress</h4>
                                    <p className="text-gray-600 text-sm mb-4">Technician is identifying issues. Add diagnosis items in the "Diagnosis" tab.</p>
                                    
                                    {userRole !== 'TECHNICIAN' && (
                                        <button 
                                            onClick={handleGenerateQuoteAction}
                                            disabled={!workflowJob.diagnosis || workflowJob.diagnosis.length === 0}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 w-full disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16}/> Generate Quote from Diagnosis
                                        </button>
                                    )}
                                </div>
                            )}

                            {workflowJob.status === JobStatus.WAITING_APPROVAL && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-4">
                                        <Clock size={32} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">
                                        {userRole === 'TECHNICIAN' ? 'Waiting Customer Approval' : `Quotation Sent: KES ${workflowJob.estimatedCost.toLocaleString()}`}
                                    </h4>
                                    <p className="text-gray-600 text-sm mb-6">Has the customer approved this work to proceed?</p>
                                </div>
                            )}

                            {workflowJob.status === JobStatus.READY && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Work Approved by Customer
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician</label>
                                        <select className="w-full border rounded-lg p-2.5" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                                            <option value="">-- Select Tech --</option>
                                            {availableTechnicians.map(t => {
                                                const { status, job } = getTechStatus(t.id);
                                                return (
                                                    <option key={t.id} value={t.id} disabled={status === 'BUSY'}>
                                                        {t.name} {status === 'BUSY' ? `(Busy on ${job?.vehicle.plateNumber})` : '(Available)'}
                                                    </option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Service Bay</label>
                                        <select className="w-full border rounded-lg p-2.5" value={selectedBay} onChange={(e) => setSelectedBay(e.target.value)}>
                                            <option value="">-- Select Bay --</option>
                                            {serviceBays.map(b => (
                                                <option key={b.id} value={b.id} disabled={b.status === 'OCCUPIED' && b.currentJobId !== workflowJob.id}>
                                                    {b.name} ({b.status})
                                                </option>
                                            ))}
                                        </select>
                                        {serviceBays.filter(b => b.status === 'AVAILABLE').length === 0 && (
                                            <p className="text-xs text-red-500 mt-1">No bays available.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {workflowJob.status === JobStatus.IN_PROGRESS && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
                                        <Wrench size={32} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">Job Completion</h4>
                                    <p className="text-gray-600 text-sm">Marking this job as complete will free up <span className="font-bold">{serviceBays.find(b => b.id === workflowJob.bayId)?.name}</span>.</p>
                                </div>
                            )}
                          </>
                      )}

                      {/* --- DIAGNOSIS TAB --- */}
                      {workflowTab === 'DIAGNOSIS' && (
                          <div className="space-y-6">
                              {/* Add Diagnosis Form */}
                              {(workflowJob.status === JobStatus.DIAGNOSING || workflowJob.status === JobStatus.ESTIMATING) && (
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                                      <h4 className="text-sm font-bold text-gray-700">Add Diagnosis Issue</h4>
                                      <div>
                                          <input 
                                              type="text" 
                                              placeholder="Issue Description (e.g. Worn Brake Pads)" 
                                              className="w-full border rounded-lg p-2.5 text-sm"
                                              value={newDiagnosis.description}
                                              onChange={(e) => setNewDiagnosis({ ...newDiagnosis, description: e.target.value })}
                                          />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                          <select 
                                              className="border rounded-lg p-2.5 text-sm bg-white"
                                              value={newDiagnosis.severity}
                                              onChange={(e) => setNewDiagnosis({ ...newDiagnosis, severity: e.target.value as any })}
                                          >
                                              <option value="LOW">Low Severity</option>
                                              <option value="MEDIUM">Medium Severity</option>
                                              <option value="HIGH">High Severity</option>
                                              <option value="CRITICAL">Critical</option>
                                          </select>
                                          <input 
                                              type="text" 
                                              placeholder="Proposed Fix" 
                                              className="w-full border rounded-lg p-2.5 text-sm"
                                              value={newDiagnosis.proposedFix}
                                              onChange={(e) => setNewDiagnosis({ ...newDiagnosis, proposedFix: e.target.value })}
                                          />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                          <input 
                                              type="number" 
                                              placeholder="Est. Parts Cost" 
                                              className="w-full border rounded-lg p-2.5 text-sm"
                                              value={newDiagnosis.estimatedPartCost}
                                              onChange={(e) => setNewDiagnosis({ ...newDiagnosis, estimatedPartCost: parseFloat(e.target.value) })}
                                          />
                                          <input 
                                              type="number" 
                                              placeholder="Est. Labor Cost" 
                                              className="w-full border rounded-lg p-2.5 text-sm"
                                              value={newDiagnosis.estimatedLaborCost}
                                              onChange={(e) => setNewDiagnosis({ ...newDiagnosis, estimatedLaborCost: parseFloat(e.target.value) })}
                                          />
                                      </div>
                                      <button 
                                          onClick={handleAddDiagnosisItem}
                                          className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                                      >
                                          Add Issue
                                      </button>
                                  </div>
                              )}

                              {/* Diagnosis List */}
                              <div className="space-y-3">
                                  {workflowJob.diagnosis && workflowJob.diagnosis.length > 0 ? (
                                      workflowJob.diagnosis.map((item) => (
                                          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                              <div className="flex justify-between items-start mb-1">
                                                  <span className="font-bold text-gray-800">{item.description}</span>
                                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                      item.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                      item.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                      'bg-green-100 text-green-700'
                                                  }`}>
                                                      {item.severity}
                                                  </span>
                                              </div>
                                              <p className="text-sm text-gray-600 mb-2">Fix: {item.proposedFix}</p>
                                              <div className="flex justify-between text-xs text-gray-500 border-t pt-2 mt-2">
                                                  <span>Parts: KES {item.estimatedPartCost?.toLocaleString()}</span>
                                                  <span>Labor: KES {item.estimatedLaborCost?.toLocaleString()}</span>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                          <BrainCircuit size={32} className="mx-auto mb-2 opacity-20"/>
                                          <p className="text-sm">No issues diagnosed yet.</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* --- PARTS TAB --- */}
                      {workflowTab === 'PARTS' && (
                          <div className="space-y-4">
                              {(workflowJob.status === JobStatus.ESTIMATING || workflowJob.status === JobStatus.IN_PROGRESS || workflowJob.status === JobStatus.DIAGNOSING) && (
                                  <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add From Inventory</h4>
                                      <div className="flex gap-2 mb-3">
                                          <input 
                                              type="text" 
                                              placeholder="Search..." 
                                              className="flex-1 border rounded-lg p-2 text-sm"
                                              value={partSearch}
                                              onChange={(e) => setPartSearch(e.target.value)}
                                          />
                                          <select 
                                              className="border rounded-lg p-2 text-sm max-w-[200px]"
                                              value={selectedPartId}
                                              onChange={(e) => setSelectedPartId(e.target.value)}
                                          >
                                              <option value="">Select Part</option>
                                              {filteredParts.map(p => (
                                                  <option key={p.id} value={p.id} disabled={p.stockLevel === 0}>
                                                      {p.name} (Qty: {p.stockLevel})
                                                  </option>
                                              ))}
                                          </select>
                                          <input 
                                              type="number"
                                              min="1"
                                              className="w-16 border rounded-lg p-2 text-sm text-center"
                                              value={addQuantity}
                                              onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                                          />
                                          <button 
                                              onClick={handleAddPartToJob}
                                              disabled={!selectedPartId || addQuantity < 1}
                                              className="bg-slate-900 text-white px-3 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                                          >
                                              Add
                                          </button>
                                      </div>
                                  </div>
                              )}

                              {/* Used Parts List */}
                              {workflowJob.partsUsed && workflowJob.partsUsed.length > 0 ? (
                                  <div className="space-y-2">
                                      {workflowJob.partsUsed.map((part, idx) => (
                                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 text-sm shadow-sm">
                                              <div className="flex items-center gap-2">
                                                  <div className="p-1.5 bg-orange-100 text-orange-600 rounded">
                                                      <Package size={14} />
                                                  </div>
                                                  <div>
                                                      <p className="font-medium text-gray-800">{part.name}</p>
                                                      <p className="text-xs text-gray-500">Qty: {part.quantity}</p>
                                                  </div>
                                              </div>
                                              {userRole !== 'TECHNICIAN' && (
                                                  <span className="font-bold text-gray-900">KES {part.sellPrice.toLocaleString()}</span>
                                              )}
                                          </div>
                                      ))}
                                      {userRole !== 'TECHNICIAN' && (
                                          <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-bold text-sm">
                                              <span>Parts Total:</span>
                                              <span className="text-lg">KES {workflowJob.partsUsed.reduce((sum, p) => sum + p.sellPrice, 0).toLocaleString()}</span>
                                          </div>
                                      )}
                                  </div>
                              ) : (
                                  <div className="text-center py-8 text-gray-400">
                                      <ShoppingCart size={32} className="mx-auto mb-2 opacity-20"/>
                                      <p className="text-sm">No parts assigned to this job yet.</p>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* --- LABOR TAB (NEW) --- */}
                      {workflowTab === 'LABOR' && (
                          <div className="space-y-4">
                              {workflowJob.status === JobStatus.IN_PROGRESS ? (
                                  <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                      <div>
                                          <h4 className="font-bold text-indigo-900">Time Tracking</h4>
                                          <p className="text-xs text-indigo-700">Technician: {workflowJob.technicianName || 'Unassigned'}</p>
                                      </div>
                                      <button 
                                          onClick={workflowJob.laborLogs?.some(l => !l.endTime) ? () => handleClockOut(workflowJob.laborLogs!.find(l => !l.endTime)!.id) : handleClockIn}
                                          className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors ${
                                              workflowJob.laborLogs?.some(l => !l.endTime) 
                                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                                              : 'bg-green-600 hover:bg-green-700 text-white'
                                          }`}
                                      >
                                          {workflowJob.laborLogs?.some(l => !l.endTime) 
                                              ? <><Pause size={16} /> Stop Timer</> 
                                              : <><Play size={16} /> Start Work</>
                                          }
                                      </button>
                                  </div>
                              ) : (
                                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 flex items-center gap-2">
                                      <AlertTriangle size={14}/> Labor tracking is available when job is <strong>In Progress</strong>.
                                  </div>
                              )}

                              {/* Labor Logs List */}
                              <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Work Logs</h4>
                                  {workflowJob.laborLogs && workflowJob.laborLogs.length > 0 ? (
                                      workflowJob.laborLogs.map((log) => (
                                          <div key={log.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 text-sm">
                                              <div>
                                                  <p className="font-medium text-gray-800">{log.technicianName}</p>
                                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                                      <span>{new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                      <ArrowRight size={10} />
                                                      <span>{log.endTime ? new Date(log.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active...'}</span>
                                                  </div>
                                              </div>
                                              <div className="text-right">
                                                  {userRole !== 'TECHNICIAN' && (
                                                      <p className="font-bold text-gray-900">
                                                          {log.cost > 0 ? `KES ${log.cost.toLocaleString()}` : '-'}
                                                      </p>
                                                  )}
                                                  <p className="text-xs text-gray-500">
                                                      {log.durationMinutes ? `${log.durationMinutes} mins` : 'Tracking...'}
                                                  </p>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-center text-gray-400 text-sm italic py-4">No labor time recorded.</p>
                                  )}
                                  
                                  {userRole !== 'TECHNICIAN' && workflowJob.laborLogs && workflowJob.laborLogs.length > 0 && (
                                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-bold text-sm">
                                          <span>Labor Total:</span>
                                          <span className="text-lg">KES {workflowJob.laborLogs.reduce((sum, l) => sum + l.cost, 0).toLocaleString()}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-10">
                      <button onClick={() => setIsWorkflowModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600">Close</button>
                      {workflowTab === 'OVERVIEW' && (
                          <button 
                            onClick={handleUpdateStatus} 
                            disabled={userRole === 'TECHNICIAN' && (workflowJob.status === JobStatus.ESTIMATING || workflowJob.status === JobStatus.WAITING_APPROVAL)}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:bg-gray-400"
                          >
                              {workflowJob.status === JobStatus.DIAGNOSING ? 'Complete Diagnosis' :
                               workflowJob.status === JobStatus.ESTIMATING ? 'Proceed to Approval' : 
                               workflowJob.status === JobStatus.WAITING_APPROVAL ? 'Confirm Approval' :
                               workflowJob.status === JobStatus.READY ? 'Assign & Start' :
                               workflowJob.status === JobStatus.IN_PROGRESS ? 'Finish Job' : 'Update'}
                               <ArrowRight size={16} />
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper Component for List Items
const JobCardItem: React.FC<{ job: JobCard, onClick: () => void, highlighted?: boolean, userRole: UserRole }> = ({ job, onClick, highlighted, userRole }) => (
    <div 
        onClick={onClick} 
        className={`p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
            highlighted 
            ? 'bg-blue-50 border-blue-400 shadow-md ring-2 ring-blue-200' 
            : 'bg-white border-gray-100 hover:shadow-md'
        }`}
    >
        <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-gray-800 text-sm">{job.vehicle.plateNumber}</span>
            <span className="text-xs text-gray-500">{new Date(job.entryDate).toLocaleDateString()}</span>
        </div>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{job.issueDescription}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <span className="text-xs font-medium text-gray-500">{job.vehicle.model}</span>
            {userRole !== 'TECHNICIAN' && job.estimatedCost > 0 && (
                <span className="text-xs font-bold text-gray-800">KES {job.estimatedCost.toLocaleString()}</span>
            )}
        </div>
        {job.bayId && (
            <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block">
                In Bay: {job.bayId}
            </div>
        )}
        {job.salesOrderId && (
            <div className="mt-1 text-[10px] text-green-600 flex items-center gap-1">
                <CheckCircle2 size={10} /> Linked Order
            </div>
        )}
        <div className="flex gap-2 mt-1">
            {job.diagnosis && job.diagnosis.length > 0 && (
                <div className="text-[10px] text-orange-600 flex items-center gap-1">
                    <Stethoscope size={10} /> {job.diagnosis.length}
                </div>
            )}
            {job.partsUsed && job.partsUsed.length > 0 && (
                <div className="text-[10px] text-gray-600 flex items-center gap-1">
                    <ShoppingCart size={10} /> {job.partsUsed.length}
                </div>
            )}
            {job.laborLogs && job.laborLogs.length > 0 && (
                <div className="text-[10px] text-blue-600 flex items-center gap-1">
                    <Timer size={10} /> {Math.round(job.laborLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0) / 60 * 10) / 10}h
                </div>
            )}
        </div>
        
        {job.status === JobStatus.IN_PROGRESS && (
            <button 
                className="mt-3 w-full py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                View Job Card <ArrowRight size={12} />
            </button>
        )}
    </div>
);

export default JobCardManager;