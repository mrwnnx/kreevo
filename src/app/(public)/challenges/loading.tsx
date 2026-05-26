export default function PublicChallengesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border h-14" />

      <main className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16 space-y-12 animate-pulse">
        {/* Hero */}
        <section className="space-y-6 max-w-3xl">
          <div className="h-12 w-3/4 bg-muted rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-full bg-muted rounded-full" />
            <div className="h-5 w-5/6 bg-muted rounded-full" />
          </div>
          <div className="h-11 w-48 bg-muted rounded-full" />
        </section>

        {/* Counter */}
        <div className="h-4 w-40 bg-muted rounded-full" />

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-56 rounded-[20px] bg-muted" />
          ))}
        </div>
      </main>
    </div>
  )
}
