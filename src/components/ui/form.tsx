import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  required,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-2 flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft",
        className,
      )}
      {...props}
    >
      {children}
      {required ? <span className="text-clay">*</span> : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
      {error ? <p className="mt-1.5 text-xs text-red-800">{error}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field-base h-11 px-3.5", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("field-base min-h-32 resize-y px-3.5 py-3", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("field-base h-11 px-3", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        className={cn(
          "mt-0.5 size-4 shrink-0 accent-[var(--color-clay)]",
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function FormMessage({
  message,
  tone = "error",
}: {
  message?: string | null;
  tone?: "error" | "success" | "info";
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className={cn(
        "border px-4 py-3 text-sm leading-relaxed",
        tone === "error" && "border-red-900/20 bg-red-900/5 text-red-900",
        tone === "success" && "border-sage/30 bg-sage-light/60 text-sage",
        tone === "info" && "border-line bg-cream text-ink-soft",
      )}
    >
      {message}
    </div>
  );
}
