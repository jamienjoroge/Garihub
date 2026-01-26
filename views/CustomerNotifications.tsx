import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const CustomerNotifications: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const period = new Date().toISOString().slice(0,7);
    apiClient.get(`/api/me/notifications?period=${period}`).then(setItems).catch(e => setError(e?.message || 'Error'));
  }, []);
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
      <div className="space-y-2">
        {items.map((n, idx) => (
          <div key={idx} className="bg-white p-4 rounded border flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-800 text-sm">{n.template} • {n.channel.toUpperCase()}</div>
              <div className="text-xs text-gray-500">Requested: {n.requestedAt} • Status: {n.latestStatus}</div>
            </div>
            {n.proofLinkAvailable ? (
              <a className="text-indigo-600 text-xs" href={`/public/notifications/${n.notificationId}/proof`}>View Proof</a>
            ) : (
              <button className="text-gray-400 text-xs cursor-not-allowed" disabled>Proof Unavailable</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerNotifications;