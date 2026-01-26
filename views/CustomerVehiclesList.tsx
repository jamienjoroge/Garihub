import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const CustomerVehiclesList: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiClient.get('/api/vehicles').then(setList).catch(e => setError(e?.message || 'Error'));
  }, []);
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Vehicles</h2>
      <div className="grid grid-cols-1 gap-3">
        {list.map((v, idx) => (
          <div key={idx} className="bg-white p-4 rounded border flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-800">{v.make} {v.model} {v.year}</div>
              <div className="text-xs text-gray-500">VIN: {v.vin}</div>
              <div className="text-xs text-gray-500">Last service: {v.lastServiceDate || 'N/A'} • Last inspection: {v.lastInspectionResult || 'N/A'}</div>
            </div>
            <a className="text-indigo-600 text-xs" href={`/public/vehicles/${v.vehicleId}/history`}>View History</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerVehiclesList;