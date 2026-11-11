/* ═══════════════════════════════════════════════════════════
   Journal (timestamped log) + Review (daily / weekly / monthly)
   ═══════════════════════════════════════════════════════════ */
const jDate = e => e.date || ymd(new Date(e.ts));
const J_BY_ID = Object.fromEntries(J_SECTIONS.map(s => [s.id, s]));

function JournalPage() {
  const all = useS('journal'); const metaAll = useS('journalMeta');
  const [date, setDate] = useState(() => isYmd(UI.params.date) ? UI.params.date : today());
  const [sec, setSec] = useState('observations'); const [filter, setFilter] = useState(null); const [draft, setDraft] = useState(''); const [editGoal, setEditGoal] = useState(false);
  const ta = useRef(null);
  const td = today(); const isToday = date === td;
  const meta = metaAll[date] || {};
  const dayMap = useMemo(() => { const m = {}; all.forEach(e => { const d = jDate(e); m[d] = (m[d] || 0) + 1; }); return m; }, [all]);
  const days = useMemo(() => Object.keys(dayMap).filter(d => d !== td).sort((a, b) => b.localeCompare(a)), [dayMap, td]);
  const entries = useMemo(() => all.filter(e => jDate(e) === date).sort((a, b) => b.ts - a.ts), [all, date]);
  const counts = useMemo(() => { const c = {}; entries.forEach(e => { c[e.section] = (c[e.section] || 0) + 1; }); return c; }, [entries]);
  const shown = filter ? entries.filter(e => e.section === filter) : entries;
  const cur = J_BY_ID[sec];
  const submit = () => { const text = draft.trim(); if (!text) return; Act.addJournal({ section: sec, text, date }); setDraft(''); if (filter && filter !== sec) setFilter(null); if (ta.current) ta.current.focus(); };
  useKey(e => { if (e.altKey && /^[1-6]$/.test(e.key) && !layers.length) { e.preventDefault(); setSec(J_SECTIONS[Number(e.key) - 1].id); ta.current && ta.current.focus(); } }, []);
  return div('page jr', div('page-in jr-in',
    h('aside', { ...rise(1, 'panel side-list-p') },
      div('panel-h', h(Label, null, 'Days'), div('grow'), h(DateField, { value: date, onChange: setDate, marks: new Set(Object.keys(dayMap)), className: 'mini-date' })),
      div('panel-b tight',
        h('button', { type: 'button', className: cx('hrow', isToday && 'on'), onClick: () => setDate(td) }, span('hrow-t', 'Today'), span('hrow-s', `${dayMap[td] || 0} ${dayMap[td] === 1 ? 'entry' : 'entries'}`)),
        !isToday && !dayMap[date] && h('button', { type: 'button', className: 'hrow on' }, span('hrow-t', fmtDay(date)), span('hrow-s', '0 entries')),
        days.slice(0, 120).map(d => h('button', { key: d, type: 'button', className: cx('hrow', d === date && 'on'), onClick: () => setDate(d) }, span('hrow-t', fmtDay(d)), span('hrow-s', `${dayMap[d]} ${dayMap[d] === 1 ? 'entry' : 'entries'}`))),
        !days.length && div('more', 'Past days appear here as you write.'))),
    div('jr-main',
      div({ ...rise(0, 'page-head') }, div(null, h(Label, null, `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · every one timestamped`), h('h1', { className: 'page-title' }, isToday ? 'Journal' : fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' }))), div('grow'),
        !isToday && h(Btn, { onClick: () => setDate(td) }, 'Back to today')),
      div({ ...rise(1, 'jr-top') },
        div('panel jr-goal', div('jr-ch', h(Icon, { n: 'target', s: 15 }), h(Label, null, 'Process goal')),
          editGoal ? h('input', { className: 'jr-goal-i', autoFocus: true, value: meta.processGoal || '', placeholder: 'Your #1 process focus today', maxLength: 240, onChange: e => Act.setJournalMeta(date, { processGoal: e.target.value }), onBlur: () => setEditGoal(false), onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); setEditGoal(false); } } })
            : h('button', { type: 'button', className: cx('jr-goal-t', !meta.processGoal && 'ph'), onClick: () => setEditGoal(true) }, meta.processGoal || 'Set your process goal…')),
        div('panel jr-econ', div('jr-ch', h(Icon, { n: 'calendar', s: 15 }), h(Label, null, 'Econ calendar notes')),
          h(AutoArea, { className: 'bare', minRows: 1, value: meta.econNotes || '', placeholder: 'CPI at 8:30 ET, Fed speaker at 2pm, earnings…', 'aria-label': 'Econ calendar notes', onChange: v => Act.setJournalMeta(date, { econNotes: v }) }))),
      div({ ...rise(2, 'panel jr-compose') },
        div('jr-secs', J_SECTIONS.map((s, i) => h('button', { key: s.id, type: 'button', className: cx('jsec', sec === s.id && 'on'), 'aria-pressed': sec === s.id, title: `Alt+${i + 1}`, onClick: () => { setSec(s.id); ta.current && ta.current.focus(); } }, h(Icon, { n: s.icon, s: 14 }), span(null, s.title), counts[s.id] ? span('jsec-n tnum', counts[s.id]) : null))),
        div({ className: 'jr-hint', key: sec }, cur.hint),
        div('jr-box', h('textarea', { ref: ta, className: 'jr-ta', value: draft, rows: 3, placeholder: cur.ph, 'aria-label': 'New journal entry', onChange: e => setDraft(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } } }),
          div('jr-box-f', span('jr-kb', h(Kbd, null, 'Ctrl ↵'), 'to log'), div('grow'), h(Btn, { kind: 'solid', icon: 'plus', disabled: !draft.trim(), onClick: submit }, 'Log entry')))),
      div({ ...rise(3, 'jr-feed') },
        entries.length > 0 && div('chips jr-filter', h(Chip, { className: 'sm', on: !filter, onClick: () => setFilter(null) }, 'All ', entries.length), J_SECTIONS.filter(s => counts[s.id]).map(s => h(Chip, { key: s.id, className: 'sm', on: filter === s.id, onClick: () => setFilter(filter === s.id ? null : s.id) }, s.title, ' ', counts[s.id]))),
        shown.length ? div('tl', shown.map((e, i) => { const s = J_BY_ID[e.section] || J_SECTIONS[0]; return div({ key: e.id, ...rise(Math.min(i, 8), 'tl-i') },
          div('tl-time tnum', fmtTime(e.ts), jDate(e) !== ymd(new Date(e.ts)) && span('tl-late', fmtDate(ymd(new Date(e.ts)), { month: 'short', day: 'numeric' }))), div('tl-rail', span('tl-dot')),
          div('tl-card', div('tl-h', h(Icon, { n: s.icon, s: 13 }), span('tl-sec', s.title), div('grow'), h('button', { type: 'button', className: 'tl-x', 'aria-label': 'Delete entry', onClick: () => Act.delJournal(e.id) }, h(Icon, { n: 'trash', s: 13 }))), div('tl-text', e.text))); }))
          : div('panel', h(Empty, { icon: 'journal', title: isToday ? 'Nothing logged yet today' : 'Nothing logged this day', sub: 'Pick a section above and write what you see, feel, or plan. Short and honest beats long and late.' }))))));
}

/* ── Review ── */
const REVIEW_DEF = {
  daily: [
    { title: 'Process goal review', icon: 'target', prompts: [['process', '1', 'How did I perform today solely as it relates to my Process Goal? Get quantitative — tally it.'], ['hypos', '2', 'How were my hypotheses today, now with the benefit of hindsight?']] },
    { title: 'Trade-by-trade review', icon: 'log', trades: true, prompts: [['missed', '', 'Were there valid trades you did NOT take? Why? Focus? Too rigid? Stalking the opposite?']] },
    { title: 'Errors and wins', icon: 'alert', prompts: [['errors', 'a', "Any key errors you're making? Patterns you notice?"], ['wins', 'b', 'What did you do well today? Find something — even if it was a poor session.']] },
    { title: 'Observations and summary', icon: 'eye', prompts: [['obs', '', 'Interesting market observations from the session worth documenting.'], ['summary', '', 'Summary and Process Goal for tomorrow. Now let go. Stay balanced.']] },
  ],
  weekly: [
    { title: 'Outcomes and body of work', icon: 'trend', prompts: [['process', '', 'Overall process goal success this week. What was the score?'], ['working', '', "What's working? Where are you executing well?"], ['notWorking', '', "What's not working? Be honest and specific."]] },
    { title: 'Market conditions', icon: 'wave', prompts: [['conditions', '', 'What were overall market conditions this week? Did you adapt appropriately?']] },
    { title: 'Next week', icon: 'target', prompts: [['nextWeek', '', 'Key things you can do next week to be better. Make them specific and actionable.']] },
  ],
  monthly: [
    { title: "Performance vs last month's goals", icon: 'bars', prompts: [['vs_goals', '', "How did you perform based on last month's key takeaways and goals? Grade yourself."], ['general', '', 'General thoughts and overall market conditions this month.']] },
    { title: "What's not working", icon: 'alert', prompts: [['poor', '', "Things you're doing poorly, repeatedly. Name them clearly."]] },
    { title: "What's working well", icon: 'check', prompts: [['great', '', 'Things you are doing really well this month.'], ['bestSource', '', 'Where are your best trades coming from? Setup, time, instrument?']] },
    { title: 'Takeaways and goals', icon: 'target', prompts: [['takeaways', '', 'Key takeaways and action items. What changes are you committing to?'], ['goals', '', 'Goals for next month — connect each to an objective, measurable outcome.']] },
  ],
};
const rvCurrent = tab => tab === 'daily' ? today() : tab === 'weekly' ? mondayOf(today()) : monthKey(today());
const rvLabel = (tab, k) => tab === 'daily' ? fmtDate(k, { weekday: 'long', month: 'long', day: 'numeric' }) : tab === 'weekly' ? `Week of ${fmtDate(k, { month: 'long', day: 'numeric' })}` : parseYmd(k + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const rvShort = (tab, k) => tab === 'daily' ? fmtDay(k) : tab === 'weekly' ? `Week of ${fmtDate(k, { month: 'short', day: 'numeric' })}` : parseYmd(k + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
const rvShift = (tab, k, n) => { if (tab === 'daily') return addDays(k, n); if (tab === 'weekly') return addDays(k, 7 * n); const d = parseYmd(k + '-01'); d.setMonth(d.getMonth() + n); return monthKey(ymd(d)); };
const rvInPeriod = (tab, k, d) => isYmd(d) && (tab === 'daily' ? d === k : tab === 'weekly' ? d >= k && d <= addDays(k, 6) : monthKey(d) === k);
const rvFilled = r => Object.entries(r || {}).some(([f, v]) => !f.endsWith('_ts') && typeof v === 'string' && v.trim());

function ReviewPrompt({ n, text, value, ts, onChange }) {
  return div(cx('rp', value && value.trim() && 'filled'),
    div('rp-h', n && span('rp-n', n), div('rp-t', text), ts && span('rp-ts tnum', fmtTime(ts))),
    h(AutoArea, { value: value || '', placeholder: 'Write here…', minRows: 3, 'aria-label': text, onChange }));
}
function ReviewPage() {
  const reviews = useS('reviews'); const trades = useS('trades'); const metaAll = useS('journalMeta');
  const [tab, setTab] = useState(() => UI.params.date ? 'daily' : 'daily');
  const [k, setK] = useState(() => isYmd(UI.params.date) ? UI.params.date : today());
  const switchTab = t => { setTab(t); setK(rvCurrent(t)); };
  const key = tab + ':' + k; const r = reviews[key] || {}; const cur = rvCurrent(tab);
  const set = (f, v) => Act.setReview(key, r[f + '_ts'] || !v ? { [f]: v } : { [f]: v, [f + '_ts']: Date.now() });
  const period = useMemo(() => trades.filter(t => !t.isDraft && rvInPeriod(tab, k, t.entryDate)).sort(byOldest), [trades, tab, k]);
  const st = useMemo(() => calcStats(period), [period]);
  const def = REVIEW_DEF[tab];
  const fields = [...def.flatMap(s => s.prompts.map(p => p[0])), ...(tab === 'daily' ? period.map(t => `t${t.id}_process`) : [])];
  const done = fields.filter(f => r[f] && String(r[f]).trim()).length;
  const arch = useMemo(() => Object.keys(reviews).filter(x => x.startsWith(tab + ':') && rvFilled(reviews[x])).map(x => x.slice(tab.length + 1)).filter(x => x !== cur).sort((a, b) => b.localeCompare(a)), [reviews, tab, cur]);
  const goal = tab === 'daily' ? (metaAll[k] || {}).processGoal : null;
  const future = k > cur;
  return div('page rv-page', div('page-in jr-in',
    h('aside', { ...rise(1, 'panel side-list-p') },
      div('panel-h', h(Label, null, 'Archive')),
      div('panel-b tight',
        h('button', { type: 'button', className: cx('hrow', k === cur && 'on'), onClick: () => setK(cur) }, span('hrow-t', tab === 'daily' ? 'Today' : tab === 'weekly' ? 'This week' : 'This month'), span('hrow-s', rvFilled(reviews[tab + ':' + cur]) ? 'In progress' : 'Not started')),
        k !== cur && !arch.includes(k) && h('button', { type: 'button', className: 'hrow on' }, span('hrow-t', rvShort(tab, k)), span('hrow-s', 'Not started')),
        arch.slice(0, 120).map(x => h('button', { key: x, type: 'button', className: cx('hrow', x === k && 'on'), onClick: () => setK(x) }, span('hrow-t', rvShort(tab, x)))),
        !arch.length && div('more', 'Past reviews appear here as you write.'))),
    div('jr-main',
      div({ ...rise(0, 'page-head') }, div(null, h(Label, null, 'Structured reflection · timestamped'), h('h1', { className: 'page-title' }, 'Review')), div('grow'), h(Seg, { value: tab, onChange: switchTab, options: [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']] })),
      div({ ...rise(1, 'panel rv-nav') },
        h(IconBtn, { n: 'chevL', tip: 'Earlier', onClick: () => setK(rvShift(tab, k, -1)) }),
        div('rv-per', div('rv-per-t', rvLabel(tab, k)), div('rv-per-s', k === cur ? 'Current' : future ? 'Upcoming' : 'Past')),
        h(IconBtn, { n: 'chevR', tip: 'Later', disabled: k >= cur, onClick: () => setK(rvShift(tab, k, 1)) }),
        tab === 'daily' && h(DateField, { value: k, onChange: setK, className: 'mini-date', marks: new Set(Object.keys(reviews).filter(x => x.startsWith('daily:') && rvFilled(reviews[x])).map(x => x.slice(6))) }),
        k !== cur && h(Btn, { className: 'sm', onClick: () => setK(cur) }, 'Current'),
        div('grow'),
        div('rv-stats', [['Trades', String(st.total)], ['Net P&L', null, st.closed ? st.net : null], ['Win rate', st.winRate === null ? '—' : Math.round(st.winRate) + '%']].map(([l, v, pv]) => div({ key: l, className: 'rv-st' }, h(Label, null, l), v !== null ? div('rv-sv tnum', v) : h(Pnl, { v: pv, className: 'rv-sv' })))),
        h(Ring, { pct: fields.length ? done / fields.length * 100 : 0, size: 46, stroke: 3 }, span('tk-pr tnum', `${done}/${fields.length}`))),
      div({ key, className: 'rv-secs' }, def.map((s, si) => h('section', { key: s.title, ...rise(si + 2, 'panel rv-sec') },
        div('rv-sh', span('ps-ic', h(Icon, { n: s.icon, s: 17 })), div('ps-t', s.title)),
        div('rv-sb',
          si === 0 && goal ? div('rv-goal', h(Label, null, 'Your process goal that day'), div('rv-goal-t', goal)) : null,
          s.trades && (period.length ? period.map(t => div({ key: t.id, className: 'rv-trade' },
            h('button', { type: 'button', className: 'rv-th', onClick: () => UI.openTrade(t.id, period.map(x => x.id)) }, span('trow-sym', tSym(t)), h(DirTag, { dir: tDir(t), small: true }), t.entryTime && span('trow-d', fmtHM(t.entryTime)), h(GradeTag, { g: t.grade }), div('grow'), h(Pnl, { v: t.exitDone ? tPnl(t) : null, unit: t.pnlUnit || '$' }), h(Icon, { n: 'chevR', s: 13, className: 'dim' })),
            h(ReviewPrompt, { text: 'Was risk, entry, stops, exits all done according to process?', value: r[`t${t.id}_process`], ts: r[`t${t.id}_process_ts`], onChange: v => set(`t${t.id}_process`, v) })))
            : div('dt-none', 'No trades logged for this day.')),
          s.prompts.map(([f, n, text]) => h(ReviewPrompt, { key: f, n, text, value: r[f], ts: r[f + '_ts'], onChange: v => set(f, v) })))))))));
}
