/** Local responsive layout. Rendering/resizing must never write positions to the API. */
export type MuralPosition = { x: number; y: number };
export type MuralLayoutNote = MuralPosition & { id: number; height: number; positionHeight?: number };
export type MuralRect = { left: number; top: number; width: number; height: number };
export const MURAL_GAP = 24;
export const MURAL_CANVAS_WIDTH = 1600;
export const MURAL_CARD_WIDTH = 260;
export const MURAL_CANVAS_MIN_HEIGHT = 1080;
const EDGE = 16;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function overlaps(a: MuralRect, b: MuralRect) {
  return a.left < b.left + b.width + 12 && a.left + a.width + 12 > b.left &&
    a.top < b.top + b.height + 12 && a.top + a.height + 12 > b.top;
}

export function boundPosition(left: number, top: number, width: number, height: number, boardWidth: number, boardHeight: number) {
  return {
    x: clamp(left, EDGE, Math.max(EDGE, boardWidth - width - EDGE)) / boardWidth * 100,
    y: clamp(top, EDGE, Math.max(EDGE, boardHeight - height - EDGE)) / boardHeight * 100,
  };
}

export function calculateMuralLayout(notes: MuralLayoutNote[], boardWidth: number, cardWidth: number, minimumHeight = 680) {
  const width = Math.max(1, boardWidth);
  const columns = Math.max(1, Math.floor((width - EDGE * 2 + MURAL_GAP) / (cardWidth + MURAL_GAP)));
  const placed: MuralRect[] = [];
  const positions: Record<number, MuralPosition> = {};
  for (const note of notes) {
    // Stored percentages belong to the canvas height at save time, not its current height.
    // Legacy notes use the original 1080px canvas (or the caller's minimum).
    const positionHeight = Number.isFinite(note.positionHeight) && note.positionHeight! > 0 ? note.positionHeight! : minimumHeight;
    let rect: MuralRect = {
      left: clamp(note.x / 100 * width, EDGE, Math.max(EDGE, width - cardWidth - EDGE)),
      top: Math.max(EDGE, Number.isFinite(note.y) ? note.y / 100 * positionHeight : EDGE),
      width: cardWidth, height: note.height,
    };
    if (placed.some(other => overlaps(rect, other))) {
      // Consider only already-placed notes: a later tall note must not reflow earlier ones.
      const rows = [EDGE, ...placed.map(other => other.top + other.height + MURAL_GAP)].sort((a, b) => a - b);
      outer: for (const top of rows) {
        for (let col = 0; col < columns; col++) {
          const candidate = { left: EDGE + col * (cardWidth + MURAL_GAP), top, width: cardWidth, height: note.height };
          if (!placed.some(other => overlaps(candidate, other))) { rect = candidate; break outer; }
        }
      }
    }
    positions[note.id] = { x: rect.left / width * 100, y: rect.top };
    placed.push(rect);
  }
  const finalHeight = Math.ceil(Math.max(minimumHeight, ...placed.map(rect => rect.top + rect.height + EDGE)));
  for (const id of Object.keys(positions)) positions[Number(id)].y = positions[Number(id)].y / finalHeight * 100;
  return { positions, height: finalHeight };
}
