export default function StoreLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading page">
      <div className="h-0.5 w-full overflow-hidden bg-line/40">
        <div className="h-full w-1/3 animate-pulse bg-clay" />
      </div>
      <div className="editorial-container py-12 lg:py-16">
        <span className="sr-only">Loading…</span>
        <div className="h-2.5 w-24 animate-pulse bg-line/60" />
        <div className="mt-6 h-12 w-3/4 max-w-xl animate-pulse bg-line/40 sm:h-20" />
        <div className="mt-5 h-3 w-1/2 max-w-sm animate-pulse bg-line/30" />
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:mt-16 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[4/5] w-full animate-pulse bg-line/30" />
              <div className="mt-4 h-2.5 w-3/4 animate-pulse bg-line/40" />
              <div className="mt-2 h-2.5 w-1/3 animate-pulse bg-line/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
