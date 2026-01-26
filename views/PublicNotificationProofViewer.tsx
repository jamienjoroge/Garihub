import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const PublicNotificationProofViewer: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const notificationId = window.location.pathname.split('/').filter(Boolean).pop() || '';
  useEffect(() => {
    setError(null);
    apiClient.get(`/public/notifications/${notificationId}/proof?token=${token}`).then(setData).catch(e => setError(e?.message || 'Error'));
  }, [notificationId, token]);
  if (error) return <div className="p-6"><div className="text-red-600">{error}</div></div>;
  return (
    <div className="p-6">
      <div className="mb-3 text-xs font-bold bg-gray-100 text-gray-700 inline-block px-2 py-1 rounded">Read-only shared view</div>
      {data ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <div className="font-bold text-gray-800">Notification: {notificationId}</div>
            {data.finalOutcome && (
              <div className="text-sm text-gray-700">Final: {data.finalOutcome.status} at {data.finalOutcome.deliveredAt}</div>
            )}
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-bold text-gray-800 mb-2">Attempts</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {(data.attempts || []).map((a: any, idx: number) => (
                <li key={idx}>#{a.attemptNumber} • {a.status} • {a.failureReason || ''}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-bold text-gray-800 mb-2">Receipts</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {(data.receipts || []).map((r: any, idx: number) => (
                <li key={idx}>{r.receiptStatus} at {r.receivedAt}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-bold text-gray-800 mb-2">Reconciliations</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {(data.reconciliations || []).map((rc: any, idx: number) => (
                <li key={idx}>{rc.action} • {rc.reason} at {rc.reconciledAt}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">Loading...</div>
      )}
    </div>
  );
};

export default PublicNotificationProofViewer;