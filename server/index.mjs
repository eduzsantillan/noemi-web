import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

loadDotEnv();

const { Pool } = pg;

const PORT = Number(process.env.PORT ?? 4311);
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://localhost:5432/noemi_birthday';
const DESTINATION_SECRET = process.env.DESTINATION_SECRET ?? 'eduardomirey';
const DESTINATIONS = ['Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const pool = new Pool({ connectionString: DATABASE_URL });

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const envText = readFileSyncSafe(envPath);
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [rawKey, ...rawValueParts] = trimmed.split('=');
    const key = rawKey.trim();
    const value = rawValueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] ??= value;
  }
}

function readFileSyncSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS birthday_destination_choice (
      singleton_key BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_key = TRUE),
      destination TEXT NOT NULL CHECK (destination IN ('Cancun', 'Playa del Carmen', 'Punta cana', 'Puerto Rico', 'Madrid', 'Panama')),
      chosen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS birthday_mural_messages (
      id BIGSERIAL PRIMARY KEY,
      author TEXT NOT NULL CHECK (char_length(trim(author)) BETWEEN 1 AND 80),
      message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 500),
      note_x NUMERIC(6, 3) NOT NULL DEFAULT 8,
      note_y NUMERIC(6, 3) NOT NULL DEFAULT 8,
      image_data_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE birthday_mural_messages
      ADD COLUMN IF NOT EXISTS note_x NUMERIC(6, 3) NOT NULL DEFAULT 8,
      ADD COLUMN IF NOT EXISTS note_y NUMERIC(6, 3) NOT NULL DEFAULT 8,
      ADD COLUMN IF NOT EXISTS image_data_url TEXT;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS birthday_mural_messages_created_at_idx
    ON birthday_mural_messages (created_at DESC);
  `);
}

function toChoice(row) {
  if (!row) return null;
  return {
    destination: row.destination,
    chosenAt: row.chosen_at,
  };
}

function toMuralMessage(row) {
  return {
    id: Number(row.id),
    author: row.author,
    message: row.message,
    createdAt: row.created_at,
    x: Number(row.note_x),
    y: Number(row.note_y),
    imageDataUrl: row.image_data_url ?? null,
  };
}

async function readJson(request, maxBytes = 6_000_000) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      const error = new Error('Payload too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function isValidPosition(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function normalizeImageDataUrl(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  if (value.length > 3_500_000) return undefined;
  if (!/^data:image\/(png|jpe?g|webp|gif|heic|heif);base64,/i.test(value)) return undefined;
  return value;
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    try {
      await pool.query('SELECT 1');
      return sendJson(response, 200, { ok: true });
    } catch {
      return sendJson(response, 500, { ok: false, error: 'PostgreSQL no está disponible.' });
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/destinations') {
    return sendJson(response, 200, { destinations: DESTINATIONS });
  }


  if (request.method === 'GET' && url.pathname === '/api/messages') {
    try {
      const result = await pool.query(
        `SELECT id, author, message, note_x, note_y, image_data_url, created_at
         FROM birthday_mural_messages
         ORDER BY created_at DESC, id DESC
         LIMIT 120`,
      );
      return sendJson(response, 200, { messages: result.rows.map(toMuralMessage) });
    } catch {
      return sendJson(response, 500, { error: 'No se pudo leer el mural.' });
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/messages') {
    try {
      const { author, message, x, y, imageDataUrl } = await readJson(request);
      const cleanAuthor = typeof author === 'string' ? author.trim().replace(/\s+/g, ' ') : '';
      const cleanMessage = typeof message === 'string' ? message.trim() : '';
      const cleanImageDataUrl = normalizeImageDataUrl(imageDataUrl);

      if (
        !cleanAuthor ||
        cleanAuthor.length > 80 ||
        !cleanMessage ||
        cleanMessage.length > 500 ||
        !isValidPosition(x) ||
        !isValidPosition(y) ||
        cleanImageDataUrl === undefined
      ) {
        return sendJson(response, 400, { error: 'Mensaje inválido.' });
      }

      const result = await pool.query(
        `INSERT INTO birthday_mural_messages (author, message, note_x, note_y, image_data_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, author, message, note_x, note_y, image_data_url, created_at`,
        [cleanAuthor, cleanMessage, x, y, cleanImageDataUrl],
      );

      return sendJson(response, 201, { message: toMuralMessage(result.rows[0]) });
    } catch {
      return sendJson(response, 500, { error: 'No se pudo guardar el mensaje.' });
    }
  }


  const positionMatch = url.pathname.match(/^\/api\/messages\/(\d+)\/position$/);
  if (request.method === 'PATCH' && positionMatch) {
    try {
      const id = Number(positionMatch[1]);
      const { x, y } = await readJson(request, 50_000);

      if (!Number.isSafeInteger(id) || !isValidPosition(x) || !isValidPosition(y)) {
        return sendJson(response, 400, { error: 'Posición inválida.' });
      }

      const result = await pool.query(
        `UPDATE birthday_mural_messages
         SET note_x = $1, note_y = $2
         WHERE id = $3
         RETURNING id, author, message, note_x, note_y, image_data_url, created_at`,
        [x, y, id],
      );

      if (!result.rows[0]) return sendJson(response, 404, { error: 'Mensaje no encontrado.' });
      return sendJson(response, 200, { message: toMuralMessage(result.rows[0]) });
    } catch {
      return sendJson(response, 500, { error: 'No se pudo mover la nota.' });
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/choice') {
    try {
      const result = await pool.query('SELECT destination, chosen_at FROM birthday_destination_choice WHERE singleton_key = TRUE LIMIT 1');
      return sendJson(response, 200, { choice: toChoice(result.rows[0]) });
    } catch {
      return sendJson(response, 500, { error: 'No se pudo leer la elección guardada.' });
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/choice') {
    try {
      const { destination, passphrase } = await readJson(request);

      if (passphrase !== DESTINATION_SECRET) {
        return sendJson(response, 401, { error: 'Clave incorrecta. Pista: pregúntale a Eduardo con carita tierna.' });
      }

      if (!DESTINATIONS.includes(destination)) {
        return sendJson(response, 400, { error: 'Destino inválido.' });
      }

      const insertResult = await pool.query(
        `INSERT INTO birthday_destination_choice (singleton_key, destination)
         VALUES (TRUE, $1)
         ON CONFLICT (singleton_key) DO NOTHING
         RETURNING destination, chosen_at`,
        [destination],
      );

      if (insertResult.rows[0]) {
        return sendJson(response, 201, { choice: toChoice(insertResult.rows[0]) });
      }

      const existing = await pool.query('SELECT destination, chosen_at FROM birthday_destination_choice WHERE singleton_key = TRUE LIMIT 1');
      return sendJson(response, 409, {
        error: 'Ya existe un destino elegido. Esta decisión no se puede revertir.',
        choice: toChoice(existing.rows[0]),
      });
    } catch {
      return sendJson(response, 500, { error: 'No se pudo guardar la elección en PostgreSQL.' });
    }
  }

  return sendJson(response, 404, { error: 'Ruta no encontrada.' });
}

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
