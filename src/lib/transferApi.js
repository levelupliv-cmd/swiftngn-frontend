const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                      'https://flutterwave-backend-production.up.railway.app';

export const transferApi = {
  async initiate(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate transfer');
    }
    return response.json();
  },

  async confirm(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }
    return response.json();
  },

  async resendOTP(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resend OTP');
    }
    return response.json();
  },

  async getOTPStatus(reference) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/otp-status?reference=${reference}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get OTP status');
    }
    return response.json();
  },

  async getStatus(ref) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/status?ref=${ref}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get transfer status');
    }
    return response.json();
  },
};
