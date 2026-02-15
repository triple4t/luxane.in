import { z } from 'zod';
export const productSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    price: z.number().positive('Price must be positive'),
    originalPrice: z.number().positive().optional().nullable(),
    description: z.string().optional().nullable(),
    image: z.union([
        z.string(),
        z.array(z.string())
    ]).optional(), // Accept string (single) or array (multiple) for backward compatibility
    category: z.string().min(1, 'Category is required'),
    collection: z.string().min(1, 'Collection is required'),
    badge: z.enum(['sale', 'trending', 'new']).optional().nullable(),
    stock: z.number().int().min(0).default(0),
    inStock: z.boolean().default(true),
});
export const addressSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    addressLine1: z.string().min(1, 'Address line 1 is required'),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('India'),
    isDefault: z.boolean().default(false),
});
export const cartItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive').default(1),
});
export const orderSchema = z.object({
    addressId: z.string().uuid('Invalid address ID'),
});
