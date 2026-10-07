import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePad, type PadButton } from './PadContext'
import './Manual.css'

type GameId = 'bomber' | 'tetris' | 'pong' | 'tower'

type Step = { n: string; title: string; text: string }
type KeyRow = { key: string; does: string }
type Legend = { label: string; swatch: string }
type Scene = { id: string; title: string; lead: string; body: string; legend: Legend[] }
type Tip = { title: string; text: string }

type GameManual = {
  id: GameId
  short: string
  title: string
  tagline: string
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
    tagline: 'Læg bomber. Spræng mursten. Sidste i live vinder.',
    href: '/Bomberman/',
    thumb: '/bomberman-nes.jpg',
    thumbAlt: 'Bomberman — maze med mursten og bomber',
    players: '2–8',
    time: '3–8 min',
    idea: 'I deler én maze. Bløde mursten kan sprænges. Faste søjler kan ikke. En bombe eksploderer i et kors — og den rammer også dig.',
    win: 'Sidste spiller i live vinder. Dør alle i samme blast, er der ingen vinder.',
    flow: [
      { n: '01', title: 'PIN', text: 'Admin opretter lobby og bane. Del PIN med holdet.' },
      { n: '02', title: 'JOIN', text: 'Alle joiner. Når I er klar: Start spil.' },
      { n: '03', title: 'BLAST', text: 'Læg bomber, hent power-ups, vær den sidste tilbage.' },
    ],
    keys: [
      { key: '↑ ↓ ← →', does: 'Gå. WASD gør det samme.' },
      { key: 'MELLEMRUM', does: 'Læg bombe. Den tæller ned og eksploderer i et kors.' },
    ],
    pad: 'Oplà: move + retning, eller bomb. Valgfrit MQTT kun her.',
    scenes: [
      {
        id: 'maze',
        title: 'MAZEN',
        lead: 'Én bane. Alle er på den samtidigt.',
        body: 'Brune mursten kan sprænges og skjuler ofte loot. Mørke søjler er faste — flammen stopper her, så brug dem som skjul.',
        legend: [
          { label: 'Dig', swatch: '#f0e8d0' },
          { label: 'Blød mur', swatch: '#a06830' },
          { label: 'Fast søjle', swatch: '#2a2a32' },
        ],
      },
      {
        id: 'blast',
        title: 'BLAST',
        lead: 'Bomben tæller ned og eksploderer i et kors.',
        body: 'Flammen går op, ned, venstre og højre indtil den rammer en søjle. Din egen flamme rammer også dig — læg og løb.',
        legend: [
          { label: 'Bombe', swatch: '#222' },
          { label: 'Flamme', swatch: '#ff9a1a' },
          { label: 'Stopper ved søjle', swatch: '#2a2a32' },
        ],
      },
      {
        id: 'loot',
        title: 'LOOT',
        lead: 'Sprængte mursten dropper power-ups.',
        body: 'B = flere bomber på banen. F = længere flamme. S = højere fart. Prioritér F tidligt — så åbner midten hurtigere.',
        legend: [
          { label: 'B bomber', swatch: '#2f9e44' },
          { label: 'F flamme', swatch: '#e85d5d' },
          { label: 'S fart', swatch: '#3b6ef5' },
        ],
      },
      {
        id: 'duel',
        title: 'DUEL',
        lead: 'Pres modstanderen ind i et hjørne.',
        body: 'Læg bomber så flammen lukker flugtveje. En søjle bag dig er sikkerhed — en mursten foran dig er en chance for loot.',
        legend: [
          { label: 'Dig', swatch: '#f0e8d0' },
          { label: 'Rival', swatch: '#e85d5d' },
          { label: 'Fælde', swatch: '#ff9a1a' },
        ],
      },
    ],
    tips: [
      { title: 'Læg og løb', text: 'Din egen flamme er lige så farlig.' },
      { title: 'Saml F først', text: 'Længere flamme åbner midten af banen.' },
      { title: 'Brug søjlerne', text: 'Faste søjler stopper flammen.' },
    ],
  },
  {
    id: 'tetris',
    short: 'TETRIS',
    title: 'TETRIS',
    tagline: 'Clear linjer. Send garbage. Sidste brønd stående vinder.',
    href: '/Tetris/',
    thumb: '/tetris-thumb.jpg',
    thumbAlt: 'Battle Tetris — brønde og garbage',
    players: '2–4',
    time: '5–12 min',
    idea: 'Hver spiller har sin egen 10×20 brønd. Linjer du clearer, bliver til skrald hos en tilfældig modstander — med ét hul, så de kan grave sig ud.',
    win: 'Sidste spiller i live vinder. Går flere ud samtidig, vinder den højeste score.',
    flow: [
      { n: '01', title: 'LOBBY', text: 'Opret lobby. Del PIN. 2–4 spillere joiner.' },
      { n: '02', title: 'START', text: 'Brikkerne kommer fra en fælles 7-bag.' },
      { n: '03', title: 'SEND', text: '2 linjer → 1 skrald. Tetris → 4 rækker.' },
    ],
    keys: [
      { key: '← →', does: 'Flyt. A / D virker også.' },
      { key: '↓', does: 'Soft drop.' },
      { key: '↑ / X', does: 'Roter med uret.' },
      { key: 'MELLEMRUM', does: 'Hard drop.' },
      { key: 'C', does: 'Hold — byt med den gemte brik.' },
    ],
    pad: 'Oplà: move LEFT/RIGHT/DOWN, rotate, hardDrop, hold.',
    scenes: [
      {
        id: 'well',
        title: 'BRØND',
        lead: 'Din egen 10×20 brønd — Hold, aktiv brik og Next.',
        body: 'Hold (C) gemmer en brik til senere. Next viser den kommende. Alle trækker fra samme 7-bag, så timing er fair.',
        legend: [
          { label: 'Hold', swatch: '#00f0f0' },
          { label: 'Aktiv', swatch: '#a000f0' },
          { label: 'Next', swatch: '#f0a000' },
        ],
      },
      {
        id: 'clear',
        title: 'CLEAR',
        lead: 'Fyld en hel række — den forsvinder.',
        body: 'Én linje er okay. To linjer sender 1 skrald. En Tetris (fire) sender 4 rækker — det er det, der vælter brønde.',
        legend: [
          { label: 'Fuld række', swatch: '#00f0f0' },
          { label: 'Forsvinder', swatch: '#2f9e44' },
        ],
      },
      {
        id: 'garbage',
        title: 'GARBAGE',
        lead: 'Skrald lander hos en tilfældig modstander.',
        body: 'Grå rækker har altid ét hul. Grav dig ud dér — eller send mere tilbage, før hullet lukker.',
        legend: [
          { label: 'Garbage', swatch: '#888888' },
          { label: 'Hul', swatch: '#0c1428' },
          { label: 'I-piece', swatch: '#00f0f0' },
        ],
      },
      {
        id: 'topout',
        title: 'TOP OUT',
        lead: 'Når en ny brik ikke kan lande, er du ude.',
        body: 'Hold toppen fri. En høj stack + garbage-burst er den klassiske knockout. Sidste brønd stående vinder.',
        legend: [
          { label: 'Farezone', swatch: '#e85d5d' },
          { label: 'Ude', swatch: '#e85d5d' },
        ],
      },
    ],
    tips: [
      { title: 'Spar I', text: 'Hold I til en Tetris — fire skrald gør ondt.' },
      { title: 'Grav i hullet', text: 'Garbage har altid ét hul. Sigte efter det.' },
      { title: 'Kig på next', text: 'Planlæg to brikker frem.' },
    ],
  },
  {
    id: 'pong',
    short: 'PONG',
    title: 'PONG',
    tagline: 'To paddles. Én bold. Første til 11.',
    href: '/Pong/',
    thumb: '/pong-thumb.jpg',
    thumbAlt: 'Pong — paddles og bold',
    players: '2',
    time: '3–6 min',
    idea: 'Bolden bliver hurtigere, og vinklen du rammer med sender den et nyt sted hen. Flere end to i lobbyen bliver tilskuere.',
    win: 'Første til 11 vinder. Classic er ren duel. Arcade tilføjer WIDE, NUDGE og SMASH.',
    flow: [
      { n: '01', title: 'MODE', text: 'Vælg Classic eller Arcade. Del PIN.' },
      { n: '02', title: 'SIDER', text: 'Første får venstre paddle. Næste får højre.' },
      { n: '03', title: '11', text: 'Point når bolden går forbi en paddle.' },
    ],
    keys: [
      { key: 'W / S', does: 'Venstre paddle. Pile virker også.' },
      { key: '↑ / ↓', does: 'Højre paddle — kun pile.' },
      { key: '1 / Q', does: 'Arcade WIDE — højere paddle.' },
      { key: '3 / E', does: 'Arcade NUDGE — snap til bold.' },
      { key: '4 / SPACE', does: 'Arcade SMASH — næste hit er orange og hurtig.' },
    ],
    pad: 'TOUCH0 op · TOUCH2 ned · Arcade: 1 WIDE · 3 NUDGE · 4 SMASH.',
    scenes: [
      {
        id: 'classic',
        title: 'CLASSIC',
        lead: 'To paddles, én bold — ren timing.',
        body: 'Bolden bliver hurtigere for hvert hit. Ram midten for en flad retur, kanten for en skarp vinkel. Første til 11.',
        legend: [
          { label: 'Paddle', swatch: '#f0ebe0' },
          { label: 'Bold', swatch: '#fff' },
        ],
      },
      {
        id: 'wide',
        title: 'WIDE',
        lead: 'Arcade: din paddle bliver midlertidigt højere.',
        body: 'Tryk 1 / Q. Brug det når bolden er langt væk, eller når du er ude af position — ikke som spam.',
        legend: [
          { label: 'Normal', swatch: '#f0ebe0' },
          { label: 'Wide', swatch: '#5b9fff' },
        ],
      },
      {
        id: 'nudge',
        title: 'NUDGE',
        lead: 'Arcade: paddle snapper et stykke mod bolden.',
        body: 'Tryk 3 / E. God til at redde en bold, der er lige uden for rækkevidde — dårlig hvis du allerede er i position.',
        legend: [
          { label: 'Snap', swatch: '#c9a227' },
          { label: 'Bold nær', swatch: '#fff' },
        ],
      },
      {
        id: 'smash',
        title: 'SMASH',
        lead: 'Arcade: næste hit bliver orange og hurtigt.',
        body: 'Tryk 4 / Space lige før du rammer. Vent til bolden er tæt på dig — ellers spilder du kraften.',
        legend: [
          { label: 'Smash', swatch: '#ff6a1a' },
          { label: 'Hurtig bold', swatch: '#ff8a3a' },
        ],
      },
    ],
    tips: [
      { title: 'Ram med kanten', text: 'Kant giver skarpere vinkel end midten.' },
      { title: 'Spar SMASH', text: 'Vent til bolden er tæt på dig.' },
      { title: 'Tilskuere er OK', text: 'Kun to paddles. Resten ser på.' },
    ],
  },
  {
    id: 'tower',
    short: 'TOWER',
    title: 'TOWER DEFENSE',
    tagline: 'Byg langs stien. Overlev 12 waves.',
    href: '/TowerDefense/',
    thumb: '/tower-defense-thumb.jpg',
    thumbAlt: 'Tower Defense — sti, tårne og fæstning',
    players: '1',
    time: '8–15 min',
    idea: 'Creeps følger stien. Du bygger ved siden af den. Arrow skyder hurtigt, Cannon splash, Frost sinker. Slipper de igennem, mister du liv.',
    win: '120 gold og 20 liv fra start. Overlev wave 12. Tank koster 2 liv. X sælger for ca. 60 %.',
    flow: [
      { n: '01', title: 'START', text: 'Én spiller. Ingen PIN. Tryk Start.' },
      { n: '02', title: 'BYG', text: 'Flyt cursor, vælg tårn, Space bygger eller opgraderer.' },
      { n: '03', title: 'WAVE', text: 'N kalder næste wave. Hold i 12 runder.' },
    ],
    keys: [
      { key: 'PILE', does: 'Flyt mellem build-slots.' },
      { key: 'Q / E', does: 'Skift tårntype. 1 2 3 vælger direkte.' },
      { key: 'SPACE', does: 'Byg eller opgrader.' },
      { key: 'X', does: 'Sælg tårn.' },
      { key: 'N', does: 'Næste wave tidligt.' },
    ],
    pad: 'Fem knapper: slot ← → · type ↑ ↓ · place.',
    scenes: [
      {
        id: 'path',
        title: 'STI',
        lead: 'Creeps følger kun stien — du bygger ved siden af.',
        body: 'Cursoren flytter mellem build-slots. Placer tårne hvor stien svinger, så de skyder længst tid.',
        legend: [
          { label: 'Sti', swatch: '#6b5a3a' },
          { label: 'Creep', swatch: '#e85d5d' },
          { label: 'Fæstning', swatch: '#4a3a28' },
        ],
      },
      {
        id: 'towers',
        title: 'TÅRNE',
        lead: 'Tre typer — vælg med Q/E eller 1 2 3.',
        body: 'Arrow (40g) skyder hurtigt. Cannon (70g) splash. Frost (55g) sinker. Mix dem: Frost holder, Cannon afslutter.',
        legend: [
          { label: 'Arrow', swatch: '#c9a227' },
          { label: 'Cannon', swatch: '#8b5a2b' },
          { label: 'Frost', swatch: '#5b9fff' },
        ],
      },
      {
        id: 'upgrade',
        title: 'UPGRADE',
        lead: 'Space på et eksisterende tårn hæver level.',
        body: 'Ét lvl 2 Cannon slår ofte flere end tre lvl 1. X sælger for ca. 60 % gold tilbage.',
        legend: [
          { label: 'Cursor', swatch: '#f0ebe0' },
          { label: 'Lvl up', swatch: '#c9a227' },
        ],
      },
      {
        id: 'breach',
        title: 'BREACH',
        lead: 'Slipper de til fæstningen, mister du liv.',
        body: 'Normal creep = 1 liv. Tank = 2 liv. Du starter med 20. Overlev wave 12 — N kalder næste wave tidligt.',
        legend: [
          { label: 'Creep', swatch: '#e85d5d' },
          { label: 'Tank', swatch: '#7a3030' },
          { label: 'Liv tabt', swatch: '#e85d5d' },
        ],
      },
    ],
    tips: [
      { title: 'Frost først', text: 'Slow giver de andre tårne mere tid.' },
      { title: 'Opgrader midten', text: 'Ét lvl 2 Cannon slår flere end tre lvl 1.' },
      { title: 'N når du er klar', text: 'Kald wave tidligt — kun hvis linjen holder.' },
    ],
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

  return (
    <article className={`manual game-${game.id}`}>
      <nav className="man-pick" aria-label="Vælg spil">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to={`/manual/${g.id}`}
            className={`pick pick-${g.id} ${g.id === game.id ? 'on' : ''}`}
            aria-current={g.id === game.id ? 'page' : undefined}
          >
            {g.short}
          </Link>
        ))}
      </nav>

      <header className="man-hero">
        <img className="man-hero-img" src={game.thumb} alt="" width={1024} height={576} />
        <div className="man-hero-veil" aria-hidden="true" />
        <div className="man-hero-copy">
          <p className="man-eyebrow">INSTRUCTION BOOKLET</p>
          <h1>{game.title}</h1>
          <p className="man-tagline">{game.tagline}</p>
          <p className="man-meta-line">
            {game.players} spillere · {game.time}
          </p>
          <a className="man-cta" href={game.href}>
            SPIL NU
          </a>
        </div>
      </header>

      <section className="man-section man-idea">
        <p className="man-lead">{game.idea}</p>
        <p className="man-win">{game.win}</p>
      </section>

      <section className="man-section man-look" aria-labelledby="scener-title">
        <h2 id="scener-title">Sådan ser det ud</h2>
        <p className="man-look-intro">
          Fire scener der viser kernegrebene. Hver panel animerer det, du skal huske — før du går ind i arenaen.
        </p>
        <ul className="man-film">
          {game.scenes.map((scene, i) => (
            <li key={scene.id} className={`film-card delay-${i}`}>
              <div className={`man-frame scene-${game.id}-${scene.id}`}>
                <SceneFrame game={game.id} scene={scene.id} />
                <span className="frame-tag">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="film-copy">
                <strong>{scene.title}</strong>
                <p className="film-lead">{scene.lead}</p>
                <p className="film-body">{scene.body}</p>
                <ul className="film-legend" aria-label="Forklaring">
                  {scene.legend.map((item) => (
                    <li key={item.label}>
                      <i style={{ background: item.swatch }} aria-hidden="true" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="man-section" aria-labelledby="flow-title">
        <h2 id="flow-title">Sådan kommer I i gang</h2>
        <ol className="man-steps">
          {game.flow.map((step) => (
            <li key={step.n}>
              <span className="step-n">{step.n}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="man-section man-controls" aria-labelledby="ctrl-title">
        <h2 id="ctrl-title">Styring</h2>
        <div className="man-ctrl-grid">
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
        <p className="man-pad-note">{game.pad}</p>
      </section>

      <section className="man-section" aria-labelledby="tips-title">
        <h2 id="tips-title">Hurtige tips</h2>
        <ul className="man-tips">
          {game.tips.map((tip, i) => (
            <li key={tip.title}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <strong>{tip.title}</strong>
                <p>{tip.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="man-end">
        <Link to={`/manual/${prev.id}`} className="man-swap">
          ← {prev.short}
        </Link>
        <a className="man-cta" href={game.href}>
          SPIL {game.title}
        </a>
        <Link to={`/manual/${next.id}`} className="man-swap">
          {next.short} →
        </Link>
      </footer>

      <p className="man-hint">← → SKIFT SPIL · A / START ÅBNER ARENA · B TIL SELECT</p>
    </article>
  )
}

function SceneFrame({ game, scene }: { game: GameId; scene: string }) {
  if (game === 'bomber') return <BomberScene variant={scene} />
  if (game === 'tetris') return <TetrisScene variant={scene} />
  if (game === 'pong') return <PongScene variant={scene} />
  return <TowerScene variant={scene} />
}

function ControlPad({ id }: { id: GameId }) {
  const map: Record<GameId, { dpad: string; a: string; b: string }> = {
    bomber: { dpad: 'GÅ', a: 'BOMB', b: '—' },
    tetris: { dpad: 'FLYT', a: 'ROTÉR', b: 'HOLD' },
    pong: { dpad: 'OP/NED', a: 'SMASH', b: 'WIDE' },
    tower: { dpad: 'SLOT', a: 'BYG', b: 'SÆLG' },
  }
  const m = map[id]
  return (
    <div className="ctrl-pad" aria-hidden="true">
      <div className="ctrl-dpad">
        <i className="u" />
        <i className="l" />
        <i className="c" />
        <i className="r" />
        <i className="d" />
      </div>
      <p className="ctrl-label">{m.dpad}</p>
      <div className="ctrl-face">
        <span>
          <em className="b">B</em>
          {m.b}
        </span>
        <span>
          <em className="a">A</em>
          {m.a}
        </span>
      </div>
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
    <div className={`pic-maze variant-${variant}`} data-variant={variant}>
      {grid.flat().map((cell, i) => (
        <i key={i} className={`pic-cell is-${cell}`} data-cell={cell} />
      ))}
      {variant === 'blast' ? <span className="callout blast-call">KORS</span> : null}
      {variant === 'loot' ? <span className="callout loot-call">PICK UP</span> : null}
      {variant === 'duel' ? <span className="callout duel-call">TRAP</span> : null}
      {variant === 'maze' ? <span className="callout maze-call">SKJUL</span> : null}
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
      [e, e, e, T, T, T, e, e, e, e],
      [e, e, e, e, T, e, e, e, e, e],
      [J, J, J, S, S, I, L, L, L, O],
      [J, e, e, e, S, S, L, e, e, O],
      [Z, Z, e, e, e, e, e, e, O, O],
      [e, Z, Z, e, e, e, e, e, O, O],
    ]
  }
  if (variant === 'garbage') {
    return [
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
      [G, G, G, e, G, G, G, G, G, G],
      [G, G, e, G, G, G, G, G, G, G],
    ]
  }
  return [
    [e, e, e, e, e, e, e, e, e, e],
    [e, e, e, T, T, T, e, e, e, e],
    [e, e, e, e, T, e, e, e, e, e],
    [e, e, e, e, e, e, e, e, e, e],
    [J, J, J, e, S, S, e, L, L, L],
    [J, e, e, e, e, S, S, L, e, e],
    [G, G, G, e, G, G, G, G, G, G],
  ]
}

function TetrisScene({ variant }: { variant: string }) {
  const rows = tetrisRows(variant)
  const cols = 10
  return (
    <div className={`tet-layout scene-${variant}`}>
      <div className="side-box">
        <em>HOLD</em>
        <i className="hold-i" />
      </div>
      <div className="pic-well">
        {rows.flat().map((color, i) => {
          const row = Math.floor(i / cols)
          const isClearRow = variant === 'clear' && row === 3 && color !== null
          const isHole =
            variant === 'garbage' &&
            color === null &&
            ((row === 5 && i % cols === 3) || (row === 6 && i % cols === 2))
          const isDanger = variant === 'topout' && row < 2
          const isFalling =
            variant === 'well' && color === TETRIS_COLORS.T && (row === 1 || row === 2)
          return (
            <i
              key={i}
              className={[
                color ? 'pic-block' : 'pic-empty',
                isClearRow ? 'is-clearing' : '',
                isHole ? 'is-hole' : '',
                isDanger ? 'is-danger' : '',
                isFalling ? 'is-falling' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={color ? { background: color } : undefined}
            />
          )
        })}
      </div>
      <div className="side-box">
        <em>NEXT</em>
        <i className="next-l" />
      </div>
      {variant === 'topout' ? <span className="stamp">OUT</span> : null}
      {variant === 'clear' ? <span className="stamp ok">CLEAR</span> : null}
      {variant === 'garbage' ? <span className="stamp warn">+GARBAGE</span> : null}
      {variant === 'well' ? <span className="callout well-call">FALL</span> : null}
    </div>
  )
}

function PongScene({ variant }: { variant: string }) {
  const wide = variant === 'wide'
  const nudge = variant === 'nudge'
  const smash = variant === 'smash'
  return (
    <div className={`pic-court scene-${variant}`}>
      <em>{variant.toUpperCase()}</em>
      <div className="score-row" aria-hidden="true">
        <span>07</span>
        <span>06</span>
      </div>
      <i className="pic-net" />
      <i className={`pic-paddle is-left ${wide ? 'is-wide' : ''} ${nudge ? 'is-nudge' : ''}`} />
      <i className={`pic-paddle is-right ${smash ? 'is-smash' : ''}`} />
      <i className={`pic-ball ${smash ? 'is-hot' : ''} ${nudge ? 'is-near' : ''}`} />
      {smash ? <i className="pic-trail" aria-hidden="true" /> : null}
      {wide ? <span className="callout wide-call">+HØJDE</span> : null}
      {nudge ? <span className="callout nudge-call">SNAP</span> : null}
      {smash ? <span className="callout smash-call">SMASH</span> : null}
    </div>
  )
}

function TowerScene({ variant }: { variant: string }) {
  return (
    <div className={`pic-fort scene-${variant}`}>
      <div className="pic-yard">
        <i className="pic-path" />
        {(variant === 'path' || variant === 'towers' || variant === 'upgrade' || variant === 'breach') && (
          <>
            <i className={`pic-tower is-arrow ${variant === 'towers' ? 'is-firing' : ''}`} />
            <i className={`pic-tower is-cannon ${variant === 'upgrade' ? 'is-lvl2' : ''} ${variant === 'towers' ? 'is-firing' : ''}`} />
            <i className={`pic-tower is-frost ${variant === 'towers' ? 'is-firing' : ''}`} />
          </>
        )}
        {variant === 'towers' ? (
          <>
            <i className="pic-shot is-arrow-shot" />
            <i className="pic-shot is-cannon-shot" />
            <i className="pic-shot is-frost-shot" />
            <span className="tower-label l-arrow">40g</span>
            <span className="tower-label l-cannon">70g</span>
            <span className="tower-label l-frost">55g</span>
          </>
        ) : null}
        <i
          className={`pic-creep ${variant === 'breach' ? 'is-close' : ''} ${variant === 'towers' ? 'is-slow' : ''}`}
        />
        {variant === 'breach' ? <i className="pic-creep is-tank" /> : null}
        {variant === 'upgrade' || variant === 'path' ? (
          <i className={`pic-cursor ${variant === 'upgrade' ? 'on-tower' : ''}`} />
        ) : null}
        {variant === 'upgrade' ? <span className="lvl-badge">LVL 2</span> : null}
        <i className={`pic-keep ${variant === 'breach' ? 'is-hurt' : ''}`} />
        {variant === 'breach' ? <span className="heart-loss">−2</span> : null}
        {variant === 'path' ? <span className="callout path-call">KUN STI</span> : null}
      </div>
    </div>
  )
}
