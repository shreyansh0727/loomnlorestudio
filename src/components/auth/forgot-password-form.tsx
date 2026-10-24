"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    INITIAL_FORM_STATE,
  );

  return (
    <form action={action} className="space-y-5">
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

      {state.status !== "idle" ? (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Sending link">
        Send reset link
        <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
