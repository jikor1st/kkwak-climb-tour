export default function RankingLoading() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-20 animate-pulse space-y-4">
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-soft">
        <div className="h-3 w-16 rounded bg-mute mb-2" />
        <div className="h-7 w-32 rounded bg-mute mb-3" />
        <div className="flex gap-2">
          <div className="h-7 w-20 rounded-full bg-mute" />
          <div className="h-7 w-20 rounded-full bg-mute" />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-3 sm:p-5 shadow-soft">
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-line"
            >
              <div className="w-9 h-9 rounded-lg bg-mute shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 w-32 rounded bg-mute" />
                <div className="h-1 rounded-full bg-mute w-full" />
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="h-4 w-12 rounded bg-mute ml-auto" />
                <div className="h-3 w-10 rounded bg-mute ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
