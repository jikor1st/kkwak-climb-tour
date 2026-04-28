export default function ParticipantLoading() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-20 animate-pulse">
      <div className="bg-surface border border-line rounded-3xl p-6 sm:p-7 shadow-card mb-4">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-6 w-24 rounded-full bg-mute" />
          <div className="h-4 w-12 rounded bg-mute" />
        </div>
        <div className="h-3 w-32 rounded bg-mute mb-3" />
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="h-14 w-40 rounded bg-mute" />
            <div className="h-3 w-24 rounded bg-mute" />
          </div>
          <div className="hidden sm:block h-10 w-24 rounded-full bg-mute" />
        </div>
        <div className="mt-5 h-2 rounded-full bg-mute" />
        <div className="mt-6 h-12 rounded-xl bg-mute" />
      </div>

      <div className="bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-soft mb-4">
        <div className="h-4 w-24 rounded bg-mute mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-line"
            >
              <div className="w-9 h-9 rounded-lg bg-mute shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 rounded bg-mute" />
                <div className="h-1 rounded-full bg-mute" />
              </div>
              <div className="h-4 w-12 rounded bg-mute" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5 shadow-soft">
        <div className="h-3 w-20 rounded bg-mute mb-3" />
        <div className="space-y-2">
          <div className="h-4 rounded bg-mute" />
          <div className="h-4 rounded bg-mute" />
          <div className="h-4 rounded bg-mute" />
        </div>
      </div>
    </div>
  )
}
