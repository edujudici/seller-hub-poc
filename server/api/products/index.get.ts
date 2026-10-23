import { productService } from '../../services/product.service';

export default defineEventHandler(async () => {
  return await productService.getProducts();
});
