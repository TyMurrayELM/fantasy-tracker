'use client';

// /qbs — who is hoarding quarterbacks. One row per roster: how many QBs, and
// each one tagged with where he sits (lineup, bench, IR, taxi). Its own URL
// so the link can be pasted into the league chat. Data: /api/qbs (Sleeper).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { leagueConfig } from '../config';

const SLOT = {
  starter: { label: 'Starting', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  bench: { label: 'Bench', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  ir: { label: 'IR', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' },
  taxi: { label: 'Taxi', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
};

function useQbs() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/qbs', { cache: 'no-store' })
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
          if (!cancelled) { setData(j); setError(null); }
        })
        .catch((e) => { if (!cancelled) setError(e.message); });
    load();
    const onShow = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onShow); };
  }, []);
  return { data, error };
}

// Saved to the iPhone home screen the tracker has no address bar, so the
// link has to be shareable from the page itself (Tyler, 2026-10-23): the
// phone's share sheet where there is one, otherwise copy to the clipboard.
function ShareButton() {
  const [state, setState] = useState('idle'); // idle | copied | failed
  // Clipboard API first; a hidden textarea + execCommand where that is
  // refused (older WebKit, no user-activation grant)
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
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
    } catch { return false; }
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'QBs · Dues Tracker', url }); return; } catch (e) {
        if (e?.name === 'AbortError') return; // closed the share sheet
      }
    }
    setState((await copy(url)) ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 1800);
  };
  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this page"
      title="Share this page"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 active:scale-[0.97] transition"
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      {state === 'copied' ? 'Link copied' : state === 'failed' ? 'Copy failed' : 'Share'}
    </button>
  );
}

const Pill = ({ slot }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium leading-4 ${SLOT[slot].cls}`}>{SLOT[slot].label}</span>
);

function TeamRow({ team, max }) {
  const c = team.counts;
  const parts = [
    c.active ? `${c.active} active` : null,
    c.ir ? `${c.ir} IR` : null,
    c.taxi ? `${c.taxi} taxi` : null,
  ].filter(Boolean);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">{team.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{team.owner} · {parts.join(' · ') || 'no QBs'}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums tracking-[-0.5px] leading-none">{c.total}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">QB{c.total === 1 ? '' : 's'}</div>
        </div>
      </div>
      {/* count bar, scaled to the biggest hoard in the league */}
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
        {['starter', 'bench', 'ir', 'taxi'].map((slot) => {
          const n = slot === 'starter' ? c.starters : slot === 'bench' ? c.bench : c[slot];
          if (!n) return null;
          const color = slot === 'starter' ? 'bg-emerald-500' : slot === 'bench' ? 'bg-slate-400' : slot === 'ir' ? 'bg-red-500' : 'bg-amber-400';
          return <div key={slot} className={color} style={{ width: `${(n / max) * 100}%` }} title={`${n} ${SLOT[slot].label.toLowerCase()}`} />;
        })}
      </div>
      {team.qbs.length > 0 && (
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {team.qbs.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-medium">{q.name}</span>
                <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {q.team ?? 'FA'}
                  {q.depth ? ` QB${q.depth}` : ''}
                  {q.age ? ` · ${q.age}y` : ''}
                </span>
                {q.injury && <span className="ml-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">{q.injury}</span>}
              </span>
              <Pill slot={q.slot} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Qbs() {
  const { data, error } = useQbs();
  const max = data ? Math.max(1, ...data.teams.map((t) => t.counts.total)) : 1;
  return (
    <div className="min-h-screen">
      <header className="max-w-3xl mx-auto px-4 pt-6 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.8px] leading-tight">QBs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {data?.league ?? 'Dynasty fantasy football'} · {data?.season ?? leagueConfig.season} season
              {data ? ` · ${data.totals.qbs} rostered (${data.totals.active} active, ${data.totals.ir} IR, ${data.totals.taxi} taxi)` : ''}
            </p>
          </div>
          <nav className="flex bg-slate-200/70 dark:bg-slate-800 rounded-full p-0.5 shrink-0">
            <Link href="/" className="px-3 py-1.5 rounded-full text-sm font-medium text-slate-500 dark:text-slate-400">Dues</Link>
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">QBs</span>
          </nav>
        </div>
        <div className="mt-3 flex justify-end">
          <ShareButton />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-10 space-y-3">
        {error && !data && <div className="text-sm text-red-600">Couldn&apos;t reach Sleeper: {error}</div>}
        {!data && !error && (
          <div className="space-y-3" aria-label="Loading">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
          </div>
        )}
        {data?.teams.map((t) => <TeamRow key={t.rosterId} team={t} max={max} />)}
        {data && (
          <p className="text-[11px] text-slate-400 text-center pt-2">
            Live from Sleeper · lineup has {data.qbSlots} QB slot{data.qbSlots === 1 ? '' : 's'} · IR {data.reserveSlots}, taxi {data.taxiSlots} · team QB1/QB2 = NFL depth chart
          </p>
        )}
      </main>
    </div>
  );
}
