import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d', // Token expires in 7 days
    });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
/** Short-lived token issued after password check when user has phone (OTP required) */
export const generateLoginOtpToken = (userId) => {
    return jwt.sign({ userId, purpose: 'login_otp' }, JWT_SECRET, { expiresIn: '5m' });
};
export const verifyLoginOtpToken = (token) => {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== 'login_otp') {
        throw new Error('Invalid token purpose');
    }
    return payload;
};
