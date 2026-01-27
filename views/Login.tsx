import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const request = async () => {
    setError(null);
    try {
      const res: any = await apiClient.post('/api/auth/request-otp', { phone });
      if (!res || typeof res !== 'object' || !res.otpId) {
        if (res && res.errorCode && res.message) {
          setError(`${res.errorCode}: ${res.message}`);
        } else {
          setError('Unable to request OTP. Please check the server URL or try again.');
        }
        return;
      }
      setOtpId(res.otpId);
    } catch (e: any) {
      if (e && e.errorCode && e.message) {
        setError(`${e.errorCode}: ${e.message}`);
      } else {
        setError('Unable to request OTP. Please try again.');
      }
    }
  };
  const verify = async () => {
    setError(null);
    try { const res = await apiClient.post('/api/auth/verify-otp', { otpId, phone, code }); localStorage.setItem('authToken', res.token); window.location.assign('/'); } catch (e: any) { setError(e?.message || 'Error'); }
  };
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded border w-96 space-y-3">
        <h2 className="text-xl font-bold text-gray-800">Sign In</h2>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border rounded p-2 text-sm" />
        {!otpId ? (
          <button onClick={request} className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm">Request Code</button>
        ) : (
          <div className="space-y-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter Code" className="w-full border rounded p-2 text-sm" />
            <button onClick={verify} className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm">Verify</button>
          </div>
        )}
        {error && (<div className="text-red-600 text-xs">{error}</div>)}
      </div>
    </div>
  );
};

export default Login;