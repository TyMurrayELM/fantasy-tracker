'use client';

// Dues tracker: one row per team (rank, team, net dollars, payment status),
// tap a row for the math; a summary strip up top answers "who still owes?"
// Everything is driven by app/config.js.

import { useEffect, useMemo, useState } from 'react';
import { leagueConfig, teamsData, awardWinners, paidOwners, sentOwners } from './config';

const usd = (n, cents = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);
const signed = (n) => (n > 0 ? `+${usd(n)}` : usd(n));
const num = (s) => Number(s) || 0;

const FALLBACK = {
  weeks: leagueConfig.weeks ?? 14,
  playoffSpots: leagueConfig.playoffSpots ?? 6,
  completedWeeks: leagueConfig.currentWeek ?? 0,
};

// Live league state from Sleeper (standings, records, points, weekly
// highs) merged with the config's award flags and payment lists by owner.
// Until it loads — or if Sleeper is down — the config's own numbers show.
function useLeague() {
  const [live, setLive] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/sleeper', { cache: 'no-store' })
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
          if (!cancelled) { setLive(j); setError(null); }
        })
        .catch((e) => { if (!cancelled) setError(e.message); });
    load();
    // Refresh every minute while the page is open, and right away when
    // you come back to the tab — matches the one-minute server cache.
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60_000);
    const onShow = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener('visibilitychange', onShow); };
  }, []);

  return useMemo(() => {
    const flagsByOwner = new Map(teamsData.map((t) => [t.owner, t]));
    if (!live) {
      return {
        ...FALLBACK,
        teams: teamsData.map((t) => ({ ...t, wins: null, losses: null, ties: null, pf: num(t.pf), pa: num(t.pa) })),
        live: false,
        error,
        fetchedAt: null,
        weeklyHighs: [],
        leaders: { qb: [], nonQb: [] },
        currentWeek: null,
      };
    }
    const blank = { isSeasonChamp: false, isFirstPlace: false, isSecondPlace: false, isROY: false, isHighScoringNonQB: false, isHighScoringQB: false };
    return {
      weeks: live.weeks,
      playoffSpots: live.playoffSpots,
      completedWeeks: live.completedWeeks,
      teams: live.teams.map((t) => ({ ...blank, ...(flagsByOwner.get(t.owner) ?? {}), ...t })),
      live: true,
      error: null,
      fetchedAt: live.fetchedAt,
      league: live.league,
      weeklyHighs: live.weeklyHighs ?? [],
      leaders: live.leaders ?? { qb: [], nonQb: [] },
      currentWeek: live.currentWeek ?? null,
    };
  }, [live, error]);
}

// Everything one team earns or owes, itemised so the row and the expanded
// breakdown never disagree.
function ledgerFor(team) {
  const lines = [{ label: 'Buy-in', amount: -leagueConfig.buyIn }];
  if (team.isFirstPlace) lines.push({ label: '1st place', amount: leagueConfig.firstPlace });
  if (team.isSecondPlace) lines.push({ label: '2nd place', amount: leagueConfig.secondPlace });
  if (team.isSeasonChamp) lines.push({ label: 'Regular-season champ', amount: leagueConfig.regularSeasonChamp });
  if (team.isROY) lines.push({ label: 'OROY', amount: leagueConfig.oroy, note: awardWinners.oroy });
  if (team.isHighScoringNonQB) lines.push({ label: 'Top non-QB', amount: leagueConfig.highScoringNonQB, note: awardWinners.highScoringNonQB });
  if (team.isHighScoringQB) lines.push({ label: 'Top QB', amount: leagueConfig.highScoringQB, note: awardWinners.highScoringQB });
  const highs = team.highWeeks.length;
  if (highs > 0) {
    lines.push({
      label: `Weekly high × ${highs}`,
      amount: highs * leagueConfig.weeklyHigh,
      note: `W${team.highWeeks.join(', W')}`,
    });
  }
  const net = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, net };
}

// Rank colour: a thin bar that runs green → red down the standings
const rankBar = (i, n) => {
  const t = n <= 1 ? 0 : i / (n - 1); // 0 = top, 1 = bottom
  const hue = 145 - t * 145; // 145 (green) → 0 (red)
  return `hsl(${hue} 60% 48%)`;
};

const hexToRgba = (hex, a) => {
  const h = (hex ?? '').replace('#', '');
  if (h.length !== 6) return `rgba(100,116,139,${a})`;
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const Badge = ({ children, tone = 'slate', title }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    blue: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  };
  return (
    <span title={title} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium leading-4 ${tones[tone]}`}>
      {children}
    </span>
  );
};

const Pill = ({ ok, children }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
      ok
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
    {children}
  </span>
);

function TeamRow({ team, rank, count, open, onToggle, weeks, completedWeeks }) {
  const { lines, net } = ledgerFor(team);
  const isPaid = paidOwners.includes(team.owner);
  const isSent = sentOwners.includes(team.owner);
  const settled = net >= 0 ? isSent : isPaid;
  const statusText = net >= 0 ? (isSent ? 'Sent' : 'To send') : isPaid ? 'Paid' : 'Owes';
  const highs = team.highWeeks.length;
  // Row colour = the NFL team carrying this roster's points-for so far;
  // falls back to the rank gradient until Sleeper data lands.
  const nfl = team.topNflTeam ?? null;
  const nflTop = team.topNflTeams ?? (nfl ? [nfl] : []);
  const accent = nfl?.color ? `#${nfl.color}` : rankBar(rank - 1, count);
  const nflTitle = nfl ? `${nfl.name} players: ${nfl.points.toFixed(1)} of this team's starter points (${Math.round(nfl.share * 100)}%)` : undefined;

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left grid grid-cols-[1.75rem_1fr_auto] sm:grid-cols-[2rem_1fr_7rem_6rem] items-center gap-3 px-3 sm:px-4 py-3 transition"
        style={{
          boxShadow: `inset 3px 0 0 ${accent}`,
          background: nfl?.color ? `linear-gradient(90deg, ${hexToRgba(nfl.color, 0.12)} 0%, ${hexToRgba(nfl.color, 0.03)} 45%, transparent 100%)` : undefined,
        }}
        title={nflTitle}
      >
        <div className="text-sm font-semibold tabular-nums text-slate-400">{rank}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {nflTop.length > 0 && (
              <span className="flex items-center shrink-0" title={nflTop.map((x) => `${x.nick} ${x.points.toFixed(1)} (${Math.round(x.share * 100)}%)`).join(' · ')}>
                {nflTop.map((x, i) =>
                  x.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={x.abbr}
                      src={x.logo}
                      alt={x.name}
                      className={`object-contain ${i === 0 ? 'w-5 h-5' : 'w-4 h-4 opacity-70'} ${i > 0 ? '-ml-1' : ''}`}
                      loading="lazy"
                    />
                  ) : null
                )}
              </span>
            )}
            <span className="text-[15px] font-semibold tracking-[-0.2px] truncate">{team.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{team.owner}</span>
            {team.wins !== null && team.wins !== undefined && (
              <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                {team.wins}–{team.losses}{team.ties ? `–${team.ties}` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {team.isFirstPlace && <Badge tone="gold">🥇 Champion</Badge>}
            {team.isSecondPlace && <Badge tone="slate">🥈 Runner-up</Badge>}
            {team.isSeasonChamp && <Badge tone="blue">Reg-season champ</Badge>}
            {team.isROY && <Badge tone="green" title={awardWinners.oroy}>OROY</Badge>}
            {team.isHighScoringNonQB && <Badge tone="green" title={awardWinners.highScoringNonQB}>Top non-QB</Badge>}
            {team.isHighScoringQB && <Badge tone="green" title={awardWinners.highScoringQB}>Top QB</Badge>}
            {highs > 0 && <Badge tone="slate" title={`Weeks ${team.highWeeks.join(', ')}`}>{highs} weekly high{highs > 1 ? 's' : ''}</Badge>}
            {(num(team.pf) > 0 || num(team.pa) > 0) && (
              <span className="text-[11px] text-slate-400 tabular-nums">PF {num(team.pf).toFixed(1)} · PA {num(team.pa).toFixed(1)}</span>
            )}
          </div>
        </div>
        <div className="text-right sm:contents">
          <div className={`text-base font-bold tabular-nums sm:text-right ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {signed(net)}
          </div>
          <div className="mt-1 sm:mt-0 sm:text-right">
            <Pill ok={settled}>{statusText}</Pill>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-3 sm:px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">The math</div>
            <div className="space-y-1 text-sm tabular-nums">
              {lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-3">
                  <span className="text-slate-600 dark:text-slate-300 truncate">
                    {l.label}
                    {l.note ? <span className="text-slate-400"> · {l.note}</span> : null}
                  </span>
                  <span className={l.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>{signed(l.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 pt-1.5 mt-1.5 border-t border-slate-200 dark:border-slate-700 font-semibold">
                <span>Net</span>
                <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{signed(net)}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">
              Weekly highs · {usd(leagueConfig.weeklyHigh)} each
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: weeks }, (_, i) => i + 1).map((week) => {
                const played = week <= completedWeeks;
                const won = team.highWeeks.includes(week);
                return (
                  <span
                    key={week}
                    className={`inline-flex items-center justify-center w-8 h-7 rounded-md text-[11px] font-medium tabular-nums ${
                      won
                        ? 'bg-emerald-500 text-white'
                        : played
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'
                    }`}
                    title={won ? `Week ${week}: high score` : played ? `Week ${week}` : `Week ${week} (not played yet)`}
                  >
                    {week}
                  </span>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Through week {completedWeeks} of {weeks}
            </div>
            {nflTop.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Where the points come from</div>
                {nflTop.map((x, i) => (
                  <div key={x.abbr} className="flex items-center gap-1.5 tabular-nums">
                    {x.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.logo} alt="" className="w-4 h-4 object-contain" />
                    )}
                    <span className={i === 0 ? 'font-medium' : ''} style={i === 0 ? { color: accent } : undefined}>{x.nick}</span>
                    <span>{x.points.toFixed(1)} pts · {Math.round(x.share * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Plain-text recap for the Sleeper league chat: the latest weekly high
// and who leads the two season point-total awards.
function buildRecap(league) {
  const wk = league.completedWeeks;
  const out = [];
  out.push(`${league.league ?? 'League'} · ${wk ? `Week ${wk} recap` : `${leagueConfig.season} season`}`);
  const latest = league.weeklyHighs.length ? league.weeklyHighs[league.weeklyHighs.length - 1] : null;
  if (latest) {
    out.push(`🔥 Week ${latest.week} high score: ${latest.winners.map((w) => w.owner).join(' & ')} (${latest.points.toFixed(2)}) → +${usd(leagueConfig.weeklyHigh)}`);
  }
  const lead = (list, label, prize) => {
    if (!list.length) return;
    const [a, b] = list;
    const gap = b ? ` (${(a.points - b.points).toFixed(1)} up on ${b.name})` : '';
    out.push(`${label}: ${a.name}, ${a.points.toFixed(1)} pts${a.owner ? ` — ${a.owner}` : ''}${gap} → +${usd(prize)}`);
  };
  if (league.currentWeek?.leader) {
    out.push(`⏳ Week ${league.currentWeek.week} so far: ${league.currentWeek.leader.owner} leads at ${league.currentWeek.leader.points.toFixed(2)} (games in progress)`);
  }
  lead(league.leaders.qb, '🎯 Top QB so far', leagueConfig.highScoringQB);
  lead(league.leaders.nonQb, '💪 Top non-QB so far', leagueConfig.highScoringNonQB);
  return out.join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older iOS Safari: fall back to a hidden textarea + execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function Standings({ league }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [copied, setCopied] = useState(null); // 'ok' | 'fail' | null
  const rows = useMemo(() => league.teams.map((t) => ({ team: t, ...ledgerFor(t) })), [league]);
  const count = rows.length;

  const owing = rows.filter((r) => r.net < 0);
  const paid = owing.filter((r) => paidOwners.includes(r.team.owner));
  const unpaid = owing.filter((r) => !paidOwners.includes(r.team.owner));
  const collected = paid.reduce((s, r) => s - r.net, 0);
  const outstanding = unpaid.reduce((s, r) => s - r.net, 0);
  const toSend = rows.filter((r) => r.net > 0 && !sentOwners.includes(r.team.owner));
  const sendTotal = toSend.reduce((s, r) => s + r.net, 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          ['Paid up', `${paid.length} of ${owing.length}`, `${usd(collected)} collected`],
          ['Still owed', usd(outstanding), unpaid.length ? unpaid.map((r) => r.team.owner).join(', ') : 'everyone is in'],
          ['To send out', usd(sendTotal), toSend.length ? toSend.map((r) => r.team.owner).join(', ') : 'nothing pending'],
          ['Pot', usd(leagueConfig.buyIn * count), `${usd(leagueConfig.buyIn)} × ${count} teams`],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
            <div className="text-lg font-bold tabular-nums tracking-[-0.3px]">{value}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={sub}>{sub}</div>
          </div>
        ))}
      </div>

      {league.currentWeek && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/70 dark:ring-amber-800/60 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 shrink-0">Week {league.currentWeek.week} so far</span>
          {league.currentWeek.leader ? (
            <span className="truncate">
              <span className="font-semibold">{league.currentWeek.leader.owner}</span> leads the weekly high at{' '}
              <span className="font-semibold tabular-nums">{league.currentWeek.leader.points.toFixed(2)}</span>
              <span className="text-amber-700/80 dark:text-amber-300/80"> · games still in progress</span>
            </span>
          ) : (
            <span className="text-amber-800/80 dark:text-amber-200/80">no games played yet</span>
          )}
        </div>
      )}

      {/* Venmo */}
      <div className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 px-3 py-2.5 text-sm">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide text-white shrink-0" style={{ backgroundColor: '#008CFF' }} aria-hidden>venmo</span>
        <span className="text-slate-600 dark:text-slate-300">
          Owe money? Venmo{' '}
          <a href={leagueConfig.venmoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            @{leagueConfig.venmoUsername}
          </a>
          . Use &quot;For Trip&quot; or something equally vague.
        </span>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(buildRecap(league));
            setCopied(ok ? 'ok' : 'fail');
            setTimeout(() => setCopied(null), 2500);
          }}
          className={`ml-auto shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            copied === 'ok'
              ? 'bg-emerald-600 text-white'
              : copied === 'fail'
                ? 'bg-red-600 text-white'
                : 'bg-white text-white dark:bg-slate-900 dark:text-slate-900 select-none' /* hidden on purpose: same colour as the card */
          }`}
          aria-label="Copy recap for the league chat"
        >
          {copied === 'ok' ? 'Copied ✓' : copied === 'fail' ? 'Copy failed' : 'Copy recap'}
        </button>
      </div>

      {/* Standings */}
      <div className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2rem_1fr_7rem_6rem] gap-3 px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 dark:bg-slate-800/60">
          <div>#</div>
          <div>Team</div>
          <div className="text-right">Net</div>
          <div className="text-right">Status</div>
        </div>
        {rows.map((r, i) => (
          <div key={r.team.owner}>
            <TeamRow
              team={r.team}
              rank={i + 1}
              count={count}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              weeks={league.weeks}
              completedWeeks={league.completedWeeks}
            />
            {i + 1 === league.playoffSpots && i + 1 < count && (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex-grow border-t border-dashed border-slate-300 dark:border-slate-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Playoff line</span>
                <div className="flex-grow border-t border-dashed border-slate-300 dark:border-slate-600" />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 text-center">
        Tap a team for the math and its weekly-high record.
        {league.live
          ? ` Live from Sleeper through week ${league.completedWeeks} · refreshes every minute · updated ${new Date(league.fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
          : league.error
            ? ` Sleeper unavailable (${league.error}) — showing the numbers saved in config.`
            : ' Loading standings from Sleeper…'}
      </p>
    </div>
  );
}

function Payouts({ league }) {
  const WEEKS = league.weeks;
  const count = league.teams.length;
  const pot = leagueConfig.buyIn * count;
  const groups = [
    {
      title: 'Playoffs',
      items: [
        ['1st place', leagueConfig.firstPlace],
        ['2nd place', leagueConfig.secondPlace],
      ],
    },
    {
      title: 'Season awards',
      items: [
        ['Regular-season champ', leagueConfig.regularSeasonChamp],
        ['Offensive rookie of the year', leagueConfig.oroy],
        ['Top-scoring non-QB', leagueConfig.highScoringNonQB],
        ['Top-scoring QB', leagueConfig.highScoringQB],
      ],
    },
    {
      title: 'Weekly',
      items: [[`Weekly high score × ${WEEKS} weeks`, leagueConfig.weeklyHigh * WEEKS, `${usd(leagueConfig.weeklyHigh)} per week`]],
    },
  ];
  const distributed = groups.flatMap((g) => g.items).reduce((s, [, amt]) => s + amt, 0);
  const remaining = pot - distributed;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          ['Pot', usd(pot), `${usd(leagueConfig.buyIn)} × ${count}`],
          ['Paid out', usd(distributed), 'if every prize is claimed'],
          ['Left over', usd(remaining), remaining === 0 ? 'balanced' : 'check the numbers'],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
            <div className={`text-lg font-bold tabular-nums tracking-[-0.3px] ${label === 'Left over' && remaining !== 0 ? 'text-amber-600' : ''}`}>{value}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 overflow-hidden">
        {groups.map((g) => (
          <div key={g.title} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
            <div className="px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 dark:bg-slate-800/60">{g.title}</div>
            {g.items.map(([label, amt, sub]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div>
                  <div className="font-medium">{label}</div>
                  {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
                </div>
                <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{usd(amt)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Weekly winners — one line per week, live from Sleeper */}
      <div className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 overflow-hidden">
        <div className="px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 dark:bg-slate-800/60 flex justify-between">
          <span>Weekly high scores · {usd(leagueConfig.weeklyHigh)} each</span>
          <span>{league.weeklyHighs.length} of {WEEKS} decided</span>
        </div>
        {Array.from({ length: WEEKS }, (_, i) => i + 1).map((week) => {
          const w = league.weeklyHighs.find((x) => x.week === week);
          return (
            <div key={week} className={`grid grid-cols-[3rem_1fr_5rem] items-center gap-3 px-4 py-2 text-sm border-t border-slate-100 dark:border-slate-800 ${w ? '' : 'text-slate-400'}`}>
              <div className="text-xs font-semibold tabular-nums text-slate-400">W{week}</div>
              {w ? (
                <div className="min-w-0">
                  <span className="font-medium">{w.winners.map((x) => x.owner).join(' & ')}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs"> · {w.winners.map((x) => x.name).filter(Boolean).join(' & ')}</span>
                  {w.winners.length > 1 && <span className="text-[11px] text-amber-600"> · tie</span>}
                </div>
              ) : league.currentWeek?.week === week ? (
                <div className="min-w-0 text-amber-700 dark:text-amber-300">
                  {league.currentWeek.leader
                    ? <><span className="font-medium">{league.currentWeek.leader.owner}</span><span className="text-xs"> · leading so far, games in progress</span></>
                    : <span className="text-xs">in progress · no games played yet</span>}
                </div>
              ) : (
                <div className="text-xs">{league.live ? 'not played yet' : '—'}</div>
              )}
              <div className="text-right tabular-nums">
                {w
                  ? <span className="font-semibold">{w.points.toFixed(2)}</span>
                  : league.currentWeek?.week === week && league.currentWeek.leader
                    ? <span className="text-amber-700 dark:text-amber-300">{league.currentWeek.leader.points.toFixed(2)}</span>
                    : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 text-center">
        Buy-in rises 10% a year. Prizes are set in app/config.js.
      </p>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState('standings');
  const league = useLeague();

  return (
    <div className="min-h-screen">
      <header className="max-w-3xl mx-auto px-4 pt-6 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.8px] leading-tight">Dues Tracker</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{league.league ?? 'Dynasty fantasy football'} · {leagueConfig.season} season · {league.completedWeeks ? `${league.completedWeeks} week${league.completedWeeks === 1 ? '' : 's'} in` : 'preseason'}</p>
          </div>
          <div className="flex bg-slate-200/70 dark:bg-slate-800 rounded-full p-0.5 shrink-0">
            {[
              ['standings', 'Dues'],
              ['payouts', 'Payouts'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  tab === key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-10">
        {tab === 'standings' ? <Standings league={league} /> : <Payouts league={league} />}
      </main>
    </div>
  );
}
