import './App.css'
import {
  Bomb,
  Sparkles,
  Cpu,
  Wifi,
  HeartPulse,
  Gamepad2,
  ArrowRight,
  Monitor,
  ExternalLink,
} from 'lucide-react'

const GAMES = [
  {
    id: 'bomberman',
    title: 'Bomberman',
    path: '/Bomberman',
    blurb: 'Klassisk multiplayer med PIN-lobbies, bomber og power-ups.',
    accent: 'var(--bomb)',
    Icon: Bomb,
    profile: 'Nav-profil',
  },
  {
    id: 'wizard',
    title: 'Wizard Duel',
    path: '/Wizard',
    blurb: 'Troldmandskamp med spells, mana og sidste wizard i live.',
    accent: 'var(--wizard)',
    Icon: Sparkles,
    profile: 'Ability-profil',
  },
]

const CARRIER_DOC =
  'https://docs.arduino.cc/tutorials/mkr-iot-carrier/mkr-iot-carrier-01-technical-reference/'

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <p className="brand">Mercantec Games</p>
        <h1 className="headline">Spil. Controllers. Samme host.</h1>
        <p className="lede">
          Vælg et spil — eller byg en trådløs controller med Arduino MKR WiFi 1010 + MKR IoT
          Carrier (Oplà).
        </p>
        <div className="hero-ctas">
          <a className="cta primary" href="/Bomberman">
            Åbn Bomberman <ArrowRight size={18} />
          </a>
          <a className="cta secondary" href="/Wizard">
            Åbn Wizard Duel <ArrowRight size={18} />
          </a>
        </div>
        <div className="hero-glow" aria-hidden="true" />
      </header>

      <section className="section games" id="spil">
        <h2>Spillene</h2>
        <p className="section-lede">Begge kører på games.mercantec.tech under eget path-prefix.</p>
        <div className="game-grid">
          {GAMES.map((game) => (
            <a
              key={game.id}
              className="game-link"
              href={game.path}
              style={{ ['--game-accent' as string]: game.accent }}
            >
              <game.Icon className="game-icon" size={36} />
              <div>
                <h3>{game.title}</h3>
                <p>{game.blurb}</p>
                <span className="chip">{game.profile}</span>
              </div>
              <span className="path">{game.path}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section controller" id="arduino">
        <h2>Byg en Oplà-controller</h2>
        <p className="section-lede">
          Hardware er <strong>Arduino MKR WiFi 1010</strong> monteret på{' '}
          <strong>MKR IoT Carrier</strong>. Carrieren har fem kapacitive touch-pads, en rund
          1,3″ TFT (240×240) og sensorer — dokumenteret i Arduinos{' '}
          <a className="inline-link" href={CARRIER_DOC} target="_blank" rel="noreferrer">
            technical reference <ExternalLink size={14} />
          </a>
          . Du mappe pads til spil-actions og sender dem over WiFi til vores fælles API.
        </p>

        <div className="hw-grid">
          <div className="pad-diagram" aria-hidden="true">
            <div className="pad-ring">
              <span className="pad pad-4">04</span>
              <span className="pad pad-0">00</span>
              <span className="pad pad-3">03</span>
              <span className="pad pad-2">02</span>
              <span className="pad pad-1">01</span>
              <span className="pad-screen">TFT<br />240×240</span>
            </div>
            <p className="pad-caption">Kapacitive pads set oppefra (TOUCH0–TOUCH4)</p>
          </div>

          <div className="hw-facts">
            <h3>Det du bruger fra Carrieren</h3>
            <ul>
              <li>
                <strong>5× capacitive touch</strong> — <code>TOUCH0</code>…<code>TOUCH4</code>{' '}
                (også kaldet pad 00–04)
              </li>
              <li>
                <strong>Rund TFT</strong> — status (WiFi, join, HP/mana) via{' '}
                <code>carrier.display</code>
              </li>
              <li>
                <strong>MKR WiFi 1010</strong> — HTTPS til <code>games.mercantec.tech</code>
              </li>
              <li>
                Valgfrit: RGB-LEDs, buzzer, gesture (APDS) som ekstra feedback
              </li>
            </ul>
            <p className="hw-note">
              Init: <code>carrier.noCase()</code> eller <code>carrier.withCase()</code>, derefter{' '}
              <code>carrier.begin()</code>. Bibliotek:{' '}
              <code>Arduino_MKRIoTCarrier</code>.
            </p>
          </div>
        </div>

        <h3 className="subhead">Læs touch (fra Arduino-referencen)</h3>
        <div className="code-panel">
          <pre>{`void loop() {
  carrier.Buttons.update();           // altid først i loop

  if (carrier.Buttons.getTouch(TOUCH0)) {
    // holdes nede = true indtil slip
  }
  if (carrier.Buttons.onTouchDown(TOUCH4)) {
    // engangs-tryk (edge)
  }
}`}</pre>
        </div>
        <p className="api-note">
          Brug <code>getTouch</code> til hold-to-repeat (bevægelse) og <code>onTouchDown</code> til
          engangs-actions (bombe / spell). Se også <code>onTouchUp</code> /{' '}
          <code>onTouchChange</code> i{' '}
          <a className="inline-link" href={CARRIER_DOC} target="_blank" rel="noreferrer">
            technical reference
          </a>
          .
        </p>

        <h3 className="subhead">Spil-flow (HTTP)</h3>
        <ol className="flow">
          <li>
            <Wifi size={22} />
            <div>
              <strong>WiFi</strong>
              <span>MKR WiFi 1010 → dit netværk</span>
            </div>
          </li>
          <li>
            <Cpu size={22} />
            <div>
              <strong>Join</strong>
              <span>
                <code>POST …/api/controller/join</code>
              </span>
            </div>
          </li>
          <li>
            <HeartPulse size={22} />
            <div>
              <strong>Heartbeat</strong>
              <span>
                <code>POST …/api/controller/heartbeat</code> hvert 2–5 sek
              </span>
            </div>
          </li>
          <li>
            <Gamepad2 size={22} />
            <div>
              <strong>Action</strong>
              <span>
                Pad → <code>POST …/api/controller/action</code>
              </span>
            </div>
          </li>
        </ol>

        <div className="config-block">
          <h3>Fælles config i sketch</h3>
          <table>
            <thead>
              <tr>
                <th>Variabel</th>
                <th>Bomberman</th>
                <th>Wizard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>SERVER_HOST</code>
                </td>
                <td colSpan={2}>games.mercantec.tech</td>
              </tr>
              <tr>
                <td>
                  <code>USE_HTTPS</code>
                </td>
                <td colSpan={2}>1 (upload root-cert til boardet én gang)</td>
              </tr>
              <tr>
                <td>
                  <code>GAME_BASE_PATH</code>
                </td>
                <td>
                  <code>/Bomberman</code>
                </td>
                <td>
                  <code>/Wizard</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>GAME_PIN</code>
                </td>
                <td>Lobby-PIN fra admin</td>
                <td>Valgfri (kø)</td>
              </tr>
              <tr>
                <td>
                  <code>PLAYER_NAME</code>
                </td>
                <td colSpan={2}>Dit spillernavn</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="profiles">
          <article>
            <h3>
              <Monitor size={18} /> Nav-profil · Bomberman
            </h3>
            <ul className="map-list">
              <li>
                <code>TOUCH0</code> → move UP
              </li>
              <li>
                <code>TOUCH1</code> → move DOWN
              </li>
              <li>
                <code>TOUCH2</code> → move LEFT
              </li>
              <li>
                <code>TOUCH3</code> → move RIGHT
              </li>
              <li>
                <code>TOUCH4</code> → bomb (<code>onTouchDown</code>)
              </li>
            </ul>
            <p>
              Action: <code>move</code> / <code>bomb</code> med evt.{' '}
              <code>params.direction</code>.
            </p>
          </article>
          <article>
            <h3>
              <Sparkles size={18} /> Ability-profil · Wizard
            </h3>
            <ul className="map-list">
              <li>
                <code>TOUCH0</code> → FIREBALL
              </li>
              <li>
                <code>TOUCH1</code> → LIGHTNING
              </li>
              <li>
                <code>TOUCH2</code> → SHIELD
              </li>
              <li>
                <code>TOUCH3</code> → HEAL
              </li>
              <li>
                <code>TOUCH4</code> → DEATH_RAY / POWER_BOOST
              </li>
            </ul>
            <p>
              Action: <code>cast</code> med <code>params.spellKey</code> (og evt.{' '}
              <code>targetId</code>). Brug display til HP/mana fra heartbeat.
            </p>
          </article>
        </div>

        <p className="repo-hint">
          Starter-sketches: Bomberman <code>iot/</code> · Wizard <code>ArduinoKode/</code>. Samme
          pad-API — skift kun <code>GAME_BASE_PATH</code> og hvordan du mapper{' '}
          <code>TOUCH*</code> til actions.
        </p>
      </section>

      <footer className="footer">
        <span>Mercantec · games.mercantec.tech</span>
        <a className="inline-link" href={CARRIER_DOC} target="_blank" rel="noreferrer">
          MKR IoT Carrier reference
        </a>
      </footer>
    </div>
  )
}
