"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelsTopLeft,
  ReceiptText,
  Settings2,
  Sparkles,
  TicketPercent,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Studio",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ReceiptText },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "Promotions",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
      { href: "/admin/combos", label: "Combos", icon: Boxes },
    ],
  },
  {
    label: "Storefront",
    items: [
      { href: "/admin/content", label: "Homepage & popups", icon: PanelsTopLeft },
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
    ],
  },
  {
    label: "Trade",
    items: [
      { href: "/admin/businesses", label: "Trade accounts", icon: Building2 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  email,
  name,
  demo,
  brandName,
  logoUrl,
  onNavigate,
}: {
  pathname: string;
  email: string | null;
  name: string;
  demo: boolean;
  brandName: string;
  logoUrl: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-7">
      <div>
        <Link href="/admin" className="inline-flex" aria-label={`${brandName} studio home`}>
          <BrandMark
            name={brandName}
            logoUrl={logoUrl}
            textClassName="text-[1.65rem] font-light text-cream"
            logoClassName="h-10 max-w-[12rem]"
            frameClassName="bg-cream px-3 py-2"
          />
        </Link>
        <div className="mt-2 flex items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-cream/40">
          <Sparkles className="size-3 text-clay" aria-hidden />
          Studio desk
        </div>
      </div>

      <nav aria-label="Studio sections" className="mt-9 flex-1 space-y-7">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-cream/30">
              {group.label}
            </p>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 border-l-2 px-3 py-2.5 text-[0.78rem] font-medium tracking-[0.01em] transition-colors",
                        active
                          ? "border-clay bg-cream/[0.08] text-cream"
                          : "border-transparent text-cream/55 hover:border-cream/20 hover:bg-cream/[0.04] hover:text-cream",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-clay" : "text-cream/35 group-hover:text-cream/70",
                        )}
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-8 space-y-4 border-t border-cream/12 pt-5">
        <div>
          <p className="truncate text-xs text-cream/80">{name}</p>
          <p className="mt-0.5 truncate text-[0.65rem] text-cream/35">
            {demo ? "Demo preview · not signed in" : email}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-1 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-cream/45 transition-colors hover:text-cream"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View storefront
          </Link>
          {demo ? (
            <Link
              href="/"
              className="flex items-center gap-2 px-1 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-cream/45 transition-colors hover:text-cream"
            >
              <LogOut className="size-3.5" aria-hidden />
              Leave preview
            </Link>
          ) : (
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 px-1 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-cream/45 transition-colors hover:text-cream"
              >
                <LogOut className="size-3.5" aria-hidden />
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  email,
  name,
  demo,
  serviceRoleMissing,
  brandName,
  logoUrl,
}: {
  children: React.ReactNode;
  email: string | null;
  name: string;
  demo: boolean;
  serviceRoleMissing: boolean;
  brandName: string;
  logoUrl: string | null;
}) {
  const pathname = usePathname() || "/admin";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-ink/10 bg-ink lg:block">
        <SidebarContent
          pathname={pathname}
          email={email}
          name={name}
          demo={demo}
          brandName={brandName}
          logoUrl={logoUrl}
        />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/admin" className="inline-flex items-center">
            <BrandMark
              name={brandName}
              logoUrl={logoUrl}
              textClassName="text-xl"
              logoClassName="h-8 max-w-[8rem]"
            />
            <span className="ml-2 text-[0.55rem] uppercase tracking-[0.2em] text-muted">
              Studio
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open studio menu"
            className="flex size-9 items-center justify-center border border-line text-ink"
          >
            <Menu className="size-4" aria-hidden />
          </button>
        </header>

        {demo ? (
          <div className="border-b border-clay/25 bg-clay/10 px-4 py-2.5 text-[0.7rem] leading-relaxed text-clay-deep sm:px-6 lg:px-10">
            <strong className="font-semibold">Preview mode.</strong> You are viewing demo data.
            Add Supabase keys to <code>.env.local</code> to sign in and save changes.
          </div>
        ) : null}
        {!demo && serviceRoleMissing ? (
          <div className="border-b border-clay/25 bg-clay/10 px-4 py-2.5 text-[0.7rem] leading-relaxed text-clay-deep sm:px-6 lg:px-10">
            <strong className="font-semibold">Service role key missing.</strong> Add{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> to manage orders and content.
          </div>
        ) : null}

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-10 xl:px-14">
          {children}
        </main>

        <footer className="border-t border-line px-4 py-4 text-[0.6rem] uppercase tracking-[0.16em] text-muted sm:px-6 lg:px-10 xl:px-14">
          {brandName} studio · Internal dashboard
        </footer>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close studio menu"
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-ink shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close studio menu"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center text-cream/60 hover:text-cream"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarContent
              pathname={pathname}
              email={email}
              name={name}
              demo={demo}
              brandName={brandName}
              logoUrl={logoUrl}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
