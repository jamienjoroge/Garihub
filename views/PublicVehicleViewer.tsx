import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const PublicVehicleViewer: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [insp, setInsp] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const vehicleId = window.location.pathname.split('/').filter(Boolean).pop() || '';
  useEffect(() => {
    setError(null);
    apiClient.get(`/public/vehicles/${vehicleId}/history?token=${token}`).then(setData).catch(e => setError(e?.message || 'Error'));
    apiClient.get(`/public/vehicles/${vehicleId}/inspections?token=${token}`).then(setInsp).catch(() => {});
  }, [vehicleId, token]);
  if (error) return <div className="p-6"><div className="text-red-600">{error}</div></div>;
  return (
    <div className="p-6">
      <div className="mb-3 text-xs font-bold bg-gray-100 text-gray-700 inline-block px-2 py-1 rounded">Read-only shared view</div>
      {data ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <div className="font-bold text-gray-800">{data.vehicleId} • {data.make} {data.model} {data.year}</div>
            <div className="text-xs text-gray-500">VIN: {data.vin}</div>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-bold text-gray-800 mb-2">Service Timeline</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {(data.timeline || []).map((t: any, idx: number) => (
                <li key={idx}>{t.date} • {t.type}</li>
              ))}
            </ul>
          </div>
          {insp && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-bold text-gray-800 mb-2">Inspections</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {(insp.inspections || []).map((i: any, idx: number) => (
                  <li key={idx}>{i.date} • {i.type} • {i.passed ? 'PASS' : 'FAIL'}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">Loading...</div>
      )}
    </div>
  );
};

export default PublicVehicleViewer;