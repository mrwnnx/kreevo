export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <span className="text-base font-bold tracking-tight">kreevo</span>
        <div className="flex items-center gap-4">
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          <div className="h-7 w-24 rounded-full bg-muted animate-pulse" />
        </div>
      </nav>

      <main className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16 space-y-12">
        <section className="space-y-6 max-w-3xl">
          <div className="h-10 w-2/3 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
          </div>
        </section>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="h-4 w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-12 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
