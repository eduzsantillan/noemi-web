/** Kept for older clients: the mural is public immediately, with no cookie or date gate. */
export function muralAccessState() {
  return { authorized: true, requiresPassphrase: false, configured: true,
    opensAt: null, serverNow: new Date().toISOString() };
}
