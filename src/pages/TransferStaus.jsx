// ============ TRANSFERSTATUS.JSX - COMPLETE FIXED VERSION ============

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import transferApi from '../services/transferApi'; // Fixed import path

const TransferStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ============ STATE DECLARATIONS ============
  const [status, setStatus] = useState(location.state?.status || 'processing');
  const [reference, setReference] = useState(location.state?.reference || '');
  const [loading, setLoading] = useState(true);
  const [transferData, setTransferData] = useState(null);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [amount, setAmount] = useState(location.state?.amount || '');
  const [recipient, setRecipient] = useState(location.state?.recipient || '');
  
  // ============ REFS ============
  const pollTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const maxPollAttempts = 20; // 20 * 3 seconds = 60 seconds max

  // ============ CLEANUP ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, []);

  // ============ POLLING FUNCTION ============
  const pollStatus = useCallback(async () => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;

    // Check if we have a reference
    if (!reference) {
      setError('No transaction reference found.');
      setLoading(false);
      if (isMountedRef.current) {
        navigate('/');
      }
      return;
    }

    // Check max poll attempts
    if (pollCount >= maxPollAttempts) {
      setError('Transfer is taking longer than expected. Please check your transaction history.');
      setLoading(false);
      return;
    }

    try {
      // Check if transferApi is available
      if (!transferApi) {
        throw new Error('Transfer API service is not available');
      }

      // Get transfer status
      const response = await transferApi.checkTransferStatus(reference);

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      if (response && response.success) {
        setTransferData(response.data || response);
        const currentStatus = response.status || response.data?.status || 'processing';
        setStatus(currentStatus);
        
        // Update amount and recipient if available
        if (response.data?.amount) {
          setAmount(response.data.amount);
        }
        if (response.data?.recipient || response.data?.recipient_account) {
          setRecipient(response.data.recipient || response.data.recipient_account);
        }

        // If transfer is complete, stop polling
        if (currentStatus === 'success' || currentStatus === 'failed' || 
            currentStatus === 'completed' || currentStatus === 'rejected') {
          setLoading(false);
          return;
        }

        // Continue polling
        setPollCount(prev => prev + 1);
        pollTimeoutRef.current = setTimeout(pollStatus, 3000);
      } else {
        // If status check fails, continue polling with longer interval
        setPollCount(prev => prev + 1);
        pollTimeoutRef.current = setTimeout(pollStatus, 5000);
      }
    } catch (err) {
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      console.error('Status check failed:', err);
      setError(err?.message || 'Failed to check transfer status');
      
      // Retry after longer delay
      setPollCount(prev => prev + 1);
      pollTimeoutRef.current = setTimeout(pollStatus, 5000);
    }
  }, [reference, pollCount, navigate]);

  // ============ INITIAL POLLING ============
  useEffect(() => {
    // Validate reference
    if (!reference) {
      setError('No transaction reference found.');
      setLoading(false);
      // Redirect after a moment
      const redirectTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          navigate('/');
        }
      }, 3000);
      return () => clearTimeout(redirectTimeout);
    }

    // Start polling
    setLoading(true);
    setPollCount(0);
    pollStatus();

    // Cleanup on unmount
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [reference, pollStatus, navigate]);

  // ============ GET STATUS DISPLAY ============
  const getStatusDisplay = useCallback(() => {
    const statusMap = {
      'success': {
        icon: '✅',
        title: 'Transfer Successful!',
        color: 'text-green-400',
        bgColor: 'bg-green-900/30',
        borderColor: 'border-green-700',
        description: 'Your transfer has been completed successfully.'
      },
      'completed': {
        icon: '✅',
        title: 'Transfer Successful!',
        color: 'text-green-400',
        bgColor: 'bg-green-900/30',
        borderColor: 'border-green-700',
        description: 'Your transfer has been completed successfully.'
      },
      'failed': {
        icon: '❌',
        title: 'Transfer Failed',
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        borderColor: 'border-red-700',
        description: 'Your transfer could not be completed. Please try again.'
      },
      'rejected': {
        icon: '❌',
        title: 'Transfer Rejected',
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        borderColor: 'border-red-700',
        description: 'Your transfer was rejected. Please check the details and try again.'
      },
      'processing': {
        icon: '⏳',
        title: 'Processing Transfer...',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-700',
        description: 'Your transfer is being processed. Please wait...'
      },
      'pending': {
        icon: '⏳',
        title: 'Transfer Pending',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-700',
        description: 'Your transfer is pending confirmation.'
      }
    };

    return statusMap[status] || statusMap['processing'];
  }, [status]);

  // ============ FORMAT AMOUNT ============
  const formatAmount = useCallback((amount) => {
    if (!amount) return '0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0.00';
    return numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // ============ HANDLE NEW TRANSFER ============
  const handleNewTransfer = useCallback(() => {
    if (navigate) {
      navigate('/');
    }
  }, [navigate]);

  // ============ HANDLE RETRY ============
  const handleRetry = useCallback(() => {
    if (navigate) {
      navigate('/transfer-details');
    }
  }, [navigate]);

  // ============ RENDER ============
  const statusDisplay = getStatusDisplay();
  const isComplete = status === 'success' || status === 'completed' || 
                     status === 'failed' || status === 'rejected';
  const isSuccess = status === 'success' || status === 'completed';

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
      <div className="w-full">
        <div className={`${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-xl p-8 text-center`}>
          {/* Icon */}
          <div className="text-5xl mb-4">{statusDisplay.icon}</div>
          
          {/* Title */}
          <h2 className={`text-2xl font-bold ${statusDisplay.color} mb-2`}>
            {statusDisplay.title}
          </h2>
          
          {/* Description */}
          <p className="text-gray-300 text-sm mb-4">{statusDisplay.description}</p>
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-400 text-sm">Checking status...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              <span className="font-semibold">⚠️ Error:</span> {error}
            </div>
          )}

          {/* Transfer Details */}
          {(transferData || amount || recipient) && !loading && (
            <div className="mt-4 text-left text-sm space-y-2 bg-gray-800/50 p-4 rounded-lg">
              {reference && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Reference:</span>
                  <span className="text-gray-200 font-mono text-xs">{reference}</span>
                </p>
              )}
              {amount && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-gray-200 font-semibold">₦{formatAmount(amount)}</span>
                </p>
              )}
              {recipient && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-gray-200">{recipient}</span>
                </p>
              )}
              {status && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${statusDisplay.color}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </p>
              )}
              {transferData?.message && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Message:</span>
                  <span className="text-gray-200">{transferData.message}</span>
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isComplete ? (
              <>
                <button
                  onClick={handleNewTransfer}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  New Transfer
                </button>
                {!isSuccess && (
                  <button
                    onClick={handleRetry}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                  >
                    Try Again
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Back to Home
              </button>
            )}
          </div>

          {/* Poll Count - Debug */}
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-4 text-xs text-gray-500">
              Poll attempts: {pollCount}/{maxPollAttempts}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ EXPORT ============
export default TransferStatus;
