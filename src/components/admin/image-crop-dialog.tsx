"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ASPECTS = [
  { label: "Wide 4:1", value: 4 },
  { label: "Standard 3:1", value: 3 },
  { label: "Square 1:1", value: 1 },
] as const;

const MAX_ZOOM = 3;

interface Offset {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImageCropDialog({
  src,
  fileName,
  onCancel,
  onCrop,
}: {
  src: string;
  fileName: string;
  onCancel: () => void;
  onCrop: (file: File) => Promise<void>;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<
    { pointerId: number; startX: number; startY: number; offset: Offset } | null
  >(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [aspect, setAspect] = useState<number>(4);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function measure() {
      const maxWidth = Math.min(window.innerWidth - 48, 560);
      const maxHeight = Math.min(window.innerHeight - 320, 520);
      const width = Math.max(220, Math.min(maxWidth, maxHeight * aspect));
      setArea({ width: Math.round(width), height: Math.round(width / aspect) });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [aspect]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const baseScale =
    natural && area.width
      ? Math.max(area.width / natural.width, area.height / natural.height)
      : 1;
  const displayWidth = natural ? natural.width * baseScale * zoom : 0;
  const displayHeight = natural ? natural.height * baseScale * zoom : 0;
  const maxOffsetX = Math.max(0, (displayWidth - area.width) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - area.height) / 2);
  const offsetX = clamp(offset.x, -maxOffsetX, maxOffsetX);
  const offsetY = clamp(offset.y, -maxOffsetY, maxOffsetY);
  const displayLeft = (area.width - displayWidth) / 2 + offsetX;
  const displayTop = (area.height - displayHeight) / 2 + offsetY;

  function chooseAspect(next: number) {
    setAspect(next);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function changeZoom(next: number) {
    const value = clamp(next, 1, MAX_ZOOM);
    if (!natural || !area.width) {
      setZoom(value);
      return;
    }
    const nextWidth = natural.width * baseScale * value;
    const nextHeight = natural.height * baseScale * value;
    const nextMaxX = Math.max(0, (nextWidth - area.width) / 2);
    const nextMaxY = Math.max(0, (nextHeight - area.height) / 2);
    setOffset((current) => ({
      x: clamp(current.x, -nextMaxX, nextMaxX),
      y: clamp(current.y, -nextMaxY, nextMaxY),
    }));
    setZoom(value);
  }

  async function handleSave() {
    if (!natural || !imageRef.current || !area.width) return;
    setSaving(true);
    setError(null);

    try {
      const scale = baseScale * zoom;
      const sourceX = (0 - displayLeft) / scale;
      const sourceY = (0 - displayTop) / scale;
      const sourceWidth = area.width / scale;
      const sourceHeight = area.height / scale;
      const outputWidth = Math.min(1200, Math.max(320, Math.round(sourceWidth)));
      const outputHeight = Math.max(1, Math.round(outputWidth / aspect));

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable in this browser.");

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        imageRef.current,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("The cropped image could not be created.");

      const baseName = fileName.replace(/\.[^.]+$/, "") || "logo";
      await onCrop(
        new File([blob], `${baseName}-cropped.png`, { type: "image/png" }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === "SecurityError"
          ? "This image is hosted elsewhere and blocks cropping. Upload the logo file again to crop it."
          : cause instanceof Error
            ? cause.message
            : "The image could not be cropped. Try another file.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-dialog-title"
        className="relative w-full max-w-[38rem] border border-line bg-cream p-5 shadow-lift sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-clay">Logo</p>
            <h2
              id="crop-dialog-title"
              className="mt-2 font-serif text-2xl font-light tracking-[-0.03em] text-ink"
            >
              Crop your mark
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Drag the image to position it, then use the slider to zoom.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close cropper"
            className="-mr-1 -mt-1 inline-flex size-9 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ASPECTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => chooseAspect(option.value)}
              aria-pressed={aspect === option.value}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                aspect === option.value
                  ? "border-ink bg-ink text-cream"
                  : "border-line text-ink-soft hover:border-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <div
            className="relative touch-none overflow-hidden border border-ink/20 bg-[repeating-conic-gradient(#e7dfd1_0%_25%,#f8f3e9_0%_50%)] bg-[length:18px_18px]"
            style={{ width: area.width, height: area.height, cursor: "grab" }}
            onPointerDown={(event) => {
              if (!natural) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                offset: { x: offsetX, y: offsetY },
              };
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              setOffset({
                x: clamp(
                  drag.offset.x + event.clientX - drag.startX,
                  -maxOffsetX,
                  maxOffsetX,
                ),
                y: clamp(
                  drag.offset.y + event.clientY - drag.startY,
                  -maxOffsetY,
                  maxOffsetY,
                ),
              });
            }}
            onPointerUp={(event) => {
              dragRef.current = null;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- object URLs and fetched logos are cropped locally */}
            <img
              ref={imageRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(event) => {
                setNatural({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              onError={() => setError("The image could not be loaded for cropping.")}
              className="absolute max-w-none select-none"
              style={
                natural
                  ? {
                      width: displayWidth,
                      height: displayHeight,
                      left: displayLeft,
                      top: displayTop,
                    }
                  : {
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                    }
              }
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 border border-cream/70" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            disabled={!natural || saving}
            className="h-1.5 w-full accent-[#a4543a]"
            aria-label="Zoom"
          />
          <span className="w-10 text-right text-[0.65rem] tabular-nums text-muted">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {error ? (
          <p className="mt-3 border border-red-900/20 bg-red-900/5 px-3 py-2 text-xs leading-relaxed text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="border border-line"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={!natural || saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Crop className="size-4" aria-hidden />
            )}
            {saving ? "Preparing" : "Use this crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}
