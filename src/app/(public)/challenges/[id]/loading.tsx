export default function PublicChallengeDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border h-14" />

      <main className="max-w-[1080px] mx-auto px-6 py-8 sm:py-12 space-y-10 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded-full" />

        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* Main */}
          <div className="space-y-8 min-w-0">
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-24 bg-muted rounded-full" />
              <div className="h-7 w-20 bg-muted rounded-full" />
            </div>
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-lg bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-10 w-3/4 bg-muted rounded-lg" />
                <div className="h-4 w-full bg-muted rounded-full" />
                <div className="h-4 w-5/6 bg-muted rounded-full" />
              </div>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-40 bg-muted rounded-full" />
                <div className="h-4 w-full bg-muted rounded-full" />
                <div className="h-4 w-11/12 bg-muted rounded-full" />
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="h-44 rounded-2xl bg-muted" />
          </aside>
        </div>
      </main>
    </div>
  )
}
