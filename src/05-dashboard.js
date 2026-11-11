/* ═══════════════════════════════════════════════════════════
   Dashboard
   ═══════════════════════════════════════════════════════════ */
const UI = { go() {}, newTrade() {}, editTrade() {}, openTrade() {}, palette() {}, params: {} };

function useDayStatus(date) {
  useS('trades'); useS('journal'); useS('reviews'); useS('prepArchive'); useS('preps');
  return dayStatus(date);
}
const LOOP = [
  { id: 'prep', label: 'Prep', page: 'prep', text: s => s.prep ? 'Planned' : 'Not started', done: s => s.prep },
  { id: 'trades', label: 'Trades', page: 'log', text: s => s.trades ? `${s.trades} logged` : 'None yet', done: s => s.trades > 0 },
  { id: 'journal', label: 'Journal', page: 'journal', text: s => s.journal ? `${s.journal} ${s.journal === 1 ? 'entry' : 'entries'}` : 'Not started', done: s => s.journal > 0 },
  { id: 'review', label: 'Review', page: 'review', text: s => s.review >= 3 ? 'Done' : s.review ? 'In progress' : 'Not started', done: s => s.review >= 3, part: s => s.review > 0 },
];
function DailyLoop() {
  const st = useDayStatus();
  const doneCount = LOOP.filter(n => n.done(st)).length;
  let reach = -1; LOOP.forEach((n, i) => { if (n.done(st) || (n.part && n.part(st))) reach = i; });
  return div({ ...rise(1, 'loop panel') },
    div('loop-h', h(Label, null, "Today's loop"), span('loop-c tnum', `${doneCount}/4`)),
    div('loop-track',
      div('loop-line'), div({ className: 'loop-fill', style: { '--p': reach <= 0 ? 0 : reach / (LOOP.length - 1) } }),
      LOOP.map((n, i) => h('button', { key: n.id, type: 'button', className: cx('loop-n', n.done(st) && 'done', n.part && !n.done(st) && n.part(st) && 'part'), style: { '--i': i }, onClick: () => UI.go(n.page) },
        span('loop-dot', n.done(st) && h(Icon, { n: 'check', s: 12, w: 2.6 })), span('loop-l', n.label), span('loop-s', n.text(st))))));
}
function LoopDots() {
  const st = useDayStatus();
  return h('button', { type: 'button', className: 'loopdots', 'data-tip': "Today's loop: prep, trades, journal, review", onClick: () => UI.go('dashboard') },
    LOOP.map(n => span({ key: n.id, className: cx('ld', n.done(st) && 'done', n.part && !n.done(st) && n.part(st) && 'part') })));
}

function MonthPnl({ trades, onDay }) {
  const now = new Date(); const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]); const [y, m] = ym;
  const first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const map = useMemo(() => { const o = {}; trades.forEach(t => { if (t.isDraft || !isYmd(t.entryDate)) return; const d = (o[t.entryDate] = o[t.entryDate] || { n: 0, pnl: 0, has: false }); d.n++; const p = tPnl(t); if (p !== null && t.exitDone) { d.pnl += p; d.has = true; } }); return o; }, [trades]);
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]; while (cells.length % 7) cells.push(null);
  const weeks = []; for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const key = d => `${y}-${pad2(m + 1)}-${pad2(d)}`;
  const mx = Math.max(1, ...Object.entries(map).filter(([k]) => k.startsWith(`${y}-${pad2(m + 1)}`)).map(([, v]) => Math.abs(v.pnl)));
  const td = today();
  const move = d => { const x = new Date(y, m + d, 1); setYm([x.getFullYear(), x.getMonth()]); };
  const monthNet = Object.entries(map).filter(([k]) => k.startsWith(`${y}-${pad2(m + 1)}`)).reduce((s, [, v]) => s + v.pnl, 0);
  return div('mcal',
    div('mcal-h', div('mcal-t', new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })), h(Pnl, { v: monthNet || null, dec: 0, className: 'mcal-net' }), div('grow'),
      h(IconBtn, { n: 'chevL', tip: 'Previous month', onClick: () => move(-1) }), h(IconBtn, { n: 'chevR', tip: 'Next month', onClick: () => move(1) })),
    div('mcal-g', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Week'].map(d => div({ key: d, className: 'mcal-w' }, d)),
      weeks.map((wk, wi) => {
        const wd = wk.filter(Boolean).map(d => map[key(d)]).filter(Boolean); const wp = wd.reduce((s, v) => s + v.pnl, 0), wn = wd.reduce((s, v) => s + v.n, 0);
        return h(Fragment, { key: wi }, wk.map((d, di) => {
          if (!d) return div({ key: di, className: 'mcal-d off' });
          const k = key(d), v = map[k]; const a = v && v.has ? .12 + .88 * Math.abs(v.pnl) / mx : 0;
          return h('button', { key: di, type: 'button', disabled: !v, className: cx('mcal-d', k === td && 'today', v && 'has', v && v.has && (v.pnl > 0 ? 'pos' : v.pnl < 0 ? 'neg' : 'flat'), a > .5 && 'hi'), style: { '--a': a }, onClick: () => onDay(k) },
            span('mcal-n tnum', d), v && span('mcal-p tnum', v.has ? fmtMoney(v.pnl, { dec: 0 }) : `${v.n}T`));
        }), div({ className: 'mcal-wk' }, wn ? h(Fragment, null, h(Pnl, { v: wd.some(v => v.has) ? wp : null, dec: 0 }), span('mcal-wt tnum', wn + 'T')) : null));
      })));
}
function DayModal({ date, onClose }) {
  const trades = useS('trades').filter(t => t.entryDate === date && !t.isDraft).sort(byOldest);
  const st = calcStats(trades);
  return h(Modal, { onClose, className: 'day' }, close => h(Fragment, null,
    div('day-h', div(null, h(Label, null, fmtDate(date, { weekday: 'long' })), div('day-t', fmtDate(date, { month: 'long', day: 'numeric', year: 'numeric' }))), h(IconBtn, { n: 'x', tip: 'Close', onClick: close })),
    div('day-s', div(null, h(Label, null, 'Trades'), div('day-v tnum', trades.length)), div(null, h(Label, null, 'Day P&L'), h(Pnl, { v: st.closed ? st.net : null, className: 'day-v' })), div(null, h(Label, null, 'Win rate'), div('day-v tnum', st.winRate === null ? '—' : Math.round(st.winRate) + '%'))),
    div('day-l', trades.map(t => h(TradeRow, { key: t.id, t, onClick: () => { close(); setTimeout(() => UI.openTrade(t.id, trades.map(x => x.id)), 160); } }))),
    div('day-f', h(Btn, { kind: 'ghost', icon: 'journal', onClick: () => { close(); UI.go('journal', { date }); } }, 'Journal'), h(Btn, { kind: 'ghost', icon: 'review', onClick: () => { close(); UI.go('review', { date }); } }, 'Review'))));
}
function TradeRow({ t, onClick, i = 0, note }) {
  const p = tPnl(t);
  return h('button', { type: 'button', ...rise(i, 'trow'), onClick },
    span('trow-sym', tSym(t)), h(DirTag, { dir: tDir(t), small: true }),
    span('trow-d', fmtDate(t.entryDate, { month: 'short', day: 'numeric' }), t.entryTime ? ' · ' + fmtHM(t.entryTime) : ''),
    div('grow'), note && span('trow-note', note), h(GradeTag, { g: t.grade }),
    t.exitDone && p !== null ? h(Pnl, { v: p, unit: t.pnlUnit || '$' }) : span('trow-open', t.isDraft ? 'Draft' : 'Open'));
}
const Stat = ({ label, children, sub, className }) => div(cx('stat', className), h(Label, null, label), div('stat-v tnum', children), sub && div('stat-s', sub));

function Dashboard() {
  const trades = useS('trades'); const settings = useS('settings');
  const [range, setRange] = useState('all'); const [day, setDay] = useState(null);
  const list = useMemo(() => trades.filter(t => !t.isDraft && inRange(t.entryDate, range)), [trades, range]);
  const st = useMemo(() => calcStats(list), [list]);
  const points = useMemo(() => curvePoints(st), [st]);
  const hr = new Date().getHours(); const greet = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const rangeLabel = (RANGES.find(r => r[0] === range) || [])[1];
  const recent = useMemo(() => [...list].sort(byNewest).slice(0, 6), [list]);
  const ids = useMemo(() => [...list].sort(byNewest).map(t => t.id), [list]);
  return div('page dash', div('page-in',
    div({ ...rise(0, 'dash-top') },
      div(null, h(Label, null, new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })), h('h1', { className: 'dash-greet' }, greet, settings.name ? ', ' : '', settings.name && span('dash-name', settings.name), '.')),
      div('grow'), h(Seg, { value: range, onChange: setRange, options: RANGES.filter(r => r[0] !== '90d') })),
    h(DailyLoop),
    div('dash-hero',
      div({ ...rise(2, 'panel hero') },
        div('hero-top', div(null, h(Label, null, 'Net P&L · ' + rangeLabel),
          div(cx('hero-num', st.net < 0 && 'neg'), h(CountUp, { key: range, value: st.closed ? st.net : null, format: v => v === null ? '$0.00' : fmtMoney(v, { sign: true }) }))),
          div('hero-stats', h(Stat, { label: 'Expectancy', sub: 'per closed trade' }, st.expectancy === null ? '—' : fmtMoney(st.expectancy)),
            h(Stat, { label: 'Profit factor', sub: 'gross win / gross loss' }, fmtPF(st.pf)),
            h(Stat, { label: 'Net R', sub: 'P&L in units of risk' }, fmtR(st.netR)))),
        h(LineChart, { key: range, points, height: 250, tipFmt: v => fmtMoney(v), empty: 'Close a trade to start your equity curve', onPick: p => p.t && UI.openTrade(p.t.id, ids) })),
      div({ ...rise(3, 'panel side') },
        div('side-ring', h(Ring, { pct: st.winRate || 0, size: 172, stroke: 5 }, div('ring-num', h(CountUp, { key: range, value: st.winRate, format: v => v === null ? '—' : Math.round(v) + '%' })), h(Label, null, 'Win rate')),
          div('wl', div('wl-i', span('wl-n tnum', st.wins), span('wl-l', 'Wins')), div('wl-i', span('wl-n tnum dimn', st.losses), span('wl-l', 'Losses')), div('wl-i', span('wl-n tnum dimn', st.be), span('wl-l', 'Even')))),
        div('side-list',
          [['Avg win', st.avgWin === null ? '—' : fmtMoney(st.avgWin)], ['Avg loss', st.avgLoss === null ? '—' : fmtMoney(-st.avgLoss)], ['Avg R:R', st.avgRR === null ? '—' : st.avgRR.toFixed(2)],
            ['Streak', st.streak ? `${st.streak}${st.streakKind}` : '—'], ['Best win streak', st.bestStreak || '—'], ['Max drawdown', st.maxDD ? fmtMoney(-st.maxDD) : '—']].map(([k, v]) => div({ key: k, className: 'kv' }, span('kv-k', k), span('kv-v tnum', v)))))),
    div({ ...rise(4, 'panel strip') },
      div('panel-h', h(Label, null, st.closed ? `Last ${Math.min(48, st.closed)} closed trades` : 'Closed trades'), div('grow'), div('legend', span('lgd up'), 'Win', span('lgd dn'), 'Loss', span('lgd wk'), 'MFE / MAE')),
      div('panel-b', h(CandleStrip, { key: range, trades: list, onPick: t => UI.openTrade(t.id, ids) }))),
    div('dash-3',
      div({ ...rise(5, 'panel') }, div('panel-h', h(Label, null, 'Recent trades'), div('grow'), list.length > 0 && h('button', { className: 'link', onClick: () => UI.go('log') }, 'View all')),
        div('panel-b tight', recent.length ? recent.map((t, i) => h(TradeRow, { key: t.id, t, i, onClick: () => UI.openTrade(t.id, ids) })) : h(Empty, { icon: 'log', title: 'No trades yet', sub: 'Log your first trade and this board comes alive.' }, h(Btn, { kind: 'solid', icon: 'plus', onClick: () => UI.newTrade() }, 'Log a trade')))),
      div({ ...rise(6, 'panel') }, div('panel-h', h(Label, null, 'Needs review'), div('grow'), span(cx('count', st.needsReview.length && 'hot'), st.needsReview.length)),
        div('panel-b tight', st.needsReview.length ? h(Fragment, null, st.needsReview.slice(0, 6).map((t, i) => h(TradeRow, { key: t.id, t, i, onClick: () => UI.openTrade(t.id, st.needsReview.map(x => x.id)) })), st.needsReview.length > 6 && div('more', `+${st.needsReview.length - 6} more in the trade log`))
          : h(Empty, { icon: 'check', title: 'All caught up', sub: 'Every closed trade has a reflection.' }))),
      div({ ...rise(7, 'panel') }, div('panel-b', h(MonthPnl, { trades, onDay: setDay })))),
    day && h(DayModal, { date: day, onClose: () => setDay(null) })));
}
