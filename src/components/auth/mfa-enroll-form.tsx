"use client";

import { useActionState } from "react";
import { KeyRound, Smartphone } from "lucide-react";
import { startMfaEnrollmentAction, verifyMfaCodeAction } from "@/lib/actions/mfa";
import {
  INITIAL_FORM_STATE,
  INITIAL_MFA_ENROLL_STATE,
} from "@/lib/form-state";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function MfaEnrollForm({ next }: { next: string }) {
  const [enrollment, startAction] = useActionState(
    startMfaEnrollmentAction,
    INITIAL_MFA_ENROLL_STATE,
  );
  const [verification, verifyAction] = useActionState(
    verifyMfaCodeAction,
    INITIAL_FORM_STATE,
  );

  if (enrollment.status !== "ready" || !enrollment.factorId) {
    return (
      <form action={startAction} className="space-y-5">
        <div className="flex gap-3">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-clay" aria-hidden />
          <div>
            <p className="text-sm font-medium text-ink">
              You will need an authenticator app
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Google Authenticator, Authy, 1Password or any TOTP app works. The
              studio asks for a fresh code each time you sign in.
            </p>
          </div>
        </div>

        {enrollment.status === "error" ? (
          <FormMessage message={enrollment.message} tone="error" />
        ) : null}

        <SubmitButton size="lg" className="w-full" pendingLabel="Preparing setup">
          Set up authenticator
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns the QR as an inline data URL */}
        <img
          src={enrollment.qrCode}
          alt="Authenticator setup QR code"
          width={176}
          height={176}
          className="size-44 shrink-0 border border-line bg-white p-2"
        />
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-sm font-medium text-ink">Scan this code</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Point your authenticator app at the QR code, then enter the 6-digit
            code it shows below.
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted sm:justify-start">
            <KeyRound className="size-3" aria-hidden />
            Manual setup key
          </p>
          <code className="mt-1.5 block break-all font-mono text-xs leading-relaxed text-ink">
            {enrollment.secret}
          </code>
        </div>
      </div>

      <form
        action={verifyAction}
        className="space-y-5 border-t border-line pt-6"
      >
        <input type="hidden" name="factorId" value={enrollment.factorId} />
        <input type="hidden" name="next" value={next} />

        <Field label="Authentication code" htmlFor="enrollment-code" required>
          <Input
            id="enrollment-code"
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

        {verification.status !== "idle" ? (
          <FormMessage
            message={verification.message}
            tone={verification.status === "success" ? "success" : "error"}
          />
        ) : null}

        <SubmitButton size="lg" className="w-full" pendingLabel="Verifying">
          Verify and open studio
        </SubmitButton>
      </form>
    </div>
  );
}
