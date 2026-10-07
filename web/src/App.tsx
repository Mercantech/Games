import { Link, Outlet, useLocation } from 'react-router-dom'
import NesController from './NesController'
import { PadProvider } from './PadContext'
import QrCard from './QrCard'
import './App.css'

export default function App() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const onGuide = pathname.startsWith('/guide')
  const onManual = pathname.startsWith('/manual')
  const onStatus = pathname.startsWith('/status')

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
              <Link to="/" className={onHome ? 'active' : undefined}>
                SELECT
              </Link>
              <Link to="/guide" className={onGuide ? 'active' : undefined}>
                GUIDE
              </Link>
              <Link to="/manual/bomber" className={onManual ? 'active' : undefined}>
                MANUAL
              </Link>
              <Link to="/status" className={onStatus ? 'active' : undefined}>
                STATUS
              </Link>
              <a href="/Bomberman/">BOMBER</a>
              <a href="/Wizard/">WIZARD</a>
              <a href="/Tetris/">TETRIS</a>
              <a href="/Pong/">PONG</a>
              <a href="/TowerDefense/">TOWER</a>
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
        <QrCard />
      </div>
    </PadProvider>
  )
}
