"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signInAction } from "@/lib/actions/auth";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "@/components/auth/password-input";

export function LoginForm({
  next,
  notice,
}: {
  next: string;
  notice?: string;
}) {
  const [state, action] = useActionState(signInAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {notice ? <FormMessage message={notice} tone="info" /> : null}

      <Field label="Email address" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </Field>

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/forgot-password"
          className="link-underline text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          Forgot password?
        </Link>
      </div>

      {state.status !== "idle" ? (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Signing in">
        Sign in
        <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
