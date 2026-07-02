import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { // This REPLACES the Base44 client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                      'https://flutterwave-backend-production.up.railway.app';

export const transferApi = {
  // Initiate transfer
  async initiate(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate transfer');
    }
    
    return response.json();
  },

  // Confirm transfer with OTP
  async confirm(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }
    
    return response.json();
  },

  // Resend OTP
  async resendOTP(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resend OTP');
    }
    
    return response.json();
  },

  // Check OTP status
  async getOTPStatus(reference) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/otp-status?reference=${reference}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get OTP status');
    }
    
    return response.json();
  },

  // Check transfer status
  async getStatus(ref) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/status?ref=${ref}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get transfer status');
    }
    
    return response.json();
  },
}; } from '../lib/transferApi';

const STEPS = [
  { id: 1, label: 'Recipient' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Sender' },
  { id: 4, label: 'OTP' },
];

const BANKS = [
  // Commercial Banks
  'Access Bank', 'United Bank for Africa (UBA)', 'Zenith Bank',
  'First Bank of Nigeria', 'Guaranty Trust Bank (GTBank)',
  'Fidelity Bank', 'Ecobank Nigeria', 'Stanbic IBTC Bank',
  'First City Monument Bank (FCMB)', 'Sterling Bank', 'Wema Bank',
  'Jaiz Bank', 'Globus Bank', 'Premium Trust Bank',
  'Citibank Nigeria', 'Standard Chartered Bank (Nigeria)',
  // Fintechs & Digital Banks
  'Kuda Bank', 'OPay', 'Moniepoint', 'PalmPay', 'Paga',
  // Other Banks
  'Heritage Bank', 'Keystone Bank', 'Polaris Bank',
  'Providus Bank', 'Suntrust Bank', 'Titan Trust Bank',
  'Union Bank of Nigeria', 'Unity Bank', 'VFD Microfinance Bank',
  'Lotus Bank', 'TAJ Bank'
];

export default function Transfer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState('');
  const [timer, setTimer] = useState(60);
  const [transactionRef, setTransactionRef] = useState('');
  const [resendAttempts, setResendAttempts] = useState(3);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Recipient
    recipientBank: '',
    recipientAccount: '',
    // Step 2: Details
    amount: '',
    description: '',
    // Step 3: Sender
    senderBank: '',
    senderAccount: '',
    // Step 4: OTP
    otp: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.recipientBank) { setError('Please select a recipient bank'); return false; }
      if (!formData.recipientAccount || formData.recipientAccount.length !== 10) {
        setError('Please enter a valid 10-digit account number');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.senderBank) { setError('Please select a sender bank'); return false; }
      if (!formData.senderAccount || formData.senderAccount.length !== 10) {
        setError('Please enter a valid 10-digit account number');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.otp || formData.otp.length < 4) {
        setError('Please enter the OTP code');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step === 3) {
        initiateTransfer();
      } else {
        setStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    setError('');
  };

  const initiateTransfer = async () => {
    setLoading(true);
    setError('');
    try {
      const data = {
        recipient_bank_code: formData.recipientBank,
        recipient_account_number: formData.recipientAccount,
        amount: parseFloat(formData.amount),
        description: formData.description || 'NGN Transfer',
        sender_account_number: formData.senderAccount,
      };
      const response = await transferApi.initiate(data);
      if (response.success) {
        setTransactionRef(response.reference);
        setOtpSent(true);
        setStep(4);
        startTimer();
      } else {
        setError(response.message || 'Failed to initiate transfer');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const confirmTransfer = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await transferApi.confirm({
        reference: transactionRef,
        otp: formData.otp,
      });
      if (response.success) {
        navigate('/status', { state: { reference: transactionRef, status: response.status } });
      } else {
        setError(response.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendAttempts <= 0) {
      setError('No more resend attempts remaining');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await transferApi.resendOTP({ reference: transactionRef });
      if (response.success) {
        setResendAttempts(prev => prev - 1);
        startTimer();
        setOtpStatus('OTP resent successfully');
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400">Recipient Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Recipient Bank / Mobile Money
              </label>
              <select
                name="recipientBank"
                value={formData.recipientBank}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select bank or mobile money...</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Recipient Account Number
              </label>
              <input
                type="text"
                name="recipientAccount"
                value={formData.recipientAccount}
                onChange={handleChange}
                placeholder="Enter 10-digit account number"
                maxLength={10}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the beneficiary's NUBAN account number</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400">Amount & Description</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount (NGN)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter transfer description"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400">Sender Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sender Bank
              </label>
              <select
                name="senderBank"
                value={formData.senderBank}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your bank...</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sender Account Number
              </label>
              <input
                type="text"
                name="senderAccount"
                value={formData.senderAccount}
                onChange={handleChange}
                placeholder="Enter 10-digit account number"
                maxLength={10}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400">Verify with OTP</h2>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-2">SUMMARY</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Amount:</span> ₦{formData.amount}</p>
                <p><span className="text-gray-500">To:</span> {formData.recipientBank} · {formData.recipientAccount}</p>
                <p><span className="text-gray-500">From:</span> {formData.senderBank}</p>
                <p><span className="text-gray-500">Note:</span> {formData.description || 'Good'}</p>
                <p><span className="text-gray-500">Reference:</span> {transactionRef || '...'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter OTP (4-8 digits)"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the OTP sent to your registered phone/email by your bank
              </p>
            </div>
            {timer > 0 && (
              <p className="text-sm text-gray-400">⏱️ OTP valid for: {timer}s</p>
            )}
            {resendAttempts > 0 && timer === 0 && (
              <button
                onClick={resendOTP}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Resend OTP ({resendAttempts} attempts remaining)
              </button>
            )}
            {otpStatus && (
              <p className="text-green-400 text-sm">{otpStatus}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">NGN Transfer</h1>
        <p className="text-sm text-gray-400">Secure bank-to-bank transfers · NGN only</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-between mb-6">
        {STEPS.map((s) => (
          <div key={s.id} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s.id === step ? 'bg-blue-500 text-white' :
              s.id < step ? 'bg-green-500 text-white' :
              'bg-gray-700 text-gray-400'
            }`}>
              {s.id < step ? '✓' : s.id}
            </div>
            <span className={`text-xs mt-1 ${s.id === step ? 'text-blue-400' : 'text-gray-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-4">
        {step > 1 && step !== 4 && (
          <button
            onClick={prevStep}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
          >
            Back
          </button>
        )}
        <button
          onClick={step === 4 ? confirmTransfer : nextStep}
          disabled={loading}
          className={`flex-1 py-3 rounded-lg font-medium transition ${
            loading ? 'bg-blue-700 opacity-50' :
            step === 4 ? 'bg-green-600 hover:bg-green-700' :
            'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Processing...
            </span>
          ) : step === 4 ? (
            `Pay ₦${formData.amount || '0.00'}`
          ) : (
            'Next →'
          )}
        </button>
      </div>

      {/* Chat to Edit */}
      {step === 4 && (
        <button className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition">
          💬 Chat to Edit
        </button>
      )}
    </div>
  );
}
