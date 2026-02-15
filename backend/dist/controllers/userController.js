import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        throw new AppError('Failed to fetch users', 500);
    }
};
// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['USER', 'ADMIN'].includes(role)) {
            throw new AppError('Invalid role', 400);
        }
        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to update user role', 500);
    }
};
// Delete user (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        throw new AppError('Failed to delete user', 500);
    }
};
