export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading studio page" className="min-w-0">
      <span className="sr-only">Loading…</span>
      <div className="h-2 w-28 animate-pulse bg-line/60" />
      <div className="mt-4 h-10 w-64 max-w-full animate-pulse bg-line/40" />
      <div className="mt-3 h-3 w-80 max-w-full animate-pulse bg-line/30" />
      <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="h-44 animate-pulse border border-line bg-cream/60" />
          <div className="h-64 animate-pulse border border-line bg-cream/60" />
        </div>
        <div className="h-64 animate-pulse border border-line bg-cream/60" />
      </div>
    </div>
  );
}
