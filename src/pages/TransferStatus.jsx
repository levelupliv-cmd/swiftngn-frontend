import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { transferApi } from '../lib/transferApi';

export default function TransferStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(location.state?.status || 'processing');
  const [reference] = useState(location.state?.reference || '');
  const [loading, setLoading] = useState(true);
  const [transferData, setTransferData] = useState(null);

  useEffect(() => {
    if (!reference) {
      navigate('/');
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await transferApi.getStatus(reference);
        if (response.success) {
          setTransferData(response);
          setStatus(response.status);
          if (response.status === 'success' || response.status === 'failed') {
            setLoading(false);
            return;
          }
        }
        setTimeout(pollStatus, 3000);
      } catch (err) {
        console.error('Status check failed:', err);
        setTimeout(pollStatus, 5000);
      }
    };

    pollStatus();
  }, [reference, navigate]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'success':
        return { icon: '✅', title: 'Transfer Successful!', color: 'text-green-400', bgColor: 'bg-green-900/30', borderColor: 'border-green-700' };
      case 'failed':
        return { icon: '❌', title: 'Transfer Failed', color: 'text-red-400', bgColor: 'bg-red-900/30', borderColor: 'border-red-700' };
      default:
        return { icon: '⏳', title: 'Processing Transfer...', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-700' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
      <div className="w-full">
        <div className={`${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-xl p-8 text-center`}>
          <div className="text-5xl mb-4">{statusDisplay.icon}</div>
          <h2 className={`text-2xl font-bold ${statusDisplay.color} mb-2`}>{statusDisplay.title}</h2>
          {loading && <p className="text-gray-400 text-sm">Please wait while we process your transfer...</p>}
          {transferData && !loading && (
            <div className="mt-4 text-left text-sm space-y-2 bg-gray-800/50 p-4 rounded-lg">
              <p><span className="text-gray-400">Reference:</span> {transferData.reference}</p>
              <p><span className="text-gray-400">Amount:</span> ₦{transferData.amount}</p>
              <p><span className="text-gray-400">Recipient:</span> {transferData.recipient}</p>
              <p><span className="text-gray-400">Status:</span> {transferData.status}</p>
            </div>
          )}
          <button onClick={() => navigate('/')} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">New Transfer</button>
        </div>
      </div>
    </div>
  );
                }
