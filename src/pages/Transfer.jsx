// ============ TRANSFER.JS - COMPLETE FIXED VERSION ============

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import transferApi from '../services/transferApi';

const Transfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ============ FORM DATA STATE ============
  const [formData, setFormData] = useState({
    amount: location.state?.amount || '',
    recipientBank: location.state?.recipientBank || '',
    recipientAccount: location.state?.recipientAccount || '',
    description: location.state?.description || '',
    sessionId: location.state?.sessionId || '',
    senderBank: location.state?.senderBank || 'Kuda Bank',
    senderAccount: location.state?.senderAccount || '2020011846'
  });

  // ============ STATE DECLARATIONS ============
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  
  // ============ REFS ============
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ============ CLEANUP ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ============ SESSION MANAGEMENT ============
  const saveSession = useCallback((sessionId) => {
    if (sessionId) {
      try {
        localStorage.setItem('transferSessionId', sessionId);
        localStorage.setItem('transferSessionTimestamp', Date.now().toString());
        setSessionId(sessionId);
        setFormData(prev => ({ ...prev, sessionId }));
      } catch (err) {
        console.error('Failed to save session:', err);
      }
    }
  }, []);

  const getCurrentSessionId = useCallback(() => {
    try {
      // Priority: state > localStorage > formData
      const stateSession = sessionId;
      const storageSession = localStorage.getItem('transferSessionId');
      const formSession = formData?.sessionId;
      
      // Check if session is expired (5 minutes timeout)
      const timestamp = localStorage.getItem('transferSessionTimestamp');
      if (timestamp) {
        const elapsed = Date.now() - parseInt(timestamp, 10);
        if (elapsed > 300000) { // 5 minutes
          localStorage.removeItem('transferSessionId');
          localStorage.removeItem('transferSessionTimestamp');
          return formSession || stateSession || null;
        }
      }
      
      return stateSession || storageSession || formSession || null;
    } catch (err) {
      console.error('Failed to get session:', err);
      return null;
    }
  }, [sessionId, formData?.sessionId]);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem('transferSessionId');
      localStorage.removeItem('transferSessionTimestamp');
      setSessionId('');
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  }, []);

  // ============ REQUEST OTP FUNCTION ============
  const requestOTP = useCallback(async () => {
    // Prevent multiple requests
    if (loading) return;
    
    setLoading(true);
    setError('');
    setOtpSent(false);
    
    try {
      // Check if transferApi is available
      if (!transferApi) {
        throw new Error('Transfer API service is not available');
      }

      // Get current session ID
      let currentSessionId = getCurrentSessionId();
      
      // If no session exists, generate one
      if (!currentSessionId) {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          setError('Please enter a valid amount.');
          setLoading(false);
          return;
        }

        const sessionResponse = await transferApi.createSession({
          amount: amount,
          recipient_bank_code: formData.recipientBank,
          recipient_account_number: formData.recipientAccount
        });
        
        if (!sessionResponse || !sessionResponse.success) {
          throw new Error(sessionResponse?.message || 'Failed to create session');
        }
        
        currentSessionId = sessionResponse.sessionId;
        saveSession(currentSessionId);
      }

      // Validate amount
      const amount = parseFloat(formData?.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount.');
        setLoading(false);
        return;
      }

      // Generate OTP
      const generateResponse = await transferApi.generateOTP({
        sessionId: currentSessionId,
        amount: amount,
        recipient_bank_code: formData?.recipientBank,
        recipient_account_number: formData?.recipientAccount,
        narration: formData?.description || 'NGN Transfer',
        currency: 'NGN'
      });

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      if (generateResponse && generateResponse.success) {
        setOtpSent(true);
        if (generateResponse.sessionId) {
          saveSession(generateResponse.sessionId);
        } else {
          saveSession(currentSessionId);
        }
        setError('');
        setResendTimer(60);
      } else {
        const errorMsg = generateResponse?.message || 'Failed to send OTP. Please try again.';
        setError(errorMsg);
        if (errorMsg.toLowerCase().includes('session')) {
          clearSession();
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('OTP generation error:', err);
      const errorMsg = err?.message || 'An error occurred while requesting OTP.';
      setError(errorMsg);
      if (errorMsg.toLowerCase().includes('session')) {
        clearSession();
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, getCurrentSessionId, formData, saveSession, clearSession]);

  // ============ VALIDATE OTP & CONFIRM TRANSFER ============
  const confirmTransfer = useCallback(async () => {
    // Prevent multiple submissions
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (!transferApi) {
        throw new Error('Transfer API service is not available');
      }

      // Get the current session ID
      const currentSessionId = getCurrentSessionId();
      
      if (!currentSessionId) {
        setError('OTP session not found. Please request a new OTP.');
        setOtpSent(false);
        setLoading(false);
        return;
      }

      // Validate OTP
      if (!otp || otp.length < 4) {
        setError('Please enter a valid OTP (minimum 4 digits).');
        setLoading(false);
        return;
      }

      // Check OTP attempts
      if (otpAttempts >= 3) {
        setError('Too many failed attempts. Please request a new OTP.');
        setOtpSent(false);
        setLoading(false);
        return;
      }

      // Validate OTP
      const validateResponse = await transferApi.validateOTP({
        sessionId: currentSessionId,
        otp: otp.trim()
      });

      if (!isMountedRef.current) return;

      if (!validateResponse || !validateResponse.success) {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        const remaining = 3 - newAttempts;
        const errorMsg = validateResponse?.message || `Invalid OTP. ${remaining} attempts remaining.`;
        setError(errorMsg);
        
        // If OTP is invalid due to expired session
        if (errorMsg.toLowerCase().includes('expired') || 
            errorMsg.toLowerCase().includes('not found')) {
          clearSession();
          setOtpSent(false);
        }
        setLoading(false);
        return;
      }

      // Validate amount
      const amount = parseFloat(formData?.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Invalid amount specified.');
        setLoading(false);
        return;
      }

      // Initiate Transfer
      const transferResponse = await transferApi.initiateTransfer({
        recipient_bank_code: formData?.recipientBank,
        recipient_account_number: formData?.recipientAccount,
        amount: amount,
        description: formData?.description || 'NGN Transfer',
        currency: 'NGN',
        otp_session_id: currentSessionId,
        otp: otp.trim()
      });

      if (!isMountedRef.current) return;

      if (transferResponse && transferResponse.success) {
        clearSession();
        if (navigate) {
          navigate('/status', { 
            state: { 
              reference: transferResponse.reference, 
              status: transferResponse.status,
              amount: formData.amount,
              recipient: formData.recipientAccount
            } 
          });
        }
      } else {
        const errorMsg = transferResponse?.message || 'Transfer initiation failed.';
        setError(errorMsg);
        if (errorMsg.toLowerCase().includes('session')) {
          clearSession();
          setOtpSent(false);
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Transfer error:', err);
      const errorMsg = err?.message || 'An error occurred during transfer.';
      setError(errorMsg);
      if (errorMsg.toLowerCase().includes('session')) {
        clearSession();
        setOtpSent(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, getCurrentSessionId, otp, otpAttempts, formData, clearSession, navigate]);

  // ============ RESEND OTP ============
  const resendOTP = useCallback(async () => {
    if (resendTimer > 0) {
      setError(`Please wait ${resendTimer} seconds before requesting again.`);
      return;
    }
    await requestOTP();
  }, [resendTimer, requestOTP]);

  // ============ RESET OTP FLOW ============
  const resetOTPFlow = useCallback(() => {
    setOtp('');
    setOtpSent(false);
    setError('');
    setOtpAttempts(0);
  }, []);

  // ============ HANDLE NAVIGATION ============
  const handleBack = useCallback(() => {
    if (navigate) {
      navigate('/transfer-details');
    }
  }, [navigate]);

  const handleNext = useCallback(() => {
    if (navigate) {
      navigate('/transfer-details');
    }
  }, [navigate]);

  // ============ TIMER EFFECT ============
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resendTimer]);

  // ============ CHECK SESSION ON MOUNT ============
  useEffect(() => {
    const existingSession = getCurrentSessionId();
    if (existingSession) {
      setSessionId(existingSession);
    }
  }, [getCurrentSessionId]);

  // ============ RENDER ============
  return (
    <div className="transfer-container">
      <h2>NGN Transfer</h2>
      <p className="subtitle">Secure bank-to-bank transfers · NGN only</p>
      
      <div className="steps-indicator">
        <span>3</span>
        <span>4</span>
      </div>

      {/* Sender Details */}
      <div className="sender-details">
        <h3>Sender Details</h3>
        <div className="detail-row">
          <span className="label">Sender Bank</span>
          <span className="value">{formData.senderBank}</span>
        </div>
        <div className="detail-row">
          <span className="label">Sender Account Number</span>
          <span className="value">{formData.senderAccount}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Session Status */}
      {!otpSent && (
        <div className="session-status">
          <p>Session: {sessionId ? 'Active' : 'Not initialized'}</p>
        </div>
      )}

      {/* OTP Section */}
      {!otpSent ? (
        <button 
          onClick={requestOTP} 
          disabled={loading}
          className="btn-primary"
          type="button"
        >
          {loading ? 'Requesting OTP...' : 'Request OTP'}
        </button>
      ) : (
        <div className="otp-section">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setOtp(value);
              if (error && error.toLowerCase().includes('otp')) {
                setError('');
              }
            }}
            disabled={loading}
            maxLength={6}
            className="otp-input"
            aria-label="Enter OTP"
          />
          
          <div className="button-group">
            <button 
              onClick={confirmTransfer} 
              disabled={loading || !otp || otp.length < 4}
              className="btn-success"
              type="button"
            >
              {loading ? 'Processing...' : 'Confirm Transfer'}
            </button>
            
            <button 
              onClick={resetOTPFlow}
              disabled={loading}
              className="btn-secondary"
              type="button"
            >
              Back
            </button>

            <button 
              onClick={resendOTP}
              disabled={loading || resendTimer > 0}
              className="btn-resend"
              type="button"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      <div className="navigation-buttons">
        <button 
          onClick={handleBack}
          className="btn-back"
          type="button"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          className="btn-next"
          type="button"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// ============ EXPORT ============
export default Transfer;
