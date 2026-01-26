import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';

const CustomerPreferences: React.FC = () => {
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(false);
  const save = async () => {
    setError(null); setOk(false);
    try { await apiClient.post('/api/me/preferences/notifications', { smsOptIn, emailOptIn }); setOk(true); } catch (e: any) { setError(e?.message || 'Error'); }
  };
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Notification Preferences</h2>
      <div className="bg-white p-4 rounded border space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} /> SMS Updates
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} /> Email Updates
        </label>
        <button onClick={save} className="bg-indigo-600 text-white px-3 py-2 rounded text-sm">Save</button>
        {ok && (<div className="text-green-600 text-xs">Preferences saved</div>)}
        {error && (<div className="text-red-600 text-xs">{error}</div>)}
      </div>
    </div>
  );
};

export default CustomerPreferences;