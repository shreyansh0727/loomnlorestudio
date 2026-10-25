import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EditorialConfig } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

export function EditorialSection({
  title,
  config,
}: {
  title: string | null;
  config: EditorialConfig;
}) {
  return (
    <section className="my-8 border-y border-line bg-cream lg:my-12">
      <div className="editorial-container grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div
          className={
            config.image_position === "right"
              ? "lg:order-2"
              : "lg:order-1"
          }
        >
          <div className="relative">
            <div
              aria-hidden
              className={`absolute -bottom-4 hidden size-full rounded-[9rem_9rem_2rem_2rem] border border-dashed border-clay/25 lg:block ${
                config.image_position === "right" ? "-left-4" : "-right-4"
              }`}
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[8.5rem_8.5rem_1.5rem_1.5rem] bg-sand">
              <SafeImage
                src={config.image_url}
                alt={config.heading || title || "Inside the workroom"}
                sizes="(min-width: 1024px) 44vw, 100vw"
              />
            </div>
            <p className="absolute bottom-4 left-4 rounded-full bg-cream/90 px-3.5 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-ink-soft backdrop-blur-sm">
              Varanasi workroom · Est. 2026
            </p>
            <span className="script-label absolute -top-3 right-4 rotate-[5deg] rounded-full bg-butter/90 px-4 py-1.5 text-lg text-clay shadow-soft">
              made by hand
            </span>
          </div>
        </div>

        <div className={config.image_position === "right" ? "lg:order-1" : "lg:order-2"}>
          <p className="eyebrow text-clay">{config.eyebrow || "Our approach"}</p>
          <h2 className="mt-5 max-w-xl font-serif text-[clamp(2.2rem,5vw,4rem)] font-light leading-[1.02] tracking-[-0.04em]">
            {config.heading || title}
          </h2>
          <div className="prose-editorial mt-6 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">
            {config.body.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {config.cta_label ? (
            <Link
              href={config.cta_href || "/about"}
              className="link-underline mt-8 inline-flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.17em] text-ink"
            >
              {config.cta_label}
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
            <div>
              <p className="font-serif text-2xl font-light">100%</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                Hand-finished
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-light">6</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                Little collections
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-light">2–4</p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                Days to dispatch
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
