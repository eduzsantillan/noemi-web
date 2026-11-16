import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import pg from 'pg';
import { muralAccessState } from '../server/mural-access.mjs';

const request = (method, payload) => {
  const req = Readable.from(payload === undefined ? [] : [Buffer.from(JSON.stringify(payload))]);
  req.method = method; req.headers = {}; req.socket = {};
  return req;
};
const call = async (handler, method, path, payload) => {
  let status, body; const headers = {};
  const req = request(method, payload); req.url = path;
  const res = { writeHead(code, values) { status = code; Object.assign(headers, values); }, setHeader(key, value) { headers[key] = value; }, end(data) { body = JSON.parse(data); } };
  await handler(req, res, new URL(path, 'http://localhost'));
  return { status, body, headers };
};

test('the mural is public before the birthday without a password, cookie or client clock', () => {
  const now = Date.now;
  Date.now = () => Date.parse('2026-11-16T00:00:00-05:00');
  try {
    const state = muralAccessState();
    assert.equal(state.authorized, true);
    assert.equal(state.requiresPassphrase, false);
    assert.equal(state.configured, true);
    assert.equal(state.opensAt, null);
  } finally { Date.now = now; }
});

test('legacy access endpoint is public and never issues password cookies', async () => {
  const { handleApi } = await import('../server/api.mjs');
  for (const method of ['GET', 'POST']) {
    const result = await call(handleApi, method, '/api/mural-access');
    assert.equal(result.status, 200);
    assert.equal(result.body.authorized, true);
    assert.equal(result.body.requiresPassphrase, false);
    assert.equal(result.headers['set-cookie'], undefined);
    assert.equal(result.headers['cache-control'], 'no-store');
  }
});

test('anonymous clients can read, publish and move notes; uploads are no longer gated', async () => {
  const { handleApi } = await import('../server/api.mjs');
  const query = pg.Pool.prototype.query;
  pg.Pool.prototype.query = async () => ({ rows: [{ id: 1, author: 'Invitada', message: 'Felicidades', note_x: 8, note_y: 8, note_position_height: 1080, created_at: new Date().toISOString() }] });
  try {
    assert.equal((await call(handleApi, 'GET', '/api/messages')).status, 200);
    assert.equal((await call(handleApi, 'POST', '/api/messages', { author: 'Invitada', message: 'Felicidades', x: 8, y: 8 })).status, 201);
    assert.equal((await call(handleApi, 'PATCH', '/api/messages/1/position', { x: 25, y: 35, positionHeight: 1700 })).status, 200);
    assert.equal((await call(handleApi, 'POST', '/api/prepare-image')).status, 400, 'Empty upload is validated, not rejected by authentication');
  } finally { pg.Pool.prototype.query = query; }
});

test('Vercel access-status compatibility works without database initialization', async () => {
  const { invokeApi } = await import('../api/_shared.mjs');
  const result = await call((req, res) => invokeApi(req, res, '/api/mural-access'), 'GET', '/api/mural-access');
  assert.equal(result.status, 200);
  assert.equal(result.body.authorized, true);
});
