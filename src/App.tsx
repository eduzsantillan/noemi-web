import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const BIRTHDAY_TARGET = new Date("2026-11-20T00:00:00-05:00");
const storageKey = "noemi-birthday-language";

type Language = "en" | "es";

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

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isBirthday: boolean;
};

type PageCopy = {
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
};

const copy: Record<Language, PageCopy> = {
  en: {
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
  },
  es: {
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
  },
};

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(storageKey) === "es" ? "es" : "en";
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
  const [countdown, setCountdown] = useState(getCountdown);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [choiceLoading, setChoiceLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const destinationRef = useRef<HTMLElement | null>(null);

  const t = copy[language];
  const destinations = t.destinations;
  const photos = t.photos;

  const confetti = useMemo(() => Array.from({ length: 44 }, (_, index) => index), []);
  const balloons = useMemo(() => Array.from({ length: 18 }, (_, index) => index), []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

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
        if (!cancelled) setMessage(copy[language].loadError);
      } finally {
        if (!cancelled) setChoiceLoading(false);
      }
    }

    loadChoice();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const lockedDestination = choice
    ? destinations.find((destination) => destination.value === choice.destination)
    : null;

  function openConfirmation(destination: Destination) {
    if (choice || choiceLoading) return;
    setSelectedDestination(destination);
    setPassphrase("");
    setMessage("");
  }

  function closeConfirmation() {
    if (saving) return;
    setSelectedDestination(null);
    setPassphrase("");
  }

  async function confirmDestination() {
    if (!selectedDestination) return;

    setSaving(true);
    setMessage("");

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
        setMessage(t.saveError);
        return;
      }

      setChoice(data.choice);
      setSelectedDestination(null);
      setPassphrase("");
      setMessage(t.saved(selectedDestination.name));
    } catch {
      setMessage(t.fallbackError);
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
            <LanguageToggle language={language} onChange={setLanguage} />
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

        {message && <p className="status-message" role="status">{message}</p>}
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
