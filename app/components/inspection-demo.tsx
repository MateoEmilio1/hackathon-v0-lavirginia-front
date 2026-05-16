"use client";

import { startTransition, useEffect, useRef, useState } from "react";

interface ValidationResponse {
  decision?: string;
  approved?: boolean;
  confidence?: number;
  reason?: string;
  secondary_reasons?: string[];
  observations?: string[];
  validator_summary?: string;
  failed_axes?: {
    capsule_damage?: boolean;
    capsule_disorder?: boolean;
    packaging_damage?: boolean;
  };
  image_quality?: string;
  message?: string;
}

function formatConfidence(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "sin dato";
  }
  return `${Math.round(value * 100)}%`;
}

export function InspectionDemo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Elegí una foto o abrí la cámara para validar la caja.",
  );
  const [result, setResult] = useState<ValidationResponse | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [previewUrl]);

  function replacePreview(file: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  }

  async function startCamera() {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraActive(true);
      setStatusMessage("Cámara activa. Centrá la caja y capturá la foto.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo abrir la cámara";
      setStatusMessage(message);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }

  function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    replacePreview(file);
    setStatusMessage(`Archivo listo para validar: ${file.name}`);
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isCameraActive) {
      setStatusMessage("Primero abrí la cámara.");
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      setStatusMessage("No se pudo preparar la captura.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setStatusMessage("No se pudo generar la imagen.");
      return;
    }

    const file = new File([blob], `capture-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    replacePreview(file);
    setStatusMessage("Captura lista para validar.");
    stopCamera();
  }

  async function submitImage(file: File | null) {
    if (!file) {
      setStatusMessage("Seleccioná o capturá una imagen primero.");
      return;
    }

    setIsSubmitting(true);
    startTransition(() => {
      setResult(null);
      setStatusMessage("Enviando imagen al backend...");
    });

    try {
      const formData = new FormData();
      formData.append("image", file, file.name);

      const response = await fetch("/api/inspect", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ValidationResponse;
      setResult(payload);

      if (response.ok) {
        setStatusMessage("Validación completa.");
      } else {
        setStatusMessage(payload.message ?? "La validación devolvió un error.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado enviando la imagen";
      setStatusMessage(message);
      setResult({
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[28px] border border-white/45 bg-white/80 p-6 shadow-[0_24px_80px_rgba(84,53,20,0.18)] backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-800/75">
              Demo Hackathon
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
              Validador visual de cajas La Virginia
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Subí una foto o usá la cámara. El front manda la imagen a
              <code className="mx-1 rounded bg-stone-900 px-1.5 py-0.5 text-stone-100">
                /api/inspect
              </code>
              y Next la reenvía al backend sin exponer la API key al navegador.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-950">
            Estado: {statusMessage}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[24px] border border-stone-200 bg-stone-950 p-4 text-stone-100">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-[4/3] w-full rounded-[18px] bg-stone-900 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startCamera}
                className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
              >
                Abrir cámara
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraActive}
                className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Capturar foto
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-[#fff9ef] p-4">
            <div className="rounded-[20px] border border-dashed border-amber-300 bg-white p-4">
              <label className="block text-sm font-semibold text-stone-800">
                Subir foto manualmente
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="mt-3 block w-full cursor-pointer text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-amber-500"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0] ?? null)
                }
              />
              <p className="mt-3 text-sm leading-6 text-stone-500">
                Si probás desde celular, también podés usar la cámara nativa del
                input.
              </p>
            </div>

            <div className="mt-4 rounded-[20px] bg-stone-100 p-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Vista previa de la caja"
                  className="aspect-[4/3] w-full rounded-[16px] object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-[16px] border border-dashed border-stone-300 text-sm text-stone-500">
                  La vista previa aparece acá
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => submitImage(selectedFile)}
              disabled={!selectedFile || isSubmitting}
              className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Validando..." : "Validar imagen"}
            </button>
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <section className="rounded-[28px] border border-white/45 bg-white/78 p-6 shadow-[0_24px_80px_rgba(84,53,20,0.12)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Resultado
          </p>
          <div className="mt-4 rounded-[24px] bg-stone-950 p-5 text-stone-100">
            <p className="text-sm text-stone-400">Decisión</p>
            <p className="mt-2 text-3xl font-semibold">
              {result?.decision ?? "Esperando imagen"}
            </p>
            <p className="mt-4 text-sm text-stone-400">Confianza</p>
            <p className="mt-2 text-xl font-medium">
              {formatConfidence(result?.confidence)}
            </p>
            <p className="mt-4 text-sm text-stone-400">Motivo principal</p>
            <p className="mt-2 text-base text-stone-100">
              {result?.reason ?? result?.message ?? "Todavía sin resultado"}
            </p>
          </div>

          <div className="mt-4 rounded-[24px] bg-[#fff8e8] p-5 text-sm leading-6 text-stone-700">
            <p className="font-semibold text-stone-900">Resumen</p>
            <p className="mt-2">
              {result?.validator_summary ??
                "Cuando envíes una imagen, acá aparece el resumen del backend."}
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/45 bg-white/78 p-6 shadow-[0_24px_80px_rgba(84,53,20,0.12)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            JSON crudo
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[24px] bg-stone-950 p-4 text-xs leading-6 text-stone-100">
            {JSON.stringify(result, null, 2) || "null"}
          </pre>
        </section>
      </aside>
    </div>
  );
}
