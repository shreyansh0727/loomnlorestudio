"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { verifyMfaCodeAction } from "@/lib/actions/mfa";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function MfaChallengeForm({
  factorId,
  next,
}: {
  factorId: string;
  next: string;
}) {
  const [state, action] = useActionState(verifyMfaCodeAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="factorId" value={factorId} />
      <input type="hidden" name="next" value={next} />

      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden />
        <p className="text-sm leading-relaxed text-ink-soft">
          Open your authenticator app and enter the current 6-digit code for the
          studio.
        </p>
      </div>

      <Field label="Authentication code" htmlFor="code" required>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          autoFocus
          required
          className="h-12 text-center font-mono text-lg tracking-[0.45em]"
        />
      </Field>

      {state.status !== "idle" ? (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Checking code">
        Verify and open studio
      </SubmitButton>
    </form>
  );
}
