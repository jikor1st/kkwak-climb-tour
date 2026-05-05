export default function RecordLoading() {
  return (
    <div className="pb-32 animate-pulse">
      {/* sticky-like header skeleton */}
      <div className="bg-paper/75 border-b border-line">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-32 rounded bg-mute" />
            <div className="h-3 w-20 rounded bg-mute" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-32 rounded-full bg-mute" />
            <div className="h-6 w-20 rounded-full bg-mute" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-20 rounded-full bg-mute shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* walls checklist skeleton */}
      <div className="max-w-3xl mx-auto px-5 pt-5 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-line rounded-2xl p-5 shadow-soft"
          >
            <div className="h-5 w-28 rounded bg-mute mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-12 rounded-lg bg-mute" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
