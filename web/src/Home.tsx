import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import './Home.css'

type Slot = 'bomber' | 'wizard' | 'guide'

const SLOTS: Slot[] = ['bomber', 'wizard', 'guide']

export default function Home() {
  const [cursor, setCursor] = useState(0)
  const cursorRef = useRef(0)
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  useEffect(() => {
    const onPad = (button: PadButton) => {
      if (button === 'left' || button === 'up') {
        setCursor((c) => {
          const next = (c + SLOTS.length - 1) % SLOTS.length
          cursorRef.current = next
          return next
        })
        blip('move')
        return
      }
      if (button === 'right' || button === 'down') {
        setCursor((c) => {
          const next = (c + 1) % SLOTS.length
          cursorRef.current = next
          return next
        })
        blip('move')
        return
      }
      if (button === 'select') {
        cursorRef.current = 2
        setCursor(2)
        blip('move')
        return
      }
      if (button === 'a' || button === 'start') {
        blip('ok')
        const slot = SLOTS[cursorRef.current]
        if (slot === 'bomber') window.location.href = '/Bomberman/'
        else if (slot === 'wizard') window.location.href = '/Wizard/'
        else navigate('/guide')
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, navigate])

  return (
    <div className="home">
      <p className="blink-line">PLAYER SELECT</p>
      <h1 className="title-pixel">
        MERCANTEC
        <br />
        GAMES
      </h1>
      <p className="home-lede">
        Brug controlleren nedenunder — eller piletaster + A.
      </p>

      <div className="cartridge-row" role="listbox" aria-label="Vælg spil">
        <a
          className={`cart cart-red ${cursor === 0 ? 'selected' : ''}`}
          href="/Bomberman/"
          role="option"
          aria-selected={cursor === 0}
          onMouseEnter={() => setCursor(0)}
          onFocus={() => setCursor(0)}
        >
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
          <span className="cart-go">{cursor === 0 ? '► START' : '► PLAY'}</span>
        </a>
        <a
          className={`cart cart-blue ${cursor === 1 ? 'selected' : ''}`}
          href="/Wizard/"
          role="option"
          aria-selected={cursor === 1}
          onMouseEnter={() => setCursor(1)}
          onFocus={() => setCursor(1)}
        >
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
          <span className="cart-go">{cursor === 1 ? '► START' : '► PLAY'}</span>
        </a>
      </div>

      <Link
        className={`guide-btn ${cursor === 2 ? 'selected' : ''}`}
        to="/guide"
        onMouseEnter={() => setCursor(2)}
        onFocus={() => setCursor(2)}
      >
        {cursor === 2 ? '► ' : ''}ARDUINO CONTROLLER GUIDE
      </Link>

      <p className="hint-pixel">
        CURSOR {cursor + 1}/{SLOTS.length} · A CONFIRM · B CANCEL
      </p>
    </div>
  )
}
