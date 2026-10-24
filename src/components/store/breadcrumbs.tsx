import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.64rem] uppercase tracking-[0.16em]">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-ink">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            <li aria-hidden className="text-line">
              /
            </li>
            <li>
              {item.href && index < items.length - 1 ? (
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink-soft">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
