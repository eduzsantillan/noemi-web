import type { ChangeEvent, CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const BIRTHDAY_TARGET = new Date("2026-11-20T00:00:00-05:00");
const storageKey = "noemi-birthday-language";

type Language = "en" | "es";
type Route = "home" | "mural";

type Destination = {
  value: string;
  name: string;
  emoji: string;
  line: string;
};

type Choice = {
  destination: string;
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
};

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isBirthday: boolean;
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

type PageCopy = {
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
      "One choice, confirmed with a secret key. After that, it stays sealed.",
    sealedLabel: "Sealed choice",
    actions: { choose: "Choose", sealed: "Sealed", closed: "Closed" },
    modalKicker: "Confirm choice",
    modalText:
      "Enter the secret key to seal this destination. It cannot be changed afterward.",
    secretLabel: "Secret key",
    secretPlaceholder: "Secret key",
    saveDestination: "Save destination",
    saving: "Saving",
    loadError: "The choice can be saved once the local server is running.",
    fallbackError: "We could not save it yet. Make sure the full local app is running.",
    saveError: "We could not save the choice.",
    saved: (destination) => `${destination} is saved. The decision is sealed.`,
    time: { days: "days", hours: "hours", minutes: "min", seconds: "sec" },
    destinations: [
      { value: "Cancun", name: "Cancun", emoji: "🌊", line: "Turquoise water, sun, and slow mornings." },
      { value: "Playa del Carmen", name: "Playa del Carmen", emoji: "🌴", line: "Pretty walks, beach days, and dinner plans." },
      { value: "Punta cana", name: "Punta Cana", emoji: "🍹", line: "All-inclusive calm and zero stress." },
      { value: "Puerto Rico", name: "Puerto Rico", emoji: "✨", line: "Warm nights, music, and a little adventure." },
      { value: "Madrid", name: "Madrid", emoji: "🏛️", line: "Cafés, tapas, and a European birthday." },
      { value: "Panama", name: "Panama", emoji: "🌆", line: "City lights, rooftops, and a perfect escape." },
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
      formKicker: "Add yours",
      nameLabel: "Your name",
      namePlaceholder: "Friend, cousin, accomplice…",
      messageLabel: "Your note",
      messagePlaceholder: "Write something that will make her smile.",
      photoLabel: "Add a photo",
      photoHint: "Optional — one beautiful memory per note.",
      photoButton: "Choose photo",
      removePhoto: "Remove photo",
      submit: "Place on the mural",
      saving: "Placing",
      boardKicker: "The mural",
      boardTitle: "Notes waiting for Noemi.",
      boardText: "Every message becomes a little card on her birthday wall.",
      emptyTitle: "The first note is waiting.",
      emptyText: "Be the first person to leave Noemi a birthday wish.",
      loadError: "The mural will appear once the local app is running.",
      saveError: "Couldn’t place the note yet. Try again in a moment.",
      moveError: "That spot is too crowded — try beside it.",
      photoError: "That photo is too large for one note. Try a smaller image.",
      saved: "Your note is on the mural.",
      dragHint: "Drag the notes gently. They keep a little personal space.",
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
    destinationText: "Una sola elección, confirmada con clave. Después queda sellada.",
    sealedLabel: "Elección sellada",
    actions: { choose: "Elegir", sealed: "Sellado", closed: "Cerrado" },
    modalKicker: "Confirmar elección",
    modalText: "Escribe la clave para sellar este destino. Después no se puede cambiar.",
    secretLabel: "Clave",
    secretPlaceholder: "Clave secreta",
    saveDestination: "Guardar destino",
    saving: "Guardando",
    loadError: "La elección se podrá guardar cuando el servidor local esté activo.",
    fallbackError: "No pude guardar todavía. Revisa que la app local esté corriendo completa.",
    saveError: "No se pudo guardar la elección.",
    saved: (destination) => `${destination} quedó guardado. Decisión sellada.`,
    time: { days: "días", hours: "horas", minutes: "min", seconds: "seg" },
    destinations: [
      { value: "Cancun", name: "Cancun", emoji: "🌊", line: "Mar turquesa, sol y mañanas lentas." },
      { value: "Playa del Carmen", name: "Playa del Carmen", emoji: "🌴", line: "Caminatas lindas, playa y cena bonita." },
      { value: "Punta cana", name: "Punta Cana", emoji: "🍹", line: "Todo incluido, calma y cero estrés." },
      { value: "Puerto Rico", name: "Puerto Rico", emoji: "✨", line: "Noches cálidas, música y aventura." },
      { value: "Madrid", name: "Madrid", emoji: "🏛️", line: "Cafés, tapas y cumpleaños europeo." },
      { value: "Panama", name: "Panama", emoji: "🌆", line: "Luces, rooftops y escapada perfecta." },
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
      formKicker: "Agrega el tuyo",
      nameLabel: "Tu nombre",
      namePlaceholder: "Amiga, primo, cómplice…",
      messageLabel: "Tu nota",
      messagePlaceholder: "Escribe algo que le saque una sonrisa.",
      photoLabel: "Agrega una foto",
      photoHint: "Opcional — un recuerdo bonito por nota.",
      photoButton: "Escoger foto",
      removePhoto: "Quitar foto",
      submit: "Poner en el mural",
      saving: "Poniendo",
      boardKicker: "El mural",
      boardTitle: "Notas esperando a Noemi.",
      boardText: "Cada mensaje se convierte en una tarjetita en su pared de cumpleaños.",
      emptyTitle: "La primera nota está esperando.",
      emptyText: "Sé la primera persona en dejarle un deseo a Noemi.",
      loadError: "El mural aparecerá cuando la app local esté corriendo.",
      saveError: "No pude poner la nota todavía. Intenta de nuevo en un momento.",
      moveError: "Ese espacio está muy lleno — prueba al costado.",
      photoError: "Esa foto pesa demasiado para una nota. Prueba una imagen más pequeña.",
      saved: "Tu nota ya está en el mural.",
      dragHint: "Arrastra las notas suavecito. Cada una conserva su propio espacio.",
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

function getCountdown(): CountdownParts {
  const distance = BIRTHDAY_TARGET.getTime() - Date.now();

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isBirthday: true };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    isBirthday: false,
  };
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
    return <MuralPage language={language} onLanguageChange={setLanguage} onNavigate={navigate} t={t} />;
  }

  return <BirthdayHome language={language} onLanguageChange={setLanguage} onNavigate={navigate} t={t} />;
}

function BirthdayHome({
  language,
  onLanguageChange,
  onNavigate,
  t,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onNavigate: (path: "/" | "/mural") => void;
  t: PageCopy;
}) {
  const [countdown, setCountdown] = useState(getCountdown);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [choiceLoading, setChoiceLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const destinationRef = useRef<HTMLElement | null>(null);

  const destinations = t.destinations;
  const photos = t.photos;

  const confetti = useMemo(() => Array.from({ length: 44 }, (_, index) => index), []);
  const balloons = useMemo(() => Array.from({ length: 18 }, (_, index) => index), []);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadChoice() {
      try {
        const response = await fetch("/api/choice");
        if (!response.ok) throw new Error("Could not read saved choice.");
        const data = (await response.json()) as { choice: Choice | null };
        if (!cancelled) setChoice(data.choice);
      } catch {
        if (!cancelled) setStatusMessage(t.loadError);
      } finally {
        if (!cancelled) setChoiceLoading(false);
      }
    }

    loadChoice();

    return () => {
      cancelled = true;
    };
  }, [t.loadError]);

  const lockedDestination = choice
    ? destinations.find((destination) => destination.value === choice.destination)
    : null;

  function openConfirmation(destination: Destination) {
    if (choice || choiceLoading) return;
    setSelectedDestination(destination);
    setPassphrase("");
    setStatusMessage("");
  }

  function closeConfirmation() {
    if (saving) return;
    setSelectedDestination(null);
    setPassphrase("");
  }

  async function confirmDestination() {
    if (!selectedDestination) return;

    setSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: selectedDestination.value,
          passphrase,
        }),
      });

      const data = (await response.json()) as { choice?: Choice; error?: string };

      if (!response.ok || !data.choice) {
        setStatusMessage(t.saveError);
        return;
      }

      setChoice(data.choice);
      setSelectedDestination(null);
      setPassphrase("");
      setStatusMessage(t.saved(selectedDestination.name));
    } catch {
      setStatusMessage(t.fallbackError);
    } finally {
      setSaving(false);
    }
  }

  function scrollToDestinations() {
    destinationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="birthday-page">
      <div className="silk silk-one" />
      <div className="silk silk-two" />

      {countdown.isBirthday && (
        <div className="party-layer" aria-hidden="true">
          {confetti.map((piece) => (
            <span
              className="confetti"
              key={`confetti-${piece}`}
              style={{
                "--i": piece,
                "--left": `${(piece * 23) % 100}%`,
                "--drift": `${((piece % 9) - 4) * 16}px`,
              } as CSSProperties}
            />
          ))}
          {balloons.map((balloon) => (
            <span
              className="balloon"
              key={`balloon-${balloon}`}
              style={{
                "--i": balloon,
                "--left": `${(balloon * 41) % 100}%`,
                "--drift": `${((balloon % 7) - 3) * 22}px`,
              } as CSSProperties}
            >
              🎈
            </span>
          ))}
        </div>
      )}

      <section className="hero" aria-labelledby="birthday-title">
        <div className="intro">
          <div className="topline">
            <p className="kicker">{t.heroKicker}</p>
            <div className="top-actions">
              <button className="ghost-link" onClick={() => onNavigate("/mural")} type="button">
                {t.nav.mural}
              </button>
              <LanguageToggle language={language} onChange={onLanguageChange} />
            </div>
          </div>
          <h1 id="birthday-title">{t.heroTitle}</h1>
          <p className="intro-copy">{t.heroText}</p>
          <button className="primary-link" type="button" onClick={scrollToDestinations}>
            {t.viewDestinations}
          </button>
        </div>

        <div className="portrait-stage" aria-label={photos[0].alt}>
          <div className="portrait-halo" />
          <div className="portrait-card">
            <img src={photos[0].src} alt={photos[0].alt} />
          </div>
          <p className="portrait-caption">{t.portraitCaption}</p>
        </div>
      </section>

      <section className="countdown-section" aria-label={t.countdownLabel}>
        {countdown.isBirthday ? (
          <div className="birthday-note">
            <span>🎂</span>
            <div>
              <p className="kicker">{t.birthdayKicker}</p>
              <h2>{t.birthdayTitle}</h2>
              <p>{t.birthdayText}</p>
            </div>
          </div>
        ) : (
          <div className="countdown-grid">
            <TimeBox label={t.time.days} value={countdown.days} />
            <TimeBox label={t.time.hours} value={countdown.hours} />
            <TimeBox label={t.time.minutes} value={countdown.minutes} />
            <TimeBox label={t.time.seconds} value={countdown.seconds} />
          </div>
        )}
      </section>

      <section className="gallery reveal-block" aria-label={t.galleryLabel}>
        {photos.slice(1).map((photo) => (
          <img key={photo.src} src={photo.src} alt={photo.alt} />
        ))}
      </section>

      <section className="destinations reveal-block" aria-labelledby="destination-title" ref={destinationRef}>
        <div className="section-heading">
          <p className="kicker">{t.giftKicker}</p>
          <h2 id="destination-title">{t.destinationTitle}</h2>
          <p>{t.destinationText}</p>
        </div>

        {choice && lockedDestination && (
          <div className="selected-panel">
            <span>{lockedDestination.emoji}</span>
            <div>
              <p>{t.sealedLabel}</p>
              <strong>{lockedDestination.name}</strong>
            </div>
          </div>
        )}

        <div className="destination-grid">
          {destinations.map((destination) => {
            const isLocked = Boolean(choice);
            const isWinner = choice?.destination === destination.value;

            return (
              <button
                className={`destination-card ${isWinner ? "winner" : ""}`}
                disabled={isLocked || choiceLoading}
                key={destination.value}
                onClick={() => openConfirmation(destination)}
                type="button"
              >
                <span className="destination-emoji">{destination.emoji}</span>
                <span className="destination-name">{destination.name}</span>
                <span className="destination-line">{destination.line}</span>
                <span className="destination-action">
                  {isWinner ? t.actions.sealed : isLocked ? t.actions.closed : t.actions.choose}
                </span>
              </button>
            );
          })}
        </div>

        {statusMessage && <p className="status-message" role="status">{statusMessage}</p>}
      </section>

      {selectedDestination && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" aria-labelledby="confirm-title" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={closeConfirmation} type="button" aria-label="Close">
              ×
            </button>
            <p className="kicker">{t.modalKicker}</p>
            <h2 id="confirm-title">{selectedDestination.name}</h2>
            <p>{t.modalText}</p>
            <label htmlFor="secret-code">{t.secretLabel}</label>
            <input
              autoFocus
              id="secret-code"
              onChange={(event) => setPassphrase(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void confirmDestination();
              }}
              placeholder={t.secretPlaceholder}
              type="password"
              value={passphrase}
            />
            <button className="confirm-button" disabled={saving || !passphrase.trim()} onClick={confirmDestination} type="button">
              {saving ? t.saving : t.saveDestination}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

const MAX_NOTE_OVERLAP = 0.1;
const MAX_IMAGE_DATA_URL_LENGTH = 3_500_000;
const NOTE_ESTIMATE = { width: 272, height: 286 };

type DragState = {
  id: number;
  pointerId: number;
  element: HTMLElement;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  width: number;
  height: number;
};

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function MuralPage({
  language,
  onLanguageChange,
  onNavigate,
  t,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onNavigate: (path: "/" | "/mural") => void;
  t: PageCopy;
}) {
  const [messages, setMessages] = useState<MuralMessage[]>([]);
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const muralCopy = t.mural;

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      try {
        const response = await fetch("/api/messages");
        if (!response.ok) throw new Error("Could not load messages.");
        const data = (await response.json()) as { messages: MuralMessage[] };
        const arranged = arrangeMessages(data.messages.map(normalizeMuralMessage), boardRef.current);
        if (!cancelled) {
          setMessages(arranged.messages);
          arranged.changed.forEach((item) => void persistPosition(item.id, item.x, item.y));
        }
      } catch {
        if (!cancelled) setFeedback(muralCopy.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [muralCopy.loadError]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith("image/")) throw new Error("Not an image.");
      const dataUrl = await readFileAsDataUrl(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) throw new Error("Image too large.");
      setImageDataUrl(dataUrl);
      setFeedback("");
    } catch {
      setImageDataUrl(null);
      setFeedback(muralCopy.photoError);
    } finally {
      event.target.value = "";
    }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAuthor = author.trim();
    const trimmedNote = note.trim();
    if (!trimmedAuthor || !trimmedNote) return;

    const position = findOpenPosition(messages, boardRef.current, Boolean(imageDataUrl));

    setSaving(true);
    setFeedback("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: trimmedAuthor,
          message: trimmedNote,
          x: position.x,
          y: position.y,
          imageDataUrl,
        }),
      });

      const data = (await response.json()) as { message?: MuralMessage; error?: string };
      if (!response.ok || !data.message) {
        setFeedback(muralCopy.saveError);
        return;
      }

      setMessages((current) => [normalizeMuralMessage(data.message as MuralMessage), ...current]);
      setAuthor("");
      setNote("");
      setImageDataUrl(null);
      setFeedback(muralCopy.saved);
    } catch {
      setFeedback(muralCopy.saveError);
    } finally {
      setSaving(false);
    }
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, muralMessage: MuralMessage) {
    const board = boardRef.current;
    if (!board || event.button !== 0) return;

    const noteElement = event.currentTarget;
    const visualX = (noteElement.offsetLeft / board.clientWidth) * 100;
    const visualY = (noteElement.offsetTop / board.clientHeight) * 100;
    noteElement.setPointerCapture(event.pointerId);
    noteElement.style.setProperty("--note-left", `${visualX}%`);
    noteElement.style.setProperty("--note-top", `${visualY}%`);
    setFeedback("");
    setDraggingId(muralMessage.id);
    dragStateRef.current = {
      id: muralMessage.id,
      pointerId: event.pointerId,
      element: noteElement,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: visualX,
      startY: visualY,
      lastX: visualX,
      lastY: visualY,
      width: noteElement.offsetWidth || NOTE_ESTIMATE.width,
      height: noteElement.offsetHeight || NOTE_ESTIMATE.height,
    };
  }

  function dragNote(event: ReactPointerEvent<HTMLElement>) {
    const dragging = dragStateRef.current;
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const board = boardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const x = dragging.startX + ((event.clientX - dragging.startPointerX) / boardRect.width) * 100;
    const y = dragging.startY + ((event.clientY - dragging.startPointerY) / boardRect.height) * 100;
    const next = clampNotePosition(x, y, dragging.width, dragging.height, boardRect.width, boardRect.height);

    if (hasCrowdedOverlap(dragging.id, next.x, next.y, dragging.width, dragging.height, messages, boardRect)) {
      setFeedback(muralCopy.moveError);
      return;
    }

    dragging.lastX = next.x;
    dragging.lastY = next.y;
    dragging.element.style.setProperty("--note-left", `${next.x}%`);
    dragging.element.style.setProperty("--note-top", `${next.y}%`);
    setFeedback("");
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const dragging = dragStateRef.current;
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const finalPosition = { x: dragging.lastX, y: dragging.lastY };
    const id = dragging.id;
    dragStateRef.current = null;
    setDraggingId(null);
    setMessages((current) =>
      current.map((item) => item.id === id ? { ...item, x: finalPosition.x, y: finalPosition.y } : item),
    );
    void persistPosition(id, finalPosition.x, finalPosition.y);
  }

  async function persistPosition(id: number, x: number, y: number) {
    try {
      const response = await fetch(`/api/messages/${id}/position`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y }),
      });
      if (!response.ok) throw new Error("Could not save position.");
    } catch {
      setFeedback(muralCopy.saveError);
    }
  }

  return (
    <main className="birthday-page mural-page mural-fullscreen">
      <div className="silk silk-one" />
      <div className="silk silk-two" />
      <div className="mural-orb mural-orb-one" aria-hidden="true" />
      <div className="mural-orb mural-orb-two" aria-hidden="true" />

      <section className="mural-screen" aria-labelledby="notes-title">
        <div className="topline mural-topline mural-topbar">
          <button className="ghost-link" onClick={() => onNavigate("/")} type="button">
            ← {t.nav.home}
          </button>
          <LanguageToggle language={language} onChange={onLanguageChange} />
        </div>

        <div className="notes-board fullscreen-board" aria-busy={loading} ref={boardRef}>
          <div className="board-glow" aria-hidden="true" />
          <div className="mural-board-intro">
            <p className="kicker">{muralCopy.boardKicker}</p>
            <h1 id="notes-title">{muralCopy.boardTitle}</h1>
            <p>{muralCopy.boardText}</p>
            <p className="drag-hint">{muralCopy.dragHint}</p>
          </div>

          <form className="note-form mural-composer" onSubmit={submitNote}>
            <p className="kicker">{muralCopy.formKicker}</p>
            <label htmlFor="mural-author">{muralCopy.nameLabel}</label>
            <input
              autoComplete="name"
              id="mural-author"
              maxLength={80}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder={muralCopy.namePlaceholder}
              value={author}
            />

            <label htmlFor="mural-note">{muralCopy.messageLabel}</label>
            <textarea
              id="mural-note"
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder={muralCopy.messagePlaceholder}
              rows={4}
              value={note}
            />

            <div className="photo-picker compact-photo-picker">
              <div>
                <label>{muralCopy.photoLabel}</label>
                <p>{muralCopy.photoHint}</p>
              </div>
              <input
                accept="image/*"
                className="visually-hidden"
                onChange={handleImageChange}
                ref={fileInputRef}
                tabIndex={-1}
                type="file"
              />
              <button className="ghost-link" onClick={() => fileInputRef.current?.click()} type="button">
                {muralCopy.photoButton}
              </button>
            </div>

            {imageDataUrl && (
              <div className="photo-preview compact-photo-preview">
                <img src={imageDataUrl} alt="Selected memory" />
                <button className="modal-close" onClick={() => setImageDataUrl(null)} type="button" aria-label={muralCopy.removePhoto}>
                  ×
                </button>
              </div>
            )}

            <div className="form-footer">
              <span>{muralCopy.characterCount(note.length)}</span>
              <button className="confirm-button" disabled={saving || !author.trim() || !note.trim()} type="submit">
                {saving ? `${muralCopy.saving}…` : muralCopy.submit}
              </button>
            </div>
            {feedback && <p className="status-message mural-feedback" role="status">{feedback}</p>}
          </form>

          {!loading && messages.length === 0 && (
            <div className="empty-mural empty-mural-floating">
              <span>✦</span>
              <h3>{muralCopy.emptyTitle}</h3>
              <p>{muralCopy.emptyText}</p>
            </div>
          )}

          {loading
            ? Array.from({ length: 6 }, (_, index) => (
                <div
                  className="sticky-note skeleton-note"
                  key={index}
                  style={{
                    "--note-left": `${[7, 34, 58, 16, 46, 70][index]}%`,
                    "--note-top": `${[42, 38, 40, 68, 64, 70][index]}%`,
                  } as CSSProperties}
                />
              ))
            : messages.map((muralMessage, index) => (
                <article
                  className={`sticky-note draggable-note ${draggingId === muralMessage.id ? "is-dragging" : ""}`}
                  data-note-id={muralMessage.id}
                  key={muralMessage.id}
                  onPointerCancel={endDrag}
                  onPointerDown={(event) => startDrag(event, muralMessage)}
                  onPointerMove={dragNote}
                  onPointerUp={endDrag}
                  style={{
                    "--tilt": `${[-2.2, 1.5, -0.6, 2.1, -1.4, 0.9][index % 6]}deg`,
                    "--delay": `${Math.min(index, 10) * 70}ms`,
                    "--note-left": `${muralMessage.x}%`,
                    "--note-top": `${muralMessage.y}%`,
                    zIndex: draggingId === muralMessage.id ? 12 : 1 + index,
                  } as CSSProperties}
                >
                  <div className="pin" aria-hidden="true" />
                  {muralMessage.imageDataUrl && (
                    <img className="note-photo" src={muralMessage.imageDataUrl} alt="Birthday memory" draggable={false} />
                  )}
                  <p>{muralMessage.message}</p>
                  <footer>
                    <strong>{muralMessage.author}</strong>
                  </footer>
                </article>
              ))}
        </div>
      </section>
    </main>
  );
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
    x: clamp(Number(message.x ?? 8), 0, 92),
    y: clamp(Number(message.y ?? 8), 0, 92),
    imageDataUrl: message.imageDataUrl || null,
  };
}


function arrangeMessages(messages: MuralMessage[], board: HTMLDivElement | null) {
  const boardRect = board?.getBoundingClientRect();
  const boardWidth = boardRect?.width || 1060;
  const boardHeight = boardRect?.height || 760;
  const placed: MuralMessage[] = [];
  const changed: Array<{ id: number; x: number; y: number }> = [];

  messages.forEach((message) => {
    const width = Math.min(NOTE_ESTIMATE.width, boardWidth * 0.86);
    const height = message.imageDataUrl ? 372 : NOTE_ESTIMATE.height;
    const crowded = hasCrowdedOverlap(message.id, message.x, message.y, width, height, placed, {
      width: boardWidth,
      height: boardHeight,
    });
    const isProtected = isInProtectedMuralZone(message.x, message.y);

    if (!crowded && !isProtected) {
      placed.push(message);
      return;
    }

    const position = findOpenPosition(placed, board, Boolean(message.imageDataUrl));
    const moved = { ...message, x: position.x, y: position.y };
    placed.push(moved);
    changed.push({ id: message.id, x: position.x, y: position.y });
  });

  return { messages: placed, changed };
}

function findOpenPosition(messages: MuralMessage[], board: HTMLDivElement | null, hasPhoto: boolean) {
  const boardRect = board?.getBoundingClientRect();
  const boardWidth = boardRect?.width || 1060;
  const boardHeight = boardRect?.height || 760;
  const width = Math.min(NOTE_ESTIMATE.width, boardWidth * 0.86);
  const height = hasPhoto ? 372 : NOTE_ESTIMATE.height;
  const columns = [5, 29, 52, 8, 35, 58, 70, 18, 46];
  const rows = [39, 63, 73, 48, 24, 57];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
      const jitter = ((messages.length + rowIndex + colIndex) % 3) * 1.6;
      const position = clampNotePosition(
        columns[(colIndex + messages.length) % columns.length] + jitter,
        rows[(rowIndex + messages.length) % rows.length] - jitter,
        width,
        height,
        boardWidth,
        boardHeight,
      );
      const crowded = hasCrowdedOverlap(-1, position.x, position.y, width, height, messages, {
        width: boardWidth,
        height: boardHeight,
      });
      if (!crowded && !isInProtectedMuralZone(position.x, position.y)) return position;
    }
  }

  return clampNotePosition(7 + ((messages.length * 17) % 70), 8 + ((messages.length * 23) % 66), width, height, boardWidth, boardHeight);
}


function isInProtectedMuralZone(x: number, y: number) {
  const introZone = x < 55 && y < 30;
  const composerZone = x > 61 && y < 63;
  return introZone || composerZone;
}

function clampNotePosition(x: number, y: number, width: number, height: number, boardWidth: number, boardHeight: number) {
  const maxX = Math.max(0, ((boardWidth - width) / boardWidth) * 100);
  const maxY = Math.max(0, ((boardHeight - height) / boardHeight) * 100);
  return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) };
}

function hasCrowdedOverlap(
  activeId: number,
  x: number,
  y: number,
  width: number,
  height: number,
  messages: MuralMessage[],
  boardRect: Pick<DOMRect, "width" | "height">,
) {
  const activeRect = percentToRect(x, y, width, height, boardRect.width, boardRect.height);

  return messages.some((message) => {
    if (message.id === activeId) return false;
    const otherHeight = message.imageDataUrl ? 372 : NOTE_ESTIMATE.height;
    const otherRect = percentToRect(
      message.x,
      message.y,
      Math.min(NOTE_ESTIMATE.width, boardRect.width * 0.86),
      otherHeight,
      boardRect.width,
      boardRect.height,
    );
    return getOverlapRatio(activeRect, otherRect) > MAX_NOTE_OVERLAP;
  });
}

function percentToRect(x: number, y: number, width: number, height: number, boardWidth: number, boardHeight: number): Rect {
  return {
    left: (x / 100) * boardWidth,
    top: (y / 100) * boardHeight,
    width,
    height,
  };
}

function getOverlapRatio(a: Rect, b: Rect) {
  const overlapWidth = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
  const overlapArea = overlapWidth * overlapHeight;
  if (!overlapArea) return 0;
  return overlapArea / Math.min(a.width * a.height, b.width * b.height);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
        onClick={() => onChange("en")}
        type="button"
      >
        EN
      </button>
      <button
        className={language === "es" ? "active" : ""}
        onClick={() => onChange("es")}
        type="button"
      >
        ES
      </button>
    </div>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="time-box">
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}
