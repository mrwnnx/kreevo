export default function ChallengeDetailLoading() {
  return (
    <div className="p-6 max-w-[960px] mx-auto pb-16 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-24 bg-muted rounded-full mb-6" />

      {/* 2-col layout: main + sidebar */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        {/* Main */}
        <div className="space-y-8 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-24 bg-muted rounded-full" />
            <div className="h-7 w-20 bg-muted rounded-full" />
            <div className="h-7 w-16 bg-muted rounded-full" />
          </div>
          {/* Title + brief */}
          <div className="space-y-3">
            <div className="h-10 w-3/4 bg-muted rounded-lg" />
            <div className="h-4 w-full bg-muted rounded-full" />
            <div className="h-4 w-5/6 bg-muted rounded-full" />
          </div>
          {/* Brief sections */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-40 bg-muted rounded-full" />
              <div className="h-4 w-full bg-muted rounded-full" />
              <div className="h-4 w-11/12 bg-muted rounded-full" />
              <div className="h-4 w-3/4 bg-muted rounded-full" />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
