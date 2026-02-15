import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generatePasswordResetOtpToken, verifyPasswordResetOtpToken } from '../utils/jwt.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendVerification, verifyCode } from '../services/twilioVerifyService.js';
// Send OTP for signup (phone verification before creating account)
export const sendSignupOtp = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
        if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
            return res.status(400).json({ error: 'Valid 10-digit Indian mobile number is required' });
        }
        await sendVerification(cleanPhone);
        res.json({ message: 'Verification code sent to your phone' });
    } catch (error) {
        console.error('Send signup OTP error:', error);
        res.status(500).json({ error: 'Could not send verification code. Please try again.' });
    }
};

// User Registration (email + password + name + phone, verified by OTP)
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone, code } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (!name || String(name).trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
        if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
            return res.status(400).json({ error: 'Valid 10-digit Indian mobile number is required' });
        }
        if (!code || String(code).replace(/\D/g, '').length < 4) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const approved = await verifyCode(cleanPhone, String(code).replace(/\D/g, ''));
        if (!approved) {
            console.error('[Registration] OTP verification failed for phone:', cleanPhone);
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: String(name).trim(),
                phone: cleanPhone,
                role: 'USER',
            },
        });

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// User Login (email + password only; no OTP at login)
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.role !== 'USER') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const registerAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                role: 'ADMIN',
            },
        });

        const token = generateToken({
            userId: admin.id,
            email: admin.email,
            role: admin.role,
        });

        res.status(201).json({
            message: 'Admin registered successfully',
            token,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin Login (same as user login, but checks for ADMIN role)
export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const admin = await prisma.user.findUnique({
            where: { email },
        });

        if (!admin || admin.role !== 'ADMIN') {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const isPasswordValid = await comparePassword(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({
            userId: admin.id,
            email: admin.email,
            role: admin.role,
        });

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user
export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Forgot Password (Request Reset). If user has phone, send OTP; else send email link.
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.json({
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // If user has phone, send OTP and return token for OTP verification step
        if (user.phone && user.phone.trim().length >= 10) {
            try {
                await sendVerification(user.phone);
            } catch (otpError) {
                console.error('Twilio send OTP error:', otpError);
                return res.status(503).json({
                    error: 'Could not send verification code. Please try again or use email link.',
                });
            }
            const resetRequestToken = generatePasswordResetOtpToken(user.id);
            return res.json({
                message: 'Verification code sent to your phone',
                requiresOtp: true,
                resetRequestToken,
            });
        }

        // No phone: send email link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        try {
            await sendEmail(
                user.email,
                'Reset Your Password - Creative Universe',
                emailTemplates.passwordReset(resetLink)
            );
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
        }

        res.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verify OTP for password reset; returns the reset token to use in reset-password.
export const verifyResetOtp = async (req: Request, res: Response) => {
    try {
        const { resetRequestToken, code } = req.body;

        if (!resetRequestToken || !code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const codeDigits = code.replace(/\D/g, '');
        if (codeDigits.length < 4) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        let payload: { userId: string };
        try {
            payload = verifyPasswordResetOtpToken(resetRequestToken);
        } catch {
            return res.status(400).json({ error: 'Invalid or expired session. Please request a new reset.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        });

        if (!user || !user.phone || !user.resetToken) {
            return res.status(400).json({ error: 'Invalid session' });
        }

        const approved = await verifyCode(user.phone, codeDigits);
        if (!approved) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        res.json({
            message: 'Verified',
            resetToken: user.resetToken,
        });
    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Reset Password (with token)
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        // Send confirmation email
        try {
            await sendEmail(
                user.email,
                'Password Reset Successful - Creative Universe',
                emailTemplates.passwordResetSuccess()
            );
        } catch (emailError) {
            console.error('Failed to send password reset confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            message: 'Password has been reset successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
