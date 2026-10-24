import type { NoteDesign } from "../shared/mural-appearance.mjs";

/** Small, static birthday illustrations. Decoration never owns pointer gestures. */
export default function MuralNoteDesign({ design }: { design: NoteDesign }) {
  return <svg className="mural-note-design" data-design={design} viewBox="0 0 88 64" fill="none" aria-hidden="true" focusable="false">
    {design === "plain" && <><path d="M27 22h34M27 32h25M27 42h30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5" /></>}
    {design === "confetti" && <>
      <path d="m30 27-10 28 29-10Z" fill="#c47649" stroke="#75422f" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m26 39 9 10m-12-2 4 5M30 27l19 18" stroke="#ffedd7" strokeWidth="2.5" />
      <path d="M42 26c-2-9 11-5 8-16M54 35c8-7 11 4 18-3M35 17l-4-5M63 45l4 3M62 17l4-5" stroke="#775b9b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m57 21 3 2-2 4-4-2ZM44 7l3 2-2 4-3-2Z" fill="#be5e67" />
      <circle cx="72" cy="22" r="2.5" fill="#5b8672" /><circle cx="36" cy="37" r="2" fill="#5b8672" />
      <path d="m71 9 1.5 3.5L76 14l-3.5 1.5L71 19l-1.5-3.5L66 14l3.5-1.5Z" fill="#b48538" />
    </>}
    {design === "balloons" && <>
      <path d="M30 36c-8 10 16 9 8 23M59 33c10 9-17 14-9 26M45 29c-4 13 7 15 1 30" stroke="#754d3c" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="29" cy="24" rx="12" ry="15" transform="rotate(-16 29 24)" fill="#bd6872" />
      <ellipse cx="60" cy="22" rx="12" ry="15" transform="rotate(17 60 22)" fill="#8c79a6" />
      <ellipse cx="44" cy="17" rx="12" ry="15" fill="#c49b45" />
      <path d="m28 37 4 4-6 1Zm31-3 4 6-6-1ZM44 31l3 5h-6Z" fill="#754d3c" />
      <path d="M23 17c-2 2-2 5-1 7M39 9c-2 2-2 5-2 7M55 14c-2 2-2 5-2 7" stroke="#fff5e7" strokeWidth="2" strokeLinecap="round" opacity=".75" />
    </>}
    {design === "cake" && <>
      <path d="M21 54h46" stroke="#75422f" strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="31" width="38" height="22" rx="3" fill="#c47649" stroke="#75422f" strokeWidth="1.5" />
      <path d="M25 34c0-8 38-8 38 0v5c-5 7-9-6-14 0s-8-6-13 0-7 2-11-1Z" fill="#fff2df" stroke="#75422f" strokeWidth="1.2" />
      <path d="M35 29V19m18 10V19" stroke="#8c79a6" strokeWidth="4" strokeLinecap="round" />
      <path d="M35 7c-7 7-3 11 0 9s4-5 0-9Zm18 0c-7 7-3 11 0 9s4-5 0-9Z" fill="#be8540" />
      <path d="m16 20 2 4 4 1-4 2-2 4-1-4-4-2 4-1Zm55-8 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#bd6872" />
      <path d="M33 46h22" stroke="#fff2df" strokeWidth="1.5" strokeLinecap="round" />
    </>}
  </svg>;
}
