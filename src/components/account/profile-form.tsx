"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/account";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, action] = useActionState(updateProfileAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            defaultValue={fullName}
            required
          />
        </Field>
        <Field
          label="Mobile number"
          htmlFor="phone"
          hint="Used for delivery updates only."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            defaultValue={phone}
          />
        </Field>
      </div>

      <Field
        label="Email address"
        htmlFor="accountEmail"
        hint="This is your verified sign-in email and cannot be changed here. Write to the studio if it needs updating."
      >
        <Input
          id="accountEmail"
          type="email"
          value={email}
          readOnly
          disabled
          aria-readonly
        />
      </Field>

      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}

      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Saving">
          Save details
          <ArrowRight className="size-3.5" />
        </SubmitButton>
        <p className="text-xs text-muted">Only your name and phone are editable.</p>
      </div>
    </form>
  );
}
