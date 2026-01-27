import React, { useState } from 'react';
import { 
    Hammer, Calendar, Clock, DollarSign, Image as ImageIcon, 
    MoreHorizontal, CheckCircle2, ChevronRight, TrendingUp, 
    AlertCircle, Plus, Camera, X, ArrowRight, LayoutList, Grip,
    User, Car, FileText, Wrench, ChevronDown, ChevronUp, ClipboardList, Shield
} from 'lucide-react';
import { RestorationProject, ProjectPhase, Branch, UserRole, Customer, Vehicle, SalesOrder, JobCard, Invoice, JobStatus, ProjectTask } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface ProjectManagerProps {
    currentBranch: Branch;
    userRole: UserRole;
    customers: Customer[];
    jobs: JobCard[];
    onCreateJob: (job: JobCard) => void;
    salesOrders: SalesOrder[];
    setSalesOrders: (orders: SalesOrder[]) => void;
    invoices: Invoice[];
    setInvoices: (invoices: Invoice[]) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ 
    currentBranch, userRole, customers, jobs, onCreateJob, salesOrders, setSalesOrders, invoices, setInvoices 
}) => {
    // --- Mock Data ---
    const [projects, setProjects] = useState<RestorationProject[]>([
        {
            id: 'PROJ-001',
            name: '1969 Ford Mustang Fastback',
            customerId: 'CUST-001',
            customerName: 'James Wilson',
            vehicleId: 'V-MUSTANG-69',
            vehicleDescription: '1969 Ford Mustang',
            branchId: 'BR-HQ',
            startDate: '2023-08-15',
            estimatedCompletionDate: '2024-02-28',
            totalBudget: 2500000,
            totalSpent: 1120000,
            depositAmount: 1000000,
            status: 'ACTIVE',
            phases: [
                { 
                    id: 'PH-1', name: 'Disassembly & Cataloging', status: 'COMPLETED', budgetAllocation: 150000, actualCost: 145000, completionPercentage: 100, startDate: '2023-08-15', endDate: '2023-09-01',
                    tasks: [
                        { id: 'T1', description: 'Remove Engine & Transmission', status: 'COMPLETED', jobCardId: 'JOB-OLD-01' },
                        { id: 'T2', description: 'Catalog Interior Trim', status: 'COMPLETED', jobCardId: 'JOB-OLD-02' }
                    ]
                },
                { 
                    id: 'PH-2', name: 'Body Work & Rust Removal', status: 'IN_PROGRESS', budgetAllocation: 800000, actualCost: 650000, completionPercentage: 75, startDate: '2023-09-05',
                    tasks: [
                        { id: 'T3', description: 'Sandblast Chassis', status: 'COMPLETED', jobCardId: 'JOB-OLD-03' },
                        { id: 'T4', description: 'Welding Floor Pans', status: 'JOB_CREATED', jobCardId: 'JOB-2024-001' }
                    ]
                },
                { 
                    id: 'PH-3', name: 'Engine Rebuild (V8)', status: 'IN_PROGRESS', budgetAllocation: 600000, actualCost: 200000, completionPercentage: 30, startDate: '2023-10-01',
                    tasks: [
                        { id: 'T5', description: 'Machine Block', status: 'PENDING' },
                        { id: 'T6', description: 'Order Pistons & Rings', status: 'PENDING' }
                    ]
                },
            ],
            updates: [
                { id: 'UPD-1', date: '2023-10-25', title: 'Engine Block Machined', description: 'The V8 block has returned from the machine shop. Cylinders bored 0.30 over.', phaseId: 'PH-3' },
            ]
        }
    ]);

    const [selectedProject, setSelectedProject] = useState<RestorationProject | null>(null);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [activeDetailTab, setActiveDetailTab] = useState<'OVERVIEW' | 'TIMELINE' | 'JOBS' | 'FINANCIALS' | 'GALLERY'>('OVERVIEW');
    const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
    const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({}); // phaseId -> text

    // --- New Project Wizard State ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [newProjData, setNewProjData] = useState<{
        customerId: string;
        vehicleId: string;
        name: string;
        totalBudget: number;
        deposit: number;
        startDate: string;
        endDate: string;
    }>({
        customerId: '', vehicleId: '', name: '', totalBudget: 0, deposit: 0, 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: ''
    });

    // Chart Data
    const getFinancialChartData = (project: RestorationProject) => {
        return project.phases.map(p => ({
            name: p.name.split(' ')[0], 
            budget: p.budgetAllocation,
            spent: p.actualCost
        }));
    };

    // --- HANDLERS ---

    const handleCreateProject = () => {
        const customer = customers.find(c => c.id === newProjData.customerId);
        const vehicle = customer?.vehicles.find(v => v.id === newProjData.vehicleId);
        
        if (!customer || !vehicle) return;

        const newProject: RestorationProject = {
            id: `PROJ-${Date.now()}`,
            name: newProjData.name,
            customerId: customer.id,
            customerName: customer.name,
            vehicleId: vehicle.id,
            vehicleDescription: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            branchId: currentBranch.id,
            startDate: newProjData.startDate,
            estimatedCompletionDate: newProjData.endDate,
            totalBudget: newProjData.totalBudget,
            totalSpent: 0,
            depositAmount: newProjData.deposit,
            status: 'PLANNING',
            phases: [
                { id: `PH-${Date.now()}-1`, name: 'Initial Inspection', status: 'PENDING', budgetAllocation: 0, actualCost: 0, completionPercentage: 0, tasks: [] }
            ],
            updates: []
        };

        setProjects([...projects, newProject]);

        // Create Deposit Sales Order if amount > 0
        if (newProjData.deposit > 0) {
            const depositOrder: SalesOrder = {
                id: `SO-${Date.now()}`,
                branchId: currentBranch.id,
                projectId: newProject.id,
                customerName: customer.name,
                vehiclePlate: vehicle.plateNumber,
                date: new Date().toISOString().split('T')[0],
                totalAmount: newProjData.deposit,
                status: 'READY_TO_INVOICE',
                items: [{ description: `Deposit for Project: ${newProject.name}`, quantity: 1, unitCost: newProjData.deposit, total: newProjData.deposit }]
            };
            setSalesOrders([...salesOrders, depositOrder]);
        }

        setIsWizardOpen(false);
        setWizardStep(1);
        setNewProjData({ customerId: '', vehicleId: '', name: '', totalBudget: 0, deposit: 0, startDate: '', endDate: '' });
    };

    // 1. Add Task Local
    const handleAddTask = (phaseId: string) => {
        if (!selectedProject || !newTaskInputs[phaseId]) return;
        
        const newTask: ProjectTask = {
            id: `T-${Date.now()}`,
            description: newTaskInputs[phaseId],
            status: 'PENDING'
        };

        const updatedProject = {
            ...selectedProject,
            phases: selectedProject.phases.map(p => 
                p.id === phaseId ? { ...p, tasks: [...(p.tasks || []), newTask] } : p
            )
        };

        setSelectedProject(updatedProject);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        setNewTaskInputs({ ...newTaskInputs, [phaseId]: '' });
    };

    // 2. Convert Task to Job Card
    const handleConvertTaskToJob = (phaseId: string, task: ProjectTask) => {
        if (!selectedProject) return;
        const customer = customers.find(c => c.id === selectedProject.customerId);
        const vehicle = customer?.vehicles.find(v => v.id === selectedProject.vehicleId);

        if (!vehicle) {
            alert("Vehicle details not found.");
            return;
        }

        // Create the Job Card
        const newJob: JobCard = {
            id: `JOB-${Date.now()}`,
            projectId: selectedProject.id,
            branchId: currentBranch.id,
            vehicle: vehicle,
            status: JobStatus.READY, // Directly ready for assignment
            entryDate: new Date().toISOString(),
            issueDescription: `Project Task: ${task.description}`, // Carry over description
            estimatedCost: 0,
            partsUsed: [],
            laborLogs: []
        };
        
        onCreateJob(newJob);

        // Update Project Task to link to Job
        const updatedProject = {
            ...selectedProject,
            phases: selectedProject.phases.map(p => 
                p.id === phaseId 
                ? { 
                    ...p, 
                    tasks: p.tasks.map(t => t.id === task.id ? { ...t, status: 'JOB_CREATED', jobCardId: newJob.id } as ProjectTask : t) 
                  } 
                : p
            )
        };

        setSelectedProject(updatedProject);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        setActiveDetailTab('JOBS'); // Redirect user to see the new job
    };

    const handleCreateInvoice = (order: SalesOrder) => {
        const inv: Invoice = {
            id: `INV-${Date.now()}`,
            projectId: selectedProject?.id,
            salesOrderId: order.id,
            branchId: currentBranch.id,
            customerName: order.customerName,
            jobId: order.jobCardId || 'PROJECT',
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
            amount: order.totalAmount,
            status: 'PENDING',
            items: order.items
        };
        setInvoices([...invoices, inv]);
        
        const updatedOrders = salesOrders.map(so => so.id === order.id ? { ...so, status: 'INVOICED' as const } : so);
        setSalesOrders(updatedOrders);
    };

    // Filtered Lists
    const projectJobs = selectedProject ? jobs.filter(j => j.projectId === selectedProject.id) : [];
    const projectOrders = selectedProject ? salesOrders.filter(so => so.projectId === selectedProject.id) : [];
    const projectInvoices = selectedProject ? invoices.filter(inv => inv.projectId === selectedProject.id) : [];

    if (selectedProject) {
        // --- DETAIL VIEW ---
        return (
            <div className="flex flex-col h-full bg-slate-50">
                {/* Header Navigation */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <ArrowRight size={20} className="rotate-180"/>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {selectedProject.name}
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${selectedProject.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700'}`}>
                                    {selectedProject.status}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500">{selectedProject.customerName} • {selectedProject.vehicleDescription}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                            <Plus size={16}/> Add Phase
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                        {[
                            { id: 'OVERVIEW', icon: TrendingUp, label: 'Cockpit' },
                            { id: 'TIMELINE', icon: Calendar, label: 'Phases & Tasks' },
                            { id: 'JOBS', icon: Wrench, label: 'Job Cards' },
                            { id: 'FINANCIALS', icon: DollarSign, label: 'Billing' },
                            { id: 'GALLERY', icon: ImageIcon, label: 'Gallery' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveDetailTab(tab.id as any)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeDetailTab === tab.id 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon size={18} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 overflow-y-auto p-6">
                        
                        {/* OVERVIEW TAB */}
                        {activeDetailTab === 'OVERVIEW' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Car size={20} className="text-blue-400"/> Linked Vehicle Asset
                                        </h3>
                                        <p className="text-slate-300 text-sm mt-1">
                                            {selectedProject.vehicleDescription} <span className="text-slate-500">•</span> ID: {selectedProject.vehicleId}
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                             <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1">
                                                <Shield size={12}/> History Tracking Active
                                             </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 mb-1">Owner</p>
                                        <p className="font-bold">{selectedProject.customerName}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-sm text-gray-500 font-medium">Total Budget</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">KES {selectedProject.totalBudget.toLocaleString()}</h3>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-sm text-gray-500 font-medium">Expenses to Date</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">KES {selectedProject.totalSpent.toLocaleString()}</h3>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-sm text-gray-500 font-medium">Target Completion</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{new Date(selectedProject.estimatedCompletionDate).toLocaleDateString()}</h3>
                                    </div>
                                </div>
                                {/* Active Phases Summary */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                    <h3 className="font-bold text-gray-800 mb-4">Active Phases</h3>
                                    <div className="space-y-4">
                                        {selectedProject.phases.filter(p => p.status === 'IN_PROGRESS').map(phase => (
                                            <div key={phase.id} className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                                                <span className="font-medium text-blue-900">{phase.name}</span>
                                                <div className="flex gap-2">
                                                    <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded border border-blue-200 font-medium">
                                                        {phase.tasks?.filter(t => t.status === 'PENDING').length} Pending Tasks
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            setExpandedPhaseId(phase.id);
                                                            setActiveDetailTab('TIMELINE');
                                                        }}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* JOBS TAB */}
                        {activeDetailTab === 'JOBS' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Linked Job Cards</h3>
                                    <p className="text-sm text-gray-500">Jobs generated from Project Tasks</p>
                                </div>
                                
                                {projectJobs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {projectJobs.map(job => (
                                            <div key={job.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-gray-800">{job.id}</span>
                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                                        job.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>{job.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{job.issueDescription}</p>
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                                                    <div className="text-xs text-gray-500">Tech: <span className="font-medium text-gray-800">{job.technicianName || 'Unassigned'}</span></div>
                                                    {job.bayId && <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Bay: {job.bayId}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                        <Wrench size={32} className="mx-auto mb-2 opacity-20"/>
                                        <p>No job cards linked to this project yet.</p>
                                        <p className="text-xs mt-1">Go to "Phases & Tasks" to convert tasks into jobs.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* FINANCIALS TAB */}
                        {activeDetailTab === 'FINANCIALS' && (
                            <div className="space-y-6 animate-in fade-in">
                                {/* Sales Orders */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4">Project Billing & Orders</h3>
                                    {projectOrders.length > 0 ? (
                                        <div className="space-y-3">
                                            {projectOrders.map(order => (
                                                <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{order.id} <span className="text-gray-400 text-sm">• {order.date}</span></div>
                                                        <div className="text-sm text-gray-600">Items: {order.items.length} • Status: {order.status}</div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-4">
                                                        <span className="font-bold text-gray-900">KES {order.totalAmount.toLocaleString()}</span>
                                                        {order.status === 'READY_TO_INVOICE' && (
                                                            <button 
                                                                onClick={() => handleCreateInvoice(order)}
                                                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded font-bold hover:bg-green-200"
                                                            >
                                                                Invoice
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No sales orders generated.</p>
                                    )}
                                </div>

                                {/* Invoices */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4">Invoices</h3>
                                    {projectInvoices.length > 0 ? (
                                        <div className="space-y-3">
                                            {projectInvoices.map(inv => (
                                                <div key={inv.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50/50">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{inv.id}</div>
                                                        <div className="text-sm text-gray-600">Due: {inv.dueDate}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-xs px-2 py-1 rounded font-bold mr-3 ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
                                                        <span className="font-bold text-gray-900">KES {inv.amount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No invoices generated yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TIMELINE TAB (Enhanced with Tasks) */}
                        {activeDetailTab === 'TIMELINE' && (
                            <div className="space-y-4 animate-in fade-in">
                                {selectedProject.phases.map((phase, idx) => {
                                    const isExpanded = expandedPhaseId === phase.id;
                                    return (
                                        <div key={phase.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
                                            {/* Phase Header */}
                                            <div 
                                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                                                onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${phase.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-600'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-800">{phase.name}</h3>
                                                    <div className="flex gap-4 text-xs text-gray-500">
                                                        <span>Status: <strong className="text-gray-700">{phase.status}</strong></span>
                                                        <span>Tasks: <strong className="text-gray-700">{phase.tasks?.length || 0}</strong></span>
                                                    </div>
                                                </div>
                                                {isExpanded ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                                            </div>

                                            {/* Phase Tasks (Expandable) */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                                                    
                                                    {/* Task List */}
                                                    <div className="space-y-3 mb-4">
                                                        {phase.tasks && phase.tasks.length > 0 ? (
                                                            phase.tasks.map(task => {
                                                                const linkedJob = jobs.find(j => j.id === task.jobCardId);
                                                                return (
                                                                    <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500' : task.status === 'JOB_CREATED' ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-gray-800">{task.description}</p>
                                                                                {linkedJob && (
                                                                                    <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                                                                                        <Wrench size={10} /> 
                                                                                        Job: {linkedJob.id} ({linkedJob.status}) 
                                                                                        {linkedJob.technicianName && ` - ${linkedJob.technicianName}`}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div>
                                                                            {task.status === 'PENDING' && (
                                                                                <button 
                                                                                    onClick={() => handleConvertTaskToJob(phase.id, task)}
                                                                                    className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800 flex items-center gap-1"
                                                                                >
                                                                                    Create Job <ArrowRight size={12}/>
                                                                                </button>
                                                                            )}
                                                                            {task.status === 'JOB_CREATED' && (
                                                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                                                    In Workshop
                                                                                </span>
                                                                            )}
                                                                            {task.status === 'COMPLETED' && (
                                                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                                                                                    <CheckCircle2 size={12}/> Done
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">No tasks added to this phase yet.</p>
                                                        )}
                                                    </div>

                                                    {/* Add Task Input */}
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Add a new task (e.g. Remove Engine)..." 
                                                            className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                            value={newTaskInputs[phase.id] || ''}
                                                            onChange={(e) => setNewTaskInputs({...newTaskInputs, [phase.id]: e.target.value})}
                                                            onKeyDown={(e) => { if(e.key === 'Enter') handleAddTask(phase.id); }}
                                                        />
                                                        <button 
                                                            onClick={() => handleAddTask(phase.id)}
                                                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* GALLERY TAB (Placeholder) */}
                        {activeDetailTab === 'GALLERY' && <div className="text-center py-8 text-gray-400">Gallery View</div>}
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN PROJECT LIST & WIZARD ---
    return (
        <div className="p-8 h-full flex flex-col bg-gray-50">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Restoration Projects</h2>
                    <p className="text-gray-500">Manage long-term builds, phases, and budgets.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-md ${viewMode === 'GRID' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><LayoutList size={20}/></button>
                    <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-md ${viewMode === 'LIST' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><Grip size={20}/></button>
                    <button 
                        onClick={() => setIsWizardOpen(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                    >
                        <Plus size={20} /> New Project
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div 
                        key={project.id} 
                        onClick={() => setSelectedProject(project)}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group flex flex-col"
                    >
                        <div className={`h-2 w-full ${project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <div className="p-6 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{project.customerName} • {project.vehicleDescription}</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Budget</span>
                                    <span className="font-bold">KES {project.totalBudget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Spent</span>
                                    <span className="font-bold">KES {project.totalSpent.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- NEW PROJECT WIZARD MODAL --- */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-xl text-gray-800">Start New Restoration Project</h3>
                            <button onClick={() => setIsWizardOpen(false)}><X size={24} className="text-gray-400"/></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Step Indicator */}
                            <div className="flex items-center justify-between mb-6 px-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
                                <div className="flex-1 h-1 bg-gray-100 mx-2"><div className={`h-full bg-blue-600 transition-all ${wizardStep >= 2 ? 'w-full' : 'w-0'}`}></div></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
                                <div className="flex-1 h-1 bg-gray-100 mx-2"><div className={`h-full bg-blue-600 transition-all ${wizardStep >= 3 ? 'w-full' : 'w-0'}`}></div></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>3</div>
                            </div>

                            {wizardStep === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <h4 className="font-bold text-gray-800">Select Customer & Vehicle</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                        <select 
                                            className="w-full border rounded-lg p-2.5" 
                                            value={newProjData.customerId}
                                            onChange={(e) => setNewProjData({...newProjData, customerId: e.target.value, vehicleId: ''})}
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                        <select 
                                            className="w-full border rounded-lg p-2.5" 
                                            value={newProjData.vehicleId}
                                            onChange={(e) => setNewProjData({...newProjData, vehicleId: e.target.value})}
                                            disabled={!newProjData.customerId}
                                        >
                                            <option value="">Select Vehicle</option>
                                            {customers.find(c => c.id === newProjData.customerId)?.vehicles.map(v => (
                                                <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <h4 className="font-bold text-gray-800">Project Details</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full border rounded-lg p-2.5"
                                            placeholder="e.g. 1960 Beetle Full Restore"
                                            value={newProjData.name}
                                            onChange={(e) => setNewProjData({...newProjData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full border rounded-lg p-2.5"
                                                value={newProjData.startDate}
                                                onChange={(e) => setNewProjData({...newProjData, startDate: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Completion</label>
                                            <input 
                                                type="date" 
                                                className="w-full border rounded-lg p-2.5"
                                                value={newProjData.endDate}
                                                onChange={(e) => setNewProjData({...newProjData, endDate: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <h4 className="font-bold text-gray-800">Financial Setup</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Estimated Budget (KES)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border rounded-lg p-2.5"
                                            value={newProjData.totalBudget}
                                            onChange={(e) => setNewProjData({...newProjData, totalBudget: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Deposit (Creates Sales Order)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border rounded-lg p-2.5 bg-green-50 border-green-200"
                                            value={newProjData.deposit}
                                            onChange={(e) => setNewProjData({...newProjData, deposit: parseInt(e.target.value)})}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">If &gt; 0, a Sales Order will be automatically generated.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50">
                            {wizardStep > 1 ? (
                                <button onClick={() => setWizardStep(wizardStep - 1 as any)} className="text-gray-600 hover:text-gray-900 font-medium">Back</button>
                            ) : (
                                <div></div>
                            )}
                            {wizardStep < 3 ? (
                                <button 
                                    onClick={() => setWizardStep(wizardStep + 1 as any)} 
                                    disabled={
                                        (wizardStep === 1 && (!newProjData.customerId || !newProjData.vehicleId)) ||
                                        (wizardStep === 2 && !newProjData.name)
                                    }
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            ) : (
                                <button 
                                    onClick={handleCreateProject}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm"
                                >
                                    Create Project
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;