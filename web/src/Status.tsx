import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePad } from './PadContext'
import './Status.css'

const REFRESH_MS = 15_000
const SCORE_KEY = 'mercantec-pong-highscore'

type CheckState = 'idle' | 'checking' | 'ok' | 'down'

type ServiceDef = {
  id: string
  name: string
  path: string
  href: string
  accent: 'red' | 'blue' | 'purple' | 'orange'
  lane: string
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
    lane: 'LANE 1',
    points: 1,
  },
  {
    id: 'wizard',
    name: 'Wizard Duel',
    path: '/Wizard/api/health',
    href: '/Wizard/',
    accent: 'blue',
    lane: 'LANE 2',
    points: 1,
  },
  {
    id: 'tetris',
    name: 'Tetris',
    path: '/Tetris/api/health',
    href: '/Tetris/',
    accent: 'purple',
    lane: 'LANE 3',
    points: 1,
  },
  {
    id: 'pong',
    name: 'Pong',
    path: '/Pong/api/health',
    href: '/Pong/',
    accent: 'orange',
    lane: 'LANE 4',
    points: 1,
  },
]

const FUN_LINES = [
  'Ping går ud. Pong kommer hjem. Zero lag = clean rally.',
  'Hver health-check er et slag over nettet.',
  'Miss = bolden går ud. HIT = point til dig.',
  'Fire lanes. Ét court. Hold bolden i spil.',
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
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

function awardForLatency(base: number, ms: number | null): number {
  if (ms == null) return 0
  if (ms < 80) return base + 2
  if (ms < 150) return base + 1
  if (ms < 400) return base
  return base
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
    label: 'RALLY ON',
    sub: 'Alle lanes returnerer bolden',
    className: 'banner-go',
  },
  degraded: {
    label: 'EDGE BALL',
    sub: 'En lane missede — hold fokus',
    className: 'banner-degraded',
  },
  down: {
    label: 'OUT OF BOUNDS',
    sub: 'Ingen pong — bolden er ude',
    className: 'banner-down',
  },
  boot: {
    label: 'SERVE…',
    sub: 'Ping på vej over banen',
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
  const [playerScore, setPlayerScore] = useState(0)
  const [serverScore, setServerScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(sessionStorage.getItem(SCORE_KEY) || '0') || 0
    } catch {
      return 0
    }
  })
  const [funIx, setFunIx] = useState(0)
  const [activeLane, setActiveLane] = useState<number | null>(null)
  const [ballPhase, setBallPhase] = useState<'idle' | 'ping' | 'pong' | 'miss'>('idle')
  const [flashWord, setFlashWord] = useState<'PING' | 'PONG' | 'MISS' | null>(null)
  const [popups, setPopups] = useState<{ id: string; pts: number; key: number }[]>([])
  const timerRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const popupKey = useRef(0)

  const pushPopup = useCallback((id: string, pts: number) => {
    const key = ++popupKey.current
    setPopups((p) => [...p, { id, pts, key }])
    window.setTimeout(() => {
      setPopups((p) => p.filter((x) => x.key !== key))
    }, 850)
  }, [])

  const flash = useCallback((word: 'PING' | 'PONG' | 'MISS') => {
    setFlashWord(word)
    window.setTimeout(() => setFlashWord(null), 420)
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

    let hits = 0
    let misses = 0

    for (let i = 0; i < SERVICES.length; i++) {
      const svc = SERVICES[i]
      setActiveLane(i)
      setBallPhase('ping')
      flash('PING')
      blip('move')

      const url = `${origin}${svc.path}`
      try {
        const { latencyMs } = await pingHealth(url)
        const hitPoints = awardForLatency(svc.points, latencyMs)
        hits += hitPoints
        setBallPhase('pong')
        flash('PONG')
        blip('ok')
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
        await new Promise((r) => window.setTimeout(r, 180))
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ukendt fejl'
        misses += 1
        setBallPhase('miss')
        flash('MISS')
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
        await new Promise((r) => window.setTimeout(r, 220))
      }
    }

    setPlayerScore((prev) => {
      const next = prev + hits
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
    setServerScore((prev) => prev + misses)
    if (hits > 0 && misses === 0) blip('jingle')
    setActiveLane(null)
    setBallPhase('idle')
    setChecking(false)
    setLastRunAt(Date.now())
    setTick(0)
  }, [origin, blip, pushPopup, flash])

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
    <div className={`status-page pong overall-${overall} ${checking ? 'is-rally' : ''}`}>
      <div className="pong-court" aria-hidden="true">
        <div className="pong-net" />
        <div className={`pong-paddle left ${checking ? 'swing' : ''}`} />
        <div className={`pong-paddle right ${ballPhase === 'pong' ? 'swing' : ''}`} />
        <div
          className={`pong-ball phase-${ballPhase} ${activeLane != null ? `lane-${activeLane}` : ''}`}
        />
        {flashWord ? <div className={`pong-flash word-${flashWord.toLowerCase()}`}>{flashWord}</div> : null}
      </div>

      <header className="pong-header">
        <p className="blink-line status-blink">TABLE TENNIS HEALTH</p>
        <h1 className="title-pixel status-title">STATUS PONG</h1>
        <p className="status-lede">{FUN_LINES[funIx]}</p>
      </header>

      <div className="pong-scoreboard" aria-live="polite">
        <div className="pong-side">
          <span className="pong-who">YOU</span>
          <strong className="pong-big">{padScore(playerScore)}</strong>
        </div>
        <div className="pong-vs">
          <span>VS</span>
          <em>HIGH {padScore(highScore)}</em>
        </div>
        <div className="pong-side right">
          <span className="pong-who">MISS</span>
          <strong className="pong-big dim">{padScore(serverScore)}</strong>
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
            <em>{okCount}</em> PONG
          </span>
          <span>
            <em>{downCount}</em> MISS
          </span>
          <span>
            <em>{SERVICES.length}</em> LANES
          </span>
        </div>
      </div>

      <div className="status-toolbar pong-controls">
        <button
          type="button"
          className={`status-refresh serve-btn ${checking ? 'is-busy' : ''}`}
          onClick={() => void runChecks()}
          disabled={checking}
        >
          {checking ? 'RALLY…' : 'SERVE / PING'}
        </button>
        <div className="status-countdown" aria-label={`Næste tjek om ${nextInSec} sekunder`}>
          <div className="countdown-track">
            <div className="countdown-fill" style={{ width: `${countdownPct}%` }} />
          </div>
          <span className="status-auto">
            {checking ? 'Bolden er i spil…' : `Auto-serve ${nextInSec}s`}
          </span>
        </div>
      </div>

      <ul className="status-grid">
        {SERVICES.map((svc, i) => {
          const r = results[svc.id]
          const stateLabel =
            r.state === 'checking'
              ? 'PING…'
              : r.state === 'ok'
                ? 'PONG'
                : r.state === 'down'
                  ? 'MISS'
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
          const isActive = activeLane === i

          return (
            <li
              key={svc.id}
              className={`status-card pong-lane accent-${svc.accent} ${rowClass} ${
                isActive ? 'is-active' : ''
              }`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="status-card-scan" aria-hidden="true" />
              {popup ? (
                <span key={popup.key} className="hit-popup">
                  +{popup.pts}
                </span>
              ) : null}

              <div className="status-card-head">
                <div className="status-id">
                  <span className={`status-dot state-${r.state}`} />
                  <div>
                    <span className="status-bumper-label">{svc.lane}</span>
                    <span className="status-name">{svc.name}</span>
                  </div>
                </div>
                <span className={`status-pill pill-${r.state}`}>{stateLabel}</span>
              </div>

              <div className="latency-block">
                <div className="latency-top">
                  <span>RTT</span>
                  <strong className={`lat-${tone}`}>
                    {r.latencyMs != null ? `${r.latencyMs} ms` : '—'}
                  </strong>
                </div>
                <div className="latency-bar" aria-hidden="true">
                  <div
                    className={`latency-fill lat-${tone} ${r.state === 'checking' ? 'is-pulse' : ''}`}
                    style={{
                      width: r.state === 'checking' ? '55%' : `${latencyPct(r.latencyMs)}%`,
                    }}
                  />
                </div>
              </div>

              <dl className="status-meta">
                <div>
                  <dt>ENDPOINT</dt>
                  <dd className="status-url">{r.url || `${origin}${svc.path}`}</dd>
                </div>
                <div className="meta-row-split">
                  <div>
                    <dt>SIDST PING</dt>
                    <dd>{formatTime(r.lastChecked)}</dd>
                  </div>
                  <div>
                    <dt>POINTS</dt>
                    <dd className="pts">{r.hitPoints > 0 ? `+${r.hitPoints}` : '—'}</dd>
                  </div>
                </div>
                {r.error ? (
                  <div className="status-err-block">
                    <dt>MISS REASON</dt>
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

      <p className="pong-footer hint-pixel">SERVE = SCAN · PING → PONG · HURTIG RTT = BONUS POINT</p>
    </div>
  )
}
