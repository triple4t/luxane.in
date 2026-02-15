import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';

// Subscribe to newsletter
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        return res.json({
          success: true,
          message: 'You are already subscribed to our newsletter',
        });
      } else {
        // Reactivate subscription
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true },
        });
        return res.json({
          success: true,
          message: 'You have been resubscribed to our newsletter',
        });
      }
    }

    // Create new subscription
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        isActive: true,
      },
    });

    // Send welcome email (optional)
    try {
      const welcomeEmail = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Welcome to Creative Universe Newsletter!</h2>
              <p>Thank you for subscribing. You'll receive updates about our latest products and exclusive offers.</p>
              <p>© 2026 Creative Universe. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;
      await sendEmail(
        email,
        'Welcome to Creative Universe Newsletter',
        welcomeEmail
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to subscribe to newsletter', 500);
  }
};

// Unsubscribe from newsletter
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return res.json({
        success: true,
        message: 'Email not found in our newsletter list',
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to unsubscribe from newsletter', 500);
  }
};

// Get all subscribers (Admin only)
export const getAllSubscribers = async (req: Request, res: Response) => {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: subscribers,
      count: subscribers.length,
    });
  } catch (error) {
    throw new AppError('Failed to fetch subscribers', 500);
  }
};

