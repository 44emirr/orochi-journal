/* ═══════════════════════════════════════════════════════════
   Settings: profile, look, data (backup / restore / import)
   ═══════════════════════════════════════════════════════════ */
/* The backup is assembled piece by piece into a file, so a large chart library never has to fit in one string. */
async function exportBackup() {
  try {
    await flush();
    const data = {}; KEYS.forEach(k => { data[k] = S[k]; });
    const parts = ['{"app":"orochi-journal","version":2,"exportedAt":' + JSON.stringify(new Date().toISOString()) + ',"data":' + JSON.stringify(data) + ',"images":{'];
    let n = 0;
    for (const id of refImgIds()) { const v = await Store.get('img:' + id); if (!v) continue; parts.push((n++ ? ',' : '') + JSON.stringify(id) + ':' + JSON.stringify(v)); }
    parts.push('}}');
    const a = document.createElement('a'); const url = URL.createObjectURL(new Blob(parts, { type: 'application/json' }));
    a.href = url; a.download = `orochi-journal-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 8000);
    commit('meta', m => ({ ...m, lastBackup: Date.now() }));
    toast(`Backup saved to your Downloads folder (${S.trades.length} trades, ${n} charts)`);
  } catch (e) { toast('The backup could not be created', { kind: 'warn' }); }
}
const pickFile = accept => new Promise(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.onchange = () => res(inp.files && inp.files[0] || null); inp.click(); });
async function importFromText(text) {
  let obj; try { obj = JSON.parse(text); } catch (e) { toast('That is not a readable backup file', { kind: 'warn' }); return false; }
  if (obj && obj.app === 'orochi-journal' && obj.data) {
    const n = (obj.data.trades || []).length;
    const r = await confirmDialog({ title: 'Restore this backup?', body: `It holds ${n} ${n === 1 ? 'trade' : 'trades'} from ${String(obj.exportedAt || '').slice(0, 10) || 'an unknown date'}. Replace swaps everything in the journal for the backup. Merge only adds what is missing.`, ok: 'Replace everything', danger: true, extra: [{ label: 'Merge', value: 'merge' }] });
    if (!r) return false;
    try { await restoreBackup(obj, { merge: r === 'merge' }); toast(r === 'merge' ? 'Backup merged in' : 'Backup restored'); return true; } catch (e) { toast(String(e.message || e), { kind: 'warn' }); return false; }
  }
  if (obj && typeof obj === 'object' && hasOldData(obj)) {
    const out = await migrateV1(obj);
    toast(`Imported ${out.trades} trades, ${out.journal} journal entries, ${out.preps} preps, ${out.reviews} reviews`);
    return true;
  }
  toast('That file is not an Orochi Journal backup', { kind: 'warn' }); return false;
}
function Toggle({ on, onChange, label, sub }) {
  return h('button', { type: 'button', className: 'switch-row set-tog', role: 'switch', 'aria-checked': !!on, onClick: () => onChange(!on) }, div('set-tt', div('set-tl', label), sub && div('set-ts', sub)), span('switch', span('switch-k')));
}
function SettingsPage() {
  const s = useS('settings'); const meta = useS('meta'); const trades = useS('trades'); const journal = useS('journal'); const archive = useS('prepArchive'); const reviews = useS('reviews');
  const [busy, setBusy] = useState(false); const [old, setOld] = useState(() => hasOldData()); const [paste, setPaste] = useState(false); const [dump, setDump] = useState('');
  const [usage, setUsage] = useState(null);
  useEffect(() => { try { if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => setUsage(e)).catch(() => {}); } catch (e) {} }, [trades.length]);
  const run = async fn => { if (busy) return; setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const reimport = () => run(async () => {
    const out = await migrateV1(null);
    toast(out.trades || out.journal || out.preps || out.reviews ? `Imported ${out.trades} trades, ${out.journal} journal entries, ${out.preps} preps, ${out.reviews} reviews` : 'Nothing new to import. Everything from the original journal is already here.');
  });
  const erase = async () => {
    const v = await promptDialog({ title: 'Erase everything?', body: 'Every trade, chart, prep, journal entry and review in this journal will be deleted from this browser. Export a backup first if you might want it back. Type ERASE to confirm.', placeholder: 'ERASE', ok: 'Erase' });
    if (v !== 'ERASE') { if (v !== null) toast('Nothing was erased', { kind: 'warn' }); return; }
    await flush(); await Store.clear(); try { localStorage.removeItem('oj2' + NS + ':pending'); } catch (e) {}
    await Store.set('meta', { migratedV1: { at: Date.now(), skipped: true }, welcomed: Date.now() });
    location.reload();
  };
  const mb = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
  const nImgs = useMemo(() => refImgIds().size, [trades, archive]);
  const lb = meta.lastBackup; const since = lb ? trades.filter(t => (t.createdAt || 0) > lb).length : trades.length;
  return div('page set', div('page-in set-in',
    div({ ...rise(0, 'page-head') }, div(null, h(Label, null, 'Orochi Journal · version 2'), h('h1', { className: 'page-title' }, 'Settings'))),
    Store.mode !== 'idb' && div({ ...rise(1, 'panel set-warn') }, h(Icon, { n: 'alert', s: 18 }), div(null, div('set-tl', Store.mode === 'mem' ? 'This browser is blocking storage. Nothing you enter will be saved.' : 'Running on limited storage.'), div('set-ts', Store.mode === 'mem' ? 'Open the journal file directly in Chrome or Edge (not inside a preview or private window).' : 'Chart screenshots may fill it quickly. Export backups often.'))),
    div('set-grid',
      div({ ...rise(1, 'panel') }, div('panel-h', h(Icon, { n: 'user', s: 15 }), h(Label, null, 'Profile')), div('panel-b set-b',
        h(Field, { label: 'Name' }, h('input', { className: 'inp', value: s.name || '', maxLength: 40, placeholder: 'Your name', onChange: e => Act.setSetting({ name: e.target.value }) })))),
      div({ ...rise(2, 'panel') }, div('panel-h', h(Icon, { n: 'drop', s: 15 }), h(Label, null, 'Look and motion')), div('panel-b set-b',
        h(Toggle, { on: s.color, onChange: v => Act.setSetting({ color: v }), label: 'Colour for wins and losses', sub: 'Off keeps everything pure black and white. Wins are solid, losses are dimmed or hatched.' }),
        h(Toggle, { on: s.motion !== false, onChange: v => Act.setSetting({ motion: v }), label: 'Motion', sub: 'Count-ups, drawing charts, transitions and the living background.' }),
        h(Toggle, { on: s.intro !== false, onChange: v => Act.setSetting({ intro: v }), label: 'Opening sequence', sub: 'The logo reveal when the journal starts. Any key skips it.' }))),
      div({ ...rise(3, 'panel set-data') }, div('panel-h', h(Icon, { n: 'database', s: 15 }), h(Label, null, 'Your data')), div('panel-b set-b',
        div('set-counts', [['Trades', trades.filter(t => !t.isDraft).length], ['Drafts', trades.filter(t => t.isDraft).length], ['Charts', nImgs], ['Journal entries', journal.length], ['Preps saved', archive.length], ['Reviews', Object.values(reviews).filter(rvFilled).length]].map(([l, v]) => div({ key: l, className: 'set-c' }, div('set-cv tnum', v), h(Label, null, l)))),
        div('set-ts', 'Everything lives in this browser on this computer', usage && usage.usage ? ` (${mb(usage.usage)} used)` : '', '. Nothing is uploaded anywhere. A backup file is the only copy outside the browser, so make one regularly.'),
        div(cx('set-backup', since >= 10 && 'due'), div(null, div('set-tl', lb ? `Last backup ${new Date(lb).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No backup yet'), div('set-ts', since ? `${since} ${since === 1 ? 'trade' : 'trades'} logged since then` : 'Up to date')), div('grow'), h(Btn, { kind: 'solid', icon: 'download', disabled: busy, onClick: () => run(exportBackup) }, 'Export backup')),
        div('set-row', h(Btn, { icon: 'upload', disabled: busy, onClick: () => run(async () => { const f = await pickFile('.json,application/json'); if (f) await importFromText(await f.text()); }) }, 'Restore from backup'),
          h(Btn, { icon: 'download', disabled: !trades.length, onClick: () => { downloadText(`orochi-trades-${today()}.csv`, tradesCsv(trades.filter(t => !t.isDraft)), 'text/csv'); toast('Trades exported as CSV'); } }, 'Trades as CSV')))),
      div({ ...rise(4, 'panel') }, div('panel-h', h(Icon, { n: 'refresh', s: 15 }), h(Label, null, 'Original journal')), div('panel-b set-b',
        div('set-ts', meta.migratedV1 && !meta.migratedV1.none && !meta.migratedV1.skipped ? `Imported on ${new Date(meta.migratedV1.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${meta.migratedV1.trades || 0} trades, ${meta.migratedV1.images || 0} charts, ${meta.migratedV1.journal || 0} journal entries. The original file and its data were left untouched.` : old ? 'Data from the original journal was found in this browser.' : 'No data from the original journal is visible to this file.'),
        div('set-row', h(Btn, { icon: 'refresh', disabled: busy || !old, onClick: reimport }, busy ? 'Working…' : 'Import again (adds only what is missing)'), h(Btn, { kind: 'ghost', onClick: () => setPaste(p => !p) }, paste ? 'Hide manual import' : 'Manual import')),
        paste && div('set-paste', div('set-ts', 'If the old journal was used in a different browser: open it there, press F12, click Console, paste the line below and press Enter. It copies the old data. Then paste it in the box and press Import.'),
          h('pre', { className: 'set-code' }, 'copy(JSON.stringify(localStorage))'),
          h('textarea', { className: 'inp area', rows: 3, value: dump, placeholder: 'Paste the copied data here', onChange: e => setDump(e.target.value) }),
          div('set-row', h(Btn, { kind: 'solid', disabled: !dump.trim() || busy, onClick: () => run(async () => { if (await importFromText(dump)) { setDump(''); setPaste(false); setOld(hasOldData()); } }) }, 'Import'))))),
      div({ ...rise(5, 'panel') }, div('panel-h', h(Icon, { n: 'kbd', s: 15 }), h(Label, null, 'Keyboard')), div('panel-b', SHORTCUTS.map(([k, v]) => div({ key: k, className: 'kv' }, span('kv-k', v), h(Kbd, null, k))))),
      div({ ...rise(6, 'panel') }, div('panel-h', h(Icon, { n: 'alert', s: 15 }), h(Label, null, 'Danger zone')), div('panel-b set-b', div('set-ts', 'Deletes the journal from this browser. Your original journal file is not affected.'), div('set-row', h(Btn, { kind: 'danger', icon: 'trash', onClick: erase }, 'Erase everything')))))));
}
