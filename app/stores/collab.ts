import { defineStore } from 'pinia';
import type { Seller, Product, ConnectedAccount, Ad, Order } from '~/types/collab';
import { INITIAL_SELLERS, INITIAL_PRODUCTS, INITIAL_ACCOUNTS, INITIAL_ADS, INITIAL_ORDERS } from '~/utils/initialData';
import { ProductSchema, ConnectedAccountSchema, AdSchema } from '~/utils/validation';

export interface CollabState {
  sellers: Seller[];
  currentSeller: Seller;
  products: Product[];
  accounts: ConnectedAccount[];
  ads: Ad[];
  orders: Order[];
  activeTab: 'dashboard' | 'products' | 'catalog' | 'ads' | 'orders' | 'integrations';
  loading: boolean;
  error: string | null;
}

export const useCollabStore = defineStore('collab', {
  state: (): CollabState => ({
    sellers: INITIAL_SELLERS,
    currentSeller: INITIAL_SELLERS[0],
    products: [],
    accounts: [],
    ads: [],
    orders: [],
    activeTab: 'dashboard',
    loading: false,
    error: null,
  }),

  getters: {
    // Products owned by current seller (stock holder / supplier)
    myProducts: (state) => state.products.filter((p) => p.ownerId === state.currentSeller.id),

    // Collaborative catalog: Products owned by other sellers that current seller can advertise
    collaborativeProducts: (state) => state.products.filter((p) => p.ownerId !== state.currentSeller.id),

    // Ads published by current seller
    myAds: (state) => state.ads.filter((a) => a.sellerId === state.currentSeller.id),

    // Connected marketplace accounts for current seller
    myAccounts: (state) => state.accounts.filter((acc) => acc.sellerId === state.currentSeller.id),

    // Orders where current seller is the advertiser (they sold someone else's product or their own)
    salesAsAdvertiser: (state) => state.orders.filter((o) => o.advertiserId === state.currentSeller.id),

    // Orders where current seller is the physical product owner (responsible for packing & shipping)
    fulfillmentAsOwner: (state) => state.orders.filter((o) => o.ownerId === state.currentSeller.id),

    // Financial Metrics
    metrics: (state) => {
      const mySales = state.orders.filter((o) => o.advertiserId === state.currentSeller.id);
      const myFulfillments = state.orders.filter((o) => o.ownerId === state.currentSeller.id);

      const totalSalesRevenue = mySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const advertiserGrossProfit = mySales.reduce((acc, curr) => acc + curr.advertiserProfit, 0);
      const ownerFulfillmentPayout = myFulfillments.reduce((acc, curr) => acc + curr.ownerPayout, 0);
      const pendingFulfillments = myFulfillments.filter((o) => o.status === 'pending' || o.status === 'ready_to_ship').length;

      return {
        totalSalesRevenue,
        advertiserGrossProfit,
        ownerFulfillmentPayout,
        pendingFulfillments,
        totalOrdersCount: mySales.length,
        activeAdsCount: state.ads.filter((a) => a.sellerId === state.currentSeller.id && a.status === 'active').length,
        stockItemsCount: state.products.filter((p) => p.ownerId === state.currentSeller.id).reduce((sum, p) => sum + p.stock, 0),
      };
    },
  },

  actions: {
    // 1. Initial State Hydration via Nuxt Server BFF (/api/bootstrap or /api/products)
    async initStore() {
      console.log('[Collab Store] Initializing store through Nuxt Server BFF...');
      this.loading = true;
      this.error = null;

      try {
        // Attempt Server-to-Server BFF bootstrap call
        const bffData = await $fetch<any>('/api/bootstrap').catch((err) => {
          console.warn('[Collab Store] BFF bootstrap ping:', err.message);
          return null;
        });

        if (bffData && bffData.products && bffData.products.length > 0) {
          this.products = bffData.products;
          this.accounts = bffData.accounts || INITIAL_ACCOUNTS;
          this.ads = bffData.ads || INITIAL_ADS;
          this.orders = bffData.orders || INITIAL_ORDERS;
          if (bffData.sellers) this.sellers = bffData.sellers;
          console.log('[Collab Store] State successfully populated via Nuxt Server BFF!');
          return;
        }

        // Local client storage fallback
        if (import.meta.client) {
          const savedProducts = localStorage.getItem('collab_products');
          const savedAccounts = localStorage.getItem('collab_accounts');
          const savedAds = localStorage.getItem('collab_ads');
          const savedOrders = localStorage.getItem('collab_orders');
          const savedSellerId = localStorage.getItem('collab_current_seller_id');

          this.products = savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;
          this.accounts = savedAccounts ? JSON.parse(savedAccounts) : INITIAL_ACCOUNTS;
          this.ads = savedAds ? JSON.parse(savedAds) : INITIAL_ADS;
          this.orders = savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS;

          if (savedSellerId) {
            const found = this.sellers.find((s) => s.id === savedSellerId);
            if (found) {
              this.currentSeller = found;
            }
          }
        } else {
          this.products = INITIAL_PRODUCTS;
          this.accounts = INITIAL_ACCOUNTS;
          this.ads = INITIAL_ADS;
          this.orders = INITIAL_ORDERS;
        }
      } catch (err: any) {
        this.error = err.message || 'Falha ao inicializar dados';
        console.error('[Collab Store Err] Critical failure mapping storage values to store memory:', err);
      } finally {
        this.loading = false;
      }
    },

    // 2. Persistent storage sync helper
    saveToLocalStorage() {
      if (import.meta.client) {
        try {
          localStorage.setItem('collab_products', JSON.stringify(this.products));
          localStorage.setItem('collab_accounts', JSON.stringify(this.accounts));
          localStorage.setItem('collab_ads', JSON.stringify(this.ads));
          localStorage.setItem('collab_orders', JSON.stringify(this.orders));
          localStorage.setItem('collab_current_seller_id', this.currentSeller.id);
        } catch (error) {
          console.error('[Collab Store Err] localStorage persistence write failed:', error);
        }
      }
    },

    switchSeller(sellerId: string) {
      const found = this.sellers.find((s) => s.id === sellerId);
      if (found) {
        console.log(`[Collab Store] Switching active user context to "${found.name}"...`);
        this.currentSeller = found;
        this.activeTab = 'dashboard';
        this.saveToLocalStorage();
      }
    },

    setActiveTab(tab: CollabState['activeTab']) {
      this.activeTab = tab;
    },

    // 3. Products Operations via Nuxt Server BFF (server/services/product.service.ts)
    async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'ownerId' | 'ownerName'>) {
      console.log('[Collab Store] createProduct() dispatching to Nuxt Server BFF (/api/products)...');
      ProductSchema.parse(productData);

      const payload = {
        ...productData,
        ownerId: this.currentSeller.id,
        ownerName: this.currentSeller.name,
      };

      // Server-to-server dispatch via Nuxt BFF
      const serverProduct = await $fetch<Product>('/api/products', {
        method: 'POST',
        body: payload,
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF returned notice, using optimistic local resolution:', err.message);
        return {
          ...payload,
          id: `prod_${Date.now()}`,
          createdAt: new Date().toISOString(),
        } as Product;
      });

      this.products.unshift(serverProduct);
      this.saveToLocalStorage();
    },

    async updateProduct(id: string, updates: Partial<Product>) {
      console.log(`[Collab Store] updateProduct() dispatching to Nuxt Server BFF (/api/products/${id})...`);
      
      // Server-to-server dispatch via Nuxt BFF
      await $fetch(`/api/products/${id}`, {
        method: 'PATCH',
        body: updates,
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF update fallback:', err.message);
      });

      this.products = this.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      this.saveToLocalStorage();
    },

    async deleteProduct(id: string) {
      console.log(`[Collab Store] deleteProduct() dispatching to Nuxt Server BFF (/api/products/${id})...`);
      
      // Server-to-server dispatch via Nuxt BFF
      await $fetch(`/api/products/${id}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF delete fallback:', err.message);
      });

      this.products = this.products.filter((p) => p.id !== id);
      this.saveToLocalStorage();
    },

    // 4. Linked Marketplace Integration Accounts Flow
    async fetchMercadoLivreAuthUrl(sellerId?: string): Promise<{ url: string; endpoint: string; source: string }> {
      const activeSellerId = sellerId || this.currentSeller?.id;
      console.log(`[Collab Store] Requesting Mercado Livre OAuth URL via Nuxt Server BFF (/api/v1/mercadolivre/auth/url?sellerId=${activeSellerId})...`);
      
      const response = await $fetch<{ url: string; endpoint: string; source: string }>('/api/v1/mercadolivre/auth/url', {
        params: {
          sellerId: activeSellerId,
          state: activeSellerId,
        },
      });

      if (!response?.url) {
        throw new Error('A API não retornou uma URL válida de autorização do Mercado Livre.');
      }

      return response;
    },

    syncOAuthAccount(account: ConnectedAccount) {
      console.log('[Collab Store] Syncing OAuth connected account into store state:', account);
      const existingIndex = this.accounts.findIndex((a) => a.id === account.id || (a.platform === account.platform && a.username === account.username));
      if (existingIndex >= 0) {
        this.accounts[existingIndex] = { ...this.accounts[existingIndex], ...account, status: 'connected' };
      } else {
        this.accounts.unshift(account);
      }
      this.saveToLocalStorage();
    },

    async connectAccount(accountData: Omit<ConnectedAccount, 'id'>) {
      console.log('[Collab Store] connectAccount() dispatching to Nuxt Server BFF (/api/accounts)...');
      ConnectedAccountSchema.parse(accountData);

      const serverAccount = await $fetch<ConnectedAccount>('/api/accounts', {
        method: 'POST',
        body: accountData,
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF account fallback:', err.message);
        return {
          ...accountData,
          id: `acc_${Date.now()}`,
        } as ConnectedAccount;
      });

      this.accounts.unshift(serverAccount);
      this.saveToLocalStorage();
    },

    async disconnectAccount(id: string) {
      console.log(`[Collab Store] disconnectAccount() dispatching to Nuxt Server BFF (/api/accounts/${id})...`);
      
      await $fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF disconnect fallback:', err.message);
      });

      this.accounts = this.accounts.filter((acc) => acc.id !== id);
      this.saveToLocalStorage();
    },

    // 5. Ad Publishing Flow
    async publishAd(adData: Omit<Ad, 'id' | 'externalId'>) {
      console.log('[Collab Store] publishAd() dispatching to Nuxt Server BFF (/api/ads)...');
      AdSchema.parse(adData);

      const randomHex = Math.floor(100000000 + Math.random() * 900000000).toString();
      const externalId = adData.platform === 'mercadolivre' ? `MLB${randomHex}` : `SHP-${randomHex.substring(0, 5)}-${randomHex.substring(5, 7)}`;

      const payload = {
        ...adData,
        externalId,
      };

      const serverAd = await $fetch<Ad>('/api/ads', {
        method: 'POST',
        body: payload,
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF publish ad fallback:', err.message);
        return {
          ...payload,
          id: `ad_${Date.now()}`,
        } as Ad;
      });

      this.ads.unshift(serverAd);
      this.saveToLocalStorage();
    },

    async deleteAd(id: string) {
      console.log(`[Collab Store] deleteAd() dispatching to Nuxt Server BFF (/api/ads/${id})...`);
      
      await $fetch(`/api/ads/${id}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF delete ad fallback:', err.message);
      });

      this.ads = this.ads.filter((a) => a.id !== id);
      this.saveToLocalStorage();
    },

    // 6. Simulate sales order trigger representing a real webhook callback
    async simulateSale(ad: Ad, quantity: number) {
      console.log(`[Collab Store Webhook Simulator] webhook payload received. Ad ID: "${ad.id}", platform: "${ad.platform}", quantity: ${quantity}`);
      const originalProduct = this.products.find((p) => p.id === ad.productId);
      if (!originalProduct) {
        console.error('[Collab Store Webhook Simulator] Critical mismatch: Product associated with Ad not found! Ad ID:', ad.id);
        return;
      }

      // Update local stock immediately
      this.products = this.products.map((p) => {
        if (p.id === originalProduct.id) {
          const newStock = Math.max(0, p.stock - quantity);
          return { ...p, stock: newStock };
        }
        return p;
      });

      const totalAmount = ad.advertisedPrice * quantity;
      const ownerPayout = originalProduct.price * quantity;
      const advertiserProfit = Math.max(0, totalAmount - ownerPayout);

      const randomHex = Math.floor(10000 + Math.random() * 90000).toString();
      const orderId = ad.platform === 'mercadolivre' ? `PED-${randomHex}-ML` : `PED-${randomHex}-SHP`;
      const labelId = `LABEL-${ad.platform.toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const trackingCode = `BR-${ad.platform.substring(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}-BR`;

      const buyers = [
        { name: 'Juliana Vasconcelos', address: 'Rua Bela Cintra, 890 - Consolação, São Paulo - SP, CEP 01415-000' },
        { name: 'Rodrigo Alencar', address: 'Av. Afonso Pena, 1500 - Funcionários, Belo Horizonte - MG, CEP 30130-005' },
        { name: 'Beatriz Fagundes', address: 'Rua das Laranjeiras, 302 - Laranjeiras, Rio de Janeiro - RJ, CEP 22240-006' },
      ];
      const selectedBuyer = buyers[Math.floor(Math.random() * buyers.length)];

      const newOrder: Order = {
        id: orderId,
        adId: ad.id,
        productId: originalProduct.id,
        advertiserId: ad.sellerId,
        ownerId: originalProduct.ownerId,
        platform: ad.platform,
        buyerName: selectedBuyer.name,
        buyerAddress: selectedBuyer.address,
        quantity,
        totalAmount: Number(totalAmount.toFixed(2)),
        ownerPayout: Number(ownerPayout.toFixed(2)),
        advertiserProfit: Number(advertiserProfit.toFixed(2)),
        status: 'pending',
        shippingLabelId: labelId,
        trackingNumber: trackingCode,
        createdAt: new Date().toISOString(),
      };

      // Dispatch to Nuxt Server BFF
      await $fetch('/api/orders', {
        method: 'POST',
        body: newOrder,
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF order fallback:', err.message);
      });

      this.orders.unshift(newOrder);
      this.saveToLocalStorage();
    },

    async updateOrderStatus(orderId: string, newStatus: Order['status'], trackingCode?: string) {
      console.log(`[Collab Store] updateOrderStatus() dispatching to Nuxt Server BFF (/api/orders/${orderId}/status)...`);
      
      await $fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus, trackingNumber: trackingCode },
      }).catch((err) => {
        console.warn('[Collab Store] Nuxt Server BFF status update fallback:', err.message);
      });

      this.orders = this.orders.map((o) => {
        if (o.id === orderId) {
          const updated: Order = { ...o, status: newStatus };
          if (trackingCode) {
            updated.trackingNumber = trackingCode;
          }
          return updated;
        }
        return o;
      });
      this.saveToLocalStorage();
    },

    resetState() {
      console.log('[Collab Store] resetState() resetting data...');
      if (import.meta.client) {
        localStorage.removeItem('collab_products');
        localStorage.removeItem('collab_accounts');
        localStorage.removeItem('collab_ads');
        localStorage.removeItem('collab_orders');
        localStorage.removeItem('collab_current_seller_id');
      }

      this.products = [...INITIAL_PRODUCTS];
      this.accounts = [...INITIAL_ACCOUNTS];
      this.ads = [...INITIAL_ADS];
      this.orders = [...INITIAL_ORDERS];
      this.currentSeller = INITIAL_SELLERS[0];
      this.activeTab = 'dashboard';
      this.saveToLocalStorage();
    }
  }
});
