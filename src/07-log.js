/* ═══════════════════════════════════════════════════════════
   Trade detail + Trade log
   ═══════════════════════════════════════════════════════════ */
function Excursion({ t }) {
  const p = tPnl(t), mfe = num(t.mfe), mae = num(t.mae), risk = (t.riskUnit || '$') === '$' ? num(t.risk) : null;
  if ((t.pnlUnit || '$') !== '$' || (!mfe && !mae)) return null;
  const lo = -Math.max(mae || 0, p !== null && p < 0 ? -p : 0, risk || 0), hi = Math.max(mfe || 0, p !== null && p > 0 ? p : 0, 0);
  const sp = (hi - lo) || 1; const X = v => clamp((v - lo) / sp * 100, 0, 100);
  const note = mfe && p !== null && p > 0 ? `Captured ${Math.round(clamp(p / mfe, 0, 1) * 100)}% of the best this trade offered.`
    : mfe && p !== null && p <= 0 && risk ? `Was up ${(mfe / risk).toFixed(2)}R at best before it turned.` : mae && risk ? `Heat taken: ${(mae / risk).toFixed(2)}R.` : null;
  return div('exc',
    div('exc-h', h(Label, null, 'Excursion'), note && span('exc-note', note)),
    div('exc-track',
      mae ? div({ className: 'exc-neg', style: { left: X(-mae) + '%', width: (X(0) - X(-mae)) + '%' } }) : null,
      mfe ? div({ className: 'exc-pos', style: { left: X(0) + '%', width: (X(mfe) - X(0)) + '%' } }) : null,
      risk ? div({ className: 'exc-m stop', style: { left: X(-risk) + '%' } }, span(null, '−1R')) : null,
      div({ className: 'exc-m entry', style: { left: X(0) + '%' } }, span(null, 'Entry')),
      p !== null ? div({ className: 'exc-m exit', style: { left: X(p) + '%' } }, span(null, 'Exit ' + fmtMoney(p, { dec: 0 }))) : null),
    div('exc-f', span('tnum', mae ? 'MAE ' + fmtMoney(-mae, { dec: 0 }) : ''), span('tnum', mfe ? 'MFE ' + fmtMoney(mfe, { dec: 0 }) : '')));
}

function TradeDetail({ id, ids, onNav, onClose }) {
  const trades = useS('trades'); const t = trades.find(x => x.id === id);
  const [refl, setRefl] = useState(''); const [img, setImg] = useState(0);
  useEffect(() => { setRefl(''); setImg(0); }, [id]);
  const ix = ids.indexOf(id); const prev = ix > 0 ? ids[ix - 1] : null, next = ix >= 0 && ix < ids.length - 1 ? ids[ix + 1] : null;
  useKey(e => {
    if (isTyping(e) || layers.length > 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); onNav(prev); }
    else if (e.key === 'ArrowRight' && next) { e.preventDefault(); onNav(next); }
    else if ((e.key === 'e' || e.key === 'E') && t) { e.preventDefault(); UI.editTrade(t); }
  }, [id, prev, next]);
  useEffect(() => { if (!t) onClose(); }, [!!t]);
  if (!t) return null;
  const p = tPnl(t), r = tR(t), hold = tHold(t), state = tState(t), imgs = t.images || [];
  const tiles = [['Risk', t.risk ? (t.riskUnit === '%' ? t.risk + '%' : '$' + fmtNum(Number(t.risk), Number(t.risk) % 1 ? 2 : 0)) : '—'], ['Planned R:R', t.plannedRR ? t.plannedRR + 'R' : '—'], ['Actual R:R', t.actualRR ? t.actualRR + 'R' : '—'], ['R multiple', fmtR(r)],
    ['MFE', t.mfe ? fmtMoney(Number(t.mfe), { dec: 0 }) : '—'], ['MAE', t.mae ? fmtMoney(-Number(t.mae), { dec: 0 }) : '—'], ['Held', hold === null ? '—' : fmtMins(hold)], ['Outcome', t.outcome || '—']];
  return h(Modal, { onClose, wide: true, className: 'detail' }, close => h(Fragment, null,
    div('dt-bar',
      h(Label, null, `${fmtDate(t.entryDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}${t.entryTime ? ' · ' + fmtHM(t.entryTime) : ''}`), div('grow'),
      ids.length > 1 && h(Fragment, null, h(IconBtn, { n: 'chevL', tip: 'Previous (←)', disabled: !prev, onClick: () => onNav(prev) }), span('dt-ix tnum', `${ix + 1} / ${ids.length}`), h(IconBtn, { n: 'chevR', tip: 'Next (→)', disabled: !next, onClick: () => onNav(next) }), span('dt-sep')),
      h(IconBtn, { n: 'star', tip: t.starred ? 'Unstar' : 'Star', className: cx('starbtn', t.starred && 'on'), onClick: () => Act.patchTrade(t.id, { starred: !t.starred }) }),
      h(IconBtn, { n: 'edit', tip: t.isDraft ? 'Finish draft (E)' : 'Edit (E)', onClick: () => UI.editTrade(t) }),
      h(IconBtn, { n: 'trash', tip: 'Delete', onClick: () => { const go = next || prev; Act.deleteTrade(t.id); if (go) onNav(go); else close(); } }),
      h(IconBtn, { n: 'x', tip: 'Close (Esc)', onClick: close })),
    div({ className: 'dt-body', key: id },
      div({ ...rise(0, 'dt-hero') },
        div('dt-id', h('h2', { className: 'dt-sym' }, tSym(t)), div('dt-tags', h(DirTag, { dir: tDir(t) }), h(StateTag, { state }), h(GradeTag, { g: t.grade }), t.setupType && span('dt-setup', t.setupType))),
        div('dt-pnl', h(Label, null, t.exitDone ? 'Result' : 'Status'), t.exitDone && p !== null ? div(cx('dt-num', p < 0 && 'neg', p > 0 && 'pos'), h(CountUp, { key: id, value: p, dur: 900, format: v => fmtMoney(v, { unit: t.pnlUnit || '$' }) })) : div('dt-num open', t.isDraft ? 'Draft' : t.exitDone ? '—' : 'Open'))),
      div({ ...rise(1, 'dt-tiles') }, tiles.map(([k, v]) => div({ key: k, className: 'tile' }, h(Label, null, k), div('tile-v tnum', v)))),
      h(Excursion, { t }),
      t.confluences && div({ ...rise(2, 'dt-conf') }, h(Label, null, 'Confluences'), div('chips', [...new Set(String(t.confluences).split(',').map(x => x.trim()).filter(Boolean))].map(c => span({ key: c, className: 'chip sm static' }, c)))),
      imgs.length > 0 && div({ ...rise(2, 'dt-imgs') },
        h(FullImg, { key: imgs[Math.min(img, imgs.length - 1)], id: imgs[Math.min(img, imgs.length - 1)], className: 'dt-img', onClick: () => openLightbox(imgs, Math.min(img, imgs.length - 1)) }),
        imgs.length > 1 && div('dt-thumbs', imgs.map((im, i) => h(Thumb, { key: im + ':' + i, id: im, className: cx('dt-th', i === img && 'on'), onClick: () => setImg(i) })))),
      div({ ...rise(3, 'dt-cols') },
        div('dt-col', h(Label, null, 'Pre-trade outlook'), hasText(t.preOutlook, 2) ? h(RichView, { text: t.preOutlook }) : div('dt-none', 'No pre-trade outlook recorded.')),
        div('dt-col', h(Label, null, 'Post-trade reflection'),
          hasText(t.reflection) ? h(RichView, { text: t.reflection })
            : t.isDraft ? div('dt-none', 'Finish the draft to add a reflection.')
            : div('dt-write', div('dt-none', t.exitDone ? 'No reflection yet. This trade is flagged for review.' : 'You can write this once the trade is closed, or now.'),
              h(RichText, { value: refl, onChange: setRefl, placeholder: 'What happened, what you did well, what you would do differently…', minRows: 5, templates: TPL_POST, tplKind: 'post' }),
              div('dt-wa', h(Btn, { kind: 'solid', disabled: !hasText(refl), onClick: () => { Act.patchTrade(t.id, { reflection: refl }); setRefl(''); toast('Reflection saved. Trade reviewed.'); } }, 'Save reflection'))))),
      t.mistakes && t.mistakes.length > 0 && div({ ...rise(4, 'dt-mis') }, h(Label, null, 'Mistakes logged'), div('chips', t.mistakes.map(m => span({ key: m, className: 'chip sm static warn' }, h(Icon, { n: 'alert', s: 11 }), MISTAKE_LABEL[m] || m)))))));
}

function Menu({ value, options, onChange, icon, label, align = 'right' }) {
  const [open, setOpen] = useState(false); const ref = useRef(null);
  const cur = options.find(o => o[0] === value);
  return h(Fragment, null,
    h('button', { type: 'button', ref, className: 'btn menu-b', 'aria-haspopup': 'listbox', 'aria-expanded': open, onClick: () => setOpen(o => !o) }, icon && h(Icon, { n: icon, s: 13 }), label ? label + ': ' : '', cur ? cur[1] : '', h(Icon, { n: 'chevD', s: 11, className: 'dim' })),
    open && h(Popover, { anchor: ref.current, onClose: () => setOpen(false), width: 200, align, className: 'menu' }, options.map(o => h('button', { key: o[0], type: 'button', role: 'option', 'aria-selected': o[0] === value, className: cx('menu-i', o[0] === value && 'on'), onClick: () => { onChange(o[0]); setOpen(false); } }, o[1], o[0] === value && h(Icon, { n: 'check', s: 13 })))));
}

const SORTS = [['new', 'Newest'], ['old', 'Oldest'], ['best', 'Best P&L'], ['worst', 'Worst P&L']];
const LOG_STATES = [['Reviewed', 'Reviewed'], ['Needs Review', 'Needs review'], ['Open', 'Open'], ['Draft', 'Drafts']];
function TradeCard({ t, i, onOpen }) {
  const p = tPnl(t); const state = tState(t);
  return h('article', { ...rise(i, 'tcard'), tabIndex: 0, role: 'button', 'aria-label': `${tSym(t)} ${tDir(t)} ${fmtDate(t.entryDate)}`, onClick: onOpen, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } },
    div('tc-media', t.images && t.images[0] ? h(Thumb, { id: t.images[0], className: 'tc-img' }) : div('tc-ph', span('tc-big tnum', t.isDraft ? 'Draft' : !t.exitDone ? 'Open' : tR(t) !== null ? fmtR(tR(t), 1) : p !== null ? fmtMoney(p, { dec: 0, unit: t.pnlUnit || '$' }) : '—'), span('tc-cap', 'No chart')),
      div('tc-tl', h(StateTag, { state })),
      h('button', { type: 'button', className: cx('tc-star', t.starred && 'on'), 'aria-label': t.starred ? 'Unstar' : 'Star', onClick: e => { e.stopPropagation(); Act.patchTrade(t.id, { starred: !t.starred }); } }, h(Icon, { n: 'star', s: 15 })),
      t.grade && div('tc-bl', h(GradeTag, { g: t.grade })),
      t.exitDone && p !== null && div('tc-br', h(Pnl, { v: p, unit: t.pnlUnit || '$' })),
      t.images && t.images.length > 1 && div('tc-cnt tnum', h(Icon, { n: 'image', s: 11 }), t.images.length)),
    div('tc-body',
      div('tc-r1', span('tc-sym', tSym(t)), h(DirTag, { dir: tDir(t), small: true })),
      div('tc-r2', span(null, fmtDate(t.entryDate, { month: 'short', day: 'numeric', year: 'numeric' })), t.entryTime && span(null, fmtHM(t.entryTime)), t.plannedRR && span(null, `Planned ${t.plannedRR}R`)),
      (t.setupType || t.preOutlook) && div('tc-x', t.setupType ? t.setupType : String(t.preOutlook).replace(/\*\*|__|~~|#{1,3} /g, '').replace(/\s+/g, ' ').slice(0, 110))));
}

function TradeLog() {
  const trades = useS('trades'); const settings = useS('settings');
  const [f, setF] = useState(() => ({ q: '', dir: null, state: UI.params.state || null, grades: [], outcomes: [], range: 'all', asset: null, starred: false, sort: 'new' }));
  const [page, setPage] = useState(1); const [sheet, setSheet] = useState(false);
  const view = settings.logView === 'list' ? 'list' : 'grid'; const per = view === 'grid' ? 12 : 30;
  const upd = patch => { setF(x => ({ ...x, ...patch })); setPage(1); };
  const tog = (k, v) => upd({ [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v] });
  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = trades.filter(t => {
      if (q && !tHay(t).includes(q)) return false;
      if (f.dir && tDir(t) !== f.dir) return false;
      if (f.state && tState(t) !== f.state) return false;
      if (f.grades.length && !f.grades.includes(t.grade)) return false;
      if (f.outcomes.length && !f.outcomes.includes(t.outcome)) return false;
      if (!inRange(t.entryDate, f.range)) return false;
      if (f.asset && assetClass(tSym(t)) !== f.asset) return false;
      if (f.starred && !t.starred) return false;
      return true;
    });
    const pv = t => { const p = tPnl(t); return t.exitDone && p !== null ? p : null; };
    if (f.sort === 'new') out.sort(byNewest); else if (f.sort === 'old') out.sort(byOldest);
    else out.sort((a, b) => { const x = pv(a), y = pv(b); if (x === null && y === null) return byNewest(a, b); if (x === null) return 1; if (y === null) return -1; return f.sort === 'best' ? y - x : x - y; });
    return out;
  }, [trades, f]);
  const st = useMemo(() => calcStats(list), [list]);
  const pages = Math.max(1, Math.ceil(list.length / per)); const pg = Math.min(page, pages);
  const vis = list.slice((pg - 1) * per, pg * per); const ids = useMemo(() => list.map(t => t.id), [list]);
  const nf = f.grades.length + f.outcomes.length + (f.range !== 'all' ? 1 : 0) + (f.asset ? 1 : 0);
  const any = nf || f.q || f.dir || f.state || f.starred;
  const clear = () => upd({ q: '', dir: null, state: null, grades: [], outcomes: [], range: 'all', asset: null, starred: false });
  const pager = pages > 1 && div('pager',
    span('pager-t tnum', `${(pg - 1) * per + 1}–${Math.min(pg * per, list.length)} of ${list.length}`), div('grow'),
    h(IconBtn, { n: 'chevL', tip: 'Previous page', disabled: pg === 1, onClick: () => setPage(pg - 1) }),
    Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - pg) <= 1).reduce((a, n) => { if (a.length && n - a[a.length - 1] > 1) a.push(-n); a.push(n); return a; }, [])
      .map(n => n < 0 ? span({ key: 'g' + n, className: 'pager-g' }, '…') : h('button', { key: n, type: 'button', className: cx('pager-n tnum', n === pg && 'on'), 'aria-current': n === pg ? 'page' : undefined, onClick: () => setPage(n) }, n)),
    h(IconBtn, { n: 'chevR', tip: 'Next page', disabled: pg === pages, onClick: () => setPage(pg + 1) }));
  return div('page log', div('page-in',
    div({ ...rise(0, 'page-head') }, div(null, h(Label, null, `${trades.filter(t => !t.isDraft).length} trades on record`), h('h1', { className: 'page-title' }, 'Trade log')), div('grow'),
      h(Btn, { icon: 'download', disabled: !list.length, onClick: () => { downloadText(`orochi-trades-${today()}.csv`, tradesCsv(list), 'text/csv'); toast(`${list.length} trades exported as CSV`); } }, 'CSV'),
      h(Menu, { value: f.sort, options: SORTS, onChange: v => upd({ sort: v }), label: 'Sort' }),
      h(Seg, { value: view, onChange: v => { Act.setSetting({ logView: v }); setPage(1); }, options: [['grid', h(Icon, { n: 'grid', s: 14 })], ['list', h(Icon, { n: 'list', s: 14 })]] })),
    div({ ...rise(1, 'log-bar') },
      div('searchbox', h(Icon, { n: 'search', s: 15 }), h('input', { value: f.q, placeholder: 'Search symbol, setup, notes, date…', 'aria-label': 'Search trades', onChange: e => upd({ q: e.target.value }) }), f.q && h(IconBtn, { n: 'x', tip: 'Clear', s: 13, onClick: () => upd({ q: '' }) })),
      div('chips', ['Long', 'Short'].map(d => h(Chip, { key: d, on: f.dir === d, onClick: () => upd({ dir: f.dir === d ? null : d }) }, h(Icon, { n: d === 'Long' ? 'up' : 'down', s: 12, w: 2 }), d)),
        span('vsep'), LOG_STATES.map(([v, l]) => h(Chip, { key: v, on: f.state === v, onClick: () => upd({ state: f.state === v ? null : v }) }, l)),
        span('vsep'), h(Chip, { on: f.starred, onClick: () => upd({ starred: !f.starred }) }, h(Icon, { n: 'star', s: 12 }), 'Starred'),
        h(Chip, { on: nf > 0, onClick: () => setSheet(true) }, h(Icon, { n: 'filter', s: 12 }), 'Filters', nf > 0 && span('chip-n', nf)),
        any ? h('button', { type: 'button', className: 'link', onClick: clear }, 'Clear') : null)),
    div({ ...rise(2, 'log-stats panel') },
      [['Showing', String(list.length)], ['Win rate', st.winRate === null ? '—' : Math.round(st.winRate) + '%'], ['Net P&L', null, st.closed ? st.net : null], ['Profit factor', fmtPF(st.pf)], ['Expectancy', null, st.expectancy], ['Avg win', null, st.avgWin], ['Avg loss', null, st.avgLoss === null ? null : -st.avgLoss], ['Best', null, st.bestTrade ? tPnl(st.bestTrade) : null]]
        .map(([k, v, pv]) => div({ key: k, className: 'ls' }, h(Label, null, k), v !== null ? div('ls-v tnum', v) : h(Pnl, { v: pv, className: 'ls-v' })))),
    !vis.length ? div({ ...rise(3, 'panel') }, h(Empty, { icon: 'log', title: any ? 'No trades match' : 'No trades yet', sub: any ? 'Try a different search or clear the filters.' : 'Log your first trade to get started.' }, any ? h(Btn, { onClick: clear }, 'Clear filters') : h(Btn, { kind: 'solid', icon: 'plus', onClick: () => UI.newTrade() }, 'Log a trade')))
      : view === 'grid' ? div({ className: 'tgrid', key: 'g' + pg + f.sort }, vis.map((t, i) => h(TradeCard, { key: t.id, t, i, onOpen: () => UI.openTrade(t.id, ids) })))
        : div({ ...rise(3, 'panel tlist'), key: 'l' + pg + f.sort }, h('table', { className: 'tt' },
          h('thead', null, h('tr', null, ['Date', 'Symbol', 'Side', 'Grade', 'Setup', 'Risk', 'R:R', 'R', 'P&L', 'State', ''].map((c, i) => h('th', { key: i, className: i >= 5 && i <= 8 ? 'r' : '' }, c)))),
          h('tbody', null, vis.map(t => { const p = tPnl(t); return h('tr', { key: t.id, tabIndex: 0, onClick: () => UI.openTrade(t.id, ids), onKeyDown: e => { if (e.key === 'Enter') UI.openTrade(t.id, ids); } },
            h('td', { className: 'tnum dimc' }, fmtDate(t.entryDate, { month: 'short', day: 'numeric', year: '2-digit' }), t.entryTime ? span('tt-t', ' ' + t.entryTime) : null),
            h('td', { className: 'tt-sym' }, tSym(t)), h('td', null, h(DirTag, { dir: tDir(t), small: true })), h('td', null, h(GradeTag, { g: t.grade })),
            h('td', { className: 'tt-setup' }, t.setupType || '—'), h('td', { className: 'r tnum' }, t.risk ? (t.riskUnit === '%' ? t.risk + '%' : '$' + t.risk) : '—'),
            h('td', { className: 'r tnum' }, t.actualRR || '—'), h('td', { className: 'r tnum' }, fmtR(tR(t))), h('td', { className: 'r' }, h(Pnl, { v: t.exitDone ? p : null, unit: t.pnlUnit || '$' })),
            h('td', null, h(StateTag, { state: tState(t) })),
            h('td', { className: 'r' }, h('button', { type: 'button', className: cx('tc-star inl', t.starred && 'on'), 'aria-label': t.starred ? 'Unstar' : 'Star', onClick: e => { e.stopPropagation(); Act.patchTrade(t.id, { starred: !t.starred }); } }, h(Icon, { n: 'star', s: 14 })))); })))),
    pager,
    sheet && h(Modal, { onClose: () => setSheet(false), className: 'sheet' }, close => h(Fragment, null,
      div('sheet-h', div('dlg-t', 'Filters'), div('grow'), h('button', { type: 'button', className: 'link', onClick: () => upd({ grades: [], outcomes: [], range: 'all', asset: null }) }, 'Clear'), h(IconBtn, { n: 'x', tip: 'Close', onClick: close })),
      div('sheet-b',
        h(Field, { label: 'Date range' }, div('chips', RANGES.map(([v, l]) => h(Chip, { key: v, on: f.range === v, onClick: () => upd({ range: v }) }, l)))),
        h(Field, { label: 'Outcome' }, div('chips', OUTCOMES.map(o => h(Chip, { key: o, on: f.outcomes.includes(o), onClick: () => tog('outcomes', o) }, o)))),
        h(Field, { label: 'Grade' }, div('chips', GRADES.map(g => h(Chip, { key: g.id, on: f.grades.includes(g.id), onClick: () => tog('grades', g.id) }, g.id)))),
        h(Field, { label: 'Asset class' }, div('chips', ['Indices', 'Forex', 'Crypto', 'Commodities', 'Custom'].map(a => h(Chip, { key: a, on: f.asset === a, onClick: () => upd({ asset: f.asset === a ? null : a }) }, a))))),
      div('sheet-f', span('pager-t tnum', `${list.length} ${list.length === 1 ? 'trade' : 'trades'}`), div('grow'), h(Btn, { kind: 'solid', onClick: close }, 'Done'))))));
}
