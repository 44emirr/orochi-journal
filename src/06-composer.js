/* ═══════════════════════════════════════════════════════════
   Trade composer — a spotlight form with a live ticket that gets stamped
   ═══════════════════════════════════════════════════════════ */
const blankTrade = () => ({ symbol: '', type: 'Long', entryDate: today(), entryTime: nowHM(), exitDone: false, exitDate: '', exitTime: '', risk: '', riskUnit: '$', plannedRR: '', actualRR: '', pnl: '', pnlUnit: '$', grade: '', setupType: '', confluences: '', preOutlook: '', reflection: '', outcome: '', mfe: '', mae: '', mistakes: [], images: [], starred: false });
const CMP_STEPS = [
  { id: 'what', label: 'Instrument', done: t => !!t.symbol },
  { id: 'entry', label: 'Entry & risk', done: t => !!(t.entryDate && t.entryTime && t.risk && t.plannedRR) },
  { id: 'grade', label: 'Grade & setup', done: t => !!(t.grade && (t.setupType || t.confluences)) },
  { id: 'charts', label: 'Charts', done: t => (t.images || []).length > 0 },
  { id: 'pre', label: 'Pre-trade outlook', done: t => hasText(t.preOutlook) },
  { id: 'exit', label: 'Exit', done: t => !!t.exitDone },
  { id: 'mistakes', label: 'Mistakes', done: t => (t.mistakes || []).length > 0, optional: true },
  { id: 'post', label: 'Reflection', done: t => hasText(t.reflection, 20) },
];
const tradeProgress = t => { let p = 0; if (t.symbol) p += 15; if (t.entryDate && t.entryTime) p += 10; if (t.risk) p += 15; if (t.plannedRR) p += 10; if (t.grade) p += 10; if (t.setupType || t.confluences) p += 10; if (hasText(t.preOutlook, 5)) p += 10; if (t.exitDone) p += 15; if (hasText(t.reflection, 20)) p += 5; return Math.min(p, 100); };
const tradeNext = t => !t.symbol ? 'Pick an instrument' : !t.entryDate ? 'Select the entry date' : !t.entryTime ? 'Set the entry time' : !t.risk ? 'Set your risk' : !t.plannedRR ? 'Set your planned R:R' : !t.grade ? 'Grade the trade' : !t.setupType && !t.confluences ? 'Describe the setup' : !hasText(t.preOutlook, 5) ? 'Write your pre-trade outlook' : !t.exitDone ? 'Fill the exit when it closes' : !hasText(t.reflection, 20) ? 'Write your reflection' : 'Complete';
const topValues = (pick, n = 6) => { const m = new Map(); S.trades.forEach(t => pick(t).forEach(v => { v = v.trim(); if (v) m.set(v, (m.get(v) || 0) + 1); })); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]); };

function Ticket({ t, no, stamp }) {
  const p = num(t.pnl); const prog = tradeProgress(t); const r = tR({ ...t, pnl: p });
  const bars = useMemo(() => { let s = (Number(String(no).replace(/\D/g, '')) || 1) * 9301 + 49297; return Array.from({ length: 34 }, () => { s = (s * 9301 + 49297) % 233280; return 1 + Math.floor(s / 233280 * 3); }); }, [no]);
  return div('ticket',
    div('tk-main',
      div('tk-top', h(Label, null, 'Trade ticket'), span('tk-no tnum', '№ ' + String(no).padStart(4, '0'))),
      div('tk-sym', span(cx('tk-s', !t.symbol && 'ph'), t.symbol || '— — —'), h(DirTag, { dir: t.type })),
      div('tk-grid',
        [['Date', t.entryDate ? fmtDate(t.entryDate, { month: 'short', day: 'numeric' }) : '—'], ['Time', fmtHM(t.entryTime) || '—'], ['Risk', t.risk ? (t.riskUnit === '%' ? t.risk + '%' : '$' + t.risk) : '—'],
          ['Planned', t.plannedRR ? t.plannedRR + 'R' : '—'], ['Actual', t.actualRR ? t.actualRR + 'R' : r !== null ? fmtR(r) : '—'], ['Grade', t.grade || '—']].map(([k, v]) => div({ key: k, className: 'tk-c' }, span('tk-k', k), span('tk-v tnum', v)))),
      div('tk-pnl', h(Label, null, t.exitDone ? (t.outcome || 'Result') : 'Status'),
        t.exitDone && p !== null ? h(Pnl, { v: p, unit: t.pnlUnit, className: 'tk-p' }) : span('tk-p open', t.exitDone ? '—' : 'Open'))),
    div('tk-perf'),
    div('tk-stub',
      h(Ring, { pct: prog, size: 54, stroke: 3 }, span('tk-pr tnum', prog)),
      div('tk-next', h(Label, null, prog >= 100 ? 'Status' : 'Next'), div('tk-nt', tradeNext(t))),
      div({ className: 'tk-bar', 'aria-hidden': true }, bars.map((w, i) => span({ key: i, style: { width: w } })))),
    stamp && div({ className: 'tk-stamp', key: stamp }, stamp));
}

function TradeComposer({ trade, seed, onClose }) {
  const pairs = useS('pairs');
  const init = useMemo(() => trade ? { ...blankTrade(), ...trade, pnl: trade.pnl === null || trade.pnl === undefined ? '' : String(trade.pnl), mistakes: [...(trade.mistakes || [])], images: [...(trade.images || [])] } : { ...blankTrade(), ...(seed || {}) }, []);
  const [t, setT] = useState(init); const [active, setActive] = useState('what'); const [stamp, setStamp] = useState(null); const [bad, setBad] = useState(null); const [out, setOut] = useState(false);
  const tr = useRef(t); tr.current = t; const body = useRef(null); const busy = useRef(false);
  const set = (k, v) => setT(d => ({ ...d, [k]: typeof v === 'function' ? v(d[k]) : v }));
  const isEdit = !!(trade && !trade.isDraft); const isDirty = () => JSON.stringify(tr.current) !== JSON.stringify(init);
  const no = useMemo(() => trade ? Math.max(1, [...S.trades].sort(byOldest).findIndex(x => x.id === trade.id) + 1) || S.trades.length + 1 : S.trades.length + 1, []);
  const setups = useMemo(() => topValues(x => [x.setupType || ''], 6), []);
  const confs = useMemo(() => topValues(x => String(x.confluences || '').split(','), 8), []);
  const leave = () => { setOut(true); setTimeout(onClose, motionOn() ? 260 : 0); };
  const jump = id => { setActive(id); const el = body.current && body.current.querySelector(`[data-sec="${id}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: motionOn() ? 'smooth' : 'auto' }); };
  const finish = (word, saved, msg) => { busy.current = true; setStamp(word); setTimeout(() => { leave(); toast(msg, saved && !saved.isDraft ? { action: 'View', onAction: () => UI.openTrade(saved.id) } : {}); }, motionOn() ? 900 : 0); };
  const save = () => {
    if (busy.current) return; const c = tr.current;
    const miss = !c.symbol ? ['what', 'Pick an instrument first'] : !c.entryDate ? ['entry', 'The entry date is missing'] : !c.risk ? ['entry', 'Set your risk to save the trade'] : null;
    if (miss) { jump(miss[0]); setBad(miss[0] + Date.now()); toast(miss[1], { kind: 'warn' }); return; }
    const saved = Act.saveTrade({ ...c, pnl: num(c.pnl), isDraft: false });
    finish(isEdit ? 'Updated' : 'Logged', saved, isEdit ? `${saved.symbol} trade updated` : `${saved.symbol} trade logged`);
  };
  const saveDraft = () => { if (busy.current) return; const c = tr.current; const saved = Act.saveTrade({ ...c, pnl: num(c.pnl), isDraft: true }); finish('Draft', saved, 'Saved as a draft in your trade log'); };
  const tryClose = async () => {
    if (busy.current) return;
    if (!isDirty()) return leave();
    const r = await confirmDialog(isEdit ? { title: 'Discard your changes?', body: 'The trade will stay as it was before you opened it.', ok: 'Discard', cancel: 'Keep editing', danger: true }
      : { title: 'Leave without saving?', body: 'Save it as a draft and finish it later from the trade log, or discard it.', ok: 'Discard', cancel: 'Keep editing', danger: true, extra: [{ label: 'Save draft', value: 'draft' }] });
    if (r === 'draft') saveDraft(); else if (r) leave();
  };
  useEscLayer(tryClose);
  useKey(e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && layers.length === 1) { e.preventDefault(); save(); } }, []);
  const prevFocus = useRef(undefined); if (prevFocus.current === undefined) prevFocus.current = document.activeElement || null;
  useEffect(() => () => { const prev = prevFocus.current; if (prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true }); }, []);
  const toggleConf = c => set('confluences', v => { const parts = String(v || '').split(',').map(x => x.trim()).filter(Boolean); return (parts.includes(c) ? parts.filter(x => x !== c) : [...parts, c]).join(', '); });
  const confParts = String(t.confluences || '').split(',').map(x => x.trim()).filter(Boolean);
  const calcR = tR({ ...t, pnl: num(t.pnl) });
  const Sec = (id, title, sub, ...kids) => h('section', { key: id, 'data-sec': id, className: cx('cs', active === id && 'on', bad && bad.startsWith(id) && 'bad'), onFocusCapture: () => setActive(id), onMouseDown: () => setActive(id) },
    div('cs-h', span('cs-n tnum', pad2(CMP_STEPS.findIndex(s => s.id === id) + 1)), div(null, div('cs-t', title), sub && div('cs-s', sub))), div('cs-b', ...kids));
  return h(Portal, null, div({ className: cx('composer', out && 'out') },
    h('header', { className: 'cmp-h' },
      h(Btn, { kind: 'ghost', icon: 'chevL', onClick: tryClose }, 'Back'), div('cmp-title', isEdit ? 'Edit trade' : trade ? 'Finish draft' : 'Log trade'), div('grow'),
      !isEdit && h(Btn, { onClick: saveDraft, disabled: !(t.symbol || t.risk || t.preOutlook || t.images.length) }, 'Save draft'),
      h(Btn, { kind: 'solid', onClick: save }, isEdit ? 'Save changes' : 'Save trade', h(Kbd, null, 'Ctrl ↵'))),
    div('cmp-body',
      h('nav', { className: 'cmp-steps', 'aria-label': 'Sections' }, CMP_STEPS.map((s, i) => h('button', { key: s.id, type: 'button', className: cx('cst', active === s.id && 'on', s.done(t) && 'done'), onClick: () => jump(s.id) },
        span('cst-d', s.done(t) && h(Icon, { n: 'check', s: 10, w: 3 })), span('cst-l', s.label)))),
      div({ className: 'cmp-form', ref: body },
        Sec('what', 'What did you trade?', 'Instrument and direction',
          h(InstrumentField, { value: t.symbol, onChange: v => set('symbol', v), big: true }),
          pairs.recent.length > 0 && div('chips', pairs.recent.slice(0, 6).map(s => h(Chip, { key: s, on: t.symbol === s, onClick: () => set('symbol', s) }, s))),
          div('dirs', ['Long', 'Short'].map(d => h('button', { key: d, type: 'button', className: cx('dirbtn', t.type === d && 'on', d.toLowerCase()), 'aria-pressed': t.type === d, onClick: () => set('type', d) }, h(Icon, { n: d === 'Long' ? 'up' : 'down', s: 22, w: 1.8 }), span(null, d))))),
        Sec('entry', 'Entry and risk', 'When you got in and what you put on the line',
          div('g2', h(Field, { label: 'Entry date', req: true }, h(DateField, { value: t.entryDate, onChange: v => set('entryDate', v) })), h(Field, { label: 'Entry time' }, h(TimeField, { value: t.entryTime, onChange: v => set('entryTime', v) }))),
          div('g2', h(Field, { label: 'Risk', req: true }, div('unit-f', h(NumField, { value: t.risk, onChange: v => set('risk', v), placeholder: '0.00', prefix: t.riskUnit === '%' ? '%' : '$', 'aria-label': 'Risk amount' }), h(Seg, { small: true, value: t.riskUnit, onChange: v => set('riskUnit', v), options: ['$', '%'] }))),
            h(Field, { label: 'Planned R:R' }, h(NumField, { value: t.plannedRR, onChange: v => set('plannedRR', v), placeholder: 'e.g. 2.5', 'aria-label': 'Planned reward to risk' })))),
        Sec('grade', 'Grade and setup', 'How good was this trade before you took it?',
          div('grades', GRADES.map(g => h('button', { key: g.id, type: 'button', className: cx('gradebtn', t.grade === g.id && 'on'), 'aria-pressed': t.grade === g.id, onClick: () => set('grade', t.grade === g.id ? '' : g.id) }, span('gb-g', g.id), span('gb-d', g.desc)))),
          h(Field, { label: 'Setup type' }, h('input', { className: 'inp', value: t.setupType, placeholder: 'e.g. Breakout pullback, Rotational play, Acceptance…', onChange: e => set('setupType', e.target.value) }),
            setups.length > 0 && div('chips', setups.map(s => h(Chip, { key: s, className: 'sm', on: t.setupType === s, onClick: () => set('setupType', t.setupType === s ? '' : s) }, s)))),
          h(Field, { label: 'Confluences' }, h('input', { className: 'inp', value: t.confluences, placeholder: 'e.g. In rhythm, Location confluence, Aligned with DVA…', onChange: e => set('confluences', e.target.value) }),
            confs.length > 0 && div('chips', confs.map(s => h(Chip, { key: s, className: 'sm', on: confParts.includes(s), onClick: () => toggleConf(s) }, s))))),
        Sec('charts', 'Charts', 'Screenshots of the setup, the entry, the exit',
          h(ImageDrop, { ids: t.images, onChange: v => set('images', v) })),
        Sec('pre', 'Pre-trade outlook', 'Your read before entry',
          h(RichText, { value: t.preOutlook, onChange: v => set('preOutlook', v), placeholder: "What's your read on the market? Bias, key levels, your thesis…", templates: TPL_PRE, tplKind: 'pre' })),
        Sec('exit', 'Exit', 'Fill this in once the trade is closed',
          h('button', { type: 'button', className: cx('switch-row', t.exitDone && 'on'), role: 'switch', 'aria-checked': t.exitDone, onClick: () => setT(d => { const on = !d.exitDone; return { ...d, exitDone: on, exitDate: on && !d.exitDate ? d.entryDate : d.exitDate, exitTime: on && !d.exitTime && d.entryDate === today() ? nowHM() : d.exitTime }; }) }, span('switch', span('switch-k')), span(null, 'This trade is closed')),
          t.exitDone && div('exit-in',
            h(Field, { label: 'Outcome' }, div('chips', OUTCOMES.map(o => h(Chip, { key: o, on: t.outcome === o, onClick: () => set('outcome', t.outcome === o ? '' : o) }, o)))),
            div('g2', h(Field, { label: 'Exit date' }, h(DateField, { value: t.exitDate, onChange: v => set('exitDate', v), clearable: true })), h(Field, { label: 'Exit time' }, h(TimeField, { value: t.exitTime, onChange: v => set('exitTime', v) }))),
            div('g2', h(Field, { label: 'P&L', hint: 'use a minus for a loss' }, div('unit-f', h(NumField, { value: t.pnl, onChange: v => set('pnl', v), neg: true, placeholder: '0.00', prefix: t.pnlUnit === '%' ? '%' : '$', big: true, 'aria-label': 'Profit or loss' }), h(Seg, { small: true, value: t.pnlUnit, onChange: v => set('pnlUnit', v), options: ['$', '%'] }))),
              h(Field, { label: 'Actual R:R', hint: calcR !== null ? `P&L ÷ risk = ${fmtR(calcR)}` : null }, div('unit-f', h(NumField, { value: t.actualRR, onChange: v => set('actualRR', v), placeholder: 'e.g. 1.8', big: true, 'aria-label': 'Actual reward to risk' }),
                calcR !== null && calcR > 0 && Number(t.actualRR) !== Number(calcR.toFixed(2)) && h('button', { type: 'button', className: 'mini', onClick: () => set('actualRR', calcR.toFixed(2)) }, 'Use ' + calcR.toFixed(2))))),
            div('g2', h(Field, { label: 'MFE', hint: 'best open profit ($)' }, h(NumField, { value: t.mfe, onChange: v => set('mfe', v), placeholder: 'Highest profit point', 'aria-label': 'Maximum favorable excursion' })),
              h(Field, { label: 'MAE', hint: 'worst open drawdown ($)' }, h(NumField, { value: t.mae, onChange: v => set('mae', v), placeholder: 'Deepest drawdown point', 'aria-label': 'Maximum adverse excursion' }))))),
        Sec('mistakes', 'Mistakes', 'Optional. Tracked over time in analytics',
          div('chips', MISTAKES.map(m => h(Chip, { key: m.id, on: t.mistakes.includes(m.id), title: m.desc, onClick: () => set('mistakes', a => a.includes(m.id) ? a.filter(x => x !== m.id) : [...a, m.id]) }, m.label)))),
        Sec('post', 'Post-trade reflection', 'A closed trade without one is flagged for review',
          h(RichText, { value: t.reflection, onChange: v => set('reflection', v), placeholder: "Walk through this trade. What happened, what you saw, what you did, what you'll take forward…", templates: TPL_POST, tplKind: 'post' })),
        div('cmp-end', h(Btn, { kind: 'ghost', onClick: tryClose }, isEdit ? 'Cancel' : 'Discard'), div('grow'), h(Btn, { kind: 'solid', className: 'lg', onClick: save }, isEdit ? 'Save changes' : 'Save trade'))),
      h('aside', { className: 'cmp-side' }, h(Ticket, { t, no, stamp })))));
}
