"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { updatePasswordAction } from "@/lib/actions/auth";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "@/components/auth/password-input";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-5">
      <Field
        label="New password"
        htmlFor="password"
        hint="At least 8 characters."
        required
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
        />
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword" required>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
        />
      </Field>

      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Saving password">
        Save new password
        <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
