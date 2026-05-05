export function SplashScreen() {
  return (
    <div
      className="splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-accent"
      aria-hidden
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="splash-logo drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
      >
        <path
          d="M 6 22 L 9 8 L 17 6 L 25 10 L 25 19 L 20 25 L 10 25 Z"
          fill="white"
        />
        <circle cx="14" cy="14" r="1.5" fill="#DC2626" opacity="0.35" />
        <circle cx="19" cy="17" r="1.2" fill="#DC2626" opacity="0.3" />
      </svg>
      <div className="splash-text mt-6 text-white font-black text-2xl tracking-wider">
        꽉크루
      </div>
      <div className="splash-text mt-1 text-white/80 text-[11px] font-bold tracking-[0.3em] uppercase">
        Bolguryeok 2026
      </div>
    </div>
  )
}
