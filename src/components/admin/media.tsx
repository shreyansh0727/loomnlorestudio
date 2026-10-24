"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { uploadMediaAction } from "@/lib/actions/admin/catalog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

function acceptFor(kind: "image" | "media") {
  return kind === "image"
    ? "image/jpeg,image/png,image/webp,image/avif,image/gif"
    : "image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm";
}

async function uploadFile(file: File, folder: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);
  return uploadMediaAction(formData);
}

export function MediaUrlField({
  label,
  value,
  onChange,
  folder,
  kind = "image",
  hint,
  placeholder = "https://… or upload a file",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: string;
  kind?: "image" | "media";
  hint?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const result = await uploadFile(file, folder);
    setUploading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange(result.url);
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <div className="flex shrink-0 gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={acceptFor(kind)}
            className="hidden"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-11 px-4"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-3.5" aria-hidden />
            )}
            {uploading ? "Uploading" : "Upload"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 px-3"
              onClick={() => onChange("")}
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <X className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-red-800">{error}</p> : null}
      {value ? (
        <div className="relative mt-3 aspect-[16/9] w-full max-w-sm overflow-hidden border border-line bg-sand">
          {isVideo && kind === "media" ? (
            <video
              src={value}
              muted
              playsInline
              className="size-full object-cover"
              aria-label={`${label} preview`}
            />
          ) : (
            <SafeImage src={value} alt={`${label} preview`} sizes="360px" />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ImageListEditor({
  value,
  onChange,
  folder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  folder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  function addUrl() {
    const next = urlDraft.trim();
    if (!next) return;
    if (!next.startsWith("/") && !/^https?:\/\//i.test(next)) {
      setError("Use a full https:// URL or a path starting with /.");
      return;
    }
    setError(null);
    onChange([...value, next]);
    setUrlDraft("");
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, 10 - value.length)) {
      const result = await uploadFile(file, folder);
      if (!result.ok) {
        setError(result.message);
        break;
      }
      uploaded.push(result.url);
    }
    setUploading(false);
    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label className="mb-0">Product images</Label>
        <span className="text-[0.62rem] text-muted">{value.length} / 10</span>
      </div>

      {value.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group relative aspect-square overflow-hidden border border-line bg-sand"
            >
              <SafeImage src={src} alt={`Product image ${index + 1}`} sizes="200px" />
              {index === 0 ? (
                <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-cream">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, position) => position !== index))}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-ink/75 text-cream transition-colors hover:bg-red-900"
              >
                <X className="size-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex min-h-28 items-center justify-center border border-dashed border-line bg-paper/60 text-center">
          <div className="px-4 py-6">
            <ImagePlus className="mx-auto size-5 text-clay" aria-hidden />
            <p className="mt-2 text-xs text-muted">No images yet. Upload a cover image first.</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type="file"
          accept={acceptFor("image")}
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || value.length >= 10}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-3.5" aria-hidden />
          )}
          {uploading ? "Uploading" : "Upload images"}
        </Button>
        <div className="flex flex-1 gap-2">
          <Input
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="Paste an image URL"
            className="h-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 border border-line px-3"
            onClick={addUrl}
            disabled={value.length >= 10}
          >
            Add
          </Button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-800">{error}</p> : null}
      <p className={cn("mt-2 text-[0.65rem] text-muted", !error && "block")}>
        JPG, PNG, WebP, AVIF or GIF up to 15 MB. The first image is used on cards.
      </p>
    </div>
  );
}
