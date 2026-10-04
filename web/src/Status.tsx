import { useCallback, useEffect, useRef, useState } from 'react'
import './Status.css'

const REFRESH_MS = 15_000

type CheckState = 'idle' | 'checking' | 'ok' | 'down'

type ServiceDef = {
  id: string
  name: string
  path: string
}

type ServiceResult = {
  state: CheckState
  url: string
  latencyMs: number | null
  lastChecked: Date | null
  error: string | null
}

const SERVICES: ServiceDef[] = [
  { id: 'bomberman', name: 'Bomberman', path: '/Bomberman/api/health' },
  { id: 'wizard', name: 'Wizard Duel', path: '/Wizard/api/health' },
]

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString('da-DK', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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

type Overall = 'go' | 'degraded' | 'down'

function overallFrom(results: ServiceResult[]): Overall {
  const checked = results.filter((r) => r.state === 'ok' || r.state === 'down')
  if (checked.length === 0) return 'down'
  const okCount = checked.filter((r) => r.state === 'ok').length
  if (okCount === checked.length) return 'go'
  if (okCount === 0) return 'down'
  return 'degraded'
}

const BANNER: Record<Overall, { label: string; className: string }> = {
  go: { label: 'ALL SYSTEMS GO', className: 'banner-go' },
  degraded: { label: 'DEGRADED', className: 'banner-degraded' },
  down: { label: 'DOWN', className: 'banner-down' },
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
  const timerRef = useRef<number | null>(null)

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
  }, [origin])

  useEffect(() => {
    void runChecks()
    timerRef.current = window.setInterval(() => {
      void runChecks()
    }, REFRESH_MS)
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current)
    }
  }, [runChecks])

  const list = SERVICES.map((s) => results[s.id])
  const overall = overallFrom(list)
  const banner = BANNER[overall]

  return (
    <div className="status-page">
      <p className="blink-line status-blink">SYSTEM DIAGNOSTIC</p>
      <h1 className="title-pixel status-title">STATUS</h1>
      <p className="status-lede">Live tjek af spil-API&apos;er fra browseren.</p>

      <div className={`status-banner ${banner.className}`} role="status">
        {banner.label}
      </div>

      <div className="status-toolbar">
        <button type="button" className="status-refresh" onClick={() => void runChecks()} disabled={checking}>
          {checking ? 'TJEKKER…' : 'OPDATER'}
        </button>
        <span className="status-auto">Auto hver {REFRESH_MS / 1000}s</span>
      </div>

      <ul className="status-grid">
        {SERVICES.map((svc) => {
          const r = results[svc.id]
          const stateLabel =
            r.state === 'checking'
              ? 'TJEKKER'
              : r.state === 'ok'
                ? 'OK'
                : r.state === 'down'
                  ? 'NEDE'
                  : '—'
          const rowClass =
            r.state === 'ok' ? 'row-ok' : r.state === 'down' ? 'row-down' : r.state === 'checking' ? 'row-check' : ''

          return (
            <li key={svc.id} className={`status-card ${rowClass}`}>
              <div className="status-card-head">
                <span className="status-name">{svc.name}</span>
                <span className={`status-pill pill-${r.state}`}>{stateLabel}</span>
              </div>
              <dl className="status-meta">
                <div>
                  <dt>URL</dt>
                  <dd className="status-url">{r.url || `${origin}${svc.path}`}</dd>
                </div>
                <div>
                  <dt>Latency</dt>
                  <dd>{r.latencyMs != null ? `${r.latencyMs} ms` : '—'}</dd>
                </div>
                <div>
                  <dt>Sidst tjekket</dt>
                  <dd>{formatTime(r.lastChecked)}</dd>
                </div>
                {r.error ? (
                  <div className="status-err-block">
                    <dt>Fejl</dt>
                    <dd className="status-err">{r.error}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
