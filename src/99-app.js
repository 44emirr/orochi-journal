/* ═══════════════════════════════════════════════════════════
   Shell: boot, rail, HUD, command palette, routing
   ═══════════════════════════════════════════════════════════ */
const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', C: Dashboard },
  { id: 'log', label: 'Trade Log', icon: 'log', C: TradeLog },
  { id: 'prep', label: 'Prep', icon: 'prep', C: PrepPage },
  { id: 'journal', label: 'Journal', icon: 'journal', C: JournalPage },
  { id: 'review', label: 'Review', icon: 'review', C: ReviewPage },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', C: AnalyticsPage },
  { id: 'settings', label: 'Settings', icon: 'settings', C: SettingsPage, bottom: true },
];

async function initApp(onProgress) {
  await Store.init();
  const vals = await Promise.all(KEYS.map(k => Store.get(k)));
  KEYS.forEach((k, i) => {
    const v = vals[i]; if (v === undefined || v === null) return;
    S[k] = Array.isArray(DEFAULTS[k]) ? (Array.isArray(v) ? v : DEFAULTS[k]) : { ...DEFAULTS[k], ...v };
  });
  replayPending();
  let imported = null;
  if (!S.meta.migratedV1) {
    if (hasOldData()) { try { imported = await migrateV1(null, onProgress); } catch (e) { console.error('import failed', e); toast('Could not import the old journal automatically. Try Settings → Import.', { kind: 'warn', duration: 8000 }); } }
    else commit('meta', m => ({ ...m, migratedV1: { at: Date.now(), none: true } }));
  }
  if (!S.preps.length) commit('preps', [newPrep('Main')]);
  const td = today();
  if (S.preps.some(p => p.date !== td)) commit('preps', S.preps.map(p => p.date === td ? p : { ...p, date: td }));
  setTimeout(gcImages, 4000);
  return { imported };
}

function Boot({ out, progress, onSkip }) {
  return div({ className: cx('boot', out && 'out'), onClick: onSkip },
    div('boot-in',
      h('img', { className: 'boot-logo', src: window.__LOGO, alt: 'Orochi Trading', draggable: false }),
      div('boot-line'),
      div('boot-tag', 'Discipline builds the edge.'),
      div('boot-prog tnum', progress ? `Moving your journal in · ${progress.trades} trades · ${progress.images} charts` : ' ')));
}

function Clock() {
  const [, f] = useState(0);
  useEffect(() => { const t = setInterval(() => f(n => n + 1), 1000); return () => clearInterval(t); }, []);
  const d = new Date();
  return div('clock tnum', span('clock-t', pad2(d.getHours()) + ':' + pad2(d.getMinutes())), span('clock-s', pad2(d.getSeconds())));
}

function Rail({ page, go }) {
  const wrap = useRef(null); const [y, setY] = useState(null);
  useLayoutEffect(() => { const el = wrap.current && wrap.current.querySelector('[data-on="1"]'); if (el) setY(el.offsetTop + el.offsetHeight / 2); }, [page]);
  useEffect(() => { const fn = () => { const el = wrap.current && wrap.current.querySelector('[data-on="1"]'); if (el) setY(el.offsetTop + el.offsetHeight / 2); }; window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const item = (p, i) => h('button', { key: p.id, type: 'button', className: cx('rail-i', page === p.id && 'on'), 'data-on': page === p.id ? '1' : '0', 'aria-label': p.label, 'aria-current': page === p.id ? 'page' : undefined, onClick: () => go(p.id) },
    h(Icon, { n: p.icon, s: 20, w: 1.5 }), span('rail-tip', p.label, h(Kbd, null, i + 1)));
  return h('nav', { className: 'rail', ref: wrap, 'aria-label': 'Main' },
    h('button', { type: 'button', className: 'rail-mark', 'aria-label': 'Dashboard', onClick: () => go('dashboard') }, h('img', { src: window.__MARK, alt: '', draggable: false })),
    y !== null && div({ className: 'rail-ind', style: { transform: `translateY(${y}px)` } }),
    div('rail-g', PAGES.filter(p => !p.bottom).map((p, i) => item(p, i))),
    div('grow'),
    div('rail-g', PAGES.filter(p => p.bottom).map(p => item(p, PAGES.indexOf(p)))));
}

function Palette({ onClose }) {
  const [q, setQ] = useState(''); const [cur, setCur] = useState(0); const list = useRef(null);
  const ql = q.trim().toLowerCase();
  const cmds = useMemo(() => [
    { label: 'Log a trade', hint: 'T', icon: 'plus', run: () => UI.newTrade() },
    ...PAGES.map((p, i) => ({ label: 'Go to ' + p.label, hint: String(i + 1), icon: p.icon, run: () => UI.go(p.id) })),
    { label: 'Export a backup file', icon: 'download', run: () => exportBackup() },
    { label: S.settings.color ? 'Switch to pure black and white' : 'Show wins and losses in colour', icon: 'drop', run: () => Act.setSetting({ color: !S.settings.color }) },
    { label: S.settings.motion !== false ? 'Turn motion off' : 'Turn motion on', icon: 'wave', run: () => Act.setSetting({ motion: S.settings.motion === false }) },
    { label: 'Keyboard shortcuts', hint: '?', icon: 'kbd', run: () => UI.help() },
  ], []);
  const items = useMemo(() => {
    const c = cmds.filter(x => !ql || x.label.toLowerCase().includes(ql)).map(x => ({ ...x, type: 'cmd' }));
    const t = ql ? S.trades.filter(x => tHay(x).includes(ql)).sort(byNewest).slice(0, 8).map(x => ({ type: 'trade', t: x, run: () => UI.openTrade(x.id) })) : [];
    return [...c, ...t];
  }, [ql]);
  useEffect(() => setCur(0), [ql]);
  useEffect(() => { const el = list.current && list.current.querySelector('.cur'); if (el) el.scrollIntoView({ block: 'nearest' }); }, [cur]);
  return h(Modal, { onClose, className: 'pal' }, close => {
    const run = it => { close(); setTimeout(it.run, 120); };
    return h(Fragment, null,
      div('inst-s', h(Icon, { n: 'search', s: 16 }), h('input', {
        autoFocus: true, placeholder: 'Search trades, pages, actions…', value: q, onChange: e => setQ(e.target.value),
        onKeyDown: e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setCur(c => Math.min(items.length - 1, c + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setCur(c => Math.max(0, c - 1)); }
          else if (e.key === 'Enter' && items[cur]) { e.preventDefault(); run(items[cur]); }
        },
      }), h(Kbd, null, 'Esc')),
      div({ className: 'pal-l', ref: list },
        items.length ? items.map((it, i) => h('button', { key: i, type: 'button', className: cx('pal-i', i === cur && 'cur'), onMouseEnter: () => setCur(i), onClick: () => run(it) },
          it.type === 'cmd' ? h(Fragment, null, span('pal-ic', h(Icon, { n: it.icon, s: 16 })), span('pal-t', it.label), div('grow'), it.hint && h(Kbd, null, it.hint))
            : h(Fragment, null, span('pal-ic', h(Icon, { n: 'log', s: 16 })), span('pal-t', tSym(it.t)), h(DirTag, { dir: tDir(it.t), small: true }), span('pal-d', fmtDate(it.t.entryDate)), it.t.setupType && span('pal-d', it.t.setupType), div('grow'), h(Pnl, { v: it.t.exitDone ? tPnl(it.t) : null, unit: it.t.pnlUnit || '$' }))))
          : div('inst-none pal-none', 'Nothing matches “' + q + '”.')));
  });
}

const SHORTCUTS = [['T', 'Log a trade'], ['Space  or  /', 'Search and commands'], ['1 – 7', 'Jump between pages'], ['Ctrl + Enter', 'Save the trade / log the entry'], ['Ctrl + V', 'Paste a chart screenshot'], ['← →', 'Previous / next trade or chart'], ['Ctrl + Z', 'Undo in Prep'], ['Esc', 'Close whatever is on top'], ['?', 'This list']];
function HelpModal({ onClose }) {
  return h(Modal, { onClose, className: 'dlg help' }, close => h(Fragment, null, div('dlg-t', 'Keyboard'),
    div('help-l', SHORTCUTS.map(([k, v]) => div({ key: k, className: 'kv' }, span('kv-k', v), h(Kbd, null, k)))),
    div('dlg-a', h(Btn, { kind: 'solid', onClick: close }, 'Close'))));
}
function WelcomeModal({ imported, onClose }) {
  const [name, setName] = useState(S.settings.name || '');
  const done = close => { Act.setSetting({ name: name.trim() }); commit('meta', m => ({ ...m, welcomed: Date.now() })); close(); };
  const im = imported && (imported.trades || imported.journal || imported.preps || imported.reviews) ? imported : null;
  return h(Modal, { onClose: () => { commit('meta', m => ({ ...m, welcomed: Date.now() })); onClose(); }, className: 'dlg welcome' }, close => h(Fragment, null,
    h(Label, null, im ? 'Everything moved in' : 'Welcome'),
    div('dlg-t big', im ? 'Your journal, rebuilt.' : 'A journal that feels like the work.'),
    im && div('wel-stats', [['Trades', im.trades], ['Charts', im.images], ['Journal entries', im.journal], ['Preps', im.preps], ['Reviews', im.reviews]].filter(x => x[1]).map(([l, v], i) => div({ key: l, ...rise(i, 'wel-s') }, div('wel-v', h(CountUp, { value: v })), h(Label, null, l)))),
    im && div('dlg-b', 'Imported from your original journal. Nothing was deleted there.', im.dateFixes ? ` ${im.dateFixes} late-evening ${im.dateFixes === 1 ? 'entry was' : 'entries were'} filed under the next day by the old version; ${im.dateFixes === 1 ? 'it is' : 'they are'} now on the day ${im.dateFixes === 1 ? 'it' : 'they'} actually happened.` : ''),
    h(Field, { label: 'What should it call you?', className: 'wel-f' }, h('input', { className: 'inp', autoFocus: true, value: name, placeholder: 'Your name', maxLength: 40, onChange: e => setName(e.target.value), onKeyDown: e => { if (e.key === 'Enter') done(close); } })),
    div('wel-tips', div('wel-tip', h(Kbd, null, 'T'), 'logs a trade from anywhere'), div('wel-tip', h(Kbd, null, 'Space'), 'searches everything'), div('wel-tip', h(Kbd, null, '?'), 'shows every shortcut')),
    div('dlg-b sm', 'Your data stays in this browser on this computer. Export a backup from Settings every so often.'),
    div('dlg-a', h(Btn, { kind: 'solid', className: 'lg', onClick: () => done(close) }, 'Enter'))));
}

function App({ imported }) {
  const settings = useS('settings');
  const [page, setPage] = useState('dashboard'); const [shown, setShown] = useState('dashboard'); const [nonce, setNonce] = useState(0);
  const [dip, setDip] = useState(false);
  const [composer, setComposer] = useState(null); const [detail, setDetail] = useState(null);
  const [pal, setPal] = useState(false); const [help, setHelp] = useState(false);
  const [welcome, setWelcome] = useState(() => !S.meta.welcomed);
  const cur = useRef('dashboard'); const dipT = useRef(0);
  const go = useCallback((id, params) => {
    if (!PAGES.some(p => p.id === id)) return;
    UI.params = params || {};
    if (id === cur.current && !params) return;
    cur.current = id; setPage(id);
    const swap = () => { setShown(id); setNonce(n => n + 1); };
    if (!motionOn()) { swap(); return; }
    clearTimeout(dipT.current); setDip(true);
    dipT.current = setTimeout(() => { swap(); dipT.current = setTimeout(() => setDip(false), 40); }, 150);
  }, []);
  UI.go = go;
  UI.newTrade = (seed) => { setDetail(null); setComposer({ seed: seed || null }); };
  UI.editTrade = t => { setDetail(null); setComposer({ trade: t }); };
  UI.openTrade = (id, ids) => setDetail({ id, ids: ids && ids.length ? ids : [id] });
  UI.palette = () => setPal(true);
  UI.help = () => setHelp(true);
  useEffect(() => {
    document.documentElement.dataset.color = settings.color ? 'on' : 'off';
    document.body.classList.toggle('no-motion', settings.motion === false);
    Stage.sync();
  }, [settings.color, settings.motion]);
  useKey(e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!layers.length) setPal(true); return; }
    if (mod || e.altKey || layers.length || isTyping(e)) return;
    if (e.key === ' ' || e.key === '/') { e.preventDefault(); setPal(true); }
    else if (e.key === 't' || e.key === 'T' || e.key === 'n' || e.key === 'N') { e.preventDefault(); UI.newTrade(); }
    else if (e.key === '?') { e.preventDefault(); setHelp(true); }
    else if (/^[1-7]$/.test(e.key)) { e.preventDefault(); go(PAGES[Number(e.key) - 1].id); }
  }, []);
  const P = PAGES.find(p => p.id === shown) || PAGES[0]; const ix = PAGES.findIndex(p => p.id === page);
  return div('app',
    h(Rail, { page, go }),
    div('main',
      h('header', { className: 'hud' },
        div('hud-l', span('hud-ix tnum', pad2(ix + 1)), span('hud-bar'), span({ key: page, className: 'hud-title' }, (PAGES[ix] || PAGES[0]).label)),
        div('grow'),
        h(LoopDots),
        h('button', { type: 'button', className: 'hud-search', onClick: () => setPal(true) }, h(Icon, { n: 'search', s: 14 }), span(null, 'Search'), h(Kbd, null, 'Space')),
        h(Btn, { kind: 'solid', icon: 'plus', onClick: () => UI.newTrade() }, 'Log trade'),
        h(Clock)),
      div('view-wrap', div({ key: shown + ':' + nonce, className: 'view' }, h(P.C)), div({ className: cx('dip', dip && 'on') }))),
    composer && h(TradeComposer, { key: 'c' + (composer.trade ? composer.trade.id : 'new'), trade: composer.trade, seed: composer.seed, onClose: () => setComposer(null) }),
    detail && h(TradeDetail, { id: detail.id, ids: detail.ids, onNav: id => setDetail(d => ({ ...d, id })), onClose: () => setDetail(null) }),
    pal && h(Palette, { onClose: () => setPal(false) }),
    help && h(HelpModal, { onClose: () => setHelp(false) }),
    welcome && h(WelcomeModal, { imported, onClose: () => setWelcome(false) }),
    h(DialogHost), h(PromptHost), h(LightboxHost), h(ToastHost));
}

function Root() {
  const [st, setSt] = useState({ ready: false, gone: false, prog: null, imported: null, err: null });
  const loaded = useRef(false); const timer = useRef(0);
  const reveal = () => { clearTimeout(timer.current); setSt(s => s.ready ? s : { ...s, ready: true }); setTimeout(() => setSt(s => ({ ...s, gone: true })), 900); };
  useEffect(() => {
    const t0 = performance.now();
    initApp(p => setSt(s => ({ ...s, prog: { ...p } }))).then(res => {
      loaded.current = true; setSt(s => ({ ...s, imported: res.imported }));
      try { const de = document.documentElement; de.dataset.store = Store.mode; de.dataset.trades = String(S.trades.length); de.dataset.ready = '1'; } catch (e) {}
      const min = S.settings.intro !== false && motionOn() ? 2300 : 300;
      timer.current = setTimeout(reveal, Math.max(0, min - (performance.now() - t0)));
    }).catch(e => { console.error(e); setSt(s => ({ ...s, err: String(e && e.message || e) })); });
    const key = () => { if (loaded.current) reveal(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  if (st.err) return div('boot', div('boot-in', div('boot-tag', 'Could not start'), div('boot-prog', st.err)));
  return h(Fragment, null,
    st.ready && h(App, { imported: st.imported }),
    !st.gone && h(Boot, { out: st.ready, progress: st.prog, onSkip: () => { if (loaded.current) reveal(); } }));
}

try { const l = document.createElement('link'); l.rel = 'icon'; l.href = window.__MARK; document.head.appendChild(l); } catch (e) {}
Stage.init();
window.__OJ = { seed: (n, s) => { commit("trades", [...seedTrades(n, s), ...S.trades]); return S.trades.length; }, S, Store, Act, commit, flush, calcStats, migrateV1, hasOldData, buildBackup, restoreBackup, Img, UI, NS, dayStatus, prepExport, toast, layers };
ReactDOM.createRoot(document.getElementById('root')).render(h(Root));
