import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Choice, Destination, Language, PageCopy } from "./App";
import "./birthday-home.css";

// Editorial order, independent of file names and upload order.
const memories = [
  { id: "img_5646-2", en: "Under the palms, after dark.", es: "Bajo las palmeras, al anochecer.", altEn: "Noemi in a white dress beneath illuminated palm trees", altEs: "Noemi con vestido blanco bajo palmeras iluminadas" },
  { id: "img_4110", en: "My favorite place is with you.", es: "Mi lugar favorito es contigo.", altEn: "A kiss together beneath a peach-colored sunset", altEs: "Un beso juntos bajo un atardecer de color durazno" },
  { id: "img_4280", en: "The beautiful art of doing nothing.", es: "El bonito arte de no hacer nada.", altEn: "Noemi relaxing at the edge of a turquoise rooftop pool", altEs: "Noemi descansando en una piscina turquesa en la azotea" },
  { id: "img_3228", en: "A little further from ordinary.", es: "Un poquito más lejos de lo cotidiano.", altEn: "Noemi overlooking a lake and mountains beneath a cloudy sky", altEs: "Noemi frente a un lago y montañas bajo un cielo nublado" },
  { id: "img_5452", en: "A table for two, please.", es: "Una mesa para dos, por favor.", altEn: "Noemi smiling over a cocktail at an outdoor restaurant", altEs: "Noemi sonriendo con un cóctel en un restaurante al aire libre" },
  { id: "img_4572", en: "Taking the scenic route.", es: "El camino con las mejores vistas.", altEn: "Noemi in a historic plaza with a cathedral and mountains", altEs: "Noemi en una plaza histórica con una catedral y montañas" },
  { id: "img_5472", en: "This. Always this.", es: "Esto. Siempre esto.", altEn: "A kiss on Noemi’s cheek during a night out", altEs: "Un beso en la mejilla de Noemi durante una salida nocturna" },
  { id: "img_6517", en: "Nowhere to be but here.", es: "Sin prisa, sin otro lugar donde estar.", altEn: "Noemi standing beneath tall palms on a sunny terrace", altEs: "Noemi bajo altas palmeras en una terraza soleada" },
  { id: "img_4186", en: "Stay until the sky turns pink.", es: "Hasta que el cielo se vuelva rosa.", altEn: "Noemi on a terrace overlooking the sea at sunset", altEs: "Noemi en una terraza frente al mar al atardecer" },
  { id: "img_4580", en: "Another city. Still us.", es: "Otra ciudad. Siempre nosotros.", altEn: "A couple taking a selfie in a historic plaza", altEs: "Una selfie juntos en una plaza histórica" },
  { id: "img_4639", en: "The little in-between moments.", es: "Esos pequeños momentos de cada día.", altEn: "A mirror selfie together", altEs: "Una selfie juntos frente al espejo" },
  { id: "img_4645", en: "Slow mornings, good company.", es: "Mañanas tranquilas, buena compañía.", altEn: "Noemi drinking coffee over breakfast", altEs: "Noemi tomando café durante el desayuno" },
  { id: "img_5240", en: "Home is a feeling.", es: "Sentirse en casa.", altEn: "Noemi holding a small dog at home", altEs: "Noemi con un perrito en casa" },
  { id: "img_5516", en: "A little sunshine goes a long way.", es: "Un poquito de sol lo cambia todo.", altEn: "Noemi wearing sunglasses beside a pool", altEs: "Noemi con lentes de sol junto a una piscina" },
  { id: "img_5607", en: "Flowers in your hair. Not a care.", es: "Una flor en el pelo. Cero preocupaciones.", altEn: "Noemi wearing a red flower beside a tropical garden", altEs: "Noemi con una flor roja junto a un jardín tropical" },
  { id: "img_6216", en: "Nights worth remembering.", es: "Noches para recordar.", altEn: "Noemi smiling at an illuminated outdoor event", altEs: "Noemi sonriendo en un evento iluminado al aire libre" },
  { id: "img_6372", en: "Collecting stories, not things.", es: "Coleccionando historias, no cosas.", altEn: "Noemi with friends at an outdoor stadium", altEs: "Noemi con amigos en un estadio al aire libre" },
];
const homeCopy = {
  en: {
    memories: "The memories", getaway: "The getaway", edition: "The birthday edition — 2026", date: "November 20",
    eyebrow: "For the girl who makes life beautiful", title: <>Life looks<br /><em>good on you.</em></>,
    intro: "Here’s to your kind of sunshine. To getting a little lost. And to all the beautiful places still waiting for you.",
    discover: "Your next chapter", madeFor: "Made for Noemi. With love.", scroll: "A little more to discover", heroCaption: "You, in your element.",
    countdown: "Something beautiful is on its way.", until: "Until your day", chapter: "01 / The moments", galleryTitle: <>A life full of<br /><em>little wonders.</em></>,
    galleryText: "The places are beautiful. But you’ve always been the best part.", album: "Explore the album", openPhoto: "Open photo", close: "Close", previous: "Previous photo", next: "Next photo",
    full: "A collection of us", interlude: <>Anywhere is a good place.<br /><em>As long as it’s with you.</em></>,
    gift: "02 / The next chapter", giftTitle: <>More world.<br /><em>More you.</em></>, giftText: "Six beautiful possibilities. One birthday adventure. All that’s missing is your choice.", giftNote: "Pick exactly three finalists. We’ll choose from that little dream list.",
    selectedCount: (count: number) => `${count}/3 selected`, confirmFinalists: "Confirm the 3 finalists", needThree: "Choose 3 destinations to continue.", finalists: "Your three finalists", notReadyTitle: "Not ready yet", notReadyText: "This mural opens on November 20. For now, it is still collecting a little birthday magic.", notReadyCta: "I’ll wait",
    postcard: "A little less ordinary.", postcardSub: "Your next adventure is waiting.", country: ["Mexico", "Mexico", "Dominican Republic", "Caribbean", "Spain", "Panama", "Jamaica", "Curaçao"],
    mural: "A little love, from everyone.", muralText: "Some of the best gifts aren’t things. They’re words from your favorite people.", muralCta: "Visit your birthday mural",
    footer: "For all the places we’ll go. And all the versions of you we’ll celebrate.", top: "Back to the beginning", loading: "Reading your invitation…", loadError: "We couldn’t load your saved choice.", retry: "Try again", saveError: "We couldn’t confirm your choice. Check your secret key and try again.", saving: "Sealing your adventure…", sealed: "Your next chapter is", photoCount: "photographs", skip: "Skip to the getaway",
  },
  es: {
    memories: "Los recuerdos", getaway: "La escapada", edition: "Edición de cumpleaños — 2026", date: "20 de noviembre",
    eyebrow: "Para quien hace la vida más bonita", title: <>La vida,<br /><em>contigo mejor.</em></>,
    intro: "Por tus días de sol. Por perdernos un poquito. Y por todos los lugares bonitos que todavía te esperan.",
    discover: "Tu próximo capítulo", madeFor: "Para Noemi. Con amor.", scroll: "Un poquito más por descubrir", heroCaption: "Tú, en tu elemento.",
    countdown: "Algo bonito está por llegar.", until: "Para tu día", chapter: "01 / Los momentos", galleryTitle: <>La vida y sus<br /><em>pequeñas maravillas.</em></>,
    galleryText: "Los lugares son preciosos. Pero tú siempre has sido lo mejor.", album: "Explorar el álbum", openPhoto: "Abrir foto", close: "Cerrar", previous: "Foto anterior", next: "Foto siguiente",
    full: "Una colección de nosotros", interlude: <>Cualquier lugar es bonito.<br /><em>Si es contigo.</em></>,
    gift: "02 / El próximo capítulo", giftTitle: <>Más mundo.<br /><em>Más tú.</em></>, giftText: "Seis posibilidades bonitas. Una aventura de cumpleaños. Solo falta que tú elijas.", giftNote: "Elige exactamente tres finalistas. De esa listita soñada sale la aventura.",
    selectedCount: (count: number) => `${count}/3 elegidos`, confirmFinalists: "Confirmar los 3 finalistas", needThree: "Elige 3 destinos para continuar.", finalists: "Tus tres finalistas", notReadyTitle: "No ready aún", notReadyText: "El mural se abre el 20 de noviembre. Por ahora está guardando magia de cumpleaños.", notReadyCta: "Yo espero",
    postcard: "Lejos de lo cotidiano.", postcardSub: "Tu próxima aventura te espera.", country: ["México", "México", "República Dominicana", "Caribe", "España", "Panamá", "Jamaica", "Curaçao"],
    mural: "Un poquito de amor, de todos.", muralText: "Los mejores regalos no siempre son cosas. A veces son palabras de tus personas favoritas.", muralCta: "Visitar tu mural de cumpleaños",
    footer: "Por los lugares que nos esperan. Y por cada versión de ti que vamos a celebrar.", top: "Volver al principio", loading: "Leyendo tu invitación…", loadError: "No pudimos cargar tu elección guardada.", retry: "Reintentar", saveError: "No pudimos confirmar la elección. Revisa la clave e inténtalo otra vez.", saving: "Sellando tu aventura…", sealed: "Tu próximo capítulo es", photoCount: "fotografías", skip: "Ir a los destinos",
  },
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.4" /></svg>;
}

function Photo({ index, language, className = "", priority = false, sizes = "(max-width: 700px) 90vw, 40vw" }: { index: number; language: Language; className?: string; priority?: boolean; sizes?: string }) {
  const photo = memories[index];
  return <img className={className} src={`/birthday/editorial/${photo.id}-1280.webp`} srcSet={`/birthday/editorial/${photo.id}-640.webp 640w, /birthday/editorial/${photo.id}-1280.webp 1280w`} sizes={sizes} alt={language === "en" ? photo.altEn : photo.altEs} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />;
}

// Native dialogs provide focus containment, Escape handling and inert background content.
function Overlay({ children, onClose, label, className, busy = false }: { children: ReactNode; onClose: () => void; label: string; className: string; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const previousFocus = returnFocus.current;
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`editorial-dialog ${className}`} aria-label={label} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>{children}</dialog>;
}

function countdownParts() {
  const remaining = Math.max(0, new Date("2026-11-20T00:00:00-05:00").getTime() - Date.now());
  return { days: Math.floor(remaining / 86400000), hours: Math.floor(remaining / 3600000) % 24, minutes: Math.floor(remaining / 60000) % 60, seconds: Math.floor(remaining / 1000) % 60, isBirthday: remaining === 0 };
}

export default function BirthdayHome({ language, onLanguageChange, onNavigate, t }: { language: Language; onLanguageChange: (language: Language) => void; onNavigate: (path: "/" | "/mural") => void; t: PageCopy }) {
  const h = homeCopy[language];
  const pageRef = useRef<HTMLElement>(null);
  const sealedRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(countdownParts);
  const [albumIndex, setAlbumIndex] = useState<number | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [choiceLoading, setChoiceLoading] = useState(true);
  const [choiceError, setChoiceError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isMuralLockedOpen, setIsMuralLockedOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [choiceSaved, setChoiceSaved] = useState(false);

  useEffect(() => { const timer = window.setInterval(() => setCountdown(countdownParts()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const abort = new AbortController();
    setChoiceLoading(true); setChoiceError(false);
    fetch("/api/choice", { signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Choice unavailable");
      const data = await response.json() as { choice: Choice | null };
      if (!abort.signal.aborted) setChoice(data.choice);
    }).catch(() => { if (!abort.signal.aborted) setChoiceError(true); }).finally(() => { if (!abort.signal.aborted) setChoiceLoading(false); });
    return () => abort.abort();
  }, [loadAttempt]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const items = page.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    items.forEach((item) => { item.classList.add("reveal-ready"); observer.observe(item); });
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      page.style.setProperty("--page-progress", String(window.scrollY / max));
      page.style.setProperty("--hero-shift", media.matches ? "0px" : `${Math.min(window.scrollY, 500) * 0.07}px`);
      page.style.setProperty("--photo-shift", media.matches ? "0px" : `${Math.min(window.scrollY, 500) * -0.025}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); media.addEventListener("change", schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); media.removeEventListener("change", schedule); };
  }, []);

  useEffect(() => {
    if (albumIndex === null) return;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); setAlbumIndex((index) => index === null ? null : (index + (event.key === "ArrowRight" ? 1 : -1) + memories.length) % memories.length);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [albumIndex !== null]);

  useEffect(() => { if (choiceSaved) sealedRef.current?.focus({ preventScroll: true }); }, [choiceSaved]);

  function moveTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
  function closeConfirmation() { if (!saving) { setIsConfirmationOpen(false); setPassphrase(""); setSaveError(false); } }
  function toggleDestination(destination: Destination) {
    if (choice || choiceLoading || choiceError) return;
    setSaveError(false);
    setSelectedDestinations((current) => {
      if (current.some((item) => item.value === destination.value)) return current.filter((item) => item.value !== destination.value);
      if (current.length >= 3) return current;
      return [...current, destination];
    });
  }
  function requestMural() {
    if (countdown.isBirthday) onNavigate("/mural");
    else setIsMuralLockedOpen(true);
  }
  async function confirmDestination() {
    if (selectedDestinations.length !== 3 || saving || !passphrase.trim()) return;
    setSaving(true); setSaveError(false);
    try {
      const response = await fetch("/api/choice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinations: selectedDestinations.map((destination) => destination.value), passphrase }) });
      const data = await response.json() as { choice?: Choice };
      if (!response.ok || !data.choice) { setSaveError(true); return; }
      setChoice(data.choice); setChoiceSaved(true); setIsConfirmationOpen(false); setSelectedDestinations([]); setPassphrase("");
    } catch { setSaveError(true); } finally { setSaving(false); }
  }
  const savedDestinations = (choice?.destinations?.length ? choice.destinations : choice?.destination ? [choice.destination] : [])
    .map((value) => t.destinations.find((destination) => destination.value === value))
    .filter((destination): destination is Destination => Boolean(destination));
  const winner = savedDestinations[0];
  const savedDestinationNames = savedDestinations.map((destination) => destination.name).join(" · ") || winner?.name || choice?.destination || "";

  return <main className="editorial-home" ref={pageRef}>
    <a className="ed-skip" href="#getaway">{h.skip}</a>
    <div className="ed-progress" aria-hidden="true" />
    <header className="ed-header">
      <a className="ed-wordmark" href="#beginning" aria-label="Noemi">noemi<span>✳</span></a>
      <nav aria-label={language === "en" ? "Main navigation" : "Navegación principal"}>
        <a href="#memories" onClick={(e) => { e.preventDefault(); moveTo("memories"); }}>{h.memories}</a>
        <a href="#getaway" onClick={(e) => { e.preventDefault(); moveTo("getaway"); }}>{h.getaway}</a>
        <button onClick={requestMural} aria-label={t.nav.mural}><span className="ed-nav-full">{t.nav.mural}</span><span className="ed-nav-compact" aria-hidden="true">Mural</span><span aria-hidden="true">↗</span></button>
      </nav>
      <div className="ed-language" aria-label={language === "en" ? "Language" : "Idioma"}>
        {(["en", "es"] as const).map((item) => <button key={item} aria-pressed={language === item} onClick={() => onLanguageChange(item)}>{item.toUpperCase()}</button>)}
      </div>
    </header>

    <section className="ed-hero" id="beginning" aria-labelledby="ed-title">
      <div className="ed-issue"><span>{h.edition}</span><span>20.11 <i /> {h.date}</span></div>
      <div className="ed-hero-layout">
        <div className="ed-hero-copy">
          <p className="ed-eyebrow"><span className="ed-star" aria-hidden="true">✳</span>{h.eyebrow}</p>
          <h1 id="ed-title">{h.title}</h1>
          <p className="ed-intro">{h.intro}</p>
          <button className="ed-pill" onClick={() => moveTo("getaway")}>{h.discover}<span><Arrow diagonal /></span></button>
          <div className="ed-love-note">
            <button className="ed-tiny-photo" onClick={() => setAlbumIndex(1)} aria-label={`${h.openPhoto}: ${memories[1][language]}`}><Photo index={1} language={language} sizes="140px" /></button>
            <div><span className="ed-handwritten">with love, always.</span><p>{h.madeFor}</p></div>
          </div>
        </div>
        <div className="ed-hero-art">
          <button className="ed-cover-photo" onClick={() => setAlbumIndex(0)} aria-label={`${h.openPhoto}: ${memories[0][language]}`}><Photo index={0} language={language} priority sizes="(max-width: 700px) 85vw, 44vw" /><span className="ed-image-open"><Arrow diagonal /></span></button>
          <div className="ed-stamp" aria-hidden="true"><span>JUST FOR YOU</span><b>20</b><span>NOVEMBER</span></div>
          <button className="ed-pool-photo" onClick={() => setAlbumIndex(2)} aria-label={`${h.openPhoto}: ${memories[2][language]}`}><Photo index={2} language={language} sizes="(max-width: 700px) 38vw, 18vw" /><span>DO NOT DISTURB. ♡</span></button>
          <span className="ed-photo-annotation">{h.heroCaption}</span>
          <span className="ed-vertical-caption">NOEMI / THE GOOD LIFE COLLECTION</span>
        </div>
      </div>
      <div className="ed-hero-bottom"><span>{h.scroll}</span><span aria-hidden="true">↓</span><span>EST. WITH LOVE — ∞</span></div>
    </section>

    <section className="ed-countdown" aria-label={t.countdownLabel} data-reveal>
      <div><span className="ed-label">{countdown.isBirthday ? t.birthdayKicker : h.until}</span><h2>{countdown.isBirthday ? t.birthdayTitle : h.countdown}</h2></div>
      {countdown.isBirthday ? <span className="ed-birthday-wish">{t.birthdayText} ✳</span> : <div className="ed-clock">{(["days", "hours", "minutes", "seconds"] as const).map((unit) => <div key={unit}><strong>{String(countdown[unit]).padStart(2, "0")}</strong><span>{t.time[unit]}</span></div>)}</div>}
    </section>

    <section className="ed-memories" id="memories" aria-labelledby="memories-title">
      <div className="ed-section-top" data-reveal><span className="ed-label">{h.chapter}</span><span className="ed-label">A PERSONAL ARCHIVE / ♡</span></div>
      <div className="ed-memory-intro" data-reveal><h2 id="memories-title">{h.galleryTitle}</h2><div><p>{h.galleryText}</p><button className="ed-text-link" onClick={() => setAlbumIndex(0)}>{h.album}<Arrow diagonal /></button></div></div>
      <div className="ed-memory-grid">
        {[3, 4, 5, 7, 6, 8].map((index, position) => <figure className={`ed-memory ed-memory-${position + 1}`} data-reveal key={index}>
          <button onClick={() => setAlbumIndex(index)} aria-label={`${h.openPhoto}: ${memories[index][language]}`}><Photo index={index} language={language} sizes="(max-width: 700px) 44vw, 30vw" /><span className="ed-image-open"><Arrow diagonal /></span></button>
          <figcaption><span>{String(position + 1).padStart(2, "0")}</span>{memories[index][language]}</figcaption>
        </figure>)}
        <div className="ed-gallery-note" data-reveal><span aria-hidden="true">✳</span><p>{language === "en" ? <>Not just places.<br /><em>Pieces of you.</em></> : <>No solo lugares.<br /><em>Pedacitos de ti.</em></>}</p></div>
      </div>
      <div className="ed-album-footer" data-reveal><span>{String(memories.length).padStart(2, "0")} {h.photoCount} / {h.full}</span><button className="ed-pill ed-pill-light" onClick={() => setAlbumIndex(0)}>{h.album}<span><Arrow diagonal /></span></button></div>
    </section>

    <section className="ed-interlude" aria-label={h.full}>
      <Photo index={1} language={language} sizes="100vw" />
      <div className="ed-interlude-copy" data-reveal><span className="ed-label">A NOTE TO YOU</span><h2>{h.interlude}</h2><span className="ed-signature">♡</span></div>
    </section>

    <section className="ed-getaway" id="getaway" aria-labelledby="getaway-title">
      <div className="ed-section-top" data-reveal><span className="ed-label">{h.gift}</span><span className="ed-label">{t.heroKicker}</span></div>
      <div className="ed-getaway-heading" data-reveal><h2 id="getaway-title">{h.giftTitle}</h2><p>{h.giftText}</p></div>
      <div className="ed-getaway-layout">
        <div className="ed-postcard" data-reveal><Photo index={7} language={language} sizes="(max-width: 700px) 90vw, 38vw" /><div><span className="ed-label">THE NEXT GOOD MEMORY</span><h3>{h.postcard}</h3><p>{h.postcardSub}</p></div><span className="ed-postmark" aria-hidden="true">N. / 20 NOV<br />WITH LOVE</span></div>
        <div className="ed-destination-list" data-reveal aria-busy={choiceLoading}>
          <p className="ed-destination-note">{h.giftNote}<span aria-hidden="true">↙</span></p>
          {savedDestinations.length > 0 && <div className="ed-sealed" role="status" tabIndex={-1} ref={sealedRef}><span>{h.sealed}</span><strong>{savedDestinations.map((destination) => destination.name).join(" · ")} <span aria-hidden="true">♡</span></strong></div>}
          {choiceLoading && <p className="ed-feedback" role="status">{h.loading}</p>}
          {choiceError && <p className="ed-feedback" role="status">{h.loadError} <button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>{h.retry}</button></p>}
          {t.destinations.map((destination, index) => {
            const isSaved = savedDestinations.some((item) => item.value === destination.value);
            const isSelected = selectedDestinations.some((item) => item.value === destination.value);
            const isDisabled = Boolean(choice) || choiceLoading || choiceError || (!isSelected && selectedDestinations.length >= 3);
            return <button key={destination.value} className={`ed-destination ${isSaved || isSelected ? "is-chosen" : ""}`} aria-pressed={isSelected || isSaved} disabled={isDisabled} onClick={() => toggleDestination(destination)}>
              <span className="ed-destination-index">0{index + 1}</span><span className="ed-destination-info"><span className="ed-country">{h.country[index]}</span><strong>{destination.name}</strong><span className="ed-destination-detail">{destination.line}</span></span><span className="ed-destination-go"><span>{isSaved ? t.actions.sealed : choice ? t.actions.closed : isSelected ? h.selectedCount(selectedDestinations.length) : t.actions.choose}</span>{isSaved || isSelected ? "✓" : <Arrow diagonal />}</span>
            </button>;
          })}
          {!choice && !choiceLoading && !choiceError && <div className="ed-choice-bar"><span>{h.selectedCount(selectedDestinations.length)}</span><button className="ed-pill" disabled={selectedDestinations.length !== 3} onClick={() => { setIsConfirmationOpen(true); setPassphrase(""); setSaveError(false); }}>{h.confirmFinalists}<span><Arrow diagonal /></span></button></div>}
          <p className="ed-seal-footnote">{choiceSaved ? t.saved(savedDestinationNames) : selectedDestinations.length === 3 ? `${h.finalists}: ${selectedDestinations.map((destination) => destination.name).join(" · ")}` : h.needThree}</p>
        </div>
      </div>
    </section>

    <section className="ed-mural-invitation" data-reveal><span aria-hidden="true" className="ed-envelope">♡</span><div><span className="ed-label">03 / {language === "en" ? "The love notes" : "Las notas de amor"}</span><h2>{h.mural}</h2><p>{h.muralText}</p></div><button className="ed-round-link" onClick={requestMural} aria-label={h.muralCta}><Arrow diagonal /></button></section>
    <footer className="ed-footer"><div><p>{h.footer}</p><button className="ed-text-link" onClick={() => moveTo("beginning")}>{h.top}<span aria-hidden="true">↑</span></button></div><span className="ed-footer-name" aria-hidden="true">Noemi<span>✳</span></span><div className="ed-footer-bottom"><span>{h.madeFor}</span><span>20 NOVEMBER 2026</span><span>THE BEST IS YET TO COME.</span></div></footer>

    {albumIndex !== null && <Overlay className="ed-album" label={h.full} onClose={() => setAlbumIndex(null)}>
      <div className="ed-album-header"><span>{h.full}</span><span>{String(albumIndex + 1).padStart(2, "0")} / {memories.length}</span><button data-initial-focus onClick={() => setAlbumIndex(null)} aria-label={h.close}>×</button></div>
      <div className="ed-album-stage" onTouchStart={(event) => { event.currentTarget.dataset.touchStart = String(event.touches[0].clientX); }} onTouchEnd={(event) => { const difference = event.changedTouches[0].clientX - Number(event.currentTarget.dataset.touchStart); if (Math.abs(difference) > 60) setAlbumIndex((albumIndex + (difference < 0 ? 1 : -1) + memories.length) % memories.length); }}>
        <button className="ed-album-prev" onClick={() => setAlbumIndex((albumIndex - 1 + memories.length) % memories.length)} aria-label={h.previous}>←</button>
        <Photo key={albumIndex} index={albumIndex} language={language} priority sizes="(max-width: 700px) 95vw, 75vw" />
        <button className="ed-album-next" onClick={() => setAlbumIndex((albumIndex + 1) % memories.length)} aria-label={h.next}>→</button>
      </div>
      <p className="ed-album-caption" aria-live="polite">{memories[albumIndex][language]}</p>
      <div className="ed-album-thumbs">{memories.map((photo, index) => <button key={photo.id} aria-label={`${h.openPhoto} ${index + 1}`} aria-pressed={index === albumIndex} onClick={() => setAlbumIndex(index)}><Photo index={index} language={language} sizes="64px" /></button>)}</div>
    </Overlay>}

    {isConfirmationOpen && <Overlay className="ed-confirmation" label={t.modalKicker} onClose={closeConfirmation} busy={saving}>
      <button className="ed-dialog-close" onClick={closeConfirmation} disabled={saving} aria-label={h.close}>×</button>
      <span className="ed-label">{t.modalKicker}</span><span className="ed-confirm-star" aria-hidden="true">✳</span><h2>{h.finalists}</h2><p>{selectedDestinations.map((destination) => destination.name).join(" · ")}</p><p>{t.modalText}</p>
      <form onSubmit={(event) => { event.preventDefault(); void confirmDestination(); }}><label htmlFor="destination-key">{t.secretLabel}</label><input data-initial-focus id="destination-key" type="password" autoComplete="off" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder={t.secretPlaceholder} disabled={saving} aria-describedby={saveError ? "choice-save-error" : undefined} />{saveError && <p className="ed-form-error" id="choice-save-error" role="alert">{h.saveError}</p>}<button className="ed-pill" disabled={saving || !passphrase.trim()}>{saving ? h.saving : t.saveDestination}<span><Arrow diagonal /></span></button></form>
    </Overlay>}
    {isMuralLockedOpen && <Overlay className="ed-confirmation ed-locked-mural" label={h.notReadyTitle} onClose={() => setIsMuralLockedOpen(false)}>
      <button className="ed-dialog-close" data-initial-focus onClick={() => setIsMuralLockedOpen(false)} aria-label={h.close}>×</button>
      <span className="ed-label">20 NOVEMBER ONLY</span><span className="ed-confirm-star" aria-hidden="true">✳</span><h2>{h.notReadyTitle}</h2><p>{h.notReadyText}</p><button className="ed-pill" onClick={() => setIsMuralLockedOpen(false)}>{h.notReadyCta}<span><Arrow diagonal /></span></button>
    </Overlay>}

    {countdown.isBirthday && <div className="ed-celebration" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}{Array.from({ length: 9 }, (_, index) => <span className="ed-birthday-balloon" key={index} style={{ "--i": index } as CSSProperties} />)}</div>}
  </main>;
}
