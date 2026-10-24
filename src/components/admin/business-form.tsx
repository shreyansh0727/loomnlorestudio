"use client";

import { useActionState, useEffect } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { reviewBusinessAction } from "@/lib/actions/admin/businesses";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import type { Business } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Textarea } from "@/components/ui/form";

export function BusinessReviewForm({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState(
    reviewBusinessAction,
    INITIAL_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={business.id} />
      <Field
        label="Review note"
        htmlFor={`business-note-${business.id}`}
        hint="Shared with the applicant on their trade account page."
      >
        <Textarea
          id={`business-note-${business.id}`}
          name="note"
          rows={2}
          maxLength={500}
          defaultValue={business.admin_note ?? ""}
          placeholder="GSTIN verified against the portal."
        />
      </Field>
      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="status"
          value="approved"
          size="sm"
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
          {business.status === "approved" ? "Keep approved" : "Approve trade access"}
        </Button>
        <Button
          type="submit"
          name="status"
          value="rejected"
          variant="secondary"
          size="sm"
          className="border-red-900/30 text-red-900 hover:border-red-900 hover:bg-red-900 hover:text-white"
          disabled={pending}
        >
          <X className="size-3.5" aria-hidden />
          {business.status === "rejected" ? "Keep declined" : "Decline"}
        </Button>
      </div>
    </form>
  );
}
