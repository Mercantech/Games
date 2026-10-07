import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import './Manual.css'

type GameId = 'bomber' | 'tetris' | 'pong' | 'tower'

type Step = { n: string; title: string; text: string }
type KeyRow = { key: string; does: string }

type GameManual = {
  id: GameId
  title: string
  kicker: string
  href: string
  idea: string
  win: string
  flow: Step[]
  keys: KeyRow[]
  pad: string
}

const GAMES: GameManual[] = [
  {
    id: 'bomber',
    title: 'BOMBERMAN',
    kicker: 'PIN · BOMBER · SIDSTE I LIVE',
    href: '/Bomberman/',
    idea: 'I deler én maze. Bløde mursten kan sprænges. Faste søjler kan ikke. En bombe eksploderer i et kors — og den rammer også dig.',
    win: 'Sidste spiller i live vinder. Er I flere, og alle dør i samme blast, er der ingen vinder.',
    flow: [
      { n: '01', title: 'PIN', text: 'Admin opretter lobby og bane (9×9 til 21×21). Del PIN.' },
      { n: '02', title: 'JOIN', text: 'Alle skriver PIN og joiner. Når I er klar: Start spil.' },
      { n: '03', title: 'BLAST', text: 'Læg bomber, hent power-ups i murbrokkerne, og vær den sidste tilbage.' },
    ],
    keys: [
      { key: '↑ ↓ ← →', does: 'Gå. WASD gør det samme.' },
      { key: 'MELLEMRUM', does: 'Læg en bombe på dit felt.' },
    ],
    pad: 'Oplà: move + retning, eller bomb. Valgfrit MQTT kun på Bomberman.',
  },
  {
    id: 'tetris',
    title: 'TETRIS',
    kicker: 'PIN · BATTLE · GARBAGE',
    href: '/Tetris/',
    idea: 'Hver spiller har sin egen 10×20 brønd. Linjer du clearer, bliver til skrald hos en tilfældig modstander — med ét hul, så de kan grave sig ud.',
    win: 'Sidste spiller i live vinder. Går flere ud samtidig, vinder den højeste score.',
    flow: [
      { n: '01', title: 'LOBBY', text: 'Opret lobby og del PIN. 2–4 spillere joiner med navn.' },
      { n: '02', title: 'START', text: 'Start spil. Brikkerne kommer fra en fælles 7-bag: I, O, T, S, Z, J, L.' },
      { n: '03', title: 'SEND', text: '1 linje sender intet. 2 linjer → 1 skrald. 3 → 2. Tetris (4) → 4 rækker.' },
    ],
    keys: [
      { key: '← →', does: 'Flyt brikken. A og D virker også.' },
      { key: '↓', does: 'Soft drop. S gør det samme.' },
      { key: '↑  /  X', does: 'Roter med uret.' },
      { key: 'MELLEMRUM', does: 'Hard drop — brikken smækker ned.' },
      { key: 'C', does: 'Hold. Byttet med den brik du har lagt til side.' },
    ],
    pad: 'Oplà: GAME_MODE_TETRIS. Actions: move LEFT/RIGHT/DOWN, rotate, hardDrop, hold.',
  },
  {
    id: 'pong',
    title: 'PONG',
    kicker: 'PIN · 2 PADDLER · FØRST TIL 11',
    href: '/Pong/',
    idea: 'To paddles, én bold, ét net. Bolden bliver hurtigere, og vinklen du rammer med sender den et nyt sted hen. Flere end to i lobbyen bliver tilskuere.',
    win: 'Første til 11 point vinder. Classic er ren duel. Arcade tilføjer WIDE, NUDGE og SMASH.',
    flow: [
      { n: '01', title: 'MODE', text: 'Opret lobby som Classic eller Arcade, og del PIN.' },
      { n: '02', title: 'SIDER', text: 'Første spiller får venstre paddle. Næste får højre. Resten ser på.' },
      { n: '03', title: '11', text: 'Start når begge paddles er inde. Point når bolden går forbi en paddle.' },
    ],
    keys: [
      { key: 'W / S', does: 'Venstre paddle op og ned. Pile virker også på venstre.' },
      { key: '↑ / ↓', does: 'Højre paddle. Kun pile — ikke W/S.' },
      { key: '1  /  Q', does: 'Arcade: WIDE. Paddle bliver højere et øjeblik.' },
      { key: '3  /  E', does: 'Arcade: NUDGE. Paddle snapper mod bolden.' },
      { key: '4  /  SPACE', does: 'Arcade: SMASH. Næste retur er en hurtig orange bold.' },
    ],
    pad: 'Oplà: TOUCH0 op, TOUCH2 ned. Arcade: TOUCH1 WIDE, TOUCH3 NUDGE, TOUCH4 SMASH.',
  },
  {
    id: 'tower',
    title: 'TOWER DEFENSE',
    kicker: 'SOLO · 12 WAVES · TRE TÅRNE',
    href: '/TowerDefense/',
    idea: 'Creeps følger stien gennem gården. Du bygger ved siden af den. Arrow skyder hurtigt, Cannon rammer i splash, Frost sinker dem. De der når fæstningen, koster liv.',
    win: 'Du starter med 120 gold og 20 liv. Overlev wave 12. En tank der slipper igennem koster 2 liv. X sælger et tårn for ca. 60 % tilbage.',
    flow: [
      { n: '01', title: 'START', text: 'Én spiller. Tryk Start. Ingen PIN — banen er din.' },
      { n: '02', title: 'BYG', text: 'Flyt cursor til et ledigt slot, vælg tårn, og byg. Space på et tårn opgraderer det.' },
      { n: '03', title: 'WAVE', text: 'N kalder næste wave tidligere. Gold kommer fra kills. 12 waves, så er gården holdt.' },
    ],
    keys: [
      { key: 'PILE', does: 'Flyt cursor mellem build-slots. WASD gør det samme.' },
      { key: 'Q  /  E', does: 'Forrige eller næste tårntype. 1, 2 og 3 vælger direkte.' },
      { key: 'SPACE', does: 'Byg på tomt slot, eller opgrader tårnet under cursoren.' },
      { key: 'X', does: 'Sælg tårnet og få en del af guldet tilbage.' },
      { key: 'N', does: 'Kald næste wave, hvis du er klar før køen er tom.' },
    ],
    pad: 'Fem knapper: forrige/næste slot, forrige/næste type, place. Samme controller-API som de andre spil.',
  },
]

const ORDER = GAMES.map((g) => g.id)

function isGameId(value: string | undefined): value is GameId {
  return ORDER.includes(value as GameId)
}

export default function Manual() {
  const { game } = useParams()
  if (!isGameId(game)) return <Navigate to="/manual/bomber" replace />
  return <Booklet gameId={game} />
}

function Booklet({ gameId }: { gameId: GameId }) {
  const navigate = useNavigate()
  const { subscribe, blip } = usePad()
  const game = GAMES.find((g) => g.id === gameId) ?? GAMES[0]
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    const onPad = (button: PadButton) => {
      const current = gameRef.current
      const index = ORDER.indexOf(current.id)
      if (button === 'b') {
        blip('back')
        navigate('/')
        return
      }
      if (button === 'left' || button === 'right') {
        const delta = button === 'right' ? 1 : -1
        const next = ORDER[(index + delta + ORDER.length) % ORDER.length]
        blip('move')
        navigate(`/manual/${next}`)
        return
      }
      if (button === 'a' || button === 'start') {
        blip('ok')
        window.location.href = current.href
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, navigate])

  return (
    <article className={`manual game-${game.id}`}>
      <header className="man-hero">
        <p className="blink-line">INSTRUCTION BOOKLET</p>
        <h1 className="title-pixel">{game.title}</h1>
        <p className="man-kicker">{game.kicker}</p>
      </header>

      <nav className="man-tabs" aria-label="Vælg spil">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to={`/manual/${g.id}`}
            className={g.id === game.id ? 'on' : undefined}
            aria-current={g.id === game.id ? 'page' : undefined}
          >
            {g.title}
          </Link>
        ))}
      </nav>

      <section className="man-block" id="ide">
        <div className="man-head">
          <span>01</span>
          <h2>Idé</h2>
        </div>
        <div className="man-split">
          <Picture id={game.id} />
          <div>
            <p>{game.idea}</p>
            <p className="man-win">{game.win}</p>
          </div>
        </div>
      </section>

      <section className="man-block" id="flow">
        <div className="man-head">
          <span>02</span>
          <h2>Flow</h2>
        </div>
        <ol className="man-flow">
          {game.flow.map((step) => (
            <li key={step.n}>
              <FlowFrame id={game.id} step={step.n} />
              <strong>
                <em>{step.n}</em> {step.title}
              </strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="man-block" id="controls">
        <div className="man-head">
          <span>03</span>
          <h2>Controls</h2>
        </div>
        <ul className="man-keys">
          {game.keys.map((row) => (
            <li key={row.key}>
              <kbd>{row.key}</kbd>
              <span>{row.does}</span>
            </li>
          ))}
        </ul>
        <p className="man-pad">{game.pad}</p>
        <a className="man-play" href={game.href}>
          SPIL {game.title}
        </a>
      </section>

      <p className="man-hint">← → SKIFT SPIL · A / START ÅBNER ARENA · B TIL SELECT</p>
    </article>
  )
}

function Picture({ id }: { id: GameId }) {
  if (id === 'bomber') return <BomberPicture />
  if (id === 'tetris') return <TetrisPicture />
  if (id === 'pong') return <PongPicture />
  return <TowerPicture />
}

function FlowFrame({ id, step }: { id: GameId; step: string }) {
  return (
    <div className={`flow-frame frame-${id} step-${step}`} aria-hidden="true">
      {id === 'bomber' && step === '01' ? <span className="pin-card">PIN 4821</span> : null}
      {id === 'bomber' && step === '02' ? (
        <span className="dot-row">
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
      {id === 'bomber' && step === '03' ? <span className="mini-blast" /> : null}
      {id === 'tetris' && <span className={`mini-well well-${step}`} />}
      {id === 'pong' && (
        <span className="mini-court">
          <i className="mp left" />
          <i className="mp right" />
          <i className={`mb step-${step}`} />
        </span>
      )}
      {id === 'tower' && step === '01' ? <span className="gold-chip">120 G</span> : null}
      {id === 'tower' && step === '02' ? <span className="mini-towers" /> : null}
      {id === 'tower' && step === '03' ? <span className="wave-chip">12 / 12</span> : null}
    </div>
  )
}

type BomberCell = 'solid' | 'floor' | 'brick' | 'player' | 'rival' | 'bomb' | 'flame' | 'b' | 'f' | 's'

const BOMBER: BomberCell[][] = [
  ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
  ['solid', 'player', 'floor', 'brick', 'floor', 's', 'solid'],
  ['solid', 'brick', 'solid', 'flame', 'solid', 'brick', 'solid'],
  ['solid', 'floor', 'flame', 'flame', 'flame', 'floor', 'solid'],
  ['solid', 'floor', 'bomb', 'flame', 'brick', 'rival', 'solid'],
  ['solid', 'b', 'floor', 'brick', 'floor', 'f', 'solid'],
  ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
]

function BomberPicture() {
  return (
    <figure className="sheet">
      <div className="pic-maze" aria-hidden="true">
        {BOMBER.flat().map((cell, i) => (
          <i key={i} className={`pic-cell is-${cell}`} />
        ))}
      </div>
      <figcaption>
        <span>Hvid = dig</span>
        <span>Rød = modstander</span>
        <span>B flamme-bombe · F længere kors · S fart</span>
      </figcaption>
    </figure>
  )
}

const TETRIS_STACK: (string | null)[][] = [
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, '#a000f0', '#a000f0', '#a000f0', null, null, null, null],
  [null, null, null, null, '#a000f0', null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null],
  ['#0000f0', '#0000f0', '#0000f0', null, '#00f000', '#00f000', null, '#f0a000', '#f0a000', '#f0a000'],
  ['#0000f0', null, null, null, null, '#00f000', '#00f000', '#f0a000', null, null],
  ['#888888', '#888888', '#888888', null, '#888888', '#888888', '#888888', '#888888', '#888888', '#888888'],
]

function TetrisPicture() {
  return (
    <figure className="sheet">
      <div className="tet-layout" aria-hidden="true">
        <div className="side-box">
          <em>HOLD</em>
          <i className="hold-i" />
        </div>
        <div className="pic-well">
          {TETRIS_STACK.flat().map((color, i) => (
            <i
              key={i}
              className={color ? 'pic-block' : 'pic-empty'}
              style={color ? { background: color } : undefined}
            />
          ))}
        </div>
        <div className="side-box">
          <em>NEXT</em>
          <i className="next-l" />
        </div>
      </div>
      <figcaption>
        <span>Lilla T er i luften</span>
        <span>Grå række = garbage med ét hul</span>
        <span>Hold I · next L</span>
      </figcaption>
    </figure>
  )
}

function PongPicture() {
  return (
    <figure className="sheet">
      <div className="pong-duo" aria-hidden="true">
        <div className="pic-court is-classic">
          <em>CLASSIC</em>
          <b>03</b>
          <b className="is-right">07</b>
          <i className="pic-net" />
          <i className="pic-paddle is-left" />
          <i className="pic-paddle is-right" />
          <i className="pic-ball" />
        </div>
        <div className="pic-court is-arcade">
          <em>ARCADE</em>
          <b>05</b>
          <b className="is-right">05</b>
          <i className="pic-net" />
          <i className="pic-paddle is-left is-wide" />
          <i className="pic-paddle is-right is-smash" />
          <i className="pic-ball is-hot" />
        </div>
      </div>
      <figcaption>
        <span>Classic: hvide paddles</span>
        <span>WIDE = højere, blå</span>
        <span>SMASH = orange bold</span>
      </figcaption>
    </figure>
  )
}

function TowerPicture() {
  return (
    <figure className="sheet">
      <div className="pic-fort" aria-hidden="true">
        <div className="pic-hud">
          <span>GOLD 80</span>
          <span>LIVES 18</span>
          <span>WAVE 4/12</span>
        </div>
        <div className="pic-yard">
          <i className="pic-path" />
          <i className="pic-tower is-arrow" />
          <i className="pic-tower is-cannon" />
          <i className="pic-tower is-frost" />
          <i className="pic-creep" />
          <i className="pic-cursor" />
          <i className="pic-keep" />
        </div>
      </div>
      <figcaption>
        <span>Gul Arrow · 40g</span>
        <span>Rød Cannon · 70g splash</span>
        <span>Blå Frost · 55g slow</span>
      </figcaption>
    </figure>
  )
}
