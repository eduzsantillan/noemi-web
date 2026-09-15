import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const BIRTHDAY_TARGET = new Date("2026-11-20T00:00:00-05:00");
const SECRET_DATE_LABEL = "20 de noviembre";

type Destination = {
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

const destinations: Destination[] = [
  { name: "Cancun", emoji: "🌊", line: "Mar turquesa, sol y descanso." },
  { name: "Playa del Carmen", emoji: "🌴", line: "Caminatas lindas, playa y cena bonita." },
  { name: "Punta cana", emoji: "🍹", line: "Todo incluido y cero estrés." },
  { name: "Puerto Rico", emoji: "✨", line: "Calor, música y aventura." },
  { name: "Madrid", emoji: "🏛️", line: "Cafés, tapas y cumpleaños europeo." },
  { name: "Panama", emoji: "🌆", line: "Ciudad, rooftop y escapada perfecta." },
];

const photos = [
  { src: "/birthday/noemi-birthday-5.jpg", alt: "Noemi junto a la piscina" },
  { src: "/birthday/noemi-birthday-4.jpg", alt: "Noemi en una cena" },
  { src: "/birthday/noemi-birthday-1.jpg", alt: "Noemi de viaje" },
  { src: "/birthday/noemi-birthday-3.jpg", alt: "Noemi disfrutando una vista soleada" },
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
  const destinationRef = useRef<HTMLElement | null>(null);

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
        if (!response.ok) throw new Error("No se pudo leer la elección.");
        const data = (await response.json()) as { choice: Choice | null };
        if (!cancelled) {
          setChoice(data.choice);
        }
      } catch {
        if (!cancelled) {
          setMessage("La elección se podrá guardar cuando el servidor local esté activo.");
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
      setMessage(`${data.choice.destination} quedó guardado. Decisión sellada.`);
    } catch {
      setMessage("No pude guardar todavía. Revisa que la app local esté corriendo completa.");
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
          <p className="kicker">Noemi · {SECRET_DATE_LABEL}</p>
          <h1 id="birthday-title">Una escapada para Noemi.</h1>
          <p className="intro-copy">
            Una invitación elegante para elegir el próximo recuerdo. El 20 de noviembre, la página despierta con confetti y globos.
          </p>
          <button className="primary-link" type="button" onClick={scrollToDestinations}>
            Ver destinos
          </button>
        </div>

        <div className="portrait-stage" aria-label="Foto principal de Noemi">
          <div className="portrait-halo" />
          <div className="portrait-card">
            <img src={photos[0].src} alt={photos[0].alt} />
          </div>
          <p className="portrait-caption">Birthday trip selection</p>
        </div>
      </section>

      <section className="countdown-section" aria-label="Cuenta regresiva">
        {countdown.isBirthday ? (
          <div className="birthday-note">
            <span>🎂</span>
            <div>
              <p className="kicker">Hoy</p>
              <h2>Feliz cumpleaños, Noemi.</h2>
              <p>Hoy empieza la celebración.</p>
            </div>
          </div>
        ) : (
          <div className="countdown-grid">
            <TimeBox label="días" value={countdown.days} />
            <TimeBox label="horas" value={countdown.hours} />
            <TimeBox label="min" value={countdown.minutes} />
            <TimeBox label="seg" value={countdown.seconds} />
          </div>
        )}
      </section>

      <section className="gallery reveal-block" aria-label="Momentos de Noemi">
        {photos.slice(1).map((photo) => (
          <img key={photo.src} src={photo.src} alt={photo.alt} />
        ))}
      </section>

      <section className="destinations reveal-block" aria-labelledby="destination-title" ref={destinationRef}>
        <div className="section-heading">
          <p className="kicker">El regalo</p>
          <h2 id="destination-title">Escoge tu destino.</h2>
          <p>
            Una sola elección, confirmada con clave. Después queda sellada.
          </p>
        </div>

        {choice && lockedDestination && (
          <div className="selected-panel">
            <span>{lockedDestination.emoji}</span>
            <div>
              <p>Elección sellada</p>
              <strong>{lockedDestination.name}</strong>
            </div>
          </div>
        )}

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
                <span className="destination-line">{destination.line}</span>
                <span className="destination-action">{isWinner ? "Sellado" : isLocked ? "Cerrado" : "Elegir"}</span>
              </button>
            );
          })}
        </div>

        {message && <p className="status-message" role="status">{message}</p>}
      </section>

      {selectedDestination && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" aria-labelledby="confirm-title" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={closeConfirmation} type="button" aria-label="Cerrar">×</button>
            <p className="kicker">Confirmar elección</p>
            <h2 id="confirm-title">{selectedDestination.name}</h2>
            <p>Escribe la clave para sellar este destino. Después no se puede cambiar.</p>
            <label htmlFor="secret-code">Clave</label>
            <input
              autoFocus
              id="secret-code"
              onChange={(event) => setPassphrase(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void confirmDestination();
              }}
              placeholder="Clave secreta"
              type="password"
              value={passphrase}
            />
            <button className="confirm-button" disabled={saving || !passphrase.trim()} onClick={confirmDestination} type="button">
              {saving ? "Guardando" : "Guardar destino"}
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
