// Run with browser_run_code. All APIs intercepted; no database writes.
async (page) => {
  const ctx = await page.context().browser().newContext({ viewport: { width: 1440, height: 960 } });
  const p = await ctx.newPage(), errors = [], patches = [];
  p.on('pageerror', error => errors.push(error.message));
  p.on('request', request => { if (request.method() === 'PATCH') patches.push(request.postDataJSON()); });
  const check = (value, message) => { if (!value) throw new Error(message); };
  const url = 'http://localhost:5174';
  let notes = [], id = 0;
  const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
  await ctx.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path === '/api/mural-access') return route.fulfill({ json: { authorized: true, requiresPassphrase: false } });
    if (path === '/api/prepare-image') return route.fulfill({ json: { imageDataUrl: pixel } });
    if (path.endsWith('/position')) {
      const id = Number(path.split('/').at(-2));
      notes = notes.map(note => note.id === id ? { ...note, ...request.postDataJSON() } : note);
      return route.fulfill({ json: { message: notes.find(note => note.id === id) } });
    }
    if (request.method() === 'POST') {
      const message = { ...request.postDataJSON(), id: ++id, createdAt: '2026-11-16T12:00:00Z' };
      notes = [message, ...notes]; return route.fulfill({ status: 201, json: { message } });
    }
    return route.fulfill({ json: { messages: notes } });
  });
  const pixels = () => p.locator('.mural-note-shell').evaluateAll(es => es.map(e => ({ id: Number(e.dataset.noteId), x: e.offsetLeft, y: e.offsetTop, height: e.offsetHeight })));
  try {
    await p.addInitScript(() => localStorage.setItem('noemi-birthday-language', 'es'));
    notes = Array.from({ length: 10 }, (_, i) => ({
      id: ++id, createdAt: '2026-11-16T12:00:00Z',
      author: 'Demo ' + (i + 1), message: 'Feliz cumpleaños, Noemi. ¡Por muchas más aventuras!',
      x: 8 + i % 5 * 17.75, y: i < 5 ? 5 : 50, positionHeight: 1080,
      color: ['cream', 'rose', 'lilac', 'sky', 'mint'][i % 5], design: 'confetti',
    }));
    await p.goto(url + '/mural'); await p.locator('.mural-note-shell').nth(9).waitFor();
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);
    check(await p.locator('input[type=password]').count() === 0, 'Password UI remains');
    const before = await pixels();
    await p.getByRole('button', { name: 'Dejar una nota', exact: true }).click();
    await p.locator('#mural-author').fill('Invitada de prueba');
    await p.locator('#mural-note').fill('Una nota nueva con foto. Las anteriores deben quedarse exactamente en su sitio.');
    await p.locator('label').filter({ has: p.getByRole('radio', { name: 'Amarillo', exact: true }) }).click();
    await p.locator('label').filter({ has: p.getByRole('radio', { name: 'Globos', exact: true }) }).click();
    const imageResponse = p.waitForResponse(r => r.url().endsWith('/api/prepare-image'));
    await p.locator('input[type=file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(pixel.split(',')[1], 'base64') });
    check((await imageResponse).status() === 200, 'Fixture photo preparation failed');
    await p.locator('.photo-preview').waitFor();
    await p.getByRole('button', { name: 'Publicar', exact: true }).click();
    await p.locator('.mural-note-shell').nth(10).waitFor(); await p.waitForTimeout(100);
    const after = await pixels();
    for (const old of before) {
      const next = after.find(note => note.id === old.id);
      check(Math.abs(next.x - old.x) <= 1 && Math.abs(next.y - old.y) <= 1, 'Existing note moved on publish: ' + old.id);
    }
    check(patches.length === 0, 'Publishing or measuring wrote note positions');
    const handle = p.locator(`[data-note-id="${before[0].id}"] .mural-drag-handle`);
    await handle.focus();
    const save = p.waitForResponse(r => r.request().method() === 'PATCH');
    await p.keyboard.press('ArrowDown'); check((await save).status() === 200, 'Anonymous position save failed');
    await p.waitForTimeout(50);
    const moved = (await pixels()).find(note => note.id === before[0].id);
    check(moved.y === before[0].y + 16, 'Keyboard move not applied');
    check(patches[0].positionHeight >= 1080, 'Save omitted its height reference');
    await p.reload(); await p.locator('.mural-note-shell').nth(10).waitFor();
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(80);
    const reloaded = await pixels();
    for (const old of after) {
      const expected = old.id === moved.id ? moved : old;
      const next = reloaded.find(note => note.id === old.id);
      check(Math.abs(next.x - expected.x) <= 1 && Math.abs(next.y - expected.y) <= 1, 'Reload changed pixel position: ' + old.id);
    }
    const stored = { messages: notes };
    const photoNote = stored.messages.find(note => note.author === 'Invitada de prueba');
    check(photoNote.color === 'butter' && photoNote.design === 'balloons' && photoNote.imageDataUrl.startsWith('data:image/png;base64,'), 'Reload lost photo/appearance');
    await p.screenshot({ path: '/Users/eduzuniga/Documents/date-app/outputs/mural-audit-fixture-desktop.png' });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.screenshot({ path: '/Users/eduzuniga/Documents/date-app/outputs/mural-audit-fixture-mobile.png' });
    check(errors.length === 0, 'Browser errors: ' + errors.join('; '));
    return { public: true, notes: stored.messages.length, oldNotesMovedOnPublish: 0, persistedAfterReload: true, imagePreparation: 'intercepted fixture', patches: patches.length, errors, realDatabaseWrites: 0 };
  } finally { await ctx.close(); }
}
