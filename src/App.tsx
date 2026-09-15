import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

const BIRTHDAY_TARGET = new Date("2026-11-20T00:00:00-05:00");
const SECRET_DATE_LABEL = "20 de noviembre";

type Destination = {
  name: string;
  emoji: string;
  vibe: string;
  detail: string;
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

const destinations: Destination[] = [
  {
    name: "Cancun",
    emoji: "🌊",
    vibe: "turquesa, sol y besitos",
    detail: "Para despertar con mar azul y planes que empiezan con: ‘solo una foto más’. ",
  },
  {
    name: "Playa del Carmen",
    emoji: "🌴",
    vibe: "boho, playa y cena bonita",
    detail: "Para caminar de la mano, comer rico y fingir que no vamos por otro postre.",
  },
  {
    name: "Punta cana",
    emoji: "🍹",
    vibe: "todo incluido y cero estrés",
    detail: "Para que Noemi solo se preocupe por elegir outfit, piscina o playa.",
  },
  {
    name: "Puerto Rico",
    emoji: "✨",
    vibe: "calor, música y aventura",
    detail: "Para perderse en calles lindas, bailar un poquito y volver con mil recuerdos.",
  },
  {
    name: "Madrid",
    emoji: "🏰",
    vibe: "elegante, tapas y fotitos",
    detail: "Para un cumpleaños europeo con cafés bonitos y besos en cada esquina.",
  },
  {
    name: "Panama",
    emoji: "🌆",
    vibe: "skyline, rooftop y escapada",
    detail: "Para mezclar ciudad, playa y una celebración con mood de película.",
  },
];

const photos = [
  { src: "/birthday/noemi-birthday-1.jpg", alt: "Noemi sonriendo de viaje" },
  { src: "/birthday/noemi-birthday-2.jpg", alt: "Noemi disfrutando una vista colorida" },
  { src: "/birthday/noemi-birthday-3.jpg", alt: "Noemi posando en una vista soleada" },
  { src: "/birthday/noemi-birthday-4.jpg", alt: "Noemi enviando un beso en una cena" },
  { src: "/birthday/noemi-birthday-5.jpg", alt: "Noemi junto a la piscina" },
];

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
  const [countdown, setCountdown] = useState(getCountdown);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [choiceLoading, setChoiceLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const celebrationPieces = useMemo(() => Array.from({ length: 56 }, (_, index) => index), []);
  const balloonPieces = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadChoice() {
      try {
        const response = await fetch("/api/choice");
        if (!response.ok) throw new Error("No se pudo leer la elección guardada.");
        const data = (await response.json()) as { choice: Choice | null };
        if (!cancelled) setChoice(data.choice);
      } catch {
        if (!cancelled) {
          setMessage("Aún no pude conectar con la base de datos local. Revisa que el servidor API y PostgreSQL estén corriendo.");
        }
      } finally {
        if (!cancelled) setChoiceLoading(false);
      }
    }

    loadChoice();

    return () => {
      cancelled = true;
    };
  }, []);

  const lockedDestination = choice
    ? destinations.find((destination) => destination.name === choice.destination)
    : null;

  function openConfirmation(destination: Destination) {
    if (choice) return;
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
          destination: selectedDestination.name,
          passphrase,
        }),
      });

      const data = (await response.json()) as { choice?: Choice; error?: string };

      if (!response.ok || !data.choice) {
        setMessage(data.error ?? "No se pudo guardar la elección.");
        return;
      }

      setChoice(data.choice);
      setSelectedDestination(null);
      setPassphrase("");
      setMessage(`Destino sellado: ${data.choice.destination}. Ya no hay vuelta atrás 💌`);
    } catch {
      setMessage("No pude guardar en PostgreSQL. Confirma que `npm run dev` y tu base local estén activos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="birthday-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      {countdown.isBirthday && (
        <div className="party-layer" aria-hidden="true">
          {celebrationPieces.map((piece) => (
            <span className="confetti" key={`confetti-${piece}`} style={{ "--i": piece, "--left": `${(piece * 19) % 100}%`, "--drift": `${((piece % 9) - 4) * 18}px` } as CSSProperties} />
          ))}
          {balloonPieces.map((balloon) => (
            <span className="balloon" key={`balloon-${balloon}`} style={{ "--i": balloon, "--left": `${(balloon * 37) % 100}%`, "--drift": `${((balloon % 7) - 3) * 24}px` } as CSSProperties}>
              {balloon % 4 === 0 ? "🎈" : balloon % 4 === 1 ? "🎀" : balloon % 4 === 2 ? "💖" : "✨"}
            </span>
          ))}
        </div>
      )}

      <section className="hero-section" aria-labelledby="birthday-title">
        <div className="badge"><span /> misión cumpleaños de Noemi</div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Cuenta regresiva oficial</p>
            <h1 id="birthday-title">
              Noemi, tu cumpleaños está cargando...
            </h1>
            <p className="hero-text">
              El {SECRET_DATE_LABEL} esta página desbloquea modo fiesta: confetti,
              lluvia de globos y una celebración con nivel “diseñador de renombre”.
            </p>
          </div>

          <div className="photo-cloud" aria-label="Fotos de Noemi">
            {photos.map((photo, index) => (
              <figure className="memory-card" key={photo.src} style={{ "--p": index } as CSSProperties}>
                <img src={photo.src} alt={photo.alt} />
              </figure>
            ))}
          </div>
        </div>

        <div className={`countdown-card ${countdown.isBirthday ? "birthday-mode" : ""}`}>
          {countdown.isBirthday ? (
            <div className="birthday-reveal">
              <span className="mega-emoji">🎂</span>
              <h2>¡Feliz cumpleaños, Noemi!</h2>
              <p>Hoy el universo tiene una orden: celebrar a la más hermosa.</p>
            </div>
          ) : (
            <div className="countdown-grid" aria-label={`Faltan ${countdown.days} días para el cumpleaños de Noemi`}>
              <TimeBox label="días" value={countdown.days} />
              <TimeBox label="horas" value={countdown.hours} />
              <TimeBox label="min" value={countdown.minutes} />
              <TimeBox label="seg" value={countdown.seconds} />
            </div>
          )}
        </div>
      </section>

      <section className="destinations-section" aria-labelledby="destination-title">
        <div className="section-heading">
          <p className="eyebrow">El gran regalo</p>
          <h2 id="destination-title">Escoge tu destino, mi amor</h2>
          <p>
            La elección se guarda en PostgreSQL y queda bloqueada para siempre.
            Cero arrepentimientos, solo maletas y emoción.
          </p>
        </div>

        {choiceLoading ? (
          <div className="locked-panel loading-panel">Consultando el destino secreto...</div>
        ) : choice && lockedDestination ? (
          <div className="locked-panel selected-panel">
            <span className="selected-emoji">{lockedDestination.emoji}</span>
            <div>
              <p className="locked-label">Destino elegido y sellado</p>
              <h3>{lockedDestination.name}</h3>
              <p>{lockedDestination.vibe}</p>
            </div>
          </div>
        ) : null}

        <div className="destination-grid">
          {destinations.map((destination) => {
            const isLocked = Boolean(choice);
            const isWinner = choice?.destination === destination.name;

            return (
              <button
                className={`destination-card ${isWinner ? "winner" : ""}`}
                disabled={isLocked}
                key={destination.name}
                onClick={() => openConfirmation(destination)}
                type="button"
              >
                <span className="destination-emoji">{destination.emoji}</span>
                <span className="destination-name">{destination.name}</span>
                <span className="destination-vibe">{destination.vibe}</span>
                <span className="destination-detail">{destination.detail}</span>
                <span className="destination-action">{isWinner ? "Elegido 🔒" : isLocked ? "Bloqueado" : "Seleccionar"}</span>
              </button>
            );
          })}
        </div>

        {message && <p className="status-message" role="status">{message}</p>}
      </section>

      {selectedDestination && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" aria-labelledby="confirm-title" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={closeConfirmation} type="button" aria-label="Cerrar confirmación">×</button>
            <span className="modal-emoji">{selectedDestination.emoji}</span>
            <p className="eyebrow">Confirmación ultra secreta</p>
            <h2 id="confirm-title">¿Sellamos {selectedDestination.name}?</h2>
            <p>
              Para confirmar, escribe la clave que solo el team amor conoce.
              Después de guardar, no se puede cambiar.
            </p>
            <label className="secret-label" htmlFor="secret-code">Clave</label>
            <input
              autoFocus
              id="secret-code"
              onChange={(event) => setPassphrase(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void confirmDestination();
              }}
              placeholder="Escribe la clave"
              type="password"
              value={passphrase}
            />
            <button className="confirm-button" disabled={saving || !passphrase.trim()} onClick={confirmDestination} type="button">
              {saving ? "Guardando..." : "Confirmar destino 🔐"}
            </button>
          </section>
        </div>
      )}
    </main>
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
