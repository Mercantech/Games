import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import './Home.css'

type Slot = 'bomber' | 'wizard' | 'tetris' | 'pong' | 'guide'

type CartDef = {
  id: Slot
  label: string
  title: string
  meta: string
  href: string
  cartClass: string
  img?: { src: string; alt: string; width: number; height: number; loading?: 'eager' | 'lazy' }
  guideArt?: boolean
  blurb: string
  details: string[]
}

const CARTS: CartDef[] = [
  {
    id: 'bomber',
    label: 'SLOT A',
    title: 'BOMBERMAN',
    meta: 'PIN · BOMBS · MULTIPLAYER',
    href: '/Bomberman/',
    cartClass: 'cart-red',
    img: {
      src: '/bomberman-nes.jpg',
      alt: 'Klassisk NES Bomberman — grøn maze, bomber og Valcoms',
      width: 1024,
      height: 576,
      loading: 'eager',
    },
    blurb: 'Læg bomber, saml power-ups og spræng vennerne af banen i klassisk multiplayer.',
    details: ['PIN-lobby', 'Op til flere spillere', 'Arduino-pad: WASD + bomb'],
  },
  {
    id: 'wizard',
    label: 'SLOT B',
    title: 'WIZARD DUEL',
    meta: 'SPELLS · MANA · LAST STANDING',
    href: '/Wizard/',
    cartClass: 'cart-blue',
    img: {
      src: '/wizard-duel.jpg',
      alt: 'Wizard Duel Arena — troldmand, spells og arena',
      width: 1024,
      height: 576,
      loading: 'eager',
    },
    blurb: 'Kast spells, spill mana og vær den sidste troldmand stående i arenaen.',
    details: ['Real-time duel', 'Fireball, shield, heal…', 'Arduino-pad: spell-knapper'],
  },
  {
    id: 'tetris',
    label: 'SLOT C',
    title: 'TETRIS',
    meta: 'PIN · BATTLE · GARBAGE',
    href: '/Tetris/',
    cartClass: 'cart-purple',
    img: {
      src: '/tetris-thumb.jpg',
      alt: 'Tetris — PIN lobby, battle og garbage lines',
      width: 1024,
      height: 576,
      loading: 'lazy',
    },
    blurb: 'Battle Tetris: clear linjer og send garbage til de andre. Sidste overlevende vinder.',
    details: ['2–4 spillere', 'Hold / next / hard drop', 'Arduino-pad: move · rotate · drop'],
  },
  {
    id: 'pong',
    label: 'SLOT D',
    title: 'PONG',
    meta: 'PIN · PADDLES · CLASSIC',
    href: '/Pong/',
    cartClass: 'cart-pong',
    img: {
      src: '/pong-thumb.jpg',
      alt: 'Pong — klassisk paddle-duel med PIN-lobby',
      width: 1024,
      height: 576,
      loading: 'lazy',
    },
    blurb: 'Det klassiske TV-spil: to paddles, én bold, første til 11. Simpelt og vanedannende.',
    details: ['2 spillere (+ tilskuere)', 'Venstre / højre paddle', 'Arduino-pad: UP / DOWN'],
  },
  {
    id: 'guide',
    label: 'SLOT E',
    title: 'GUIDE',
    meta: 'PAD · WIFI · GAME_MODE',
    href: '/guide',
    cartClass: 'cart-guide',
    guideArt: true,
    blurb: 'Arduino Oplà-setup, WiFi, GAME_MODE og pad-mapping til alle spillene.',
    details: ['15-min quick track', 'Full classroom guide', 'Pad-simulator i browser'],
  },
]

const SLOTS = CARTS.map((c) => c.id)
const COLS = 2
const GUIDE_INDEX = CARTS.findIndex((c) => c.id === 'guide')

export default function Home() {
  const [cursor, setCursor] = useState(0)
  const [preview, setPreview] = useState<number | null>(null)
  const cursorRef = useRef(0)
  const previewRef = useRef<number | null>(null)
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

  useEffect(() => {
    previewRef.current = preview
    if (preview != null) {
      itemRefs.current[preview]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [preview])

  const launch = useCallback(
    (slot: Slot) => {
      if (slot === 'guide') {
        blip('ok')
        navigate('/guide')
        return
      }
      blip('insert')
      const cart = CARTS.find((c) => c.id === slot)
      const href = cart?.href ?? '/'
      window.setTimeout(() => {
        window.location.href = href
      }, 420)
    },
    [blip, navigate],
  )

  const confirm = useCallback(
    (index: number) => {
      setCursor(index)
      cursorRef.current = index
      if (previewRef.current === index) {
        launch(SLOTS[index])
        return
      }
      setPreview(index)
      previewRef.current = index
      blip('ok')
    },
    [blip, launch],
  )

  const clearPreview = useCallback(() => {
    if (previewRef.current == null) return
    setPreview(null)
    previewRef.current = null
    blip('back')
  }, [blip])

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
      if (previewRef.current != null) {
        setPreview(null)
        previewRef.current = null
      }
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
      if (button === 'b') {
        clearPreview()
        return
      }
      if (button === 'select') {
        cursorRef.current = GUIDE_INDEX
        setCursor(GUIDE_INDEX)
        setPreview(null)
        previewRef.current = null
        blip('move')
        return
      }
      if (button === 'a' || button === 'start') {
        confirm(cursorRef.current)
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, confirm, clearPreview])

  const previewCart = preview != null ? CARTS[preview] : null

  return (
    <div className={`home ${preview != null ? 'has-preview' : ''}`}>
      <p className="blink-line">PLAYER SELECT</p>
      <h1 className="title-pixel">
        MERCANTEC
        <br />
        GAMES
      </h1>
      <p className="home-lede">
        {previewCart
          ? 'Tryk A / START igen for at starte — B for at lukke.'
          : 'Vælg en cartridge — tryk én gang for preview, to gange for start.'}
      </p>

      <div className="cartridge-row" role="listbox" aria-label="Vælg spil">
        {CARTS.map((cart, index) => {
          const isCursor = cursor === index
          const isPreview = preview === index
          const goLabel = isPreview
            ? '► START NU'
            : isCursor
              ? '► VÆLG'
              : cart.id === 'guide'
                ? '► OPEN'
                : '► PLAY'

          return (
            <button
              key={cart.id}
              type="button"
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              className={`cart ${cart.cartClass} ${isCursor ? 'selected' : ''} ${
                isPreview ? 'preview' : ''
              } ${preview != null && !isPreview ? 'dimmed' : ''}`}
              role="option"
              aria-selected={isCursor}
              aria-expanded={isPreview}
              onMouseEnter={() => setCursor(index)}
              onFocus={() => setCursor(index)}
              onClick={() => confirm(index)}
            >
              <span className="cart-label">{cart.label}</span>
              <div className={`cart-art-frame ${cart.guideArt ? 'cart-art-guide' : ''}`}>
                {cart.img ? (
                  <img
                    className="cart-art"
                    src={cart.img.src}
                    alt={cart.img.alt}
                    width={cart.img.width}
                    height={cart.img.height}
                    loading={cart.img.loading}
                  />
                ) : (
                  <>
                    <span className="guide-art-title">ARDUINO</span>
                    <span className="guide-art-sub">CONTROLLER</span>
                    <span className="guide-art-hint">15 MIN · FULL</span>
                  </>
                )}
              </div>
              <div className="cart-foot">
                <strong>{cart.title}</strong>
                <span className="cart-go">{goLabel}</span>
                <span className="cart-meta">{cart.meta}</span>
              </div>

              {isPreview ? (
                <div className="cart-preview-body">
                  <p className="cart-blurb">{cart.blurb}</p>
                  <ul className="cart-details">
                    {cart.details.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <div className="cart-preview-actions">
                    <span className="preview-cta">A / START → IND I SPILLET</span>
                    <span className="preview-back">B → TILBAGE</span>
                  </div>
                </div>
              ) : null}
            </button>
          )
        })}
      </div>

      <p className="scroll-hint" aria-hidden="true">
        {preview != null ? '★ PREVIEW MODE' : '↓ SCROLL I SKÆRMEN'}
      </p>

      <p className="hint-pixel">
        CURSOR {cursor + 1}/{SLOTS.length}
        {preview != null ? ' · A START · B LUK' : ' · A PREVIEW · A×2 START'}
      </p>
    </div>
  )
}
