/* ═══════════════════════════════════════════════════════════
   Prep — daily / weekly plan with a Discord-ready export
   ═══════════════════════════════════════════════════════════ */
const HYPO_GRADES = ['A', 'B+', 'B', 'C'];
function AutoArea({ value, onChange, placeholder, readOnly, className, minRows = 2, ...p }) {
  const ref = useRef(null);
  const grow = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight + 2, minRows * 23 + 26) + 'px'; };
  useLayoutEffect(grow, [value]);
  return h('textarea', { ref, className: cx('inp area', className), value: value || '', placeholder, readOnly, rows: minRows, onChange: e => onChange(e.target.value), ...p });
}
function LineList({ lines, onChange, readOnly, placeholder, grades, blank = { text: '' } }) {
  const refs = useRef([]); const want = useRef(null);
  useEffect(() => { if (want.current === null) return; const el = refs.current[want.current]; want.current = null; if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) {} } });
  const setLine = (i, patch) => onChange(lines.map((l, j) => j === i ? { ...l, ...patch } : l));
  const add = i => { const next = [...lines]; next.splice(i + 1, 0, { ...blank }); want.current = i + 1; onChange(next); };
  const del = i => { if (lines.length <= 1) { onChange([{ ...blank }]); return; } want.current = Math.max(0, i - 1); onChange(lines.filter((_, j) => j !== i)); };
  return div('ll', lines.map((l, i) => div({ key: i, className: cx('ll-r', l.label && 'lab') },
    l.label ? span('ll-lab', String(l.label).replace(/:\s*$/, '')) : span('ll-dash'),
    grades && div('ll-g', HYPO_GRADES.map(g => h('button', { key: g, type: 'button', disabled: readOnly, className: cx('ll-gb', l.grade === g && 'on'), 'aria-pressed': l.grade === g, 'aria-label': 'Grade ' + g, onClick: () => setLine(i, { grade: l.grade === g ? '' : g }) }, g))),
    h('input', {
      ref: el => { refs.current[i] = el; }, className: 'll-i', value: l.text || '', readOnly, placeholder: i === 0 || l.label ? placeholder : '',
      onChange: e => setLine(i, { text: e.target.value }),
      onKeyDown: e => { if (readOnly) return; if (e.key === 'Enter') { e.preventDefault(); add(i); } else if (e.key === 'Backspace' && !l.text && lines.length > 1 && !l.label) { e.preventDefault(); del(i); } },
    }),
    !readOnly && lines.length > 1 && !l.label && h('button', { type: 'button', className: 'll-x', 'aria-label': 'Remove line', tabIndex: -1, onClick: () => del(i) }, h(Icon, { n: 'x', s: 12 })))),
    !readOnly && h('button', { type: 'button', className: 'll-add', onClick: () => add(lines.length - 1) }, h(Icon, { n: 'plus', s: 12 }), 'Add line'));
}
const asLines = (v, key) => Array.isArray(v) && v.length ? v.map(l => typeof l === 'string' ? { text: l } : (l || { text: '' })) : typeof v === 'string' && v ? v.split('\n').map(text => ({ text })) : [key === 'hypo' ? { text: '', grade: '' } : { text: '' }];
function PrepSection({ s, value, onChange, readOnly, i }) {
  const [open, setOpen] = useState(true);
  const filled = prepSectionFilled(s, value);
  let body;
  if (s.kind === 'bias') {
    let v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if (Array.isArray(value)) { const pick = pre => value.filter(l => l && String(l.label || '').startsWith(pre)).map(l => ({ text: l.text || '' })); v = { overallBias: pick('Overall Bias'), narrative: pick('Narrative') }; }
    body = div('ps-two', div('ps-sub', h(Label, null, 'Overall bias'), h(LineList, { lines: asLines(v.overallBias), readOnly, placeholder: 'Your directional read…', onChange: x => onChange({ ...v, overallBias: x }) })),
      div('ps-sub', h(Label, null, 'Narrative'), h(LineList, { lines: asLines(v.narrative), readOnly, placeholder: 'The story the market is telling…', onChange: x => onChange({ ...v, narrative: x }) })));
  } else if (s.kind === 'hypo') {
    const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const L = asLines(v.long !== undefined ? v.long : v.bull, 'hypo'), R = asLines(v.short !== undefined ? v.short : v.bear, 'hypo');
    const put = (k, x) => onChange({ long: L, short: R, [k]: x });
    body = div('ps-two', div('ps-sub', div('ps-dir', h(Icon, { n: 'up', s: 13, w: 2 }), h(Label, null, 'Long hypo')), h(LineList, { lines: L, readOnly, grades: true, blank: { text: '', grade: '' }, placeholder: 'If… then…', onChange: x => put('long', x) })),
      div('ps-sub', div('ps-dir', h(Icon, { n: 'down', s: 13, w: 2 }), h(Label, null, 'Short hypo')), h(LineList, { lines: R, readOnly, grades: true, blank: { text: '', grade: '' }, placeholder: 'If… then…', onChange: x => put('short', x) })));
  } else if (s.kind === 'sand') {
    const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    body = div('ps-sand', [['bullST', 'Bullish · short term', 'up'], ['bullLT', 'Bullish · long term', 'up'], ['bearST', 'Bearish · short term', 'down'], ['bearLT', 'Bearish · long term', 'down']].map(([k, l, ic]) =>
      div({ key: k, className: 'ps-sub' }, div('ps-dir', h(Icon, { n: ic, s: 13, w: 2 }), h(Label, null, l)), h(AutoArea, { value: v[k] || '', readOnly, placeholder: 'Key levels…', 'aria-label': l, onChange: x => onChange({ ...v, [k]: x }) }))));
  } else {
    const lines = Array.isArray(value) && value.length ? asLines(value) : typeof value === 'string' && value ? asLines(value) : prepDefaultValue(s);
    body = h(LineList, { lines, readOnly, blank: { label: '', text: '' }, placeholder: s.prefilled ? '' : 'Add a note…', onChange });
  }
  return h('section', { ...rise(i, cx('panel ps', filled && 'filled', !open && 'shut')) },
    h('button', { type: 'button', className: 'ps-h', 'aria-expanded': open, onClick: () => setOpen(o => !o) },
      span('ps-ic', h(Icon, { n: s.icon, s: 17 })), div('ps-tt', div('ps-t', s.title), div('ps-hint', s.hint)), span(cx('ps-dot', filled && 'on')), h(Icon, { n: 'chevD', s: 15, className: 'ps-chev' })),
    open && div('ps-b', body));
}

function PrepPage() {
  const preps = useS('preps'); const archive = useS('prepArchive');
  const [activeId, setActiveId] = useState(() => (S.preps[0] || {}).id); const [viewKey, setViewKey] = useState(null);
  const [mode, setMode] = useState('formatted'); const [copied, setCopied] = useState(false); const [, bump] = useState(0);
  const undo = useRef({}); const lastPush = useRef({ t: 0, sec: null }); const sessionKeys = useRef(new Set()); const archT = useRef(0);
  const prep = preps.find(p => p.id === activeId) || preps[0];
  const prepRef = useRef(prep); prepRef.current = prep;
  const keyOf = p => `${p.date}||${p.instrument || ''}||${p.prepType}`;
  /* History snapshots are queued per prep, so switching, adding or removing a pair never drops one. */
  const pendingSnap = useRef(new Set());
  const snapshotOf = id => {
    const p = S.preps.find(x => x.id === id); if (!p) return;
    if (!prepHasContent(p.dailyContent) && !prepHasContent(p.weeklyContent)) return;
    const key = keyOf(p); sessionKeys.current.add(key);
    commit('prepArchive', a => [{ key, date: p.date, instrument: p.instrument || '', prepType: p.prepType, dailyContent: p.dailyContent || {}, weeklyContent: p.weeklyContent || {}, images: p.images || [], savedAt: Date.now() }, ...a.filter(e => e.key !== key)].slice(0, 400));
  };
  const flushSnaps = () => { clearTimeout(archT.current); archT.current = 0; const ids = [...pendingSnap.current]; pendingSnap.current.clear(); ids.forEach(snapshotOf); };
  const queueSnap = () => { pendingSnap.current.add(prep.id); clearTimeout(archT.current); archT.current = setTimeout(flushSnaps, 700); };
  const switchTo = id => { flushSnaps(); setActiveId(id); setViewKey(null); };
  useEffect(() => () => flushSnaps(), []);
  const patch = (changes, snap = true) => { commit('preps', ps => ps.map(p => p.id === prep.id ? { ...p, ...changes } : p)); if (snap) queueSnap(); };
  const rekey = changes => {
    const olds = ['daily', 'weekly'].map(t => keyOf({ ...prep, prepType: t })).filter(k => sessionKeys.current.has(k));
    if (olds.length) commit('prepArchive', a => a.filter(e => !olds.includes(e.key)));
    olds.forEach(k => sessionKeys.current.delete(k));
    patch(changes);
  };
  const type = prep ? prep.prepType : 'daily'; const sections = prepSections(type);
  const cKey = type === 'daily' ? 'dailyContent' : 'weeklyContent';
  const content = (prep && prep[cKey]) || {};
  const pushUndo = sec => {
    const now = Date.now(); const st = (undo.current[prep.id] = undo.current[prep.id] || []);
    if (sec && lastPush.current.sec === sec && now - lastPush.current.t < 900) { lastPush.current.t = now; return; }
    lastPush.current = { t: now, sec }; st.push({ dailyContent: prep.dailyContent, weeklyContent: prep.weeklyContent }); if (st.length > 60) st.shift(); bump(n => n + 1);
  };
  const setSection = (id, val) => { pushUndo(type + id); patch({ [cKey]: { ...content, [id]: val } }); };
  const doUndo = () => { const st = undo.current[prep.id] || []; if (!st.length) return; const last = st.pop(); lastPush.current = { t: 0, sec: null }; patch(last); bump(n => n + 1); };
  const canUndo = prep && (undo.current[prep.id] || []).length > 0;
  useKey(e => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !layers.length && !viewKey) { const a = document.activeElement; if (a && a.closest && a.closest('.prep') && (undo.current[prepRef.current.id] || []).length) { e.preventDefault(); doUndo(); } } }, [viewKey, prep ? prep.id : 0]);
  const reset = async () => {
    if (!(await confirmDialog({ title: 'Reset this prep?', body: 'Every section goes back to the empty template. You can undo it right after.', ok: 'Reset', danger: true }))) return;
    pushUndo(null); const mk = ss => Object.fromEntries(ss.map(s => [s.id, prepDefaultValue(s)]));
    patch({ dailyContent: mk(PREP_DAILY), weeklyContent: mk(PREP_WEEKLY) }, false);
  };
  const addPair = () => { flushSnaps(); const p = newPrep(`Pair ${preps.length + 1}`); commit('preps', [...preps, p]); setActiveId(p.id); setViewKey(null); };
  const delPair = async p => {
    if (!(await confirmDialog({ title: `Remove ${p.instrument || p.label}?`, body: 'This closes the tab. Anything you wrote today stays in the history.', ok: 'Remove', danger: true }))) return;
    flushSnaps();
    const rest = S.preps.filter(x => x.id !== p.id); if (!rest.length) return; commit('preps', rest); if (p.id === prep.id) setActiveId(rest[0].id);
  };
  const view = viewKey ? archive.find(e => e.key === viewKey) : null;
  const shown = view || prep;
  const shownSections = prepSections(shown ? shown.prepType : 'daily');
  const shownContent = (shown && (shown.prepType === 'daily' ? shown.dailyContent : shown.weeklyContent)) || {};
  const filled = sections.filter(s => prepSectionFilled(s, content[s.id])).length;
  const text = useMemo(() => shown ? prepExport(shown, mode) : '', [shown, mode]);
  const copy = async () => { const ok = await copyText(text); if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); } else toast('Copy was blocked by the browser. Select the preview text and copy it by hand.', { kind: 'warn' }); };
  const liveKey = prep ? keyOf(prep) : '';
  const hist = archive.filter(e => e.key !== liveKey);
  const loadArchived = async () => {
    if (!view) return;
    if (prepHasContent(content) && !(await confirmDialog({ title: 'Replace the current prep?', body: 'The archived version will be copied into today. You can undo it.', ok: 'Load it' }))) return;
    pushUndo(null); patch({ prepType: view.prepType, instrument: view.instrument, dailyContent: view.dailyContent || {}, weeklyContent: view.weeklyContent || {} }); setViewKey(null); toast('Loaded into today’s prep');
  };
  if (!prep) return div('page', div('page-in', h(Empty, { icon: 'prep', title: 'No prep yet' }, h(Btn, { kind: 'solid', onClick: addPair }, 'Start a prep'))));
  return div('page prep', div('page-in',
    div({ ...rise(0, 'page-head') }, div(null, h(Label, null, view ? 'Archived prep' : `${type === 'weekly' ? 'Weekly' : 'Daily'} prep · ${filled}/${sections.length} sections`), h('h1', { className: 'page-title' }, view ? fmtDate(view.date, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Prep')), div('grow'),
      !view && h(Fragment, null, h(Btn, { icon: 'undo', disabled: !canUndo, onClick: doUndo }, 'Undo'), h(Btn, { icon: 'refresh', onClick: reset }, 'Reset'), h(Btn, { icon: 'plus', onClick: addPair }, 'New pair')),
      h(Btn, { kind: 'solid', icon: copied ? 'check' : 'copy', onClick: copy }, copied ? 'Copied' : 'Copy prep')),
    view ? div({ ...rise(1, 'panel prep-view') }, h(Icon, { n: 'eye', s: 15 }), span(null, `Viewing ${view.prepType === 'weekly' ? 'weekly' : 'daily'} prep${view.instrument ? ' · ' + view.instrument : ''}, saved ${fmtTime(view.savedAt)}. Read only.`), div('grow'), h(Btn, { className: 'sm', onClick: loadArchived }, 'Load into today'), h(Btn, { className: 'sm', kind: 'solid', onClick: () => setViewKey(null) }, 'Back to current'))
      : div({ ...rise(1, 'prep-bar') },
        preps.length > 1 && div('prep-tabs', preps.map(p => span({ key: p.id, className: cx('ptab', p.id === prep.id && 'on') }, h('button', { type: 'button', className: 'ptab-b', onClick: () => switchTo(p.id) }, p.instrument || p.label),
          h('button', { type: 'button', className: 'ptab-x', 'aria-label': 'Remove ' + (p.instrument || p.label), onClick: () => delPair(p) }, h(Icon, { n: 'x', s: 10 }))))),
        h(Seg, { value: type, onChange: v => patch({ prepType: v }), options: [['daily', 'Daily'], ['weekly', 'Weekly']] }),
        div('prep-f', h(DateField, { value: prep.date, onChange: v => rekey({ date: v }) })), div('prep-f', h(InstrumentField, { value: prep.instrument, onChange: v => rekey({ instrument: v }) }))),
    div('prep-cols',
      div('prep-main',
        div({ ...rise(2, 'prep-charts') }, view ? ((view.images || []).length ? div('imgdrop', view.images.map((id, i) => div({ key: id + ':' + i, className: 'imgdrop-i' }, h(Thumb, { id, onClick: () => openLightbox(view.images, i) })))) : null)
          : h(ImageDrop, { ids: prep.images || [], onChange: v => patch({ images: v }) })),
        shownSections.map((s, i) => h(PrepSection, { key: (view ? view.key : prep.id) + shown.prepType + s.id, s, i: i + 3, readOnly: !!view, value: shownContent[s.id], onChange: v => setSection(s.id, v) }))),
      h('aside', { className: 'prep-side' },
        div({ ...rise(3, 'panel prep-exp') },
          div('panel-h', h(Label, null, 'Export preview'), div('grow'), h(Seg, { small: true, value: mode, onChange: setMode, options: [['formatted', 'Formatted'], ['clean', 'Clean']] })),
          div('panel-b', h('pre', { className: 'prep-pre', tabIndex: 0 }, text.split(String.fromCharCode(27)).join('')), div('prep-exp-f', span('prep-note', 'Ready to paste into Discord.'), h(Btn, { className: 'sm', icon: copied ? 'check' : 'copy', onClick: copy }, copied ? 'Copied' : 'Copy')))),
        div({ ...rise(4, 'panel prep-hist') },
          div('panel-h', h(Label, null, 'History'), div('grow'), span('count', hist.length)),
          div('panel-b tight', h('button', { type: 'button', className: cx('hrow', !view && 'on'), onClick: () => setViewKey(null) }, span('hrow-t', 'Current'), span('hrow-s', fmtDate(prep.date, { month: 'short', day: 'numeric' }) + (prep.instrument ? ' · ' + prep.instrument : ''))),
            hist.slice(0, 60).map(e => h('button', { key: e.key, type: 'button', className: cx('hrow', viewKey === e.key && 'on'), onClick: () => setViewKey(e.key) }, span('hrow-t', fmtDate(e.date, { weekday: 'short', month: 'short', day: 'numeric' })), span('hrow-s', [e.instrument, e.prepType === 'weekly' ? 'Weekly' : 'Daily'].filter(Boolean).join(' · ')),
              h('span', { className: 'hrow-x', role: 'button', 'aria-label': 'Delete this archived prep', onClick: async ev => { ev.stopPropagation(); if (await confirmDialog({ title: 'Delete this archived prep?', body: 'It cannot be brought back.', ok: 'Delete', danger: true })) { if (viewKey === e.key) setViewKey(null); commit('prepArchive', a => a.filter(x => x.key !== e.key)); } } }, h(Icon, { n: 'x', s: 11 })))),
            !hist.length && div('more', 'Past preps appear here as you write.')))))));
}
