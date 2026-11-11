/* ═══════════════════════════════════════════════════════════
   OROCHI JOURNAL v2 — core: helpers, storage, state, stats
   ═══════════════════════════════════════════════════════════ */
const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment } = React;
const h = React.createElement;
const cx = (...a) => a.filter(Boolean).join(' ');

/* tag('div')('class names', ...children)  |  tag('div')({props}, ...children)
   A string first argument is ALWAYS the className. Use null for "no props". */
const tag = t => (a, ...k) => {
  if (typeof a === 'string') return h(t, { className: a }, ...k);
  if (a && typeof a === 'object' && !Array.isArray(a) && !React.isValidElement(a)) return h(t, a, ...k);
  return a == null ? h(t, null, ...k) : h(t, null, a, ...k);
};
const div = tag('div'), span = tag('span'), btn = tag('button'), para = tag('p');

/* ── Dates (always LOCAL — the old journal used UTC and flipped days in the evening) ── */
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => ymd(new Date());
const isYmd = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const nowHM = () => { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const mondayOf = s => { const d = parseYmd(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); };
const monthKey = s => s.slice(0, 7);
const fmtDate = (s, opts) => isYmd(s) ? parseYmd(s).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtDay = s => fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric' });
const fmtTime = ts => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const fmtHM = hm => { if (!hm || !/^\d{1,2}:\d{2}/.test(hm)) return ''; const [H, M] = hm.split(':').map(Number); return `${((H + 11) % 12) + 1}:${pad2(M)} ${H < 12 ? 'AM' : 'PM'}`; };
const toYmd = v => { if (!v) return null; if (isYmd(v)) return v; const d = new Date(v); return isNaN(d) ? null : ymd(d); };

/* ── Numbers ── */
const num = v => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v);
const MINUS = '−';
const fmtNum = (n, dec = 2) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtMoney = (n, o = {}) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const { sign = true, dec = 2, unit = '$' } = o;
  const s = n < 0 ? MINUS : (sign && n > 0 ? '+' : '');
  return unit === '%' ? `${s}${fmtNum(n, dec)}%` : `${s}$${fmtNum(n, dec)}`;
};
const fmtR = (r, dec = 2) => r === null || r === undefined || isNaN(r) ? '—' : `${r < 0 ? MINUS : r > 0 ? '+' : ''}${Math.abs(r).toFixed(dec)}R`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
const fmtMins = m => m === null ? '—' : m < 60 ? `${Math.round(m)}m` : m < 1440 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;

/* ── Constants carried over from the original journal ── */
const GRADES = [
  { id: 'A+', desc: 'Shift + Narrative + Multi-confluence' },
  { id: 'B+', desc: 'Inline with condition, strong setup' },
  { id: 'C', desc: 'Against condition' },
];
const OUTCOMES = ['Full TP', 'Partial Win', 'Breakeven', 'Stopped Out'];
const MISTAKES = [
  { id: 'fomo', label: 'FOMO Entry', desc: 'Chased price after move' },
  { id: 'early', label: 'Early Entry', desc: 'Entered before confirmation' },
  { id: 'no_confirm', label: 'No Confirmation', desc: 'Skipped entry trigger' },
  { id: 'exit_early', label: 'Exited Early', desc: 'Closed before target' },
  { id: 'bad_risk', label: 'Improper Risk', desc: 'Sized outside plan' },
  { id: 'tp_miss', label: 'Missed TP', desc: "Didn't take profit at level" },
  { id: 'revenge', label: 'Revenge Trade', desc: 'Entered after a loss' },
  { id: 'overtraded', label: 'Overtraded', desc: 'Too many setups same session' },
];
const MISTAKE_LABEL = Object.fromEntries(MISTAKES.map(m => [m.id, m.label]));
const INSTRUMENTS = [
  { group: 'Indices', items: ['NQ1!', 'ES1!', 'YM1!', 'RTY1!', 'DAX', 'NKY', 'FTSE 100'] },
  { group: 'Crypto', items: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'AVAXUSD'] },
  { group: 'Commodities', items: ['XAUUSD', 'XAGUSD', 'CLUSD', 'NGUSD', 'HGUSD'] },
  { group: 'Forex', items: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'GBPJPY'] },
];
const TPL_PRE = [{ name: 'Quick Strike', body: '## State of the market\nIs it balanced or imbalanced?\n\n## Setup\nWhy are you taking this trade? What triggered entry?\n\n## The plan\nWhere do you plan on taking profits?\n\n## Mindset Check\nAm I chasing? Is this my setup?' }];
const TPL_POST = [{ name: 'Quick Debrief', body: "## What happened\nWalk through the trade from entry to exit.\n\n## What I did well\nProcess wins regardless of outcome.\n\n## What I'd do differently\nOne specific thing to change next time.\n\n## Forward Rule\nWhen X happens, I will Y." }];
const J_SECTIONS = [
  { id: 'observations', title: 'Market Observations', hint: "What's interesting, unusual, or noteworthy in the market right now?", ph: 'Price action, volume, notable levels, correlated moves…', icon: 'eye' },
  { id: 'feelings', title: 'Thoughts & Feelings', hint: 'What are you observing in yourself? Energy, bias, tension, clarity?', ph: "Am I sharp? Distracted? Overconfident? What's my state of mind?", icon: 'brain' },
  { id: 'stalking', title: 'Trades Stalking / Setups', hint: 'What are you watching? What needs to set up before you act?', ph: 'Instrument, what I need to see, key level or trigger…', icon: 'crosshair' },
  { id: 'rationale', title: 'Rationale for Actions', hint: 'Why did you act, wait, or pass? Document your reasoning in the moment.', ph: 'I took/passed this because…', icon: 'lines' },
  { id: 'affirmations', title: 'Affirmations', hint: 'Your process reminders. What keeps you grounded and on-plan today?', ph: 'I trade my plan. I only take A+ setups. I protect my capital…', icon: 'bolt' },
  { id: 'deviations', title: 'Deviations & Errors', hint: 'Any on-the-fly adjustments, process breaks, or mistakes? Try to understand why.', ph: 'I deviated because… Next time I will…', icon: 'alert' },
];

/* ── Trade helpers ── */
const tPnl = t => num(t.pnl);
const tSym = t => t.symbol || t.instrument || '—';
const tDir = t => t.type || t.tradeType || 'Long';
const hasText = (s, n = 10) => !!(s && String(s).trim().length > n);
const tState = t => t.isDraft ? 'Draft' : hasText(t.reflection) ? 'Reviewed' : t.exitDone ? 'Needs Review' : 'Open';
const stampCache = new WeakMap();
const tStamp = t => { let s = stampCache.get(t); if (s === undefined) { s = `${t.entryDate || "0000-00-00"} ${t.entryTime || "00:00"} ${String(t.id).padStart(18, "0")}`; stampCache.set(t, s); } return s; };
const hayCache = new WeakMap();
const tHay = t => { let s = hayCache.get(t); if (s === undefined) { s = [tSym(t), tDir(t), t.setupType, t.confluences, t.preOutlook, t.reflection, t.entryDate, fmtDate(t.entryDate), t.outcome, t.grade].join(" ").toLowerCase(); hayCache.set(t, s); } return s; };
function curvePoints(st, max = 500) {
  const c = st.curve; if (!c.length) return [];
  const lab = t => fmtDate(t.entryDate, { month: "short", day: "numeric" });
  const step = c.length > max ? c.length / max : 1; const out = [{ v: 0, label: lab(c[0].t), sub: "Start" }];
  for (let i = 0; i < c.length; i += step) { const x = c[Math.min(c.length - 1, Math.floor(i))]; out.push({ v: x.v, label: lab(x.t), sub: `${tSym(x.t)} ${fmtMoney(tPnl(x.t), { unit: x.t.pnlUnit || "$" })} · ${lab(x.t)}`, t: x.t }); }
  const last = c[c.length - 1]; if (out[out.length - 1].t !== last.t) out.push({ v: last.v, label: lab(last.t), sub: `${tSym(last.t)} ${fmtMoney(tPnl(last.t), { unit: last.t.pnlUnit || "$" })} · ${lab(last.t)}`, t: last.t });
  return out;
}
const byNewest = (a, b) => tStamp(b).localeCompare(tStamp(a));
const byOldest = (a, b) => tStamp(a).localeCompare(tStamp(b));
const tR = t => {
  const p = tPnl(t), r = num(t.risk);
  if (p === null || !r || r <= 0) return null;
  if ((t.riskUnit || '$') !== (t.pnlUnit || '$')) return null;
  return p / r;
};
const tHold = t => {
  if (!t.entryTime || !t.exitTime || !t.entryDate) return null;
  const mk = (d, hm) => { const x = parseYmd(d); const [H, M] = hm.split(':').map(Number); x.setHours(H, M, 0, 0); return x.getTime(); };
  const a = mk(t.entryDate, t.entryTime);
  let b = mk(isYmd(t.exitDate) ? t.exitDate : t.entryDate, t.exitTime);
  if (b < a && !isYmd(t.exitDate)) b += 86400000;
  const m = (b - a) / 60000;
  return m >= 0 ? m : null;
};
const assetClass = sym => {
  const s = (sym || '').toUpperCase();
  if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'AVAX'].some(c => s.includes(c))) return 'Crypto';
  if (['XAU', 'XAG', 'CLUSD', 'NGUSD', 'HGUSD'].some(c => s.includes(c))) return 'Commodities';
  if (['SPX', 'NDX', 'DAX', 'NKY', 'FTSE', 'US30', 'NAS100', 'US500'].some(c => s.includes(c)) || /^(M?NQ|M?ES|M?YM|RTY|M2K)([FGHJKMNQUVXZ]\d{1,2}|\d?!)?$/.test(s.replace(/\s/g, ''))) return 'Indices';
  if (['EUR', 'GBP', 'USD', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].some(c => s.includes(c)) && s.length <= 8) return 'Forex';
  return 'Custom';
};
const RANGES = [['today', 'Today'], ['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['month', 'This Month'], ['lastmonth', 'Last Month'], ['all', 'All Time']];
const inRange = (dateStr, range) => {
  if (range === 'all' || !range) return true;
  if (!isYmd(dateStr)) return false;
  const t = today();
  if (range === 'today') return dateStr === t;
  if (range === '7d') return dateStr > addDays(t, -7) && dateStr <= t;
  if (range === '30d') return dateStr > addDays(t, -30) && dateStr <= t;
  if (range === '90d') return dateStr > addDays(t, -90) && dateStr <= t;
  if (range === 'month') return monthKey(dateStr) === monthKey(t);
  if (range === 'lastmonth') { const d = parseYmd(t); d.setDate(1); d.setMonth(d.getMonth() - 1); return monthKey(dateStr) === monthKey(ymd(d)); }
  return true;
};

/* ── Stats ── */
function calcStats(list) {
  const trades = list.filter(t => !t.isDraft);
  const closed = trades.filter(t => t.exitDone && tPnl(t) !== null).sort(byOldest);
  const wins = closed.filter(t => tPnl(t) > 0), losses = closed.filter(t => tPnl(t) < 0);
  const sum = a => a.reduce((s, t) => s + tPnl(t), 0);
  const net = sum(closed), grossW = sum(wins), grossL = Math.abs(sum(losses));
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const rrs = closed.map(t => num(t.actualRR)).filter(v => v !== null);
  const rs = closed.map(tR).filter(v => v !== null);
  let streak = 0, streakKind = '', best = 0, run = 0;
  closed.forEach(t => { if (tPnl(t) > 0) { run++; best = Math.max(best, run); } else if (tPnl(t) < 0) run = 0; });
  for (let i = closed.length - 1; i >= 0; i--) {
    const p = tPnl(closed[i]); const k = p > 0 ? 'W' : p < 0 ? 'L' : '';
    if (!k) { if (!streakKind) continue; break; }
    if (!streakKind) streakKind = k;
    if (k !== streakKind) break;
    streak++;
  }
  let eq = 0, peak = 0, maxDD = 0; const curve = [];
  closed.forEach(t => { eq += tPnl(t); peak = Math.max(peak, eq); maxDD = Math.max(maxDD, peak - eq); curve.push({ v: eq, t }); });
  const mfes = closed.map(t => num(t.mfe)).filter(v => v !== null), maes = closed.map(t => num(t.mae)).filter(v => v !== null);
  const hold = a => avg(a.map(tHold).filter(v => v !== null && v > 0));
  const gradeCounts = {}; trades.forEach(t => { if (t.grade) gradeCounts[t.grade] = (gradeCounts[t.grade] || 0) + 1; });
  const topGrade = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    total: trades.length, closed: closed.length, open: trades.filter(t => !t.exitDone).length,
    wins: wins.length, losses: losses.length, be: closed.length - wins.length - losses.length,
    net, grossW, grossL,
    winRate: closed.length ? wins.length / closed.length * 100 : null,
    pf: grossL > 0 ? grossW / grossL : (grossW > 0 ? Infinity : null),
    expectancy: closed.length ? net / closed.length : null,
    avgWin: wins.length ? grossW / wins.length : null,
    avgLoss: losses.length ? grossL / losses.length : null,
    avgRR: avg(rrs), netR: rs.length ? rs.reduce((s, v) => s + v, 0) : null, avgR: avg(rs),
    bestTrade: closed.length ? closed.reduce((a, b) => tPnl(b) > tPnl(a) ? b : a) : null,
    worstTrade: closed.length ? closed.reduce((a, b) => tPnl(b) < tPnl(a) ? b : a) : null,
    streak, streakKind, bestStreak: best, maxDD, curve,
    avgMFE: avg(mfes), avgMAE: avg(maes),
    mfeMae: mfes.length && maes.length && avg(maes) > 0 ? avg(mfes) / avg(maes) : null,
    winHold: hold(wins), lossHold: hold(losses),
    reviewed: trades.filter(t => hasText(t.reflection)).length,
    needsReview: trades.filter(t => t.exitDone && !hasText(t.reflection)).sort(byNewest),
    topGrade: topGrade ? topGrade[0] : null,
  };
}
const fmtPF = v => v === null ? '—' : v === Infinity ? '∞' : v.toFixed(2);

/* ═══════════════ Storage: IndexedDB key/value with a localStorage fallback ═══════════════ */
const NS = (() => { try { const m = /[?&]ns=([a-z0-9_-]+)/i.exec(location.search); return m ? '-' + m[1] : ''; } catch (e) { return ''; } })();
const Store = (() => {
  let db = null, mode = 'idb';
  const mem = new Map();
  const LSP = 'oj2' + NS + ':';
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const open = () => new Promise((res, rej) => {
    let r; try { r = indexedDB.open('orochi-journal-v2' + NS, 1); } catch (e) { return rej(e); }
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
    setTimeout(() => rej(new Error('timeout')), 4000);
  });
  const os = m => db.transaction('kv', m).objectStore('kv');
  return {
    get mode() { return mode; },
    async init() {
      try { db = await open(); db.onversionchange = () => db.close(); await req(os('readonly').count()); }
      catch (e) {
        db = null; mode = 'ls';
        try { localStorage.setItem(LSP + '_t', '1'); localStorage.removeItem(LSP + '_t'); } catch (e2) { mode = 'mem'; }
      }
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
    },
    async get(k) {
      if (mode === 'idb') return req(os('readonly').get(k));
      if (mode === 'mem') return mem.get(k);
      try { const v = localStorage.getItem(LSP + k); return v === null ? undefined : JSON.parse(v); } catch (e) { return undefined; }
    },
    async setMany(pairs) {
      if (!pairs.length) return;
      if (mode === 'idb') return new Promise((res, rej) => {
        const tx = db.transaction('kv', 'readwrite'); const s = tx.objectStore('kv');
        pairs.forEach(([k, v]) => v === undefined ? s.delete(k) : s.put(v, k));
        tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('aborted'));
      });
      if (mode === 'mem') { pairs.forEach(([k, v]) => v === undefined ? mem.delete(k) : mem.set(k, v)); return; }
      pairs.forEach(([k, v]) => v === undefined ? localStorage.removeItem(LSP + k) : localStorage.setItem(LSP + k, JSON.stringify(v)));
    },
    set(k, v) { return this.setMany([[k, v]]); },
    del(k) { return this.setMany([[k, undefined]]); },
    async keys() {
      if (mode === 'idb') return req(os('readonly').getAllKeys());
      if (mode === 'mem') return [...mem.keys()];
      const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(LSP)) out.push(k.slice(LSP.length)); } return out;
    },
    async clear() {
      if (mode === 'idb') return req(os('readwrite').clear());
      if (mode === 'mem') return mem.clear();
      (await this.keys()).forEach(k => localStorage.removeItem(LSP + k));
    },
  };
})();

/* ═══════════════ App state ═══════════════ */
const DEFAULTS = {
  trades: [], journal: [], journalMeta: {}, preps: [], prepArchive: [], reviews: {},
  pairs: { custom: [], recent: [] }, templates: { pre: [], post: [] },
  settings: { name: '', color: false, motion: true, intro: true, logView: 'grid' },
  meta: {},
};
const KEYS = Object.keys(DEFAULTS);
const S = JSON.parse(JSON.stringify(DEFAULTS));
const subs = new Set();
const dirty = new Set(), inflight = new Set();
const EMG = 'oj2' + NS + ':pending';
let flushTimer = null, saveFailed = false, emgWritten = false;
const notify = key => subs.forEach(fn => fn(key));
function flush() {
  clearTimeout(flushTimer); flushTimer = null;
  if (!dirty.size) return Promise.resolve();
  const pairs = [...dirty].map(k => [k, S[k]]); dirty.clear();
  pairs.forEach(([k]) => inflight.add(k));
  return Store.setMany(pairs).then(() => {
    pairs.forEach(([k]) => inflight.delete(k)); saveFailed = false;
    if (emgWritten && !dirty.size && !inflight.size) { emgWritten = false; try { localStorage.removeItem(EMG); } catch (e) {} }
  }).catch(e => {
    pairs.forEach(([k]) => { inflight.delete(k); dirty.add(k); });
    if (!saveFailed) { saveFailed = true; toast('Could not save to browser storage. Export a backup from Settings now.', { kind: 'warn', duration: 9000 }); }
  });
}
function commit(key, value) {
  S[key] = typeof value === 'function' ? value(S[key]) : value;
  dirty.add(key);
  if (!flushTimer) flushTimer = setTimeout(flush, 60);
  notify(key);
}
function useS(key) {
  const [, force] = useState(0);
  useEffect(() => { const fn = k => { if (k === key || k === '*') force(n => n + 1); }; subs.add(fn); return () => subs.delete(fn); }, [key]);
  return S[key];
}
/* If the tab closes while a write is still on its way to IndexedDB, park the pending keys in
   localStorage (synchronous) and replay them on the next start. */
function parkPending() {
  const keys = new Set([...dirty, ...inflight]); if (!keys.size) return;
  try { const o = {}; keys.forEach(k => { o[k] = S[k]; }); localStorage.setItem(EMG, JSON.stringify(o)); emgWritten = true; } catch (e) {}
}
function replayPending() {
  let raw = null; try { raw = localStorage.getItem(EMG); } catch (e) {}
  if (!raw) return;
  try { const o = JSON.parse(raw); KEYS.forEach(k => { if (o[k] !== undefined && o[k] !== null) { S[k] = o[k]; dirty.add(k); } }); } catch (e) {}
  emgWritten = true; flush();
}
window.addEventListener('pagehide', () => { parkPending(); flush(); });
window.addEventListener('pageshow', e => { if (e.persisted) { emgWritten = true; dirty.size ? flush() : (() => { try { localStorage.removeItem(EMG); } catch (x) {} })(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

/* ── Toasts (tiny event bus; the view lives in ui) ── */
const toastSubs = new Set(); let toastSeq = 1;
function toast(msg, o = {}) { const t = { id: toastSeq++, msg, ...o }; toastSubs.forEach(fn => fn(t)); return t.id; }

/* ═══════════════ Images: full + thumbnail kept outside the main state ═══════════════ */
const Img = (() => {
  const cache = new Map();
  const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('bad image')); i.src = src; });
  const draw = (img, w, q) => {
    const s = Math.min(1, w / img.naturalWidth); const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
    let out = c.toDataURL('image/webp', q); if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', q);
    return out;
  };
  const fileToUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
  return {
    cache,
    async put(dataUrl) {
      const img = await load(dataUrl);
      let full = dataUrl;
      if (img.naturalWidth > 2560 || dataUrl.length > 1200000) { const re = draw(img, 2560, 0.92); if (re.length < dataUrl.length) full = re; }
      const thumb = draw(img, 640, 0.8);
      const id = 'i' + uid().toString(36);
      await Store.setMany([['img:' + id, full], ['thumb:' + id, thumb]]);
      cache.set('img:' + id, full); cache.set('thumb:' + id, thumb);
      return id;
    },
    async putFile(file) { return this.put(await fileToUrl(file)); },
    async get(id, thumb) {
      const k = (thumb ? 'thumb:' : 'img:') + id;
      if (cache.has(k)) return cache.get(k);
      let v = await Store.get(k);
      if (v === undefined && thumb) { const full = await Store.get('img:' + id); if (full) { try { v = draw(await load(full), 640, 0.8); Store.set(k, v).catch(() => {}); } catch (e) { v = full; } } }
      if (thumb || cache.size < 80) cache.set(k, v || null);
      return v || null;
    },
    async del(id) { cache.delete('img:' + id); cache.delete('thumb:' + id); return Store.setMany([['img:' + id, undefined], ['thumb:' + id, undefined]]); },
  };
})();
function useImg(id, thumb) {
  const k = (thumb ? 'thumb:' : 'img:') + id;
  const [src, setSrc] = useState(() => id && Img.cache.has(k) ? Img.cache.get(k) : null);
  useEffect(() => {
    if (!id) { setSrc(null); return; }
    let live = true;
    if (Img.cache.has(k)) setSrc(Img.cache.get(k)); else { setSrc(null); Img.get(id, thumb).then(v => { if (live) setSrc(v); }).catch(() => {}); }
    return () => { live = false; };
  }, [id, thumb]);
  return src;
}
const refImgIds = () => {
  const set = new Set();
  S.trades.forEach(t => (t.images || []).forEach(i => set.add(i)));
  S.preps.forEach(p => (p.images || []).forEach(i => set.add(i)));
  S.prepArchive.forEach(p => (p.images || []).forEach(i => set.add(i)));
  return set;
};
async function gcImages() {
  try {
    const used = refImgIds(); const keys = await Store.keys(); const dead = [];
    /* Only sweep images older than a day: a chart pasted into a trade that is still being written
       is not referenced yet, and a deleted trade must stay restorable with Undo. */
    keys.forEach(k => {
      const m = /^(?:img|thumb):(.+)$/.exec(k); if (!m || used.has(m[1])) return;
      const born = parseInt(m[1].slice(1), 36) / 1000;
      if (!isFinite(born) || Date.now() - born < 86400000) return;
      dead.push([k, undefined]);
    });
    if (dead.length) await Store.setMany(dead);
    return dead.length;
  } catch (e) { return 0; }
}

/* ═══════════════ Actions ═══════════════ */
const normTrade = t => {
  const o = { ...t };
  o.symbol = (o.symbol && o.symbol !== '—' ? o.symbol : o.instrument) || '';
  o.type = o.type || o.tradeType || 'Long';
  o.entryDate = toYmd(o.entryDate) || toYmd(o.date) || today();
  o.pnl = num(o.pnl);
  o.mistakes = Array.isArray(o.mistakes) ? o.mistakes : [];
  o.images = Array.isArray(o.images) ? o.images : [];
  o.riskUnit = o.riskUnit || '$'; o.pnlUnit = o.pnlUnit || '$';
  ['risk', 'plannedRR', 'actualRR', 'mfe', 'mae', 'entryTime', 'exitDate', 'exitTime', 'grade', 'setupType', 'confluences', 'preOutlook', 'reflection', 'outcome'].forEach(k => { if (o[k] === null || o[k] === undefined) o[k] = ''; else if (typeof o[k] !== 'string') o[k] = String(o[k]); });
  o.exitDone = !!o.exitDone; o.starred = !!o.starred; o.isDraft = !!o.isDraft;
  delete o.instrument; delete o.tradeType; delete o.date; delete o.chartImg; delete o.chartImages; delete o.state; delete o.status; delete o._draftDate; delete o.img; delete o.comment;
  return o;
};
const Act = {
  saveTrade(t) {
    const o = normTrade(t); o.updatedAt = Date.now();
    if (!o.id) { o.id = uid(); o.createdAt = Date.now(); }
    const exists = S.trades.some(x => x.id === o.id);
    commit('trades', exists ? S.trades.map(x => x.id === o.id ? o : x) : [o, ...S.trades]);
    if (o.symbol) Act.touchPair(o.symbol);
    return o;
  },
  deleteTrade(id) {
    const t = S.trades.find(x => x.id === id); if (!t) return;
    commit('trades', S.trades.filter(x => x.id !== id));
    toast(`${tSym(t)} trade deleted`, { action: 'Undo', onAction: () => commit('trades', [t, ...S.trades.filter(x => x.id !== t.id)]) });
  },
  patchTrade(id, patch) { commit('trades', S.trades.map(x => x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)); },
  touchPair(sym) { commit('pairs', p => ({ ...p, recent: [sym, ...p.recent.filter(x => x !== sym)].slice(0, 6) })); },
  addCustomPair(sym) { commit('pairs', p => p.custom.includes(sym) ? p : ({ ...p, custom: [...p.custom, sym] })); },
  delCustomPair(sym) { commit('pairs', p => ({ ...p, custom: p.custom.filter(x => x !== sym) })); },
  addJournal(e) { commit('journal', [{ id: uid(), ts: Date.now(), ...e }, ...S.journal]); },
  delJournal(id) {
    const e = S.journal.find(x => x.id === id); if (!e) return;
    commit('journal', S.journal.filter(x => x.id !== id));
    toast('Entry deleted', { action: 'Undo', onAction: () => commit('journal', [e, ...S.journal].sort((a, b) => b.ts - a.ts)) });
  },
  setJournalMeta(date, patch) { commit('journalMeta', m => ({ ...m, [date]: { ...(m[date] || {}), ...patch } })); },
  setReview(key, patch) { commit('reviews', r => ({ ...r, [key]: { ...(r[key] || {}), ...patch } })); },
  setSetting(patch) { commit('settings', s => ({ ...s, ...patch })); },
  addTemplate(kind, tpl) { commit('templates', t => ({ ...t, [kind]: [...(t[kind] || []), tpl] })); },
  delTemplate(kind, i) { commit('templates', t => ({ ...t, [kind]: (t[kind] || []).filter((_, j) => j !== i) })); },
};

/* ═══════════════ Day status (the "daily loop") ═══════════════ */
const prepHasContent = c => Object.values(c || {}).some(v => {
  if (Array.isArray(v)) return v.some(l => l && typeof l.text === 'string' && l.text.trim());
  if (v && typeof v === 'object') return Object.values(v).some(x => Array.isArray(x) ? x.some(l => l && l.text && l.text.trim()) : (typeof x === 'string' && x.trim()));
  return false;
});
function dayStatus(date) {
  const d = date || today();
  const prep = S.prepArchive.some(p => p.date === d) || S.preps.some(p => p.date === d && (prepHasContent(p.dailyContent) || prepHasContent(p.weeklyContent)));
  const trades = S.trades.filter(t => t.entryDate === d && !t.isDraft).length;
  const journal = S.journal.filter(e => (e.date || ymd(new Date(e.ts))) === d).length;
  const r = S.reviews['daily:' + d] || {};
  const review = Object.entries(r).filter(([k, v]) => !k.endsWith('_ts') && typeof v === 'string' && v.trim().length > 5).length;
  return { prep, trades, journal, review };
}

/* ═══════════════ Backup / restore ═══════════════ */
async function buildBackup() {
  await flush();
  const data = {}; KEYS.forEach(k => data[k] = S[k]);
  const images = {}; const used = refImgIds();
  for (const id of used) { const v = await Store.get('img:' + id); if (v) images[id] = v; }
  return { app: 'orochi-journal', version: 2, exportedAt: new Date().toISOString(), data, images };
}
async function restoreBackup(obj, { merge = false } = {}) {
  if (!obj || obj.app !== 'orochi-journal' || !obj.data) throw new Error('Not an Orochi Journal backup file');
  const d = obj.data;
  const pairs = [];
  for (const [id, v] of Object.entries(obj.images || {})) {
    pairs.push(['img:' + id, v]);
    Img.cache.delete('img:' + id); Img.cache.delete('thumb:' + id);
  }
  for (let i = 0; i < pairs.length; i += 20) await Store.setMany(pairs.slice(i, i + 20));
  const byId = (a, b) => { const m = new Map(); [...(b || []), ...(a || [])].forEach(x => m.set(x.id || x.key, x)); return [...m.values()]; };
  KEYS.forEach(k => {
    if (d[k] === undefined) return;
    if (!merge) { commit(k, d[k]); return; }
    if (k === 'trades') commit(k, byId(d.trades.map(normTrade), S.trades));
    else if (k === 'journal' || k === 'prepArchive') commit(k, byId(d[k], S[k]));
    else if (k === 'journalMeta' || k === 'reviews') commit(k, { ...d[k], ...S[k] });
    else if (k === 'preps' && !S.preps.length) commit(k, d[k]);
  });
  commit('meta', m => ({ ...m, lastRestore: Date.now() }));
  await flush();
}
function downloadText(name, text, type = 'application/json') {
  const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function tradesCsv(list) {
  const cols = ['entryDate', 'entryTime', 'symbol', 'type', 'grade', 'setupType', 'confluences', 'risk', 'riskUnit', 'plannedRR', 'actualRR', 'pnl', 'pnlUnit', 'outcome', 'exitDate', 'exitTime', 'mfe', 'mae', 'mistakes', 'preOutlook', 'reflection'];
  const esc = v => { const s = Array.isArray(v) ? v.join('|') : (v === null || v === undefined ? '' : String(v)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...[...list].sort(byOldest).map(t => cols.map(c => esc(t[c])).join(','))].join('\n');
}
