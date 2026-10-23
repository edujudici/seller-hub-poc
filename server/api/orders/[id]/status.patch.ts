import { marketplaceService } from '../../../services/marketplace.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' });
  }
  const body = await readBody(event);
  return await marketplaceService.updateOrderStatus(id, body.status, body.trackingNumber);
});
