export type Player = { id: string; name: string }

export type MatchStatus = 'open' | 'done'

export type Match = {
  id: string
  round: number
  label: string
  playerIds: (string | null)[]
  winnerIds: string[]
  status: MatchStatus
  isFinal: boolean
}

export type Tournament = {
  version: 1
  title: string
  players: Player[]
  winnersPerHeat: 1 | 2
  matches: Match[]
  /** Spillere der venter på at blive sat i et heat */
  pool: string[]
  /** Vindere (og byes) klar til næste runde */
  advancing: string[]
  phase: 'setup' | 'running' | 'done'
  championId: string | null
  updatedAt: string
}

export const STORAGE_KEY = 'mercantec-games-bracket-v1'
export const PLAYERS_PER_MATCH = 4

let idSeq = 0
export function uid(prefix = 'id'): string {
  idSeq += 1
  return `${prefix}_${Date.now().toString(36)}_${idSeq}`
}

export function parseNames(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of raw.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, ' ')
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name.slice(0, 40))
  }
  return out
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function emptyTournament(partial?: Partial<Tournament>): Tournament {
  return {
    version: 1,
    title: 'Bomberman Bracket',
    players: [],
    winnersPerHeat: 2,
    matches: [],
    pool: [],
    advancing: [],
    phase: 'setup',
    championId: null,
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export function loadTournament(): Tournament | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Tournament
    if (data?.version !== 1 || !Array.isArray(data.players)) return null
    return data
  } catch {
    return null
  }
}

export function saveTournament(t: Tournament): void {
  const next = { ...t, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function playerMap(t: Tournament): Map<string, Player> {
  return new Map(t.players.map((p) => [p.id, p]))
}

export function nameOf(t: Tournament, id: string | null | undefined): string {
  if (!id) return '—'
  return t.players.find((p) => p.id === id)?.name ?? '?'
}

/** Opret turnering fra navneliste. Leftovers (ikke deleligt med 4) går i pool. */
export function startTournament(
  names: string[],
  winnersPerHeat: 1 | 2,
  title = 'Bomberman Bracket',
): Tournament {
  const players: Player[] = names.map((name) => ({ id: uid('p'), name }))
  const shuffled = shuffle(players.map((p) => p.id))
  const matches: Match[] = []
  let i = 0
  let heat = 1
  while (i + PLAYERS_PER_MATCH <= shuffled.length) {
    const slice = shuffled.slice(i, i + PLAYERS_PER_MATCH)
    matches.push({
      id: uid('m'),
      round: 1,
      label: `Heat ${heat}`,
      playerIds: [...slice],
      winnerIds: [],
      status: 'open',
      isFinal: false,
    })
    heat += 1
    i += PLAYERS_PER_MATCH
  }
  const pool = shuffled.slice(i)
  return emptyTournament({
    title,
    players,
    winnersPerHeat,
    matches,
    pool,
    advancing: [],
    phase: 'running',
    championId: null,
  })
}

export function requiredWinners(match: Match, winnersPerHeat: 1 | 2): number {
  return match.isFinal ? 1 : winnersPerHeat
}

export function toggleWinner(match: Match, playerId: string, maxWinners: number): Match {
  if (match.status === 'done') return match
  if (!match.playerIds.includes(playerId)) return match
  const has = match.winnerIds.includes(playerId)
  let winnerIds: string[]
  if (has) {
    winnerIds = match.winnerIds.filter((id) => id !== playerId)
  } else if (match.winnerIds.length >= maxWinners) {
    winnerIds = [...match.winnerIds.slice(1), playerId]
  } else {
    winnerIds = [...match.winnerIds, playerId]
  }
  return { ...match, winnerIds }
}

export function confirmMatch(t: Tournament, matchId: string): Tournament {
  const match = t.matches.find((m) => m.id === matchId)
  if (!match || match.status === 'done') return t
  const need = requiredWinners(match, t.winnersPerHeat)
  if (match.winnerIds.length !== need) return t
  if (match.playerIds.filter(Boolean).length < 2) return t

  const matches = t.matches.map((m) =>
    m.id === matchId ? { ...m, status: 'done' as const } : m,
  )

  if (match.isFinal) {
    return {
      ...t,
      matches,
      phase: 'done',
      championId: match.winnerIds[0] ?? null,
      advancing: [],
    }
  }

  const advancing = [...t.advancing, ...match.winnerIds]
  return { ...t, matches, advancing }
}

/** Flyt en spiller fra pool ind i et tomt slot i et open match. */
export function seatPlayer(t: Tournament, matchId: string, slot: number, playerId: string): Tournament {
  if (!t.pool.includes(playerId)) return t
  const match = t.matches.find((m) => m.id === matchId)
  if (!match || match.status === 'done' || slot < 0 || slot > 3) return t
  if (match.playerIds[slot]) return t

  const playerIds = [...match.playerIds] as (string | null)[]
  playerIds[slot] = playerId
  return {
    ...t,
    pool: t.pool.filter((id) => id !== playerId),
    matches: t.matches.map((m) => (m.id === matchId ? { ...m, playerIds, winnerIds: [] } : m)),
  }
}

/** Fjern spiller fra open match tilbage til pool. */
export function unseatPlayer(t: Tournament, matchId: string, slot: number): Tournament {
  const match = t.matches.find((m) => m.id === matchId)
  if (!match || match.status === 'done') return t
  const pid = match.playerIds[slot]
  if (!pid) return t
  const playerIds = [...match.playerIds] as (string | null)[]
  playerIds[slot] = null
  return {
    ...t,
    pool: [...t.pool, pid],
    matches: t.matches.map((m) =>
      m.id === matchId
        ? { ...m, playerIds, winnerIds: m.winnerIds.filter((id) => id !== pid) }
        : m,
    ),
  }
}

export function addEmptyHeat(t: Tournament, round: number): Tournament {
  const openInRound = t.matches.filter((m) => m.round === round && !m.isFinal)
  const n = openInRound.length + 1
  const match: Match = {
    id: uid('m'),
    round,
    label: `Heat ${n}`,
    playerIds: [null, null, null, null],
    winnerIds: [],
    status: 'open',
    isFinal: false,
  }
  return { ...t, matches: [...t.matches, match] }
}

/** Auto-fyld open heats i aktuel runde fra pool (shuffle). */
export function autofillRound(t: Tournament, round: number): Tournament {
  let pool = shuffle([...t.pool])
  const matches = t.matches.map((m) => {
    if (m.round !== round || m.status === 'done' || m.isFinal) return m
    const playerIds = [...m.playerIds] as (string | null)[]
    for (let s = 0; s < 4; s += 1) {
      if (!playerIds[s] && pool.length) {
        playerIds[s] = pool.shift()!
      }
    }
    return { ...m, playerIds, winnerIds: [] }
  })
  return { ...t, matches, pool }
}

/**
 * Når alle heats i runden er færdige (eller ingen open),
 * byg næste runde / finale fra advancing + pool leftovers.
 */
export function canBuildNextRound(t: Tournament): boolean {
  if (t.phase !== 'running') return false
  const currentRound = currentRoundNumber(t)
  const roundMatches = t.matches.filter((m) => m.round === currentRound && !m.isFinal)
  if (roundMatches.some((m) => m.status === 'open')) return false
  const total = t.advancing.length + t.pool.length
  return total >= 2
}

export function currentRoundNumber(t: Tournament): number {
  if (!t.matches.length) return 1
  const nonFinal = t.matches.filter((m) => !m.isFinal)
  if (!nonFinal.length) return 1
  return Math.max(...nonFinal.map((m) => m.round))
}

export function buildNextRound(t: Tournament): Tournament {
  if (!canBuildNextRound(t)) return t

  const entrants = shuffle([...t.advancing, ...t.pool])
  const nextRound = currentRoundNumber(t) + 1

  // Finale: præcis 4 (eller færre hvis turneringen er lille)
  if (entrants.length <= PLAYERS_PER_MATCH) {
    const playerIds: (string | null)[] = [
      entrants[0] ?? null,
      entrants[1] ?? null,
      entrants[2] ?? null,
      entrants[3] ?? null,
    ]
    const finalMatch: Match = {
      id: uid('m'),
      round: nextRound,
      label: 'Finale',
      playerIds,
      winnerIds: [],
      status: 'open',
      isFinal: true,
    }
    return {
      ...t,
      matches: [...t.matches, finalMatch],
      pool: [],
      advancing: [],
    }
  }

  const matches: Match[] = []
  let i = 0
  let heat = 1
  while (i + PLAYERS_PER_MATCH <= entrants.length) {
    matches.push({
      id: uid('m'),
      round: nextRound,
      label: `R${nextRound} Heat ${heat}`,
      playerIds: entrants.slice(i, i + PLAYERS_PER_MATCH),
      winnerIds: [],
      status: 'open',
      isFinal: false,
    })
    heat += 1
    i += PLAYERS_PER_MATCH
  }
  const leftover = entrants.slice(i)

  return {
    ...t,
    matches: [...t.matches, ...matches],
    pool: leftover,
    advancing: [],
  }
}

export function giveBye(t: Tournament, playerId: string): Tournament {
  if (!t.pool.includes(playerId)) return t
  return {
    ...t,
    pool: t.pool.filter((id) => id !== playerId),
    advancing: [...t.advancing, playerId],
  }
}

export function revokeBye(t: Tournament, playerId: string): Tournament {
  if (!t.advancing.includes(playerId)) return t
  // må ikke fjerne vindere fra already-done matches
  const fromDone = t.matches.some(
    (m) => m.status === 'done' && !m.isFinal && m.winnerIds.includes(playerId),
  )
  if (fromDone) return t
  return {
    ...t,
    advancing: t.advancing.filter((id) => id !== playerId),
    pool: [...t.pool, playerId],
  }
}

export function roundsPresent(t: Tournament): number[] {
  const set = new Set(t.matches.map((m) => m.round))
  return [...set].sort((a, b) => a - b)
}

export function suggestedHeatCount(playerCount: number, winnersPerHeat: 1 | 2): string {
  if (playerCount < 2) return 'Tilføj mindst 2 navne'
  const heats = Math.floor(playerCount / PLAYERS_PER_MATCH)
  const rem = playerCount % PLAYERS_PER_MATCH
  const advance = heats * winnersPerHeat + rem
  let tip = `${heats} heat${heats === 1 ? '' : 's'} à 4`
  if (rem) tip += ` · ${rem} venter / bye`
  tip += ` · ca. ${advance} videre pr. runde`
  if (advance === 4) tip += ' → direkte finale'
  return tip
}
