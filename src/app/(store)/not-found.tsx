import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="editorial-container py-14 lg:py-20">
      <EmptyState
        icon={<SearchX className="size-8" strokeWidth={1.25} aria-hidden />}
        title="We couldn't find that page"
        description="The link may be old, or the piece may no longer be part of the collection. Browse the shop, or use the order number from your confirmation email to track a purchase."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/shop" className={buttonStyles()}>
              Browse the shop
            </Link>
            <Link href="/track" className={buttonStyles({ variant: "secondary" })}>
              Track an order
            </Link>
          </div>
        }
      />
    </div>
  );
}
