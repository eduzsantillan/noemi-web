import type { ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BirthdayHome from "./BirthdayHome";
import MuralAccessGate from "./MuralAccessGate";
import MuralNoteDesign from "./MuralNoteDesign";
import { NOTE_COLORS, NOTE_DESIGNS, normalizeNoteAppearance } from "../shared/mural-appearance.mjs";
import type { NoteColor, NoteDesign } from "../shared/mural-appearance.mjs";
import { boundPosition, calculateMuralLayout, clamp, overlaps, MURAL_CANVAS_WIDTH, MURAL_CARD_WIDTH, MURAL_CANVAS_MIN_HEIGHT } from "./mural-layout";
import type { MuralPosition } from "./mural-layout";
import "./mural.css";

const storageKey = "noemi-birthday-language";

export type Language = "en" | "es";
type Route = "home" | "mural";

export type Destination = {
  value: string;
  name: string;
  emoji: string;
  line: string;
};

export type Choice = {
  destination: string;
  destinations: string[];
  chosenAt: string;
};

type MuralMessage = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
  x: number;
  y: number;
  imageDataUrl: string | null;
  color: NoteColor;
  design: NoteDesign;
};

const noteColorNames = {
  en: { cream: "Cream", butter: "Butter", rose: "Rose", lilac: "Lilac", sky: "Sky", mint: "Mint" },
  es: { cream: "Crema", butter: "Amarillo", rose: "Rosa", lilac: "Lila", sky: "Cielo", mint: "Menta" },
};
const noteDesignNames = {
  en: { plain: "Plain", confetti: "Confetti", balloons: "Balloons", cake: "Cake" },
  es: { plain: "Lisa", confetti: "Confeti", balloons: "Globos", cake: "Pastel" },
};

type MuralCopy = {
  routeKicker: string;
  title: string;
  intro: string;
  formKicker: string;
  nameLabel: string;
  namePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  photoLabel: string;
  photoHint: string;
  photoButton: string;
  removePhoto: string;
  submit: string;
  saving: string;
  boardKicker: string;
  boardTitle: string;
  boardText: string;
  emptyTitle: string;
  emptyText: string;
  loadError: string;
  saveError: string;
  moveError: string;
  photoError: string;
  saved: string;
  dragHint: string;
  characterCount: (count: number) => string;
  noteDate: (date: Date) => string;
};

export type PageCopy = {
  nav: { mural: string; home: string };
  heroKicker: string;
  heroTitle: string;
  heroText: string;
  viewDestinations: string;
  portraitCaption: string;
  countdownLabel: string;
  birthdayKicker: string;
  birthdayTitle: string;
  birthdayText: string;
  galleryLabel: string;
  giftKicker: string;
  destinationTitle: string;
  destinationText: string;
  sealedLabel: string;
  actions: { choose: string; sealed: string; closed: string };
  modalKicker: string;
  modalText: string;
  secretLabel: string;
  secretPlaceholder: string;
  saveDestination: string;
  saving: string;
  loadError: string;
  fallbackError: string;
  saveError: string;
  saved: (destination: string) => string;
  time: { days: string; hours: string; minutes: string; seconds: string };
  destinations: Destination[];
  photos: { src: string; alt: string }[];
  mural: MuralCopy;
};

const copy: Record<Language, PageCopy> = {
  en: {
    nav: { mural: "Birthday mural", home: "Birthday page" },
    heroKicker: "Noemi · November 20",
    heroTitle: "A getaway for Noemi.",
    heroText:
      "An elegant invitation to choose the next beautiful memory. On November 20, this page wakes up with confetti and balloons.",
    viewDestinations: "View destinations",
    portraitCaption: "Birthday trip selection",
    countdownLabel: "Birthday countdown",
    birthdayKicker: "Today",
    birthdayTitle: "Happy birthday, Noemi.",
    birthdayText: "The celebration begins today.",
    galleryLabel: "Noemi moments",
    giftKicker: "The gift",
    destinationTitle: "Choose your destination.",
    destinationText:
      "Choose exactly three, confirm with the silly secret key, and then they stay sealed.",
    sealedLabel: "Sealed choice",
    actions: { choose: "Choose", sealed: "Sealed", closed: "Closed" },
    modalKicker: "Confirm choice",
    modalText:
      "Enter the secret key to seal these three finalists. It cannot be changed afterward.",
    secretLabel: "Secret key",
    secretPlaceholder: "Secret key",
    saveDestination: "Save finalists",
    saving: "Saving",
    loadError: "The choice can be saved once the local server is running.",
    fallbackError: "We could not save it yet. Make sure the full local app is running.",
    saveError: "We could not save the choice.",
    saved: (destination) => `${destination} are saved. The decision is sealed.`,
    time: { days: "days", hours: "hours", minutes: "min", seconds: "sec" },
    destinations: [
      { value: "Cancun", name: "Cancun", emoji: "🌊", line: "Turquoise water, sun, and slow mornings." },
      { value: "Playa del Carmen", name: "Playa del Carmen", emoji: "🌴", line: "Pretty walks, beach days, and dinner plans." },
      { value: "Punta cana", name: "Punta Cana", emoji: "🍹", line: "All-inclusive calm and zero stress." },
      { value: "Puerto Rico", name: "Puerto Rico", emoji: "✨", line: "Warm nights, music, and a little adventure." },
      { value: "Madrid", name: "Madrid", emoji: "🏛️", line: "Cafés, tapas, and a European birthday." },
      { value: "Panama", name: "Panama", emoji: "🌆", line: "City lights, rooftops, and a perfect escape." },
      { value: "Montego Bay", name: "Montego Bay", emoji: "🇯🇲", line: "Jamaican beaches, music, and warm turquoise days." },
      { value: "Curacao", name: "Curaçao", emoji: "🎨", line: "Colorful streets, clear water, and Caribbean charm." },
    ],
    photos: [
      { src: "/birthday/noemi-birthday-5.jpg", alt: "Noemi by the pool" },
      { src: "/birthday/noemi-birthday-4.jpg", alt: "Noemi at dinner" },
      { src: "/birthday/noemi-birthday-1.jpg", alt: "Noemi traveling" },
      { src: "/birthday/noemi-birthday-3.jpg", alt: "Noemi enjoying a sunny view" },
    ],
    mural: {
      routeKicker: "For Noemi, from everyone who loves her",
      title: "Leave Noemi a birthday note.",
      intro:
        "A private little wall for sweet messages, inside jokes, wishes, and tiny pieces of love before her birthday arrives.",
      formKicker: "New note",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      messageLabel: "Message",
      messagePlaceholder: "For Noemi…",
      photoLabel: "Photo",
      photoHint: "Optional — long or heavy photos are cropped and compressed for the note.",
      photoButton: "Add photo",
      removePhoto: "Remove photo",
      submit: "Post note",
      saving: "Placing",
      boardKicker: "The mural",
      boardTitle: "Noemi’s mural",
      boardText: "",
      emptyTitle: "The first note is waiting.",
      emptyText: "Be the first person to leave Noemi a birthday wish.",
      loadError: "The mural will appear once the local app is running.",
      saveError: "Couldn’t place the note yet. Try again in a moment.",
      moveError: "That spot is too crowded — try beside it.",
      photoError: "Couldn’t read that photo. Try another one or a screenshot.",
      saved: "Your note is on the mural.",
      dragHint: "",
      characterCount: (count) => `${count}/500`,
      noteDate: (date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    },
  },
  es: {
    nav: { mural: "Mural de cumpleaños", home: "Página principal" },
    heroKicker: "Noemi · 20 de noviembre",
    heroTitle: "Una escapada para Noemi.",
    heroText:
      "Una invitación elegante para elegir el próximo recuerdo. El 20 de noviembre, la página despierta con confetti y globos.",
    viewDestinations: "Ver destinos",
    portraitCaption: "Selección de viaje de cumpleaños",
    countdownLabel: "Cuenta regresiva",
    birthdayKicker: "Hoy",
    birthdayTitle: "Feliz cumpleaños, Noemi.",
    birthdayText: "Hoy empieza la celebración.",
    galleryLabel: "Momentos de Noemi",
    giftKicker: "El regalo",
    destinationTitle: "Escoge tu destino.",
    destinationText: "Elige exactamente tres, confirma con la clave de broma y quedan sellados.",
    sealedLabel: "Elección sellada",
    actions: { choose: "Elegir", sealed: "Sellado", closed: "Cerrado" },
    modalKicker: "Confirmar elección",
    modalText: "Escribe la clave para sellar estos tres finalistas. Después no se puede cambiar.",
    secretLabel: "Clave",
    secretPlaceholder: "Clave secreta",
    saveDestination: "Guardar finalistas",
    saving: "Guardando",
    loadError: "La elección se podrá guardar cuando el servidor local esté activo.",
    fallbackError: "No pude guardar todavía. Revisa que la app local esté corriendo completa.",
    saveError: "No se pudo guardar la elección.",
    saved: (destination) => `${destination} quedaron guardados. Decisión sellada.`,
    time: { days: "días", hours: "horas", minutes: "min", seconds: "seg" },
    destinations: [
      { value: "Cancun", name: "Cancun", emoji: "🌊", line: "Mar turquesa, sol y mañanas lentas." },
      { value: "Playa del Carmen", name: "Playa del Carmen", emoji: "🌴", line: "Caminatas lindas, playa y cena bonita." },
      { value: "Punta cana", name: "Punta Cana", emoji: "🍹", line: "Todo incluido, calma y cero estrés." },
      { value: "Puerto Rico", name: "Puerto Rico", emoji: "✨", line: "Noches cálidas, música y aventura." },
      { value: "Madrid", name: "Madrid", emoji: "🏛️", line: "Cafés, tapas y cumpleaños europeo." },
      { value: "Panama", name: "Panama", emoji: "🌆", line: "Luces, rooftops y escapada perfecta." },
      { value: "Montego Bay", name: "Montego Bay", emoji: "🇯🇲", line: "Playas de Jamaica, música y días turquesa." },
      { value: "Curacao", name: "Curaçao", emoji: "🎨", line: "Calles de colores, agua clara y encanto caribeño." },
    ],
    photos: [
      { src: "/birthday/noemi-birthday-5.jpg", alt: "Noemi junto a la piscina" },
      { src: "/birthday/noemi-birthday-4.jpg", alt: "Noemi en una cena" },
      { src: "/birthday/noemi-birthday-1.jpg", alt: "Noemi de viaje" },
      { src: "/birthday/noemi-birthday-3.jpg", alt: "Noemi disfrutando una vista soleada" },
    ],
    mural: {
      routeKicker: "Para Noemi, de todos los que la quieren",
      title: "Déjale una nota de cumpleaños a Noemi.",
      intro:
        "Un murito privado para mensajes lindos, chistes internos, deseos y pedacitos de cariño antes de que llegue su cumpleaños.",
      formKicker: "Nueva nota",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      messageLabel: "Mensaje",
      messagePlaceholder: "Para Noemi…",
      photoLabel: "Foto",
      photoHint: "Opcional — las fotos largas o pesadas se recortan y comprimen solas.",
      photoButton: "Agregar foto",
      removePhoto: "Quitar foto",
      submit: "Publicar",
      saving: "Poniendo",
      boardKicker: "El mural",
      boardTitle: "Mural de Noemi",
      boardText: "",
      emptyTitle: "La primera nota está esperando.",
      emptyText: "Sé la primera persona en dejarle un deseo a Noemi.",
      loadError: "El mural aparecerá cuando la app local esté corriendo.",
      saveError: "No pude poner la nota todavía. Intenta de nuevo en un momento.",
      moveError: "Ese espacio está muy lleno — prueba al costado.",
      photoError: "No pude leer esa foto. Prueba otra o una captura.",
      saved: "Tu nota ya está en el mural.",
      dragHint: "",
      characterCount: (count) => `${count}/500`,
      noteDate: (date) =>
        date.toLocaleDateString("es-PE", { month: "short", day: "numeric" }),
    },
  },
};

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(storageKey) === "es" ? "es" : "en";
}

function getRouteFromPath(): Route {
  if (typeof window === "undefined") return "home";
  return window.location.pathname.replace(/\/$/, "") === "/mural" ? "mural" : "home";
}

export default function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [route, setRoute] = useState<Route>(getRouteFromPath);
  const t = copy[language];

  useEffect(() => {
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handlePopState = () => setRoute(getRouteFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title = route === "mural" ? "Noemi Birthday Mural" : "Noemi Birthday Getaway";
  }, [route]);

  function navigate(path: "/" | "/mural") {
    window.history.pushState({}, "", path);
    setRoute(getRouteFromPath());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (route === "mural") {
    return <MuralAccessGate language={language} onLanguageChange={setLanguage} onBack={() => navigate("/")}><MuralPage language={language} onLanguageChange={setLanguage} onNavigate={navigate} t={t} /></MuralAccessGate>;
  }

  return <BirthdayHome language={language} onLanguageChange={setLanguage} onNavigate={navigate} t={t} />;
}

const MAX_IMAGE_DATA_URL_LENGTH = 3_500_000;
const NOTE_IMAGE_TARGET_LENGTH = 1_250_000;
const NOTE_IMAGE_ASPECT_RATIO = 4 / 3;

function MuralPage({ language, onLanguageChange, onNavigate, t }: {
  language: Language; onLanguageChange: (language: Language) => void;
  onNavigate: (path: "/" | "/mural") => void; t: PageCopy;
}) {
  const es = language === "es";
  const muralCopy = t.mural;
  const [messages, setMessages] = useState<MuralMessage[]>([]);
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [noteColor, setNoteColor] = useState<NoteColor>("cream");
  const [noteDesign, setNoteDesign] = useState<NoteDesign>("confetti");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [layout, setLayout] = useState<{ positions: Record<number, MuralPosition>; height: number }>({ positions: {}, height: MURAL_CANVAS_MIN_HEIGHT });
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const boardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const composeButtonRef = useRef<HTMLButtonElement>(null);
  const focusedNoteRef = useRef<number | null>(null);
  const centeredRef = useRef(false);
  const dragFrameRef = useRef(0);
  const panRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionsRef = useRef(new Map<number, number>());
  const positionQueueRef = useRef(new Map<number, Promise<void>>());
  const confirmedPositionsRef = useRef(new Map<number, MuralPosition>());
  const imageRequestRef = useRef(0);
  const dragStateRef = useRef<{
    id: number; pointerId: number; element: HTMLElement; handle: HTMLElement;
    clientX: number; clientY: number; left: number; top: number;
    previous: MuralPosition; current: MuralPosition; moved: boolean;
    scrollLeft: number; scrollTop: number; pointerX: number; pointerY: number;
  } | null>(null);
  const keyboardPreviousRef = useRef<{ id: number; position: MuralPosition } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setLoadError(false);
    fetch("/api/messages", { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error("Messages unavailable");
      const data = await response.json() as { messages: MuralMessage[] };
      if (!abort.signal.aborted) setMessages(data.messages.map(normalizeMuralMessage));
    }).catch(() => { if (!abort.signal.aborted) setLoadError(true); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [loadAttempt]);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      if (dragStateRef.current) return;
      const shells = Array.from(board.querySelectorAll<HTMLElement>(".mural-note-shell"));
      const cardWidth = shells[0]?.offsetWidth || MURAL_CARD_WIDTH;
      const next = calculateMuralLayout([...messagesRef.current].sort((a, b) => a.id - b.id).map(message => ({
        ...message, height: board.querySelector<HTMLElement>(`[data-note-id="${message.id}"]`)?.offsetHeight || 300,
      })), MURAL_CANVAS_WIDTH, cardWidth, MURAL_CANVAS_MIN_HEIGHT);
      setLayout(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    board.querySelectorAll<HTMLElement>(".mural-note-body").forEach(element => observer.observe(element));
    measure();
    return () => observer.disconnect();
    // Text/images are measured by ResizeObserver; drag commits must not reflow other notes.
  }, [messages.length]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !messages.length || (centeredRef.current && focusedNoteRef.current === null)) return;
    const id = focusedNoteRef.current ?? Math.min(...messages.map(message => message.id));
    const position = layout.positions[id];
    if (!position) return;
    const element = boardRef.current?.querySelector<HTMLElement>(`[data-note-id="${id}"]`);
    viewport.scrollLeft = Math.max(0, position.x / 100 * MURAL_CANVAS_WIDTH - 28);
    viewport.scrollTop = Math.max(0, position.y / 100 * layout.height - Math.max(28, (viewport.clientHeight - (element?.offsetHeight || 300)) / 2));
    centeredRef.current = true; focusedNoteRef.current = null;
  }, [layout, messages.length]);

  useEffect(() => {
    if (!isComposerOpen) return;
    const dialog = dialogRef.current;
    const returnFocus = composeButtonRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>("#mural-author")?.focus({ preventScroll: true });
    return () => { dialog?.close(); returnFocus?.focus({ preventScroll: true }); };
  }, [isComposerOpen]);

  useEffect(() => () => cancelAnimationFrame(dragFrameRef.current), []);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const request = ++imageRequestRef.current;
    setImageProcessing(true); setFeedback("");
    try {
      if (!isSupportedPhotoFile(file)) throw new Error("Not an image");
      const dataUrl = await prepareImageForNote(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) throw new Error("Image too large");
      if (request === imageRequestRef.current) setImageDataUrl(dataUrl);
    } catch {
      if (request === imageRequestRef.current) { setImageDataUrl(null); setFeedback(muralCopy.photoError); }
    } finally {
      if (request === imageRequestRef.current) setImageProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAuthor = author.trim(), trimmedNote = note.trim();
    if (saving || loading || imageProcessing || !trimmedAuthor || !trimmedNote) return;
    setSaving(true); setFeedback("");
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: trimmedAuthor, message: trimmedNote, x: 8, y: 8, imageDataUrl, color: noteColor, design: noteDesign }) });
      const data = await response.json() as { message?: MuralMessage };
      if (!response.ok || !data.message) throw new Error("Could not publish");
      setMessages(current => [normalizeMuralMessage(data.message!), ...current]);
      focusedNoteRef.current = data.message.id;
      setAuthor(""); setNote(""); setImageDataUrl(null); setFeedback(muralCopy.saved); setIsComposerOpen(false);
      setNoteColor("cream"); setNoteDesign("confetti");
    } catch { setFeedback(muralCopy.saveError); }
    finally { setSaving(false); }
  }

  function validPosition(id: number, position: MuralPosition, element: HTMLElement) {
    const board = boardRef.current;
    if (!board) return false;
    const rect = { left: position.x / 100 * board.clientWidth, top: position.y / 100 * board.clientHeight, width: element.offsetWidth, height: element.offsetHeight };
    return !Array.from(board.querySelectorAll<HTMLElement>(".mural-note-shell")).some(other => {
      if (Number(other.dataset.noteId) === id) return false;
      return overlaps(rect, { left: other.offsetLeft, top: other.offsetTop, width: other.offsetWidth, height: other.offsetHeight });
    });
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, message: MuralMessage) {
    if (dragStateRef.current || event.isPrimary === false || event.button !== 0) return;
    const element = event.currentTarget.closest<HTMLElement>(".mural-note-shell");
    const previous = layoutRef.current.positions[message.id];
    if (!element || !previous) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = { id: message.id, pointerId: event.pointerId, element, handle: event.currentTarget,
      clientX: event.clientX, clientY: event.clientY, left: element.offsetLeft, top: element.offsetTop,
      previous, current: previous, moved: false,
      scrollLeft: viewportRef.current?.scrollLeft || 0, scrollTop: viewportRef.current?.scrollTop || 0,
      pointerX: event.clientX, pointerY: event.clientY };
    dragFrameRef.current = requestAnimationFrame(autoPan);
    setDraggingId(message.id); setFeedback("");
  }

  function updateDraggedNote(clientX: number, clientY: number) {
    const drag = dragStateRef.current, board = boardRef.current, viewport = viewportRef.current;
    if (!drag || !board || !viewport) return;
    drag.pointerX = clientX; drag.pointerY = clientY;
    const next = boundPosition(drag.left + clientX - drag.clientX + viewport.scrollLeft - drag.scrollLeft,
      drag.top + clientY - drag.clientY + viewport.scrollTop - drag.scrollTop,
      drag.element.offsetWidth, drag.element.offsetHeight, board.clientWidth, board.clientHeight);
    const valid = validPosition(drag.id, next, drag.element);
    if (valid) drag.current = next;
    drag.moved = drag.moved || Math.hypot(clientX - drag.clientX, clientY - drag.clientY) > 3;
    drag.element.style.transform = `translate3d(${next.x / 100 * board.clientWidth - drag.left}px, ${next.y / 100 * board.clientHeight - drag.top}px, 0)`;
    drag.element.classList.toggle("is-blocked", !valid);
  }
  function autoPan() {
    const drag = dragStateRef.current, viewport = viewportRef.current;
    if (!drag || !viewport) return;
    const rect = viewport.getBoundingClientRect();
    const edge = 24;
    const velocity = (value: number, min: number, max: number) => value < min + edge ? -Math.min(9, (min + edge - value) / 3) : value > max - edge ? Math.min(9, (value - max + edge) / 3) : 0;
    const x = velocity(drag.pointerX, rect.left, rect.right), y = velocity(drag.pointerY, rect.top, rect.bottom);
    if (drag.moved && (x || y)) { viewport.scrollBy(x, y); updateDraggedNote(drag.pointerX, drag.pointerY); }
    dragFrameRef.current = requestAnimationFrame(autoPan);
  }
  function dragNote(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerId === dragStateRef.current?.pointerId) updateDraggedNote(event.clientX, event.clientY);
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>, cancelled = false) {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    cancelAnimationFrame(dragFrameRef.current);
    if (drag.handle.hasPointerCapture(event.pointerId)) drag.handle.releasePointerCapture(event.pointerId);
    drag.element.style.removeProperty("transform"); drag.element.classList.remove("is-blocked"); setDraggingId(null);
    if (!cancelled && drag.moved && (drag.current.x !== drag.previous.x || drag.current.y !== drag.previous.y)) {
      setLayout(current => ({ ...current, positions: { ...current.positions, [drag.id]: drag.current } }));
      void persistPosition(drag.id, drag.current, drag.previous);
    }
  }

  async function persistPosition(id: number, position: MuralPosition, previous: MuralPosition) {
    const version = (versionsRef.current.get(id) || 0) + 1;
    versionsRef.current.set(id, version);
    if (!confirmedPositionsRef.current.has(id)) confirmedPositionsRef.current.set(id, previous);
    // Serialize this note's requests so a slower earlier move cannot overwrite a newer one.
    const pending = positionQueueRef.current.get(id) || Promise.resolve();
    const task = pending.then(async () => {
      try {
        const response = await fetch(`/api/messages/${id}/position`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(position) });
        if (!response.ok) throw new Error("Position unavailable");
        confirmedPositionsRef.current.set(id, position);
        if (versionsRef.current.get(id) === version) setMessages(current => current.map(item => item.id === id ? { ...item, ...position } : item));
      } catch {
        if (versionsRef.current.get(id) === version) {
          const rollback = confirmedPositionsRef.current.get(id) || previous;
          setLayout(current => ({ ...current, positions: { ...current.positions, [id]: rollback } }));
          setMessages(current => current.map(item => item.id === id ? { ...item, ...rollback } : item));
          setFeedback(es ? "No se guardó el movimiento. La nota volvió a su lugar; puedes reintentarlo." : "The move wasn't saved. The note returned to its place; please try again.");
        }
      }
    });
    positionQueueRef.current.set(id, task);
    await task;
    if (positionQueueRef.current.get(id) === task) positionQueueRef.current.delete(id);
  }

  function moveWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>, id: number) {
    const directions: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const board = boardRef.current, element = event.currentTarget.closest<HTMLElement>(".mural-note-shell"), current = layoutRef.current.positions[id];
    if (!board || !element || !current) return;
    if (!keyboardPreviousRef.current) keyboardPreviousRef.current = { id, position: current };
    const next = boundPosition(current.x / 100 * board.clientWidth + direction[0], current.y / 100 * board.clientHeight + direction[1], element.offsetWidth, element.offsetHeight, board.clientWidth, board.clientHeight);
    if (validPosition(id, next, element)) setLayout(value => ({ ...value, positions: { ...value.positions, [id]: next } }));
  }
  function finishKeyboardMove() {
    const previous = keyboardPreviousRef.current;
    if (!previous) return;
    keyboardPreviousRef.current = null;
    const next = layoutRef.current.positions[previous.id];
    if (next && (next.x !== previous.position.x || next.y !== previous.position.y)) void persistPosition(previous.id, next, previous.position);
  }

  function panCanvas(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest(".mural-note-shell, button")) return;
    const viewport = event.currentTarget;
    event.preventDefault(); viewport.setPointerCapture(event.pointerId);
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.classList.add("is-panning");
  }
  function moveCanvas(event: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = pan.left - (event.clientX - pan.x);
    event.currentTarget.scrollTop = pan.top - (event.clientY - pan.y);
  }
  function endPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null; event.currentTarget.classList.remove("is-panning");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <main className="birthday-page mural-page notes-page mural-board-page">
    <header className="mural-nav"><button className="mural-back" onClick={() => onNavigate("/")}>← {t.nav.home}</button><span className="mural-mark">NOEMI / NOTES</span><LanguageToggle language={language} onChange={onLanguageChange} /></header>
    <section className="mural-board-heading" aria-labelledby="notes-title"><div><h1 id="notes-title">{muralCopy.boardTitle}<span>{messages.length}</span></h1><p id="mural-move-hint">{es ? "Arrastra las notas. Desliza el fondo." : "Drag the notes. Swipe the background."}<span className="visually-hidden">{es ? "También puedes usar las flechas del teclado desde la parte superior de una nota." : "You can also use the arrow keys from the top of a note."}</span></p></div></section>
    <div className="mural-canvas-wrap">
      <div className="mural-canvas-viewport" ref={viewportRef} tabIndex={0} role="region" aria-label={es ? "Lienzo de notas desplazable" : "Scrollable note canvas"} onPointerDown={panCanvas} onPointerMove={moveCanvas} onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={endPan}>
        <div className="mural-notes mural-canvas" aria-busy={loading} ref={boardRef} style={{ width: MURAL_CANVAS_WIDTH, height: layout.height }}>
          {messages.map((message, index) => <div className={`mural-note-shell ${draggingId === message.id ? "is-dragging" : ""}`} data-note-id={message.id} key={message.id} onPointerMove={dragNote} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => endDrag(event, true)} style={{ left: `${layout.positions[message.id]?.x || 0}%`, top: `${layout.positions[message.id]?.y || 0}%`, visibility: layout.positions[message.id] ? "visible" : "hidden" }}>
            <article className="mural-note-body mural-paper" data-color={message.color} data-design={message.design} onPointerDown={event => startDrag(event, message)} aria-label={`${es ? "Nota de" : "Note from"} ${message.author}`}>
              <button className="mural-drag-handle" type="button" aria-label={`${es ? "Mover nota de" : "Move note from"} ${message.author}`} aria-describedby="mural-move-hint" onKeyDown={event => moveWithKeyboard(event, message.id)} onKeyUp={finishKeyboardMove} onBlur={finishKeyboardMove}><span>{String(index + 1).padStart(2, "0")} / {es ? "PARA NOEMI" : "FOR NOEMI"}</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">{[5, 9, 13].flatMap(y => [6, 12].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" />))}</svg></button>
              {message.design !== "plain" && <div className="mural-birthday-detail"><span aria-hidden="true">{es ? "UN DESEO PARA TI" : "A WISH FOR YOU"}</span><MuralNoteDesign design={message.design} /></div>}
              {message.imageDataUrl && <div className="mural-note-photo"><img src={message.imageDataUrl} alt={es ? `Recuerdo compartido por ${message.author}` : `Memory shared by ${message.author}`} loading="lazy" draggable={false} /></div>}
              <p>{message.message}</p><footer><strong>{message.author}</strong><span>{muralCopy.noteDate(new Date(message.createdAt))}</span></footer>
            </article>
          </div>)}
        </div>
      </div>
      {loading && <p className="mural-canvas-notice" role="status">{es ? "Preparando el mural…" : "Getting the mural ready…"}</p>}
      {loadError && <div className="mural-canvas-notice" role="alert"><p>{es ? "No pudimos cargar las notas." : "We couldn't load the notes."}</p><button className="mural-action" onClick={() => setLoadAttempt(value => value + 1)}>{es ? "Reintentar" : "Try again"}</button></div>}
      {!loading && !loadError && messages.length === 0 && <div className="mural-canvas-notice mural-empty"><span aria-hidden="true">♡</span><h2>{muralCopy.emptyTitle}</h2><p>{muralCopy.emptyText}</p></div>}
      {!isComposerOpen && feedback && <p className="mural-canvas-feedback" role="status">{feedback}</p>}
      <button className="mural-create-note" ref={composeButtonRef} onClick={() => { setFeedback(""); setIsComposerOpen(true); }}><span aria-hidden="true">＋</span>{es ? "Dejar una nota" : "Leave a note"}</button>
    </div>
    {isComposerOpen && <dialog ref={dialogRef} className="mural-compose-dialog" aria-labelledby="mural-compose-title" onCancel={event => { event.preventDefault(); if (!saving) setIsComposerOpen(false); }} onClick={event => { if (event.target === event.currentTarget && !saving) setIsComposerOpen(false); }}>
      <button className="mural-compose-close" type="button" aria-label={es ? "Cerrar" : "Close"} disabled={saving} onClick={() => setIsComposerOpen(false)}>×</button>
        <form className="note-form mural-composer" onSubmit={submitNote} aria-busy={saving || imageProcessing}>
          <p className="kicker">{muralCopy.formKicker}</p><h3 id="mural-compose-title">{es ? "Un deseo para Noemi." : "A wish for Noemi."}</h3>
          <label htmlFor="mural-author">{muralCopy.nameLabel}</label><input required autoComplete="name" id="mural-author" maxLength={80} value={author} onChange={event => setAuthor(event.target.value)} placeholder={muralCopy.namePlaceholder} disabled={saving} />
          <label htmlFor="mural-note">{muralCopy.messageLabel}</label>
          <div className="mural-draft-preview mural-paper" data-color={noteColor} data-design={noteDesign}>
            <div className="mural-draft-heading" aria-hidden="true"><span>{es ? "PARA NOEMI, CON AMOR" : "FOR NOEMI, WITH LOVE"}</span>{noteDesign !== "plain" && <MuralNoteDesign design={noteDesign} />}</div>
            <textarea required id="mural-note" maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder={muralCopy.messagePlaceholder} rows={3} disabled={saving} />
          </div>
          <fieldset className="mural-appearance-picker" disabled={saving}>
            <legend>Color<span>{noteColorNames[language][noteColor]}</span></legend>
            <div className="mural-color-options">{NOTE_COLORS.map(color => <label className="mural-appearance-option" key={color} title={noteColorNames[language][color]}>
              <input className="visually-hidden" type="radio" name="note-color" value={color} checked={noteColor === color} onChange={() => setNoteColor(color)} aria-label={noteColorNames[language][color]} />
              <span className="mural-color-swatch mural-paper" data-color={color}><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="m5 10 3.5 3.5L15 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            </label>)}</div>
          </fieldset>
          <fieldset className="mural-appearance-picker" disabled={saving}>
            <legend>{es ? "Diseño" : "Design"}</legend>
            <div className="mural-design-options">{NOTE_DESIGNS.map(design => <label className="mural-appearance-option" key={design}>
              <input className="visually-hidden" type="radio" name="note-design" value={design} checked={noteDesign === design} onChange={() => setNoteDesign(design)} aria-label={noteDesignNames[language][design]} />
              <span className="mural-design-tile"><MuralNoteDesign design={design} /><span>{noteDesignNames[language][design]}</span></span>
            </label>)}</div>
          </fieldset>
          <div className="photo-picker compact-photo-picker"><span className="photo-label">{muralCopy.photoLabel} / {es ? "OPCIONAL" : "OPTIONAL"}</span><input accept="image/*,.heic,.heif" aria-label={muralCopy.photoLabel} className="visually-hidden" onChange={handleImageChange} ref={fileInputRef} tabIndex={-1} type="file" disabled={saving || imageProcessing} /><button className="ghost-link" onClick={() => fileInputRef.current?.click()} type="button" disabled={saving || imageProcessing}>{imageProcessing ? (es ? "Preparando foto…" : "Preparing photo…") : muralCopy.photoButton}<span aria-hidden="true">＋</span></button></div>
          {imageDataUrl && <div className="photo-preview compact-photo-preview"><img src={imageDataUrl} alt={es ? "Foto seleccionada" : "Selected photo"} /><button className="modal-close" onClick={() => setImageDataUrl(null)} type="button" disabled={saving} aria-label={muralCopy.removePhoto}>×</button></div>}
          <div className="form-footer"><span className="character-counter">{muralCopy.characterCount(note.length)}</span><button className="confirm-button" disabled={saving || loading || imageProcessing || !author.trim() || !note.trim()} type="submit">{saving ? `${muralCopy.saving}…` : muralCopy.submit}<span aria-hidden="true">↗</span></button></div>
        </form>
      {feedback && <p className="mural-compose-feedback" role="status">{feedback}</p>}
    </dialog>}
  </main>;
}


function isSupportedPhotoFile(file: File) {
  return file.type.startsWith("image/") || isHeicFile(file);
}

function isHeicFile(file: File) {
  const fileName = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || fileName.endsWith(".heic") || fileName.endsWith(".heif");
}

async function convertHeicToJpeg(file: File) {
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.82 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
}

async function prepareImageForNote(file: File) {
  try {
    return await prepareImageOnServer(file);
  } catch (error) {
    console.warn("Local image preparation API unavailable; falling back to browser compression.", error);
    return prepareImageInBrowser(file);
  }
}

async function prepareImageOnServer(file: File) {
  const response = await fetch("/api/prepare-image", {
    method: "POST",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
    },
    body: file,
  });
  const data = (await response.json().catch(() => ({}))) as { imageDataUrl?: string };
  if (!response.ok || !data.imageDataUrl) throw new Error("Image preparation failed.");
  return data.imageDataUrl;
}

async function prepareImageInBrowser(file: File) {
  const processableFile = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
  const sourceDataUrl = await readFileAsDataUrl(processableFile);

  try {
    const image = await loadImage(sourceDataUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable.");

    const sourceAspect = image.naturalWidth / image.naturalHeight;
    let cropWidth = image.naturalWidth;
    let cropHeight = image.naturalHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceAspect > NOTE_IMAGE_ASPECT_RATIO) {
      cropWidth = image.naturalHeight * NOTE_IMAGE_ASPECT_RATIO;
      cropX = (image.naturalWidth - cropWidth) / 2;
    } else {
      cropHeight = image.naturalWidth / NOTE_IMAGE_ASPECT_RATIO;
      cropY = (image.naturalHeight - cropHeight) / 2;
    }

    let targetWidth = Math.min(1100, Math.round(cropWidth));
    let targetHeight = Math.round(targetWidth / NOTE_IMAGE_ASPECT_RATIO);
    let quality = 0.82;
    let result = "";

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      context.fillStyle = "#fbf4e8";
      context.fillRect(0, 0, targetWidth, targetHeight);
      context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
      result = canvas.toDataURL("image/jpeg", quality);

      if (result.length <= NOTE_IMAGE_TARGET_LENGTH || (targetWidth <= 560 && quality <= 0.56)) break;
      if (quality > 0.58) {
        quality -= 0.08;
      } else {
        targetWidth = Math.round(targetWidth * 0.82);
        targetHeight = Math.round(targetWidth / NOTE_IMAGE_ASPECT_RATIO);
      }
    }

    if (!result || result.length > MAX_IMAGE_DATA_URL_LENGTH) throw new Error("Compressed image too large.");
    return result;
  } catch (error) {
    if (sourceDataUrl.length <= NOTE_IMAGE_TARGET_LENGTH) return sourceDataUrl;
    throw error;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded."));
    image.src = src;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeMuralMessage(message: MuralMessage): MuralMessage {
  return {
    ...message,
    x: clamp(Number(message.x ?? 8), 0, 100),
    y: clamp(Number(message.y ?? 8), 0, 100),
    imageDataUrl: message.imageDataUrl || null,
    ...normalizeNoteAppearance(message.color, message.design),
  };
}

function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="language-toggle" aria-label="Language selector">
      <button
        className={language === "en" ? "active" : ""}
        aria-pressed={language === "en"}
        onClick={() => onChange("en")}
        type="button"
      >
        EN
      </button>
      <button
        className={language === "es" ? "active" : ""}
        aria-pressed={language === "es"}
        onClick={() => onChange("es")}
        type="button"
      >
        ES
      </button>
    </div>
  );
}
