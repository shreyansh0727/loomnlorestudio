"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { signUpAction } from "@/lib/actions/auth";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "@/components/auth/password-input";

export function SignUpForm({ next }: { next: string }) {
  const [state, action] = useActionState(signUpAction, INITIAL_FORM_STATE);

  if (state.status === "success") {
    return (
      <div className="border border-sage/30 bg-sage-light/50 p-6">
        <Mail className="size-6 text-sage" strokeWidth={1.5} />
        <h2 className="mt-4 font-serif text-2xl font-light">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{state.message}</p>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="link-underline mt-5 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-clay"
        >
          Go to sign in
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <Field label="Full name" htmlFor="fullName" required>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Your name"
          required
        />
      </Field>

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

      <Field
        label="Mobile number"
        htmlFor="phone"
        hint="Optional. Used only for delivery updates."
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+91"
        />
      </Field>

      <Field
        label="Password"
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

      <Checkbox
        name="terms"
        label="I agree to the terms, privacy policy and the way cut fabric is handled."
        required
      />

      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Creating account">
        Create account
        <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
