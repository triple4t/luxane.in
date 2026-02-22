export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async sendSignupOtp(phone: string) {
    return this.request<{ message: string }>('/auth/send-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async register(data: { email: string; password: string; name: string; phone: string; code: string }) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getMe() {
    const response = await this.request<{ user: any }>('/auth/me');
    return response;
  }

  async registerAdmin(data: { email: string; password: string; name?: string }) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/admin/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async loginAdmin(data: { email: string; password: string }) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async forgotPassword(email: string) {
    return this.request<
      | { message: string }
      | { message: string; requiresOtp: true; resetRequestToken: string }
    >('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetOtp(resetRequestToken: string, code: string) {
    return this.request<{ message: string; resetToken: string }>(
      '/auth/verify-reset-otp',
      {
        method: 'POST',
        body: JSON.stringify({ resetRequestToken, code }),
      }
    );
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Reviews
  async createReview(data: { productId: string; rating: number; comment?: string }) {
    return this.request<{ success: boolean; data: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProductReviews(productId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/reviews/product/${productId}`);
  }

  async getUserReview(productId: string) {
    return this.request<{ success: boolean; data: any }>(`/reviews/product/${productId}/user`);
  }

  async deleteReview(reviewId: string) {
    return this.request<{ success: boolean }>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  // Newsletter
  async subscribeNewsletter(email: string) {
    return this.request<{ success: boolean; message: string }>('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async unsubscribeNewsletter(email: string) {
    return this.request<{ success: boolean; message: string }>('/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Products
  async getProducts(params?: {
    category?: string;
    collection?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.request<{ success: boolean; data: any[]; pagination?: any }>(
      `/products?${queryParams.toString()}`
    );
  }

  async getProduct(id: string) {
    return this.request<{ success: boolean; data: any }>(`/products/${id}`);
  }

  async getProductBySlug(slug: string) {
    return this.request<{ success: boolean; data: any }>(`/products/slug/${slug}`);
  }

  async searchProducts(query: string) {
    return this.request<{ success: boolean; data: any[] }>(`/products/search?q=${encodeURIComponent(query)}`);
  }

  async getCategories() {
    return this.request<{ success: boolean; data: any[] }>('/products/categories');
  }

  async getCollections() {
    return this.request<{ success: boolean; data: any[] }>('/products/collections');
  }

  async uploadProductImage(productId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseURL}/products/${productId}/image`;
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async uploadProductImages(productId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const url = `${this.baseURL}/products/${productId}/images`;
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteProductImage(productId: string, imageUrl: string) {
    return this.request<{ success: boolean; message: string }>(`/products/${productId}/image`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl }),
    });
  }

  // Cart
  async getCart() {
    return this.request<{ success: boolean; data: { items: any[]; total: number; count: number } }>('/cart');
  }

  async addToCart(data: { productId: string; quantity?: number }) {
    return this.request<{ success: boolean; data: any }>('/cart', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request<{ success: boolean; data: any }>(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string) {
    return this.request<{ success: boolean }>(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request<{ success: boolean }>('/cart', {
      method: 'DELETE',
    });
  }

  // Wishlist
  async getWishlist() {
    return this.request<{ success: boolean; data: any[] }>('/wishlist');
  }

  async addToWishlist(productId: string) {
    return this.request<{ success: boolean; data: any }>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  async removeFromWishlist(productId: string) {
    return this.request<{ success: boolean }>(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  }

  // Addresses
  async getAddresses() {
    return this.request<{ success: boolean; data: any[] }>('/addresses');
  }

  async addAddress(data: any) {
    return this.request<{ success: boolean; data: any }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAddress(id: string, data: any) {
    return this.request<{ success: boolean; data: any }>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAddress(id: string) {
    return this.request<{ success: boolean }>(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async createOrder(data: { addressId: string }) {
    return this.request<{ success: boolean; data: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders() {
    return this.request<{ success: boolean; data: any[] }>('/orders');
  }

  async getOrder(id: string) {
    return this.request<{ success: boolean; data: any }>(`/orders/${id}`);
  }

  async getOrderTracking(orderId: string) {
    return this.request<{
      success: boolean;
      data: {
        tracking: {
          awbCode: string | null;
          courierName: string | null;
          currentStatus: string | null;
          deliveredDate: string | null;
          scan: Array<{ date: string; time: string; activity: string; location: string }>;
          trackUrl: string | null;
        } | null;
        message?: string;
      };
    }>(`/orders/${orderId}/tracking`);
  }

  async cancelOrder(id: string) {
    return this.request<{ success: boolean }>(`/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // Payments
  async createRazorpayOrder(orderId: string) {
    return this.request<{ success: boolean; data: any }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  async verifyPayment(data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    return this.request<{ success: boolean }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

