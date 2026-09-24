import { invokeApi } from './_shared.mjs';

export default function handler(request, response) {
  const rawUrl = request.url ?? '/';
  const apiPath = rawUrl.startsWith('/api/') ? rawUrl.split('?')[0] : `/api${rawUrl.startsWith('/') ? rawUrl.split('?')[0] : `/${rawUrl.split('?')[0]}`}`;
  return invokeApi(request, response, apiPath);
}
