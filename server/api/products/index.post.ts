import { productService } from '../../services/product.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return await productService.createProduct(body);
});
