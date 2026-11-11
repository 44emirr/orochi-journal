/* ═══════════════════════════════════════════════════════════
   Analytics
   ═══════════════════════════════════════════════════════════ */
const AN_TABS = [['overview', 'Overview'], ['time', 'Time'], ['breakdowns', 'Breakdowns'], ['rolling', 'Rolling']];
const AN_RANGES = [['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['month', 'This Month'], ['all', 'All Time']];
const DUR = [['<15m', 0, 15], ['15–30m', 15, 30], ['30–60m', 30, 60], ['1–2h', 60, 120], ['2–4h', 120, 240], ['4–8h', 240, 480], ['>8h', 480, Infinity]];
const R_BUCKETS = [['≤ −1R', -Infinity, -1], ['−1 to 0', -1, 0], ['0 to 1R', 0, 1], ['1 to 2R', 1, 2], ['2 to 3R', 2, 3], ['3R +', 3, Infinity]];
const Card = ({ title, sub, children, i = 0, className, right }) => div({ ...rise(i, cx('panel an-card', className)) }, div('panel-h', div(null, h(Label, null, title), sub && div('an-sub', sub)), div('grow'), right), div('panel-b', children));
const Tile = ({ label, value, sub, i = 0 }) => div({ ...rise(i, 'panel tile big') }, h(Label, null, label), div('tile-v tnum', value), sub && div('tile-s', sub));
const group = (list, keyFn) => { const m = new Map(); list.forEach(t => { const k = keyFn(t); if (k === null || k === undefined || k === '') return; if (!m.has(k)) m.set(k, []); m.get(k).push(t); }); return m; };
const agg = arr => { const c = arr.filter(t => t.exitDone && tPnl(t) !== null); const w = c.filter(t => tPnl(t) > 0).length; const rr = c.map(t => num(t.actualRR)).filter(v => v !== null); return { n: arr.length, closed: c.length, wins: w, wr: c.length ? Math.round(w / c.length * 100) : null, pnl: c.reduce((s, t) => s + tPnl(t), 0), avg: c.length ? c.reduce((s, t) => s + tPnl(t), 0) / c.length : null, rr: rr.length ? rr.reduce((a, b) => a + b, 0) / rr.length : null }; };

function BreakTable({ cols, rows, empty }) {
  if (!rows.length) return div('dt-none', empty);
  return div('tlist', h('table', { className: 'tt static' }, h('thead', null, h('tr', null, cols.map((c, i) => h('th', { key: c, className: i ? 'r' : '' }, c)))),
    h('tbody', null, rows.map((r, ri) => h('tr', { key: ri }, r.map((c, i) => h('td', { key: i, className: cx(i ? 'r tnum' : 'tt-sym') }, c)))))));
}

function AnalyticsPage() {
  const all = useS('trades');
  const [tab, setTab] = useState('overview'); const [range, setRange] = useState('all');
  const [metric, setMetric] = useState('winRate'); const [win, setWin] = useState(20);
  const list = useMemo(() => all.filter(t => !t.isDraft && inRange(t.entryDate, range)), [all, range]);
  const closed = useMemo(() => list.filter(t => t.exitDone && tPnl(t) !== null).sort(byOldest), [list]);
  const st = useMemo(() => calcStats(list), [list]);
  const ids = useMemo(() => [...list].sort(byNewest).map(t => t.id), [list]);
  const points = useMemo(() => curvePoints(st), [st]);
  const body = () => {
    if (!list.length) return div({ ...rise(2, 'panel') }, h(Empty, { icon: 'analytics', title: 'Nothing to analyse yet', sub: range === 'all' ? 'Log a few closed trades and this page fills itself in.' : 'No trades in this date range. Try a wider one.' }, range === 'all' ? h(Btn, { kind: 'solid', icon: 'plus', onClick: () => UI.newTrade() }, 'Log a trade') : h(Btn, { onClick: () => setRange('all') }, 'Show all time')));
    if (tab === 'overview') {
      const mis = [...group(list.flatMap(t => (t.mistakes || []).map(m => ({ m }))), x => x.m).entries()].map(([m, a]) => ({ key: m, label: MISTAKE_LABEL[m] || m, value: a.length })).sort((a, b) => b.value - a.value);
      const misTotal = mis.reduce((s, m) => s + m.value, 0);
      const rs = closed.map(tR).filter(v => v !== null);
      const rb = R_BUCKETS.map(([l, lo, hi]) => { const n = rs.filter(v => v > lo && v <= hi || (lo === -Infinity && v <= hi) || (hi === Infinity && v > lo)).length; return { label: l, value: n, count: n, top: rs.length ? Math.round(n / rs.length * 100) + '%' : '—' }; });
      return h(Fragment, null,
        div('an-hero',
          div({ ...rise(2, 'panel hero') }, div('hero-top', div(null, h(Label, null, 'Cumulative P&L'), div(cx('hero-num sm', st.net < 0 && 'neg'), h(CountUp, { key: range, value: st.closed ? st.net : null, format: v => v === null ? '$0.00' : fmtMoney(v) })), div('an-sub', `${st.closed} closed · ${st.open} open · ${st.total} logged`))),
            h(LineChart, { key: range, points, height: 230, tipFmt: v => fmtMoney(v), empty: 'Close a trade to start the curve', onPick: p => p.t && UI.openTrade(p.t.id, ids) })),
          div('an-tiles', h(Tile, { i: 3, label: 'Win rate', value: st.winRate === null ? '—' : Math.round(st.winRate) + '%', sub: `${st.wins}W / ${st.losses}L${st.be ? ` / ${st.be}BE` : ''}` }), h(Tile, { i: 4, label: 'Profit factor', value: fmtPF(st.pf), sub: 'Gross profit ÷ gross loss' }),
            h(Tile, { i: 5, label: 'Avg R:R', value: st.avgRR === null ? '—' : st.avgRR.toFixed(2), sub: 'Actual reward to risk' }), h(Tile, { i: 6, label: 'Expectancy', value: st.expectancy === null ? '—' : fmtMoney(st.expectancy), sub: st.avgR === null ? 'Per closed trade' : `${fmtR(st.avgR)} per trade` }),
            h(Tile, { i: 7, label: 'Reviewed', value: `${st.reviewed}/${st.total}`, sub: st.total ? Math.round(st.reviewed / st.total * 100) + '% have a reflection' : '' }), h(Tile, { i: 8, label: 'Best win streak', value: st.bestStreak || '—', sub: st.streak ? `Current: ${st.streak}${st.streakKind}` : 'Consecutive wins' }))),
        div('an-2',
          h(Card, { i: 9, title: 'R-multiple distribution', sub: rs.length ? `${rs.length} trades with risk and P&L in the same unit` : 'Needs risk and P&L on closed trades' }, rs.length ? h(Columns, { cols: rb, height: 190 }) : div('dt-none', 'No R data yet.')),
          h(Card, { i: 10, title: 'Mistake frequency', sub: misTotal ? `${misTotal} logged across ${list.filter(t => (t.mistakes || []).length).length} trades` : 'Tag mistakes when you log a trade' }, mis.length ? h(BarRows, { rows: mis.map(m => ({ ...m, right: `×${m.value}`, sub: null })) }) : div('dt-none', 'No mistakes tagged in this range.'))));
    }
    if (tab === 'time') {
      const hours = [...group(closed.filter(t => t.entryTime), t => parseInt(t.entryTime, 10)).entries()].sort((a, b) => a[0] - b[0]).map(([hr, a]) => { const g = agg(a); return { key: hr, label: fmtHM(pad2(hr) + ':00'), value: g.pnl, right: fmtMoney(g.pnl), sub: null, n: g.n, wr: g.wr }; });
      const bestH = hours.length ? hours.reduce((a, b) => b.value > a.value ? b : a) : null;
      const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((l, di) => { const g = agg(closed.filter(t => isYmd(t.entryDate) && (parseYmd(t.entryDate).getDay() + 6) % 7 === di)); return { label: l, value: g.wr || 0, count: g.closed, top: g.wr === null ? '—' : g.wr + '%', pnl: g.pnl }; });
      const dur = DUR.map(([l, lo, hi]) => { const a = closed.filter(t => { const m = tHold(t); return m !== null && m >= lo && m < hi; }); const g = agg(a); return { key: l, label: l, value: g.pnl, n: a.length, right: fmtMoney(g.pnl, { dec: 0 }), sub: `${a.length} ${a.length === 1 ? 'trade' : 'trades'} · ${g.wr === null ? '—' : g.wr + '%'} win rate` }; }).filter(d => d.n);
      const bestD = dur.length ? dur.reduce((a, b) => b.value > a.value ? b : a) : null;
      return h(Fragment, null,
        h(Card, { i: 2, title: 'P&L by time of day', sub: bestH ? `Best hour: ${bestH.label}` : 'Add entry times to your trades' }, hours.length ? h(BarRows, { signed: true, rows: hours.map(x => ({ ...x, best: x === bestH && x.value > 0, right: h(Fragment, null, x.right, span('row-n', `${x.n}T`)) })) }) : div('dt-none', 'No time data yet.')),
        div('an-2',
          h(Card, { i: 3, title: 'Win rate by day of week', sub: 'Win % and number of closed trades' }, dow.some(d => d.count) ? h(Columns, { cols: dow, height: 210 }) : div('dt-none', 'No data yet.')),
          h(Card, { i: 4, title: 'Trade duration', sub: bestD ? `Best performing hold: ${bestD.label}` : 'Needs entry and exit times' }, dur.length ? h(BarRows, { signed: true, rows: dur.map(d => ({ ...d, best: d === bestD && d.value > 0 })) }) : div('dt-none', 'No duration data yet.'))),
        div('an-2', h(Tile, { i: 5, label: 'Avg hold · winners', value: fmtMins(st.winHold) }), h(Tile, { i: 6, label: 'Avg hold · losers', value: fmtMins(st.lossHold) })));
    }
    if (tab === 'breakdowns') {
      const tbl = (keyFn, order) => { let rows = [...group(list, keyFn).entries()].map(([k, a]) => ({ k, ...agg(a) })); rows = order ? rows.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k)) : rows.sort((a, b) => b.pnl - a.pnl); return rows; };
      const row = r => [r.k, r.wr === null ? '—' : r.wr + '%', r.n, r.rr === null ? '—' : r.rr.toFixed(1) + 'R', h(Pnl, { v: r.closed ? r.pnl : null })];
      const dirs = ['Long', 'Short'].map(d => ({ d, ...agg(list.filter(t => tDir(t) === d)) }));
      return h(Fragment, null,
        div('an-2',
          h(Card, { i: 2, title: 'By instrument', sub: 'How each ticker is performing' }, h(BreakTable, { cols: ['Ticker', 'Win rate', 'Trades', 'Avg R:R', 'Net P&L'], rows: tbl(tSym).map(row), empty: 'No trade data yet.' })),
          h(Card, { i: 3, title: 'By grade', sub: 'Does your grading match the outcomes?' }, h(BreakTable, { cols: ['Grade', 'Win rate', 'Trades', 'Avg R:R', 'Net P&L'], rows: tbl(t => t.grade, ['A+', 'A', 'B+', 'B', 'C']).map(r => [h(GradeTag, { g: r.k }), ...row(r).slice(1)]), empty: 'No graded trades yet.' }))),
        h(Card, { i: 4, title: 'By setup', sub: 'Which setups pay' }, h(BreakTable, { cols: ['Setup', 'Win rate', 'Trades', 'Avg R:R', 'Net P&L'], rows: tbl(t => (t.setupType || '').trim()).map(row), empty: 'Name the setup when you log a trade to see this.' })),
        div('an-2', dirs.map((x, i) => div({ key: x.d, ...rise(5 + i, 'panel an-dir') }, div('an-dir-h', h(DirTag, { dir: x.d }), div('grow'), span('an-sub', `${x.n} ${x.n === 1 ? 'trade' : 'trades'}`)),
          div('an-dir-b', h(Ring, { pct: x.wr || 0, size: 96, stroke: 4, dash: x.d === 'Short' }, span('an-dir-wr tnum', x.wr === null ? '—' : x.wr + '%'), span('wl-l', 'Win rate')),
            div('an-dir-s', div('kv', span('kv-k', 'Net P&L'), h(Pnl, { v: x.closed ? x.pnl : null, className: 'kv-v' })), div('kv', span('kv-k', 'Avg per trade'), h(Pnl, { v: x.avg, className: 'kv-v' })), div('kv', span('kv-k', 'Avg R:R'), span('kv-v tnum', x.rr === null ? '—' : x.rr.toFixed(2)))))))));
    }
    const M = { winRate: ['Win rate %', a => a.filter(t => tPnl(t) > 0).length / a.length * 100, v => Math.round(v) + '%'], pnl: ['P&L ($)', a => a.reduce((s, t) => s + tPnl(t), 0), v => fmtMoney(v, { dec: 0 })], rr: ['Avg R:R', a => { const x = a.map(t => num(t.actualRR)).filter(v => v !== null); return x.length ? x.reduce((p, c) => p + c, 0) / x.length : 0; }, v => v.toFixed(2)], mfe: ['Avg MFE ($)', a => { const x = a.map(t => num(t.mfe)).filter(v => v !== null); return x.length ? x.reduce((p, c) => p + c, 0) / x.length : 0; }, v => fmtMoney(v, { dec: 0, sign: false })], mae: ['Avg MAE ($)', a => { const x = a.map(t => num(t.mae)).filter(v => v !== null); return x.length ? x.reduce((p, c) => p + c, 0) / x.length : 0; }, v => fmtMoney(v, { dec: 0, sign: false })] };
    const [mLabel, mFn, mFmt] = M[metric];
    const roll = closed.length >= win ? closed.slice(win - 1).map((t, i) => ({ v: mFn(closed.slice(i, i + win)), label: fmtDate(t.entryDate, { month: 'short', day: 'numeric' }), sub: `Trade #${i + win} · ${fmtDate(t.entryDate, { month: 'short', day: 'numeric' })}`, t })) : [];
    return h(Fragment, null,
      div({ ...rise(2, 'an-ctl') }, h(Field, { label: 'Metric' }, h(Seg, { small: true, value: metric, onChange: setMetric, options: Object.entries(M).map(([k, v]) => [k, v[0]]) })), h(Field, { label: 'Rolling window' }, h(Seg, { small: true, value: win, onChange: setWin, options: [10, 20, 30, 50].map(n => [n, n + ' trades']) }))),
      h(Card, { i: 3, title: `Rolling ${mLabel}`, sub: `${win}-trade moving window across ${closed.length} closed trades` },
        closed.length < win ? h(Empty, { icon: 'trend', title: `Need ${win} closed trades`, sub: `You have ${closed.length}. ${win - closed.length} more to go, or pick a smaller window.` })
          : roll.length < 2 ? h(Empty, { icon: 'trend', title: 'One more trade', sub: 'The line needs at least two windows to draw.' })
            : h(LineChart, { key: metric + win + range, points: roll, height: 280, fmt: mFmt, zero: metric === 'pnl', area: metric === 'pnl', onPick: p => p.t && UI.openTrade(p.t.id, ids) })),
      div('an-3', h(Tile, { i: 4, label: 'Avg MFE', value: st.avgMFE === null ? '—' : fmtMoney(st.avgMFE), sub: 'Max favourable excursion' }), h(Tile, { i: 5, label: 'Avg MAE', value: st.avgMAE === null ? '—' : fmtMoney(-st.avgMAE), sub: 'Max adverse excursion' }), h(Tile, { i: 6, label: 'MFE / MAE', value: st.mfeMae === null ? '—' : st.mfeMae.toFixed(2), sub: 'Excursion ratio' })));
  };
  return div('page an', div('page-in',
    div({ ...rise(0, 'page-head') }, div(null, h(Label, null, 'Performance, read straight from your trade log'), h('h1', { className: 'page-title' }, 'Analytics')), div('grow'), h(Seg, { value: range, onChange: setRange, options: AN_RANGES })),
    div({ ...rise(1, 'an-tabs') }, h(Seg, { value: tab, onChange: setTab, options: AN_TABS })),
    div({ key: tab + range, className: 'an-body' }, body())));
}
