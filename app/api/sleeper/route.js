// GET /api/sleeper — standings, points, records and weekly high scores for
// the league in config.js, straight from Sleeper's public API (no auth).
// Only completed weeks count toward weekly highs; the week in progress is
// reported separately as "so far". The route is dynamic (the 14 MB player
// file can't go through Next's static/data cache) and the CDN holds the
// response for a minute.

import { NextResponse } from 'next/server';
import { leagueConfig } from '../../config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE = 'https://api.sleeper.app/v1';

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Sleeper ${path} → HTTP ${res.status}`);
  return res.json();
}

// The NFL players file is ~14 MB, far past Next's per-entry data-cache
// limit, so it lives in module memory and refreshes once a day. Only
// name / position / team are kept.
let playerMeta = null; // { at, map: Map<id, { name, pos, team }> }
const PLAYER_TTL_MS = 24 * 60 * 60 * 1000;
async function getPlayerMeta() {
  if (playerMeta && Date.now() - playerMeta.at < PLAYER_TTL_MS) return playerMeta.map;
  const res = await fetch(`${BASE}/players/nfl`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sleeper /players/nfl → HTTP ${res.status}`);
  const all = await res.json();
  const map = new Map();
  for (const [id, p] of Object.entries(all)) {
    map.set(id, { name: p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() ?? id, pos: p.position ?? '', team: p.team ?? '' });
  }
  playerMeta = { at: Date.now(), map };
  return map;
}

// NFL team colours + logos from ESPN, refreshed daily. Keyed by Sleeper's
// abbreviation (Washington is WAS on Sleeper, WSH on ESPN).
const SLEEPER_TO_ESPN = { WAS: 'WSH', OAK: 'LV' };
let nflTeams = null; // { at, map: Map<sleeperAbbr, { abbr, name, nick, color, alt, logo }> }
const luminance = (hex) => {
  const h = (hex ?? '').replace('#', '');
  if (h.length !== 6) return 128;
  return 0.2126 * parseInt(h.slice(0, 2), 16) + 0.7152 * parseInt(h.slice(2, 4), 16) + 0.0722 * parseInt(h.slice(4, 6), 16);
};
// ESPN's primary is sometimes near-black or near-white; prefer the
// alternate when it reads better as an accent.
const accentOf = (color, alt) => {
  if (!color) return alt ?? null;
  const l = luminance(color);
  if ((l < 40 || l > 225) && alt) {
    const la = luminance(alt);
    if (la >= 40 && la <= 225) return alt;
  }
  return color;
};
async function getNflTeams() {
  if (nflTeams && Date.now() - nflTeams.at < PLAYER_TTL_MS) return nflTeams.map;
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=40', { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN teams → HTTP ${res.status}`);
  const json = await res.json();
  const map = new Map();
  for (const t of json.sports?.[0]?.leagues?.[0]?.teams ?? []) {
    const team = t.team;
    const espnAbbr = team.abbreviation;
    const sleeperAbbr = Object.entries(SLEEPER_TO_ESPN).find(([, e]) => e === espnAbbr)?.[0] ?? espnAbbr;
    const entry = { abbr: sleeperAbbr, name: team.displayName, nick: team.name, color: accentOf(team.color, team.alternateColor), alt: team.alternateColor ?? null, logo: team.logos?.[0]?.href ?? null };
    map.set(sleeperAbbr, entry);
    if (sleeperAbbr !== espnAbbr) map.set(espnAbbr, entry);
    for (const [s, e] of Object.entries(SLEEPER_TO_ESPN)) if (e === espnAbbr) map.set(s, entry);
  }
  nflTeams = { at: Date.now(), map };
  return map;
}

// Sleeper splits points into an integer and a hundredths integer (8 = .08)
const pts = (whole, hundredths) => (whole ?? 0) + (hundredths ?? 0) / 100;

export async function GET() {
  const cfg = leagueConfig.sleeper;
  if (!cfg?.leagueId) {
    return NextResponse.json({ success: false, error: 'No Sleeper league id in config.js' }, { status: 400 });
  }
  try {
    const [league, users, rosters, state] = await Promise.all([
      get(`/league/${cfg.leagueId}`),
      get(`/league/${cfg.leagueId}/users`),
      get(`/league/${cfg.leagueId}/rosters`),
      get('/state/nfl'),
    ]);

    const weeks = (league.settings?.playoff_week_start ?? 15) - 1;
    const playoffSpots = league.settings?.playoff_teams ?? 6;
    // A week is complete once the NFL state has moved past it (or the
    // regular season is over). The week in progress has partial scores.
    const sameSeason = String(state.season) === String(league.season);
    const completedWeeks = !sameSeason || state.season_type === 'post'
      ? weeks
      : Math.max(0, Math.min(weeks, (state.week ?? 1) - 1));

    const inProgressWeek = sameSeason && state.season_type === 'regular' && (state.week ?? 0) > completedWeeks && (state.week ?? 0) <= weeks
      ? state.week
      : null;
    const [weekPages, livePage] = await Promise.all([
      Promise.all(Array.from({ length: completedWeeks }, (_, i) => get(`/league/${cfg.leagueId}/matchups/${i + 1}`))),
      inProgressWeek ? get(`/league/${cfg.leagueId}/matchups/${inProgressWeek}`).catch(() => null) : Promise.resolve(null),
    ]);
    const highWeeks = new Map(); // roster_id -> [weeks]
    const weekly = []; // { week, rosterIds, points } — a tie shares the week
    weekPages.forEach((page, i) => {
      const week = i + 1;
      let best = -Infinity;
      for (const m of page) if (typeof m.points === 'number' && m.points > best) best = m.points;
      if (best === -Infinity) return;
      const winners = [];
      for (const m of page) {
        if (m.points === best) {
          if (!highWeeks.has(m.roster_id)) highWeeks.set(m.roster_id, []);
          highWeeks.get(m.roster_id).push(week);
          winners.push(m.roster_id);
        }
      }
      weekly.push({ week, rosterIds: winners, points: best });
    });

    // Starter points per roster per NFL team — which real team is carrying
    // each fantasy team's points-for.
    const starterPts = new Map(); // roster_id -> Map<playerId, points>
    for (const page of weekPages) {
      for (const m of page) {
        const acc = starterPts.get(m.roster_id) ?? new Map();
        (m.starters ?? []).forEach((id, i) => {
          const p = m.starters_points?.[i] ?? m.players_points?.[id] ?? 0;
          acc.set(id, (acc.get(id) ?? 0) + p);
        });
        starterPts.set(m.roster_id, acc);
      }
    }

    // Season point totals per player (every rostered player, bench included)
    // for the top-QB / top-non-QB awards, plus who holds him now.
    const playerTotals = new Map(); // id -> { points, rosterId }
    for (const page of weekPages) {
      for (const m of page) {
        for (const [id, p] of Object.entries(m.players_points ?? {})) {
          const cur = playerTotals.get(id) ?? { points: 0, rosterId: m.roster_id };
          cur.points += p;
          cur.rosterId = m.roster_id; // latest completed week wins
          playerTotals.set(id, cur);
        }
      }
    }

    const userById = new Map(users.map((u) => [u.user_id, u]));
    const teams = rosters.map((r) => {
      const u = userById.get(r.owner_id);
      const s = r.settings ?? {};
      return {
        rosterId: r.roster_id,
        sleeperUser: u?.display_name ?? String(r.owner_id),
        name: u?.metadata?.team_name?.trim() || u?.display_name || `Roster ${r.roster_id}`,
        owner: cfg.owners?.[u?.display_name] ?? u?.display_name ?? String(r.owner_id),
        wins: s.wins ?? 0,
        losses: s.losses ?? 0,
        ties: s.ties ?? 0,
        pf: pts(s.fpts, s.fpts_decimal),
        pa: pts(s.fpts_against, s.fpts_against_decimal),
        highWeeks: highWeeks.get(r.roster_id) ?? [],
      };
    });
    const byRoster = new Map(teams.map((t) => [t.rosterId, t]));
    // Week in progress: the current leader for the weekly high (partial scores)
    let currentWeek = null;
    if (inProgressWeek) {
      let best = null;
      for (const m of livePage ?? []) {
        if (typeof m.points !== 'number') continue;
        if (!best || m.points > best.points) best = { rosterId: m.roster_id, points: m.points };
      }
      const t = best ? byRoster.get(best.rosterId) : null;
      currentWeek = {
        week: inProgressWeek,
        started: !!best && best.points > 0,
        leader: best && best.points > 0 ? { owner: t?.owner ?? '', name: t?.name ?? '', points: Math.round(best.points * 100) / 100 } : null,
      };
    }
    const weeklyHighs = weekly.map((w) => ({
      week: w.week,
      points: w.points,
      winners: w.rosterIds.map((id) => ({ owner: byRoster.get(id)?.owner ?? String(id), name: byRoster.get(id)?.name ?? '' })),
    }));
    let leaders = { qb: [], nonQb: [] };
    if (playerTotals.size) {
      try {
        const meta = await getPlayerMeta();
        // Biggest contributing NFL team per roster (starters only = PF)
        let nfl = null;
        try { nfl = await getNflTeams(); } catch { nfl = null; }
        for (const t of teams) {
          const acc = starterPts.get(t.rosterId);
          if (!acc) continue;
          const byTeam = new Map();
          let total = 0;
          for (const [id, pts] of acc) {
            const abbr = meta.get(id)?.team || (meta.get(id)?.pos === 'DEF' ? id : '');
            if (!abbr) continue;
            byTeam.set(abbr, (byTeam.get(abbr) ?? 0) + pts);
            total += pts;
          }
          const ranked = [...byTeam.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([abbr, pts]) => {
              const info = nfl?.get(abbr);
              return {
                abbr,
                name: info?.name ?? abbr,
                nick: info?.nick ?? abbr,
                points: Math.round(pts * 100) / 100,
                share: total > 0 ? Math.round((pts / total) * 1000) / 1000 : 0,
                color: info?.color ?? null,
                logo: info?.logo ?? null,
              };
            });
          if (ranked.length) {
            t.topNflTeam = ranked[0];   // themes the row
            t.topNflTeams = ranked;     // top three, icons on the row
          }
        }
        const rows = [...playerTotals.entries()].map(([id, t]) => {
          const p = meta.get(id);
          const holder = byRoster.get(t.rosterId);
          return { id, name: p?.name ?? id, pos: p?.pos ?? '', team: p?.team ?? '', points: Math.round(t.points * 100) / 100, owner: holder?.owner ?? '' };
        });
        const top = (f) => rows.filter(f).sort((a, b) => b.points - a.points).slice(0, 3);
        leaders = { qb: top((r) => r.pos === 'QB'), nonQb: top((r) => r.pos && r.pos !== 'QB' && r.pos !== 'DEF') };
      } catch (e) {
        leaders = { qb: [], nonQb: [], error: e instanceof Error ? e.message : String(e) };
      }
    }
    // Sleeper's standings order: record, then points for
    teams.sort((a, b) => b.wins - a.wins || a.losses - b.losses || b.pf - a.pf);

    return NextResponse.json({
      success: true,
      league: league.name,
      season: league.season,
      status: league.status,
      weeks,
      playoffSpots,
      completedWeeks,
      nflWeek: state.week,
      teams,
      weeklyHighs,
      leaders,
      currentWeek,
      fetchedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
