// src/pages/TransferStatus.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { transferApi } from '../lib/transferApi';

export default function TransferStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ============ STATE DECLARATIONS ============
  const [status, setStatus] = useState(location.state?.status || 'processing');
  const [reference] = useState(location.state?.reference || '');
  const [loading, setLoading] = useState(true);
  const [transferData, setTransferData] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  // ============ POLLING FUNCTION ============
  useEffect(() => {
    // If no reference, redirect to home
    if (!reference) {
      navigate('/');
      return;
    }

    let timeoutId = null;
    let isMounted = true;

    const pollStatus = async () => {
      if (!isMounted) return;

      try {
        const response = await transferApi.getStatus(reference);
        
        if (response.success) {
          setTransferData(response.data || response);
          setStatus(response.status || response.data?.status || 'processing');
          
          // If transfer is complete, stop polling
          if (response.status === 'success' || response.status === 'failed' || 
              response.data?.status === 'success' || response.data?.status === 'failed') {
            setLoading(false);
            return;
          }
        }
        
        // Continue polling if still processing
        setPollCount(prev => prev + 1);
        timeoutId = setTimeout(pollStatus, 3000);
        
      } catch (err) {
        console.error('Status check failed:', err);
        // Retry with longer delay on error
        timeoutId = setTimeout(pollStatus, 5000);
      }
    };

    // Start polling
    pollStatus();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [reference, navigate]);

  // ============ GET STATUS DISPLAY ============
  const getStatusDisplay = () => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'successful':
        return { 
          icon: '✅', 
          title: 'Transfer Successful!', 
          color: 'text-green-400', 
          bgColor: 'bg-green-900/30', 
          borderColor: 'border-green-700',
          message: 'Your transfer has been completed successfully.'
        };
      case 'failed':
      case 'error':
      case 'failed':
        return { 
          icon: '❌', 
          title: 'Transfer Failed', 
          color: 'text-red-400', 
          bgColor: 'bg-red-900/30', 
          borderColor: 'border-red-700',
          message: 'Your transfer could not be completed. Please try again.'
        };
      default:
        return { 
          icon: '⏳', 
          title: 'Processing Transfer...', 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-900/30', 
          borderColor: 'border-yellow-700',
          message: 'Please wait while we process your transfer...'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // ============ FORMAT AMOUNT ============
  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return Number(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ============ UI RENDER ============
  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
      <div className="w-full">
        <div className={`${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-xl p-8 text-center`}>
          
          {/* Status Icon */}
          <div className="text-5xl mb-4">{statusDisplay.icon}</div>
          
          {/* Status Title */}
          <h2 className={`text-2xl font-bold ${statusDisplay.color} mb-2`}>
            {statusDisplay.title}
          </h2>
          
          {/* Status Message */}
          <p className="text-gray-400 text-sm mb-4">
            {statusDisplay.message}
          </p>
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-400 text-sm">Checking status... (Attempt {pollCount})</p>
            </div>
          )}
          
          {/* Transfer Details */}
          {transferData && !loading && (
            <div className="mt-4 text-left text-sm space-y-2 bg-gray-800/50 p-4 rounded-lg">
              <p>
                <span className="text-gray-400">Reference:</span>{' '}
                <span className="text-white font-mono">{transferData.reference || reference}</span>
              </p>
              <p>
                <span className="text-gray-400">Amount:</span>{' '}
                <span className="text-white font-semibold">₦{formatAmount(transferData.amount)}</span>
              </p>
              {transferData.recipient && (
                <p>
                  <span className="text-gray-400">Recipient:</span>{' '}
                  <span className="text-white">{transferData.recipient}</span>
                </p>
              )}
              {transferData.recipient_bank && (
                <p>
                  <span className="text-gray-400">Bank:</span>{' '}
                  <span className="text-white">{transferData.recipient_bank}</span>
                </p>
              )}
              <p>
                <span className="text-gray-400">Status:</span>{' '}
                <span className={`font-semibold ${
                  status === 'success' ? 'text-green-400' : 
                  status === 'failed' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {status?.toUpperCase() || 'PROCESSING'}
                </span>
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button 
              onClick={() => navigate('/')} 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition disabled:opacity-50"
              disabled={loading}
            >
              New Transfer
            </button>
            
            {!loading && status === 'failed' && (
              <button 
                onClick={() => navigate(-2)} 
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Try Again
              </button>
            )}
          </div>
          
          {/* Cancel Button (only while loading) */}
          {loading && (
            <button 
              onClick={() => navigate('/')} 
              className="mt-3 text-gray-400 hover:text-gray-300 text-sm transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
