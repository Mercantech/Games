import { Link, Outlet } from 'react-router-dom'
import './App.css'

export default function App() {
  return (
    <div className="console">
      <div className="crt" aria-hidden="true" />
      <div className="console-shell">
        <div className="console-top">
          <div className="brand-badge">
            <span className="brand-mark">MERCANTEC</span>
            <span className="brand-sub">GAMES · EST. ARENA</span>
          </div>
          <nav className="console-nav">
            <Link to="/">SELECT</Link>
            <Link to="/guide">GUIDE</Link>
            <a href="/Bomberman">BOMBER</a>
            <a href="/Wizard">WIZARD</a>
          </nav>
        </div>

        <div className="screen-bezel">
          <div className="screen-glass">
            <Outlet />
          </div>
          <div className="power-row" aria-hidden="true">
            <span className="led on" />
            <span className="power-label">POWER</span>
          </div>
        </div>

        <div className="console-deck">
          <div className="deck-vent" aria-hidden="true" />
          <p className="deck-text">INSERT CONTROLLER · MKR IOT CARRIER</p>
          <div className="deck-vent" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
