// ============ STATE DECLARATIONS ============
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [otpSent, setOtpSent] = useState(false);
const [otp, setOtp] = useState('');
const [sessionId, setSessionId] = useState('');

// ============ REQUEST OTP FUNCTION ============
const requestOTP = async () => {
  setLoading(true);
  setError('');
  setOtpSent(false);
  
  try {
    // FIX 1: Check if transferApi is defined
    if (!transferApi) {
      throw new Error('Transfer API service is not available');
    }

    const currentSessionId = formData?.sessionId || transactionRef;
    
    if (!currentSessionId) {
      setError('Session expired. Please go back and try again.');
      setLoading(false);
      return;
    }

    // FIX 2: Validate amount is a valid number
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

    // FIX 3: Check response structure properly
    if (generateResponse && generateResponse.success) {
      setOtpSent(true);
      setSessionId(currentSessionId);
      setError('');
    } else {
      setError(generateResponse?.message || 'Failed to send OTP. Please try again.');
    }
  } catch (err) {
    console.error('OTP generation error:', err);
    setError(err?.message || 'An error occurred while requesting OTP.');
  } finally {
    setLoading(false);
  }
};

// ============ VALIDATE OTP & CONFIRM TRANSFER ============
const confirmTransfer = async () => {
  setLoading(true);
  setError('');
  
  try {
    // FIX 4: Check if transferApi is defined
    if (!transferApi) {
      throw new Error('Transfer API service is not available');
    }

    const currentSessionId = formData?.sessionId || transactionRef || sessionId;
    
    if (!currentSessionId) {
      setError('Session expired. Please go back and try again.');
      setLoading(false);
      return;
    }

    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP (minimum 4 digits).');
      setLoading(false);
      return;
    }

    // Step 1: Validate OTP
    const validateResponse = await transferApi.validateOTP({
      sessionId: currentSessionId,
      otp: otp.trim()
    });

    if (!validateResponse || !validateResponse.success) {
      setError(validateResponse?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
      return;
    }

    // FIX 5: Validate amount before transfer
    const amount = parseFloat(formData?.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount specified.');
      setLoading(false);
      return;
    }

    // Step 2: Initiate Transfer
    const transferResponse = await transferApi.initiateTransfer({
      recipient_bank_code: formData?.recipientBank,
      recipient_account_number: formData?.recipientAccount,
      amount: amount,
      description: formData?.description || 'NGN Transfer',
      currency: 'NGN',
      otp_session_id: currentSessionId,
      otp: otp.trim()
    });

    // FIX 6: Check response and navigate properly
    if (transferResponse && transferResponse.success) {
      if (navigate) {
        navigate('/status', { 
          state: { 
            reference: transferResponse.reference, 
            status: transferResponse.status 
          } 
        });
      } else {
        console.error('Navigation function not available');
        setError('Navigation error. Please try again.');
      }
    } else {
      setError(transferResponse?.message || 'Transfer initiation failed.');
    }
  } catch (err) {
    console.error('Transfer error:', err);
    setError(err?.message || 'An error occurred during transfer.');
  } finally {
    setLoading(false);
  }
};

// ============ RESET OTP FLOW ============
const resetOTPFlow = () => {
  setOtp('');
  setOtpSent(false);
  setError('');
};
