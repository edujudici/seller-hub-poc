import { marketplaceService } from '../../services/marketplace.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Account ID is required' });
  }
  return await marketplaceService.disconnectAccount(id);
});
