import { useState } from 'react'
import './PadSimulator.css'

type GameMode = 'bomber' | 'wizard'

type PadDef = {
  id: 0 | 1 | 2 | 3 | 4
  className: string
  label: string
  bomber: { action: string; body: string }
  wizard: { action: string; body: string }
}

const PADS: PadDef[] = [
  {
    id: 2,
    className: 'p2',
    label: '02',
    bomber: {
      action: 'move UP',
      body: '{"action":"move","params":{"direction":"UP"}}',
    },
    wizard: {
      action: 'cast SHIELD',
      body: '{"action":"cast","params":{"spellKey":"SHIELD"}}',
    },
  },
  {
    id: 1,
    className: 'p1',
    label: '01',
    bomber: {
      action: 'move LEFT',
      body: '{"action":"move","params":{"direction":"LEFT"}}',
    },
    wizard: {
      action: 'cast HEAL',
      body: '{"action":"cast","params":{"spellKey":"HEAL"}}',
    },
  },
  {
    id: 3,
    className: 'p3',
    label: '03',
    bomber: {
      action: 'move RIGHT',
      body: '{"action":"move","params":{"direction":"RIGHT"}}',
    },
    wizard: {
      action: 'cast LIGHTNING',
      body: '{"action":"cast","params":{"spellKey":"LIGHTNING"}}',
    },
  },
  {
    id: 0,
    className: 'p0',
    label: '00',
    bomber: {
      action: 'move DOWN',
      body: '{"action":"move","params":{"direction":"DOWN"}}',
    },
    wizard: {
      action: 'cast FIREBALL',
      body: '{"action":"cast","params":{"spellKey":"FIREBALL"}}',
    },
  },
  {
    id: 4,
    className: 'p4',
    label: '04',
    bomber: {
      action: 'bomb',
      body: '{"action":"bomb"}',
    },
    wizard: {
      action: 'cast DEATH_RAY',
      body: '{"action":"cast","params":{"spellKey":"DEATH_RAY"}}',
    },
  },
]

type LogEntry = {
  touch: string
  action: string
  body: string
  at: number
}

export default function PadSimulator({ onPing }: { onPing?: () => void }) {
  const [mode, setMode] = useState<GameMode>('bomber')
  const [active, setActive] = useState<number | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  const press = (pad: PadDef) => {
    const mapping = mode === 'bomber' ? pad.bomber : pad.wizard
    setActive(pad.id)
    window.setTimeout(() => setActive(null), 180)
    setLog((prev) =>
      [
        {
          touch: `TOUCH${pad.id}`,
          action: mapping.action,
          body: mapping.body,
          at: Date.now(),
        },
        ...prev,
      ].slice(0, 6),
    )
    onPing?.()
  }

  return (
    <div className="pad-sim">
      <div className="pad-sim-toolbar">
        <span className="pad-sim-title">PAD SIMULATOR</span>
        <div className="pad-sim-modes" role="group" aria-label="Spilprofil">
          <button
            type="button"
            className={mode === 'bomber' ? 'on' : ''}
            onClick={() => setMode('bomber')}
          >
            BOMBERMAN
          </button>
          <button
            type="button"
            className={mode === 'wizard' ? 'on' : ''}
            onClick={() => setMode('wizard')}
          >
            WIZARD
          </button>
        </div>
      </div>

      <div className="pad-sim-body">
        <div className="pad-sim-ring" aria-label="MKR IoT Carrier pads">
          {PADS.map((pad) => (
            <button
              key={pad.id}
              type="button"
              className={`pad-sim-btn ${pad.className} ${active === pad.id ? 'lit' : ''}`}
              onClick={() => press(pad)}
              aria-label={`TOUCH${pad.id}`}
            >
              {pad.label}
            </button>
          ))}
          <span className="pad-sim-tft">TFT</span>
        </div>

        <div className="pad-sim-out">
          <p className="pad-sim-out-label">
            {mode === 'bomber' ? 'POST …/Bomberman/api/controller/action' : 'POST …/Wizard/api/controller/action'}
          </p>
          {log.length === 0 ? (
            <p className="pad-sim-empty">Tryk en pad — se action + JSON</p>
          ) : (
            <ul className="pad-sim-log">
              {log.map((entry) => (
                <li key={entry.at}>
                  <strong>
                    {entry.touch} → {entry.action}
                  </strong>
                  <code>{entry.body}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
