"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";

type AdminAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function ActionButton({
  action,
  fields,
  children,
  variant = "secondary",
  size = "sm",
  className,
  confirmMessage,
  pendingLabel,
}: {
  action: AdminAction;
  fields: Record<string, string | number | boolean | null | undefined>;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "clay" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  confirmMessage?: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      className="inline-flex"
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input
          key={name}
          type="hidden"
          name={name}
          value={typeof value === "boolean" ? (value ? "on" : "") : String(value ?? "")}
        />
      ))}
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={pending}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {pending ? (pendingLabel ?? children) : children}
      </Button>
    </form>
  );
}
