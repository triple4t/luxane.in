import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
// Get user's cart
export const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: {
                product: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const total = cartItems.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);
        res.json({
            success: true,
            data: {
                items: cartItems,
                total,
                count: cartItems.length,
            },
        });
    }
    catch (error) {
        throw new AppError('Failed to fetch cart', 500);
    }
};
// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, quantity = 1 } = req.body;
        // Check if product exists and is in stock
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        if (!product.inStock || product.stock < quantity) {
            throw new AppError('Product is out of stock', 400);
        }
        // Check if item already exists in cart
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        let cartItem;
        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                throw new AppError('Insufficient stock', 400);
            }
            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
                include: {
                    product: true,
                },
            });
        }
        else {
            // Create new cart item
            cartItem = await prisma.cartItem.create({
                data: {
                    userId,
                    productId,
                    quantity,
                },
                include: {
                    product: true,
                },
            });
        }
        res.status(201).json({
            success: true,
            data: cartItem,
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to add item to cart', 500);
    }
};
// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            throw new AppError('Quantity must be at least 1', 400);
        }
        // Get cart item
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { product: true },
        });
        if (!cartItem) {
            throw new AppError('Cart item not found', 404);
        }
        if (cartItem.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }
        // Check stock
        if (quantity > cartItem.product.stock) {
            throw new AppError('Insufficient stock', 400);
        }
        const updatedItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
            include: {
                product: true,
            },
        });
        res.json({
            success: true,
            data: updatedItem,
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to update cart item', 500);
    }
};
// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { itemId } = req.params;
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
        });
        if (!cartItem) {
            throw new AppError('Cart item not found', 404);
        }
        if (cartItem.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }
        await prisma.cartItem.delete({
            where: { id: itemId },
        });
        res.json({
            success: true,
            message: 'Item removed from cart',
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to remove item from cart', 500);
    }
};
// Clear entire cart
export const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        await prisma.cartItem.deleteMany({
            where: { userId },
        });
        res.json({
            success: true,
            message: 'Cart cleared',
        });
    }
    catch (error) {
        throw new AppError('Failed to clear cart', 500);
    }
};
