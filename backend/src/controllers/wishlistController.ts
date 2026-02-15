import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user's wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: wishlistItems,
      count: wishlistItems.length,
    });
  } catch (error) {
    throw new AppError('Failed to fetch wishlist', 500);
  }
};

// Add to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new AppError('Product already in wishlist', 400);
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    res.status(201).json({
      success: true,
      data: wishlistItem,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to add to wishlist', 500);
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      throw new AppError('Item not found in wishlist', 404);
    }

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove from wishlist', 500);
  }
};

