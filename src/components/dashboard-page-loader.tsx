export function DashboardPageLoader({ title }: { title?: string }) {
  return <main aria-busy="true" className="space-y-6 py-4">
    {title ? <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1> : null}
    <div role="status" aria-label="Loading page" className="flex min-h-40 items-center justify-center">
      <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-line border-t-accent motion-reduce:animate-none" />
      <span className="sr-only">Loading…</span>
    </div>
  </main>;
}
