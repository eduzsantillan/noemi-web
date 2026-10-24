import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { NOTE_COLORS, NOTE_DESIGNS, isValidNoteAppearance, normalizeNoteAppearance } from '../shared/mural-appearance.mjs';
import { MURAL_OPENS_AT } from '../server/mural-access.mjs';

test('every offered color and birthday design is accepted without changing it', () => {
  assert.equal(NOTE_COLORS.length, 6);
  assert.equal(NOTE_DESIGNS.length, 4);
  for (const color of NOTE_COLORS) for (const design of NOTE_DESIGNS) {
    assert.equal(isValidNoteAppearance(color, design), true);
    assert.deepEqual(normalizeNoteAppearance(color, design), { color, design });
  }
});

test('old clients and records get safe cream/plain defaults', () => {
  assert.equal(isValidNoteAppearance(undefined, undefined), true);
  assert.deepEqual(normalizeNoteAppearance(undefined, undefined), { color: 'cream', design: 'plain' });
  assert.deepEqual(normalizeNoteAppearance('lilac', null), { color: 'lilac', design: 'plain' });
  assert.deepEqual(normalizeNoteAppearance(null, 'cake'), { color: 'cream', design: 'cake' });
});

test('appearance rejects arbitrary CSS, markup, prototype names and non-string types', () => {
  for (const value of ['#fff', 'url(https://example.com)', '<svg onload=alert(1)>', '__proto__', 'toString', '', 'CREAM', null, {}, [], 1, true]) {
    assert.equal(isValidNoteAppearance(value, 'plain'), false);
    assert.equal(isValidNoteAppearance('cream', value), false);
    assert.deepEqual(normalizeNoteAppearance(value, value), { color: 'cream', design: 'plain' });
  }
});

test('schema creation and additive migration have the same allowed styles as the API', async () => {
  for (const file of ['../db/schema.sql', '../server/api.mjs']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    for (const [column, values, fallback] of [['note_color', NOTE_COLORS, 'cream'], ['note_design', NOTE_DESIGNS, 'plain']]) {
      const definitions = [...source.matchAll(new RegExp(`${column} TEXT NOT NULL DEFAULT '([^']+)' CHECK \\( ?${column} IN \\(([^)]+)\\)\\)`, 'g'))];
      assert.equal(definitions.length, 2, `${file}: both CREATE and ADD COLUMN IF NOT EXISTS`);
      for (const definition of definitions) {
        assert.equal(definition[1], fallback);
        assert.deepEqual([...definition[2].matchAll(/'([^']+)'/g)].map(match => match[1]), [...values]);
      }
    }
  }
});

test('note API saves, reads and preserves styles with no real database writes', async t => {
  const { handleApi } = await import('../server/api.mjs');
  const realQuery = pg.Pool.prototype.query, realNow = Date.now;
  const base = { id: '19', author: 'Amiga', message: 'Feliz cumpleaños', note_x: '8', note_y: '8', image_data_url: null, created_at: '2026-11-20T12:00:00Z' };
  let stored = { ...base }, queries = [];
  Date.now = () => MURAL_OPENS_AT + 1;
  pg.Pool.prototype.query = async function (sql, values) {
    queries.push({ sql, values });
    assert.match(sql, /note_color, note_design/);
    if (sql.includes('INSERT INTO birthday_mural_messages')) {
      assert.match(sql, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7\)/);
      stored = { ...base, author: values[0], message: values[1], note_x: values[2], note_y: values[3], image_data_url: values[4], note_color: values[5], note_design: values[6] };
    } else if (sql.includes('UPDATE birthday_mural_messages')) {
      assert.match(sql, /SET note_x = \$1, note_y = \$2\s+WHERE id = \$3/);
      stored = { ...stored, note_x: values[0], note_y: values[1] };
    } else assert.match(sql, /SELECT .* FROM birthday_mural_messages/s);
    return { rows: [{ ...stored }] };
  };
  const call = async (method, path, payload) => {
    const request = Readable.from(payload ? [Buffer.from(JSON.stringify(payload))] : []);
    request.method = method; request.headers = {}; request.socket = {};
    let status, body;
    await handleApi(request, { writeHead(code) { status = code; }, end(data) { body = JSON.parse(data); } }, new URL(path, 'http://localhost'));
    return { status, body };
  };
  const note = { author: base.author, message: base.message, x: 8, y: 8, imageDataUrl: null };
  try {
    await t.test('POST and GET round-trip all 24 combinations', async () => {
      for (const color of NOTE_COLORS) for (const design of NOTE_DESIGNS) {
        const posted = await call('POST', '/api/messages', { ...note, color, design });
        assert.equal(posted.status, 201);
        assert.equal(posted.body.message.color, color); assert.equal(posted.body.message.design, design);
        const loaded = await call('GET', '/api/messages');
        assert.equal(loaded.status, 200);
        assert.equal(loaded.body.messages[0].color, color); assert.equal(loaded.body.messages[0].design, design);
      }
    });
    await t.test('moving changes only coordinates and returns the chosen appearance', async () => {
      await call('POST', '/api/messages', { ...note, color: 'rose', design: 'balloons' });
      const moved = await call('PATCH', '/api/messages/19/position', { x: 27, y: 36 });
      assert.equal(moved.status, 200);
      assert.equal(moved.body.message.color, 'rose'); assert.equal(moved.body.message.design, 'balloons');
      assert.equal(moved.body.message.x, 27); assert.equal(moved.body.message.y, 36);
    });
    await t.test('invalid styles return 400 before any query', async () => {
      const before = queries.length;
      for (const value of ['#fff', '<script>', '__proto__', null, {}, 2]) {
        assert.equal((await call('POST', '/api/messages', { ...note, color: value, design: 'cake' })).status, 400);
        assert.equal((await call('POST', '/api/messages', { ...note, color: 'mint', design: value })).status, 400);
      }
      assert.equal(queries.length, before);
    });
    await t.test('legacy POST and stored rows still work', async () => {
      const posted = await call('POST', '/api/messages', note);
      assert.equal(posted.status, 201);
      assert.equal(posted.body.message.color, 'cream'); assert.equal(posted.body.message.design, 'plain');
      stored = { ...base };
      const loaded = await call('GET', '/api/messages');
      assert.equal(loaded.body.messages[0].color, 'cream'); assert.equal(loaded.body.messages[0].design, 'plain');
    });
  } finally { pg.Pool.prototype.query = realQuery; Date.now = realNow; }
});
