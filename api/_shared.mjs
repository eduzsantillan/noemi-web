import { ensureSchema, handleApi } from '../server/api.mjs';

let schemaReady;

function ensureSchemaOnce() {
  schemaReady ??= ensureSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

export async function invokeApi(request, response, pathname) {
  try {
    await ensureSchemaOnce();
    const protocol = request.headers['x-forwarded-proto'] ?? 'https';
    const host = request.headers.host ?? 'localhost';
    const url = new URL(request.url ?? pathname, `${protocol}://${host}`);
    url.pathname = pathname;
    await handleApi(request, response, url);
  } catch {
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.end(JSON.stringify({ error: 'No se pudo inicializar la API.' }));
  }
}
