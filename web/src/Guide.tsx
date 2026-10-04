import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InoCode } from './InoCode'
import { usePad, type PadButton } from './PadContext'
import QrCard from './QrCard'
import './Guide.css'

const CARRIER_DOC =
  'https://docs.arduino.cc/tutorials/mkr-iot-carrier/mkr-iot-carrier-01-technical-reference/'
const CARRIER_IMG = '/mkr-iot-carrier-pads.png'

const SETUP_SNIPPET = `#include <Arduino_MKRIoTCarrier.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>

MKRIoTCarrier carrier;

#define WIFI_SSID      "DIT_WIFI"
#define WIFI_PASS      "DIT_PASSWORD"
#define SERVER_HOST    "games.mercantec.tech"
#define GAME_BASE_PATH "/Bomberman"   // eller "/Wizard"
#define GAME_PIN       "1234"
#define PLAYER_NAME    "Arduino"
#define USE_HTTPS      1

#if USE_HTTPS
  #define SERVER_PORT 443
  WiFiSSLClient wifi;
#else
  #define SERVER_PORT 80
  WiFiClient wifi;
#endif

HttpClient http = HttpClient(wifi, SERVER_HOST, SERVER_PORT);
String playerId;
String deviceId;

String apiPath(const char* endpoint) {
  return String(GAME_BASE_PATH) + endpoint;
}`

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

const STAGES = [
  { id: 'flow', label: 'FLOW', title: 'Spil-flow' },
  { id: 'hardware', label: 'HW', title: 'Hardware' },
  { id: 'setup', label: 'CFG', title: 'Sketch-setup' },
  { id: 'api', label: 'API', title: 'API-kontrakt' },
  { id: 'pads', label: 'PAD', title: 'Pad-mapping' },
  { id: 'bomberman', label: 'BM', title: 'Bomberman' },
  { id: 'wizard', label: 'WZ', title: 'Wizard Duel' },
  { id: 'checklist', label: 'OK', title: 'Checklist' },
] as const

const CHECK_ITEMS = [
  'WIFI_SSID / WIFI_PASS sat',
  'SERVER_HOST = games.mercantec.tech, USE_HTTPS = 1',
  'GAME_BASE_PATH matcher spillet',
  'Bomberman: gyldig GAME_PIN fra admin',
  'Root-cert uploadet til MKR WiFi 1010',
  'Biblioteker: Carrier, WiFiNINA, HttpClient',
  'Serial Monitor 115200 — join OK + playerId',
]

export default function Guide() {
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()
  const [stage, setStage] = useState(0)
  const stageRef = useRef(0)
  const [checks, setChecks] = useState<boolean[]>(() => CHECK_ITEMS.map(() => false))

  const goStage = (index: number) => {
    const next = Math.max(0, Math.min(STAGES.length - 1, index))
    stageRef.current = next
    setStage(next)
    document.getElementById(STAGES[next].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  }, [subscribe, blip, navigate])

  useEffect(() => {
    const nodes = STAGES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (!nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible?.target?.id) return
        const idx = STAGES.findIndex((s) => s.id === visible.target.id)
        if (idx >= 0) {
          stageRef.current = idx
          setStage(idx)
        }
      },
      { root: null, rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const toggleCheck = (i: number) => {
    setChecks((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
    blip('ok')
  }

  const done = checks.filter(Boolean).length

  return (
    <div className="guide-layout">
      <aside className="guide-rail" aria-label="Stages">
        <p className="rail-title">STAGES</p>
        <p className="rail-progress">
          {String(stage + 1).padStart(2, '0')}/{String(STAGES.length).padStart(2, '0')}
        </p>
        <nav className="rail-nav">
          {STAGES.map((s, i) => (
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
            <span className="hero-chip">LEVEL 1</span>
          </div>
          <h1>OPLÀ CONTROLLER MANUAL</h1>
          <p className="hero-lede">
            Fra WiFi til live arena på <code>games.mercantec.tech</code> — MKR WiFi 1010 + MKR IoT
            Carrier.
          </p>
          <div className="hero-controls">
            <span>↑↓ STAGE</span>
            <span>B EXIT</span>
            <span>SELECT TOP</span>
          </div>
          <QrCard compact />
        </header>

        <section id="flow" className={`guide-section ${stage === 0 ? 'on' : ''}`}>
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
          </div>
        </section>

        <section id="hardware" className={`guide-section ${stage === 1 ? 'on' : ''}`}>
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
                <strong>MKR WiFi 1010</strong> på <strong>MKR IoT Carrier</strong> (Oplà). Fem pads ={' '}
                <code>TOUCH0</code>–<code>TOUCH4</code> + rund TFT 240×240.
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

        <section id="setup" className={`guide-section ${stage === 2 ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">STAGE 03</span>
            <h2>Sketch-setup</h2>
          </div>
          <p>
            Samme config til begge spil. Skift kun <code>GAME_BASE_PATH</code> (og PIN til Bomberman).
          </p>
          <InoCode code={SETUP_SNIPPET} filename="config.ino" />
        </section>

        <section id="api" className={`guide-section ${stage === 3 ? 'on' : ''}`}>
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
                  <td>
                    pin, name, deviceId
                  </td>
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

        <section id="pads" className={`guide-section ${stage === 4 ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">STAGE 05</span>
            <h2>Pad-mapping</h2>
          </div>
          <p>
            Altid <code>carrier.Buttons.update()</code> først. <code>getTouch</code> = hold,{' '}
            <code>onTouchDown</code> = engangstryk.
          </p>
          <div className="pad-map">
            <div className="pad-map-ring" aria-hidden="true">
              <span className="pad p2">02 ↑</span>
              <span className="pad p1">01 ←</span>
              <span className="pad tft">TFT</span>
              <span className="pad p3">03 →</span>
              <span className="pad p0">00 ↓</span>
              <span className="pad p4">04 ★</span>
            </div>
            <ul className="bullet-list">
              <li>
                Bomberman: 02↑ 00↓ 01← 03→ · 04 bombe
              </li>
              <li>Wizard: pads = spells (fx 00 FIREBALL)</li>
            </ul>
          </div>
          <InoCode code={LOOP_SNIPPET} filename="loop.ino" />
        </section>

        <section id="bomberman" className={`guide-section ${stage === 5 ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">STAGE 06</span>
            <h2>Bomberman</h2>
          </div>
          <div className="game-panel">
            <img className="game-panel-art" src="/bomberman-nes.jpg" alt="Bomberman NES" />
            <ul className="bullet-list">
              <li>
                <code>GAME_BASE_PATH=/Bomberman</code>
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

        <section id="wizard" className={`guide-section ${stage === 6 ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">STAGE 07</span>
            <h2>Wizard Duel</h2>
          </div>
          <div className="game-panel">
            <img className="game-panel-art" src="/wizard-duel.jpg" alt="Wizard Duel" />
            <ul className="bullet-list">
              <li>
                <code>GAME_BASE_PATH=/Wizard</code>
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

        <section id="checklist" className={`guide-section ${stage === 7 ? 'on' : ''}`}>
          <div className="section-head">
            <span className="stage-badge">STAGE 08</span>
            <h2>Checklist</h2>
          </div>
          <p className="check-progress">
            CLEAR {done}/{CHECK_ITEMS.length}
          </p>
          <ul className="check-list">
            {CHECK_ITEMS.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  className={`check-btn ${checks[i] ? 'done' : ''}`}
                  onClick={() => toggleCheck(i)}
                >
                  <span className="check-box">{checks[i] ? '■' : '□'}</span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="guide-outro">
            Starter-sketches: Bomberman <code>iot/</code> · Wizard <code>ArduinoKode/</code>
          </p>
          <div className="guide-end">
            <Link className="end-btn" to="/">
              ◄ TILBAGE TIL SELECT
            </Link>
            {done === CHECK_ITEMS.length && (
              <span className="end-clear">STAGE CLEAR!</span>
            )}
          </div>
        </section>
      </article>
    </div>
  )
}
