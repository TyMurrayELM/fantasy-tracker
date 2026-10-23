// GET /api/qbs — every quarterback on every roster in the league, with where
// he sits: starting lineup, bench, IR or taxi squad. Straight from Sleeper's
// public API; one roster = one owner. Dynamic (the 14 MB player file lives
// in module memory, refreshed daily), CDN holds the answer a minute.

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

// Only QBs are kept from the player file: name, NFL team, age, injury tag
// and the NFL depth-chart slot (1 = the team's starter).
let qbMeta = null; // { at, map: Map<id, {...}> }
const PLAYER_TTL_MS = 24 * 60 * 60 * 1000;
async function getQbMeta() {
  if (qbMeta && Date.now() - qbMeta.at < PLAYER_TTL_MS) return qbMeta.map;
  const res = await fetch(`${BASE}/players/nfl`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sleeper /players/nfl → HTTP ${res.status}`);
  const all = await res.json();
  const map = new Map();
  for (const [id, p] of Object.entries(all)) {
    if (p.position !== 'QB' && !(p.fantasy_positions ?? []).includes('QB')) continue;
    map.set(id, {
      name: p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() ?? id,
      team: p.team ?? null,          // null = free agent / retired
      age: p.age ?? null,
      yearsExp: p.years_exp ?? null,
      injury: p.injury_status ?? null, // Questionable / Out / IR / PUP…
      depth: p.depth_chart_order ?? null,
      active: p.status === 'Active',
    });
  }
  qbMeta = { at: Date.now(), map };
  return map;
}

export async function GET() {
  const cfg = leagueConfig.sleeper;
  if (!cfg?.leagueId) {
    return NextResponse.json({ success: false, error: 'No Sleeper league id in config.js' }, { status: 400 });
  }
  try {
    const [league, users, rosters, meta] = await Promise.all([
      get(`/league/${cfg.leagueId}`),
      get(`/league/${cfg.leagueId}/users`),
      get(`/league/${cfg.leagueId}/rosters`),
      getQbMeta(),
    ]);
    const userById = new Map(users.map((u) => [u.user_id, u]));
    const qbSlots = (league.roster_positions ?? []).filter((p) => p === 'QB').length;

    const teams = rosters.map((r) => {
      const u = userById.get(r.owner_id);
      const starters = new Set(r.starters ?? []);
      const reserve = new Set(r.reserve ?? []);
      const taxi = new Set(r.taxi ?? []);
      const qbs = (r.players ?? [])
        .filter((id) => meta.has(id))
        .map((id) => {
          const m = meta.get(id);
          const slot = starters.has(id) ? 'starter' : reserve.has(id) ? 'ir' : taxi.has(id) ? 'taxi' : 'bench';
          return { id, slot, ...m };
        })
        // lineup first, then bench, IR, taxi; by name inside each group
        .sort((a, b) => ORDER[a.slot] - ORDER[b.slot] || a.name.localeCompare(b.name));
      const count = (slot) => qbs.filter((q) => q.slot === slot).length;
      return {
        rosterId: r.roster_id,
        name: u?.metadata?.team_name?.trim() || u?.display_name || `Roster ${r.roster_id}`,
        owner: cfg.owners?.[u?.display_name] ?? u?.display_name ?? String(r.owner_id),
        qbs,
        counts: {
          total: qbs.length,
          active: count('starter') + count('bench'), // on the active roster
          starters: count('starter'),
          bench: count('bench'),
          ir: count('ir'),
          taxi: count('taxi'),
        },
      };
    });
    teams.sort((a, b) => b.counts.total - a.counts.total || b.counts.active - a.counts.active || a.owner.localeCompare(b.owner));

    return NextResponse.json({
      success: true,
      league: league.name,
      season: league.season,
      qbSlots,
      taxiSlots: league.settings?.taxi_slots ?? 0,
      reserveSlots: league.settings?.reserve_slots ?? 0,
      teams,
      totals: {
        qbs: teams.reduce((s, t) => s + t.counts.total, 0),
        active: teams.reduce((s, t) => s + t.counts.active, 0),
        ir: teams.reduce((s, t) => s + t.counts.ir, 0),
        taxi: teams.reduce((s, t) => s + t.counts.taxi, 0),
      },
      fetchedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

const ORDER = { starter: 0, bench: 1, ir: 2, taxi: 3 };
