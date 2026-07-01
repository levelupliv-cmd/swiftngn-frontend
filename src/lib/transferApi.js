// src/lib/transferApi.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                      'https://flutterwave-backend-production.up.railway.app';

export const transferApi = {
  // ============ GENERATE OTP ============
  async generateOTP(data) {
    const payload = {
      sessionId: data.sessionId,
      amount: data.amount,
      recipient_bank_code: data.recipient_bank_code,
      recipient_account_number: data.recipient_account_number,
      narration: data.narration || 'NGN Transfer',
      currency: data.currency || 'NGN'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/transfers/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to generate OTP'
        };
      }

      return {
        success: true,
        message: result.message || 'OTP sent successfully',
        data: result.data,
        sessionId: result.sessionId || data.sessionId
      };
    } catch (error) {
      console.error('Generate OTP error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please try again.'
      };
    }
  },

  // ============ VALIDATE OTP ============
  async validateOTP(data) {
    const payload = {
      sessionId: data.sessionId,
      otp: data.otp
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/transfers/validate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Invalid OTP'
        };
      }

      return {
        success: true,
        message: result.message || 'OTP validated successfully',
        data: result.data
      };
    } catch (error) {
      console.error('Validate OTP error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please try again.'
      };
    }
  },

  // ============ INITIATE TRANSFER ============
  async initiateTransfer(data) {
    const payload = {
      recipient_bank_code: data.recipient_bank_code,
      recipient_account_number: data.recipient_account_number,
      amount: data.amount,
      description: data.description || 'NGN Transfer',
      currency: data.currency || 'NGN',
      otp_session_id: data.otp_session_id,
      otp: data.otp // Added OTP for final confirmation
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/transfers/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to initiate transfer'
        };
      }

      return {
        success: true,
        reference: result.reference || result.data?.reference,
        status: result.status || result.data?.status || 'processing',
        message: result.message || 'Transfer initiated successfully',
        data: result.data || result
      };
    } catch (error) {
      console.error('Initiate transfer error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please try again.'
      };
    }
  },

  // ============ GET TRANSFER STATUS ============
  async getStatus(reference) {
    if (!reference) {
      return {
        success: false,
        message: 'Reference is required'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/transfers/status/${reference}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to get transfer status'
        };
      }

      // Return data in a consistent format
      return {
        success: true,
        status: result.status || result.data?.status || 'processing',
        reference: result.reference || result.data?.reference || reference,
        amount: result.amount || result.data?.amount,
        recipient: result.recipient || result.data?.recipient_name,
        recipient_bank: result.recipient_bank || result.data?.recipient_bank,
        data: result.data || result
      };
    } catch (error) {
      console.error('Get status error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please try again.',
        status: 'processing' // Keep processing status on network error
      };
    }
  },

  // ============ GET BANKS LIST (Optional Utility) ============
  async getBanks() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/banks`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to fetch banks'
        };
      }

      return {
        success: true,
        data: result.data || result
      };
    } catch (error) {
      console.error('Get banks error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please try again.'
      };
    }
  },

  // ============ VERIFY ACCOUNT (Optional Utility) ============
  async verifyAccount(data) {
    const payload = {
      bank_code: data.bank_code,
      account_number: data.account_number
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to verify account'
        };
      }

      return {
        success: true,
        account_name: result.account_name || result.data?.account_name,
        data: result.data || result
      };
    } catch (error) {
      console.error('Verify account error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please try again.'
      };
    }
  }
};

export default transferApi;
