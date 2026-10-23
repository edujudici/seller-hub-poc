import { marketplaceService } from '../../../../services/marketplace.service';

export default defineEventHandler(async (event) => {
  console.log('[Nuxt BFF] GET /api/v1/mercadolivre/auth/url called');
  
  const query = getQuery(event);
  const sellerId = query.sellerId as string | undefined;
  const state = query.state as string | undefined;

  const result = await marketplaceService.getMercadoLivreAuthUrl({ sellerId, state });
  
  // Set no-cache headers for OAuth URLs
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  return {
    url: result.url,
    source: result.source,
    endpoint: result.endpoint,
    timestamp: new Date().toISOString(),
  };
});
