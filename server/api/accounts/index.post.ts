import { marketplaceService } from '../../services/marketplace.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return await marketplaceService.connectAccount(body);
});
