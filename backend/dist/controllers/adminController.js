import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
export const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders, lowStockProducts,] = await Promise.all([
            prisma.user.count(),
            prisma.product.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: { total: true },
                where: {
                    payment: {
                        status: 'SUCCESS',
                    },
                },
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true, name: true },
                    },
                    payment: {
                        select: { status: true },
                    },
                },
            }),
            prisma.product.findMany({
                where: {
                    OR: [
                        { stock: { lte: 10 } },
                        { inStock: false },
                    ],
                },
                take: 10,
                orderBy: { stock: 'asc' },
            }),
        ]);
        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: totalRevenue._sum.total || 0,
                recentOrders,
                lowStockProducts,
            },
        });
    }
    catch (error) {
        throw new AppError('Failed to fetch dashboard stats', 500);
    }
};
