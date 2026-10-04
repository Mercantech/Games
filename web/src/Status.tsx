import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePad } from './PadContext'
import './Status.css'

const REFRESH_MS = 15_000
const SCORE_KEY = 'mercantec-status-highscore'

type CheckState = 'idle' | 'checking' | 'ok' | 'down'

type ServiceDef = {
  id: string
  name: string
  path: string
  href: string
  accent: 'red' | 'blue' | 'purple'
  bumper: string
  points: number
}

type ServiceResult = {
  state: CheckState
  url: string
  latencyMs: number | null
  lastChecked: Date | null
  error: string | null
  hitPoints: number
}

const SERVICES: ServiceDef[] = [
  {
    id: 'bomberman',
    name: 'Bomberman',
    path: '/Bomberman/api/health',
    href: '/Bomberman/',
    accent: 'red',
    bumper: 'BUMPER A',
    points: 500,
  },
  {
    id: 'wizard',
    name: 'Wizard Duel',
    path: '/Wizard/api/health',
    href: '/Wizard/',
    accent: 'blue',
    bumper: 'BUMPER B',
    points: 750,
  },
  {
    id: 'tetris',
    name: 'Tetris',
    path: '/Tetris/api/health',
    href: '/Tetris/',
    accent: 'purple',
    bumper: 'BUMPER C',
    points: 1000,
  },
]

const FUN_LINES = [
  'Hold maskinen i live — ingen TILT i undervisningen.',
  'Ping = points. Hurtig latency = MULTIBALL-vibes.',
  'Nudge forsigtigt. For hårdt = TILT.',
  'Tre bumpers. Ét highscore. Zero downtime.',
]

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString('da-DK', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function padScore(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(7, '0')
}

function awardForLatency(base: number, ms: number | null): number {
  if (ms == null) return 0
  if (ms < 80) return base * 3
  if (ms < 150) return base * 2
  if (ms < 400) return base
  return Math.max(50, Math.floor(base / 2))
}

function latencyTone(ms: number | null): 'fast' | 'mid' | 'slow' | 'none' {
  if (ms == null) return 'none'
  if (ms < 120) return 'fast'
  if (ms < 400) return 'mid'
  return 'slow'
}

function latencyPct(ms: number | null): number {
  if (ms == null) return 0
  return Math.max(6, Math.min(100, Math.round((ms / 800) * 100)))
}

async function pingHealth(baseUrl: string): Promise<{ latencyMs: number; bodyOk: boolean }> {
  const start = performance.now()
  const res = await fetch(baseUrl, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
  })
  const latencyMs = Math.round(performance.now() - start)
  let bodyOk = res.ok
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try {
      const data = (await res.json()) as { ok?: boolean }
      bodyOk = res.ok && data.ok !== false
    } catch {
      bodyOk = false
    }
  }
  if (!bodyOk) {
    throw new Error(res.ok ? 'Ugyldigt health-svar' : `HTTP ${res.status}`)
  }
  return { latencyMs, bodyOk }
}

type Overall = 'go' | 'degraded' | 'down' | 'boot'

function overallFrom(results: ServiceResult[], checking: boolean): Overall {
  const checked = results.filter((r) => r.state === 'ok' || r.state === 'down')
  if (checked.length === 0) return checking ? 'boot' : 'down'
  const okCount = checked.filter((r) => r.state === 'ok').length
  if (okCount === checked.length) return 'go'
  if (okCount === 0) return 'down'
  return 'degraded'
}

const BANNER: Record<Overall, { label: string; sub: string; className: string }> = {
  go: {
    label: 'MULTIBALL MODE',
    sub: 'Alle bumpers lyser — free game vibes',
    className: 'banner-go',
  },
  degraded: {
    label: 'DRAIN WARNING',
    sub: 'En bumper er mørk — red ball!',
    className: 'banner-degraded',
  },
  down: {
    label: 'TILT',
    sub: 'Ingen hit — maskinen sover',
    className: 'banner-down',
  },
  boot: {
    label: 'BALL IN PLAY',
    sub: 'Plunger trækker… scanner lanes',
    className: 'banner-boot',
  },
}

export default function Status() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { blip } = usePad()
  const [results, setResults] = useState<Record<string, ServiceResult>>(() =>
    Object.fromEntries(
      SERVICES.map((s) => [
        s.id,
        {
          state: 'idle' as CheckState,
          url: '',
          latencyMs: null,
          lastChecked: null,
          error: null,
          hitPoints: 0,
        },
      ]),
    ),
  )
  const [checking, setChecking] = useState(false)
  const [tick, setTick] = useState(0)
  const [lastRunAt, setLastRunAt] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(sessionStorage.getItem(SCORE_KEY) || '0') || 0
    } catch {
      return 0
    }
  })
  const [nudge, setNudge] = useState(false)
  const [ballLane, setBallLane] = useState(0)
  const [funIx, setFunIx] = useState(0)
  const [popups, setPopups] = useState<{ id: string; pts: number; key: number }[]>([])
  const timerRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const ballRef = useRef<number | null>(null)
  const popupKey = useRef(0)

  const pushPopup = useCallback((id: string, pts: number) => {
    const key = ++popupKey.current
    setPopups((p) => [...p, { id, pts, key }])
    window.setTimeout(() => {
      setPopups((p) => p.filter((x) => x.key !== key))
    }, 900)
  }, [])

  const runChecks = useCallback(async () => {
    setChecking(true)
    setFunIx((i) => (i + 1) % FUN_LINES.length)
    setResults((prev) => {
      const next = { ...prev }
      for (const s of SERVICES) {
        next[s.id] = { ...next[s.id], state: 'checking', error: null, hitPoints: 0 }
      }
      return next
    })

    let roundScore = 0

    await Promise.all(
      SERVICES.map(async (svc) => {
        const url = `${origin}${svc.path}`
        try {
          const { latencyMs } = await pingHealth(url)
          const hitPoints = awardForLatency(svc.points, latencyMs)
          roundScore += hitPoints
          blip(latencyMs < 150 ? 'ok' : 'move')
          pushPopup(svc.id, hitPoints)
          setResults((prev) => ({
            ...prev,
            [svc.id]: {
              state: 'ok',
              url,
              latencyMs,
              lastChecked: new Date(),
              error: null,
              hitPoints,
            },
          }))
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Ukendt fejl'
          blip('back')
          setResults((prev) => ({
            ...prev,
            [svc.id]: {
              state: 'down',
              url,
              latencyMs: null,
              lastChecked: new Date(),
              error: message,
              hitPoints: 0,
            },
          }))
        }
      }),
    )

    setScore((prev) => {
      const next = prev + roundScore
      setHighScore((hi) => {
        const best = Math.max(hi, next)
        try {
          sessionStorage.setItem(SCORE_KEY, String(best))
        } catch {
          /* ignore */
        }
        return best
      })
      return next
    })
    if (roundScore > 0) blip('jingle')
    setChecking(false)
    setLastRunAt(Date.now())
    setTick(0)
  }, [origin, blip, pushPopup])

  const doNudge = useCallback(() => {
    if (checking) return
    setNudge(true)
    blip('insert')
    window.setTimeout(() => setNudge(false), 450)
    void runChecks()
  }, [checking, blip, runChecks])

  useEffect(() => {
    void runChecks()
    timerRef.current = window.setInterval(() => {
      void runChecks()
    }, REFRESH_MS)
    countdownRef.current = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 250)
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current)
      if (countdownRef.current != null) window.clearInterval(countdownRef.current)
    }
  }, [runChecks])

  useEffect(() => {
    if (!checking) {
      if (ballRef.current != null) window.clearInterval(ballRef.current)
      return
    }
    ballRef.current = window.setInterval(() => {
      setBallLane((n) => (n + 1) % SERVICES.length)
    }, 280)
    return () => {
      if (ballRef.current != null) window.clearInterval(ballRef.current)
    }
  }, [checking])

  const list = SERVICES.map((s) => results[s.id])
  const overall = overallFrom(list, checking)
  const banner = BANNER[overall]
  const okCount = list.filter((r) => r.state === 'ok').length
  const downCount = list.filter((r) => r.state === 'down').length

  const countdownPct = useMemo(() => {
    if (checking || lastRunAt == null) return checking ? 100 : 0
    const elapsed = Date.now() - lastRunAt
    return Math.max(0, Math.min(100, 100 - (elapsed / REFRESH_MS) * 100))
  }, [checking, lastRunAt, tick])

  const nextInSec = useMemo(() => {
    if (checking || lastRunAt == null) return checking ? 0 : REFRESH_MS / 1000
    const left = Math.ceil((REFRESH_MS - (Date.now() - lastRunAt)) / 1000)
    return Math.max(0, left)
  }, [checking, lastRunAt, tick])

  return (
    <div className={`status-page pinball ${nudge ? 'is-nudge' : ''} overall-${overall}`}>
      <div className="pin-cabinet" aria-hidden="true">
        <span className="pin-chrome left" />
        <span className="pin-chrome right" />
        <span className="pin-screw s1" />
        <span className="pin-screw s2" />
        <span className="pin-screw s3" />
        <span className="pin-screw s4" />
      </div>

      <div className="pin-backglass">
        <p className="blink-line status-blink">ARCADE DIAGNOSTIC</p>
        <h1 className="title-pixel status-title">SERVER PINBALL</h1>
        <p className="status-lede">{FUN_LINES[funIx]}</p>
      </div>

      <div className="pin-scoreboard" aria-live="polite">
        <div className="reel">
          <span className="reel-label">SCORE</span>
          <strong className="reel-digits">{padScore(score)}</strong>
        </div>
        <div className="reel reel-hi">
          <span className="reel-label">HIGH</span>
          <strong className="reel-digits">{padScore(highScore)}</strong>
        </div>
        <div className="reel reel-balls">
          <span className="reel-label">BALLS</span>
          <strong className="reel-digits balls">
            {SERVICES.map((_, i) => (
              <span key={i} className={i < okCount ? 'lit' : ''}>
                ●
              </span>
            ))}
          </strong>
        </div>
      </div>

      <div className={`status-banner ${banner.className}`} role="status">
        <div className="banner-led" aria-hidden="true" />
        <div className="banner-copy">
          <strong>{banner.label}</strong>
          <span>{banner.sub}</span>
        </div>
        <div className="banner-stats">
          <span>
            <em>{okCount}</em> HIT
          </span>
          <span>
            <em>{downCount}</em> MISS
          </span>
          <span>
            <em>{SERVICES.length}</em> LANES
          </span>
        </div>
      </div>

      <div className="status-toolbar pin-controls">
        <button
          type="button"
          className={`status-refresh plunger ${checking ? 'is-busy' : ''}`}
          onClick={() => void runChecks()}
          disabled={checking}
        >
          {checking ? 'BALL IN PLAY…' : 'PLUNGER ▶'}
        </button>
        <button type="button" className="nudge-btn" onClick={doNudge} disabled={checking}>
          NUDGE
        </button>
        <div className="status-countdown" aria-label={`Næste tjek om ${nextInSec} sekunder`}>
          <div className="countdown-track">
            <div className="countdown-fill" style={{ width: `${countdownPct}%` }} />
          </div>
          <span className="status-auto">
            {checking ? 'Bumpers tæller…' : `Auto-plunge ${nextInSec}s`}
          </span>
        </div>
      </div>

      <div className="pin-playfield">
        <div
          className={`pin-ball ${checking ? 'is-rolling' : 'is-rest'}`}
          style={{ ['--lane' as string]: String(ballLane) }}
          aria-hidden="true"
        />

        <ul className="status-grid">
          {SERVICES.map((svc, i) => {
            const r = results[svc.id]
            const stateLabel =
              r.state === 'checking'
                ? 'SPIN'
                : r.state === 'ok'
                  ? 'HIT!'
                  : r.state === 'down'
                    ? 'OUT'
                    : '—'
            const rowClass =
              r.state === 'ok'
                ? 'row-ok'
                : r.state === 'down'
                  ? 'row-down'
                  : r.state === 'checking'
                    ? 'row-check'
                    : 'row-idle'
            const tone = latencyTone(r.latencyMs)
            const popup = popups.find((p) => p.id === svc.id)

            return (
              <li
                key={svc.id}
                className={`status-card bumper accent-${svc.accent} ${rowClass} ${
                  checking && ballLane === i ? 'ball-here' : ''
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="status-card-scan" aria-hidden="true" />
                <div className="bumper-ring" aria-hidden="true" />
                {popup ? (
                  <span key={popup.key} className="hit-popup">
                    +{popup.pts}
                  </span>
                ) : null}

                <div className="status-card-head">
                  <div className="status-id">
                    <span className={`status-dot state-${r.state}`} />
                    <div>
                      <span className="status-bumper-label">{svc.bumper}</span>
                      <span className="status-name">{svc.name}</span>
                    </div>
                  </div>
                  <span className={`status-pill pill-${r.state}`}>{stateLabel}</span>
                </div>

                <div className="latency-block">
                  <div className="latency-top">
                    <span>SPEED</span>
                    <strong className={`lat-${tone}`}>
                      {r.latencyMs != null ? `${r.latencyMs} ms` : '—'}
                    </strong>
                  </div>
                  <div className="latency-bar" aria-hidden="true">
                    <div
                      className={`latency-fill lat-${tone} ${r.state === 'checking' ? 'is-pulse' : ''}`}
                      style={{
                        width: r.state === 'checking' ? '40%' : `${latencyPct(r.latencyMs)}%`,
                      }}
                    />
                  </div>
                </div>

                <dl className="status-meta">
                  <div>
                    <dt>LANE</dt>
                    <dd className="status-url">{r.url || `${origin}${svc.path}`}</dd>
                  </div>
                  <div className="meta-row-split">
                    <div>
                      <dt>SIDST HIT</dt>
                      <dd>{formatTime(r.lastChecked)}</dd>
                    </div>
                    <div>
                      <dt>POINTS</dt>
                      <dd className="pts">{r.hitPoints > 0 ? `+${r.hitPoints}` : '—'}</dd>
                    </div>
                  </div>
                  {r.error ? (
                    <div className="status-err-block">
                      <dt>DRAIN</dt>
                      <dd className="status-err">{r.error}</dd>
                    </div>
                  ) : null}
                </dl>

                <a className="status-open" href={svc.href}>
                  PLAY →
                </a>
              </li>
            )
          })}
        </ul>

        <div className="pin-flippers" aria-hidden="true">
          <span className={`flipper left ${checking ? 'kick' : ''}`} />
          <span className={`flipper right ${checking ? 'kick' : ''}`} />
        </div>
      </div>

      <p className="pin-footer hint-pixel">
        PLUNGER = SCAN · NUDGE = FORCE · HURTIG LATENCY = ×2/×3
      </p>
    </div>
  )
}
