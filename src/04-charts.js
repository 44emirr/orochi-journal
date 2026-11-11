/* ═══════════════════════════════════════════════════════════
   Charts — white line art that draws itself
   ═══════════════════════════════════════════════════════════ */
function useSize(ref) {
  const [sz, setSz] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const upd = () => setSz(s => { const w = el.clientWidth, hh = el.clientHeight; return s.w === w && s.h === hh ? s : { w, h: hh }; });
    upd();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd); }
    const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect();
  }, []);
  return sz;
}
function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  return out;
}
const shortMoney = v => { const a = Math.abs(v); const s = v < 0 ? MINUS : ''; return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(1)}M` : a >= 10000 ? `${s}$${(a / 1000).toFixed(0)}k` : a >= 1000 ? `${s}$${(a / 1000).toFixed(1)}k` : `${s}$${a % 1 ? a.toFixed(1) : a}`; };

/* points: [{ v, label, sub }]  — a baseline start point is added by the caller when wanted */
function LineChart({ points, height = 240, fmt = shortMoney, tipFmt, zero = true, empty = 'Not enough data yet', onPick, area = true }) {
  const box = useRef(null); const { w } = useSize(box); const [hov, setHov] = useState(null);
  const n = points.length;
  const key = n + ':' + (n ? points[n - 1].v : 0);
  const padL = 54, padR = 18, padT = 16, padB = 26;
  const body = useMemo(() => {
    if (n < 2 || w < 80) return null;
    const vs = points.map(p => p.v); let mn = Math.min(...vs), mx = Math.max(...vs);
    if (zero) { mn = Math.min(mn, 0); mx = Math.max(mx, 0); if (mn < 0 && -mn < (mx - mn) * 0.04) mn = 0; if (mx > 0 && mx < (mx - mn) * 0.04) mx = 0; }
    const ticks = niceTicks(mn, mx, 4); mn = ticks[0]; mx = ticks[ticks.length - 1];
    const iw = w - padL - padR, ih = height - padT - padB;
    const X = i => padL + (n === 1 ? iw / 2 : i / (n - 1) * iw), Y = v => padT + (1 - (v - mn) / (mx - mn || 1)) * ih;
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('');
    const base = Y(zero ? 0 : mn);
    return { ticks, X, Y, d, base, areaD: `${d}L${X(n - 1).toFixed(1)} ${base}L${X(0).toFixed(1)} ${base}Z`, iw, ih };
  }, [key, w, height, zero]);
  if (n < 2) return div({ className: 'chart chart-empty', style: { height }, ref: box },
    h('svg', { width: '100%', height: '100%', preserveAspectRatio: 'none', viewBox: '0 0 100 100' }, h('path', { d: 'M0 62 L100 62', className: 'ch-zero', vectorEffect: 'non-scaling-stroke' })),
    div('chart-empty-t', empty));
  const move = e => {
    if (!body) return; const r = box.current.getBoundingClientRect(); const x = e.clientX - r.left;
    const i = clamp(Math.round((x - padL) / body.iw * (n - 1)), 0, n - 1); setHov(i);
  };
  const tipX = body && hov !== null ? body.X(hov) : 0;
  const last = n - 1;
  return div({ className: 'chart', style: { height }, ref: box, onMouseMove: move, onMouseLeave: () => setHov(null), onClick: () => { if (onPick && hov !== null) onPick(points[hov], hov); } },
    body && h('svg', { key, width: w, height, className: 'ch-svg' },
      h('defs', null, h('linearGradient', { id: 'ch-area', x1: 0, y1: 0, x2: 0, y2: 1 }, h('stop', { offset: '0%', stopColor: '#fff', stopOpacity: .16 }), h('stop', { offset: '100%', stopColor: '#fff', stopOpacity: 0 }))),
      body.ticks.map(t => h('g', { key: t }, h('line', { x1: padL, x2: w - padR, y1: body.Y(t), y2: body.Y(t), className: t === 0 && zero ? 'ch-zero' : 'ch-grid' }), h('text', { x: padL - 10, y: body.Y(t) + 3.5, textAnchor: 'end', className: 'ch-tick' }, fmt(t)))),
      [0, Math.floor(last / 2), last].filter((v, i, a) => a.indexOf(v) === i && points[v].label).map(i => h('text', { key: 'x' + i, x: body.X(i), y: height - 6, textAnchor: i === 0 ? 'start' : i === last ? 'end' : 'middle', className: 'ch-tick' }, points[i].label)),
      area && h('path', { d: body.areaD, fill: 'url(#ch-area)', className: 'ch-area' }),
      h('path', { d: body.d, pathLength: 1, className: 'ch-line draw' }),
      hov === null && h('g', { className: 'ch-tip', style: { transformOrigin: `${body.X(last)}px ${body.Y(points[last].v)}px` } },
        h('circle', { cx: body.X(last), cy: body.Y(points[last].v), r: 9, className: 'ch-pulse' }), h('circle', { cx: body.X(last), cy: body.Y(points[last].v), r: 3.5, className: 'ch-dot' })),
      hov !== null && h('g', null, h('line', { x1: tipX, x2: tipX, y1: padT, y2: height - padB, className: 'ch-cross' }), h('circle', { cx: tipX, cy: body.Y(points[hov].v), r: 4.5, className: 'ch-dot' }))),
    body && hov !== null && div({ className: 'ch-tt', style: { left: clamp(tipX, 80, w - 80), top: Math.max(4, body.Y(points[hov].v) - 58) } },
      div('ch-tt-v tnum', (tipFmt || fmt)(points[hov].v)), points[hov].sub && div('ch-tt-s', points[hov].sub)));
}

/* Trades as candles: body = realised P&L, wicks = MFE / MAE. Hollow = win, filled = loss. */
function CandleStrip({ trades, height = 150, onPick, max = 48 }) {
  const box = useRef(null); const { w } = useSize(box); const [hov, setHov] = useState(null);
  const list = useMemo(() => trades.filter(t => !t.isDraft && t.exitDone && tPnl(t) !== null).sort(byOldest).slice(-max), [trades, max]);
  if (!list.length) return div({ className: 'chart chart-empty', style: { height }, ref: box },
    h('svg', { width: '100%', height: '100%', preserveAspectRatio: 'none', viewBox: '0 0 100 100' }, h('path', { d: 'M0 50 L100 50', className: 'ch-zero', vectorEffect: 'non-scaling-stroke' })),
    div('chart-empty-t', 'Closed trades appear here as candles'));
  const n = list.length, mid = height / 2, pad = 10;
  const sameUnit = t => (t.pnlUnit || '$') === '$';
  const mx = Math.max(1, ...list.map(t => Math.max(Math.abs(tPnl(t)), sameUnit(t) ? (num(t.mfe) || 0) : 0, sameUnit(t) ? (num(t.mae) || 0) : 0)));
  const sc = v => Math.abs(v) / mx * (mid - pad);
  const slot = w ? Math.min(34, (w - 8) / n) : 0, bw = clamp(slot * .46, 3, 12), x0 = w ? (w - slot * n) / 2 : 0;
  return div({ className: 'chart candles', style: { height }, ref: box, onMouseLeave: () => setHov(null) },
    w > 0 && h('svg', { width: w, height, className: 'ch-svg' },
      h('line', { x1: 0, x2: w, y1: mid, y2: mid, className: 'ch-zero' }),
      list.map((t, i) => {
        const p = tPnl(t), cxp = x0 + slot * i + slot / 2, bh = Math.max(3, sc(p)), up = p >= 0;
        const mfe = sameUnit(t) ? num(t.mfe) : null, mae = sameUnit(t) ? num(t.mae) : null;
        const top = mfe ? mid - Math.max(sc(mfe), up ? bh : 0) : (up ? mid - bh : mid), bot = mae ? mid + Math.max(sc(mae), up ? 0 : bh) : (up ? mid : mid + bh);
        return h('g', { key: t.id, className: cx('cd', up ? 'up' : 'dn', hov === i && 'hov', hov !== null && hov !== i && 'dim'), style: { '--i': i, transformOrigin: `${cxp}px ${mid}px` }, onMouseEnter: () => setHov(i), onClick: () => onPick && onPick(t) },
          h('rect', { x: cxp - slot / 2, y: 0, width: slot, height, fill: 'transparent' }),
          (mfe || mae) && h('line', { x1: cxp, x2: cxp, y1: top, y2: bot, className: 'cd-wick' }),
          h('rect', { x: cxp - bw / 2, y: up ? mid - bh : mid, width: bw, height: bh, rx: 1.5, className: 'cd-body' }));
      })),
    hov !== null && list[hov] && div({ className: 'ch-tt', style: { left: clamp(x0 + slot * hov + slot / 2, 90, Math.max(90, w - 90)), top: 0 } },
      div('ch-tt-v tnum', fmtMoney(tPnl(list[hov]), { unit: list[hov].pnlUnit || '$' })), div('ch-tt-s', `${tSym(list[hov])} · ${tDir(list[hov])} · ${fmtDate(list[hov].entryDate, { month: 'short', day: 'numeric' })}`)));
}

/* Horizontal rows: [{ key, label, value (signed or positive), right, sub, best }] */
function BarRows({ rows, signed, className }) {
  const mx = Math.max(1e-9, ...rows.map(r => Math.abs(r.value)));
  return div(cx('rows', signed && 'signed', className), rows.map((r, i) => div({ key: r.key || r.label, ...rise(i, cx('row', signed && (r.value < 0 ? 'neg' : 'pos'), r.best && 'best')) },
    div('row-l', r.label), div('row-track', div({ className: 'row-bar', style: { '--w': Math.max(2, Math.abs(r.value) / mx * 100) + '%' } })),
    div('row-r tnum', r.right), r.sub && div('row-s', r.sub))));
}
function Columns({ cols, height = 150 }) {
  const mx = Math.max(1, ...cols.map(c => c.value || 0));
  return div({ className: 'cols', style: { height } }, cols.map((c, i) => div({ key: c.label, className: cx('col', !c.count && 'nil') },
    div('col-v tnum', c.count ? c.top : '—'), div('col-track', div({ className: 'col-bar', style: { '--h': (c.count ? Math.max(4, c.value / mx * 100) : 0) + '%', '--i': i } })),
    div('col-l', c.label), div('col-s tnum', c.count ? c.count + 'T' : ''))));
}
