import { getServerApiConfig } from './api.config';
import type { Product } from '~/types/collab';

export class ProductService {
  private config = getServerApiConfig();

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Server-Proxy': 'Nuxt-BFF/4.0',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }

  async getProducts(): Promise<Product[]> {
    console.log(`[BFF Server-to-Server] ProductService.getProducts() -> ${this.config.baseURL}/products`);
    if (!this.config.useExternalAPI) {
      console.log('[BFF Server] External API not configured; using internal handler pipeline.');
      return [];
    }

    try {
      const response = await $fetch<Product[]>(`${this.config.baseURL}/products`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response;
    } catch (err: any) {
      console.error('[BFF Server-to-Server Err] Failed to fetch products from external API:', err.message);
      throw createError({
        statusCode: err.statusCode || 502,
        statusMessage: `External API Product Fetch Error: ${err.message}`,
      });
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    console.log(`[BFF Server-to-Server] ProductService.createProduct() -> ${this.config.baseURL}/products`);
    
    if (!this.config.useExternalAPI) {
      // Local fallback generation when external API URL is not set
      const newProduct: Product = {
        ...productData,
        id: `prod_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      return newProduct;
    }

    try {
      const response = await $fetch<Product>(`${this.config.baseURL}/products`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: productData,
      });
      return response;
    } catch (err: any) {
      console.error('[BFF Server-to-Server Err] Failed to create product on external API:', err.message);
      throw createError({
        statusCode: err.statusCode || 502,
        statusMessage: `External API Product Creation Error: ${err.message}`,
      });
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | { success: boolean }> {
    console.log(`[BFF Server-to-Server] ProductService.updateProduct("${id}") -> ${this.config.baseURL}/products/${id}`);
    
    if (!this.config.useExternalAPI) {
      return { success: true, ...updates, id };
    }

    try {
      const response = await $fetch<Product>(`${this.config.baseURL}/products/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: updates,
      });
      return response;
    } catch (err: any) {
      console.error(`[BFF Server-to-Server Err] Failed to update product ${id} on external API:`, err.message);
      throw createError({
        statusCode: err.statusCode || 502,
        statusMessage: `External API Product Update Error: ${err.message}`,
      });
    }
  }

  async deleteProduct(id: string): Promise<{ success: boolean; id: string }> {
    console.log(`[BFF Server-to-Server] ProductService.deleteProduct("${id}") -> ${this.config.baseURL}/products/${id}`);
    
    if (!this.config.useExternalAPI) {
      return { success: true, id };
    }

    try {
      await $fetch(`${this.config.baseURL}/products/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return { success: true, id };
    } catch (err: any) {
      console.error(`[BFF Server-to-Server Err] Failed to delete product ${id} on external API:`, err.message);
      throw createError({
        statusCode: err.statusCode || 502,
        statusMessage: `External API Product Deletion Error: ${err.message}`,
      });
    }
  }
}

export const productService = new ProductService();
