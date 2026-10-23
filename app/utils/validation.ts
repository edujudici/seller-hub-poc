import { z } from 'zod';

export const ProductSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  price: z.number().positive('O preço base deve ser maior que zero'),
  suggestedRetailPrice: z.number().positive('O preço sugerido deve ser maior que zero'),
  stock: z.number().int().nonnegative('O estoque não pode ser negativo'),
  category: z.string().min(2, 'Selecione uma categoria válida'),
  imageUrl: z.string().url('Insira uma URL de imagem válida'),
  sku: z.string().min(3, 'O SKU deve ter no mínimo 3 caracteres'),
});

export const ConnectedAccountSchema = z.object({
  sellerId: z.string().min(1, 'ID do seller obrigatório'),
  platform: z.enum(['mercadolivre', 'shopee', 'amazon', 'magalu', 'shein']),
  storeName: z.string().min(2, 'Nome da loja no marketplace obrigatório'),
  username: z.string().min(2, 'Nome de usuário / ID da conta obrigatório'),
});

export const AdSchema = z.object({
  sellerId: z.string().min(1, 'ID do vendedor obrigatório'),
  productId: z.string().min(1, 'ID do produto obrigatório'),
  platform: z.enum(['mercadolivre', 'shopee', 'amazon', 'magalu', 'shein']),
  advertisedPrice: z.number().positive('O preço anunciado deve ser positivo'),
  platformAccountName: z.string().min(1, 'Selecione a conta integrada de anúncio'),
  title: z.string().min(5, 'Título do anúncio deve ter no mínimo 5 caracteres'),
  status: z.enum(['active', 'paused', 'out_of_stock']).default('active'),
});
