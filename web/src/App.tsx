import { Link, Outlet, useLocation } from 'react-router-dom'
import NesController from './NesController'
import { PadProvider } from './PadContext'
import './App.css'

export default function App() {
  const { pathname } = useLocation()
  const onGuide = pathname.startsWith('/guide')

  return (
    <PadProvider>
      <div className="console">
        <div className="crt" aria-hidden="true" />
        <div className="console-shell">
          <div className="console-top">
            <div className="brand-badge">
              <span className="brand-mark">MERCANTEC</span>
              <span className="brand-sub">GAMES · EST. ARENA</span>
            </div>
            <nav className="console-nav">
              <Link to="/" className={!onGuide ? 'active' : undefined}>
                SELECT
              </Link>
              <Link to="/guide" className={onGuide ? 'active' : undefined}>
                GUIDE
              </Link>
              <a href="/Bomberman/">BOMBER</a>
              <a href="/Wizard/">WIZARD</a>
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
            <NesController />
          </div>
        </div>
      </div>
    </PadProvider>
  )
}
