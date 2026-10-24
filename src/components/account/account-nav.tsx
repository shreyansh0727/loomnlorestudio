"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/business", label: "Trade account" },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...links, { href: "/admin", label: "Admin studio" }] : links;

  return (
    <nav aria-label="Account">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line pb-3 lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0">
        {items.map((link) => {
          const active =
            link.href === "/account"
              ? pathname === "/account"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <li key={link.href} className="shrink-0 lg:w-full">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center whitespace-nowrap px-3 text-[0.64rem] font-semibold uppercase tracking-[0.15em] transition-colors lg:w-full lg:border-l lg:px-4",
                  active
                    ? "bg-cream text-ink lg:border-clay"
                    : "text-muted hover:text-ink lg:border-line",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
