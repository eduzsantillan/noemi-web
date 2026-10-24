import { ensureSchema, handleApi } from '../server/api.mjs';
import { isMuralProtectedPath, muralAccessState } from '../server/mural-access.mjs';

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
    // Authentication and unauthenticated denials do not require a database connection.
    if (pathname !== '/api/mural-access' && !(isMuralProtectedPath(pathname) && !muralAccessState(request).authorized)) {
      await ensureSchemaOnce();
    }
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
