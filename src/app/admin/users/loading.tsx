export default function AdminUsersLoading() {
  return (
    <div className="max-w-5xl mx-auto px-5 pt-8 pb-20 animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-16 rounded bg-mute mb-2" />
        <div className="h-8 w-32 rounded bg-mute mb-2" />
        <div className="h-4 w-72 rounded bg-mute" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="h-9 w-20 rounded-full bg-mute" />
        <div className="h-9 w-20 rounded-full bg-mute" />
        <div className="h-9 w-48 rounded-lg bg-mute ml-auto" />
      </div>

      <div className="bg-surface border border-line rounded-2xl shadow-soft overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-line last:border-b-0"
          >
            <div className="w-9 h-9 rounded-full bg-mute shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-32 rounded bg-mute" />
              <div className="h-3 w-40 rounded bg-mute" />
            </div>
            <div className="h-6 w-12 rounded-full bg-mute shrink-0" />
            <div className="h-7 w-16 rounded-lg bg-mute shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
