import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addEmptyHeat,
  autofillRound,
  buildNextRound,
  canBuildNextRound,
  confirmMatch,
  currentRoundNumber,
  emptyTournament,
  giveBye,
  loadTournament,
  nameOf,
  parseNames,
  requiredWinners,
  revokeBye,
  roundsPresent,
  saveTournament,
  seatPlayer,
  startTournament,
  STORAGE_KEY,
  suggestedHeatCount,
  toggleWinner,
  unseatPlayer,
  type Tournament,
} from './bracketLogic'
import './Bracket.css'

type SetupState = {
  namesRaw: string
  winnersPerHeat: 1 | 2
  title: string
}

const DEFAULT_SETUP: SetupState = {
  namesRaw: '',
  winnersPerHeat: 2,
  title: 'Bomberman Bracket',
}

export default function Bracket() {
  const [t, setT] = useState<Tournament>(() => loadTournament() ?? emptyTournament())
  const [setup, setSetup] = useState<SetupState>(DEFAULT_SETUP)
  const [pickPlayerId, setPickPlayerId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    if (t.phase === 'setup' && !t.players.length) return
    saveTournament(t)
  }, [t])

  const parsedNames = useMemo(() => parseNames(setup.namesRaw), [setup.namesRaw])
  const tip = suggestedHeatCount(parsedNames.length, setup.winnersPerHeat)
  const roundNums = roundsPresent(t)
  const curRound = currentRoundNumber(t)
  const nextReady = canBuildNextRound(t)

  const bump = useCallback((fn: (prev: Tournament) => Tournament, msg?: string) => {
    setT((prev) => fn(prev))
    if (msg) {
      setFlash(msg)
      window.setTimeout(() => setFlash(null), 2200)
    }
  }, [])

  const onStart = () => {
    if (parsedNames.length < 2) {
      setFlash('Mindst 2 elevnavne')
      return
    }
    setT(startTournament(parsedNames, setup.winnersPerHeat, setup.title.trim() || 'Bomberman Bracket'))
    setPickPlayerId(null)
    setFlash('Turnering startet — markér vindere i hvert heat')
  }

  const onReset = () => {
    if (!window.confirm('Nulstil hele bracket?')) return
    localStorage.removeItem(STORAGE_KEY)
    setT(emptyTournament())
    setSetup(DEFAULT_SETUP)
    setPickPlayerId(null)
  }

  const onToggleWinner = (matchId: string, playerId: string) => {
    bump((prev) => {
      const match = prev.matches.find((m) => m.id === matchId)
      if (!match || match.status === 'done') return prev
      const max = requiredWinners(match, prev.winnersPerHeat)
      const next = toggleWinner(match, playerId, max)
      return {
        ...prev,
        matches: prev.matches.map((m) => (m.id === matchId ? next : m)),
      }
    })
  }

  const onConfirm = (matchId: string) => {
    bump((prev) => confirmMatch(prev, matchId), 'Vindere bekræftet')
  }

  const onSlotClick = (matchId: string, slot: number) => {
    const match = t.matches.find((m) => m.id === matchId)
    if (!match || match.status === 'done') return
    const seated = match.playerIds[slot]
    if (seated) {
      if (pickPlayerId) {
        setPickPlayerId(null)
        return
      }
      bump((prev) => unseatPlayer(prev, matchId, slot))
      return
    }
    if (pickPlayerId) {
      bump((prev) => seatPlayer(prev, matchId, slot, pickPlayerId))
      setPickPlayerId(null)
    }
  }

  if (t.phase === 'setup') {
    return (
      <div className="bracket">
        <header className="bracket-hero">
          <p className="bracket-kicker">TURNERING · BOMBERMAN</p>
          <h1>BRACKET</h1>
          <p className="bracket-lede">
            Indtast elevnavne, vælg 1 eller 2 vindere pr. heat. Ulige hold fordeles i heats à 3 og 4, så alle er med — også i næste runde. Finale med op til 4.
          </p>
        </header>

        <section className="bracket-panel">
          <label className="bracket-field">
            <span>Titel</span>
            <input
              value={setup.title}
              onChange={(e) => setSetup((s) => ({ ...s, title: e.target.value }))}
              maxLength={48}
              placeholder="Bomberman Bracket"
            />
          </label>

          <fieldset className="bracket-mode">
            <legend>Vindere pr. heat</legend>
            <label className={setup.winnersPerHeat === 1 ? 'on' : undefined}>
              <input
                type="radio"
                name="winners"
                checked={setup.winnersPerHeat === 1}
                onChange={() => setSetup((s) => ({ ...s, winnersPerHeat: 1 }))}
              />
              <strong>1 vinder</strong>
              <em>Sidste overlevende · færre videre</em>
            </label>
            <label className={setup.winnersPerHeat === 2 ? 'on' : undefined}>
              <input
                type="radio"
                name="winners"
                checked={setup.winnersPerHeat === 2}
                onChange={() => setSetup((s) => ({ ...s, winnersPerHeat: 2 }))}
              />
              <strong>2 vindere</strong>
              <em>Top 2 videre · typisk til finale med 4</em>
            </label>
          </fieldset>

          <label className="bracket-field">
            <span>Elevnavne (ét pr. linje)</span>
            <textarea
              value={setup.namesRaw}
              onChange={(e) => setSetup((s) => ({ ...s, namesRaw: e.target.value }))}
              rows={12}
              placeholder={'Anna\nBjørn\nClara\nDavid\n…'}
              spellCheck={false}
            />
          </label>

          <div className="bracket-meta">
            <span>{parsedNames.length} spillere</span>
            <span>{tip}</span>
          </div>

          {flash && <p className="bracket-flash">{flash}</p>}

          <div className="bracket-actions">
            <button type="button" className="btn-primary" onClick={onStart} disabled={parsedNames.length < 2}>
              Start turnering
            </button>
            <a className="btn-ghost" href="/Bomberman/" target="_blank" rel="noreferrer">
              Åbn Bomberman ↗
            </a>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="bracket">
      <header className="bracket-hero running">
        <div>
          <p className="bracket-kicker">
            {t.phase === 'done' ? 'MESTER' : `Runde ${curRound}`} · {t.winnersPerHeat} vinder
            {t.winnersPerHeat === 1 ? '' : 'e'} / heat
          </p>
          <h1>{t.title}</h1>
          {t.phase === 'done' && t.championId && (
            <p className="bracket-champ">🏆 {nameOf(t, t.championId)}</p>
          )}
        </div>
        <div className="bracket-hero-actions">
          <a className="btn-ghost" href="/Bomberman/" target="_blank" rel="noreferrer">
            Bomberman ↗
          </a>
          <button type="button" className="btn-danger" onClick={onReset}>
            Nulstil
          </button>
        </div>
      </header>

      {flash && <p className="bracket-flash">{flash}</p>}

      <div className="bracket-board">
        <aside className="bracket-side">
          <section className="bracket-card">
            <h2>Pool ({t.pool.length})</h2>
            <p className="bracket-hint">
              Normalt tom (alle i heats). Højreklik en spiller for at flytte hertil — klik så et tomt slot.
            </p>
            {t.pool.length === 0 ? (
              <p className="bracket-empty">Tom</p>
            ) : (
              <ul className="name-chips">
                {t.pool.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      className={pickPlayerId === id ? 'chip pick' : 'chip'}
                      onClick={() => setPickPlayerId((p) => (p === id ? null : id))}
                    >
                      {nameOf(t, id)}
                    </button>
                    <button
                      type="button"
                      className="chip-bye"
                      title="Bye — videre uden kamp"
                      onClick={() => bump((prev) => giveBye(prev, id), 'Bye givet')}
                    >
                      BYE
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="bracket-side-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => bump((prev) => addEmptyHeat(prev, curRound))}
                disabled={t.phase === 'done'}
              >
                + Tomt heat
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => bump((prev) => autofillRound(prev, curRound), 'Pool fordelt')}
                disabled={!t.pool.length || t.phase === 'done'}
              >
                Autofyld runde
              </button>
            </div>
          </section>

          <section className="bracket-card">
            <h2>Videre ({t.advancing.length})</h2>
            <p className="bracket-hint">Bekræftede vindere + byes til næste runde.</p>
            {t.advancing.length === 0 ? (
              <p className="bracket-empty">Ingen endnu</p>
            ) : (
              <ul className="name-chips plain">
                {t.advancing.map((id) => (
                  <li key={id}>
                    <span className="chip static">{nameOf(t, id)}</span>
                    {!t.matches.some((m) => m.status === 'done' && m.winnerIds.includes(id)) && (
                      <button
                        type="button"
                        className="chip-bye"
                        onClick={() => bump((prev) => revokeBye(prev, id))}
                      >
                        FORTRYD
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn-primary wide"
              disabled={!nextReady}
              onClick={() =>
                bump((prev) => buildNextRound(prev), 'Næste runde / finale klar')
              }
            >
              {t.advancing.length + t.pool.length <= 4
                ? 'Start finale (op til 4)'
                : 'Generér næste runde'}
            </button>
          </section>
        </aside>

        <div className="bracket-rounds">
          {roundNums.map((r) => {
            const matches = t.matches.filter((m) => m.round === r)
            return (
              <section key={r} className="bracket-round">
                <h2>
                  {matches.some((m) => m.isFinal) ? 'Finale' : `Runde ${r}`}
                  <span>
                    {matches.filter((m) => m.status === 'done').length}/{matches.length}
                  </span>
                </h2>
                <div className="heat-grid">
                  {matches.map((m) => {
                    const need = requiredWinners(m, t.winnersPerHeat)
                    const filled = m.playerIds.filter(Boolean).length
                    const canConfirm =
                      m.status === 'open' && m.winnerIds.length === need && filled >= 2
                    return (
                      <article
                        key={m.id}
                        className={`heat ${m.status} ${m.isFinal ? 'final' : ''}`}
                      >
                        <header>
                          <strong>
                            {m.label}
                            <em className="heat-size"> · {m.playerIds.length}p</em>
                          </strong>
                          <span>
                            {m.status === 'done'
                              ? 'FÆRDIG'
                              : `Vælg ${need} vinder${need === 1 ? '' : 'e'}`}
                          </span>
                        </header>
                        <ol>
                          {m.playerIds.map((pid, slot) => {
                            const isWinner = pid ? m.winnerIds.includes(pid) : false
                            return (
                              <li key={slot}>
                                {pid ? (
                                  <button
                                    type="button"
                                    className={
                                      isWinner
                                        ? 'seat winner'
                                        : m.status === 'done'
                                          ? 'seat out'
                                          : 'seat'
                                    }
                                    disabled={m.status === 'done'}
                                    onClick={() => {
                                      if (m.status === 'done') return
                                      if (pickPlayerId) {
                                        onSlotClick(m.id, slot)
                                        return
                                      }
                                      onToggleWinner(m.id, pid)
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      if (m.status === 'open') onSlotClick(m.id, slot)
                                    }}
                                    title="Klik: toggl vinder · højreklik: fjern til pool"
                                  >
                                    <em>{slot + 1}</em>
                                    {nameOf(t, pid)}
                                    {isWinner && <span className="crown">★</span>}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className={pickPlayerId ? 'seat empty pickable' : 'seat empty'}
                                    disabled={m.status === 'done'}
                                    onClick={() => onSlotClick(m.id, slot)}
                                  >
                                    <em>{slot + 1}</em>
                                    {pickPlayerId ? 'Placér her' : 'Tom'}
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ol>
                        {m.status === 'open' && (
                          <button
                            type="button"
                            className="btn-primary wide"
                            disabled={!canConfirm}
                            onClick={() => onConfirm(m.id)}
                          >
                            Bekræft {need} vinder{need === 1 ? '' : 'e'}
                          </button>
                        )}
                        {m.status === 'done' && (
                          <p className="heat-winners">
                            Videre:{' '}
                            {m.winnerIds.map((id) => nameOf(t, id)).join(', ') || '—'}
                          </p>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <footer className="bracket-foot">
        Bracket v2 · heats à 3–4 (alle med) · finale op til 4 · gemmes lokalt · Bomberman i anden fane
      </footer>
    </div>
  )
}
