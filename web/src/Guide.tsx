import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InoCode } from './InoCode'
import { usePad, type PadButton } from './PadContext'
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

const TOC_IDS = [
  'flow',
  'hardware',
  'setup',
  'api',
  'pads',
  'bomberman',
  'wizard',
  'checklist',
]

export default function Guide() {
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()

  useEffect(() => {
    let section = 0
    const onPad = (button: PadButton) => {
      if (button === 'b' || button === 'select') {
        blip('back')
        navigate('/')
        return
      }
      if (button === 'down' || button === 'right') {
        section = Math.min(TOC_IDS.length - 1, section + 1)
        document.getElementById(TOC_IDS[section])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        blip('move')
        return
      }
      if (button === 'up' || button === 'left') {
        section = Math.max(0, section - 1)
        document.getElementById(TOC_IDS[section])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        blip('move')
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, navigate])

  return (
    <article className="guide">
      <header className="guide-hero">
        <p className="guide-kicker">MANUAL · LEVEL 1</p>
        <h1>Arduino Oplà Controller Guide</h1>
        <p>
          1:1 walkthrough: fra WiFi til dig spiller Bomberman eller Wizard Duel på{' '}
          <code>games.mercantec.tech</code> med MKR WiFi 1010 + MKR IoT Carrier.
        </p>
        <p className="guide-pad-hint">B / SELECT = tilbage · ↑↓ = hop mellem afsnit</p>
        <Link className="back-link" to="/">
          ◄ TILBAGE TIL SELECT
        </Link>
      </header>

      <nav className="toc">
        <a href="#flow">1. Spil-flow</a>
        <a href="#hardware">2. Hardware</a>
        <a href="#setup">3. Sketch-setup</a>
        <a href="#api">4. API-kontrakt</a>
        <a href="#pads">5. Pad-mapping</a>
        <a href="#bomberman">6. Bomberman</a>
        <a href="#wizard">7. Wizard Duel</a>
        <a href="#checklist">8. Checklist</a>
      </nav>

      <section id="flow" className="guide-section">
        <h2>1. Spil-flow (begge spil)</h2>
        <p>
          Arduino taler HTTP til spil-serveren. Browseren viser arenaen. Samme fire skridt — kun
          path og actions ændrer sig.
        </p>
        <ol className="steps">
          <li>
            <strong>BOOT</strong>
            <span>WiFi + <code>carrier.begin()</code></span>
          </li>
          <li>
            <strong>JOIN</strong>
            <span>
              <code>POST …/api/controller/join</code> → få <code>playerId</code>
            </span>
          </li>
          <li>
            <strong>KEEPALIVE</strong>
            <span>
              <code>POST …/api/controller/heartbeat</code> hvert 2–5 sek
            </span>
          </li>
          <li>
            <strong>PLAY</strong>
            <span>
              Pads → <code>POST …/api/controller/action</code>
            </span>
          </li>
        </ol>

        <div className="flow-compare">
          <div>
            <h3>Bomberman-flow</h3>
            <ol>
              <li>Admin opretter lobby på <code>/Bomberman/admin.html</code> (PIN)</li>
              <li>Spillere / Arduino joiner med samme PIN</li>
              <li>Nogen trykker “Start spil” i browseren</li>
              <li>Bevæg dig + læg bomber — sidste overlevende vinder</li>
            </ol>
          </div>
          <div>
            <h3>Wizard-flow</h3>
            <ol>
              <li>Arduino joiner køen (PIN valgfri)</li>
              <li>Mindst 2 i kø → “Start Kamp” i browseren</li>
              <li>Cast spells (mana regenererer)</li>
              <li>Sidste wizard med HP &gt; 0 vinder</li>
            </ol>
          </div>
        </div>
      </section>

      <section id="hardware" className="guide-section">
        <h2>2. Hardware</h2>
        <p>
          Du skal bruge <strong>Arduino MKR WiFi 1010</strong> monteret på{' '}
          <strong>MKR IoT Carrier</strong> (Oplà-kit). Fem kapacitive pads ={' '}
          <code>TOUCH0</code>–<code>TOUCH4</code> (BUTTON 00–04), plus rund TFT 240×240.
        </p>
        <figure className="guide-figure">
          <img
            src={CARRIER_IMG}
            alt="Arduino MKR IoT Carrier set oppefra med BUTTON 00–04 markeret"
            width={640}
            height={640}
          />
          <figcaption>
            BUTTON 00 nederst venstre → 01 → 02 (top) → 03 → 04 nederst højre.{' '}
            <a href={CARRIER_DOC} target="_blank" rel="noreferrer">
              Technical reference ↗
            </a>
          </figcaption>
        </figure>
        <ul className="bullet-list">
          <li>
            Bibliotek: <code>Arduino_MKRIoTCarrier</code>, <code>WiFiNINA</code>,{' '}
            <code>ArduinoHttpClient</code>
          </li>
          <li>
            Init: <code>carrier.noCase()</code> eller <code>withCase()</code>, derefter{' '}
            <code>carrier.begin()</code>
          </li>
          <li>
            HTTPS: upload root-cert til boardet én gang (domæne{' '}
            <code>games.mercantec.tech:443</code>)
          </li>
        </ul>
      </section>

      <section id="setup" className="guide-section">
        <h2>3. Sketch-setup (fælles)</h2>
        <p>
          Samme config-blok til begge spil. Skift kun <code>GAME_BASE_PATH</code> (og PIN til
          Bomberman).
        </p>
        <InoCode code={SETUP_SNIPPET} filename="config.ino" />
      </section>

      <section id="api" className="guide-section">
        <h2>4. API-kontrakt</h2>
        <p>
          Alle paths er relative til <code>GAME_BASE_PATH</code>. Traefik stripper prefix, så
          serveren ser <code>/api/...</code>.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Body (JSON)</th>
                <th>Svar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>POST …/join</code>
                </td>
                <td>
                  <code>pin</code>, <code>name</code>, <code>deviceId</code>
                </td>
                <td>
                  <code>ok</code>, <code>playerId</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>POST …/heartbeat</code>
                </td>
                <td>
                  <code>pin?</code>, <code>playerId</code>, <code>deviceId</code>
                </td>
                <td>
                  <code>ok</code> (+ Wizard: hp/mana)
                </td>
              </tr>
              <tr>
                <td>
                  <code>POST …/action</code>
                </td>
                <td>
                  <code>action</code> + <code>params</code>
                </td>
                <td>
                  <code>ok</code> / fejl
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <InoCode code={JOIN_SNIPPET} filename="join.ino" />
        <InoCode code={ACTION_SNIPPET} filename="action.ino" />
      </section>

      <section id="pads" className="guide-section">
        <h2>5. Læs pads</h2>
        <p>
          Kald altid <code>carrier.Buttons.update()</code> først i <code>loop()</code>. Brug{' '}
          <code>getTouch</code> til hold-to-repeat (bevægelse) og <code>onTouchDown</code> til
          engangs-tryk (bombe / spell).
        </p>
        <InoCode code={LOOP_SNIPPET} filename="loop.ino" />
      </section>

      <section id="bomberman" className="guide-section">
        <h2>6. Bomberman — konkret</h2>
        <ul className="bullet-list">
          <li>
            <code>GAME_BASE_PATH=/Bomberman</code>
          </li>
          <li>Admin: opret lobby → kopiér PIN til <code>GAME_PIN</code></li>
          <li>
            Actions: <code>move</code> (+ <code>direction</code>: UP/DOWN/LEFT/RIGHT) eller{' '}
            <code>bomb</code>
          </li>
          <li>
            Mapping: TOUCH2↑ TOUCH0↓ TOUCH1← TOUCH3→ TOUCH4 bombe
          </li>
          <li>
            Åbn arena: <a href="/Bomberman/">/Bomberman/</a>
          </li>
        </ul>
      </section>

      <section id="wizard" className="guide-section">
        <h2>7. Wizard Duel — konkret</h2>
        <ul className="bullet-list">
          <li>
            <code>GAME_BASE_PATH=/Wizard</code>
          </li>
          <li>
            Action: <code>cast</code> med <code>params.spellKey</code> (FIREBALL, LIGHTNING,
            SHIELD, HEAL, POWER_BOOST, DEATH_RAY) og evt. <code>targetId</code>
          </li>
          <li>Heartbeat giver hp/mana — tegn bars på TFT</li>
          <li>Mindst 2 i kø, start kamp fra browseren</li>
          <li>
            Åbn arena: <a href="/Wizard/">/Wizard/</a>
          </li>
        </ul>
      </section>

      <section id="checklist" className="guide-section">
        <h2>8. Checklist før upload</h2>
        <ul className="check-list">
          <li>□ WIFI_SSID / WIFI_PASS sat</li>
          <li>□ SERVER_HOST = games.mercantec.tech, USE_HTTPS = 1</li>
          <li>□ GAME_BASE_PATH matcher spillet</li>
          <li>□ Bomberman: gyldig GAME_PIN fra admin</li>
          <li>□ Root-cert uploadet til MKR WiFi 1010</li>
          <li>□ Biblioteker installeret (Carrier, WiFiNINA, HttpClient)</li>
          <li>□ Serial Monitor 115200 — se join OK + playerId</li>
        </ul>
        <p className="guide-outro">
          Starter-sketches: Bomberman-repo <code>iot/</code> · Wizard-repo{' '}
          <code>ArduinoKode/</code>.
        </p>
        <Link className="back-link" to="/">
          ◄ TILBAGE TIL SELECT
        </Link>
      </section>
    </article>
  )
}
