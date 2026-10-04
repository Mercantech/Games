import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import QrCard from './QrCard'
import './Home.css'

type Slot = 'bomber' | 'wizard' | 'guide'

const SLOTS: Slot[] = ['bomber', 'wizard', 'guide']

export default function Home() {
  const [cursor, setCursor] = useState(0)
  const cursorRef = useRef(0)
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()
  const jingled = useRef(false)

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  const launch = useCallback(
    (slot: Slot) => {
      if (slot === 'guide') {
        blip('ok')
        navigate('/guide')
        return
      }
      blip('insert')
      const href = slot === 'bomber' ? '/Bomberman/' : '/Wizard/'
      window.setTimeout(() => {
        window.location.href = href
      }, 420)
    },
    [blip, navigate],
  )

  useEffect(() => {
    const play = () => {
      if (jingled.current) return
      jingled.current = true
      blip('jingle')
    }
    const t = window.setTimeout(play, 400)
    const unlock = () => play()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [blip])

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
        launch(SLOTS[cursorRef.current])
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, launch])

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
          onClick={(e) => {
            e.preventDefault()
            setCursor(0)
            launch('bomber')
          }}
        >
          <span className="cart-label">SLOT A</span>
          <div className="cart-art-frame">
            <img
              className="cart-art"
              src="/bomberman-nes.jpg"
              alt="Klassisk NES Bomberman — grøn maze, bomber og Valcoms"
              width={1024}
              height={576}
              loading="eager"
            />
          </div>
          <div className="cart-foot">
            <strong>BOMBERMAN</strong>
            <span className="cart-go">{cursor === 0 ? '► START' : '► PLAY'}</span>
            <span className="cart-meta">PIN · BOMBS · MULTIPLAYER</span>
          </div>
        </a>
        <a
          className={`cart cart-blue ${cursor === 1 ? 'selected' : ''}`}
          href="/Wizard/"
          role="option"
          aria-selected={cursor === 1}
          onMouseEnter={() => setCursor(1)}
          onFocus={() => setCursor(1)}
          onClick={(e) => {
            e.preventDefault()
            setCursor(1)
            launch('wizard')
          }}
        >
          <span className="cart-label">SLOT B</span>
          <div className="cart-art-frame">
            <img
              className="cart-art"
              src="/wizard-duel.jpg"
              alt="Wizard Duel Arena — troldmand, spells og arena"
              width={1024}
              height={576}
              loading="eager"
            />
          </div>
          <div className="cart-foot">
            <strong>WIZARD DUEL</strong>
            <span className="cart-go">{cursor === 1 ? '► START' : '► PLAY'}</span>
            <span className="cart-meta">SPELLS · MANA · LAST STANDING</span>
          </div>
        </a>
      </div>

      <Link
        className={`guide-btn ${cursor === 2 ? 'selected' : ''}`}
        to="/guide"
        onMouseEnter={() => setCursor(2)}
        onFocus={() => setCursor(2)}
        onClick={() => blip('ok')}
      >
        {cursor === 2 ? '► ' : ''}ARDUINO CONTROLLER GUIDE
      </Link>

      <QrCard />

      <p className="hint-pixel">
        CURSOR {cursor + 1}/{SLOTS.length} · A CONFIRM · INSERT CART
      </p>
    </div>
  )
}
