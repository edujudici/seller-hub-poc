import { marketplaceService } from '../services/marketplace.service';

export default defineEventHandler(async () => {
  return await marketplaceService.bootstrap();
});
