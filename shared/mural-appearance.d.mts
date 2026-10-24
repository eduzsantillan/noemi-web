export type NoteColor = 'cream' | 'butter' | 'rose' | 'lilac' | 'sky' | 'mint';
export type NoteDesign = 'plain' | 'confetti' | 'balloons' | 'cake';
export const NOTE_COLORS: readonly NoteColor[];
export const NOTE_DESIGNS: readonly NoteDesign[];
export function isValidNoteAppearance(color: unknown, design: unknown): boolean;
export function normalizeNoteAppearance(color: unknown, design: unknown): { color: NoteColor; design: NoteDesign };
