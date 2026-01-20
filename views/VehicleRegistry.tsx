import React, { useState } from 'react';
import { Search, Car, History, FileText, PenTool, Shield, User, Fuel, GitCommit, Database, Plus, X, FolderOpen } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleRegistryProps {
    vehicles: Vehicle[];
    setVehicles: (vehicles: Vehicle[]) => void;
}

interface VehicleTimelineEvent {
  id: string;
  type: 'SERVICE' | 'INSPECTION' | 'REPAIR' | 'OWNERSHIP_CHANGE';
  date: string;
  title: string;
  description: string;
  mileage: number;
  garage: string;
}

const VehicleRegistry: React.FC<VehicleRegistryProps> = ({ vehicles, setVehicles }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    ownerName: '',
    color: '',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    engineSize: ''
  });

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber.includes(searchQuery.toUpperCase()) || 
    v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mockTimeline: VehicleTimelineEvent[] = [
    {
        id: 'EV-1',
        type: 'SERVICE',
        date: '2023-10-25',
        title: 'Periodic Maintenance',
        description: 'Oil change, filter replacement, brake check.',
        mileage: 85400,
        garage: 'GariHub Main'
    },
    {
        id: 'EV-2',
        type: 'INSPECTION',
        date: '2023-06-12',
        title: 'Safety Inspection',
        description: 'Passed 45/50 checks. Minor suspension wear noted.',
        mileage: 79200,
        garage: 'GariHub Main'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
        case 'SERVICE': return <PenTool size={16} />;
        case 'INSPECTION': return <Shield size={16} />;
        case 'REPAIR': return <Car size={16} />;
        case 'OWNERSHIP_CHANGE': return <User size={16} />;
        default: return <FileText size={16} />;
    }
  };

  const getEventColor = (type: string) => {
      switch (type) {
          case 'SERVICE': return 'bg-blue-100 text-blue-600';
          case 'INSPECTION': return 'bg-purple-100 text-purple-600';
          case 'OWNERSHIP_CHANGE': return 'bg-amber-100 text-amber-600';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  const handleAddVehicle = () => {
    if (newVehicle.plateNumber && newVehicle.make && newVehicle.model) {
      const vehicle: Vehicle = {
        id: `V${Date.now()}`,
        plateNumber: newVehicle.plateNumber.toUpperCase(),
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year || new Date().getFullYear(),
        vin: newVehicle.vin || 'N/A',
        ownerName: newVehicle.ownerName || 'Unknown',
        color: newVehicle.color,
        fuelType: newVehicle.fuelType as any,
        transmission: newVehicle.transmission as any,
        engineSize: newVehicle.engineSize
      };
      setVehicles([vehicle, ...vehicles]);
      setSelectedVehicle(vehicle);
      setIsAddModalOpen(false);
      setNewVehicle({
        plateNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        ownerName: '',
        color: '',
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        engineSize: ''
      });
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
       <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Vehicle Registry</h2>
            <p className="text-gray-500">Central database for vehicle specifications and service history (Digital Logbook).</p>
            <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 inline-block px-3 py-1 rounded border border-blue-100 flex items-center gap-2 w-fit">
                <Shield size={14} />
                This vehicle’s service history is portable and owner-controlled.
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            <span>Add Vehicle</span>
          </button>
       </header>

       <div className="flex gap-6 h-full overflow-hidden">
         {/* Search & List Panel */}
         <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Plate, VIN, or Owner..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredVehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                            <Car size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No Vehicles Found</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {searchQuery ? `No matches for "${searchQuery}"` : "Get started by adding a vehicle to the registry."}
                        </p>
                        {!searchQuery && (
                            <button onClick={() => setIsAddModalOpen(true)} className="text-blue-600 text-sm font-bold hover:underline">
                                Register First Vehicle
                            </button>
                        )}
                    </div>
                ) : (
                    filteredVehicles.map(vehicle => (
                        <div 
                            key={vehicle.id}
                            onClick={() => setSelectedVehicle(vehicle)}
                            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-slate-50 ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-900">{vehicle.plateNumber}</h3>
                                <span className="text-xs font-medium text-gray-500">{vehicle.year}</span>
                            </div>
                            <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">Owner: {vehicle.ownerName}</p>
                        </div>
                    ))
                )}
            </div>
         </div>

         {/* Detail View Panel */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            {selectedVehicle ? (
                <div>
                    {/* Vehicle Header */}
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
                                    <Car size={32} className="text-slate-700" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{selectedVehicle.plateNumber}</h1>
                                    <p className="text-gray-500 font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Edit Specs</button>
                                <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">New Job Card</button>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-4 gap-4 mt-6">
                             <div className="bg-white p-3 rounded-lg border border-gray-100">
                                 <p className="text-xs text-gray-400 mb-1">VIN / Chassis</p>
                                 <p className="font-mono text-sm font-medium text-gray-800">{selectedVehicle.vin}</p>
                             </div>
                             <div className="bg-white p-3 rounded-lg border border-gray-100">
                                 <p className="text-xs text-gray-400 mb-1">Engine</p>
                                 <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                    <Fuel size={12} /> {selectedVehicle.engineSize} • {selectedVehicle.fuelType}
                                 </p>
                             </div>
                             <div className="bg-white p-3 rounded-lg border border-gray-100">
                                 <p className="text-xs text-gray-400 mb-1">Transmission</p>
                                 <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                     <GitCommit size={12} /> {selectedVehicle.transmission}
                                 </p>
                             </div>
                             <div className="bg-white p-3 rounded-lg border border-gray-100">
                                 <p className="text-xs text-gray-400 mb-1">Current Owner</p>
                                 <p className="text-sm font-medium text-gray-800">{selectedVehicle.ownerName}</p>
                             </div>
                        </div>
                    </div>

                    {/* Digital Logbook / Timeline */}
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <History size={20} className="text-blue-500" /> Digital Service Record
                        </h3>
                        
                        <div className="relative pl-8 border-l-2 border-gray-100 space-y-8">
                            {mockTimeline.map((event) => (
                                <div key={event.id} className="relative">
                                    <div className={`absolute -left-[41px] p-2 rounded-full border-2 border-white shadow-sm ${getEventColor(event.type)}`}>
                                        {getEventIcon(event.type)}
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{event.title}</h4>
                                                <p className="text-sm text-gray-500">{event.garage}</p>
                                            </div>
                                            <span className="text-xs font-mono font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {event.date}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 text-sm mb-3">{event.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 inline-flex px-2 py-1 rounded">
                                            <span className="font-bold">Mileage:</span> {event.mileage.toLocaleString()} km
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Database size={64} className="mb-4 text-slate-200" />
                    <p className="font-medium text-lg">Select a vehicle to view its Digital Logbook</p>
                </div>
            )}
         </div>
       </div>

       {/* Add Vehicle Modal */}
       {isAddModalOpen && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-xl text-gray-800">Register New Vehicle</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-4">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Vehicle Identification</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                         <input 
                            type="text" 
                            className="w-full border rounded-lg p-2.5 uppercase font-medium" 
                            placeholder="KAA 123A"
                            value={newVehicle.plateNumber}
                            onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">VIN / Chassis No</label>
                         <input 
                            type="text" 
                            className="w-full border rounded-lg p-2.5 uppercase" 
                            placeholder="XXXXXXXXXXXXXXXXX"
                            value={newVehicle.vin}
                            onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                         />
                      </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 pt-2">Specs & Model</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                         <input 
                            type="text" 
                            className="w-full border rounded-lg p-2.5" 
                            placeholder="Toyota"
                            value={newVehicle.make}
                            onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                         <input 
                            type="text" 
                            className="w-full border rounded-lg p-2.5" 
                            placeholder="Premio"
                            value={newVehicle.model}
                            onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                         <input 
                            type="number" 
                            className="w-full border rounded-lg p-2.5" 
                            placeholder="2018"
                            value={newVehicle.year}
                            onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                         <input 
                            type="text" 
                            className="w-full border rounded-lg p-2.5" 
                            placeholder="White"
                            value={newVehicle.color}
                            onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                         />
                      </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 pt-2">Technical Details</h4>
                   <div className="grid grid-cols-3 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                         <select 
                            className="w-full border rounded-lg p-2.5"
                            value={newVehicle.fuelType}
                            onChange={(e) => setNewVehicle({...newVehicle, fuelType: e.target.value as any})}
                         >
                            <option value="PETROL">Petrol</option>
                            <option value="DIESEL">Diesel</option>
                            <option value="HYBRID">Hybrid</option>
                            <option value="ELECTRIC">Electric</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                         <select 
                             className="w-full border rounded-lg p-2.5"
                             value={newVehicle.transmission}
                             onChange={(e) => setNewVehicle({...newVehicle, transmission: e.target.value as any})}
                         >
                            <option value="AUTOMATIC">Automatic</option>
                            <option value="MANUAL">Manual</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Engine CC</label>
                         <input 
                            type="text" 
                            className="w-full border rounded-lg p-2.5" 
                            placeholder="1500cc"
                            value={newVehicle.engineSize}
                            onChange={(e) => setNewVehicle({...newVehicle, engineSize: e.target.value})}
                         />
                      </div>
                   </div>

                   <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 pt-2">Ownership</h4>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                       <input 
                          type="text" 
                          className="w-full border rounded-lg p-2.5" 
                          placeholder="Full Name"
                          value={newVehicle.ownerName}
                          onChange={(e) => setNewVehicle({...newVehicle, ownerName: e.target.value})}
                       />
                   </div>
               </div>

               <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                  <button 
                     onClick={() => setIsAddModalOpen(false)}
                     className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handleAddVehicle}
                     className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm"
                     disabled={!newVehicle.plateNumber || !newVehicle.make}
                  >
                     Save Vehicle
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default VehicleRegistry;