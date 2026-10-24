import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow text-clay">{eyebrow}</p> : null}
        <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,3.1rem)] font-light leading-[1.02] tracking-[-0.035em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("border border-line bg-cream", className)}>
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title ? (
              <h2 className="font-serif text-xl font-light tracking-[-0.02em]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-5 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  href,
  emphasis,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  emphasis?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "group flex h-full flex-col justify-between border border-line px-5 py-5 transition-colors",
        emphasis ? "bg-ink text-cream" : "bg-cream hover:border-ink/30",
        href && "hover:bg-cream/80",
      )}
    >
      <p
        className={cn(
          "text-[0.58rem] font-semibold uppercase tracking-[0.18em]",
          emphasis ? "text-cream/45" : "text-muted",
        )}
      >
        {label}
      </p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p
          className={cn(
            "font-serif text-[2rem] font-light leading-none tracking-[-0.03em]",
            emphasis ? "text-cream" : "text-ink",
          )}
        >
          {value}
        </p>
        {href ? (
          <ArrowRight
            className={cn(
              "size-4 transition-transform group-hover:translate-x-0.5",
              emphasis ? "text-cream/40" : "text-muted",
            )}
            aria-hidden
          />
        ) : null}
      </div>
      {detail ? (
        <p
          className={cn(
            "mt-2 text-[0.68rem] leading-relaxed",
            emphasis ? "text-cream/50" : "text-muted",
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

export function DataTable({
  children,
  minWidth = "min-w-[760px]",
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className={cn("w-full border-collapse text-left align-middle text-sm", minWidth)}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line pb-3 pr-4 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted last:pr-0",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-line/70 py-3.5 pr-4 align-middle text-[0.82rem] leading-relaxed last:pr-0",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.56rem] font-semibold uppercase leading-none tracking-[0.1em]",
        tone === "neutral" && "bg-sand text-ink-soft",
        tone === "positive" && "bg-sage-light text-sage",
        tone === "warning" && "bg-clay/12 text-clay-deep",
        tone === "danger" && "bg-red-900/10 text-red-900",
        tone === "info" && "bg-ink/8 text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}

export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  params = {},
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  params?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) {
    return (
      <p className="text-[0.68rem] text-muted">
        {total} {total === 1 ? "record" : "records"}
      </p>
    );
  }

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[0.68rem] text-muted">
        Page {page} of {pages} · {total} {total === 1 ? "record" : "records"}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            "border border-line px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition-colors",
            page <= 1
              ? "pointer-events-none opacity-40"
              : "hover:border-ink hover:bg-ink hover:text-cream",
          )}
        >
          Previous
        </Link>
        <Link
          href={hrefFor(Math.min(pages, page + 1))}
          aria-disabled={page >= pages}
          className={cn(
            "border border-line px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition-colors",
            page >= pages
              ? "pointer-events-none opacity-40"
              : "hover:border-ink hover:bg-ink hover:text-cream",
          )}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
