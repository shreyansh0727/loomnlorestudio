"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { trackOrderAction } from "@/lib/actions/account";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function TrackOrderForm() {
  const [state, action] = useActionState(trackOrderAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Order number"
        htmlFor="orderNumber"
        hint="It begins with LL- and appears in your confirmation email."
        required
      >
        <Input
          id="orderNumber"
          name="orderNumber"
          placeholder="LL-260524-01042"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </Field>

      <Field
        label="Email used at checkout"
        htmlFor="email"
        hint="Use the same email address you gave when the order was placed."
        required
      >
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

      <SubmitButton size="lg" className="w-full" pendingLabel="Looking up">
        Find my order
        <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
