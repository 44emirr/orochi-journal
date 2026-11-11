/* ═══════════════════════════════════════════════════════════
   UI primitives: icons, stage, motion helpers, inputs, overlays
   ═══════════════════════════════════════════════════════════ */
const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ICONS = {
  dashboard: 'M4 5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM13 5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zM13 12a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zM4 16a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z',
  log: 'M6 3v3M6 14v4M4 6h4v8H4zM12 6v2M12 16v5M10 8h4v8h-4zM18 2v4M18 12v4M16 6h4v6h-4z',
  prep: circ(12, 12, 8) + circ(12, 12, 3.5) + 'M12 2v3M12 19v3M2 12h3M19 12h3',
  journal: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3v18M3.5 7.5H6M3.5 12H6M3.5 16.5H6M10 8h5M10 12h5',
  review: 'M9 4h6v3H9zM7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M9 14l2 2 4-4',
  analytics: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  settings: 'M4 7h8M18 7h2M4 17h2M12 17h8' + circ(15, 7, 2.4) + circ(9, 17, 2.4),
  search: circ(11, 11, 6) + 'M20 20l-4.5-4.5',
  plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', check: 'M5 12.5l4.5 4.5L19 7.5',
  chevL: 'M14.5 6l-6 6 6 6', chevR: 'M9.5 6l6 6-6 6', chevD: 'M6 9.5l6 6 6-6', chevU: 'M6 14.5l6-6 6 6',
  up: 'M7 17L17 7M9 7h8v8', down: 'M7 7l10 10M17 9v8H9', arrowR: 'M5 12h14M13 6l6 6-6 6',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  image: 'M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5 5 5' + circ(15.5, 9.5, 1.3),
  copy: 'M9 9h10v11H9zM5 15V4h10', undo: 'M8 5L4 9l4 4M4 9h10a5 5 0 0 1 0 10h-3',
  refresh: 'M19 12a7 7 0 1 1-2.2-5.1M19 4v4h-4', filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', clock: circ(12, 12, 8) + 'M12 8v4.5l3 2',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z' + circ(12, 12, 2.6),
  brain: circ(12, 12, 8) + 'M9 10v.5M15 10v.5M9 15c1.5 1.2 4.5 1.2 6 0',
  crosshair: circ(12, 12, 7) + 'M12 2v5M12 17v5M2 12h5M17 12h5',
  lines: 'M5 7h14M5 12h10M5 17h12', bolt: 'M13 3L5 13h6l-1 8 8-10h-6z',
  alert: 'M12 4l9 16H3zM12 10v5M12 17.5v.5',
  target: circ(12, 12, 8) + circ(12, 12, 4) + 'M12 11.5v1',
  bulb: 'M9 17h6M10 20h4M8 13a6 6 0 1 1 8 0c-.7.7-1 1.5-1 2.5H9c0-1-.3-1.8-1-2.5z',
  layers: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
  news: 'M4 5h13v14H5a1 1 0 0 1-1-1zM17 9h3v9a1 1 0 0 1-1 1h-2M8 9h5M8 13h5M8 16h3',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6', bars: 'M5 20V10M10 20V4M15 20v-8M20 20v-5',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14', upload: 'M12 16V5M7 9.5l5-5 5 5M5 20h14',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', info: circ(12, 12, 8) + 'M12 11v5M12 8v.5',
  flame: 'M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10 10 11 8 12 3z',
  heading: 'M6 5v14M18 5v14M6 12h12', bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
  italic: 'M10 5h8M6 19h8M14 5l-4 14', underline: 'M7 4v7a5 5 0 0 0 10 0V4M5 20h14',
  strike: 'M4 12h16M8 7c0-2 2-3 4-3s4 1 4 3M8 17c0 2 2 3 4 3s4-1 4-3',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4',
  kbd: 'M3 7h18v10H3zM7 11h.5M11 11h.5M15 11h.5M8 14h8',
  user: circ(12, 8, 3.5) + 'M5 20c1-4 4-6 7-6s6 2 7 6',
  database: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3v12c0 1.7-3.1 3-7 3s-7-1.3-7-3zM5 6c0 1.7 3.1 3 7 3s7-1.3 7-3M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  wave: 'M3 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0',
  dot: circ(12, 12, 3),
};
const Icon = ({ n, s = 18, w = 1.6, className }) => h('svg', { className: cx('ic', className), width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: ICONS[n] || ICONS.dot }));

/* ── Motion helpers ── */
const motionOn = () => S.settings.motion !== false && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const rise = (i = 0, cls) => ({ className: cx('rise', cls), style: { '--i': i } });
const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

function CountUp({ value, format = v => String(Math.round(v)), dur = 1100, className }) {
  const ref = useRef(null); const from = useRef(0); const raf = useRef(0);
  const fmt = useRef(format); fmt.current = format;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const to = Number(value) || 0;
    if (value === null || value === undefined || !isFinite(Number(value))) { el.textContent = fmt.current(value); from.current = 0; return; }
    if (!motionOn()) { el.textContent = fmt.current(to); from.current = to; return; }
    const a = from.current, t0 = performance.now();
    const step = now => {
      const k = easeOutExpo(clamp((now - t0) / dur, 0, 1));
      el.textContent = fmt.current(a + (to - a) * k);
      if (k < 1) raf.current = requestAnimationFrame(step); else from.current = to;
    };
    cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf.current); from.current = to; };
  }, [value, dur]);
  return h('span', { ref, className: cx('tnum', className) }, format(value === null || value === undefined ? value : 0));
}

function useKey(fn, deps = []) {
  useEffect(() => { const hnd = e => fn(e); document.addEventListener('keydown', hnd); return () => document.removeEventListener('keydown', hnd); }, deps);
}
function useOutside(ref, fn, on = true) {
  useEffect(() => {
    if (!on) return;
    const hnd = e => { if (ref.current && !ref.current.contains(e.target)) fn(e); };
    const t = setTimeout(() => document.addEventListener('mousedown', hnd), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', hnd); };
  }, [on]);
}
const isTyping = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
/* One Escape stack for every overlay: only the top layer reacts. */
const layers = [];
function useEscLayer(fn, on = true) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!on) return;
    const L = { fn: () => ref.current() }; layers.push(L);
    return () => { const i = layers.indexOf(L); if (i >= 0) layers.splice(i, 1); };
  }, [on]);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && layers.length) { e.preventDefault(); e.stopPropagation(); layers[layers.length - 1].fn(); }
}, true);
const pasteOwners = [];

/* ── Small pieces ── */
const Label = ({ children, className }) => div(cx('lbl', className), children);
const Kbd = ({ children }) => h('kbd', { className: 'kbd' }, children);
const Btn = ({ icon, children, kind, className, ...p }) => h('button', { type: 'button', className: cx('btn', kind, className), ...p }, icon && h(Icon, { n: icon, s: 14 }), children);
const IconBtn = ({ n, tip, className, s = 16, ...p }) => h('button', { type: 'button', className: cx('ibtn', className), 'data-tip': tip, 'aria-label': tip, ...p }, h(Icon, { n, s }));
const Chip = ({ on, children, className, ...p }) => h('button', { type: 'button', className: cx('chip', on && 'on', className), 'aria-pressed': !!on, ...p }, children);
const Empty = ({ icon = 'dot', title, sub, children }) => div('empty', div('empty-ic', h(Icon, { n: icon, s: 26, w: 1.3 })), div('empty-t', title), sub && div('empty-s', sub), children);
const Pnl = ({ v, unit = '$', dec = 2, className }) => v === null || v === undefined ? span(cx('pnl nil', className), '—') : span(cx('pnl tnum', v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat', className), fmtMoney(v, { unit, dec }));
const DirTag = ({ dir, small }) => span(cx('dir', dir === 'Short' ? 'short' : 'long', small && 'sm'), h(Icon, { n: dir === 'Short' ? 'down' : 'up', s: small ? 11 : 12, w: 2 }), dir);
const StateTag = ({ state }) => span(cx('state', 's-' + state.toLowerCase().replace(/\s+/g, '-')), state);
const GradeTag = ({ g }) => g ? span(cx('grade', 'g-' + g.replace('+', 'p').toLowerCase()), g) : null;

function Seg({ value, onChange, options, className, small }) {
  const wrap = useRef(null); const [thumb, setThumb] = useState(null);
  const measure = () => { const w = wrap.current; if (!w) return; const el = w.querySelector('[data-on="1"]'); if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth }); else setThumb(null); };
  useLayoutEffect(measure, [value, options.length]);
  useEffect(() => { const t = setTimeout(measure, 350); window.addEventListener('resize', measure); return () => { clearTimeout(t); window.removeEventListener('resize', measure); }; }, []);
  return div({ className: cx('seg', small && 'sm', className), ref: wrap, role: 'tablist' },
    thumb && div({ className: 'seg-thumb', style: { transform: `translateX(${thumb.left}px)`, width: thumb.width } }),
    options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return h('button', { key: v, type: 'button', role: 'tab', 'aria-selected': v === value, 'data-on': v === value ? '1' : '0', className: cx('seg-b', v === value && 'on'), onClick: () => onChange(v) }, l); }));
}

function Ring({ pct, size = 120, stroke = 6, children, className, dash }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setP(clamp(pct || 0, 0, 100))); return () => cancelAnimationFrame(t); }, [pct]);
  return div({ className: cx('ring', className), style: { width: size, height: size } },
    h('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
      h('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', className: 'ring-bg', strokeWidth: stroke, strokeDasharray: dash ? '2 7' : undefined }),
      h('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', className: 'ring-fg', strokeWidth: stroke, strokeLinecap: 'round', strokeDasharray: c, strokeDashoffset: c * (1 - p / 100), transform: `rotate(-90 ${size / 2} ${size / 2})` })),
    div('ring-in', children));
}

/* ── Overlays ── */
const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);
function useClosing(onClose, ms = 200) {
  const [out, setOut] = useState(false); const done = useRef(false);
  const close = useCallback(() => { if (done.current) return; done.current = true; setOut(true); setTimeout(onClose, motionOn() ? ms : 0); }, [onClose]);
  return [out, close];
}
function Modal({ onClose, className, children, wide, noEsc }) {
  const [out, close] = useClosing(onClose);
  const box = useRef(null);
  const prevFocus = useRef(undefined); if (prevFocus.current === undefined) prevFocus.current = document.activeElement || null;
  useEscLayer(() => { if (!noEsc) close(); });
  useEffect(() => {
    const f = box.current && box.current.querySelector('[autofocus],input,textarea,button');
    if (f && !box.current.contains(document.activeElement)) f.focus({ preventScroll: true });
    /* keep Tab inside the dialog */
    const trap = e => {
      if (e.key !== 'Tab' || !box.current || layers.length === 0) return;
      const els = [...box.current.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
      if (!els.length || !box.current.contains(document.activeElement)) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); const prev = prevFocus.current; if (prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true }); };
  }, []);
  return h(Portal, null, div({ className: cx('ov', out && 'out'), onMouseDown: e => { if (e.target === e.currentTarget) close(); } },
    div({ className: cx('modal', wide && 'wide', className), ref: box, role: 'dialog', 'aria-modal': true }, typeof children === 'function' ? children(close) : children)));
}

const dialogBus = new Set();
function confirmDialog(o) { return new Promise(res => dialogBus.forEach(fn => fn({ ...o, res }))); }
function DialogHost() {
  const [d, setD] = useState(null);
  useEffect(() => { const fn = x => setD(x); dialogBus.add(fn); return () => dialogBus.delete(fn); }, []);
  if (!d) return null;
  const done = v => { d.res(v); setD(null); };
  return h(Modal, { key: 'dlg', onClose: () => done(false), className: 'dlg' }, close => h(Fragment, null,
    div('dlg-t', d.title), d.body && div('dlg-b', d.body),
    div('dlg-a', (d.extra || []).map(x => h(Btn, { key: x.label, onClick: () => done(x.value) }, x.label)),
      h(Btn, { autoFocus: !!d.danger, onClick: () => done(false) }, d.cancel || 'Cancel'),
      h(Btn, { kind: d.danger ? 'danger' : 'solid', autoFocus: !d.danger, onClick: () => done(true) }, d.ok || 'Confirm'))));
}
function ToastHost() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const fn = t => { setList(l => [...l.slice(-3), t]); setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), t.duration || (t.action ? 6000 : 3200)); };
    toastSubs.add(fn); return () => toastSubs.delete(fn);
  }, []);
  return h(Portal, null, div({ className: 'toasts', 'aria-live': 'polite' }, list.map(t => div({ key: t.id, className: cx('toast', t.kind) },
    span('toast-dot'), span('toast-m', t.msg),
    t.action && h('button', { className: 'toast-a', onClick: () => { t.onAction && t.onAction(); setList(l => l.filter(x => x.id !== t.id)); } }, t.action)))));
}

const lightBus = new Set();
const openLightbox = (ids, index = 0) => lightBus.forEach(fn => fn({ ids, index }));
function LightboxHost() {
  const [st, setSt] = useState(null);
  useEffect(() => { const fn = x => setSt(x); lightBus.add(fn); return () => lightBus.delete(fn); }, []);
  const src = useImg(st ? st.ids[st.index] : null, false);
  useEscLayer(() => setSt(null), !!st);
  useEffect(() => {
    if (!st) return;
    const hnd = e => {
      if (e.key === 'ArrowRight') { e.stopPropagation(); if (st.index < st.ids.length - 1) setSt({ ...st, index: st.index + 1 }); }
      if (e.key === 'ArrowLeft') { e.stopPropagation(); if (st.index > 0) setSt({ ...st, index: st.index - 1 }); }
    };
    document.addEventListener('keydown', hnd, true); return () => document.removeEventListener('keydown', hnd, true);
  }, [st]);
  if (!st) return null;
  return h(Portal, null, div({ className: 'lightbox', onClick: () => setSt(null) },
    src ? h('img', { src, alt: 'Chart screenshot', onClick: e => e.stopPropagation() }) : div('lb-load', 'Loading…'),
    div({ className: 'lb-bar', onClick: e => e.stopPropagation() },
      st.ids.length > 1 && h(IconBtn, { n: 'chevL', tip: 'Previous', disabled: st.index === 0, onClick: () => setSt({ ...st, index: st.index - 1 }) }),
      st.ids.length > 1 && span('lb-n tnum', `${st.index + 1} / ${st.ids.length}`),
      st.ids.length > 1 && h(IconBtn, { n: 'chevR', tip: 'Next', disabled: st.index === st.ids.length - 1, onClick: () => setSt({ ...st, index: st.index + 1 }) }),
      h(Btn, { icon: 'x', onClick: () => setSt(null) }, 'Close'))));
}

function Popover({ anchor, onClose, children, className, width = 280, align = 'left' }) {
  const ref = useRef(null); const [pos, setPos] = useState(null);
  useOutside(ref, onClose);
  useLayoutEffect(() => {
    const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor; if (!r) return;
    const hh = ref.current ? ref.current.offsetHeight : 320;
    let left = align === 'right' ? r.right - width : r.left; left = clamp(left, 12, window.innerWidth - width - 12);
    let top = r.bottom + 8; if (top + hh > window.innerHeight - 12) top = Math.max(12, r.top - hh - 8);
    setPos({ left, top });
  }, []);
  useEscLayer(onClose);
  return h(Portal, null, div({ ref, className: cx('pop', className), style: { width, left: pos ? pos.left : -9999, top: pos ? pos.top : -9999, visibility: pos ? 'visible' : 'hidden' } }, children));
}

/* ── Date / time / number fields ── */
function Calendar({ value, onChange, marks }) {
  const init = isYmd(value) ? parseYmd(value) : new Date();
  const [ym, setYm] = useState([init.getFullYear(), init.getMonth()]);
  const [y, m] = ym; const first = (new Date(y, m, 1).getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const td = today();
  const move = d => { const x = new Date(y, m + d, 1); setYm([x.getFullYear(), x.getMonth()]); };
  return div('cal',
    div('cal-h', h(IconBtn, { n: 'chevL', tip: 'Previous month', onClick: () => move(-1) }), div('cal-m', new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })), h(IconBtn, { n: 'chevR', tip: 'Next month', onClick: () => move(1) })),
    div('cal-g', ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => div({ key: 'h' + i, className: 'cal-w' }, d)),
      cells.map((d, i) => { if (!d) return div({ key: 'e' + i }); const s = `${y}-${pad2(m + 1)}-${pad2(d)}`; return h('button', { key: s, type: 'button', className: cx('cal-d', s === value && 'on', s === td && 'today', marks && marks.has(s) && 'mark'), onClick: () => onChange(s) }, d); })),
    div('cal-f', h('button', { type: 'button', className: 'link', onClick: () => onChange(td) }, 'Today')));
}
function DateField({ value, onChange, marks, placeholder = 'Select date', className, clearable }) {
  const [open, setOpen] = useState(false); const ref = useRef(null);
  return h(Fragment, null,
    h('button', { type: 'button', ref, className: cx('field-btn', className, !value && 'ph'), onClick: () => setOpen(o => !o) }, h(Icon, { n: 'calendar', s: 14 }), span(null, value ? fmtDate(value, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : placeholder),
      clearable && value ? h('span', { className: 'field-x', role: 'button', 'aria-label': 'Clear date', onClick: e => { e.stopPropagation(); onChange(''); } }, h(Icon, { n: 'x', s: 12 })) : null),
    open && h(Popover, { anchor: ref.current, onClose: () => setOpen(false), width: 272 }, h(Calendar, { value, marks, onChange: v => { onChange(v); setOpen(false); } })));
}
function TimeField({ value, onChange }) {
  return div('time-f', h('input', { type: 'time', className: 'inp', value: value || '', onChange: e => onChange(e.target.value) }), h('button', { type: 'button', className: 'mini', onClick: () => onChange(nowHM()) }, 'Now'));
}
function NumField({ value, onChange, neg, placeholder, className, prefix, big, ...p }) {
  /* Sanitise instead of rejecting, so pasting "$1,250.50" or "−150" still lands as a clean number. */
  const clean = raw => {
    let v = String(raw).replace(/−/g, '-').replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const minus = neg && /^\s*[-(]/.test(v);
    v = v.replace(/[^\d.]/g, '');
    const i = v.indexOf('.'); if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '');
    return (minus ? '-' : '') + v;
  };
  return div(cx('num-f', big && 'big', className), prefix && span('num-p', prefix),
    h('input', { className: 'inp', inputMode: 'decimal', autoComplete: 'off', placeholder, value: value === null || value === undefined ? '' : value, onChange: e => onChange(clean(e.target.value)), ...p }));
}
const Field = ({ label, req, hint, children, className }) => div(cx('field', className), label && div('field-l', label, req && span('req', '*'), hint && span('field-h', hint)), children);

/* ── Instrument picker ── */
function InstrumentModal({ value, onChange, onClose }) {
  const pairs = useS('pairs'); const [q, setQ] = useState(''); const [custom, setCustom] = useState('');
  const f = arr => q ? arr.filter(i => i.toLowerCase().includes(q.toLowerCase())) : arr;
  const groups = [
    ...(!q && pairs.recent.length ? [{ group: 'Recent', items: pairs.recent }] : []),
    ...INSTRUMENTS.map(g => ({ ...g, items: f(g.items) })),
    { group: 'Custom', items: f(pairs.custom), custom: true },
  ].filter(g => g.items.length);
  const flat = groups.flatMap(g => g.items.map(i => g.group + '|' + i));
  const [cur, setCur] = useState(0);
  useEffect(() => setCur(0), [q]);
  const typed = q.trim().toUpperCase();
  const exact = typed && [...INSTRUMENTS.flatMap(g => g.items), ...pairs.custom].some(i => i.toUpperCase() === typed);
  return h(Modal, { onClose, className: 'inst' }, close => {
    const pick = v => { onChange(v); Act.touchPair(v); close(); };
    const addCustom = (use) => { const s = (custom || q).trim().toUpperCase(); if (!s) return; Act.addCustomPair(s); setCustom(''); if (use) pick(s); };
    return h(Fragment, null,
      div('inst-s', h(Icon, { n: 'search', s: 16 }), h('input', {
        autoFocus: true, placeholder: 'Search instruments…', value: q, onChange: e => setQ(e.target.value),
        onKeyDown: e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setCur(c => Math.min(flat.length - 1, c + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setCur(c => Math.max(0, c - 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); if (flat[cur]) pick(flat[cur].split('|')[1]); else if (typed) { Act.addCustomPair(typed); pick(typed); } }
        },
      }), h(Kbd, null, 'Esc')),
      div('inst-l',
        groups.map(g => div({ key: g.group, className: 'inst-g' }, h(Label, null, g.group),
          div('inst-grid', g.items.map(i => { const k = g.group + '|' + i; return div({ key: k, className: cx('inst-i', value === i && 'sel', flat[cur] === k && 'cur'), onClick: () => pick(i), onMouseEnter: () => setCur(flat.indexOf(k)) }, span(null, i),
            g.custom ? h('button', { type: 'button', className: 'inst-x', 'aria-label': 'Remove ' + i, onClick: e => { e.stopPropagation(); Act.delCustomPair(i); } }, h(Icon, { n: 'x', s: 11 })) : value === i ? h(Icon, { n: 'check', s: 13 }) : null); })))),
        !groups.length && div('inst-none', typed ? h(Fragment, null, 'No match. Press ', h(Kbd, null, 'Enter'), ` to add ${typed} as a custom instrument.`) : 'Nothing here yet.'),
        q && !exact && groups.length > 0 && div('inst-none', h('button', { className: 'link', onClick: () => { Act.addCustomPair(typed); pick(typed); } }, `Use “${typed}” as a custom instrument`))),
      div('inst-c', h('input', { className: 'inp', placeholder: 'Custom symbol, e.g. MNQH6, PLTR…', value: custom, onChange: e => setCustom(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && custom.trim()) { e.preventDefault(); addCustom(true); } } }),
        h(Btn, { disabled: !custom.trim(), onClick: () => addCustom(false) }, 'Save'), h(Btn, { kind: 'solid', disabled: !custom.trim(), onClick: () => addCustom(true) }, 'Use')));
  });
}
function InstrumentField({ value, onChange, big, className, placeholder = 'Select instrument' }) {
  const [open, setOpen] = useState(false);
  return h(Fragment, null,
    h('button', { type: 'button', className: cx('field-btn inst-btn', big && 'big', !value && 'ph', className), onClick: () => setOpen(true) }, h(Icon, { n: 'layers', s: big ? 18 : 14 }), span(null, value || placeholder), h(Icon, { n: 'chevD', s: 12, className: 'dim' })),
    open && h(InstrumentModal, { value, onChange, onClose: () => setOpen(false) }));
}

/* ── Rich text: plain textarea with a live-highlight layer (no contentEditable) ── */
const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const INLINE_RE = /(\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|(?<![A-Za-z0-9_])_(?!_)(.+?)_(?![A-Za-z0-9_]))/g;
function rtHighlight(text) {
  return text.split('\n').map(line => {
    const m = /^(#{1,3} )(.*)$/.exec(line);
    if (m) return `<span class="rt-m">${m[1]}</span><span class="rt-h">${escHtml(m[2])}</span>`;
    return escHtml(line).replace(/(\*\*|__|~~)(.+?)\1/g, (_, a, b) => `<span class="rt-m">${a}</span><span class="rt-b">${b}</span><span class="rt-m">${a}</span>`);
  }).join('\n') + '\n ';
}
function inlineNodes(text, kp = 'i') {
  const out = []; let last = 0, m, i = 0; INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = kp + (i++);
    if (m[2] !== undefined) out.push(h('strong', { key: k }, m[2]));
    else if (m[3] !== undefined) out.push(h('u', { key: k }, m[3]));
    else if (m[4] !== undefined) out.push(h('s', { key: k }, m[4]));
    else out.push(h('em', { key: k }, m[5]));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function RichView({ text, className }) {
  if (!text || !String(text).trim()) return null;
  return div(cx('rv', className), String(text).split('\n').map((line, i) => {
    if (line.startsWith('### ')) return div({ key: i, className: 'rv-h3' }, line.slice(4));
    if (line.startsWith('## ')) return div({ key: i, className: 'rv-h2' }, line.slice(3));
    if (line.startsWith('# ')) return div({ key: i, className: 'rv-h1' }, line.slice(2));
    if (/^\s*[-•] /.test(line)) return div({ key: i, className: 'rv-li' }, inlineNodes(line.replace(/^\s*[-•] /, ''), 'l' + i));
    if (!line.trim()) return div({ key: i, className: 'rv-sp' });
    return div({ key: i, className: 'rv-p' }, inlineNodes(line, 'p' + i));
  }));
}
function RichText({ value, onChange, placeholder, minRows = 6, templates, tplKind, autoFocus }) {
  const ta = useRef(null); const hl = useRef(null); const [tplOpen, setTplOpen] = useState(false); const tplBtn = useRef(null);
  const v = value || '';
  const grow = () => { const el = ta.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, minRows * 24 + 28) + 'px'; };
  useLayoutEffect(grow, [v]);
  useEffect(() => { window.addEventListener('resize', grow); return () => window.removeEventListener('resize', grow); }, []);
  /* Selection is restored right after React writes the new text, not on a later frame, so it can never steal focus from something opened in between. */
  const pendSel = useRef(null);
  useLayoutEffect(() => { if (!pendSel.current) return; const [a, b] = pendSel.current; pendSel.current = null; const el = ta.current; if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(a, b); } catch (e) {} } });
  const apply = (next, a, b) => { pendSel.current = [a, b]; onChange(next); };
  const wrap = mark => {
    const el = ta.current; if (!el) return; const a = el.selectionStart, b = el.selectionEnd; const sel = v.slice(a, b);
    if (sel.startsWith(mark) && sel.endsWith(mark) && sel.length >= mark.length * 2) return apply(v.slice(0, a) + sel.slice(mark.length, -mark.length) + v.slice(b), a, b - mark.length * 2);
    if (v.slice(a - mark.length, a) === mark && v.slice(b, b + mark.length) === mark) return apply(v.slice(0, a - mark.length) + sel + v.slice(b + mark.length), a - mark.length, b - mark.length);
    apply(v.slice(0, a) + mark + (sel || 'text') + mark + v.slice(b), a + mark.length, a + mark.length + (sel || 'text').length);
  };
  const heading = () => {
    const el = ta.current; if (!el) return; const a = el.selectionStart; const ls = v.lastIndexOf('\n', a - 1) + 1; let le = v.indexOf('\n', a); if (le < 0) le = v.length;
    const line = v.slice(ls, le); const m = /^#{1,3} /.exec(line);
    const nl = m ? line.slice(m[0].length) : '## ' + line; const d = nl.length - line.length;
    apply(v.slice(0, ls) + nl + v.slice(le), Math.max(ls, a + d), Math.max(ls, a + d));
  };
  const onKey = e => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); wrap('**'); } else if (k === 'i') { e.preventDefault(); wrap('_'); } else if (k === 'u') { e.preventDefault(); wrap('__'); }
    }
  };
  const all = [...(templates || []), ...((S.templates[tplKind] || []).map((t, i) => ({ ...t, customIndex: i })))];
  const useTpl = async t => { setTplOpen(false); if (v.trim() && !(await confirmDialog({ title: 'Replace what you wrote?', body: 'The template will replace the current text in this box.', ok: 'Replace' }))) return; apply(t.body, t.body.length, t.body.length); };
  return div('rt',
    div('rt-bar',
      [['heading', 'Heading', heading], ['bold', 'Bold (Ctrl+B)', () => wrap('**')], ['italic', 'Italic (Ctrl+I)', () => wrap('_')], ['underline', 'Underline (Ctrl+U)', () => wrap('__')], ['strike', 'Strikethrough', () => wrap('~~')]].map(([n, tip, fn]) => h(IconBtn, { key: n, n, tip, s: 14, onMouseDown: e => e.preventDefault(), onClick: fn })),
      div('grow'),
      tplKind && h('button', { type: 'button', ref: tplBtn, className: 'mini tpl', onClick: () => setTplOpen(o => !o) }, h(Icon, { n: 'sparkle', s: 12 }), 'Template')),
    div('rt-body', h('pre', { className: 'rt-hl', ref: hl, 'aria-hidden': true, dangerouslySetInnerHTML: { __html: rtHighlight(v) } }),
      h('textarea', { ref: ta, className: 'rt-ta', value: v, placeholder, spellCheck: true, autoFocus, onChange: e => onChange(e.target.value), onKeyDown: onKey, onScroll: e => { if (hl.current) hl.current.scrollTop = e.target.scrollTop; } })),
    tplOpen && h(Popover, { anchor: tplBtn.current, onClose: () => setTplOpen(false), width: 320, align: 'right', className: 'tpl-pop' },
      h(Label, null, 'Templates'),
      all.map((t, i) => div({ key: i, className: 'tpl-i', onClick: () => useTpl(t) }, div('tpl-n', t.name), div('tpl-p', t.body.replace(/[#*_~]/g, '').split('\n').filter(Boolean)[0] || ''),
        t.customIndex !== undefined && h('button', { type: 'button', className: 'inst-x', 'aria-label': 'Delete template', onClick: e => { e.stopPropagation(); Act.delTemplate(tplKind, t.customIndex); setTplOpen(false); } }, h(Icon, { n: 'x', s: 11 })))),
      h('button', { type: 'button', className: 'tpl-save', disabled: !v.trim(), onClick: async () => { setTplOpen(false); const name = await promptDialog({ title: 'Save as template', placeholder: 'Template name' }); if (name) { Act.addTemplate(tplKind, { name, body: v }); toast('Template saved'); } } }, h(Icon, { n: 'plus', s: 12 }), 'Save current text as a template')));
}
const promptBus = new Set();
function promptDialog(o) { return new Promise(res => promptBus.forEach(fn => fn({ ...o, res }))); }
function PromptHost() {
  const [d, setD] = useState(null); const [v, setV] = useState('');
  useEffect(() => { const fn = x => { setV(x.value || ''); setD(x); }; promptBus.add(fn); return () => promptBus.delete(fn); }, []);
  if (!d) return null;
  const done = val => { d.res(val); setD(null); };
  return h(Modal, { onClose: () => done(null), className: 'dlg' }, h(Fragment, null, div('dlg-t', d.title), d.body && div('dlg-b', d.body),
    h('input', { className: 'inp dlg-i', autoFocus: true, value: v, placeholder: d.placeholder, onChange: e => setV(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && v.trim()) done(v.trim()); } }),
    div('dlg-a', h(Btn, { onClick: () => done(null) }, 'Cancel'), h(Btn, { kind: 'solid', disabled: !v.trim(), onClick: () => done(v.trim()) }, d.ok || 'Save'))));
}

/* ── Images ── */
function Thumb({ id, onClick, className, alt = 'Chart screenshot' }) {
  const src = useImg(id, true);
  return div({ className: cx('thumb', className, !src && 'loading'), onClick }, src && h('img', { src, alt, loading: 'lazy', draggable: false }));
}
function FullImg({ id, onClick, className }) {
  const src = useImg(id, false);
  return div({ className: cx('fullimg', className, !src && 'loading'), onClick }, src && h('img', { src, alt: 'Chart screenshot', draggable: false }));
}
async function addImageFiles(files) {
  const ids = [];
  for (const f of Array.from(files || [])) { if (!f || !f.type || !f.type.startsWith('image/')) continue; try { ids.push(await Img.putFile(f)); } catch (e) { toast('That image could not be added. If this keeps happening, export a backup and check your free disk space.', { kind: 'warn', duration: 7000 }); } }
  return ids;
}
const pickImages = () => new Promise(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.onchange = async () => res(await addImageFiles(inp.files)); inp.click(); });
function ImageDrop({ ids, onChange, paste = true, compact }) {
  const [drag, setDrag] = useState(false); const [busy, setBusy] = useState(false);
  const cur = useRef(ids); cur.current = ids || [];
  const add = async files => { setBusy(true); const n = await addImageFiles(files); setBusy(false); if (n.length) onChange([...cur.current, ...n]); };
  useEffect(() => {
    if (!paste) return;
    const me = {}; pasteOwners.push(me);
    const hnd = e => { if (pasteOwners[pasteOwners.length - 1] !== me) return; const items = e.clipboardData && e.clipboardData.items; if (!items) return; const imgs = Array.from(items).filter(i => i.kind === 'file' && i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean); if (imgs.length) { e.preventDefault(); add(imgs); } };
    document.addEventListener('paste', hnd);
    return () => { document.removeEventListener('paste', hnd); const i = pasteOwners.indexOf(me); if (i >= 0) pasteOwners.splice(i, 1); };
  }, [paste]);
  const list = ids || [];
  return div({ className: cx('imgdrop', drag && 'drag', compact && 'compact', list.length ? 'has' : 'none'), onDragOver: e => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false), onDrop: e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); } },
    list.map((id, i) => div({ key: id + ':' + i, className: 'imgdrop-i' }, h(Thumb, { id, onClick: () => openLightbox(list, i) }),
      h('button', { type: 'button', className: 'imgdrop-x', 'aria-label': 'Remove chart', onClick: () => onChange(list.filter((_, j) => j !== i)) }, h(Icon, { n: 'x', s: 12 })))),
    h('button', { type: 'button', className: 'imgdrop-add', onClick: async () => { const n = await pickImages(); if (n.length) onChange([...cur.current, ...n]); } },
      h(Icon, { n: 'image', s: list.length ? 18 : 24, w: 1.3 }), div('imgdrop-t', busy ? 'Adding…' : list.length ? 'Add chart' : 'Paste, drop, or click to add chart screenshots'), !list.length && div('imgdrop-s', 'Ctrl+V works anywhere on this screen')));
}

/* ── Background stage: dot grid, drifting particles, cursor light, vignette ── */
const Stage = (() => {
  let cv, g, w = 0, hgt = 0, dpr = 1, grid = null, raf = 0, last = 0, mx = 0.5, my = 0.4, tx = 0.5, ty = 0.4, pts = [], running = false;
  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; hgt = window.innerHeight;
    cv.width = w * dpr; cv.height = hgt * dpr; cv.style.width = w + 'px'; cv.style.height = hgt + 'px';
    grid = document.createElement('canvas'); const pad = 60; grid.width = (w + pad * 2) * dpr; grid.height = (hgt + pad * 2) * dpr;
    const c = grid.getContext('2d'); c.scale(dpr, dpr); c.fillStyle = 'rgba(255,255,255,.085)';
    for (let x = 0; x < w + pad * 2; x += 44) for (let y = 0; y < hgt + pad * 2; y += 44) { c.beginPath(); c.arc(x + .5, y + .5, .8, 0, 6.3); c.fill(); }
    const n = Math.round(clamp(w * hgt / 60000, 14, 44));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * hgt, r: .5 + Math.random() * 1.1, vx: (Math.random() - .3) * 4, vy: -(1.5 + Math.random() * 5), ph: Math.random() * 6.28, a: .12 + Math.random() * .3 }));
  };
  const frame = now => {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, w, hgt);
    let rg = g.createRadialGradient(w * .5, hgt * .42, 0, w * .5, hgt * .42, Math.max(w, hgt) * .7);
    rg.addColorStop(0, 'rgba(255,255,255,.055)'); rg.addColorStop(.5, 'rgba(255,255,255,.015)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, hgt);
    g.drawImage(grid, -60 + (mx - .5) * -14, -60 + (my - .5) * -14, w + 120, hgt + 120);
    rg = g.createRadialGradient(mx * w, my * hgt, 0, mx * w, my * hgt, 420);
    rg.addColorStop(0, 'rgba(255,255,255,.05)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, hgt);
    for (const p of pts) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt * .8;
      if (p.y < -5) { p.y = hgt + 5; p.x = Math.random() * w; } if (p.x > w + 5) p.x = -5; if (p.x < -5) p.x = w + 5;
      g.globalAlpha = p.a * (.55 + .45 * Math.sin(p.ph)); g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill();
    }
    g.globalAlpha = 1;
    rg = g.createRadialGradient(w * .5, hgt * .5, Math.min(w, hgt) * .35, w * .5, hgt * .5, Math.max(w, hgt) * .8);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.72)');
    g.fillStyle = rg; g.fillRect(0, 0, w, hgt);
  };
  const loop = now => { if (!running) return; if (now - last >= 30) frame(now); raf = requestAnimationFrame(loop); };
  const sync = () => {
    const want = motionOn() && !document.hidden;
    if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!want && running) { running = false; cancelAnimationFrame(raf); }
    if (!want) frame(performance.now());
  };
  return {
    init() {
      cv = document.getElementById('stage'); if (!cv) return; g = cv.getContext('2d'); build();
      let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); frame(performance.now()); }, 120); });
      window.addEventListener('mousemove', e => { tx = e.clientX / w; ty = e.clientY / hgt; }, { passive: true });
      document.addEventListener('visibilitychange', sync);
      sync();
    },
    sync,
  };
})();
