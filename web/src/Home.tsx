import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import './Home.css'

type Slot = 'bomber' | 'wizard' | 'tetris' | 'pong' | 'guide'

const SLOTS: Slot[] = ['bomber', 'wizard', 'tetris', 'pong', 'guide']
const COLS = 2
const GUIDE_INDEX = 4

export default function Home() {
  const [cursor, setCursor] = useState(0)
  const cursorRef = useRef(0)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()
  const jingled = useRef(false)

  useEffect(() => {
    cursorRef.current = cursor
    itemRefs.current[cursor]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    })
  }, [cursor])

  const launch = useCallback(
    (slot: Slot) => {
      if (slot === 'guide') {
        blip('ok')
        navigate('/guide')
        return
      }
      blip('insert')
      const href =
        slot === 'bomber'
          ? '/Bomberman/'
          : slot === 'wizard'
            ? '/Wizard/'
            : slot === 'tetris'
              ? '/Tetris/'
              : '/Pong/'
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
    const move = (delta: number) => {
      setCursor((c) => {
        const next = (c + delta + SLOTS.length) % SLOTS.length
        cursorRef.current = next
        return next
      })
      blip('move')
    }

    const onPad = (button: PadButton) => {
      if (button === 'left') {
        move(-1)
        return
      }
      if (button === 'right') {
        move(1)
        return
      }
      if (button === 'up') {
        move(-COLS)
        return
      }
      if (button === 'down') {
        move(COLS)
        return
      }
      if (button === 'select') {
        cursorRef.current = GUIDE_INDEX
        setCursor(GUIDE_INDEX)
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
        To cartridges pr. række — scroll ned i skærmen for flere.
      </p>

      <div className="cartridge-row" role="listbox" aria-label="Vælg spil">
        <a
          ref={(el) => {
            itemRefs.current[0] = el
          }}
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
          ref={(el) => {
            itemRefs.current[1] = el
          }}
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
        <a
          ref={(el) => {
            itemRefs.current[2] = el
          }}
          className={`cart cart-purple ${cursor === 2 ? 'selected' : ''}`}
          href="/Tetris/"
          role="option"
          aria-selected={cursor === 2}
          onMouseEnter={() => setCursor(2)}
          onFocus={() => setCursor(2)}
          onClick={(e) => {
            e.preventDefault()
            setCursor(2)
            launch('tetris')
          }}
        >
          <span className="cart-label">SLOT C</span>
          <div className="cart-art-frame">
            <img
              className="cart-art"
              src="/tetris-thumb.jpg"
              alt="Tetris — PIN lobby, battle og garbage lines"
              width={1024}
              height={576}
              loading="lazy"
            />
          </div>
          <div className="cart-foot">
            <strong>TETRIS</strong>
            <span className="cart-go">{cursor === 2 ? '► START' : '► PLAY'}</span>
            <span className="cart-meta">PIN · BATTLE · GARBAGE</span>
          </div>
        </a>
        <a
          ref={(el) => {
            itemRefs.current[3] = el
          }}
          className={`cart cart-pong ${cursor === 3 ? 'selected' : ''}`}
          href="/Pong/"
          role="option"
          aria-selected={cursor === 3}
          onMouseEnter={() => setCursor(3)}
          onFocus={() => setCursor(3)}
          onClick={(e) => {
            e.preventDefault()
            setCursor(3)
            launch('pong')
          }}
        >
          <span className="cart-label">SLOT D</span>
          <div className="cart-art-frame">
            <img
              className="cart-art"
              src="/pong-thumb.jpg"
              alt="Pong — klassisk paddle-duel med PIN-lobby"
              width={1024}
              height={576}
              loading="lazy"
            />
          </div>
          <div className="cart-foot">
            <strong>PONG</strong>
            <span className="cart-go">{cursor === 3 ? '► START' : '► PLAY'}</span>
            <span className="cart-meta">PIN · PADDLES · CLASSIC</span>
          </div>
        </a>
        <Link
          ref={(el) => {
            itemRefs.current[4] = el
          }}
          className={`cart cart-guide ${cursor === GUIDE_INDEX ? 'selected' : ''}`}
          to="/guide"
          role="option"
          aria-selected={cursor === GUIDE_INDEX}
          onMouseEnter={() => setCursor(GUIDE_INDEX)}
          onFocus={() => setCursor(GUIDE_INDEX)}
          onClick={() => blip('ok')}
        >
          <span className="cart-label">SLOT E</span>
          <div className="cart-art-frame cart-art-guide">
            <span className="guide-art-title">ARDUINO</span>
            <span className="guide-art-sub">CONTROLLER</span>
            <span className="guide-art-hint">15 MIN · FULL</span>
          </div>
          <div className="cart-foot">
            <strong>GUIDE</strong>
            <span className="cart-go">{cursor === GUIDE_INDEX ? '► START' : '► OPEN'}</span>
            <span className="cart-meta">PAD · WIFI · GAME_MODE</span>
          </div>
        </Link>
      </div>

      <p className="scroll-hint" aria-hidden="true">
        ↓ SCROLL I SKÆRMEN
      </p>

      <p className="hint-pixel">
        CURSOR {cursor + 1}/{SLOTS.length} · ←→ RÆKKE · ↑↓ NED · A CONFIRM
      </p>
    </div>
  )
}
