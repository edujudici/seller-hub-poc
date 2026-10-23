export const getServerApiConfig = () => {
  const rawBaseURL = (
    process.env.EXTERNAL_API_BASE_URL ||
    'https://api.collabmarket.com.br'
  ).replace(/\/+$/, '');

  // Extract root host URL (removing any trailing /api/v1 or /v1)
  const rootBaseURL = rawBaseURL.replace(/\/api\/v1$/, '').replace(/\/v1$/, '');

  return {
    baseURL: rawBaseURL,
    rootBaseURL: rootBaseURL,
    mercadolivreAuthEndpoint: `${rootBaseURL}/api/v1/mercadolivre/auth/url`,
    apiKey: process.env.EXTERNAL_API_TOKEN || process.env.EXTERNAL_API_KEY || '',
    useExternalAPI: Boolean(process.env.EXTERNAL_API_BASE_URL || process.env.USE_EXTERNAL_API === 'true'),
  };
};
