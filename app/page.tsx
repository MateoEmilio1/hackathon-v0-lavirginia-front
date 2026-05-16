"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import { Reveal, CountUp, Capsule } from "@/components/shared";
import { RECENT_INSPECTIONS, QUEUE, SHIFT, CHARTS, type QueueItem, type RecentInspection } from "@/lib/data";
import { validatePackage } from "@/lib/api";
import type { ValidatorResult } from "@/lib/types";

/* ---------- Scroll progress ---------- */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? h.scrollTop / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="scroll-progress" style={{ transform: `scaleX(${p})` }} />;
}

/* ---------- Jornada helpers ---------- */
function jornadaStatus(now: Date) {
  const start = new Date(now); start.setHours(8, 0, 0, 0);
  const end = new Date(now); end.setHours(16, 0, 0, 0);
  const totalMs = end.getTime() - start.getTime();
  let elapsedMs = now.getTime() - start.getTime();
  let remainMs = end.getTime() - now.getTime();
  let state: "activa" | "antes" | "finalizada" = "activa";
  if (now < start) { state = "antes"; elapsedMs = 0; remainMs = totalMs; }
  else if (now > end) { state = "finalizada"; elapsedMs = totalMs; remainMs = 0; }
  return { state, totalMs, elapsedMs, remainMs, pct: Math.max(0, Math.min(1, elapsedMs / totalMs)) };
}

function fmtHM(ms: number) {
  if (ms <= 0) return "00:00";
  const totalMin = Math.floor(ms / 60000);
  return String(Math.floor(totalMin / 60)).padStart(2, "0") + ":" + String(totalMin % 60).padStart(2, "0");
}

/* ---------- Page head ---------- */
function PageHead() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hora = now?.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "--:--:--";
  const fecha = now?.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) ?? "";
  const j = now ? jornadaStatus(now) : { state: "activa" as const, pct: 0, totalMs: 0, elapsedMs: 0, remainMs: 0 };
  const stateLabel = j.state === "activa" ? "Jornada activa" : j.state === "antes" ? "Jornada por comenzar" : "Jornada finalizada";

  return (
    <section id="resumen" className="page-head">
      <div className="container-x">
        <div className="page-head-inner">
          <div>
            <Reveal>
              <div className="hero-eyebrow">
                <span className="dot" />
                Validación automática · {SHIFT.linea} · {stateLabel}
              </div>
            </Reveal>
            <Reveal delay="1" as="h1">Inspección de cápsulas</Reveal>
            <Reveal delay="2" as="p" className="sub">
              El sistema evalúa automáticamente cada cápsula según los tres ejes
              de calidad de la norma CC-2026. Supervisá el flujo de producción,
              los rechazos y el análisis de la jornada en tiempo real.
            </Reveal>
          </div>
          <Reveal delay="2" className="shift-banner">
            <div className="cell">
              <span className="k">Hora actual</span>
              <span className="v live tabular">{hora}</span>
            </div>
            <div className="cell">
              <span className="k">Fecha</span>
              <span className="v" style={{ textTransform: "capitalize", fontSize: 15 }}>{fecha}</span>
            </div>
            <div className="cell">
              <span className="k">Jornada</span>
              <span className="v tabular">{SHIFT.jornadaInicio} – {SHIFT.jornadaFin}</span>
              <div className="jornada-bar"><i style={{ width: (j.pct * 100).toFixed(1) + "%" }} /></div>
            </div>
            <div className="cell">
              <span className="k">{j.state === "finalizada" ? "Trabajado" : "Restante"}</span>
              <span className="v tabular">{j.state === "finalizada" ? fmtHM(j.elapsedMs) : fmtHM(j.remainMs)} h</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Livecam card ---------- */
function LivecamCard() {
  const [streamUrl, setStreamUrl] = useState("");
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const ts = now?.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "--:--:--";

  const isEmbeddable = (url: string) => /youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?)|\.webm($|\?)/i.test(url);
  const toEmbed = (url: string) => {
    if (/youtu\.be\/([^?&]+)/.test(url)) return "https://www.youtube.com/embed/" + RegExp.$1 + "?autoplay=1&mute=1";
    if (/youtube\.com.*v=([^&]+)/.test(url)) return "https://www.youtube.com/embed/" + RegExp.$1 + "?autoplay=1&mute=1";
    return url;
  };

  return (
    <div className="panel livecam-card">
      <div className="panel-head">
        <h3>Cámara de producción</h3>
        <span className="pill">{SHIFT.linea} · CAM-01</span>
      </div>
      <div className="livecam-frame">
        <div className="livecam-overlay-top">
          <span className="live-tag"><span className="ldot" />{streamUrl ? "EN VIVO" : "Sin señal"}</span>
          <span className="cam-tag">CAM-01 · {SHIFT.linea}</span>
        </div>
        {streamUrl && isEmbeddable(streamUrl) ? (
          /\.mp4|\.webm/i.test(streamUrl)
            ? <video src={streamUrl} autoPlay muted loop playsInline />
            : <iframe src={toEmbed(streamUrl)} allow="autoplay; encrypted-media" allowFullScreen />
        ) : (
          <div className="livecam-empty">
            <span className="cam-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </span>
            <div className="cam-title">Sin transmisión activa</div>
            <div className="cam-sub">Pegá la URL del stream de la cámara para visualizar la línea de producción en vivo.</div>
          </div>
        )}
        <div className="livecam-overlay-bottom">
          <span>● REC · 1080p · 25 fps</span>
          <span className="tabular">{ts}</span>
        </div>
      </div>
      <div className="livecam-controls">
        <input className="livecam-input" placeholder="https://stream.la-virginia.com/linea-a"
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setStreamUrl(draft.trim()); }} />
        {streamUrl
          ? <button className="btn ghost" onClick={() => { setStreamUrl(""); setDraft(""); }}>Desconectar</button>
          : <button className="btn" onClick={() => setStreamUrl(draft.trim())} disabled={!draft.trim()}>Conectar</button>}
      </div>
      <div className="livecam-help">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        Compatible con <b>YouTube/Vimeo</b>, archivos <b>.mp4 / .webm</b> y streams HLS.
      </div>
    </div>
  );
}

/* ---------- Validator helpers ---------- */
type RealVal =
  | { status: "scanning"; filename: string }
  | { status: "done"; item: QueueItem; approved: boolean; duration: number }
  | { status: "error"; message: string };

function mapResultToDisplay(
  result: ValidatorResult,
  filename: string,
  duration: number
): { queueItem: QueueItem; inspection: RecentInspection } {
  const id = "C-" + String(Date.now()).slice(-6);
  const now = new Date();
  const time = now.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const e1: "ok" | "fail" = result.failed_axes.packaging_damage ? "fail" : "ok";
  const e2: "ok" | "fail" = result.failed_axes.capsule_damage ? "fail" : "ok";
  const e3: "ok" | "fail" = result.failed_axes.capsule_disorder ? "fail" : "ok";
  const label = filename.length > 20 ? filename.slice(0, 17) + "…" : filename;
  const reasonLabel = result.reason.replace(/_/g, " ");

  const queueItem: QueueItem = {
    id,
    product: label,
    variety: reasonLabel,
    color: result.approved ? "#3b1c10" : "#7f1d1d",
    axes: {
      eje1: {
        status: e1,
        title: "Empaquetado",
        reading: e1 === "fail" ? "Daño en empaque" : "Empaque íntegro",
        detail: e1 === "fail"
          ? (result.observations[0] ?? "Daño en empaquetado detectado")
          : "Foil íntegro · sin perforaciones",
      },
      eje2: {
        status: e2,
        title: "Cápsula",
        reading: e2 === "fail" ? "Daño en cápsula" : `${(result.confidence * 100).toFixed(0)}% confianza`,
        detail: result.validator_summary.slice(0, 80),
      },
      eje3: {
        status: e3,
        title: "Orden",
        reading: e3 === "fail" ? "Desorden detectado" : "Orden correcto",
        detail: result.secondary_reasons.length > 0
          ? result.secondary_reasons.join(", ")
          : "Sin observaciones adicionales",
      },
    },
  };

  const failedAxis =
    result.failed_axes.packaging_damage ? 1
    : result.failed_axes.capsule_damage ? 2
    : result.failed_axes.capsule_disorder ? 3
    : null;

  const inspection: RecentInspection = {
    n: id,
    time,
    product: label,
    variety: reasonLabel,
    eje1: { status: e1, reading: e1 === "fail" ? "Daño empaque" : "OK" },
    eje2: { status: e2, reading: e2 === "fail" ? "Daño cápsula" : "OK" },
    eje3: { status: e3, reading: e3 === "fail" ? "Desorden" : "OK" },
    status: result.approved ? "ok" : "bad",
    failedAxis,
    detail: result.approved ? null : reasonLabel,
    duration,
  };

  return { queueItem, inspection };
}

/* ---------- Image upload card ---------- */
function ImageUploadCard({
  realVal,
  onFile,
  onReset,
}: {
  realVal: RealVal | null;
  onFile: (f: File) => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function pick(file: File) {
    if (!file.type.match(/^image\/(jpeg|png)$/)) return;
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    onFile(file);
  }

  function reset() {
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    onReset();
  }

  const isScanning = realVal?.status === "scanning";

  return (
    <div className="panel livecam-card">
      <div className="panel-head">
        <h3>Imagen para análisis</h3>
        <span className="pill">
          {!previewUrl ? "Sin imagen"
            : isScanning ? "Procesando…"
            : realVal?.status === "done" ? (realVal.approved ? "APROBADA ✓" : "RECHAZADA ✕")
            : realVal?.status === "error" ? "Error"
            : "Lista"}
        </span>
      </div>
      <div
        className="livecam-frame"
        style={{ cursor: previewUrl ? "default" : "pointer", position: "relative" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
        onClick={() => { if (!previewUrl) inputRef.current?.click(); }}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Imagen analizada" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {isScanning && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(3,78,162,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <svg style={{ animation: "spin 0.9s linear infinite" }} width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" />
                  <path d="M20 4 A16 16 0 0 1 36 20" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.2px" }}>Analizando con IA…</span>
              </div>
            )}
            {realVal?.status === "done" && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: realVal.approved ? "rgba(21,128,61,0.93)" : "rgba(185,28,28,0.93)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26, color: "#fff", fontWeight: 800 }}>{realVal.approved ? "✓" : "✕"}</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>
                    {realVal.approved ? "APROBADA" : "RECHAZADA"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11.5 }}>
                    {realVal.duration.toFixed(2)} s · {realVal.item.variety}
                  </div>
                </div>
              </div>
            )}
            {realVal?.status === "error" && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(120,53,15,0.93)", padding: "12px 16px" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Error de validación</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>{realVal.message.slice(0, 80)}</div>
              </div>
            )}
          </>
        ) : (
          <div className="livecam-empty" style={{ background: dragging ? "var(--bg-2)" : undefined, transition: "background 0.15s", cursor: "pointer" }}>
            <span className="cam-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <div className="cam-title">{dragging ? "Soltá la imagen aquí" : "Subir imagen de cápsula"}</div>
            <div className="cam-sub">
              Arrastrá una imagen acá o hacé clic para seleccionar.<br />
              Formatos: <b>JPG</b> o <b>PNG</b>
            </div>
          </div>
        )}
      </div>
      <div className="livecam-controls">
        {previewUrl && !isScanning ? (
          <>
            <button className="btn" onClick={() => inputRef.current?.click()}>Nueva imagen</button>
            <button className="btn ghost" onClick={reset}>Limpiar</button>
          </>
        ) : (
          <button className="btn" onClick={() => inputRef.current?.click()} disabled={isScanning ?? false}>
            {isScanning ? "Analizando…" : "Seleccionar imagen"}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
      </div>
      <div className="livecam-help">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        El backend analiza la imagen en <b>3 ejes de calidad</b> usando visión por IA multimodal.
      </div>
    </div>
  );
}

/* ---------- Inspection panel ---------- */
function InspectionPanel({ onNewInspection }: { onNewInspection: (i: RecentInspection) => void }) {
  const [realVal, setRealVal] = useState<RealVal | null>(null);
  const [queueIdx, setQueueIdx] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "result">("scanning");
  const [elapsed, setElapsed] = useState(0);
  const [hasEverValidated, setHasEverValidated] = useState(false);

  async function handleFile(file: File) {
    const startedAt = performance.now();
    setRealVal({ status: "scanning", filename: file.name });
    try {
      const result = await validatePackage(file);
      const duration = (performance.now() - startedAt) / 1000;
      const { queueItem, inspection } = mapResultToDisplay(result, file.name, duration);
      setRealVal({ status: "done", item: queueItem, approved: result.approved, duration });
      setHasEverValidated(true);
      onNewInspection(inspection);
    } catch (err) {
      setHasEverValidated(true);
      setRealVal({ status: "error", message: err instanceof Error ? err.message : "Error al validar" });
    }
  }

  const isWaiting = realVal === null && !hasEverValidated;

  const demoItem = QUEUE[queueIdx % QUEUE.length];
  const waitingItem: QueueItem = {
    id: "—",
    product: "Sin imagen cargada",
    variety: "Esperando validación",
    color: "#334155",
    axes: {
      eje1: { status: "ok", title: "Empaquetado", reading: "En espera", detail: "Subí una imagen para iniciar el análisis" },
      eje2: { status: "ok", title: "Cápsula",     reading: "En espera", detail: "El sistema analizará en 3 ejes de calidad" },
      eje3: { status: "ok", title: "Orden",       reading: "En espera", detail: "Resultado disponible tras la validación" },
    },
  };
  const scanningItem: QueueItem = {
    id: "Procesando…",
    product: realVal?.status === "scanning" ? (realVal.filename.length > 20 ? realVal.filename.slice(0, 17) + "…" : realVal.filename) : "—",
    variety: "Validando imagen con IA",
    color: "#334155",
    axes: {
      eje1: { status: "ok", title: "Empaquetado", reading: "Analizando…", detail: "Evaluando estado del empaque" },
      eje2: { status: "ok", title: "Cápsula",     reading: "Analizando…", detail: "Evaluando estado de la cápsula" },
      eje3: { status: "ok", title: "Orden",       reading: "Analizando…", detail: "Evaluando orden de las cápsulas" },
    },
  };
  const current =
    realVal?.status === "done" ? realVal.item
    : realVal?.status === "scanning" ? scanningItem
    : isWaiting ? waitingItem
    : demoItem;
  const allAxes = ["eje1", "eje2", "eje3"] as const;
  const allOk = allAxes.every(k => current.axes[k].status === "ok");
  const failedAxis = allAxes.findIndex(k => current.axes[k].status === "fail") + 1;
  const displayPhase: "scanning" | "result" =
    isWaiting ? "result"
    : realVal === null ? phase
    : realVal.status === "scanning" ? "scanning"
    : "result";
  const displayElapsed = realVal?.status === "done" ? realVal.duration : elapsed;

  const CYCLE_SCAN = 1200;
  const CYCLE_TOTAL = 4500;

  useEffect(() => {
    if (realVal !== null || !hasEverValidated) return;
    setPhase("scanning");
    setElapsed(0);
    const t1 = setTimeout(() => setPhase("result"), CYCLE_SCAN);
    const t2 = setTimeout(() => setQueueIdx(i => (i + 1) % QUEUE.length), CYCLE_TOTAL);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [queueIdx, realVal, hasEverValidated]);

  useEffect(() => {
    const t0 = performance.now();
    const t = setInterval(() => setElapsed((performance.now() - t0) / 1000), 50);
    return () => clearInterval(t);
  }, [queueIdx]);

  const countdownPct = Math.min(1, elapsed * 1000 / CYCLE_TOTAL);

  return (
    <section id="validacion" className="section" style={{ paddingTop: 60 }}>
      <div className="container-x">
        <Reveal><div className="section-eyebrow">Estación de validación</div></Reveal>
        <div className="section-header">
          <div>
            <Reveal delay="1" as="h2" className="section-title">Validación automática en 3 ejes</Reveal>
            <Reveal delay="2" as="p" className="section-sub">
              El sistema de visión y sensores evalúa cada cápsula en menos de medio segundo
              y resuelve si aprueba o se rechaza según los datos recibidos del backend.
            </Reveal>
          </div>
        </div>
        <div className="inspect-grid">
          <Reveal className="inspect-card panel">
            <div className="panel-head">
              <h3>Cápsula en análisis</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="pill">{isWaiting ? "Sin imagen" : `${QUEUE.length - (queueIdx % QUEUE.length)} cápsulas en cola`}</span>
                {realVal?.status === "done" && (
                  <button
                    className="btn ghost"
                    style={{ padding: "4px 12px", fontSize: 12.5 }}
                    onClick={() => setRealVal(null)}
                  >
                    Demo
                  </button>
                )}
              </div>
            </div>
            <div className="inspect-stack" key={current.id}>
              <div className="inspect-top">
                <div className="inspect-vis" style={{ minHeight: 180 }}>
                  <span className="pulse-ring" />
                  <Capsule color={current.color} size={150} label="LV" />
                </div>
                <div className="inspect-id-block">
                  <div className="row1">
                    <span className="pill">Producto</span>
                    <span className="product">{current.product}</span>
                  </div>
                  <div className="cap-id">{current.id}</div>
                  <div className="variety">{current.variety}</div>
                </div>
                <div className={"verdict-badge " + (isWaiting ? "scanning" : displayPhase === "scanning" ? "scanning" : allOk ? "ok" : "bad")}>
                  <div className="v-label">
                    {isWaiting ? "Sin imagen"
                      : displayPhase === "scanning" ? "Evaluando"
                      : realVal?.status === "error" ? "Error de validación"
                      : "Resultado automático"}
                  </div>
                  <div className="v-value">
                    <span className="vicon">
                      {isWaiting ? "—"
                        : displayPhase === "scanning" ? "…"
                        : realVal?.status === "error" ? "!"
                        : allOk ? "✓" : "✕"}
                    </span>
                    {isWaiting ? "EN ESPERA"
                      : displayPhase === "scanning" ? "Analizando…"
                      : realVal?.status === "error" ? "ERROR"
                      : allOk ? "APROBADA" : "RECHAZADA"}
                  </div>
                  <div className="v-sub">
                    {isWaiting
                      ? "Subí una imagen para comenzar el análisis"
                      : displayPhase === "scanning"
                        ? (realVal?.status === "scanning" ? `Procesando ${realVal.filename}` : "Lectura de los 3 ejes")
                        : realVal?.status === "error" ? realVal.message.slice(0, 60)
                        : allOk
                          ? "Cumple CC-2026 · " + displayElapsed.toFixed(2) + " s"
                          : "Falla en Eje " + failedAxis + " · " + displayElapsed.toFixed(2) + " s"}
                  </div>
                </div>
              </div>
              <div className="axes-grid">
                {allAxes.map((axKey, i) => {
                  const ax = current.axes[axKey];
                  const axState = isWaiting ? "scanning" : displayPhase === "scanning" ? "scanning" : ax.status;
                  return (
                    <div key={axKey} className={"axis " + axState} data-i={i}>
                      <div className="axis-head">
                        <span className="axis-code">EJE {i + 1}</span>
                        <span className="axis-icon">{displayPhase === "scanning" ? "" : ax.status === "ok" ? "✓" : "✕"}</span>
                      </div>
                      <div className="axis-title">
                        {ax.title === "Empaquetado" ? "Rotura del empaquetado"
                          : ax.title === "Cápsula" ? "Rotura de la cápsula"
                          : "Desorden de cápsulas"}
                      </div>
                      <div className="axis-reading">{isWaiting ? "En espera" : displayPhase === "scanning" ? "Midiendo…" : ax.reading}</div>
                      <div className="axis-detail">{isWaiting ? "Cargá una imagen para analizar" : displayPhase === "scanning" ? "Recibiendo lectura del backend…" : ax.detail}</div>
                    </div>
                  );
                })}
              </div>
              <div className="inspect-foot">
                {isWaiting ? (
                  <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                    Subí una imagen en el panel derecho para iniciar la validación
                  </span>
                ) : realVal === null ? (
                  <>
                    <span>Próxima cápsula en <strong>{Math.max(0, (CYCLE_TOTAL / 1000 - elapsed)).toFixed(1)} s</strong></span>
                    <div className="countdown-bar"><i style={{ transform: `scaleX(${countdownPct})` }} /></div>
                    <span>Cola: <strong>{QUEUE.length - (queueIdx % QUEUE.length)}</strong> · Cápsula <strong>#{1144 + (queueIdx % QUEUE.length)}</strong></span>
                  </>
                ) : (
                  <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                    {realVal.status === "scanning"
                      ? `Analizando: ${realVal.filename}…`
                      : realVal.status === "done"
                        ? `Validado en ${realVal.duration.toFixed(2)} s · imagen real`
                        : `Error: ${realVal.message}`}
                  </span>
                )}
              </div>
            </div>
          </Reveal>
          <Reveal delay="1">
            <ImageUploadCard
              realVal={realVal}
              onFile={handleFile}
              onReset={() => setRealVal(null)}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Recent inspections ---------- */
function AxCell({ ax }: { ax: { status: string; reading: string } }) {
  return (
    <span className={"ax-cell " + ax.status}>
      <span className="ic">{ax.status === "ok" ? "✓" : "✕"}</span>
      {ax.reading}
    </span>
  );
}

function RecentInspectionsSection({ inspections }: { inspections: RecentInspection[] }) {
  const okCount = inspections.filter(r => r.status === "ok").length;
  const badCount = inspections.length - okCount;
  const avgDuration = inspections.length > 0
    ? (inspections.reduce((s, r) => s + r.duration, 0) / inspections.length).toFixed(2)
    : "0.00";

  return (
    <section id="recientes" className="section" style={{ paddingTop: 24 }}>
      <div className="container-x">
        <Reveal className="panel">
          <div className="panel-head">
            <h3>Inspecciones recientes</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                <strong style={{ color: "var(--ink)" }}>{inspections.length}</strong> registros ·
                <span style={{ color: "var(--ok)", marginLeft: 6 }}><strong>{okCount}</strong> aprobadas</span> ·
                <span style={{ color: "var(--bad)", marginLeft: 6 }}><strong>{badCount}</strong> rechazadas</span> ·
                tiempo medio <strong style={{ color: "var(--ink)" }}>{avgDuration} s</strong>
              </span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="lot-table expanded">
              <thead>
                <tr>
                  <th>Cápsula</th><th>Hora</th><th>Producto</th><th>Variedad</th>
                  <th className="axis-h">Eje 1 · Empaquetado</th>
                  <th className="axis-h">Eje 2 · Cápsula</th>
                  <th className="axis-h">Eje 3 · Orden</th>
                  <th>Resultado</th><th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map(r => (
                  <tr key={r.n} className={r.status === "bad" ? "row-bad" : ""}>
                    <td className="lot-id">{r.n}</td>
                    <td className="time">{r.time}</td>
                    <td className="lot-id" style={{ fontWeight: 500 }}>{r.product}</td>
                    <td className="variant">{r.variety}</td>
                    <td className="axis-c"><AxCell ax={r.eje1} /></td>
                    <td className="axis-c"><AxCell ax={r.eje2} /></td>
                    <td className="axis-c"><AxCell ax={r.eje3} /></td>
                    <td>
                      <span className={"result-pill " + (r.status === "ok" ? "ok" : "bad")}>
                        <span className="rdot">{r.status === "ok" ? "✓" : "✕"}</span>
                        {r.status === "ok" ? "APROBADA" : "RECHAZADA"}
                      </span>
                    </td>
                    <td className="dur">{r.duration.toFixed(2)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Charts ---------- */
function DonutChart() {
  const { aprobadas, rechazadas, pct } = CHARTS.approval;
  const total = aprobadas + rechazadas;
  const r = 56, c = 2 * Math.PI * r;
  const dashOk = (aprobadas / total) * c;
  const dashBad = (rechazadas / total) * c;
  return (
    <>
      <div className="chart-head">
        <div><div className="chart-title">Aprobación general</div><div className="chart-sub">Cápsulas analizadas en la jornada</div></div>
        <span className="chart-source">3 ejes</span>
      </div>
      <div className="chart-stage">
        <div className="donut-wrap">
          <svg className="donut-svg" width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="18" />
            <g transform="rotate(-90 75 75)">
              <circle cx="75" cy="75" r={r} fill="none" stroke="#15803d" strokeWidth="18"
                strokeDasharray={`${dashOk} ${c - dashOk}`} strokeLinecap="butt">
                <animate attributeName="stroke-dasharray" from={`0 ${c}`} to={`${dashOk} ${c - dashOk}`} dur="1s" fill="freeze" />
              </circle>
              <circle cx="75" cy="75" r={r} fill="none" stroke="#b91c1c" strokeWidth="18"
                strokeDasharray={`${dashBad} ${c - dashBad}`} strokeDashoffset={-dashOk}>
                <animate attributeName="stroke-dasharray" from={`0 ${c}`} to={`${dashBad} ${c - dashBad}`} dur="1s" begin=".4s" fill="freeze" />
              </circle>
            </g>
            <text x="75" y="74" textAnchor="middle" dominantBaseline="central" fontFamily="Manrope" fontWeight="800" fontSize="26" fill="#0b1a2d" letterSpacing="-1">{pct.toFixed(1)}%</text>
            <text x="75" y="94" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#5a6a82">aprobación</text>
          </svg>
          <div className="donut-legend">
            <div className="l"><span className="ll"><span className="sw" style={{ background: "#15803d" }} />Aprobadas</span><span><span className="val tabular"><CountUp to={aprobadas} /></span><span className="sub">cáps.</span></span></div>
            <div className="l"><span className="ll"><span className="sw" style={{ background: "#b91c1c" }} />Rechazadas</span><span><span className="val tabular"><CountUp to={rechazadas} /></span><span className="sub">cáps.</span></span></div>
            <div className="l"><span className="ll" style={{ color: "var(--ink-3)" }}>Total analizadas</span><span><span className="val tabular"><CountUp to={total} /></span><span className="sub">cáps.</span></span></div>
          </div>
        </div>
      </div>
    </>
  );
}

function AxisBarsChart() {
  const max = Math.max(...CHARTS.byAxis.map(x => x.value));
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setReady(true); io.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div className="chart-head"><div><div className="chart-title">Rechazos por eje</div><div className="chart-sub">Distribución de fallas en la jornada</div></div><span className="chart-source">3 ejes</span></div>
      <div className="chart-stage" ref={ref}>
        <div className="bars-v">
          {CHARTS.byAxis.map((b, i) => (
            <div className="bar-v" key={b.axis}>
              <div className="b-val tabular"><CountUp to={b.value} /></div>
              <div className="b-track">
                <div className="b-fill" style={{ background: b.color, height: ready ? ((b.value / max) * 100) + "%" : "0%", transitionDelay: (i * 120) + "ms" }} />
              </div>
              <div className="b-lab"><strong>Eje {b.axis}</strong>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-legend"><span style={{ color: "var(--ink-3)" }}>Total rechazos: <strong>{CHARTS.byAxis.reduce((s, x) => s + x.value, 0)}</strong> cápsulas</span></div>
    </>
  );
}

function TopDefectsChart() {
  const max = Math.max(...CHARTS.topDefects.map(d => d.count));
  const axisColors: Record<number, string> = { 1: "#b91c1c", 2: "#b45309", 3: "#0860c2" };
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setReady(true); io.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div className="chart-head"><div><div className="chart-title">Top defectos detectados</div><div className="chart-sub">Tipos de falla específicos · jornada</div></div><span className="chart-source">3 ejes</span></div>
      <div className="chart-stage" ref={ref}>
        <div className="bars-h">
          {CHARTS.topDefects.map((d, i) => (
            <div className="bar-h" key={d.code}>
              <span className="b-rank">{d.code}</span>
              <div className="b-mid">
                <span className="b-name">{d.name}</span>
                <div className="b-track"><div className="b-fill" style={{ width: ready ? ((d.count / max) * 100) + "%" : "0%", background: axisColors[d.axis], transitionDelay: (i * 60) + "ms" }} /></div>
              </div>
              <span className="b-val tabular">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span className="li"><span className="sw sq" style={{ background: "#b91c1c" }} />Eje 1 <strong>Empaquetado</strong></span>
        <span className="li"><span className="sw sq" style={{ background: "#b45309" }} />Eje 2 <strong>Cápsula</strong></span>
        <span className="li"><span className="sw sq" style={{ background: "#0860c2" }} />Eje 3 <strong>Orden</strong></span>
      </div>
    </>
  );
}

function HourlyChart() {
  const data = CHARTS.byHour;
  const W = 1000, H = 260, PAD = { l: 44, r: 24, t: 24, b: 38 };
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => d.total)) + 2;
  const xStep = innerW / (data.length - 1);
  const x = (i: number) => PAD.l + i * xStep;
  const y = (v: number) => PAD.t + innerH - (v / maxVal) * innerH;
  const totalPath = data.map((d, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(d.total)).join(" ");
  const totalArea = totalPath + ` L ${x(data.length - 1)} ${PAD.t + innerH} L ${x(0)} ${PAD.t + innerH} Z`;
  const lineFor = (key: "e1" | "e2" | "e3") => data.map((d, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(d[key])).join(" ");
  return (
    <>
      <div className="chart-head"><div><div className="chart-title">Rechazos por hora · jornada 08:00 – 16:00</div><div className="chart-sub">Evolución a lo largo del turno, separado por eje</div></div><span className="chart-source">3 ejes</span></div>
      <div className="chart-stage" style={{ flexDirection: "column" }}>
        <svg className="line-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs><linearGradient id="areaTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#034ea2" stopOpacity=".18" /><stop offset="100%" stopColor="#034ea2" stopOpacity="0" /></linearGradient></defs>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const v = Math.round(maxVal * (1 - p));
            return <g key={i}><line className="grid-line" x1={PAD.l} y1={PAD.t + innerH * p} x2={W - PAD.r} y2={PAD.t + innerH * p} /><text className="axis-label" x={PAD.l - 8} y={PAD.t + innerH * p + 4} textAnchor="end">{v}</text></g>;
          })}
          {data.map((d, i) => <text key={i} className="axis-label" x={x(i)} y={H - PAD.b + 16} textAnchor="middle">{d.h}:00</text>)}
          <path d={totalArea} fill="url(#areaTotal)" />
          <path d={lineFor("e1")} fill="none" stroke="#b91c1c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={lineFor("e2")} fill="none" stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={lineFor("e3")} fill="none" stroke="#0860c2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={totalPath} fill="none" stroke="#034ea2" strokeWidth="2.6" strokeDasharray="5 4" strokeLinecap="round" />
          {data.map((d, i) => <g key={i}><circle cx={x(i)} cy={y(d.total)} r="4" fill="#fff" stroke="#034ea2" strokeWidth="2" /><text x={x(i)} y={y(d.total) - 10} textAnchor="middle" fontFamily="Manrope" fontWeight="700" fontSize="11" fill="#0b1a2d">{d.total}</text></g>)}
        </svg>
        <div className="chart-legend">
          <span className="li"><span className="sw" style={{ background: "#b91c1c" }} />Eje 1 <strong>Empaquetado</strong></span>
          <span className="li"><span className="sw" style={{ background: "#b45309" }} />Eje 2 <strong>Cápsula</strong></span>
          <span className="li"><span className="sw" style={{ background: "#0860c2" }} />Eje 3 <strong>Orden</strong></span>
          <span className="li"><span className="sw" style={{ background: "#034ea2" }} />Total <strong>rechazos/h</strong></span>
        </div>
      </div>
    </>
  );
}

function ChartsSection() {
  return (
    <section id="graficos" className="charts-section">
      <div className="container-x">
        <Reveal><div className="section-eyebrow">Análisis de la jornada</div></Reveal>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div>
            <Reveal delay="1" as="h2" className="section-title">Gráficos de validación</Reveal>
            <Reveal delay="2" as="p" className="section-sub">Resumen visual del comportamiento de la jornada 08:00–16:00.</Reveal>
          </div>
        </div>
        <div className="charts-grid">
          <Reveal className="chart-card"><DonutChart /></Reveal>
          <Reveal className="chart-card" delay="1"><AxisBarsChart /></Reveal>
          <Reveal className="chart-card" delay="2"><TopDefectsChart /></Reveal>
          <Reveal className="chart-card span-full" delay="3"><HourlyChart /></Reveal>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="app-foot">
      <div className="container-x">
        <div className="row">
          <div>© {new Date().getFullYear()} Establecimiento Las Marías · <strong style={{ color: "var(--ink)" }}>La Virginia</strong> · Panel de validación automática</div>
          <div className="links">
            <a href="#">Manual CC-2026</a>
            <a href="#">Soporte técnico</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- App ---------- */
export default function Home() {
  const [active, setActive] = useState("resumen");
  const [inspections, setInspections] = useState<RecentInspection[]>(RECENT_INSPECTIONS);

  function handleNewInspection(inspection: RecentInspection) {
    setInspections(prev => [inspection, ...prev]);
  }

  useEffect(() => {
    const sections = ["resumen", "validacion", "recientes", "graficos"];
    const onScroll = () => {
      let best = "resumen", bestDist = Infinity;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - 120);
        if (rect.top < window.innerHeight * 0.6 && dist < bestDist) { bestDist = dist; best = id; }
      }
      setActive(best);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <ScrollProgress />
      <Header active={active} setActive={setActive} />
      <PageHead />
      <InspectionPanel onNewInspection={handleNewInspection} />
      <RecentInspectionsSection inspections={inspections} />
      <ChartsSection />
      <Footer />
    </>
  );
}
