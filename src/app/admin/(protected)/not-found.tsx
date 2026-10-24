import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Studio"
        title="Not found"
        description="That record may have been removed, or the link may be incomplete."
      />
      <div className="mt-6">
        <EmptyState
          icon={<FileQuestion className="size-8" strokeWidth={1.25} aria-hidden />}
          title="Nothing here"
          description="Return to the order desk or the dashboard to continue working."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/admin" className={buttonStyles()}>
                Dashboard
              </Link>
              <Link href="/admin/orders" className={buttonStyles({ variant: "secondary" })}>
                Orders
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
