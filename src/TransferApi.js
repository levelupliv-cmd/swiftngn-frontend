// ============ SERVICES/TRANSFERAPI.JS - COMPLETE FIXED VERSION ============

// ============ CONFIGURATION ============
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                      'https://flutterwave-backend-production.up.railway.app';

// ============ HELPER FUNCTIONS ============
const handleResponse = async (response) => {
  // Check if response is ok
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  
  // Parse JSON response
  try {
    const data = await response.json();
    return data;
  } catch (e) {
    throw new Error('Invalid response format from server');
  }
};

// ============ API FUNCTIONS ============
export const transferApi = {
  /**
   * Create a new session for the transfer
   * @param {Object} data - Session data
   * @param {number} data.amount - Transfer amount
   * @param {string} data.recipient_bank_code - Bank code of recipient
   * @param {string} data.recipient_account_number - Account number of recipient
   * @returns {Promise<Object>} Response with sessionId
   */
  createSession: async (data) => {
    try {
      // Validate required fields
      if (!data?.amount || !data?.recipient_bank_code || !data?.recipient_account_number) {
        return {
          success: false,
          message: 'Missing required fields: amount, recipient_bank_code, recipient_account_number'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/transfers/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          recipient_bank_code: data.recipient_bank_code,
          recipient_account_number: data.recipient_account_number
        }),
      });

      const result = await handleResponse(response);
      
      // Normalize response format
      return {
        success: true,
        sessionId: result.sessionId || result.session_id || result.data?.sessionId,
        ...result
      };
    } catch (error) {
      console.error('Create session error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create session. Please try again.'
      };
    }
  },

  /**
   * Generate OTP for transfer
   * @param {Object} data - OTP generation data
   * @param {string} data.sessionId - Active session ID
   * @param {number} data.amount - Transfer amount
   * @param {string} data.recipient_bank_code - Bank code of recipient
   * @param {string} data.recipient_account_number - Account number of recipient
   * @param {string} data.narration - Transaction description
   * @param {string} data.currency - Currency code (default: NGN)
   * @returns {Promise<Object>} Response with success status
   */
  generateOTP: async (data) => {
    try {
      // Validate required fields
      if (!data?.sessionId) {
        return {
          success: false,
          message: 'Session ID is required'
        };
      }

      if (!data?.amount || isNaN(data.amount) || data.amount <= 0) {
        return {
          success: false,
          message: 'Valid amount is required'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/transfers/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: data.sessionId,
          amount: data.amount,
          recipient_bank_code: data.recipient_bank_code,
          recipient_account_number: data.recipient_account_number,
          narration: data.narration || 'NGN Transfer',
          currency: data.currency || 'NGN'
        }),
      });

      const result = await handleResponse(response);
      
      // Normalize response format
      return {
        success: true,
        sessionId: result.sessionId || result.session_id || data.sessionId,
        message: result.message || 'OTP sent successfully',
        ...result
      };
    } catch (error) {
      console.error('Generate OTP error:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate OTP. Please try again.'
      };
    }
  },

  /**
   * Validate OTP
   * @param {Object} data - OTP validation data
   * @param {string} data.sessionId - Active session ID
   * @param {string} data.otp - OTP to validate
   * @returns {Promise<Object>} Response with success status
   */
  validateOTP: async (data) => {
    try {
      // Validate required fields
      if (!data?.sessionId) {
        return {
          success: false,
          message: 'Session ID is required'
        };
      }

      if (!data?.otp || data.otp.length < 4) {
        return {
          success: false,
          message: 'Valid OTP is required (minimum 4 digits)'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/transfers/otp/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: data.sessionId,
          otp: data.otp.trim()
        }),
      });

      const result = await handleResponse(response);
      
      // Normalize response format
      return {
        success: true,
        message: result.message || 'OTP validated successfully',
        ...result
      };
    } catch (error) {
      console.error('Validate OTP error:', error);
      return {
        success: false,
        message: error.message || 'OTP validation failed. Please try again.'
      };
    }
  },

  /**
   * Initiate the actual transfer
   * @param {Object} data - Transfer data
   * @param {string} data.recipient_bank_code - Bank code of recipient
   * @param {string} data.recipient_account_number - Account number of recipient
   * @param {number} data.amount - Transfer amount
   * @param {string} data.description - Transaction description
   * @param {string} data.currency - Currency code (default: NGN)
   * @param {string} data.otp_session_id - Session ID for OTP validation
   * @param {string} data.otp - Validated OTP
   * @returns {Promise<Object>} Response with transfer details
   */
  initiateTransfer: async (data) => {
    try {
      // Validate required fields
      if (!data?.recipient_bank_code) {
        return {
          success: false,
          message: 'Recipient bank code is required'
        };
      }

      if (!data?.recipient_account_number) {
        return {
          success: false,
          message: 'Recipient account number is required'
        };
      }

      if (!data?.amount || isNaN(data.amount) || data.amount <= 0) {
        return {
          success: false,
          message: 'Valid amount is required'
        };
      }

      if (!data?.otp_session_id) {
        return {
          success: false,
          message: 'OTP session ID is required'
        };
      }

      if (!data?.otp) {
        return {
          success: false,
          message: 'OTP is required to complete the transfer'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/transfers/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_bank_code: data.recipient_bank_code,
          recipient_account_number: data.recipient_account_number,
          amount: data.amount,
          description: data.description || 'NGN Transfer',
          currency: data.currency || 'NGN',
          otp_session_id: data.otp_session_id,
          otp: data.otp.trim()
        }),
      });

      const result = await handleResponse(response);
      
      // Normalize response format
      return {
        success: true,
        reference: result.reference || result.transaction_reference || result.data?.reference,
        status: result.status || 'completed',
        message: result.message || 'Transfer completed successfully',
        ...result
      };
    } catch (error) {
      console.error('Initiate transfer error:', error);
      return {
        success: false,
        message: error.message || 'Transfer failed. Please try again.'
      };
    }
  },

  /**
   * Check transfer status
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Response with transfer status
   */
  checkTransferStatus: async (reference) => {
    try {
      if (!reference) {
        return {
          success: false,
          message: 'Transaction reference is required'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/transfers/status?ref=${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await handleResponse(response);
      
      // Normalize response format
      return {
        success: true,
        status: result.status || result.data?.status || 'processing',
        reference: result.reference || result.data?.reference || reference,
        amount: result.amount || result.data?.amount,
        recipient: result.recipient || result.data?.recipient || result.data?.recipient_account,
        message: result.message || result.data?.message,
        data: result.data || result,
        ...result
      };
    } catch (error) {
      console.error('Check transfer status error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check transfer status'
      };
    }
  },

  // ============ ALIASES FOR BACKWARD COMPATIBILITY ============
  // These match your original function names but use the new implementations
  
  /**
   * Initiate transfer (alias for initiateTransfer)
   * @deprecated Use initiateTransfer instead
   */
  initiate: async (data) => {
    return transferApi.initiateTransfer(data);
  },

  /**
   * Confirm transfer with OTP (alias for validateOTP)
   * @deprecated Use validateOTP instead
   */
  confirm: async (data) => {
    return transferApi.validateOTP(data);
  },

  /**
   * Resend OTP (alias for generateOTP)
   * @deprecated Use generateOTP instead
   */
  resendOTP: async (data) => {
    return transferApi.generateOTP(data);
  },

  /**
   * Check OTP status
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Response with OTP status
   */
  getOTPStatus: async (reference) => {
    try {
      if (!reference) {
        return {
          success: false,
          message: 'Transaction reference is required'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/transfers/otp-status?reference=${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await handleResponse(response);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Get OTP status error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get OTP status'
      };
    }
  },

  /**
   * Get transfer status (alias for checkTransferStatus)
   * @deprecated Use checkTransferStatus instead
   */
  getStatus: async (ref) => {
    return transferApi.checkTransferStatus(ref);
  }
};

// ============ EXPORT DEFAULT ============
export default transferApi;
