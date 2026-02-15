# Jewelcraft E-commerce Backend API

A production-ready REST API backend for the Jewelcraft e-commerce platform with Razorpay payment integration.

## Features

- ✅ User & Admin Authentication (JWT)
- ✅ Product Management (CRUD, filtering, search)
- ✅ Shopping Cart
- ✅ Wishlist
- ✅ Address Management
- ✅ Order Management
- ✅ Razorpay Payment Integration
- ✅ Cloudinary Image Upload
- ✅ Error Handling & Validation
- ✅ **Rate Limiting** (protect against brute force & DDoS)
- ✅ **Helmet.js Security Headers** (XSS, clickjacking protection)
- ✅ **Email Notifications** (order confirmations, password reset)
- ✅ **Password Reset** (forgot/reset password flow)
- ✅ **Sentry Error Logging** (production error tracking)

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: Razorpay
- **Image Storage**: Cloudinary
- **Authentication**: JWT

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Important:** The `.env.example` file contains all required variables with explanations.

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret (optional)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `PORT` - Server port (default: 5001)
- `FRONTEND_URL` - Frontend URL for CORS
- `EMAIL_USER` - Email address for sending emails (e.g., `tejasgadhe1920@gmail.com`)
- `EMAIL_PASSWORD` - Gmail app-specific password (16 characters, get from https://myaccount.google.com/apppasswords)
- `EMAIL_FROM` - Display name for emails (e.g., `Creative Universe`)
- `EMAIL_SERVICE` - Email service provider (default: `gmail`)

**Note:** `EMAIL_USER` is the sender email (your Gmail). User emails (like `abc@gmail.com`) are the recipients and can be any email in your database.
- `SENTRY_DSN` - Sentry DSN for error tracking (optional but recommended)

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (rate limited)
- `POST /api/auth/login` - User login (rate limited)
- `POST /api/auth/admin/register` - Admin registration (rate limited)
- `POST /api/auth/admin/login` - Admin login (rate limited)
- `POST /api/auth/forgot-password` - Request password reset (rate limited)
- `POST /api/auth/reset-password` - Reset password with token (rate limited)
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - List products (with filtering, sorting, pagination)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/categories` - Get all categories
- `GET /api/products/collections` - Get all collections

**Admin Routes:**
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/:id/image` - Upload product image

### Cart (Protected)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Wishlist (Protected)
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

### Addresses (Protected)
- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Add address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Orders (Protected)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order

**Admin Routes:**
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status

### Payments (Protected)
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature
- `POST /api/payments/webhook` - Razorpay webhook handler

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use production database URL
3. Use production Razorpay keys
4. Configure CORS for your frontend domain
5. Run `npm run build` to compile TypeScript
6. Run `npm start` to start the production server

## Notes

- All prices are in INR (Indian Rupees)
- Image uploads are limited to 5MB per file
- Product images are automatically optimized by Cloudinary
- Razorpay webhook URL: `https://your-domain.com/api/payments/webhook`

