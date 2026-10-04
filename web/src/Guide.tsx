import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InoCode } from './InoCode'
import PadSimulator from './PadSimulator'
import { usePad, type PadButton } from './PadContext'
import './Guide.css'

const CARRIER_DOC =
  'https://docs.arduino.cc/tutorials/mkr-iot-carrier/mkr-iot-carrier-01-technical-reference/'
const CARRIER_IMG = '/mkr-iot-carrier-pads.png'

const SETUP_SNIPPET = `// Games-repo: arduino/MercantecGamesController/config.h
#define WIFI_SSID      "DIT_WIFI"
#define WIFI_PASS      "DIT_PASSWORD"
#define SERVER_HOST    "games.mercantec.tech"
#define PLAYER_NAME    "Arduino"
#define GAME_PIN       "1234"   // Bomberman/Tetris/Pong. Wizard: ""

#define GAME_MODE_BOMBERMAN  1
#define GAME_MODE_WIZARD     2
#define GAME_MODE_TETRIS     3
#define GAME_MODE_PONG       4
#define GAME_MODE            GAME_MODE_BOMBERMAN
// Skift til GAME_MODE_WIZARD, GAME_MODE_TETRIS eller GAME_MODE_PONG.

#define USE_HTTPS      1
// MercantecGamesController.ino inkluderer config.h
// og sætter GAME_BASE_PATH + SERVER_PORT automatisk.`

const JOIN_SNIPPET = `bool doJoin() {
  String path = apiPath("/api/controller/join");
  String body =
    "{\\"pin\\":\\"" + String(GAME_PIN) +
    "\\",\\"name\\":\\"" + String(PLAYER_NAME) +
    "\\",\\"deviceId\\":\\"" + deviceId + "\\"}";

  http.beginRequest();
  http.post(path);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("Content-Length", body.length());
  http.beginBody();
  http.print(body);
  http.endRequest();

  int status = http.responseStatusCode();
  String resp = http.responseBody();
  // Parse playerId fra resp...
  return status == 200;
}`

const LOOP_SNIPPET = `void loop() {
  carrier.Buttons.update();

  // Heartbeat hvert 3 sek
  // POST {GAME_BASE_PATH}/api/controller/heartbeat

  // Nav-profil (Bomberman):
  if (carrier.Buttons.getTouch(TOUCH2)) sendAction("move", "UP");
  if (carrier.Buttons.getTouch(TOUCH0)) sendAction("move", "DOWN");
  if (carrier.Buttons.getTouch(TOUCH1)) sendAction("move", "LEFT");
  if (carrier.Buttons.getTouch(TOUCH3)) sendAction("move", "RIGHT");
  if (carrier.Buttons.onTouchDown(TOUCH4)) sendAction("bomb");

  // Ability-profil (Wizard) i stedet:
  // if (carrier.Buttons.onTouchDown(TOUCH0))
  //   castSpell("FIREBALL", 1);
}`

const ACTION_SNIPPET = `// Bomberman
void sendAction(const char* action, const char* direction = nullptr) {
  String path = apiPath("/api/controller/action");
  String body =
    "{\\"pin\\":\\"" + String(GAME_PIN) +
    "\\",\\"playerId\\":\\"" + playerId +
    "\\",\\"action\\":\\"" + String(action) + "\\"";
  if (direction) {
    body += ",\\"params\\":{\\"direction\\":\\"" +
            String(direction) + "\\"}";
  }
  body += "}";
  // http.post(path) med body...
}

// Wizard
void castSpell(const char* spellKey, int targetId = -1) {
  String path = apiPath("/api/controller/action");
  String body =
    "{\\"deviceId\\":\\"" + deviceId +
    "\\",\\"playerId\\":\\"" + playerId +
    "\\",\\"action\\":\\"cast\\","
    "\\"params\\":{\\"spellKey\\":\\"" +
    String(spellKey) + "\\"";
  if (targetId >= 0)
    body += ",\\"targetId\\":" + String(targetId);
  body += "}}";
  // http.post(path) med body...
}`

type Track = 'quick' | 'full'

type Stage = { id: string; label: string; title: string }

const FULL_STAGES: Stage[] = [
  { id: 'flow', label: 'FLOW', title: 'Spil-flow' },
  { id: 'hardware', label: 'HW', title: 'Hardware' },
  { id: 'setup', label: 'CFG', title: 'Sketch-setup' },
  { id: 'api', label: 'API', title: 'API-kontrakt' },
  { id: 'pads', label: 'PAD', title: 'Pad-mapping' },
  { id: 'bomberman', label: 'BM', title: 'Bomberman' },
  { id: 'wizard', label: 'WZ', title: 'Wizard Duel' },
  { id: 'tetris', label: 'TR', title: 'Tetris' },
  { id: 'pong', label: 'PG', title: 'Pong' },
  { id: 'checklist', label: 'OK', title: 'Checklist' },
]

const QUICK_STAGES: Stage[] = [
  { id: 'setup', label: 'CFG', title: 'Config' },
  { id: 'pads', label: 'PAD', title: 'Pads' },
  { id: 'play', label: 'PLAY', title: 'Vælg spil' },
  { id: 'checklist', label: 'OK', title: 'Check' },
]

const CHECK_ITEMS = [
  'WIFI_SSID / WIFI_PASS sat i config.h',
  'SERVER_HOST = games.mercantec.tech, USE_HTTPS = 1',
  'GAME_MODE matcher spillet (Bomberman / Wizard / Tetris / Pong)',
  'Bomberman / Tetris / Pong: gyldig GAME_PIN fra lobby',
  'Root-cert uploadet til MKR WiFi 1010',
  'Biblioteker: Carrier, WiFiNINA, HttpClient',
  'Serial Monitor 115200 — join OK + playerId',
]

const QUICK_CHECKS = [
  'MercantecGamesController + config.h klar',
  'WiFi + GAME_MODE sat',
  'Sketch uploaded + Serial join OK',
  'Arena åbnet i browser',
]

export default function Guide() {
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()
  const [track, setTrack] = useState<Track>('quick')
  const stages = track === 'quick' ? QUICK_STAGES : FULL_STAGES
  const [stage, setStage] = useState(0)
  const stageRef = useRef(0)
  const [checks, setChecks] = useState<boolean[]>(() => CHECK_ITEMS.map(() => false))
  const [quickChecks, setQuickChecks] = useState<boolean[]>(() => QUICK_CHECKS.map(() => false))

  const stageIds = useMemo(() => stages.map((s) => s.id), [stages])

  const goStage = (index: number) => {
    const list = track === 'quick' ? QUICK_STAGES : FULL_STAGES
    const next = Math.max(0, Math.min(list.length - 1, index))
    stageRef.current = next
    setStage(next)
    document.getElementById(list[next].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const switchTrack = (next: Track) => {
    if (next === track) return
    setTrack(next)
    stageRef.current = 0
    setStage(0)
    blip('ok')
    window.setTimeout(() => {
      const list = next === 'quick' ? QUICK_STAGES : FULL_STAGES
      document.getElementById(list[0].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  useEffect(() => {
    const onPad = (button: PadButton) => {
      if (button === 'b') {
        blip('back')
        navigate('/')
        return
      }
      if (button === 'select') {
        blip('move')
        goStage(0)
        return
      }
      if (button === 'down' || button === 'right') {
        goStage(stageRef.current + 1)
        blip('move')
        return
      }
      if (button === 'up' || button === 'left') {
        goStage(stageRef.current - 1)
        blip('move')
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, navigate, track])

  useEffect(() => {
    const nodes = stageIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    if (!nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible?.target?.id) return
        const idx = stageIds.indexOf(visible.target.id)
        if (idx >= 0) {
          stageRef.current = idx
          setStage(idx)
        }
      },
      { root: null, rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [stageIds])

  const toggleCheck = (i: number) => {
    setChecks((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
    blip('ok')
  }

  const toggleQuick = (i: number) => {
    setQuickChecks((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
    blip('ok')
  }

  const checkList = track === 'quick' ? QUICK_CHECKS : CHECK_ITEMS
  const checkState = track === 'quick' ? quickChecks : checks
  const done = checkState.filter(Boolean).length

  return (
    <div className="guide-layout">
      <aside className="guide-rail" aria-label="Stages">
        <p className="rail-title">TRACK</p>
        <div className="track-switch" role="group" aria-label="Undervisningsspor">
          <button
            type="button"
            className={track === 'quick' ? 'on' : ''}
            onClick={() => switchTrack('quick')}
          >
            15 MIN
          </button>
          <button
            type="button"
            className={track === 'full' ? 'on' : ''}
            onClick={() => switchTrack('full')}
          >
            FULL
          </button>
        </div>
        <p className="rail-progress">
          {String(stage + 1).padStart(2, '0')}/{String(stages.length).padStart(2, '0')}
        </p>
        <nav className="rail-nav">
          {stages.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`rail-item ${stage === i ? 'active' : ''}`}
              onClick={() => {
                goStage(i)
                blip('move')
              }}
            >
              <span className="rail-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rail-label">{s.label}</span>
              <span className="rail-name">{s.title}</span>
            </button>
          ))}
        </nav>
        <Link className="rail-back" to="/">
          ◄ SELECT
        </Link>
      </aside>

      <article className="guide">
        <header className="guide-hero">
          <div className="hero-top">
            <p className="guide-kicker">INSTRUCTION BOOKLET</p>
            <span className="hero-chip">{track === 'quick' ? '15 MIN' : 'FULL'}</span>
          </div>
          <h1>OPLÀ CONTROLLER MANUAL</h1>
          <p className="hero-lede">
            {track === 'quick'
              ? 'Hurtig track: config → pads → vælg spil (Bomberman / Wizard / Tetris / Pong) → checklist. Skift til FULL for API-detaljer.'
              : 'Fuld walkthrough: fra WiFi til live arena på games.mercantec.tech (inkl. Tetris og Pong).'}{' '}
            Hardware: MKR WiFi 1010 + MKR IoT Carrier.
          </p>
          <div className="hero-controls">
            <span>↑↓ STAGE</span>
            <span>B EXIT</span>
            <span>SELECT TOP</span>
          </div>
        </header>

        {track === 'full' && (
          <>
            <section id="flow" className={`guide-section ${stageIds[stage] === 'flow' ? 'on' : ''}`}>
              <div className="section-head">
                <span className="stage-badge">STAGE 01</span>
                <h2>Spil-flow</h2>
              </div>
              <p>
                Arduino taler HTTP. Browseren viser arenaen. Samme fire skridt — kun path og actions
                ændrer sig.
              </p>
              <ol className="steps">
                <li>
                  <span className="step-n">1</span>
                  <div>
                    <strong>BOOT</strong>
                    <span>
                      WiFi + <code>carrier.begin()</code>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-n">2</span>
                  <div>
                    <strong>JOIN</strong>
                    <span>
                      <code>POST …/join</code> → <code>playerId</code>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-n">3</span>
                  <div>
                    <strong>KEEPALIVE</strong>
                    <span>
                      <code>POST …/heartbeat</code> hvert 2–5 sek
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-n">4</span>
                  <div>
                    <strong>PLAY</strong>
                    <span>
                      Pads → <code>POST …/action</code>
                    </span>
                  </div>
                </li>
              </ol>
              <div className="flow-compare">
                <div className="flow-card flow-red">
                  <div className="flow-card-top">
                    <img src="/bomberman-nes.jpg" alt="" />
                    <h3>BOMBERMAN</h3>
                  </div>
                  <ol>
                    <li>Admin opretter lobby (PIN)</li>
                    <li>Arduino joiner med samme PIN</li>
                    <li>Start spil i browseren</li>
                    <li>Bomber — sidste overlevende vinder</li>
                  </ol>
                </div>
                <div className="flow-card flow-blue">
                  <div className="flow-card-top">
                    <img src="/wizard-duel.jpg" alt="" />
                    <h3>WIZARD DUEL</h3>
                  </div>
                  <ol>
                    <li>Arduino joiner køen</li>
                    <li>Mindst 2 spillere → Start Kamp</li>
                    <li>Cast spells (mana regenererer)</li>
                    <li>Sidste wizard med HP &gt; 0 vinder</li>
                  </ol>
                </div>
                <div className="flow-card flow-purple">
                  <div className="flow-card-top">
                    <img src="/tetris-thumb.svg" alt="" />
                    <h3>TETRIS</h3>
                  </div>
                  <ol>
                    <li>Lobby med PIN (<code>GAME_BASE_PATH=/Tetris</code>)</li>
                    <li>Arduino joiner med samme PIN</li>
                    <li>Battle — send garbage lines til modstandere</li>
                    <li>Pads: venstre/højre/ned, rotate, hard drop</li>
                  </ol>
                </div>
                <div className="flow-card flow-orange">
                  <div className="flow-card-top">
                    <img src="/pong-thumb.jpg" alt="" />
                    <h3>PONG</h3>
                  </div>
                  <ol>
                    <li>Lobby med PIN (<code>GAME_BASE_PATH=/Pong</code>)</li>
                    <li>Arduino joiner med samme PIN</li>
                    <li>Klassisk paddle-duel — første til point vinder</li>
                    <li>Pads: TOUCH0 op, TOUCH2 ned (hold), øvrige stop</li>
                  </ol>
                </div>
              </div>
            </section>

            <section
              id="hardware"
              className={`guide-section ${stageIds[stage] === 'hardware' ? 'on' : ''}`}
            >
              <div className="section-head">
                <span className="stage-badge">STAGE 02</span>
                <h2>Hardware</h2>
              </div>
              <div className="hw-grid">
                <figure className="guide-figure">
                  <img
                    src={CARRIER_IMG}
                    alt="Arduino MKR IoT Carrier med BUTTON 00–04"
                    width={640}
                    height={640}
                  />
                  <figcaption>
                    BUTTON 00→04 rundt om TFT.{' '}
                    <a href={CARRIER_DOC} target="_blank" rel="noreferrer">
                      Docs ↗
                    </a>
                  </figcaption>
                </figure>
                <div className="hw-facts">
                  <p>
                    <strong>MKR WiFi 1010</strong> på <strong>MKR IoT Carrier</strong> (Oplà). Fem
                    pads = <code>TOUCH0</code>–<code>TOUCH4</code> + rund TFT 240×240.
                  </p>
                  <ul className="bullet-list">
                    <li>
                      Libs: <code>Arduino_MKRIoTCarrier</code>, <code>WiFiNINA</code>,{' '}
                      <code>ArduinoHttpClient</code>
                    </li>
                    <li>
                      Init: <code>carrier.noCase()</code> / <code>withCase()</code> →{' '}
                      <code>begin()</code>
                    </li>
                    <li>
                      HTTPS: root-cert én gang til <code>games.mercantec.tech:443</code>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}

        <section id="setup" className={`guide-section ${stageIds[stage] === 'setup' ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">{track === 'quick' ? 'STEP 01' : 'STAGE 03'}</span>
            <h2>Sketch-setup</h2>
          </div>
          <p>
            Klon eller download{' '}
            <code>arduino/MercantecGamesController/</code> fra Mercantec Games-repoet. Rediger kun{' '}
            <code>config.h</code> — skift <code>GAME_MODE</code>
            {track === 'full'
              ? ', Bomberman/Tetris/Pong-PIN og GAME_MODE_PONG.'
              : '.'}{' '}
            Upload{' '}
            <code>MercantecGamesController.ino</code>.
          </p>
          <InoCode code={SETUP_SNIPPET} filename="config.h" />
        </section>

        {track === 'full' && (
          <section id="api" className={`guide-section ${stageIds[stage] === 'api' ? 'on' : ''}`}>
            <div className="section-head">
              <span className="stage-badge">STAGE 04</span>
              <h2>API-kontrakt</h2>
            </div>
            <p>
              Paths relative til <code>GAME_BASE_PATH</code>. Traefik stripper prefix → server ser{' '}
              <code>/api/…</code>.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Body</th>
                    <th>Svar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>POST …/join</code>
                    </td>
                    <td>pin, name, deviceId</td>
                    <td>ok, playerId</td>
                  </tr>
                  <tr>
                    <td>
                      <code>POST …/heartbeat</code>
                    </td>
                    <td>pin?, playerId, deviceId</td>
                    <td>ok (+ hp/mana)</td>
                  </tr>
                  <tr>
                    <td>
                      <code>POST …/action</code>
                    </td>
                    <td>action + params</td>
                    <td>ok / fejl</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <InoCode code={JOIN_SNIPPET} filename="join.ino" />
            <InoCode code={ACTION_SNIPPET} filename="action.ino" />
          </section>
        )}

        <section id="pads" className={`guide-section ${stageIds[stage] === 'pads' ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">{track === 'quick' ? 'STEP 02' : 'STAGE 05'}</span>
            <h2>Pad-mapping</h2>
          </div>
          <p>
            Altid <code>carrier.Buttons.update()</code> først. Klik pads nedenfor for at se hvilken
            action der sendes.
          </p>
          <PadSimulator onPing={() => blip('move')} />
          <InoCode code={LOOP_SNIPPET} filename="loop.ino" />
        </section>

        {track === 'quick' && (
          <section id="play" className={`guide-section ${stageIds[stage] === 'play' ? 'on' : ''}`}>
            <div className="section-head">
              <span className="stage-badge">STEP 03</span>
              <h2>Vælg spil</h2>
            </div>
            <p>Sæt <code>GAME_MODE</code> i <code>config.h</code>, upload sketch, åbn arena.</p>
            <div className="flow-compare">
              <div className="flow-card flow-red">
                <div className="flow-card-top">
                  <img src="/bomberman-nes.jpg" alt="" />
                  <h3>BOMBERMAN</h3>
                </div>
                <ol>
                  <li>
                    <code>GAME_MODE_BOMBERMAN</code> i config.h
                  </li>
                  <li>Admin → PIN → GAME_PIN</li>
                  <li>
                    Åbn <a href="/Bomberman/">/Bomberman/</a>
                  </li>
                </ol>
              </div>
              <div className="flow-card flow-blue">
                <div className="flow-card-top">
                  <img src="/wizard-duel.jpg" alt="" />
                  <h3>WIZARD DUEL</h3>
                </div>
                <ol>
                  <li>
                    <code>GAME_MODE_WIZARD</code> i config.h
                  </li>
                  <li>Join kø → Start Kamp</li>
                  <li>
                    Åbn <a href="/Wizard/">/Wizard/</a>
                  </li>
                </ol>
              </div>
              <div className="flow-card flow-purple">
                <div className="flow-card-top">
                  <img src="/tetris-thumb.svg" alt="" />
                  <h3>TETRIS</h3>
                </div>
                <ol>
                  <li>
                    <code>GAME_MODE_TETRIS</code> i config.h
                  </li>
                  <li>Lobby-PIN → <code>GAME_PIN</code></li>
                  <li>
                    Åbn <a href="/Tetris/">/Tetris/</a> — brug pad-sim TETRIS-profil
                  </li>
                </ol>
              </div>
              <div className="flow-card flow-orange">
                <div className="flow-card-top">
                  <img src="/pong-thumb.jpg" alt="" />
                  <h3>PONG</h3>
                </div>
                <ol>
                  <li>
                    <code>GAME_MODE_PONG</code> i config.h
                  </li>
                  <li>Lobby-PIN → <code>GAME_PIN</code></li>
                  <li>
                    Åbn <a href="/Pong/">/Pong/</a> — pad-sim PONG: TOUCH0 op, TOUCH2 ned
                  </li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {track === 'full' && (
          <>
            <section
              id="bomberman"
              className={`guide-section ${stageIds[stage] === 'bomberman' ? 'on' : ''}`}
            >
              <div className="section-head">
                <span className="stage-badge">STAGE 06</span>
                <h2>Bomberman</h2>
              </div>
              <div className="game-panel">
                <img className="game-panel-art" src="/bomberman-nes.jpg" alt="Bomberman NES" />
                <ul className="bullet-list">
                  <li>
                    <code>GAME_MODE_BOMBERMAN</code> i config.h
                  </li>
                  <li>
                    Admin → PIN → <code>GAME_PIN</code>
                  </li>
                  <li>
                    Actions: <code>move</code> + direction, eller <code>bomb</code>
                  </li>
                  <li>
                    Arena: <a href="/Bomberman/">/Bomberman/</a>
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="wizard"
              className={`guide-section ${stageIds[stage] === 'wizard' ? 'on' : ''}`}
            >
              <div className="section-head">
                <span className="stage-badge">STAGE 07</span>
                <h2>Wizard Duel</h2>
              </div>
              <div className="game-panel">
                <img className="game-panel-art" src="/wizard-duel.jpg" alt="Wizard Duel" />
                <ul className="bullet-list">
                  <li>
                    <code>GAME_MODE_WIZARD</code> i config.h
                  </li>
                  <li>
                    <code>cast</code> + spellKey: FIREBALL, LIGHTNING, SHIELD, HEAL, POWER_BOOST,
                    DEATH_RAY
                  </li>
                  <li>Heartbeat → hp/mana på TFT</li>
                  <li>
                    Arena: <a href="/Wizard/">/Wizard/</a>
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="tetris"
              className={`guide-section ${stageIds[stage] === 'tetris' ? 'on' : ''}`}
            >
              <div className="section-head">
                <span className="stage-badge">STAGE 08</span>
                <h2>Tetris</h2>
              </div>
              <div className="game-panel">
                <img className="game-panel-art" src="/tetris-thumb.svg" alt="Tetris battle" />
                <ul className="bullet-list">
                  <li>
                    <code>GAME_MODE_TETRIS</code> → <code>GAME_BASE_PATH=/Tetris</code>
                  </li>
                  <li>
                    Lobby-PIN i <code>GAME_PIN</code> (som Bomberman)
                  </li>
                  <li>
                    Actions: <code>move</code> LEFT/RIGHT/DOWN, <code>rotate</code>,{' '}
                    <code>hardDrop</code>
                  </li>
                  <li>
                    Arena: <a href="/Tetris/">/Tetris/</a>
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="pong"
              className={`guide-section ${stageIds[stage] === 'pong' ? 'on' : ''}`}
            >
              <div className="section-head">
                <span className="stage-badge">STAGE 09</span>
                <h2>Pong</h2>
              </div>
              <div className="game-panel">
                <img className="game-panel-art" src="/pong-thumb.jpg" alt="Classic Pong" />
                <ul className="bullet-list">
                  <li>
                    <code>GAME_MODE_PONG</code> → <code>GAME_BASE_PATH=/Pong</code>
                  </li>
                  <li>
                    Lobby-PIN i <code>GAME_PIN</code> (som Bomberman/Tetris)
                  </li>
                  <li>
                    Actions: <code>move</code> UP/DOWN (hold), <code>stop</code> på øvrige pads
                  </li>
                  <li>
                    Arena: <a href="/Pong/">/Pong/</a>
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}

        <section
          id="checklist"
          className={`guide-section ${stageIds[stage] === 'checklist' ? 'on' : ''}`}
        >
          <div className="section-head">
            <span className="stage-badge">{track === 'quick' ? 'STEP 04' : 'STAGE 10'}</span>
            <h2>Checklist</h2>
          </div>
          <p className="check-progress">
            CLEAR {done}/{checkList.length}
          </p>
          <ul className="check-list">
            {checkList.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  className={`check-btn ${checkState[i] ? 'done' : ''}`}
                  onClick={() => (track === 'quick' ? toggleQuick(i) : toggleCheck(i))}
                >
                  <span className="check-box">{checkState[i] ? '■' : '□'}</span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
          {track === 'full' && (
            <p className="guide-outro">
              Fælles starter-kit: Games-repo{' '}
              <code>arduino/MercantecGamesController/</code> (config.h + GAME_MODE). Ældre{' '}
              <code>iot/</code> og <code>ArduinoKode/</code> er legacy.
            </p>
          )}
          <div className="guide-end">
            <Link className="end-btn" to="/">
              ◄ TILBAGE TIL SELECT
            </Link>
            {done === checkList.length && <span className="end-clear">STAGE CLEAR!</span>}
            {track === 'quick' && (
              <button type="button" className="end-btn ghost" onClick={() => switchTrack('full')}>
                ► FULL MANUAL
              </button>
            )}
          </div>
        </section>
      </article>
    </div>
  )
}
