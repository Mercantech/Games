import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import './Manual.css'

type GameId = 'bomber' | 'tetris' | 'pong' | 'tower'

type Step = { n: string; title: string; text: string }
type KeyRow = { key: string; does: string }
type Scene = { id: string; title: string; caption: string }
type Tip = { title: string; text: string }

type GameManual = {
  id: GameId
  short: string
  title: string
  kicker: string
  href: string
  thumb: string
  thumbAlt: string
  players: string
  time: string
  idea: string
  win: string
  flow: Step[]
  keys: KeyRow[]
  pad: string
  scenes: Scene[]
  tips: Tip[]
}

const GAMES: GameManual[] = [
  {
    id: 'bomber',
    short: 'BOMBER',
    title: 'BOMBERMAN',
    kicker: 'PIN · BOMBER · SIDSTE I LIVE',
    href: '/Bomberman/',
    thumb: '/bomberman-nes.jpg',
    thumbAlt: 'Bomberman — maze med mursten og bomber',
    players: '2–8',
    time: '3–8 min',
    idea: 'I deler én maze. Bløde mursten kan sprænges. Faste søjler kan ikke. En bombe eksploderer i et kors — og den rammer også dig.',
    win: 'Sidste spiller i live vinder. Dør alle i samme blast, er der ingen vinder.',
    flow: [
      { n: '01', title: 'PIN', text: 'Admin opretter lobby og bane (9×9 til 21×21). Del PIN med holdet.' },
      { n: '02', title: 'JOIN', text: 'Alle skriver PIN og joiner. Når I er klar: Start spil.' },
      { n: '03', title: 'BLAST', text: 'Læg bomber, hent power-ups i murbrokkerne, og vær den sidste tilbage.' },
    ],
    keys: [
      { key: '↑ ↓ ← →', does: 'Gå én felt ad gangen. WASD gør det samme.' },
      { key: 'MELLEMRUM', does: 'Læg en bombe på dit felt. Den tæller ned og eksploderer i et kors.' },
    ],
    pad: 'Oplà: move + retning, eller bomb. Valgfrit MQTT kun på Bomberman.',
    scenes: [
      { id: 'maze', title: 'MAZEN', caption: 'Brun = blød mur. Mørk = fast søjle. Gå kun på gulvet.' },
      { id: 'blast', title: 'EKSPLOSION', caption: 'Bomben slår i kors. Skjul dig bag en søjle — eller bliv væk.' },
      { id: 'loot', title: 'POWER-UPS', caption: 'B = flere bomber. F = længere flamme. S = mere fart.' },
      { id: 'duel', title: 'DUEL', caption: 'Pres modstanderen ind i et hjørne. Sidste i live vinder.' },
    ],
    tips: [
      { title: 'Læg og løb', text: 'Placer bomben og gå væk med det samme. Din egen flamme er lige så farlig.' },
      { title: 'Saml F først', text: 'Længere flamme åbner flere mursten og giver dig kontrol over midten.' },
      { title: 'Brug søjlerne', text: 'Faste søjler stopper flammen. Stil dig bag dem, når modstanderen bomber.' },
    ],
  },
  {
    id: 'tetris',
    short: 'TETRIS',
    title: 'TETRIS',
    kicker: 'PIN · BATTLE · GARBAGE',
    href: '/Tetris/',
    thumb: '/tetris-thumb.jpg',
    thumbAlt: 'Battle Tetris — brønde og garbage',
    players: '2–4',
    time: '5–12 min',
    idea: 'Hver spiller har sin egen 10×20 brønd. Linjer du clearer, bliver til skrald hos en tilfældig modstander — med ét hul, så de kan grave sig ud.',
    win: 'Sidste spiller i live vinder. Går flere ud samtidig, vinder den højeste score.',
    flow: [
      { n: '01', title: 'LOBBY', text: 'Opret lobby og del PIN. 2–4 spillere joiner med navn.' },
      { n: '02', title: 'START', text: 'Start spil. Brikkerne kommer fra en fælles 7-bag: I, O, T, S, Z, J, L.' },
      { n: '03', title: 'SEND', text: '1 linje sender intet. 2 → 1 skrald. 3 → 2. Tetris (4) → 4 rækker.' },
    ],
    keys: [
      { key: '← →', does: 'Flyt brikken. A og D virker også.' },
      { key: '↓', does: 'Soft drop. S gør det samme.' },
      { key: '↑  /  X', does: 'Roter med uret.' },
      { key: 'MELLEMRUM', does: 'Hard drop — brikken smækker ned med det samme.' },
      { key: 'C', does: 'Hold. Byt med den brik du har lagt til side.' },
    ],
    pad: 'Oplà: GAME_MODE_TETRIS. Actions: move LEFT/RIGHT/DOWN, rotate, hardDrop, hold.',
    scenes: [
      { id: 'well', title: 'DIN BRØND', caption: 'Hold til venstre. Next til højre. Aktiv brik i midten.' },
      { id: 'clear', title: 'CLEAR', caption: 'Fyld en hel række — den forsvinder, og du får plads igen.' },
      { id: 'garbage', title: 'GARBAGE', caption: 'Grå rækker med ét hul lander hos en modstander.' },
      { id: 'topout', title: 'TOP OUT', caption: 'Når brønden er fuld, er du ude. De andre spiller videre.' },
    ],
    tips: [
      { title: 'Spar I-brikken', text: 'Hold I til en Tetris. Fire linjer sender fire skrald — det gør ondt.' },
      { title: 'Grav i hullet', text: 'Garbage har altid ét hul. Sigte efter det, før bunken vokser.' },
      { title: 'Kig på next', text: 'Planlæg to brikker frem. Soft drop køber dig tid, hard drop låser dig fast.' },
    ],
  },
  {
    id: 'pong',
    short: 'PONG',
    title: 'PONG',
    kicker: 'PIN · 2 PADDLER · FØRST TIL 11',
    href: '/Pong/',
    thumb: '/pong-thumb.jpg',
    thumbAlt: 'Pong — paddles og bold',
    players: '2 (+ tilskuere)',
    time: '3–6 min',
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
    scenes: [
      { id: 'classic', title: 'CLASSIC', caption: 'Hvide paddles. Ingen powers. Ren timing og vinkel.' },
      { id: 'wide', title: 'WIDE', caption: 'Paddle bliver blå og højere. Bedre dækning i et kort vindue.' },
      { id: 'nudge', title: 'NUDGE', caption: 'Paddle snapper mod bolden — godt når du er for sent ude.' },
      { id: 'smash', title: 'SMASH', caption: 'Næste hit farver bolden orange og sender den afsted hurtigt.' },
    ],
    tips: [
      { title: 'Ram med kanten', text: 'Midten giver et fladt slag. Øvre/nedre kant giver skarpere vinkel.' },
      { title: 'Spar SMASH', text: 'Vent til bolden er tæt på dig. En ladet smash midt i banen er spildt.' },
      { title: 'Tilskuere er OK', text: 'Kun to paddles. Ekstra joiner ser kampen — del PIN alligevel.' },
    ],
  },
  {
    id: 'tower',
    short: 'TOWER',
    title: 'TOWER DEFENSE',
    kicker: 'SOLO · 12 WAVES · TRE TÅRNE',
    href: '/TowerDefense/',
    thumb: '/tower-defense-thumb.jpg',
    thumbAlt: 'Tower Defense — sti, tårne og fæstning',
    players: '1',
    time: '8–15 min',
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
    scenes: [
      { id: 'path', title: 'STIEN', caption: 'Creeps går kun på den brune sti. Byg i de ledige slots ved siden af.' },
      { id: 'towers', title: 'TRE TÅRNE', caption: 'Arrow 40g · Cannon 70g splash · Frost 55g slow.' },
      { id: 'upgrade', title: 'UPGRADE', caption: 'Space på et tårn koster gold og hæver level. Max level? Sælg med X.' },
      { id: 'breach', title: 'BREACH', caption: 'Slipper en creep igennem, mister du liv. Tank koster to.' },
    ],
    tips: [
      { title: 'Frost først', text: 'Slow på svinget giver Arrow og Cannon mere tid til at skyde.' },
      { title: 'Opgrader midten', text: 'Et lvl 2 Cannon midt på stien slår flere end tre lvl 1 i enderne.' },
      { title: 'N når du er klar', text: 'Kald næste wave tidligt for tempo — men kun hvis din linje holder.' },
    ],
  },
]

const ORDER = GAMES.map((g) => g.id)
const SECTIONS = [
  { id: 'ide', label: 'IDÉ' },
  { id: 'scener', label: 'SCENER' },
  { id: 'flow', label: 'FLOW' },
  { id: 'controls', label: 'STYR' },
  { id: 'tips', label: 'TIPS' },
] as const

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
  const index = ORDER.indexOf(game.id)
  const prev = GAMES[(index - 1 + GAMES.length) % GAMES.length]
  const next = GAMES[(index + 1) % GAMES.length]
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [gameId])

  useEffect(() => {
    const onPad = (button: PadButton) => {
      const current = gameRef.current
      const ix = ORDER.indexOf(current.id)
      if (button === 'b') {
        blip('back')
        navigate('/')
        return
      }
      if (button === 'left' || button === 'right') {
        const delta = button === 'right' ? 1 : -1
        const target = ORDER[(ix + delta + ORDER.length) % ORDER.length]
        blip('move')
        navigate(`/manual/${target}`)
        return
      }
      if (button === 'a' || button === 'start') {
        blip('ok')
        window.location.href = current.href
      }
    }
    return subscribe(onPad)
  }, [subscribe, blip, navigate])

  const jump = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    blip('move')
  }

  return (
    <article className={`manual game-${game.id}`}>
      <nav className="man-sticky" aria-label="Spillebog">
        <div className="man-tabs" role="tablist" aria-label="Vælg spil">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              to={`/manual/${g.id}`}
              className={`tab-${g.id} ${g.id === game.id ? 'on' : ''}`}
              role="tab"
              aria-selected={g.id === game.id}
              aria-current={g.id === game.id ? 'page' : undefined}
            >
              <span className="tab-dot" aria-hidden="true" />
              <span className="tab-short">{g.short}</span>
              <span className="tab-full">{g.title}</span>
            </Link>
          ))}
        </div>
        <div className="man-jump" aria-label="Hop i bogen">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" onClick={() => jump(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <header className="man-hero">
        <div className="man-hero-copy">
          <p className="blink-line">INSTRUCTION BOOKLET</p>
          <h1 className="title-pixel">{game.title}</h1>
          <p className="man-kicker">{game.kicker}</p>
          <ul className="man-meta">
            <li>
              <em>SPILLERE</em>
              <span>{game.players}</span>
            </li>
            <li>
              <em>TID</em>
              <span>{game.time}</span>
            </li>
            <li>
              <em>SLOT</em>
              <span>
                {index + 1}/{GAMES.length}
              </span>
            </li>
          </ul>
          <div className="man-hero-actions">
            <a className="man-play" href={game.href}>
              SPIL NU →
            </a>
            <button type="button" className="man-ghost" onClick={() => jump('controls')}>
              SE STYRING
            </button>
          </div>
        </div>
        <figure className="man-cover">
          <img src={game.thumb} alt={game.thumbAlt} width={1024} height={576} loading="eager" />
          <figcaption>Fra arenaen · {game.title}</figcaption>
        </figure>
      </header>

      <section className="man-block" id="ide">
        <div className="man-head">
          <span>01</span>
          <h2>Idé</h2>
        </div>
        <div className="man-split">
          <HeroScene id={game.id} />
          <div>
            <p>{game.idea}</p>
            <p className="man-win">
              <strong>SÅDAN VINDER DU</strong>
              {game.win}
            </p>
          </div>
        </div>
      </section>

      <section className="man-block" id="scener">
        <div className="man-head">
          <span>02</span>
          <h2>Scener fra spillet</h2>
        </div>
        <p className="man-lede">Fire snapshots — læs dem som en hurtig film, før I starter.</p>
        <ul className="man-gallery">
          {game.scenes.map((scene) => (
            <li key={scene.id}>
              <SceneFrame game={game.id} scene={scene.id} />
              <strong>{scene.title}</strong>
              <span>{scene.caption}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="man-block" id="flow">
        <div className="man-head">
          <span>03</span>
          <h2>Flow</h2>
        </div>
        <ol className="man-flow">
          {game.flow.map((step, i) => (
            <li key={step.n}>
              <FlowFrame id={game.id} step={step.n} />
              <div className="flow-copy">
                <strong>
                  <em>{step.n}</em> {step.title}
                </strong>
                <span>{step.text}</span>
              </div>
              {i < game.flow.length - 1 ? <span className="flow-arrow" aria-hidden="true">→</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="man-block" id="controls">
        <div className="man-head">
          <span>04</span>
          <h2>Controls</h2>
        </div>
        <div className="man-controls">
          <ControlPad id={game.id} />
          <ul className="man-keys">
            {game.keys.map((row) => (
              <li key={row.key}>
                <kbd>{row.key}</kbd>
                <span>{row.does}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="man-pad">{game.pad}</p>
      </section>

      <section className="man-block" id="tips">
        <div className="man-head">
          <span>05</span>
          <h2>Tips</h2>
        </div>
        <ul className="man-tips">
          {game.tips.map((tip) => (
            <li key={tip.title}>
              <strong>{tip.title}</strong>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="man-foot">
        <Link className="man-nav-btn" to={`/manual/${prev.id}`}>
          ← {prev.short}
        </Link>
        <a className="man-play big" href={game.href}>
          SPIL {game.title}
        </a>
        <Link className="man-nav-btn" to={`/manual/${next.id}`}>
          {next.short} →
        </Link>
      </footer>

      <p className="man-hint">← → SKIFT SPIL · A / START ÅBNER ARENA · B TIL SELECT</p>
    </article>
  )
}

function HeroScene({ id }: { id: GameId }) {
  if (id === 'bomber') return <BomberScene variant="blast" />
  if (id === 'tetris') return <TetrisScene variant="well" />
  if (id === 'pong') return <PongScene variant="classic" />
  return <TowerScene variant="path" />
}

function SceneFrame({ game, scene }: { game: GameId; scene: string }) {
  if (game === 'bomber') return <BomberScene variant={scene} />
  if (game === 'tetris') return <TetrisScene variant={scene} />
  if (game === 'pong') return <PongScene variant={scene} />
  return <TowerScene variant={scene} />
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

function ControlPad({ id }: { id: GameId }) {
  const map: Record<GameId, { dpad: string; a: string; b: string; note: string }> = {
    bomber: { dpad: 'GÅ', a: 'BOMB', b: '—', note: 'D-pad / WASD + Space' },
    tetris: { dpad: 'FLYT', a: 'ROTÉR', b: 'HOLD', note: 'Pile + X / C / Space' },
    pong: { dpad: 'OP/NED', a: 'SMASH', b: 'WIDE', note: 'W/S eller pile · Arcade 1/3/4' },
    tower: { dpad: 'SLOT', a: 'BYG', b: 'SÆLG', note: 'Pile + Space / X / Q·E' },
  }
  const m = map[id]
  return (
    <div className={`ctrl-pad accent-${id}`} aria-hidden="true">
      <div className="ctrl-dpad">
        <i className="u" />
        <i className="l" />
        <i className="c" />
        <i className="r" />
        <i className="d" />
        <span>{m.dpad}</span>
      </div>
      <div className="ctrl-face">
        <span className="face-b">
          <em>B</em>
          {m.b}
        </span>
        <span className="face-a">
          <em>A</em>
          {m.a}
        </span>
      </div>
      <p>{m.note}</p>
    </div>
  )
}

type BomberCell = 'solid' | 'floor' | 'brick' | 'player' | 'rival' | 'bomb' | 'flame' | 'b' | 'f' | 's'

const BOMBER_MAPS: Record<string, BomberCell[][]> = {
  maze: [
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
    ['solid', 'player', 'floor', 'brick', 'floor', 'brick', 'solid'],
    ['solid', 'brick', 'solid', 'floor', 'solid', 'brick', 'solid'],
    ['solid', 'floor', 'brick', 'floor', 'brick', 'floor', 'solid'],
    ['solid', 'brick', 'solid', 'floor', 'solid', 'rival', 'solid'],
    ['solid', 'floor', 'floor', 'brick', 'floor', 'floor', 'solid'],
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
  ],
  blast: [
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
    ['solid', 'player', 'floor', 'brick', 'floor', 's', 'solid'],
    ['solid', 'brick', 'solid', 'flame', 'solid', 'brick', 'solid'],
    ['solid', 'floor', 'flame', 'flame', 'flame', 'floor', 'solid'],
    ['solid', 'floor', 'bomb', 'flame', 'brick', 'rival', 'solid'],
    ['solid', 'b', 'floor', 'brick', 'floor', 'f', 'solid'],
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
  ],
  loot: [
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
    ['solid', 'floor', 'b', 'floor', 'f', 'floor', 'solid'],
    ['solid', 'floor', 'solid', 's', 'solid', 'floor', 'solid'],
    ['solid', 'player', 'floor', 'floor', 'floor', 'rival', 'solid'],
    ['solid', 'brick', 'solid', 'floor', 'solid', 'brick', 'solid'],
    ['solid', 'floor', 'floor', 'brick', 'floor', 'floor', 'solid'],
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
  ],
  duel: [
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
    ['solid', 'player', 'bomb', 'floor', 'flame', 'rival', 'solid'],
    ['solid', 'floor', 'solid', 'flame', 'solid', 'floor', 'solid'],
    ['solid', 'brick', 'flame', 'flame', 'flame', 'brick', 'solid'],
    ['solid', 'floor', 'solid', 'floor', 'solid', 'floor', 'solid'],
    ['solid', 'floor', 'floor', 'brick', 'floor', 'floor', 'solid'],
    ['solid', 'solid', 'solid', 'solid', 'solid', 'solid', 'solid'],
  ],
}

function BomberScene({ variant }: { variant: string }) {
  const grid = BOMBER_MAPS[variant] ?? BOMBER_MAPS.blast
  return (
    <div className="pic-maze" aria-hidden="true">
      {grid.flat().map((cell, i) => (
        <i key={i} className={`pic-cell is-${cell}`} />
      ))}
    </div>
  )
}

const TETRIS_COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  G: '#888888',
}

function tetrisRows(variant: string): (string | null)[][] {
  const e = null
  const { I, O, T, S, Z, J, L, G } = TETRIS_COLORS
  if (variant === 'clear') {
    return [
      [e, e, e, e, e, e, e, e, e, e],
      [e, e, e, e, e, e, e, e, e, e],
      [e, e, e, T, T, T, e, e, e, e],
      [e, e, e, e, T, e, e, e, e, e],
      [J, J, J, S, S, e, L, L, L, O],
      [J, e, e, e, S, S, L, e, e, O],
      [Z, Z, e, I, I, I, I, e, O, O],
      [e, Z, Z, J, J, J, J, e, O, O],
    ]
  }
  if (variant === 'garbage') {
    return [
      [e, e, e, e, e, e, e, e, e, e],
      [e, e, e, e, e, e, e, e, e, e],
      [e, e, e, e, I, e, e, e, e, e],
      [e, e, e, e, I, e, e, e, e, e],
      [e, e, e, e, I, e, e, e, e, e],
      [e, e, e, e, I, e, e, e, e, e],
      [G, G, G, e, G, G, G, G, G, G],
      [G, G, e, G, G, G, G, G, G, G],
    ]
  }
  if (variant === 'topout') {
    return [
      [Z, Z, e, T, T, T, e, L, L, L],
      [e, Z, Z, e, T, e, e, L, e, e],
      [J, J, J, S, S, e, O, O, I, e],
      [J, e, e, e, S, S, O, O, I, e],
      [Z, Z, e, L, L, L, J, J, I, e],
      [e, Z, Z, L, e, e, e, J, I, e],
      [G, G, G, e, G, G, G, G, G, G],
      [G, G, e, G, G, G, G, G, G, G],
    ]
  }
  return [
    [e, e, e, e, e, e, e, e, e, e],
    [e, e, e, e, e, e, e, e, e, e],
    [e, e, e, T, T, T, e, e, e, e],
    [e, e, e, e, T, e, e, e, e, e],
    [e, e, e, e, e, e, e, e, e, e],
    [e, e, e, e, e, e, e, e, e, e],
    [J, J, J, e, S, S, e, L, L, L],
    [J, e, e, e, e, S, S, L, e, e],
    [G, G, G, e, G, G, G, G, G, G],
  ]
}

function TetrisScene({ variant }: { variant: string }) {
  const rows = tetrisRows(variant)
  return (
    <div className={`tet-layout scene-${variant}`} aria-hidden="true">
      <div className="side-box">
        <em>HOLD</em>
        <i className="hold-i" />
      </div>
      <div className="pic-well">
        {rows.flat().map((color, i) => (
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
      {variant === 'topout' ? <span className="stamp">GAME OVER</span> : null}
      {variant === 'clear' ? <span className="stamp ok">CLEAR!</span> : null}
    </div>
  )
}

function PongScene({ variant }: { variant: string }) {
  const wide = variant === 'wide'
  const nudge = variant === 'nudge'
  const smash = variant === 'smash'
  return (
    <div
      className={`pic-court ${variant === 'classic' ? 'is-classic' : 'is-arcade'} scene-${variant}`}
      aria-hidden="true"
    >
      <em>{variant === 'classic' ? 'CLASSIC' : variant.toUpperCase()}</em>
      <b>{variant === 'classic' ? '03' : '05'}</b>
      <b className="is-right">{variant === 'classic' ? '07' : '05'}</b>
      <i className="pic-net" />
      <i className={`pic-paddle is-left ${wide ? 'is-wide' : ''} ${nudge ? 'is-nudge' : ''}`} />
      <i className={`pic-paddle is-right ${smash ? 'is-smash' : ''}`} />
      <i className={`pic-ball ${smash ? 'is-hot' : ''} ${nudge ? 'is-near' : ''}`} />
    </div>
  )
}

function TowerScene({ variant }: { variant: string }) {
  return (
    <div className={`pic-fort scene-${variant}`} aria-hidden="true">
      <div className="pic-hud">
        <span>GOLD {variant === 'upgrade' ? '35' : '80'}</span>
        <span>LIVES {variant === 'breach' ? '16' : '18'}</span>
        <span>WAVE {variant === 'breach' ? '9/12' : '4/12'}</span>
      </div>
      <div className="pic-yard">
        <i className="pic-path" />
        <i className="pic-tower is-arrow" />
        <i className="pic-tower is-cannon" />
        <i className="pic-tower is-frost" />
        <i className={`pic-creep ${variant === 'breach' ? 'is-close' : ''}`} />
        {variant === 'breach' ? <i className="pic-creep is-tank" /> : null}
        <i className={`pic-cursor ${variant === 'upgrade' ? 'on-tower' : ''}`} />
        <i className={`pic-keep ${variant === 'breach' ? 'is-hurt' : ''}`} />
        {variant === 'upgrade' ? <span className="lvl-chip">LVL 2</span> : null}
      </div>
    </div>
  )
}
