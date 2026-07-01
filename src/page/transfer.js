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
    const currentSessionId = formData.sessionId || transactionRef;
    
    if (!currentSessionId) {
      setError('Session expired. Please go back and try again.');
      setLoading(false);
      return;
    }

    // Generate OTP
    const generateResponse = await transferApi.generateOTP({
      sessionId: currentSessionId,
      amount: parseFloat(formData.amount),
      recipient_bank_code: formData.recipientBank,
      recipient_account_number: formData.recipientAccount,
      narration: formData.description || 'NGN Transfer',
      currency: 'NGN'
    });

    if (generateResponse.success) {
      setOtpSent(true);
      setSessionId(currentSessionId);
      setError('');
    } else {
      setError(generateResponse.message || 'Failed to send OTP. Please try again.');
    }
  } catch (err) {
    console.error('OTP generation error:', err);
    setError(err.message || 'An error occurred while requesting OTP.');
  } finally {
    setLoading(false);
  }
};

// ============ VALIDATE OTP & CONFIRM TRANSFER ============
const confirmTransfer = async () => {
  setLoading(true);
  setError('');
  
  try {
    const currentSessionId = formData.sessionId || transactionRef || sessionId;
    
    if (!currentSessionId) {
      setError('Session expired. Please go back and try again.');
      setLoading(false);
      return;
    }

    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP.');
      setLoading(false);
      return;
    }

    // Step 1: Validate OTP
    const validateResponse = await transferApi.validateOTP({
      sessionId: currentSessionId,
      otp: otp.trim()
    });

    if (!validateResponse.success) {
      setError(validateResponse.message || 'Invalid OTP. Please try again.');
      setLoading(false);
      return;
    }

    // Step 2: Initiate Transfer
    const transferResponse = await transferApi.initiateTransfer({
      recipient_bank_code: formData.recipientBank,
      recipient_account_number: formData.recipientAccount,
      amount: parseFloat(formData.amount),
      description: formData.description || 'NGN Transfer',
      currency: 'NGN',
      otp_session_id: currentSessionId,
      otp: otp.trim()
    });

    if (transferResponse.success) {
      navigate('/status', { 
        state: { 
          reference: transferResponse.reference, 
          status: transferResponse.status 
        } 
      });
    } else {
      setError(transferResponse.message || 'Transfer initiation failed.');
    }
  } catch (err) {
    console.error('Transfer error:', err);
    setError(err.message || 'An error occurred during transfer.');
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
