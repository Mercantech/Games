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

/** v2: heats à 3–4 (alle med). Gammel v1-state ignoreres. */
export const STORAGE_KEY = 'mercantec-games-bracket-v2'
export const MAX_PER_HEAT = 4
export const MIN_PER_HEAT = 3
/** @deprecated brug MAX_PER_HEAT — beholdt for evt. gammel kode */
export const PLAYERS_PER_MATCH = MAX_PER_HEAT

let idSeq = 0
export function uid(prefix = 'id'): string {
  idSeq += 1
  return `${prefix}_${Date.now().toString(36)}_${idSeq}`
}

/**
 * Fordel n spillere i heats à 3 eller 4 (helst flest 4'ere).
 * Små n: ét heat med 2–4. Kun ved n=5: 3+2.
 * Eks. 21 → [4,4,4,3,3,3]
 */
export function heatSizes(n: number): number[] {
  if (n <= 0) return []
  if (n <= MAX_PER_HEAT) return [n]

  let fours = Math.floor(n / MAX_PER_HEAT)
  const rem = n % MAX_PER_HEAT

  if (rem === 0) return Array.from({ length: fours }, () => 4)
  if (rem === 3) return [...Array.from({ length: fours }, () => 4), 3]
  if (rem === 2) {
    // 4a+2 → (a-1)×4 + 3+3
    if (fours >= 1) return [...Array.from({ length: fours - 1 }, () => 4), 3, 3]
    return [2] // n=2 allerede fanget
  }
  // rem === 1: 4a+1 → (a-2)×4 + 3+3+3  (kræver a≥2), ellers n=5 → 3+2
  if (fours >= 2) return [...Array.from({ length: fours - 2 }, () => 4), 3, 3, 3]
  if (fours === 1) return [3, 2] // n=5
  return [1]
}

/** Chunk spillere efter heatSizes — alle kommer med, pool tom. */
export function chunkIntoHeats(playerIds: string[]): string[][] {
  const sizes = heatSizes(playerIds.length)
  const groups: string[][] = []
  let i = 0
  for (const size of sizes) {
    groups.push(playerIds.slice(i, i + size))
    i += size
  }
  return groups
}

function makeHeats(
  playerIds: string[],
  round: number,
  labelPrefix: string,
): Match[] {
  return chunkIntoHeats(playerIds).map((group, idx) => ({
    id: uid('m'),
    round,
    label: `${labelPrefix}${idx + 1}`,
    playerIds: [...group],
    winnerIds: [],
    status: 'open' as const,
    isFinal: false,
  }))
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
    // Drop forældet v1 (leftover-pool / kun-4-heats)
    localStorage.removeItem('mercantec-games-bracket-v1')
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

/** Opret turnering — alle i heats à 3–4 (ingen leftover-pool). */
export function startTournament(
  names: string[],
  winnersPerHeat: 1 | 2,
  title = 'Bomberman Bracket',
): Tournament {
  const players: Player[] = names.map((name) => ({ id: uid('p'), name }))
  const shuffled = shuffle(players.map((p) => p.id))
  const matches = makeHeats(shuffled, 1, 'Heat ')
  return emptyTournament({
    title,
    players,
    winnersPerHeat,
    matches,
    pool: [],
    advancing: [],
    phase: 'running',
    championId: null,
  })
}

/** Antal vindere for heat: max 1 i finale; ellers min(mode, filled-1) så mindst én ryger ud. */
export function requiredWinners(match: Match, winnersPerHeat: 1 | 2): number {
  if (match.isFinal) return 1
  const filled = match.playerIds.filter(Boolean).length
  if (filled < 2) return 1
  return Math.min(winnersPerHeat, filled - 1)
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
  if (!match || match.status === 'done' || slot < 0 || slot >= match.playerIds.length) return t
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

export function addEmptyHeat(t: Tournament, round: number, seats = MAX_PER_HEAT): Tournament {
  const openInRound = t.matches.filter((m) => m.round === round && !m.isFinal)
  const n = openInRound.length + 1
  const size = Math.min(MAX_PER_HEAT, Math.max(MIN_PER_HEAT, seats))
  const match: Match = {
    id: uid('m'),
    round,
    label: `Heat ${n}`,
    playerIds: Array.from({ length: size }, () => null),
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
    for (let s = 0; s < playerIds.length; s += 1) {
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

  // Finale når alle der er videre kan være i ét heat (≤4)
  if (entrants.length <= MAX_PER_HEAT) {
    const finalMatch: Match = {
      id: uid('m'),
      round: nextRound,
      label: 'Finale',
      playerIds: [...entrants],
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

  const matches = makeHeats(entrants, nextRound, `R${nextRound} Heat `)
  return {
    ...t,
    matches: [...t.matches, ...matches],
    pool: [],
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
  const sizes = heatSizes(playerCount)
  const fours = sizes.filter((s) => s === 4).length
  const threes = sizes.filter((s) => s === 3).length
  const twos = sizes.filter((s) => s === 2).length
  const parts: string[] = []
  if (fours) parts.push(`${fours}×4`)
  if (threes) parts.push(`${threes}×3`)
  if (twos) parts.push(`${twos}×2`)
  // Ca. videre: hvert heat giver min(winnersPerHeat, size-1)
  const advance = sizes.reduce(
    (sum, size) => sum + Math.min(winnersPerHeat, Math.max(1, size - 1)),
    0,
  )
  let tip = `${sizes.length} heat${sizes.length === 1 ? '' : 's'} (${parts.join(' + ')}) · alle med`
  tip += ` · ca. ${advance} videre`
  if (advance <= MAX_PER_HEAT) tip += ' → derefter finale'
  return tip
}
