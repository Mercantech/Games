import './App.css'
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  ExternalLink,
  Gamepad2,
  HeartPulse,
  Wifi,
} from 'lucide-react'

const CARRIER_DOC =
  'https://docs.arduino.cc/tutorials/mkr-iot-carrier/mkr-iot-carrier-01-technical-reference/'

export default function App() {
  return (
    <div className="site">
      <div className="noise" aria-hidden="true" />

      <header className="hero">
        <nav className="topbar">
          <a href="#spil" className="top-link">
            Spillene
          </a>
          <a href="#arduino" className="top-link">
            Controller
          </a>
        </nav>

        <div className="hero-stage">
          <div className="wash wash-ember" aria-hidden="true" />
          <div className="wash wash-arc" aria-hidden="true" />
          <div className="grid-floor" aria-hidden="true" />

          <p className="brand">Mercantec Games</p>
          <h1 className="headline">Vælg din arena.</h1>
          <p className="lede">
            To spil. Én host. Byg din egen Oplà-controller med den samme API.
          </p>
          <div className="hero-ctas">
            <a className="cta ember" href="/Bomberman">
              Spil Bomberman <ArrowRight size={18} strokeWidth={2.5} />
            </a>
            <a className="cta arc" href="/Wizard">
              Spil Wizard Duel <ArrowRight size={18} strokeWidth={2.5} />
            </a>
          </div>
        </div>
      </header>

      <section className="destinations" id="spil">
        <a className="dest dest-bomb" href="/Bomberman">
          <div className="dest-bg" aria-hidden="true" />
          <div className="dest-copy">
            <span className="dest-kicker">/Bomberman</span>
            <h2>Bomberman</h2>
            <p>PIN-lobbies, bomber og power-ups. Styr med Oplà eller tastatur.</p>
            <span className="dest-go">
              Gå ind <ArrowUpRight size={20} />
            </span>
          </div>
        </a>
        <a className="dest dest-wiz" href="/Wizard">
          <div className="dest-bg" aria-hidden="true" />
          <div className="dest-copy">
            <span className="dest-kicker">/Wizard</span>
            <h2>Wizard Duel</h2>
            <p>Spells, mana og sidste wizard i live. Cast fra touch-pads.</p>
            <span className="dest-go">
              Gå ind <ArrowUpRight size={20} />
            </span>
          </div>
        </a>
      </section>

      <section className="controller" id="arduino">
        <div className="controller-intro">
          <p className="section-kicker">Hardware</p>
          <h2>Byg controlleren på MKR IoT Carrier</h2>
          <p>
            <strong>MKR WiFi 1010</strong> + <strong>MKR IoT Carrier</strong> (Oplà): fem
            kapacitive pads, rund 1,3″ TFT (240×240) og WiFi til spil-serveren. Samme sketch-flow
            til begge spil — skift kun <code>GAME_BASE_PATH</code> og pad-mapping.
          </p>
          <a className="doc-link" href={CARRIER_DOC} target="_blank" rel="noreferrer">
            Arduino technical reference <ExternalLink size={16} />
          </a>
        </div>

        <div className="hw-row">
          <div className="pad-diagram" aria-hidden="true">
            <div className="pad-ring">
              <span className="pad pad-4">04</span>
              <span className="pad pad-0">00</span>
              <span className="pad pad-3">03</span>
              <span className="pad pad-2">02</span>
              <span className="pad pad-1">01</span>
              <span className="pad-screen">
                TFT
                <br />
                240×240
              </span>
            </div>
            <p className="pad-caption">TOUCH0–TOUCH4 set oppefra</p>
          </div>

          <div className="code-stack">
            <pre className="code-panel">{`carrier.Buttons.update();

if (carrier.Buttons.getTouch(TOUCH0)) {
  // hold = gentag (bevægelse)
}
if (carrier.Buttons.onTouchDown(TOUCH4)) {
  // engangs-tryk (bombe / spell)
}`}</pre>
            <ol className="flow">
              <li>
                <Wifi size={20} />
                <span>
                  <strong>WiFi</strong> → netværk
                </span>
              </li>
              <li>
                <Cpu size={20} />
                <span>
                  <strong>Join</strong> <code>/api/controller/join</code>
                </span>
              </li>
              <li>
                <HeartPulse size={20} />
                <span>
                  <strong>Heartbeat</strong> hvert 2–5 sek
                </span>
              </li>
              <li>
                <Gamepad2 size={20} />
                <span>
                  <strong>Action</strong> fra pads
                </span>
              </li>
            </ol>
          </div>
        </div>

        <div className="profiles">
          <article className="profile bomb-profile">
            <h3>Nav-profil · Bomberman</h3>
            <ul>
              <li>
                <code>TOUCH0–3</code> retning · <code>getTouch</code>
              </li>
              <li>
                <code>TOUCH4</code> bombe · <code>onTouchDown</code>
              </li>
              <li>
                <code>GAME_BASE_PATH=/Bomberman</code> + lobby-PIN
              </li>
            </ul>
          </article>
          <article className="profile wiz-profile">
            <h3>Ability-profil · Wizard</h3>
            <ul>
              <li>
                <code>TOUCH0–4</code> spells · <code>onTouchDown</code>
              </li>
              <li>
                Action <code>cast</code> + <code>spellKey</code>
              </li>
              <li>
                <code>GAME_BASE_PATH=/Wizard</code> · TFT til HP/mana
              </li>
            </ul>
          </article>
        </div>
      </section>

      <footer className="footer">
        <span className="footer-brand">Mercantec Games</span>
        <a href={CARRIER_DOC} target="_blank" rel="noreferrer">
          MKR IoT Carrier docs
        </a>
      </footer>
    </div>
  )
}
