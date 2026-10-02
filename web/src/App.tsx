import './App.css'
import { Bomb, Sparkles, Cpu, Wifi, HeartPulse, Gamepad2, ArrowRight } from 'lucide-react'

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

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <p className="brand">Mercantec Games</p>
        <h1 className="headline">Spil. Controllers. Samme host.</h1>
        <p className="lede">
          Vælg et spil herunder — eller byg en Arduino Oplà-controller med den fælles API.
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
        <h2>Arduino Oplà controller</h2>
        <p className="section-lede">
          Begge spil bruger samme HTTP-kontrakt. Skift kun <code>GAME_BASE_PATH</code> og
          action-typen — resten af sketch-strukturen er ens.
        </p>

        <ol className="flow">
          <li>
            <Wifi size={22} />
            <div>
              <strong>WiFi</strong>
              <span>Forbind Oplà til netværket</span>
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
                <code>POST …/api/controller/action</code>
              </span>
            </div>
          </li>
        </ol>

        <div className="config-block">
          <h3>Fælles config</h3>
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
                <td colSpan={2}>1</td>
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
            <h3>Nav-profil (Bomberman)</h3>
            <p>TOUCH0–3 = retning, TOUCH4 = bombe. Action: <code>move</code> / <code>bomb</code>.</p>
          </article>
          <article>
            <h3>Ability-profil (Wizard)</h3>
            <p>
              TOUCH0–4 = spells. Action: <code>cast</code> med{' '}
              <code>params.spellKey</code> (og evt. <code>targetId</code>).
            </p>
          </article>
        </div>

        <p className="repo-hint">
          Sketches ligger i hvert spil-repo under <code>iot/</code> (Bomberman) og{' '}
          <code>ArduinoKode/</code> (Wizard).
        </p>
      </section>

      <footer className="footer">
        <span>Mercantec · games.mercantec.tech</span>
      </footer>
    </div>
  )
}
