export default function AdminLoading() {
  return (
    <div className="max-w-5xl mx-auto px-5 pt-8 pb-20 animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-16 rounded bg-mute mb-2" />
        <div className="h-8 w-48 rounded bg-mute mb-2" />
        <div className="h-4 w-72 rounded bg-mute" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-line rounded-2xl p-4 shadow-soft"
          >
            <div className="h-3 w-12 rounded bg-mute mb-2" />
            <div className="h-7 w-16 rounded bg-mute" />
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-surface border border-line rounded-3xl p-6 shadow-soft"
          >
            <div className="h-3 w-12 rounded bg-mute mb-3" />
            <div className="h-6 w-48 rounded bg-mute mb-2" />
            <div className="h-4 w-full rounded bg-mute mb-3" />
            <div className="h-4 w-32 rounded bg-mute" />
          </div>
        ))}
      </div>
    </div>
  )
}
