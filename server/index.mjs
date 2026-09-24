import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureSchema, handleApi } from './api.mjs';

const PORT = Number(process.env.PORT ?? 4311);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

async function serveStatic(request, response, url) {
  const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const safePath = path.normalize(requestedPath).replace(/^\.\.(\/|\\|$)/, '');
  let filePath = path.join(distDir, safePath);

  if (!filePath.startsWith(distDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] ?? 'application/octet-stream';
    response.writeHead(200, { 'content-type': contentType });
    response.end(file);
  } catch {
    filePath = path.join(distDir, 'index.html');
    try {
      const file = await fs.readFile(filePath);
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(file);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Run `npm run build` before `npm start`.');
    }
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (url.pathname.startsWith('/api/')) {
    await handleApi(request, response, url);
    return;
  }

  await serveStatic(request, response, url);
});

ensureSchema()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Birthday app running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Could not initialize PostgreSQL schema.');
    console.error(error);
    process.exit(1);
  });
