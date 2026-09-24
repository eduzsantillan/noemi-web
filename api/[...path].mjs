import { ensureSchema, handleApi } from '../server/api.mjs';

let schemaReady;

function ensureSchemaOnce() {
  schemaReady ??= ensureSchema();
  return schemaReady;
}

export default async function handler(request, response) {
  try {
    await ensureSchemaOnce();
    const protocol = request.headers['x-forwarded-proto'] ?? 'https';
    const host = request.headers.host ?? 'localhost';
    const rawUrl = request.url ?? '/';
    const apiUrl = rawUrl.startsWith('/api/') ? rawUrl : `/api${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
    const url = new URL(apiUrl, `${protocol}://${host}`);
    await handleApi(request, response, url);
  } catch {
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.end(JSON.stringify({ error: 'No se pudo inicializar la API.' }));
  }
}
