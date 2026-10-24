"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/form";

export function PasswordInput({
  id,
  name,
  autoComplete,
  minLength,
  required = true,
}: {
  id: string;
  name: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted transition-colors hover:text-ink"
      >
        {visible ? (
          <EyeOff className="size-4" strokeWidth={1.5} />
        ) : (
          <Eye className="size-4" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
