import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import {
  getShiprocketTrackingByShipmentId,
  getShiprocketTrackingByOrderId,
  type ShiprocketTrackingData,
} from '../services/shiprocketService.js';

// Create order (no OTP)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
        throw new AppError(
          `Product ${item.product.name} is out of stock`,
          400
        );
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

        await sendEmail(
          user.email,
          `Order Confirmation #${order.id.slice(0, 8)} - Creative Universe`,
          emailTemplates.orderConfirmation(order, orderItemsWithProducts)
        );
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create order', 500);
  }
};

// Get user's orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

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
  } catch (error) {
    throw new AppError('Failed to fetch orders', 500);
  }
};

// Get single order
export const getOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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

    if (order.userId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch order', 500);
  }
};

// Get order tracking (Shiprocket) - user (own order) or admin
export const getOrderTracking = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shiprocketOrderId: true,
        shiprocketShipmentId: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    if (order.shiprocketShipmentId == null && order.shiprocketOrderId == null) {
      return res.json({
        success: true,
        data: { tracking: null, message: 'No Shiprocket shipment for this order yet.' },
      });
    }

    let raw: ShiprocketTrackingData | null = null;
    if (order.shiprocketShipmentId != null) {
      raw = await getShiprocketTrackingByShipmentId(order.shiprocketShipmentId);
    }
    if (!raw && order.shiprocketOrderId != null) {
      raw = await getShiprocketTrackingByOrderId(order.shiprocketOrderId);
    }

    if (process.env.NODE_ENV === 'development' && raw) {
      console.log('[Shiprocket] Tracking raw response:', JSON.stringify(raw).slice(0, 500));
    }

    const payload = raw ? unwrapShiprocketTrackingResponse(raw as Record<string, unknown>) : null;
    const tracking = payload ? normalizeTrackingResponse(payload) : null;

    res.json({
      success: true,
      data: { tracking },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch tracking', 500);
  }
};

/** Unwrap when Shiprocket returns { [shipmentId]: payload } */
function unwrapShiprocketTrackingResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(raw);
  if (keys.length === 1 && /^\d+$/.test(keys[0])) {
    return (raw[keys[0]] as Record<string, unknown>) ?? raw;
  }
  return raw;
}

function normalizeTrackingResponse(raw: Record<string, unknown>): {
  awbCode: string | null;
  courierName: string | null;
  currentStatus: string | null;
  deliveredDate: string | null;
  scan: Array<{ date: string; time: string; activity: string; location: string }>;
  trackUrl: string | null;
} {
  const td = raw.tracking_data as Record<string, unknown> | undefined;
  const tdFirst = Array.isArray(td) ? (td[0] as Record<string, unknown>) : td;
  const stArr = (tdFirst?.shipment_track ?? td?.shipment_track) as Record<string, unknown>[] | undefined;
  const stFirst = Array.isArray(stArr) && stArr.length > 0 ? stArr[0] : undefined;

  const awb =
    (stFirst?.awb_code as string) ??
    (raw.awb_code as string) ??
    (tdFirst?.awb_code as string) ??
    (td?.awb_code as string) ??
    null;
  const awbStr = typeof awb === 'string' && awb.trim() ? awb : null;

  const courier =
    (stFirst?.courier_name as string) ??
    (raw.courier_name as string) ??
    (tdFirst?.courier_company_name as string) ??
    (td?.courier_company_name as string) ??
    null;
  const courierStr = typeof courier === 'string' && courier.trim() ? courier : null;

  const deliveredDate =
    (stFirst?.delivered_date as string) ??
    (raw.delivered_date as string) ??
    (tdFirst?.delivered_date as string) ??
    (td?.delivered_date as string) ??
    null;
  const deliveredStr = typeof deliveredDate === 'string' && deliveredDate.trim() ? deliveredDate : null;

  const statusNum =
    (td?.track_status as number) ??
    (tdFirst?.track_status as number) ??
    (raw.track_status as number) ??
    (td?.shipment_status as number) ??
    (tdFirst?.shipment_status as number);
  const statusStr =
    (stFirst?.current_status as string) ??
    (raw.current_status as string) ??
    (tdFirst?.current_status as string);
  const currentStatus =
    (typeof statusStr === 'string' && statusStr.trim() ? statusStr : null) ??
    (statusNum !== undefined && statusNum !== null ? shipStatusToText(Number(statusNum)) : null);

  const scanSrc =
    raw.scan ??
    (tdFirst?.scan ?? td?.scan) ??
    (tdFirst?.shipment_track_activities ?? td?.shipment_track_activities) ??
    (tdFirst?.shipment_track ?? td?.shipment_track) ??
    [];
  const scanArr = Array.isArray(scanSrc) ? scanSrc : [];
  const scanList = scanArr.map((s: Record<string, unknown>) => ({
    date: String(s.date ?? s.Date ?? s.updated_time_stamp ?? ''),
    time: String(s.time ?? s.Time ?? ''),
    activity: String(s.activity ?? s.status ?? s.description ?? s.current_status ?? ''),
    location: String(s.location ?? s.city ?? s.origin ?? s.destination ?? ''),
  }));

  const trackUrl =
    awbStr != null
      ? `https://shiprocket.in/shipment-tracking?awb=${encodeURIComponent(awbStr)}`
      : 'https://shiprocket.in/shipment-tracking';

  return {
    awbCode: awbStr ?? null,
    courierName: courierStr ?? null,
    currentStatus: currentStatus ?? null,
    deliveredDate: deliveredStr ?? null,
    scan: scanList,
    trackUrl,
  };
}

function shipStatusToText(n: number): string {
  const map: Record<number, string> = {
    0: 'Not dispatched',
    1: 'Dispatched',
    2: 'In transit',
    3: 'Out for delivery',
    4: 'Delivered',
    5: 'Cancelled',
    6: 'RTO',
    7: 'Undelivered',
  };
  return map[n] ?? `Status ${n}`;
}

// Cancel order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to cancel order', 500);
  }
};

// Admin: Get all orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const {
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
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
  } catch (error) {
    throw new AppError('Failed to fetch orders', 500);
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update order status', 500);
  }
};

