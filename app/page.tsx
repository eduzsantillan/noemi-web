"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type Mood = "waiting" | "accepted" | "denied";

const blushNotes = [
  "scientifically recommended",
  "boyfriend approved",
  "100% refundable in more kisses",
];

const emergencyMessages = [
  "Option not valid 🌎💔",
  "The United Nations rejected this button.",
  "Nice try, cariño. Try the pink one.",
  "Denied button currently in therapy.",
];

export default function Home() {
  const [mood, setMood] = useState<Mood>("waiting");
  const [deniedClicks, setDeniedClicks] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNoteIndex((index) => (index + 1) % blushNotes.length);
    }, 2300);

    return () => window.clearInterval(timer);
  }, []);

  const floatingHearts = useMemo(
    () => Array.from({ length: 18 }, (_, index) => index),
    [],
  );

  const deniedCopy = deniedClicks
    ? emergencyMessages[Math.min(deniedClicks - 1, emergencyMessages.length - 1)]
    : "Denied";

  function acceptKiss() {
    setMood("accepted");
  }

  function denyKiss() {
    setMood("denied");
    setDeniedClicks((clicks) => clicks + 1);
  }

  return (
    <main className={`kiss-page ${mood}`}>
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="aurora aurora-three" />

      <div className="heart-field" aria-hidden="true">
        {floatingHearts.map((heart) => (
          <span key={heart} style={{ "--i": heart, "--x": `${(heart * 37) % 100}%` } as CSSProperties}>
            {heart % 3 === 0 ? "💋" : heart % 2 === 0 ? "💕" : "✨"}
          </span>
        ))}
      </div>

      <section className="proposal-card" aria-labelledby="kiss-title">
        <div className="status-pill">
          <span className="live-dot" />
          urgent girlfriend questionnaire
        </div>

        <div className="face-wrap" aria-hidden="true">
          <div className="planet-orbit">
            <span className="mini-planet">🌙</span>
            <span className="mini-planet">🪐</span>
          </div>
          <div className="kiss-face">😘</div>
        </div>

        <p className="eyebrow">Hey beautiful, quick question...</p>
        <h1 id="kiss-title">Do you want a kiss?</h1>
        <p className="subtitle">
          Please answer carefully. This form is highly official, extremely romantic,
          and <strong>{blushNotes[noteIndex]}</strong>.
        </p>

        <div className="answer-zone" aria-live="polite">
          {mood === "accepted" ? (
            <div className="result-card success">
              <span className="result-icon">💋</span>
              <h2>Correct answer!</h2>
              <p>Processing one premium kiss with extra hugs. Delivery: immediately.</p>
            </div>
          ) : mood === "denied" ? (
            <div className="result-card warning">
              <span className="broken-earth">🌎💔</span>
              <h2>System error detected</h2>
              <p>
                The “Denied” option broke Earth a little. Don&apos;t worry, the Accept
                button can still save the planet.
              </p>
            </div>
          ) : (
            <div className="result-card soft">
              <span className="result-icon">📝</span>
              <h2>Choose wisely</h2>
              <p>There is definitely a right answer. No pressure. Okay, tiny pressure.</p>
            </div>
          )}
        </div>

        <div className="button-row">
          <button className="accept-button" type="button" onClick={acceptKiss}>
            <span>Accept</span>
            <span aria-hidden="true">💖</span>
          </button>

          <button
            className={`deny-button ${deniedClicks ? "invalid" : ""}`}
            type="button"
            onClick={denyKiss}
            aria-label={deniedClicks ? "Option not valid, Earth broken" : "Denied"}
          >
            <span>{deniedCopy}</span>
          </button>
        </div>

        <p className="fine-print">
          By tapping Accept you agree to unlimited smiles, surprise forehead kisses,
          and a suspicious amount of cuddles.
        </p>
      </section>
    </main>
  );
}
