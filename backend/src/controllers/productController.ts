import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Helper function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get all products with filtering, sorting, and pagination
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      collection,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'featured',
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category) {
      // Support multiple categories (comma-separated or array)
      const categories = Array.isArray(category)
        ? category
        : (category as string).split(',').map((c: string) => c.trim());

      if (categories.length === 1) {
        where.category = categories[0];
      } else if (categories.length > 1) {
        where.category = { in: categories };
      }
    }

    if (collection) {
      // Support multiple collections (comma-separated or array)
      const collections = Array.isArray(collection)
        ? collection
        : (collection as string).split(',').map((c: string) => c.trim());

      if (collections.length === 1) {
        where.collection = collections[0];
      } else if (collections.length > 1) {
        where.collection = { in: collections };
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (inStock !== undefined) {
      where.inStock = inStock === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      case 'popular':
        orderBy.likes = 'desc';
        break;
      default:
        // Featured: sort by createdAt (newest first)
        // Products with badges will naturally appear first if they're newer
        orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch products', 500);
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: String(id) },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch product', 500);
  }
};

// Get product by slug
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug: String(slug) },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch product', 500);
  }
};

// Search products
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new AppError('Search query is required', 400);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to search products', 500);
  }
};

// Get categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const categoriesWithCount = categories.map((cat) => ({
      id: cat.category,
      name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      count: cat._count.id,
    }));

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    throw new AppError('Failed to fetch categories', 500);
  }
};

// Get collections
export const getCollections = async (req: Request, res: Response) => {
  try {
    const collections = await prisma.product.groupBy({
      by: ['collection'],
      _count: {
        id: true,
      },
    });

    const collectionsWithCount = collections.map((col) => ({
      id: col.collection,
      name: col.collection.charAt(0).toUpperCase() + col.collection.slice(1),
      count: col._count.id,
    }));

    res.json({
      success: true,
      data: collectionsWithCount,
    });
  } catch (error) {
    throw new AppError('Failed to fetch collections', 500);
  }
};

// Admin: Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    const slug = generateSlug(productData.name);

    // Check if slug exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new AppError('Product with this name already exists', 400);
    }

    // Handle image: convert string to array if needed, or ensure array format
    let images: string[] = [];
    if (productData.image) {
      if (Array.isArray(productData.image)) {
        images = productData.image;
      } else {
        images = [productData.image];
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        image: images,
        slug,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create product', 500);
  }
};

// Admin: Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If name is being updated, regenerate slug
    if (updateData.name) {
      updateData.slug = generateSlug(updateData.name);

      // Check if new slug conflicts with another product
      const existingProduct = await prisma.product.findFirst({
        where: {
          slug: updateData.slug,
          NOT: { id: String(id) },
        },
      });

      if (existingProduct) {
        throw new AppError('Product with this name already exists', 400);
      }
    }

    // Handle image: convert string to array if needed
    if (updateData.image !== undefined) {
      if (Array.isArray(updateData.image)) {
        updateData.image = updateData.image;
      } else if (typeof updateData.image === 'string') {
        updateData.image = [updateData.image];
      } else {
        updateData.image = [];
      }
    }

    const product = await prisma.product.update({
      where: { id: String(id) },
      data: updateData,
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      throw new AppError('Product not found', 404);
    }
    throw new AppError('Failed to update product', 500);
  }
};

// Admin: Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: String(id) },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      throw new AppError('Product not found', 404);
    }
    throw new AppError('Failed to delete product', 500);
  }
};

// Admin: Upload single product image (adds to array)
export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    const imageUrl = await uploadToCloudinary(req.file, 'jewelcraft/products');

    // Get current product to preserve existing images
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      select: { image: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Add new image to existing images array
    const updatedImages = [...(product.image || []), imageUrl];

    const updatedProduct = await prisma.product.update({
      where: { id: String(id) },
      data: { image: updatedImages },
    });

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to upload image', 500);
  }
};

// Admin: Upload multiple product images
export const uploadProductImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new AppError('No image files provided', 400);
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const imageFiles = files.flat(); // Handle both single and multiple file uploads

    // Get current product to preserve existing images
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      select: { image: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Upload all images to Cloudinary
    const uploadPromises = (files as Express.Multer.File[]).map((file) =>
      uploadToCloudinary(file, 'jewelcraft/products')
    );

    const uploadedUrls = await Promise.all(uploadPromises);

    // Add new images to existing images array
    const updatedImages = [...(product.image || []), ...uploadedUrls];

    const updatedProduct = await prisma.product.update({
      where: { id: String(id) },
      data: { image: updatedImages },
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: `Successfully uploaded ${uploadedUrls.length} image(s)`,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to upload images', 500);
  }
};

// Admin: Delete product image
export const deleteProductImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new AppError('Image URL is required', 400);
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      select: { image: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Remove image from array
    const updatedImages = (product.image || []).filter((img) => img !== imageUrl);

    // Ensure at least one image remains
    if (updatedImages.length === 0) {
      throw new AppError('Product must have at least one image', 400);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: String(id) },
      data: { image: updatedImages },
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete image', 500);
  }
};

