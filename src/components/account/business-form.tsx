"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import type { Business } from "@/lib/types";
import { INDIAN_STATES } from "@/lib/constants";
import { submitBusinessAction } from "@/lib/actions/account";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function BusinessForm({
  business,
  accountEmail,
  accountPhone,
}: {
  business: Business | null;
  accountEmail: string;
  accountPhone: string;
}) {
  const [state, action] = useActionState(submitBusinessAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-10">
      <fieldset className="space-y-5">
        <legend className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Business details
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Registered legal name" htmlFor="legalName" required>
            <Input
              id="legalName"
              name="legalName"
              autoComplete="organization"
              defaultValue={business?.legal_name ?? ""}
              placeholder="As printed on your GST certificate"
              required
            />
          </Field>
          <Field label="Trade name" htmlFor="tradeName">
            <Input
              id="tradeName"
              name="tradeName"
              defaultValue={business?.trade_name ?? ""}
              placeholder="If different from legal name"
            />
          </Field>
        </div>
        <Field
          label="GSTIN"
          htmlFor="gstin"
          hint="15 characters. We verify this manually before approving wholesale access."
          required
        >
          <Input
            id="gstin"
            name="gstin"
            defaultValue={business?.gstin ?? ""}
            maxLength={15}
            minLength={15}
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="29ABCDE1234F1Z5"
            className="uppercase tracking-[0.12em]"
            required
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Registered address
        </legend>
        <Field label="Address line 1" htmlFor="addressLine1" required>
          <Input
            id="addressLine1"
            name="addressLine1"
            autoComplete="address-line1"
            defaultValue={business?.address_line1 ?? ""}
            required
          />
        </Field>
        <Field label="Address line 2" htmlFor="addressLine2">
          <Input
            id="addressLine2"
            name="addressLine2"
            autoComplete="address-line2"
            defaultValue={business?.address_line2 ?? ""}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" htmlFor="city" required>
            <Input
              id="city"
              name="city"
              autoComplete="address-level2"
              defaultValue={business?.city ?? ""}
              required
            />
          </Field>
          <Field label="State" htmlFor="state" required>
            <Select
              id="state"
              name="state"
              autoComplete="address-level1"
              defaultValue={business?.state ?? ""}
              required
            >
              <option value="" disabled>
                Choose a state
              </option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="PIN code" htmlFor="pincode" required>
            <Input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              minLength={6}
              defaultValue={business?.pincode ?? ""}
              required
            />
          </Field>
        </div>
        <p className="text-xs text-muted">Country · India</p>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Business contact
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business email" htmlFor="businessEmail" required>
            <Input
              id="businessEmail"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={business?.email ?? accountEmail}
              required
            />
          </Field>
          <Field label="Business phone" htmlFor="businessPhone" required>
            <Input
              id="businessPhone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              defaultValue={business?.phone ?? accountPhone}
              required
            />
          </Field>
        </div>
      </fieldset>

      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
        <SubmitButton size="lg" pendingLabel="Submitting">
          Submit for review
          <ArrowRight className="size-4" />
        </SubmitButton>
        <p className="text-xs leading-relaxed text-muted">
          Submitting does not commit you to an order. We review GST details manually.
        </p>
      </div>
    </form>
  );
}
