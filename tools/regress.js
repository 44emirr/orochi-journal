/* Regression run for the journal build. Loaded in the page by the test harness; never part of the journal file. */
window.__regress = async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const errs = []; window.addEventListener('error', e => errs.push('ERR ' + e.message)); window.addEventListener('unhandledrejection', e => errs.push('REJ ' + (e.reason && e.reason.message || e.reason)));
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byText = (sel, txt, r = document) => $$(sel, r).find(e => e.textContent.trim() === txt) || $$(sel, r).find(e => e.textContent.trim().startsWith(txt));
  const setVal = (el, v) => { const p = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  const key = (el, k, o = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));
  const S = __OJ.S; const log = []; const ok = (name, cond, extra) => log.push((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !cond ? ' :: ' + JSON.stringify(extra) : ''));
  const alive = () => document.getElementById('root').children.length > 0;
  const step = async (name, fn) => { try { await fn(); } catch (e) { log.push('FAIL ' + name + ' threw :: ' + (e && e.message)); } };
  __OJ.Act.setSetting({ motion: false }); await sleep(100);

  await step('prep', async () => {
    __OJ.UI.go('prep'); await sleep(300);
    ok('prep renders', !!$('.page.prep .ps'));
    byText('.prep-bar .seg-b', 'Weekly').click(); await sleep(200);
    ok('weekly has 7 sections', $$('.page.prep .ps').length === 7, $$('.page.prep .ps').length);
    const vw = $$('.page.prep .ps')[1]; const vin = $$('.ll-i', vw);
    ok('vwap has 4 labelled lines', vin.length === 4 && $$('.ll-lab', vw).length === 4, vin.length);
    setVal(vin[0], 'above, rising'); await sleep(60);
    ok('vwap value stored', S.preps[0].weeklyContent.vwap[0].text === 'above, rising');
    setVal($('.ll-i', $$('.page.prep .ps')[0]), 'CPI Thursday'); await sleep(60);
    const hy = $$('.page.prep .ps')[5]; setVal($$('.ll-i', hy)[0], 'Accept above VAH'); await sleep(60); if (!$$('.ll-gb', $$('.page.prep .ps')[5])[0].classList.contains('on')) { $$('.ll-gb', $$('.page.prep .ps')[5])[0].click(); await sleep(60); }
    ok('hypo grade set', S.preps[0].weeklyContent.hypos.long[0].grade === 'A', S.preps[0].weeklyContent.hypos);
    setVal($$('textarea', $$('.page.prep .ps')[6])[0], '25100 / 25180'); await sleep(60);
    ok('sand stored', S.preps[0].weeklyContent.lines.bullST === '25100 / 25180');
    const pre = $('.prep-pre').textContent;
    ok('formatted export content', pre.includes('*CPI Thursday*') && pre.includes('`Y` - above, rising') && pre.includes('**A** — Accept above VAH') && pre.includes('`Bull Short Term` - 25100 / 25180'), pre.slice(0, 400));
    ok('export skips blank labelled lines', !pre.includes('Quarterly VWAP'));
    byText('.prep-exp .seg-b', 'Clean').click(); await sleep(100);
    const pre2 = $('.prep-pre').textContent;
    ok('clean export content', pre2.includes('*Impactful news: — CPI Thursday*') && pre2.includes('- Y – above, rising') && pre2.includes('### **Long Hypos**') && !pre2.includes('Quarterly'), pre2.slice(0, 400));
    const undoBtn = byText('.page-head .btn', 'Undo'); ok('undo enabled', undoBtn && !undoBtn.disabled);
    undoBtn.click(); await sleep(100);
    ok('undo reverted last change', !S.preps[0].weeklyContent.lines || !S.preps[0].weeklyContent.lines.bullST, S.preps[0].weeklyContent.lines);
    byText('.page-head .btn', 'New pair').click(); await sleep(200);
    ok('new pair added', S.preps.length === 2 && $$('.ptab').length === 2, S.preps.length);
    $$('.ptab-b')[0].click(); await sleep(150);
    $$('.ptab-x')[1].click(); await sleep(200); ok('delete pair asks first', !!$('.dlg')); byText('.dlg .btn', 'Remove').click(); await sleep(250);
    ok('pair removed', S.preps.length === 1, S.preps.length);
    await sleep(900);
    ok('archive snapshot saved', S.prepArchive.some(a => a.prepType === 'weekly' && a.date === S.preps[0].date), S.prepArchive.map(a => a.key));
    byText('.prep-bar .seg-b', 'Daily').click(); await sleep(200);
    ok('daily has 3 sections', $$('.page.prep .ps').length === 3);
    const hrows = $$('.prep-hist .hrow');
    if (hrows[1]) { hrows[1].click(); await sleep(200); ok('archive view is read only', !!$('.prep-view') && $$('.page.prep .ll-i').every(i => i.readOnly)); byText('.prep-view .btn', 'Back to current').click(); await sleep(150); ok('back to current', !$('.prep-view')); }
    ok('alive after prep', alive());
  });

  await step('journal', async () => {
    __OJ.UI.go('journal'); await sleep(300);
    const n0 = S.journal.length;
    $('.jr-goal-t').click(); await sleep(100); const gi = $('.jr-goal-i'); ok('goal input opens', !!gi); setVal(gi, 'Only A+ setups, max 2 trades'); await sleep(60); key(gi, 'Enter'); await sleep(100);
    ok('goal saved', Object.values(S.journalMeta).some(m => m.processGoal === 'Only A+ setups, max 2 trades'));
    setVal($('.jr-econ textarea'), 'CPI 8:30'); await sleep(60);
    ok('econ notes saved', Object.values(S.journalMeta).some(m => m.econNotes === 'CPI 8:30'));
    byText('.jsec', 'Deviations').click(); await sleep(80); setVal($('.jr-ta'), 'Moved my stop early.'); await sleep(60); byText('.jr-box-f .btn', 'Log entry').click(); await sleep(150);
    ok('journal entry added', S.journal.length === n0 + 1 && S.journal[0].section === 'deviations');
    const before = S.journal.length; $('.tl-x').click(); await sleep(150); ok('entry deleted', S.journal.length === before - 1);
    const undo = byText('.toast-a', 'Undo'); if (undo) undo.click(); await sleep(150); ok('entry restored by undo', S.journal.length === before);
    ok('alive after journal', alive());
  });

  await step('review', async () => {
    __OJ.UI.go('review'); await sleep(300);
    setVal($$('.rv-sec textarea')[0], '3 of 4 trades followed the process goal.'); await sleep(80);
    const rk = Object.keys(S.reviews).find(k => k.startsWith('daily:') && S.reviews[k].process);
    ok('daily review saved with timestamp', !!rk && S.reviews[rk].process_ts > 0, rk);
    ok('process goal shown in review', !!$('.rv-goal'));
    byText('.page-head .seg-b', 'Weekly').click(); await sleep(200);
    ok('weekly review renders', $$('.rv-sec').length === 3 && /Week of/.test($('.rv-per-t').textContent), $('.rv-per-t').textContent);
    setVal($$('.rv-sec textarea')[1], 'Patience at the open.'); await sleep(80);
    ok('weekly keys are Mondays', Object.keys(S.reviews).filter(k => k.startsWith('weekly:')).every(k => new Date(k.slice(7) + 'T00:00').getDay() === 1), Object.keys(S.reviews));
    $('.rv-nav [aria-label="Earlier"]').click(); await sleep(150); ok('previous week', $('.rv-per-s').textContent === 'Past');
    byText('.page-head .seg-b', 'Monthly').click(); await sleep(200);
    ok('monthly review renders', $$('.rv-sec').length === 4, $('.rv-per-t').textContent);
    ok('alive after review', alive());
  });

  await step('dashboard', async () => {
    __OJ.UI.go('dashboard'); await sleep(300);
    for (const r of ['Today', '7D', '30D', 'This Month', 'Last Month', 'All Time']) { byText('.dash-top .seg-b', r).click(); await sleep(120); if (!alive()) break; }
    ok('range switching', alive() && !!$('.hero-num'));
    const day = $('.mcal-d.has'); if (day) { day.click(); await sleep(200); ok('day modal lists trades', !!$('.modal.day') && $$('.modal.day .trow').length > 0); $('.modal.day [aria-label="Close"]').click(); await sleep(150); }
    $('.mcal [aria-label="Previous month"]').click(); await sleep(100); $('.mcal [aria-label="Next month"]').click(); await sleep(100);
    ok('loop shows progress', $$('.loop-n.done').length >= 2, $$('.loop-n.done').length);
    ok('alive after dashboard', alive());
  });

  await step('log', async () => {
    __OJ.UI.go('log'); await sleep(300);
    $$('.page-head .seg-b')[1].click(); await sleep(200); ok('list view', !!$('.tt tbody tr'));
    $('.menu-b').click(); await sleep(150); byText('.menu-i', 'Best P&L').click(); await sleep(200);
    const firstPnl = $('.tt tbody tr .pnl').textContent; const best = Math.max(...S.trades.filter(t => t.exitDone && t.pnl !== null && !t.isDraft).map(t => t.pnl));
    ok('sorted by best P&L', firstPnl.replace(/[^0-9.]/g, '') === best.toFixed(2), [firstPnl, best]);
    const st0 = S.trades.filter(t => t.starred).length; $('.tt .tc-star').click(); await sleep(120); ok('star toggled', S.trades.filter(t => t.starred).length !== st0);
    $('.tt .tc-star').click(); await sleep(100);
    $$('.page-head .seg-b')[0].click(); await sleep(150); $('.menu-b').click(); await sleep(120); byText('.menu-i', 'Newest').click(); await sleep(150);
    const pn = $('[aria-label="Next page"]'); if (pn) { pn.click(); await sleep(150); ok('second page', /^13/.test($('.pager-t').textContent), $('.pager-t').textContent); }
    ok('alive after log', alive());
  });

  await step('composer text tools', async () => {
    __OJ.UI.newTrade(); await sleep(300);
    const rts = $$('.composer .rt'); ok('two rich text boxes', rts.length === 2, rts.length);
    const rta = $('.rt-ta', rts[0]); setVal(rta, 'Plan line'); await sleep(60); $('.rt-ta', rts[0]).focus(); $('.rt-ta', rts[0]).setSelectionRange(0, 4); $('[aria-label="Bold (Ctrl+B)"]', rts[0]).click(); await sleep(120);
    ok('bold wraps the selection', $('.rt-ta', rts[0]).value === '**Plan** line', $('.rt-ta', rts[0]).value);
    $('[aria-label="Heading"]', rts[0]).click(); await sleep(120); ok('heading toggles', $('.rt-ta', rts[0]).value.startsWith('## '), $('.rt-ta', rts[0]).value);
    $('.tpl', $$('.composer .rt')[1]).click(); await sleep(200); ok('template list opens', !!$('.tpl-pop')); $('.tpl-i').click(); await sleep(250);
    ok('template applied', $('.rt-ta', $$('.composer .rt')[1]).value.includes('## What happened'));
    ok('highlight layer matches text', $('.rt-hl', $$('.composer .rt')[1]).textContent.includes('What happened'));
    key(document, 'Escape'); await sleep(250); const d2 = byText('.dlg .btn', 'Discard'); ok('leaving asks first, safe button focused', !!d2 && document.activeElement.textContent === 'Keep editing', document.activeElement.textContent); if (d2) d2.click(); await sleep(250);
    ok('composer closed cleanly', !$('.composer') && __OJ.layers.length === 0, __OJ.layers.length);
  });

  await step('inline reflection', async () => {
    const nr = S.trades.find(t => t.exitDone && !t.isDraft && !(t.reflection && t.reflection.trim().length > 10));
    if (!nr) return;
    __OJ.UI.openTrade(nr.id); await sleep(300); const dta = $('.detail .rt-ta'); ok('reflection box in detail', !!dta); setVal(dta, 'Reviewed: entered late, exit was on plan.'); await sleep(80); byText('.detail .btn', 'Save reflection').click(); await sleep(200);
    ok('reflection saved, state becomes Reviewed', S.trades.find(t => t.id === nr.id).reflection.startsWith('Reviewed:') && $('.detail .state').textContent === 'Reviewed');
    __OJ.Act.patchTrade(nr.id, { reflection: '' }); $('.detail [aria-label="Close (Esc)"]').click(); await sleep(200);
  });

  await step('settings', async () => {
    __OJ.UI.go('settings'); await sleep(300);
    const tg = $$('.set-tog'); tg[0].click(); await sleep(120); ok('colour mode on', document.documentElement.dataset.color === 'on' && S.settings.color === true); $$('.set-tog')[0].click(); await sleep(120); ok('colour mode off', document.documentElement.dataset.color === 'off');
    const b = await __OJ.buildBackup(); ok('backup builds', b.app === 'orochi-journal' && b.data.trades.length === S.trades.length);
    ok('alive after settings', alive());
  });

  await step('palette and help', async () => {
    __OJ.UI.palette(); await sleep(200); ok('palette opens', !!$('.pal')); setVal($('.pal input'), 'analyt'); await sleep(120); ok('palette filters', $$('.pal-i').length === 1, $$('.pal-i').length); key($('.pal input'), 'Enter'); await sleep(400);
    ok('palette navigates', !!$('.page.an'));
    __OJ.UI.help(); await sleep(200); ok('help opens', !!$('.help')); key(document, 'Escape'); await sleep(250); ok('help closes with Esc', !$('.help') && __OJ.layers.length === 0);
  });
  await __OJ.flush();
  return { passed: log.filter(l => l.startsWith('PASS')).length, fails: log.filter(l => l.startsWith('FAIL')), errs, alive: alive() };
};
