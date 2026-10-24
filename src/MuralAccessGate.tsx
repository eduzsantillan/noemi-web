import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Language } from "./App";

type Access = { authorized: boolean; requiresPassphrase: boolean; configured: boolean; opensAt: string; serverNow: string };
export default function MuralAccessGate({ language, onLanguageChange, onBack, children }: {
  language: Language; onLanguageChange: (language: Language) => void; onBack: () => void; children: ReactNode;
}) {
  const es = language === "es";
  const [access, setAccess] = useState<Access | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"" | "wrong" | "unavailable" | "limit">("");
  const sequence = useRef(0);
  const authenticating = useRef(false);
  const mounted = useRef(true);
  const check = useCallback(async () => {
    if (authenticating.current) return;
    const request = ++sequence.current;
    try {
      const response = await fetch("/api/mural-access", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Access unavailable");
      const state = await response.json() as Access;
      if (mounted.current && request === sequence.current) { setAccess(state); setError(""); }
    } catch { if (mounted.current && request === sequence.current) setError("unavailable"); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void check();
    const focus = () => { if (!document.hidden) void check(); };
    window.addEventListener("focus", focus); document.addEventListener("visibilitychange", focus);
    return () => { mounted.current = false; sequence.current++; window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", focus); };
  }, [check]);
  useEffect(() => {
    if (!access || access.authorized || !access.requiresPassphrase) return;
    // Only the server decides whether the birthday has started, regardless of the device clock.
    const remaining = Date.parse(access.opensAt) - Date.parse(access.serverNow);
    const timer = window.setTimeout(() => void check(), Math.max(1000, Math.min(60_000, Number.isFinite(remaining) ? remaining : 60_000)));
    return () => clearTimeout(timer);
  }, [access, check]);
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !passphrase) return;
    const request = ++sequence.current;
    authenticating.current = true;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/mural-access", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase }) });
      const state = await response.json() as Access;
      if (!mounted.current || request !== sequence.current) return;
      if (!response.ok || !state.authorized) {
        setError(response.status === 429 ? "limit" : response.status === 401 ? "wrong" : "unavailable");
        return;
      }
      setPassphrase(""); setAccess(state);
    } catch { if (mounted.current && request === sequence.current) setError("unavailable"); }
    finally { authenticating.current = false; if (mounted.current) setBusy(false); }
  }
  if (access?.authorized) return <>{children}</>;
  const errorText = error === "wrong" ? (es ? "Esa no es la clave. Inténtalo otra vez." : "That isn't the password. Please try again.")
    : error === "limit" ? (es ? "Espera un minuto antes de volver a intentarlo." : "Please wait a minute before trying again.")
    : es ? "No pudimos comprobar el acceso. Inténtalo de nuevo en un momento." : "We couldn't check access. Please try again in a moment.";
  return <main className="birthday-page mural-page notes-page mural-gate">
    <header className="mural-nav"><button className="mural-back" onClick={onBack}>← {es ? "Página principal" : "Birthday page"}</button><span className="mural-mark">NOEMI / NOTES</span><div className="language-toggle">{(["en", "es"] as const).map(value => <button className={language === value ? "active" : ""} aria-pressed={language === value} key={value} onClick={() => onLanguageChange(value)}>{value.toUpperCase()}</button>)}</div></header>
    <section className="mural-gate-panel" aria-labelledby="mural-access-title">
      <span className="kicker">20 / 11 / 2026 — {es ? "UN POQUITO DE MISTERIO" : "A LITTLE MYSTERY"}</span>
      <span className="mural-gate-mark" aria-hidden="true">♡</span>
      <h1 id="mural-access-title">{es ? "Entre nosotros." : "Between us."}</h1>
      <p>{es ? "El mural está preparando una sorpresa. Si tienes la clave, ya puedes entrar y dejar tu nota." : "A little surprise is taking shape. If you have the password, you can already come in and leave your note."}</p>
      {!access && !error ? <p role="status">{es ? "Comprobando acceso…" : "Checking access…"}</p> : access?.configured ? <form onSubmit={unlock} aria-busy={busy}>
        <label htmlFor="mural-passphrase">{es ? "Clave del mural" : "Mural password"}</label><input id="mural-passphrase" type="password" autoComplete="current-password" maxLength={1024} required value={passphrase} onChange={event => setPassphrase(event.target.value)} disabled={busy} aria-invalid={error === "wrong"} aria-describedby={error ? "mural-access-error" : "mural-opens-note"} />
        <button className="mural-action" type="submit" disabled={busy || !passphrase}>{busy ? (es ? "Abriendo…" : "Opening…") : (es ? "Entrar al mural" : "Enter the mural")}<span aria-hidden="true">↗</span></button>
      </form> : <p role="status">{es ? "Estamos preparando el acceso anticipado. Vuelve en un momento." : "Early access is being prepared. Please check back soon."}</p>}
      {error && <p className="mural-access-error" id="mural-access-error" role="alert">{errorText}</p>}
      {(error === "unavailable" || !access?.configured) && <button className="mural-action" onClick={() => void check()}>{es ? "Reintentar" : "Try again"}</button>}
      <p className="mural-opens-note" id="mural-opens-note">{es ? "El 20 de noviembre, desde las 00:00 de Toronto, la clave deja de ser necesaria automáticamente." : "On November 20, from midnight in Toronto, no password will be needed."}</p>
    </section>
  </main>;
}
