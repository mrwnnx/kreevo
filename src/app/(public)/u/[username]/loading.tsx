export default function PublicProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar placeholder */}
      <div className="border-b border-border h-12" />

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-pulse">
        {/* Header */}
        <section className="flex flex-col md:flex-row gap-6 items-start">
          <div className="size-24 rounded-2xl bg-muted shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-64 bg-muted rounded-lg" />
            <div className="h-4 w-40 bg-muted rounded-full" />
            <div className="h-4 w-56 bg-muted rounded-full" />
            <div className="h-4 w-72 bg-muted rounded-full" />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </section>

        {/* Featured work */}
        <section className="space-y-4">
          <div className="h-5 w-32 bg-muted rounded-full" />
          <div className="grid md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-video rounded-xl bg-muted" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
