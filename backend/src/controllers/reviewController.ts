import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Create or update review
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      throw new AppError('Product ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Create or update review (upsert)
    const review = await prisma.review.upsert({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
      update: {
        rating,
        comment: comment || null,
        updatedAt: new Date(),
      },
      create: {
        productId,
        userId,
        rating,
        comment: comment || null,
      },
    });

    // Calculate and update product average rating
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const reviewCount = reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount,
      },
    });

    // Fetch review with user info
    const reviewWithUser = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: reviewWithUser,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create review', 500);
  }
};

// Get reviews for a product
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    throw new AppError('Failed to fetch reviews', 500);
  }
};

// Get user's review for a product
export const getUserReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const review = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    throw new AppError('Failed to fetch review', 500);
  }
};

// Delete review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const productId = review.productId;

    await prisma.review.delete({
      where: { id },
    });

    // Recalculate product average rating
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    const reviewCount = reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete review', 500);
  }
};

