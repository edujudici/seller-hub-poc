import { getServerApiConfig } from "./api.config";
import type {
  ConnectedAccount,
  Ad,
  Order,
  Seller,
  Product,
} from "~/types/collab";

export class MarketplaceService {
  private config = getServerApiConfig();

  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Server-Proxy": "Nuxt-BFF/4.0",
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }

  /**
   * Real Mercado Livre OAuth Authorization URL fetcher
   * Calls: {EXTERNAL_API_BASE_URL}/api/v1/mercadolivre/auth/url
   * Returns: { url: "https://auth.mercadolivre.com.br/authorization?client_id=..." }
   */
  async getMercadoLivreAuthUrl(params?: {
    sellerId?: string;
    state?: string;
  }): Promise<{ url: string; source: string; endpoint: string }> {
    const queryParams = new URLSearchParams();
    if (params?.sellerId) queryParams.set("sellerId", params.sellerId);
    if (params?.state) queryParams.set("state", params.state);

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";
    const endpoint = `${this.config.mercadolivreAuthEndpoint}${queryString}`;
    console.log(
      `[BFF Server-to-Server] MarketplaceService.getMercadoLivreAuthUrl() -> ${endpoint}`,
    );

    if (!this.config.useExternalAPI) {
      throw new Error(
        "API externa não configurada (EXTERNAL_API_BASE_URL ausente). A URL de autorização deve ser obtida da API.",
      );
    }

    try {
      const response = await $fetch<any>(endpoint, {
        method: "GET",
        headers: this.getHeaders(),
      });

      let resolvedUrl = "";
      if (typeof response === "string") {
        resolvedUrl = response;
      } else if (response && typeof response === "object") {
        resolvedUrl =
          response.url ||
          response.authUrl ||
          response.authorization_url ||
          response.auth_url ||
          response.data?.url ||
          "";
      }

      if (!resolvedUrl || !resolvedUrl.startsWith("http")) {
        console.error(
          `[BFF Server-to-Server] Resposta de ${endpoint} não conteve uma URL válida:`,
          response,
        );
        throw new Error(
          `A API externa retornou uma resposta inválida sem URL de autorização: ${JSON.stringify(response)}`,
        );
      }

      console.log(
        `[BFF Server-to-Server] URL de autorização do Mercado Livre obtida da API externa: ${resolvedUrl}`,
      );
      return {
        url: resolvedUrl,
        source: "external_api",
        endpoint,
      };
    } catch (err: any) {
      console.error(
        `[BFF Server-to-Server Error] Falha ao obter URL de autenticação de ${endpoint}:`,
        err.message,
      );
      throw new Error(
        err.message || "Falha ao consultar URL de autorização na API externa.",
      );
    }
  }

  async bootstrap(): Promise<{
    sellers?: Seller[];
    products?: Product[];
    accounts?: ConnectedAccount[];
    ads?: Ad[];
    orders?: Order[];
  }> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.bootstrap() -> ${this.config.baseURL}/bootstrap`,
    );
    if (!this.config.useExternalAPI) {
      return {};
    }

    try {
      const response = await $fetch<any>(`${this.config.baseURL}/bootstrap`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      return response;
    } catch (err: any) {
      console.warn(
        "[BFF Server-to-Server War] External API bootstrap endpoint error or unavailable:",
        err.message,
      );
      return {};
    }
  }

  async connectAccount(
    accountData: Omit<ConnectedAccount, "id">,
  ): Promise<ConnectedAccount> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.connectAccount() -> ${this.config.baseURL}/accounts`,
    );
    if (!this.config.useExternalAPI) {
      return {
        ...accountData,
        id: `acc_${Date.now()}`,
      };
    }
    return await $fetch<ConnectedAccount>(`${this.config.baseURL}/accounts`, {
      method: "POST",
      headers: this.getHeaders(),
      body: accountData,
    });
  }

  async disconnectAccount(
    id: string,
  ): Promise<{ success: boolean; id: string }> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.disconnectAccount("${id}") -> ${this.config.baseURL}/accounts/${id}`,
    );
    if (this.config.useExternalAPI) {
      await $fetch(`${this.config.baseURL}/accounts/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    }
    return { success: true, id };
  }

  async publishAd(adData: Omit<Ad, "id">): Promise<Ad> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.publishAd() -> ${this.config.baseURL}/ads`,
    );
    if (!this.config.useExternalAPI) {
      return {
        ...adData,
        id: `ad_${Date.now()}`,
      };
    }
    return await $fetch<Ad>(`${this.config.baseURL}/ads`, {
      method: "POST",
      headers: this.getHeaders(),
      body: adData,
    });
  }

  async deleteAd(id: string): Promise<{ success: boolean; id: string }> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.deleteAd("${id}") -> ${this.config.baseURL}/ads/${id}`,
    );
    if (this.config.useExternalAPI) {
      await $fetch(`${this.config.baseURL}/ads/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    }
    return { success: true, id };
  }

  async createOrder(orderData: Order): Promise<Order> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.createOrder() -> ${this.config.baseURL}/orders`,
    );
    if (!this.config.useExternalAPI) {
      return orderData;
    }
    return await $fetch<Order>(`${this.config.baseURL}/orders`, {
      method: "POST",
      headers: this.getHeaders(),
      body: orderData,
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: Order["status"],
    trackingNumber?: string,
  ): Promise<{ success: boolean }> {
    console.log(
      `[BFF Server-to-Server] MarketplaceService.updateOrderStatus("${orderId}", "${status}") -> ${this.config.baseURL}/orders/${orderId}/status`,
    );
    if (this.config.useExternalAPI) {
      await $fetch(`${this.config.baseURL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: { status, trackingNumber },
      });
    }
    return { success: true };
  }
}

export const marketplaceService = new MarketplaceService();
