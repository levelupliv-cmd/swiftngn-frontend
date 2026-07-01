const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                      'https://flutterwave-backend-production.up.railway.app';

export const transferApi = {
  // Initiate transfer
  async initiateTransfer(data) {
    // Make sure the data has all required fields
    const payload = {
      recipient_bank_code: data.recipient_bank_code,
      recipient_account_number: data.recipient_account_number,
      amount: data.amount,
      description: data.description || 'NGN Transfer',
      currency: data.currency || 'NGN',
      otp_session_id: data.otp_session_id
    };
    
    const response = await fetch(`${API_BASE_URL}/api/transfers/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate transfer');
    }
    return response.json();
  }
};
