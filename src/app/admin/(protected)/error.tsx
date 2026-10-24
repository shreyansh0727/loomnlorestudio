"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Studio"
        title="Something went wrong"
        description="The action did not complete. No records were changed by this error."
      />
      <div className="mt-6">
        <EmptyState
          title="This view could not load"
          description="Try again. If it keeps happening, check the server log and your Supabase connection."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button type="button" onClick={reset}>
                <RotateCcw className="size-3.5" aria-hidden />
                Try again
              </Button>
              <Link href="/admin" className={buttonStyles({ variant: "secondary" })}>
                Dashboard
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
