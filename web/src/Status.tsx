import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Status.css'

const REFRESH_MS = 15_000

type CheckState = 'idle' | 'checking' | 'ok' | 'down'

type ServiceDef = {
  id: string
  name: string
  path: string
  href: string
  accent: 'red' | 'blue' | 'purple'
  tag: string
}

type ServiceResult = {
  state: CheckState
  url: string
  latencyMs: number | null
  lastChecked: Date | null
  error: string | null
}

const SERVICES: ServiceDef[] = [
  {
    id: 'bomberman',
    name: 'Bomberman',
    path: '/Bomberman/api/health',
    href: '/Bomberman/',
    accent: 'red',
    tag: 'PIN · BOMBS',
  },
  {
    id: 'wizard',
    name: 'Wizard Duel',
    path: '/Wizard/api/health',
    href: '/Wizard/',
    accent: 'blue',
    tag: 'SPELLS · MANA',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    path: '/Tetris/api/health',
    href: '/Tetris/',
    accent: 'purple',
    tag: 'BATTLE · GARBAGE',
  },
]

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString('da-DK', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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
    label: 'ALL SYSTEMS GO',
    sub: 'Alle spil svarer',
    className: 'banner-go',
  },
  degraded: {
    label: 'DEGRADED',
    sub: 'Nogle services er nede',
    className: 'banner-degraded',
  },
  down: {
    label: 'SYSTEMS DOWN',
    sub: 'Ingen health-svar',
    className: 'banner-down',
  },
  boot: {
    label: 'BOOTING…',
    sub: 'Scanner endpoints',
    className: 'banner-boot',
  },
}

export default function Status() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
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
        },
      ]),
    ),
  )
  const [checking, setChecking] = useState(false)
  const [tick, setTick] = useState(0)
  const [lastRunAt, setLastRunAt] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)

  const runChecks = useCallback(async () => {
    setChecking(true)
    setResults((prev) => {
      const next = { ...prev }
      for (const s of SERVICES) {
        next[s.id] = { ...next[s.id], state: 'checking', error: null }
      }
      return next
    })

    await Promise.all(
      SERVICES.map(async (svc) => {
        const url = `${origin}${svc.path}`
        try {
          const { latencyMs } = await pingHealth(url)
          setResults((prev) => ({
            ...prev,
            [svc.id]: {
              state: 'ok',
              url,
              latencyMs,
              lastChecked: new Date(),
              error: null,
            },
          }))
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Ukendt fejl'
          setResults((prev) => ({
            ...prev,
            [svc.id]: {
              state: 'down',
              url,
              latencyMs: null,
              lastChecked: new Date(),
              error: message,
            },
          }))
        }
      }),
    )
    setChecking(false)
    setLastRunAt(Date.now())
    setTick(0)
  }, [origin])

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
    <div className="status-page">
      <div className="status-radar" aria-hidden="true">
        <span className="radar-ring r1" />
        <span className="radar-ring r2" />
        <span className="radar-ring r3" />
        <span className="radar-sweep" />
        <span className="radar-core" />
      </div>

      <p className="blink-line status-blink">SYSTEM DIAGNOSTIC</p>
      <h1 className="title-pixel status-title">STATUS</h1>
      <p className="status-lede">Live health fra browseren — ping, latency og uptime-vibe.</p>

      <div className={`status-banner ${banner.className}`} role="status">
        <div className="banner-led" aria-hidden="true" />
        <div className="banner-copy">
          <strong>{banner.label}</strong>
          <span>{banner.sub}</span>
        </div>
        <div className="banner-stats">
          <span>
            <em>{okCount}</em> UP
          </span>
          <span>
            <em>{downCount}</em> DOWN
          </span>
          <span>
            <em>{SERVICES.length}</em> NODES
          </span>
        </div>
      </div>

      <div className="status-toolbar">
        <button
          type="button"
          className={`status-refresh ${checking ? 'is-busy' : ''}`}
          onClick={() => void runChecks()}
          disabled={checking}
        >
          {checking ? 'SCANNER…' : 'OPDATER NU'}
        </button>
        <div className="status-countdown" aria-label={`Næste tjek om ${nextInSec} sekunder`}>
          <div className="countdown-track">
            <div className="countdown-fill" style={{ width: `${countdownPct}%` }} />
          </div>
          <span className="status-auto">
            {checking ? 'Scanner…' : `Næste scan ${nextInSec}s`}
          </span>
        </div>
      </div>

      <ul className="status-grid">
        {SERVICES.map((svc, i) => {
          const r = results[svc.id]
          const stateLabel =
            r.state === 'checking'
              ? 'TJEKKER'
              : r.state === 'ok'
                ? 'ONLINE'
                : r.state === 'down'
                  ? 'OFFLINE'
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

          return (
            <li
              key={svc.id}
              className={`status-card accent-${svc.accent} ${rowClass}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="status-card-scan" aria-hidden="true" />
              <div className="status-card-head">
                <div className="status-id">
                  <span className={`status-dot state-${r.state}`} />
                  <div>
                    <span className="status-name">{svc.name}</span>
                    <span className="status-tag">{svc.tag}</span>
                  </div>
                </div>
                <span className={`status-pill pill-${r.state}`}>{stateLabel}</span>
              </div>

              <div className="latency-block">
                <div className="latency-top">
                  <span>LATENCY</span>
                  <strong className={`lat-${tone}`}>
                    {r.latencyMs != null ? `${r.latencyMs} ms` : '—'}
                  </strong>
                </div>
                <div className="latency-bar" aria-hidden="true">
                  <div
                    className={`latency-fill lat-${tone} ${r.state === 'checking' ? 'is-pulse' : ''}`}
                    style={{ width: r.state === 'checking' ? '40%' : `${latencyPct(r.latencyMs)}%` }}
                  />
                </div>
              </div>

              <dl className="status-meta">
                <div>
                  <dt>ENDPOINT</dt>
                  <dd className="status-url">{r.url || `${origin}${svc.path}`}</dd>
                </div>
                <div>
                  <dt>SIDST TJEKKET</dt>
                  <dd>{formatTime(r.lastChecked)}</dd>
                </div>
                {r.error ? (
                  <div className="status-err-block">
                    <dt>FEJL</dt>
                    <dd className="status-err">{r.error}</dd>
                  </div>
                ) : null}
              </dl>

              <a className="status-open" href={svc.href}>
                ÅBN SPIL →
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
