const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                      'https://flutterwave-backend-production.up.railway.app';

export const transferApi = {
  // Generate OTP
  async generateOTP(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate OTP');
    }
    return response.json();
  },

  // Validate OTP
  async validateOTP(data) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/validate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid OTP');
    }
    return response.json();
  },

  // Initiate transfer
  async initiateTransfer(data) {
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

  // Get transfer status
  async getStatus(ref) {
    const response = await fetch(`${API_BASE_URL}/api/transfers/status?ref=${ref}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get transfer status');
    }
    return response.json();
  },

  // Resend OTP
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
};
