import { marketplaceService } from '../../services/marketplace.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ad ID is required' });
  }
  return await marketplaceService.deleteAd(id);
});
