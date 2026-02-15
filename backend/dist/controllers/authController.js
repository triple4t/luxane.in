import crypto from 'crypto';
import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generateLoginOtpToken, verifyLoginOtpToken } from '../utils/jwt.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendVerification, verifyCode } from '../services/twilioVerifyService.js';
// User Registration (email + password)
export const register = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
        if (phone && cleanPhone && cleanPhone.length !== 10) {
            return res.status(400).json({ error: 'Invalid phone number. Must be a 10-digit Indian mobile number' });
        }
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                phone: cleanPhone || null,
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// User Login (email + password). If user has phone, OTP is sent and client must call verify-login-otp.
export const login = async (req, res) => {
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
        // If user has phone, require OTP via Twilio Verify
        if (user.phone && user.phone.trim().length >= 10) {
            try {
                await sendVerification(user.phone);
            }
            catch (otpError) {
                console.error('Twilio send OTP error:', otpError);
                return res.status(503).json({
                    error: 'Could not send verification code. Please try again later.',
                });
            }
            const loginToken = generateLoginOtpToken(user.id);
            return res.json({
                message: 'Verification code sent to your phone',
                requiresOtp: true,
                loginToken,
            });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Verify login OTP and issue session token
export const verifyLoginOtp = async (req, res) => {
    try {
        const { loginToken, code } = req.body;
        if (!loginToken || !code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Login token and verification code are required' });
        }
        const codeDigits = code.replace(/\D/g, '');
        if (codeDigits.length < 4) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        let payload;
        try {
            payload = verifyLoginOtpToken(loginToken);
        }
        catch {
            return res.status(400).json({ error: 'Invalid or expired login session. Please sign in again.' });
        }
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user || !user.phone) {
            return res.status(400).json({ error: 'Invalid session' });
        }
        const approved = await verifyCode(user.phone, codeDigits);
        if (!approved) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
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
    }
    catch (error) {
        console.error('Verify login OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const registerAdmin = async (req, res) => {
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
    }
    catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Admin Login (same as user login, but checks for ADMIN role)
export const loginAdmin = async (req, res) => {
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
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Get current user
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
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
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Forgot Password (Request Reset)
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        // Don't reveal if user exists (security best practice)
        if (!user) {
            return res.json({
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
        // Send email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        try {
            await sendEmail(user.email, 'Reset Your Password - Creative Universe', emailTemplates.passwordReset(resetLink));
        }
        catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            // Don't fail the request if email fails
        }
        res.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Reset Password (with token)
export const resetPassword = async (req, res) => {
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
            await sendEmail(user.email, 'Password Reset Successful - Creative Universe', emailTemplates.passwordResetSuccess());
        }
        catch (emailError) {
            console.error('Failed to send password reset confirmation email:', emailError);
            // Don't fail the request if email fails
        }
        res.json({
            message: 'Password has been reset successfully',
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
