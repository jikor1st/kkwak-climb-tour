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
  let participantCount = 0

  try {
    const supabase = createServerClient()
    const [csRes, gymsRes, partsRes] = await Promise.all([
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
      supabase.from("participants").select("id", { count: "exact", head: true }),
    ])
    contestDate = csRes.data?.contest_date ?? null
    startTime = csRes.data?.start_time ?? null
    endTime = csRes.data?.end_time ?? null
    venues = (gymsRes.data ?? []).map((g) => g.name)
    participantCount = partsRes.count ?? 0
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
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#FAFAF7",
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(220,38,38,0.18), transparent 60%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(219,39,119,0.12), transparent 60%)",
          fontFamily: "Pretendard",
          color: "#0A0A0A",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 22px",
              borderRadius: 9999,
              background: "rgba(220,38,38,0.10)",
              border: "2px solid rgba(220,38,38,0.25)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: "#DC2626",
              }}
            />
            <span style={{ color: "#DC2626", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
              {dateBadge}
            </span>
          </div>
          {participantCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                borderRadius: 9999,
                background: "#FFFFFF",
                border: "2px solid #E7E4DD",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: "#16A34A",
                }}
              />
              <span style={{ fontSize: 22, fontWeight: 700, color: "#3F3F3F" }}>
                현재 {participantCount}명 신청
              </span>
            </div>
          )}
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 6,
              color: "#6B6B6B",
              marginBottom: 18,
            }}
          >
            THE CLIMB TOUR
          </div>
          <div
            style={{
              fontSize: 116,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>볼구력</span>
            <span style={{ color: "#DC2626" }}>대회.</span>
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#3F3F3F",
              marginTop: 24,
              maxWidth: 1000,
            }}
          >
            강남 6개 암장 · 하루.
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: "2px solid #E7E4DD",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: 4,
                color: "#A1A1A1",
                marginBottom: 6,
              }}
            >
              VENUES
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#0A0A0A" }}>
              {venueLine}
            </div>
          </div>
          {timeRange && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: 4,
                  color: "#A1A1A1",
                  marginBottom: 6,
                }}
              >
                TIME
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#DC2626",
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
