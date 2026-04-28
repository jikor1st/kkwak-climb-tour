export default function PublicLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <section className="hero-bg px-5 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="h-7 w-40 rounded-full bg-mute mb-6" />
          <div className="h-14 w-full max-w-xl rounded bg-mute mb-3" />
          <div className="h-14 w-3/4 max-w-md rounded bg-mute mb-6" />
          <div className="h-5 w-2/3 max-w-md rounded bg-mute mb-10" />
          <div className="space-y-3">
            <div className="h-3 w-16 rounded bg-mute" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 w-16 rounded-lg bg-mute border border-line"
                />
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <div className="h-14 sm:flex-1 rounded-xl bg-mute" />
            <div className="h-14 sm:flex-1 rounded-xl bg-mute" />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 py-12 sm:py-14">
        <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card">
          <div className="h-3 w-20 rounded bg-mute mb-3" />
          <div className="h-7 w-48 rounded bg-mute mb-7" />
          <div className="h-20 rounded-2xl bg-mute mb-6" />
          <div className="space-y-3">
            <div className="h-4 rounded bg-mute" />
            <div className="h-4 rounded bg-mute" />
            <div className="h-4 rounded bg-mute" />
          </div>
        </div>
      </div>
    </div>
  )
}
