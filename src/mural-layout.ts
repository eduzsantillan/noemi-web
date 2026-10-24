/** Local responsive layout. Rendering/resizing must never write positions to the API. */
export type MuralPosition = { x: number; y: number };
export type MuralLayoutNote = MuralPosition & { id: number; height: number };
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
  const rowHeight = Math.max(300, ...notes.map(note => note.height)) + MURAL_GAP;
  const height = Math.max(minimumHeight, Math.ceil(notes.length / columns) * rowHeight + EDGE * 2);
  const placed: MuralRect[] = [];
  const positions: Record<number, MuralPosition> = {};
  for (const note of notes) {
    const requested = boundPosition(note.x / 100 * width, note.y / 100 * height, cardWidth, note.height, width, height);
    let rect: MuralRect = { left: requested.x / 100 * width, top: requested.y / 100 * height, width: cardWidth, height: note.height };
    if (placed.some(other => overlaps(rect, other))) {
      // A full empty grid cell always fits, even for the longest note in the set.
      outer: for (let row = 0; row <= notes.length; row++) {
        for (let col = 0; col < columns; col++) {
          const candidate = { left: EDGE + col * (cardWidth + MURAL_GAP), top: EDGE + row * rowHeight, width: cardWidth, height: note.height };
          if (candidate.top + candidate.height <= height - EDGE && !placed.some(other => overlaps(candidate, other))) { rect = candidate; break outer; }
        }
      }
      // Arbitrary saved coordinates can straddle all grid cells. Append below them safely.
      if (placed.some(other => overlaps(rect, other))) rect = { ...rect, left: EDGE, top: Math.max(...placed.map(other => other.top + other.height)) + MURAL_GAP };
    }
    positions[note.id] = { x: rect.left / width * 100, y: rect.top };
    placed.push(rect);
  }
  const finalHeight = Math.max(height, ...placed.map(rect => rect.top + rect.height + EDGE));
  for (const id of Object.keys(positions)) positions[Number(id)].y = positions[Number(id)].y / finalHeight * 100;
  return { positions, height: finalHeight };
}
