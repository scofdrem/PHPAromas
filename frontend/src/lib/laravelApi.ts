/**
 * Laravel API client - replaces @metagptx/web-sdk
 * Calls our Laravel backend at http://localhost:8000/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getAPIBaseURL } from './config';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  gender: 'women' | 'men' | 'unisex';
  ageRange: '18-25' | '25-35' | '35-45' | '45+';
  volumes: number[];
  image: string;
  description: string;
  instagramUrl: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export interface Inquiry {
  id: number;
  name: string;
  phone: string;
  message: string;
  product_name?: string;
  product_brand?: string;
  created_at?: string;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
  roles?: Array<{ id: number; name: string; slug: string }>;
  last_login?: string;
  created_at?: string;
}

export interface AppConfig {
  [key: string]: string;
}

export interface SiteContentItem {
  id: number;
  content_key: string;
  content_value: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminStats {
  total_users: number;
  total_products: number;
  total_brands: number;
  total_inquiries: number;
}

// ─── Token Management ────────────────────────────────────────────────────────
// Now using httpOnly cookies, so tokens are sent automatically by the browser

const USER_KEY = 'laravel_user';

export function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ─── API Client ──────────────────────────────────────────────────────────────

class LaravelApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${getAPIBaseURL()}/api`,
      withCredentials: true, // Send httpOnly cookies automatically
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Response interceptor - handle 401 errors (but not for /me endpoint)
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Don't redirect for /me endpoint - let the caller handle it
          const config = error.config as any;
          const isMeEndpoint = config?.url?.includes('/v1/auth/me');
          if (!isMeEndpoint) {
            removeStoredUser();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          } else {
            // Just clear stored user for /me 401, let getMe() return null
            removeStoredUser();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private extractData<T>(response: any): T {
    return response.data?.data ?? response.data ?? response;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async register(data: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const response = await this.client.post('/v1/auth/sign-up/email', data);
    const payload = response.data.data;
    setStoredUser(payload.user);
    return payload.user;
  }

  async login(email: string, password: string): Promise<User> {
    const response = await this.client.post('/v1/auth/sign-in/email', { email, password });
    const payload = response.data.data;
    if (!payload?.user) {
      throw new Error('Invalid response from login endpoint');
    }
    setStoredUser(payload.user);
    return payload.user;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/v1/auth/logout');
    } finally {
      removeStoredUser();
    }
  }

  async getMe(): Promise<User | null> {
    try {
      const response = await this.client.get('/v1/auth/me');
      return this.extractData<User>(response);
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) {
        return null;
      }
      throw error;
    }
  }

  // ─── Products ───────────────────────────────────────────────────────────────

  async getProducts(brandId?: number): Promise<Product[]> {
    const params: Record<string, any> = {};
    if (brandId) params.brand_id = brandId;
    const response = await this.client.get('/entities/products', { params });
    const items: any[] = Array.isArray(response.data?.data) 
      ? response.data.data 
      : response.data?.data?.items || [];
    return items.map(mapProductFromBackend);
  }

  async getProduct(id: number): Promise<Product | null> {
    const response = await this.client.get(`/entities/products/${id}`);
    return mapProductFromBackend(this.extractData(response));
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const payload = mapProductToBackend(data);
    const response = await this.client.post('/entities/products', payload);
    return mapProductFromBackend(this.extractData(response));
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const payload = mapProductToBackend(data);
    const response = await this.client.put(`/entities/products/${id}`, payload);
    return mapProductFromBackend(this.extractData(response));
  }

  async deleteProduct(id: number): Promise<void> {
    await this.client.delete(`/entities/products/${id}`);
  }

  // ─── Brands ────────────────────────────────────────────────────────────────

  async getBrands(): Promise<Brand[]> {
    const response = await this.client.get('/entities/brands');
    const items: any[] = Array.isArray(response.data?.data)
      ? response.data.data
      : response.data?.data?.items || [];
    return items.map(mapBrandFromBackend);
  }

  async getBrand(id: number): Promise<Brand | null> {
    const response = await this.client.get(`/entities/brands/${id}`);
    return mapBrandFromBackend(this.extractData(response));
  }

  async createBrand(data: { name: string; slug: string }): Promise<Brand> {
    const response = await this.client.post('/entities/brands', data);
    return mapBrandFromBackend(this.extractData(response));
  }

  async updateBrand(id: number, data: { name?: string; slug?: string }): Promise<Brand> {
    const response = await this.client.put(`/entities/brands/${id}`, data);
    return mapBrandFromBackend(this.extractData(response));
  }

  async deleteBrand(id: number): Promise<void> {
    await this.client.delete(`/entities/brands/${id}`);
  }

  // ─── Categories ─────────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    const response = await this.client.get('/entities/categories');
    const items: any[] = Array.isArray(response.data?.data)
      ? response.data.data
      : response.data?.data?.items || [];
    return items.map(mapCategoryFromBackend);
  }

  async getCategory(id: number): Promise<Category | null> {
    const response = await this.client.get(`/entities/categories/${id}`);
    return mapCategoryFromBackend(this.extractData(response));
  }

  async createCategory(data: { name: string; slug: string; image?: string }): Promise<Category> {
    const response = await this.client.post('/entities/categories', data);
    return mapCategoryFromBackend(this.extractData(response));
  }

  async updateCategory(id: number, data: { name?: string; slug?: string; image?: string }): Promise<Category> {
    const response = await this.client.put(`/entities/categories/${id}`, data);
    return mapCategoryFromBackend(this.extractData(response));
  }

  async deleteCategory(id: number): Promise<void> {
    await this.client.delete(`/entities/categories/${id}`);
  }

  // ─── Site Content ───────────────────────────────────────────────────────────

  async getSiteContent(): Promise<Record<string, string>> {
    const response = await this.client.get('/entities/site_content');
    const raw = response.data?.data || response.data || {};
    if (Array.isArray(raw)) {
      // Legacy array format [{ content_key, content_value }, ...]
      const content: Record<string, string> = {};
      for (const item of raw) {
        if (item?.content_key && item?.content_value !== undefined) {
          content[item.content_key] = item.content_value;
        }
      }
      return content;
    }
    // Direct key-value map from successResponse(plucked_map)
    if (raw && typeof raw === 'object') {
      return raw as Record<string, string>;
    }
    return {};
  }

  async getSiteContentItem(key: string): Promise<SiteContentItem | null> {
    try {
      const response = await this.client.get(`/entities/site_content/${key}`);
      return this.extractData<SiteContentItem>(response);
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateSiteContent(key: string, value: string): Promise<void> {
    await this.client.post('/entities/site_content', { key, value });
  }

  // ─── App Config ─────────────────────────────────────────────────────────────

  async getAppConfig(): Promise<AppConfig> {
    const response = await this.client.get('/entities/app_configs');
    return response.data?.configs || response.data?.data || {};
  }

  async getAppConfigItem(key: string): Promise<{ key: string; value: string } | null> {
    try {
      const response = await this.client.get(`/entities/app_configs/${key}`);
      return this.extractData(response);
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // ─── Inquiries ──────────────────────────────────────────────────────────────

  async getInquiries(): Promise<Inquiry[]> {
    const response = await this.client.get('/entities/inquiries');
    const items: any[] = Array.isArray(response.data?.data)
      ? response.data.data
      : response.data?.data?.items || [];
    return items;
  }

  async createInquiry(data: {
    name: string;
    phone: string;
    message: string;
    product_name?: string;
    product_brand?: string;
  }): Promise<Inquiry> {
    const response = await this.client.post('/entities/inquiries', data);
    return this.extractData<Inquiry>(response);
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async getAdminUsers(): Promise<User[]> {
    const response = await this.client.get('/admin/users');
    const items: any[] = Array.isArray(response.data?.data)
      ? response.data.data
      : response.data?.users || [];
    return items.map(mapUserFromBackend);
  }

  async getAdminStats(): Promise<AdminStats> {
    const response = await this.client.get('/admin/stats');
    return this.extractData<AdminStats>(response);
  }

  // ─── Admin Account ────────────────────────────────────────────────────────

  async getAccount(): Promise<User> {
    const response = await this.client.get('/admin/account');
    return this.extractData<User>(response);
  }

  async updateAccountEmail(email: string): Promise<void> {
    await this.client.put('/admin/account/email', { email });
  }

  async updateAccountName(name: string): Promise<void> {
    await this.client.put('/admin/account/name', { name });
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
    password_confirmation: string;
  }): Promise<void> {
    await this.client.post('/admin/account/password', data);
  }

  async getFeedbackEmail(): Promise<{ feedback_email: string }> {
    const response = await this.client.get('/admin/account/feedback-email');
    return this.extractData(response);
  }

  async updateFeedbackEmail(feedback_email: string): Promise<void> {
    await this.client.put('/admin/account/feedback-email', { feedback_email });
  }

  // ─── SMTP Settings ────────────────────────────────────────────────────────

  async getSmtpSettings(): Promise<Record<string, string>> {
    const response = await this.client.get('/admin/smtp');
    return this.extractData(response);
  }

  async updateSmtpSettings(settings: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    email_from: string;
    email_name: string;
    email_to: string;
    email_reply_to: string;
  }): Promise<void> {
    await this.client.put('/admin/smtp', settings);
  }

  // ─── Admin Users ──────────────────────────────────────────────────────────

  async createUser(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }): Promise<User> {
    const response = await this.client.post('/admin/users', data);
    return mapUserFromBackend(this.extractData(response));
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await this.client.patch(`/admin/users/${userId}`, { role });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.client.delete(`/admin/users/${userId}`);
  }

  // ─── Password Reset ────────────────────────────────────────────────────────

  async sendPasswordResetLink(email: string): Promise<{ success: boolean; message: string; dev_token?: string }> {
    const response = await this.client.post('/v1/auth/forgot-password', { email });
    return this.extractData(response);
  }

  async resetPassword(token: string, password: string, password_confirmation: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/v1/auth/reset-password', {
      token,
      password,
      password_confirmation,
    });
    return this.extractData(response);
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  async getSessions(): Promise<any[]> {
    const response = await this.client.get('/v1/auth/sessions');
    return response.data.data || [];
  }

  async revokeSession(tokenId: string): Promise<void> {
    await this.client.delete('/v1/auth/sessions', {
      data: { token_id: tokenId },
    });
  }

  async revokeOtherSessions(): Promise<void> {
    await this.client.post('/v1/auth/sessions/revoke-others');
  }

  // ─── Media Upload ────────────────────────────────────────────────────────

  async uploadMedia(formData: FormData): Promise<{ url: string }> {
    const response = await this.client.post('/admin/media', formData);
    return this.extractData<{ url: string }>(response);
  }
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapProductFromBackend(item: any): Product {
  return {
    id: item.id,
    name: item.name || '',
    brand: item.brand_string || item.brand || '',
    category: item.category || '',
    gender: item.gender || 'unisex',
    ageRange: item.age_range || '25-35',
    volumes: item.volumes
      ? String(item.volumes)
          .split(',')
          .map((v: string) => Number(v.trim()))
          .filter((v: number) => v > 0)
      : [],
    image: item.image || '',
    description: item.description || '',
    instagramUrl: item.instagram_url || '',
    isNew: item.is_new || undefined,
    isFeatured: item.is_featured || undefined,
  };
}

function mapProductToBackend(product: Partial<Product>): Record<string, any> {
  const data: Record<string, any> = {};
  if (product.name !== undefined) data.name = product.name;
  if (product.brand !== undefined) data.brand = product.brand;
  if (product.category !== undefined) data.category = product.category;
  if (product.gender !== undefined) data.gender = product.gender;
  if (product.ageRange !== undefined) data.age_range = product.ageRange;
  if (product.volumes !== undefined) data.volumes = product.volumes.join(',');
  if (product.image !== undefined) data.image = product.image;
  if (product.description !== undefined) data.description = product.description;
  if (product.instagramUrl !== undefined) data.instagram_url = product.instagramUrl;
  if (product.isNew !== undefined) data.is_new = product.isNew;
  if (product.isFeatured !== undefined) data.is_featured = product.isFeatured;
  return data;
}

function mapBrandFromBackend(item: any): Brand {
  return {
    id: item.id,
    name: item.name || '',
    slug: item.slug || '',
  };
}

function mapCategoryFromBackend(item: any): Category {
  return {
    id: item.id,
    name: item.name || '',
    slug: item.slug || '',
    image: item.image || '',
  };
}

function mapUserFromBackend(item: any): User {
  return {
    id: item.id,
    email: item.email || '',
    first_name: item.first_name,
    last_name: item.last_name,
    name: item.first_name && item.last_name 
      ? `${item.first_name} ${item.last_name}` 
      : item.name || item.email,
    role: item.roles?.[0]?.name || item.role || 'user',
    roles: item.roles,
    last_login: item.last_login,
    created_at: item.created_at,
  };
}

// ─── Singleton export ────────────────────────────────────────────────────────

export const laravelApi = new LaravelApiClient();