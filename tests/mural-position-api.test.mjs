import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

test('schema creation and migration both store an independently bounded position height', async () => {
  for (const file of ['../db/schema.sql', '../server/api.mjs']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal([...source.matchAll(/note_position_height INTEGER NOT NULL DEFAULT 1080 CHECK \(note_position_height BETWEEN 1080 AND 1000000\)/g)].length, 2);
    assert.match(source, /ADD COLUMN IF NOT EXISTS note_position_height/);
  }
});

test('position height round-trips, validates before writes and defaults for legacy clients', async t => {
  const { handleApi } = await import('../server/api.mjs');
  const original = pg.Pool.prototype.query;
  let writes = 0;
  let row = { id: 1, author: 'Invitada', message: 'Felicidades', note_x: 8, note_y: 8, note_position_height: 1080, note_color: 'mint', note_design: 'cake', created_at: new Date().toISOString() };
  pg.Pool.prototype.query = async (sql, values) => {
    if (sql.includes('INSERT INTO birthday_mural_messages')) {
      writes++;
      row = { ...row, note_x: values[2], note_y: values[3], note_position_height: values[7] };
    } else if (sql.includes('UPDATE birthday_mural_messages')) {
      writes++;
      row = { ...row, note_x: values[0], note_y: values[1], note_position_height: values[3] };
    }
    return { rows: [{ ...row }] };
  };
  async function call(method, path, payload) {
    const req = Readable.from(payload === undefined ? [] : [Buffer.from(JSON.stringify(payload))]);
    req.headers = {}; req.socket = {}; req.method = method;
    let status, body;
    await handleApi(req, { writeHead(code) { status = code; }, end(data) { body = JSON.parse(data); } }, new URL(path, 'http://localhost'));
    return { status, body };
  }
  const note = { author: 'Invitada', message: 'Felicidades', x: 8, y: 8 };
  try {
    await t.test('POST, PATCH and GET retain the coordinate reference', async () => {
      const posted = await call('POST', '/api/messages', { ...note, positionHeight: 2400 });
      assert.equal(posted.status, 201);
      assert.equal(posted.body.message.positionHeight, 2400);
      const moved = await call('PATCH', '/api/messages/1/position', { x: 33, y: 74, positionHeight: 4800 });
      assert.equal(moved.status, 200);
      assert.equal(moved.body.message.positionHeight, 4800);
      assert.equal(moved.body.message.color, 'mint');
      assert.equal(moved.body.message.design, 'cake');
      const loaded = await call('GET', '/api/messages');
      assert.equal(loaded.body.messages[0].positionHeight, 4800);
      assert.equal(loaded.body.messages[0].y, 74);
    });
    await t.test('invalid height is rejected before any SQL write', async () => {
      const before = writes;
      for (const positionHeight of [null, '2400', {}, 0, -1, 1079, 1080.5, 1000001]) {
        assert.equal((await call('POST', '/api/messages', { ...note, positionHeight })).status, 400);
        assert.equal((await call('PATCH', '/api/messages/1/position', { x: 8, y: 8, positionHeight })).status, 400);
      }
      assert.equal(writes, before);
    });
    await t.test('old clients and rows use the original 1080px reference', async () => {
      assert.equal((await call('POST', '/api/messages', note)).body.message.positionHeight, 1080);
      assert.equal((await call('PATCH', '/api/messages/1/position', { x: 20, y: 30 })).body.message.positionHeight, 1080);
      delete row.note_position_height;
      assert.equal((await call('GET', '/api/messages')).body.messages[0].positionHeight, 1080);
    });
  } finally { pg.Pool.prototype.query = original; }
});
