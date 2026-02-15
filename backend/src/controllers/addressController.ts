import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user addresses
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    throw new AppError('Failed to fetch addresses', 500);
  }
};

// Add address
export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { isDefault, ...addressData } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      data: address,
    });
  } catch (error) {
    throw new AppError('Failed to add address', 500);
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { isDefault, ...updateData } = req.body;

    // Check if address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: String(id) },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    if (address.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          NOT: { id: String(id) },
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: String(id) },
      data: {
        ...updateData,
        isDefault: isDefault !== undefined ? isDefault : address.isDefault,
      },
    });

    res.json({
      success: true,
      data: updatedAddress,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update address', 500);
  }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id: String(id) },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    if (address.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.address.delete({
      where: { id: String(id) },
    });

    res.json({
      success: true,
      message: 'Address deleted',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete address', 500);
  }
};

