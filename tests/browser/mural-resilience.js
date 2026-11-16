// Run with browser_run_code. All APIs intercepted; no database writes.
async (page) => {
  const ctx = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(), errors = [], patches = [];
  let loadFail = true, active = 0, maxActive = 0;
  let notes = [{ id: 1, author: 'Amiga', message: 'Feliz cumpleaños, Noemi.', x: 8, y: 8, positionHeight: 1080, color: 'rose', design: 'confetti', createdAt: '2026-11-16T12:00:00Z' }];
  p.on('pageerror', error => errors.push(error.message));
  const check = (value, message) => { if (!value) throw new Error(message); };
  await p.addInitScript(() => localStorage.setItem('noemi-birthday-language', 'es'));
  await ctx.route('**/api/**', async route => {
    const req = route.request();
    if (req.method() === 'PATCH') {
      patches.push(req.postDataJSON()); active++; maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 100)); active--;
      if (patches.length === 2) return route.fulfill({ status: 503, json: { error: 'Injected failure' } });
      notes = notes.map(note => ({ ...note, ...req.postDataJSON() }));
      return route.fulfill({ json: { message: notes[0] } });
    }
    return route.fulfill({ status: loadFail ? 503 : 200, json: loadFail ? { error: 'Injected failure' } : { messages: notes } });
  });
  try {
    await p.goto('http://localhost:5174/mural');
    await p.getByText('No pudimos cargar las notas.', { exact: true }).waitFor();
    loadFail = false;
    await p.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await p.locator('[data-note-id="1"]').waitFor(); await p.evaluate(() => document.fonts.ready);
    const start = await p.locator('[data-note-id="1"]').evaluate(e => e.offsetTop);
    await p.getByRole('button', { name: 'Mover nota de Amiga', exact: true }).focus();
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    await p.getByText('No se guardó el movimiento.', { exact: false }).waitFor();
    const reverted = await p.locator('[data-note-id="1"]').evaluate(e => e.offsetTop);
    check(patches.length === 2 && maxActive === 1, 'Requests were not serialized');
    check(reverted === start + 16, 'Second failure did not restore the first successful move');
    await p.reload(); await p.locator('[data-note-id="1"]').waitFor();
    check(await p.locator('[data-note-id="1"]').evaluate(e => e.offsetTop) === reverted, 'Reload lost last confirmed move');
    await p.getByRole('button', { name: 'Dejar una nota', exact: true }).click();
    await p.locator('#mural-note').fill('Mi borrador'); await p.keyboard.press('Escape');
    check(await p.locator('dialog[open]').count() === 0, 'Escape did not close');
    check(await p.locator('.mural-create-note').evaluate(e => e === document.activeElement), 'Focus was not restored');
    await p.getByRole('button', { name: 'Dejar una nota', exact: true }).click();
    check(await p.locator('#mural-note').inputValue() === 'Mi borrador', 'Escape lost draft');
    check(await p.locator('.confirm-button').evaluate(e => getComputedStyle(e).transitionDuration) === '0s', 'Reduced motion ignored');
    check(errors.length === 0, 'Runtime errors: ' + errors.join('; '));
    return { loadRetry: true, serializedSaves: true, rollbackToLastSuccess: true, reload: true, escapeDraftFocus: true, reducedMotion: true, errors, realDatabaseWrites: 0 };
  } finally { await ctx.close(); }
}
