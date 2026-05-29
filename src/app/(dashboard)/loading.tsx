export default function DashboardLoading() {
  return (
    <div className="sm:ps-72 min-h-screen">
      <div className="p-6 max-w-[960px] mx-auto space-y-6 animate-pulse">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="size-16 sm:size-20 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-muted rounded-full" />
            <div className="h-3 w-32 bg-muted rounded-full" />
          </div>
        </div>

        {/* Hero banner */}
        <div className="h-40 rounded-2xl bg-muted" />

        {/* Stat cards 2x2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted" />
          ))}
        </div>

        {/* Two-col section */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
