import { ImageResponse } from "next/og"
import { createServerClient } from "@/lib/supabase/server"

export const alt = "꽉크루 볼구력 대회 2026"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const WEEKDAY_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function formatBadge(date: string | null): string {
  if (!date) return "COMING SOON"
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return "COMING SOON"
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}.${mm}.${dd} ${WEEKDAY_EN[d.getDay()]}`
}

function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return start ?? null
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  const url = `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/public/static/Pretendard-${
    weight === 900 ? "Black" : weight === 700 ? "Bold" : "Regular"
  }.otf`
  try {
    const res = await fetch(url, { cache: "force-cache" })
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export default async function Image() {
  let contestDate: string | null = null
  let startTime: string | null = null
  let endTime: string | null = null
  let venues: string[] = []

  try {
    const supabase = createServerClient()
    const [csRes, gymsRes] = await Promise.all([
      supabase
        .from("contest_settings")
        .select("contest_date, start_time, end_time")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("gyms")
        .select("name, display_order")
        .eq("active", true)
        .order("display_order"),
    ])
    contestDate = csRes.data?.contest_date ?? null
    startTime = csRes.data?.start_time ?? null
    endTime = csRes.data?.end_time ?? null
    venues = (gymsRes.data ?? []).map((g) => g.name)
  } catch (e) {
    console.error("[og-image] supabase fetch error:", e)
  }

  const dateBadge = formatBadge(contestDate)
  const timeRange = formatTimeRange(startTime, endTime)
  const venueLine =
    venues.length > 0 ? venues.join(" · ") : "신사 · 논현 · 강남 · 양재 · 사당 · 이수"

  const [bold, black] = await Promise.all([loadFont(700), loadFont(900)])

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 900 }[] = []
  if (bold) fonts.push({ name: "Pretendard", data: bold, weight: 700 })
  if (black) fonts.push({ name: "Pretendard", data: black, weight: 900 })

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#DC2626",
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.18), transparent 65%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(0,0,0,0.18), transparent 65%)",
          fontFamily: "Pretendard",
          color: "#FFFFFF",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Date pill — top center */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 24px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.14)",
              border: "2px solid rgba(255,255,255,0.35)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: "#FFFFFF",
              }}
            />
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 4,
              }}
            >
              {dateBadge}
            </span>
          </div>
        </div>

        {/* Logo + wordmark — splash aesthetic */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="220"
            height="220"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.22))",
            }}
          >
            <path
              d="M 6 22 L 9 8 L 17 6 L 25 10 L 25 19 L 20 25 L 10 25 Z"
              fill="white"
            />
            <circle cx="14" cy="14" r="1.5" fill="#DC2626" opacity="0.35" />
            <circle cx="19" cy="17" r="1.2" fill="#DC2626" opacity="0.3" />
          </svg>

          <div
            style={{
              marginTop: 28,
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: 4,
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            꽉크루
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 8,
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
            }}
          >
            Bolguryeok 2026
          </div>
        </div>

        {/* Bottom strip — venues + time */}
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 22,
            borderTop: "2px solid rgba(255,255,255,0.25)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 4,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 6,
              }}
            >
              VENUES
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#FFFFFF",
              }}
            >
              {venueLine}
            </div>
          </div>
          {timeRange && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: 4,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 6,
                }}
              >
                TIME
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeRange}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
