// GET /api/sleeper — standings, points, records and weekly high scores for
// the league in config.js, straight from Sleeper's public API (no auth).
// Only completed weeks count toward weekly highs. Cached five minutes.

import { NextResponse } from 'next/server';
import { leagueConfig } from '../../config';

export const revalidate = 300;

const BASE = 'https://api.sleeper.app/v1';

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Sleeper ${path} → HTTP ${res.status}`);
  return res.json();
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

    const weekPages = await Promise.all(
      Array.from({ length: completedWeeks }, (_, i) => get(`/league/${cfg.leagueId}/matchups/${i + 1}`))
    );
    const highWeeks = new Map(); // roster_id -> [weeks]
    weekPages.forEach((page, i) => {
      const week = i + 1;
      let best = -Infinity;
      for (const m of page) if (typeof m.points === 'number' && m.points > best) best = m.points;
      if (best === -Infinity) return;
      for (const m of page) {
        if (m.points === best) {
          if (!highWeeks.has(m.roster_id)) highWeeks.set(m.roster_id, []);
          highWeeks.get(m.roster_id).push(week);
        }
      }
    });

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
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
