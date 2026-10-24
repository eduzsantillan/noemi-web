import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMuralLayout, boundPosition, clamp, overlaps, MURAL_CANVAS_WIDTH, MURAL_CARD_WIDTH, MURAL_CANVAS_MIN_HEIGHT } from '../src/mural-layout.ts';

function verify(notes, width, cardWidth) {
  const layout = calculateMuralLayout(notes, width, cardWidth);
  const rects = notes.map(note => {
    const position = layout.positions[note.id];
    assert.ok(position && Number.isFinite(position.x) && Number.isFinite(position.y));
    const rect = { left: position.x / 100 * width, top: position.y / 100 * layout.height, width: cardWidth, height: note.height };
    assert.ok(rect.left >= 15.99 && rect.top >= 15.99);
    assert.ok(rect.left + rect.width <= width - 15.99);
    assert.ok(rect.top + rect.height <= layout.height - 15.99);
    return rect;
  });
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    assert.equal(overlaps(rects[i], rects[j]), false, `Notes ${i} and ${j} overlap`);
  }
  return layout;
}

test('empty board still has a usable canvas', () => assert.equal(calculateMuralLayout([], 350, 300).height, 680));
test('mobile notes remain fully bounded without overlap', () => verify(Array.from({length:20}, (_,i)=>({id:i,x:8,y:8,height:250+i*23})), 320, 288));
test('photos and 500-character notes use their measured heights', () => verify([300,450,900,1550,260,750].map((height,id)=>({id,x:8,y:40,height})), 900, 300));
test('saved positions are clamped to the available edges', () => verify([{id:1,x:92,y:92,height:400},{id:2,x:1000,y:-500,height:600}], 700, 300));
test('layout is deterministic and does not mutate saved positions', () => {
  const notes = [{id:1,x:9,y:13,height:300},{id:2,x:9,y:13,height:400}];
  const before=JSON.stringify(notes);
  assert.deepEqual(calculateMuralLayout(notes,800,300), calculateMuralLayout(notes,800,300));
  assert.equal(JSON.stringify(notes),before);
});
test('dense arbitrary saved positions remain collision-free at all breakpoints', () => {
  for (const width of [288,320,375,600,900,1400]) {
    const notes=Array.from({length:60},(_,id)=>({id,x:(id*31.73)%100,y:(id*63.19)%100,height:250+(id*71)%850}));
    verify(notes,width,Math.min(300,width-32));
  }
});
test('drag bounds and invalid stored coordinates are safe', () => {
  assert.deepEqual(boundPosition(-300,10000,280,400,320,800), {x:5,y:48});
  assert.equal(clamp(NaN,0,92),0);
  assert.equal(clamp(Infinity,0,92),0);
});


test('shared canvas stays at its logical dimensions instead of collapsing to a mobile list', () => {
  const notes=[{id:1,x:8,y:8,height:300},{id:2,x:55,y:40,height:480}];
  const desktop=calculateMuralLayout(notes,MURAL_CANVAS_WIDTH,MURAL_CARD_WIDTH,MURAL_CANVAS_MIN_HEIGHT);
  assert.ok(desktop.height >= MURAL_CANVAS_MIN_HEIGHT);
  assert.equal(MURAL_CANVAS_WIDTH,1600);
  assert.equal(MURAL_CARD_WIDTH,260);
  const reloaded=calculateMuralLayout(notes,MURAL_CANVAS_WIDTH,MURAL_CARD_WIDTH,MURAL_CANVAS_MIN_HEIGHT);
  assert.deepEqual(reloaded,desktop);
  assert.ok(Math.abs(desktop.positions[2].x-55)<1e-9);
});
