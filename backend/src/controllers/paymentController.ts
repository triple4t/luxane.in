import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import razorpay, { verifyPaymentSignature, verifyWebhookSignature } from '../config/razorpay.js';
import { createShiprocketOrder } from '../services/shiprocketService.js';

// Create Razorpay order
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const userId = req.user!.userId;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (order.status !== 'PENDING') {
      throw new AppError('Order is not in pending status', 400);
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      throw new AppError('Payment already completed', 400);
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId,
        userId,
      },
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        currency: 'INR',
        status: 'PENDING',
      },
      update: {
        razorpayOrderId: razorpayOrder.id,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: Number(razorpayOrder.amount) / 100, // Return in rupees
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Razorpay order creation error:', error);
    throw new AppError('Failed to create payment order', 500);
  }
};

// Verify payment
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user!.userId;

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Get order and payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    // Update payment and order status
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          razorpayPaymentId,
          status: payment.status === 'captured' ? 'SUCCESS' : 'FAILED',
          method: payment.method,
        },
      });

      if (payment.status === 'captured') {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PROCESSING' },
        });
      }
    });

    if (payment.status === 'captured') {
      console.log('[Shiprocket] Sync triggered for order', orderId);
      syncOrderToShiprocket(orderId).catch((err) =>
        console.error('[Shiprocket] Sync failed for order', orderId, err)
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Payment verification error:', error);
    throw new AppError('Failed to verify payment', 500);
  }
};

// Razorpay webhook handler
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;

      if (orderId) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { orderId },
            data: {
              razorpayPaymentId: payment.id,
              status: 'SUCCESS',
              method: payment.method,
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: { status: 'PROCESSING' },
          });
        });
        console.log('[Shiprocket] Sync triggered for order (webhook)', orderId);
        syncOrderToShiprocket(orderId).catch((err) =>
          console.error('[Shiprocket] Sync failed for order', orderId, err)
        );
      }
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;

      if (orderId) {
        await prisma.payment.update({
          where: { orderId },
          data: {
            razorpayPaymentId: payment.id,
            status: 'FAILED',
          },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function syncOrderToShiprocket(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      orderItems: { include: { product: true } },
      user: { select: { email: true } },
    },
  });

  if (!order) {
    console.warn('[Shiprocket] Sync skipped: order not found', orderId);
    return;
  }
  if (!order.address) {
    console.warn('[Shiprocket] Sync skipped: no address for order', orderId);
    return;
  }
  if (order.shiprocketOrderId != null) {
    console.log('[Shiprocket] Sync skipped: order already has Shiprocket IDs', orderId);
    return;
  }

  const result = await createShiprocketOrder({
    orderId: order.id,
    orderDate: order.createdAt.toISOString().slice(0, 10),
    total: order.total,
    customerName: order.address.fullName,
    customerPhone: order.address.phone,
    customerEmail: order.user.email,
    addressLine1: order.address.addressLine1,
    addressLine2: order.address.addressLine2,
    city: order.address.city,
    state: order.address.state,
    postalCode: order.address.postalCode,
    country: order.address.country,
    items: order.orderItems.map((oi) => ({
      name: oi.product.name,
      sku: oi.product.slug || oi.product.id,
      quantity: oi.quantity,
      price: oi.price,
    })),
  });

  if (result) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        shiprocketOrderId: result.order_id,
        shiprocketShipmentId: result.shipment_id,
      },
    });
    console.log('[Shiprocket] Sync success for order', orderId, '| order_id:', result.order_id, 'shipment_id:', result.shipment_id);
  } else {
    console.warn('[Shiprocket] Sync: create order returned no IDs for order', orderId, '(check Shiprocket credentials and pickup location)');
  }
}
