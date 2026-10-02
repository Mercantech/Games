import { usePad, type PadButton } from './PadContext'
import './NesController.css'

const FACE: Array<{ id: PadButton; label: string }> = [
  { id: 'b', label: 'B' },
  { id: 'a', label: 'A' },
]

export default function NesController() {
  const { pressed, press } = usePad()
  const on = (b: PadButton) => pressed.has(b)

  return (
    <div className="nes-pad" role="group" aria-label="NES-controller">
      <div className="pad-shell">
        <div className="dpad" aria-hidden="true">
          <button
            type="button"
            className={`dpad-btn up ${on('up') ? 'lit' : ''}`}
            onClick={() => press('up')}
            aria-label="Op"
          />
          <button
            type="button"
            className={`dpad-btn left ${on('left') ? 'lit' : ''}`}
            onClick={() => press('left')}
            aria-label="Venstre"
          />
          <span className={`dpad-center ${on('up') || on('down') || on('left') || on('right') ? 'lit' : ''}`} />
          <button
            type="button"
            className={`dpad-btn right ${on('right') ? 'lit' : ''}`}
            onClick={() => press('right')}
            aria-label="Højre"
          />
          <button
            type="button"
            className={`dpad-btn down ${on('down') ? 'lit' : ''}`}
            onClick={() => press('down')}
            aria-label="Ned"
          />
        </div>

        <div className="pad-mid">
          <button
            type="button"
            className={`pill select ${on('select') ? 'lit' : ''}`}
            onClick={() => press('select')}
          >
            SELECT
          </button>
          <button
            type="button"
            className={`pill start ${on('start') ? 'lit' : ''}`}
            onClick={() => press('start')}
          >
            START
          </button>
        </div>

        <div className="face-btns">
          {FACE.map((btn) => (
            <button
              key={btn.id}
              type="button"
              className={`face ${btn.id} ${on(btn.id) ? 'lit' : ''}`}
              onClick={() => press(btn.id)}
              aria-label={btn.label}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      <p className="pad-hint">
        ← → vælg · A / START kør · B tilbage · SELECT guide
      </p>
    </div>
  )
}
