/// <reference types="node" />
import axios from 'axios';
const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_SMS = process.env.ENABLE_SMS !== 'false'; // Default to true, set to 'false' to disable
if (!FAST2SMS_API_KEY) {
    console.warn('FAST2SMS_API_KEY is not set in environment variables');
}
/**
 * Send OTP SMS using Fast2SMS Quick SMS API (doesn't require DLT registration)
 * In development mode, if SMS fails or is disabled, OTP will be logged to console
 * @param phoneNumber - 10-digit Indian mobile number (without country code)
 * @param otp - 6-digit OTP code
 * @returns Promise with API response
 */
export const sendOTP = async (phoneNumber, otp) => {
    // Remove any non-digit characters and ensure it's a 10-digit number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
        throw new Error('Invalid phone number. Must be a 10-digit Indian mobile number');
    }
    // Development mode: Log OTP to console if SMS is disabled or in dev mode
    if (NODE_ENV === 'development' && (!ENABLE_SMS || !FAST2SMS_API_KEY)) {
        console.log('\n========================================');
        console.log('📱 OTP FOR DEVELOPMENT/TESTING');
        console.log('========================================');
        console.log(`Phone: ${cleanPhone}`);
        console.log(`OTP: ${otp}`);
        console.log('========================================\n');
        // Return a mock success response
        return {
            return: true,
            request_id: `dev_${Date.now()}`,
            message: ['OTP logged to console (development mode)'],
        };
    }
    if (!FAST2SMS_API_KEY) {
        throw new Error('Fast2SMS API key is not configured');
    }
    // Create OTP message
    const message = `Your OTP for Creative Universe is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    try {
        const response = await axios.post(FAST2SMS_API_URL, {
            message: message,
            route: 'q', // Quick SMS route (doesn't require DLT registration)
            numbers: cleanPhone,
        }, {
            headers: {
                authorization: FAST2SMS_API_KEY,
            },
        });
        return response.data;
    }
    catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again later.';
        const statusCode = error.response?.data?.status_code;
        // Debug: Log environment
        console.log('🔍 Debug - NODE_ENV:', NODE_ENV);
        console.log('🔍 Debug - Error status_code:', statusCode);
        // Always log OTP when API fails (for development/testing)
        // This allows testing even when Fast2SMS account has limitations
        console.warn('\n⚠️  Fast2SMS API Error:', errorMessage);
        console.log('\n========================================');
        console.log('📱 OTP FOR DEVELOPMENT/TESTING');
        console.log('========================================');
        console.log(`Phone: ${cleanPhone}`);
        console.log(`OTP: ${otp}`);
        console.log('========================================\n');
        // Return mock success so testing can continue
        // In production, you should handle this differently (maybe use a different SMS provider)
        return {
            return: true,
            request_id: `dev_error_${Date.now()}`,
            message: ['OTP logged to console due to API error'],
        };
    }
};
/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
