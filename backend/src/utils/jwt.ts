import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d', // Token expires in 7 days
    });
};

export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export interface PasswordResetOtpPayload {
    userId: string;
    purpose: 'password_reset_otp';
}

export const generatePasswordResetOtpToken = (userId: string): string => {
    return jwt.sign(
        { userId, purpose: 'password_reset_otp' } as PasswordResetOtpPayload,
        JWT_SECRET,
        { expiresIn: '10m' }
    );
};

export const verifyPasswordResetOtpToken = (token: string): PasswordResetOtpPayload => {
    const payload = jwt.verify(token, JWT_SECRET) as PasswordResetOtpPayload;
    if (payload.purpose !== 'password_reset_otp') {
        throw new Error('Invalid token purpose');
    }
    return payload;
};