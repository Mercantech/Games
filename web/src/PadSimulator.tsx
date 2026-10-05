import { useEffect, useState } from 'react'
import './PadSimulator.css'

export type GameMode = 'bomber' | 'wizard' | 'tetris' | 'pong'

type PadMapping = { action: string; body: string }

type PadDef = {
  id: 0 | 1 | 2 | 3 | 4
  className: string
  label: string
  bomber: PadMapping
  wizard: PadMapping
  tetris: PadMapping
  pong: PadMapping
}

export const GAME_BANNERS: Record<
  GameMode,
  { title: string; path: string; accent: string; tagline: string }
> = {
  bomber: {
    title: 'BOMBERMAN',
    path: '/Bomberman',
    accent: 'banner-bomber',
    tagline: 'Nav · bomb · multiplayer',
  },
  wizard: {
    title: 'WIZARD DUEL',
    path: '/Wizard',
    accent: 'banner-wizard',
    tagline: 'Cast spells · mana · last standing',
  },
  tetris: {
    title: 'TETRIS',
    path: '/Tetris',
    accent: 'banner-tetris',
    tagline: 'Move · rotate · hard drop · battle',
  },
  pong: {
    title: 'PONG',
    path: '/Pong',
    accent: 'banner-pong',
    tagline: 'Paddle UP / DOWN · classic duel',
  },
}

export const LOOP_SNIPPETS: Record<GameMode, string> = {
  bomber: `void loop() {
  carrier.Buttons.update();

  // Heartbeat hvert 3 sek
  // POST /Bomberman/api/controller/heartbeat

  // === BOMBERMAN pad-map ===
  if (carrier.Buttons.getTouch(TOUCH2)) sendAction("move", "UP");
  if (carrier.Buttons.getTouch(TOUCH0)) sendAction("move", "DOWN");
  if (carrier.Buttons.getTouch(TOUCH1)) sendAction("move", "LEFT");
  if (carrier.Buttons.getTouch(TOUCH3)) sendAction("move", "RIGHT");
  if (carrier.Buttons.onTouchDown(TOUCH4)) sendAction("bomb");
}`,
  wizard: `void loop() {
  carrier.Buttons.update();

  // Heartbeat hvert 3 sek
  // POST /Wizard/api/controller/heartbeat

  // === WIZARD DUEL pad-map ===
  if (carrier.Buttons.onTouchDown(TOUCH0))
    castSpell("FIREBALL", 1);
  if (carrier.Buttons.onTouchDown(TOUCH1))
    castSpell("HEAL");
  if (carrier.Buttons.onTouchDown(TOUCH2))
    castSpell("SHIELD");
  if (carrier.Buttons.onTouchDown(TOUCH3))
    castSpell("LIGHTNING");
  if (carrier.Buttons.onTouchDown(TOUCH4))
    castSpell("DEATH_RAY", 1);
}`,
  tetris: `void loop() {
  carrier.Buttons.update();

  // Heartbeat hvert 3 sek
  // POST /Tetris/api/controller/heartbeat

  // === TETRIS pad-map ===
  if (carrier.Buttons.getTouch(TOUCH1)) sendAction("move", "LEFT");
  if (carrier.Buttons.getTouch(TOUCH3)) sendAction("move", "RIGHT");
  if (carrier.Buttons.getTouch(TOUCH0)) sendAction("move", "DOWN");
  if (carrier.Buttons.onTouchDown(TOUCH2)) sendAction("rotate");
  if (carrier.Buttons.onTouchDown(TOUCH4)) sendAction("hardDrop");
}`,
  pong: `void loop() {
  carrier.Buttons.update();

  // Heartbeat hvert 3 sek
  // POST /Pong/api/controller/heartbeat

  // === PONG pad-map ===
  if (carrier.Buttons.getTouch(TOUCH0)) sendAction("move", "UP");
  if (carrier.Buttons.getTouch(TOUCH2)) sendAction("move", "DOWN");
  // TOUCH1 / TOUCH3 / TOUCH4 → stop (valgfrit)
  // if (carrier.Buttons.onTouchDown(TOUCH1)) sendAction("stop");
}`,
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
    tetris: {
      action: 'rotate',
      body: '{"action":"rotate"}',
    },
    pong: {
      action: 'move DOWN',
      body: '{"action":"move","params":{"direction":"DOWN"}}',
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
    tetris: {
      action: 'move LEFT',
      body: '{"action":"move","params":{"direction":"LEFT"}}',
    },
    pong: {
      action: 'stop',
      body: '{"action":"stop"}',
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
    tetris: {
      action: 'move RIGHT',
      body: '{"action":"move","params":{"direction":"RIGHT"}}',
    },
    pong: {
      action: 'stop',
      body: '{"action":"stop"}',
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
    tetris: {
      action: 'move DOWN',
      body: '{"action":"move","params":{"direction":"DOWN"}}',
    },
    pong: {
      action: 'move UP',
      body: '{"action":"move","params":{"direction":"UP"}}',
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
    tetris: {
      action: 'hardDrop',
      body: '{"action":"hardDrop"}',
    },
    pong: {
      action: 'stop',
      body: '{"action":"stop"}',
    },
  },
]

type LogEntry = {
  touch: string
  action: string
  body: string
  at: number
}

type Props = {
  mode?: GameMode
  onModeChange?: (mode: GameMode) => void
  onPing?: () => void
}

export default function PadSimulator({ mode: controlledMode, onModeChange, onPing }: Props) {
  const [internalMode, setInternalMode] = useState<GameMode>('bomber')
  const mode = controlledMode ?? internalMode
  const [active, setActive] = useState<number | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  const setMode = (next: GameMode) => {
    if (controlledMode == null) setInternalMode(next)
    onModeChange?.(next)
    setLog([])
  }

  useEffect(() => {
    setLog([])
  }, [mode])

  const press = (pad: PadDef) => {
    const mapping =
      mode === 'bomber'
        ? pad.bomber
        : mode === 'wizard'
          ? pad.wizard
          : mode === 'tetris'
            ? pad.tetris
            : pad.pong
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

  const banner = GAME_BANNERS[mode]
  const postHint = `POST …${banner.path}/api/controller/action`

  return (
    <div className={`pad-sim mode-${mode}`}>
      <div className={`pad-game-banner ${banner.accent}`} role="status">
        <span className="pad-game-banner-mark">NOW PLAYING</span>
        <strong className="pad-game-banner-title">{banner.title}</strong>
        <span className="pad-game-banner-path">{banner.path}</span>
        <span className="pad-game-banner-tag">{banner.tagline}</span>
      </div>

      <div className="pad-sim-toolbar">
        <span className="pad-sim-title">PAD SIMULATOR</span>
        <div className="pad-sim-modes" role="group" aria-label="Spilprofil">
          <button
            type="button"
            className={`mode-bomber ${mode === 'bomber' ? 'on' : ''}`}
            onClick={() => setMode('bomber')}
          >
            BOMBERMAN
          </button>
          <button
            type="button"
            className={`mode-wizard ${mode === 'wizard' ? 'on' : ''}`}
            onClick={() => setMode('wizard')}
          >
            WIZARD
          </button>
          <button
            type="button"
            className={`mode-tetris ${mode === 'tetris' ? 'on' : ''}`}
            onClick={() => setMode('tetris')}
          >
            TETRIS
          </button>
          <button
            type="button"
            className={`mode-pong ${mode === 'pong' ? 'on' : ''}`}
            onClick={() => setMode('pong')}
          >
            PONG
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
          <p className="pad-sim-out-label">{postHint}</p>
          {log.length === 0 ? (
            <p className="pad-sim-empty">Tryk en pad — se action + JSON for {banner.title}</p>
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
