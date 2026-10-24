// Shared allowlists: never turn user-provided strings into CSS or SVG markup.
export const NOTE_COLORS = Object.freeze(['cream', 'butter', 'rose', 'lilac', 'sky', 'mint']);
export const NOTE_DESIGNS = Object.freeze(['plain', 'confetti', 'balloons', 'cake']);

export function isValidNoteAppearance(color, design) {
  return (color === undefined || NOTE_COLORS.includes(color))
    && (design === undefined || NOTE_DESIGNS.includes(design));
}

export function normalizeNoteAppearance(color, design) {
  return {
    color: NOTE_COLORS.includes(color) ? color : 'cream',
    design: NOTE_DESIGNS.includes(design) ? design : 'plain',
  };
}
