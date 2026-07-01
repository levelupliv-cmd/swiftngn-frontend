const confirmTransfer = async () => {
  setLoading(true);
  setError('');
  try {
    const sessionId = formData.sessionId || transactionRef;
    
    if (!sessionId) {
      setError('Session expired. Please go back and try again.');
      setLoading(false);
      return;
    }

    // Validate OTP first
    const validateResponse = await transferApi.validateOTP({
      sessionId: sessionId,
      otp: formData.otp,
    });

    if (!validateResponse.success) {
      setError(validateResponse.message || 'Invalid OTP');
      setLoading(false);
      return;
    }

    // Then initiate transfer with ALL required fields
    const transferResponse = await transferApi.initiateTransfer({
      recipient_bank_code: formData.recipientBank,
      recipient_account_number: formData.recipientAccount,
      amount: parseFloat(formData.amount),
      description: formData.description || 'NGN Transfer',
      currency: 'NGN',
      otp_session_id: sessionId
    });

    if (transferResponse.success) {
      navigate('/status', { 
        state: { 
          reference: transferResponse.reference, 
          status: transferResponse.status 
        } 
      });
    } else {
      setError(transferResponse.message || 'Transfer failed');
    }
  } catch (err) {
    console.error('Transfer error:', err);
    setError(err.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
