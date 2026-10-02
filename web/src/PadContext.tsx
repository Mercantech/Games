import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type PadButton =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'select'
  | 'start'

type PadListener = (button: PadButton) => void

type PadContextValue = {
  pressed: Set<PadButton>
  press: (button: PadButton) => void
  subscribe: (listener: PadListener) => () => void
  blip: (kind?: 'move' | 'ok' | 'back') => void
}

const PadContext = createContext<PadContextValue | null>(null)

const KEY_MAP: Record<string, PadButton> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyZ: 'a',
  KeyX: 'b',
  Enter: 'a',
  Space: 'a',
  Escape: 'b',
  Backspace: 'b',
  ShiftLeft: 'select',
  ShiftRight: 'select',
  Tab: 'select',
  KeyC: 'select',
  KeyV: 'start',
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function PadProvider({ children }: { children: ReactNode }) {
  const [pressed, setPressed] = useState<Set<PadButton>>(() => new Set())
  const listeners = useRef(new Set<PadListener>())
  const audioCtx = useRef<AudioContext | null>(null)
  const lastFire = useRef<Record<string, number>>({})

  const blip = useCallback((kind: 'move' | 'ok' | 'back' = 'move') => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new AudioContext()
      }
      const ctx = audioCtx.current
      if (ctx.state === 'suspended') void ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      const freq = kind === 'ok' ? 520 : kind === 'back' ? 180 : 280
      osc.frequency.value = freq
      gain.gain.value = 0.035
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.09)
    } catch {
      /* audio optional */
    }
  }, [])

  const emit = useCallback(
    (button: PadButton) => {
      const now = performance.now()
      if (now - (lastFire.current[button] ?? 0) < 140) return
      lastFire.current[button] = now
      listeners.current.forEach((fn) => fn(button))
    },
    [],
  )

  const press = useCallback(
    (button: PadButton) => {
      setPressed((prev) => {
        const next = new Set(prev)
        next.add(button)
        return next
      })
      emit(button)
      window.setTimeout(() => {
        setPressed((prev) => {
          const next = new Set(prev)
          next.delete(button)
          return next
        })
      }, 120)
    },
    [emit],
  )

  const subscribe = useCallback((listener: PadListener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const button = KEY_MAP[e.code]
      if (!button) return
      if (button === 'select' && e.code === 'Tab') e.preventDefault()
      if (
        button === 'up' ||
        button === 'down' ||
        button === 'left' ||
        button === 'right' ||
        button === 'a' ||
        e.code === 'Space'
      ) {
        e.preventDefault()
      }
      if (e.repeat) return
      press(button)
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [press])

  useEffect(() => {
    let raf = 0
    const held = new Set<PadButton>()
    const mapPad = (gp: Gamepad) => {
      const buttons: Array<[number, PadButton]> = [
        [12, 'up'],
        [13, 'down'],
        [14, 'left'],
        [15, 'right'],
        [0, 'a'],
        [1, 'b'],
        [8, 'select'],
        [9, 'start'],
      ]
      const next = new Set<PadButton>()
      for (const [i, name] of buttons) {
        if (gp.buttons[i]?.pressed) next.add(name)
      }
      if (gp.axes[0] < -0.55) next.add('left')
      if (gp.axes[0] > 0.55) next.add('right')
      if (gp.axes[1] < -0.55) next.add('up')
      if (gp.axes[1] > 0.55) next.add('down')

      for (const btn of next) {
        if (!held.has(btn)) press(btn)
      }
      held.clear()
      next.forEach((b) => held.add(b))
    }

    const tick = () => {
      const pads = navigator.getGamepads?.() ?? []
      for (const gp of pads) {
        if (gp) mapPad(gp)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [press])

  const value = useMemo(
    () => ({ pressed, press, subscribe, blip }),
    [pressed, press, subscribe, blip],
  )

  return <PadContext.Provider value={value}>{children}</PadContext.Provider>
}

export function usePad() {
  const ctx = useContext(PadContext)
  if (!ctx) throw new Error('usePad must be used within PadProvider')
  return ctx
}
