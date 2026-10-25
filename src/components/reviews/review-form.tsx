"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Star, X } from "lucide-react";
import { submitReviewAction } from "@/lib/actions/reviews";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { cn } from "@/lib/utils";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReviewForm({
  token,
  productId,
  productSlug,
  defaultName,
}: {
  token: string;
  productId: string;
  productSlug?: string;
  defaultName: string;
}) {
  const [state, formAction] = useActionState(submitReviewAction, INITIAL_FORM_STATE);
  const [rating, setRating] = useState(5);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function syncPreviews(files: File[]) {
    setPreviews(files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })));
  }

  function handleFiles(selected: FileList | null) {
    const input = fileInput.current;
    if (!input || !selected) return;

    const files = Array.from(selected).slice(0, 4);
    if (selected.length > 4) {
      const transfer = new DataTransfer();
      files.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
    }
    syncPreviews(files);
  }

  function removePhoto(index: number) {
    const input = fileInput.current;
    if (!input?.files) return;
    const transfer = new DataTransfer();
    Array.from(input.files).forEach((file, position) => {
      if (position !== index) transfer.items.add(file);
    });
    input.files = transfer.files;
    syncPreviews(Array.from(transfer.files));
  }

  if (state.status === "success") {
    return (
      <div className="space-y-3">
        <FormMessage message={state.message ?? "Thank you for your review."} tone="success" />
        {productSlug ? (
          <Link
            href={`/shop/${productSlug}`}
            className="link-underline inline-flex text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
          >
            See it on the product page
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="productId" value={productId} />

      {state.status === "error" ? <FormMessage message={state.message} /> : null}

      <fieldset>
        <legend className="mb-2 flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Your rating <span className="text-clay">*</span>
        </legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer p-0.5 transition-transform hover:scale-105 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-clay"
              title={`${value} ${value === 1 ? "star" : "stars"}`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
                aria-label={`${value} out of 5 stars`}
              />
              <Star
                aria-hidden
                strokeWidth={1.5}
                className={cn(
                  "size-7 transition-colors",
                  value <= rating ? "fill-clay text-clay" : "text-line",
                )}
              />
            </label>
          ))}
          <span className="ml-2 text-xs text-muted">{rating} of 5</span>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Name shown with your review"
          htmlFor={`review-name-${productId}`}
          required
        >
          <Input
            id={`review-name-${productId}`}
            name="reviewerName"
            defaultValue={defaultName}
            maxLength={60}
            required
          />
        </Field>
        <Field
          label="Title"
          htmlFor={`review-title-${productId}`}
          hint="Optional — a few words that sum it up."
        >
          <Input
            id={`review-title-${productId}`}
            name="title"
            maxLength={100}
            placeholder="Soft, well made, worth it"
          />
        </Field>
      </div>

      <Field label="Your review" htmlFor={`review-body-${productId}`} required>
        <Textarea
          id={`review-body-${productId}`}
          name="body"
          rows={4}
          minLength={10}
          maxLength={2000}
          required
          placeholder="How does it feel, how did you style it, and would you recommend it?"
        />
      </Field>

      <div>
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Product photos
        </p>
        <input
          ref={fileInput}
          id={`review-photos-${productId}`}
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
          className="sr-only"
        />
        {previews.length ? (
          <div className="grid grid-cols-4 gap-2">
            {previews.map((preview, index) => (
              <div
                key={`${preview.url}-${index}`}
                className="group relative aspect-square overflow-hidden border border-line bg-sand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-ink/70 text-cream transition-colors hover:bg-ink"
                  aria-label={`Remove ${preview.name}`}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </div>
            ))}
            {previews.length < 4 ? (
              <label
                htmlFor={`review-photos-${productId}`}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-paper/60 text-muted transition-colors hover:border-clay hover:text-clay"
              >
                <Camera className="size-5" aria-hidden />
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.1em]">
                  Add
                </span>
              </label>
            ) : null}
          </div>
        ) : (
          <label
            htmlFor={`review-photos-${productId}`}
            className="flex cursor-pointer items-center gap-3 border border-dashed border-line bg-paper/60 px-4 py-3 text-sm text-ink-soft transition-colors hover:border-clay hover:text-clay"
          >
            <Camera className="size-5 shrink-0" aria-hidden />
            <span>
              Add up to 4 photos
              <span className="mt-0.5 block text-xs text-muted">
                JPEG, PNG, WebP, GIF or AVIF · 4 MB each
              </span>
            </span>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <SubmitButton variant="clay" pendingLabel="Sharing review">
          Publish review
        </SubmitButton>
        <p className="text-xs leading-relaxed text-muted">
          Your review appears with your name, rating and photos.
        </p>
      </div>
    </form>
  );
}
