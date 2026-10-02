import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <p className="blink-line">PLAYER SELECT</p>
      <h1 className="title-pixel">
        MERCANTEC
        <br />
        GAMES
      </h1>
      <p className="home-lede">
        To spil. Én host. Byg din egen Oplà-controller — start med guiden.
      </p>

      <div className="cartridge-row">
        <a className="cart cart-red" href="/Bomberman/">
          <span className="cart-label">SLOT A</span>
          <img
            className="cart-art"
            src="/bomberman-nes.jpg"
            alt="Klassisk NES Bomberman — grøn maze, bomber og Valcoms"
            width={640}
            height={360}
            loading="eager"
          />
          <strong>BOMBERMAN</strong>
          <span className="cart-meta">PIN · BOMBS · MULTIPLAYER</span>
          <span className="cart-go">► PLAY</span>
        </a>
        <a className="cart cart-blue" href="/Wizard/">
          <span className="cart-label">SLOT B</span>
          <img
            className="cart-art"
            src="/wizard-duel.jpg"
            alt="Wizard Duel Arena — troldmand, spells og arena"
            width={640}
            height={360}
            loading="eager"
          />
          <strong>WIZARD DUEL</strong>
          <span className="cart-meta">SPELLS · MANA · LAST STANDING</span>
          <span className="cart-go">► PLAY</span>
        </a>
      </div>

      <Link className="guide-btn" to="/guide">
        ► ARDUINO CONTROLLER GUIDE
      </Link>

      <p className="hint-pixel">PRESS START · GAMES.MERCANTEC.TECH</p>
    </div>
  )
}
