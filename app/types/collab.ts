export type MarketplacePlatform = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'shein';

export interface Seller {
  id: string;
  name: string;
  email: string;
  avatar: string;
  storeName: string;
}

export interface Product {
  id: string;
  ownerId: string; // ID do dono do estoque físico (fornecedor/seller dono)
  ownerName: string;
  title: string;
  description: string;
  price: number; // Preço base de custo/atacado oferecido pelo fornecedor
  suggestedRetailPrice: number; // Preço sugerido para venda ao consumidor
  stock: number;
  category: string;
  imageUrl: string;
  sku: string;
  createdAt: string;
}

export interface ConnectedAccount {
  id: string;
  sellerId: string;
  platform: MarketplacePlatform;
  storeName: string;
  status: 'connected' | 'expired' | 'error';
  username: string;
}

export interface Ad {
  id: string;
  sellerId: string; // Quem está anunciando o produto
  productId: string; // Referência ao produto físico do catálogo
  platform: MarketplacePlatform;
  externalId: string; // ID do anúncio no marketplace
  advertisedPrice: number;
  status: 'active' | 'paused' | 'out_of_stock';
  platformAccountName: string;
  title: string;
}

export interface Order {
  id: string;
  adId: string;
  productId: string;
  advertiserId: string; // Quem vendeu
  ownerId: string; // Dono do estoque físico que vai despachar
  platform: MarketplacePlatform;
  buyerName: string;
  buyerAddress: string;
  quantity: number;
  totalAmount: number;
  ownerPayout: number; // Valor que vai pro fornecedor
  advertiserProfit: number; // Lucro líquido do anunciante
  status: 'pending' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
  shippingLabelId: string;
  trackingNumber: string;
  createdAt: string;
}
