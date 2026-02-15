import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
// Create order (no OTP)
export const createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { addressId } = req.body;
        if (!addressId) {
            throw new AppError('Address ID is required', 400);
        }
        // Verify address belongs to user
        const address = await prisma.address.findUnique({
            where: { id: addressId },
        });
        if (!address) {
            throw new AppError('Address not found', 404);
        }
        if (address.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }
        // Get user's cart items
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: { product: true },
        });
        if (cartItems.length === 0) {
            throw new AppError('Cart is empty', 400);
        }
        // Validate stock and calculate total
        let total = 0;
        for (const item of cartItems) {
            if (!item.product.inStock || item.product.stock < item.quantity) {
                throw new AppError(`Product ${item.product.name} is out of stock`, 400);
            }
            total += item.product.price * item.quantity;
        }
        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    addressId,
                    total,
                    status: 'PENDING',
                },
            });
            // Create order items and update stock
            const orderItems = [];
            for (const cartItem of cartItems) {
                const orderItem = await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: cartItem.productId,
                        quantity: cartItem.quantity,
                        price: cartItem.product.price,
                    },
                });
                // Update product stock
                await tx.product.update({
                    where: { id: cartItem.productId },
                    data: {
                        stock: {
                            decrement: cartItem.quantity,
                        },
                        inStock: {
                            set: cartItem.product.stock - cartItem.quantity > 0,
                        },
                    },
                });
                orderItems.push(orderItem);
            }
            // Clear cart
            await tx.cartItem.deleteMany({
                where: { userId },
            });
            return { ...newOrder, orderItems };
        });
        // Send order confirmation email
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, name: true },
            });
            if (user) {
                const orderItemsWithProducts = await prisma.orderItem.findMany({
                    where: { orderId: order.id },
                    include: { product: true },
                });
                await sendEmail(user.email, `Order Confirmation #${order.id.slice(0, 8)} - Creative Universe`, emailTemplates.orderConfirmation(order, orderItemsWithProducts));
            }
        }
        catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order if email fails
        }
        res.status(201).json({
            success: true,
            data: order,
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to create order', 500);
    }
};
// Get user's orders
export const getOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                address: true,
                payment: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json({
            success: true,
            data: orders,
        });
    }
    catch (error) {
        throw new AppError('Failed to fetch orders', 500);
    }
};
// Get single order
export const getOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                address: true,
                payment: true,
            },
        });
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        if (order.userId !== userId && req.user.role !== 'ADMIN') {
            throw new AppError('Unauthorized', 403);
        }
        res.json({
            success: true,
            data: order,
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to fetch order', 500);
    }
};
// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        if (order.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }
        if (order.status === 'CANCELLED') {
            throw new AppError('Order is already cancelled', 400);
        }
        if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
            throw new AppError('Cannot cancel shipped or delivered order', 400);
        }
        // Update order status and restore stock
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            // Restore stock
            for (const item of order.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                        inStock: true,
                    },
                });
            }
        });
        res.json({
            success: true,
            message: 'Order cancelled',
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to cancel order', 500);
    }
};
// Admin: Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const { status, page = '1', limit = '20', } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    address: true,
                    payment: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limitNum,
            }),
            prisma.order.count({ where }),
        ]);
        res.json({
            success: true,
            data: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        throw new AppError('Failed to fetch orders', 500);
    }
};
// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
            throw new AppError('Invalid order status', 400);
        }
        const order = await prisma.order.findUnique({
            where: { id },
        });
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                address: true,
                payment: true,
            },
        });
        res.json({
            success: true,
            data: updatedOrder,
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to update order status', 500);
    }
};
