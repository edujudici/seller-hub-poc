import { productService } from '../../services/product.service';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
  }
  const body = await readBody(event);
  return await productService.updateProduct(id, body);
});
