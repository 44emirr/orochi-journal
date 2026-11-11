/* ═══════════════════════════════════════════════════════════
   Import from the original journal + prep definitions/export
   ═══════════════════════════════════════════════════════════ */
function oldSource(dump) {
  if (dump) return { get: k => dump[k] === undefined ? null : dump[k], keys: () => Object.keys(dump) };
  return {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    keys: () => { const o = []; try { for (let i = 0; i < localStorage.length; i++) o.push(localStorage.key(i)); } catch (e) {} return o; },
  };
}
function hasOldData(dump) {
  const src = oldSource(dump);
  return ['orochi_trades', 'orochi_journal', 'orochi_preps', 'orochi_prep_archive'].some(k => { const v = src.get(k); return v && v.length > 2; })
    || src.keys().some(k => k && /^(review_(daily|weekly|monthly)_|journal_meta_)/.test(k));
}
async function migrateV1(dump, onProgress) {
  const src = oldSource(dump);
  const J = k => { try { return JSON.parse(src.get(k) || 'null'); } catch (e) { return null; } };
  const out = { trades: 0, journal: 0, preps: 0, reviews: 0, images: 0, dateFixes: 0 };
  const tzBehind = new Date().getTimezoneOffset() > 0;
  const isTs = v => typeof v === 'number' && v > 1e12 && v < 1e13;
  const utcYmd = ts => new Date(ts).toISOString().slice(0, 10);
  const fixDate = (d, ts) => {
    if (!tzBehind || !isYmd(d) || !isTs(ts)) return d;
    const u = utcYmd(ts), l = ymd(new Date(ts));
    if (d === u && u !== l) { out.dateFixes++; return l; }
    return d;
  };
  const seen = new Map();
  const putImgs = async arr => {
    const ids = [];
    for (const s of (arr || [])) {
      if (typeof s !== 'string' || !s.startsWith('data:image')) continue;
      if (seen.has(s)) { ids.push(seen.get(s)); continue; }
      try { const id = await Img.put(s); seen.set(s, id); ids.push(id); out.images++; if (onProgress) onProgress(out); } catch (e) {}
    }
    return [...new Set(ids)];
  };
  const oldImgs = o => (Array.isArray(o.chartImages) && o.chartImages.length) ? o.chartImages : (o.chartImg ? [o.chartImg] : []);

  /* trades */
  const have = new Set(S.trades.map(t => t.id));
  const trades = [];
  for (const t of (J('orochi_trades') || [])) {
    if (!t || typeof t !== 'object') continue;
    const id = t.id || uid(); if (have.has(id)) continue; have.add(id);
    const o = normTrade({ ...t, id, images: await putImgs(oldImgs(t)) });
    const d0 = o.entryDate; o.entryDate = fixDate(o.entryDate, id); if (o.entryDate !== d0 && o.exitDate === d0) o.exitDate = o.entryDate;
    o.createdAt = isTs(id) ? id : Date.now(); o.updatedAt = o.createdAt;
    trades.push(o); out.trades++; if (onProgress) onProgress(out);
  }
  if (trades.length) commit('trades', [...trades, ...S.trades]);

  /* journal */
  const haveJ = new Set(S.journal.map(e => e.id));
  const jr = [];
  (J('orochi_journal') || []).forEach(e => {
    if (!e || !e.text || haveJ.has(e.id)) return;
    const ts = isTs(e.ts) ? e.ts : Date.now();
    jr.push({ id: e.id || uid(), section: e.section || 'observations', text: String(e.text), ts, date: fixDate(toYmd(e.date) || ymd(new Date(ts)), ts) });
    out.journal++;
  });
  if (jr.length) commit('journal', [...jr, ...S.journal].sort((a, b) => b.ts - a.ts));
  const meta = { ...S.journalMeta };
  src.keys().forEach(k => {
    const m = /^journal_meta_(\d{4}-\d{2}-\d{2})$/.exec(k || ''); if (!m) return;
    const v = J(k); if (v && typeof v === 'object' && (v.processGoal || v.econNotes) && !meta[m[1]]) meta[m[1]] = { processGoal: v.processGoal || '', econNotes: v.econNotes || '' };
  });
  commit('journalMeta', meta);

  /* preps */
  if (!S.preps.length) {
    const preps = [];
    for (const p of (J('orochi_preps') || [])) {
      if (!p || typeof p !== 'object') continue;
      preps.push({ id: p.id || uid(), label: p.label || 'Main', prepType: p.prepType === 'weekly' ? 'weekly' : 'daily', date: today(), instrument: p.instrument || '', dailyContent: p.dailyContent || {}, weeklyContent: p.weeklyContent || {}, images: await putImgs(oldImgs(p)) });
      out.preps++;
    }
    if (preps.length) commit('preps', preps);
  }
  const haveA = new Set(S.prepArchive.map(a => a.key));
  const arch = [];
  for (const a of (J('orochi_prep_archive') || [])) {
    if (!a || typeof a !== 'object') continue;
    const date = fixDate(toYmd(a.date) || today(), a.savedAt);
    const type = a.prepType === 'weekly' ? 'weekly' : 'daily';
    const key = `${date}||${a.instrument || ''}||${type}`;
    if (haveA.has(key)) continue; haveA.add(key);
    arch.push({ key, date, instrument: a.instrument || '', prepType: type, dailyContent: a.dailyContent || {}, weeklyContent: a.weeklyContent || {}, images: await putImgs(oldImgs(a)), savedAt: a.savedAt || Date.now() });
    out.preps++;
  }
  if (arch.length) commit('prepArchive', [...arch, ...S.prepArchive].sort((a, b) => b.savedAt - a.savedAt).slice(0, 400));

  /* reviews */
  const rv = { ...S.reviews };
  const filled = o => o && typeof o === 'object' && Object.values(o).some(v => typeof v === 'string' && v.trim());
  src.keys().forEach(k => {
    const m = /^review_(daily|weekly|monthly)_(.+)$/.exec(k || ''); if (!m) return;
    const v = J(k); if (!filled(v)) return;
    let key = null;
    if (m[1] === 'daily' && isYmd(m[2])) {
      const tss = Object.entries(v).filter(([f, x]) => f.endsWith('_ts') && isTs(x)).map(([, x]) => x);
      key = 'daily:' + (tss.length ? fixDate(m[2], Math.min(...tss)) : m[2]);
    } else if (m[1] === 'weekly' && isYmd(m[2])) key = 'weekly:' + mondayOf(m[2]);
    else if (m[1] === 'monthly') { const mm = /^(\d{4})_(\d{1,2})$/.exec(m[2]); if (mm) key = `monthly:${mm[1]}-${pad2(Number(mm[2]) + 1)}`; }
    if (key && !filled(rv[key])) { rv[key] = v; out.reviews++; }
  });
  commit('reviews', rv);

  /* profile + instruments */
  const ud = J('orochi_userdata');
  if (ud && ud.name && !S.settings.name) Act.setSetting({ name: String(ud.name).trim() });
  const cp = J('orochi_custom_pairs'), rp = J('orochi_recent_pairs');
  commit('pairs', p => ({ custom: [...new Set([...p.custom, ...(Array.isArray(cp) ? cp : [])])], recent: p.recent.length ? p.recent : (Array.isArray(rp) ? rp : []).slice(0, 6) }));
  commit('meta', m => ({ ...m, migratedV1: { at: Date.now(), ...out } }));
  await flush();
  return out;
}

/* ═══════════════ Prep sections ═══════════════ */
const PREP_DAILY = [
  { id: 'bias', title: 'Bias & Narrative', icon: 'target', hint: 'What is the dominant narrative driving price? Your directional conviction.', kind: 'bias' },
  { id: 'hypos', title: 'Hypos', icon: 'bulb', hint: 'Your A-plan and B-plan.', kind: 'hypo' },
  { id: 'lines', title: 'Lines in the Sand', icon: 'layers', hint: 'Your key price levels — bull and bear.', kind: 'sand' },
];
const PREP_WEEKLY = [
  { id: 'news', title: 'Market News & Events', icon: 'news', hint: 'Upcoming data releases, earnings, central bank events, geopolitical risks.' },
  { id: 'vwap', title: 'VWAP', icon: 'trend', hint: 'Yearly, Quarterly, Monthly, Weekly — is price above or below?', prefilled: ['Yearly VWAP: ', 'Quarterly VWAP: ', 'Monthly VWAP: ', 'Weekly VWAP: '] },
  { id: 'rvwap', title: 'RVWAP', icon: 'refresh', hint: '7D, 30D, 90D, 365D rolling anchored VWAPs — trend and momentum context.', prefilled: ['7D RVWAP: ', '30D RVWAP: ', '90D RVWAP: ', '365D RVWAP: '] },
  { id: 'profile', title: 'Profile', icon: 'bars', hint: 'Where is price relative to value areas? TPO profiles, composite structure.', prefilled: ['Profile Structure: ', 'Current Position: ', 'Read: '] },
  ...PREP_DAILY,
];
const prepSections = type => type === 'weekly' ? PREP_WEEKLY : PREP_DAILY;
const prepDefaultValue = s => s.kind === 'hypo' ? { long: [{ text: '', grade: '' }], short: [{ text: '', grade: '' }] }
  : s.kind === 'sand' ? { bullST: '', bullLT: '', bearST: '', bearLT: '' }
  : s.kind === 'bias' ? { overallBias: [{ text: '' }], narrative: [{ text: '' }] }
  : s.prefilled ? s.prefilled.map(p => ({ label: p, text: '' })) : [{ label: '', text: '' }];
const prepSectionFilled = (s, v) => {
  if (!v) return false;
  if (s.kind === 'bias' && typeof v === 'object' && !Array.isArray(v)) return [...(Array.isArray(v.overallBias) ? v.overallBias : []), ...(Array.isArray(v.narrative) ? v.narrative : [])].some(l => l && l.text && l.text.trim());
  if (s.kind === 'hypo' && typeof v === 'object' && !Array.isArray(v)) return [...(Array.isArray(v.long) ? v.long : []), ...(Array.isArray(v.short) ? v.short : [])].some(l => l && l.text && l.text.trim());
  if (Array.isArray(v)) return v.some(l => l && l.text && l.text.trim());
  if (typeof v === 'object') return Object.values(v).some(x => typeof x === 'string' && x.trim());
  return false;
};
const newPrep = (label) => ({ id: uid(), label: label || 'Main', prepType: 'daily', date: today(), instrument: '', dailyContent: {}, weeklyContent: {}, images: [] });

/* Export text — output format kept identical to the original journal (Discord-ready). */
function prepLines(content, sId) {
  const val = content[sId];
  if (!val) return [];
  const raw = l => (typeof l === 'string' ? l : (l.label || '') + (l.text || '')).trim();
  /* a labelled line with nothing typed after it is skipped (the original printed the bare label) */
  const blankLabelled = l => !!(l && typeof l === 'object' && l.label && !String(l.text || '').trim());
  const mapped = map => !Array.isArray(val) ? [] : val.map(l => {
    if (blankLabelled(l)) return null;
    const r = raw(l);
    for (const [p, s] of Object.entries(map)) { if (r.startsWith(p)) { const v = r.slice(p.length).trim(); return v ? '`' + s + '` - ' + v : null; } }
    return r || null;
  }).filter(Boolean);
  if (sId === 'news') { if (!Array.isArray(val)) return []; return val.map(l => { const t = (l.label || l.text || '').trim(); return t ? '*' + t + '*' : null; }).filter(Boolean); }
  if (sId === 'vwap') return mapped({ 'Yearly VWAP: ': 'Y', 'Quarterly VWAP: ': 'Q', 'Monthly VWAP: ': 'M', 'Weekly VWAP: ': 'W' });
  if (sId === 'rvwap') return mapped({ '7D RVWAP: ': '7D', '30D RVWAP: ': '30D', '90D RVWAP: ': '90D', '365D RVWAP: ': '365D' });
  if (sId === 'profile') return mapped({ 'Profile Structure: ': 'Profile Structure', 'Current Position: ': 'Current Position', 'Read: ': 'Read' });
  if (sId === 'bias') {
    if (typeof val === 'object' && !Array.isArray(val)) {
      const ob = (Array.isArray(val.overallBias) ? val.overallBias : [{ text: val.overallBias || '' }]).filter(l => l.text && l.text.trim());
      const nar = (Array.isArray(val.narrative) ? val.narrative : [{ text: val.narrative || '' }]).filter(l => l.text && l.text.trim());
      const lines = [];
      if (ob.length) { lines.push('`Overall Bias`'); ob.forEach(l => lines.push('- ' + l.text.trim())); }
      if (ob.length && nar.length) lines.push('');
      if (nar.length) { lines.push('`Narrative`'); nar.forEach(l => lines.push('- ' + l.text.trim())); }
      return lines;
    }
    return mapped({ 'Overall Bias: ': 'Overall Bias', 'Narrative: ': 'Narrative' });
  }
  if (sId === 'lines') {
    if (typeof val !== 'object' || Array.isArray(val)) return [];
    const f = arr => arr.map(([k, label]) => { const v = (val[k] || '').trim(); return v ? '`' + label + '` - ' + v : null; }).filter(Boolean);
    const bull = f([['bullST', 'Bull Short Term'], ['bullLT', 'Bull Long Term']]), bear = f([['bearST', 'Bear Short Term'], ['bearLT', 'Bear Long Term']]);
    const res = [...bull]; if (bull.length && bear.length) res.push(''); res.push(...bear); return res;
  }
  if (sId === 'hypos') {
    if (typeof val !== 'object' || Array.isArray(val)) return [];
    const lines = [];
    const proc = (arr, label) => {
      const filled = Array.isArray(arr) ? arr.filter(l => l && l.text && l.text.trim()) : [];
      if (filled.length) { lines.push('`' + label + '`'); filled.forEach(l => lines.push('- ' + (l.grade ? ' **' + l.grade + '** — ' : '') + l.text.trim())); }
      return filled.length;
    };
    if (Array.isArray(val.long) || Array.isArray(val.short)) {
      const lHas = proc(val.long, 'Long'), sHas = proc(val.short, 'Short');
      if (lHas && sHas) lines.splice(lines.indexOf('`Short`'), 0, '');
    } else {
      const a = String(val.long !== undefined ? val.long || '' : val.bull || '').split('\n').filter(Boolean);
      const b = String(val.short !== undefined ? val.short || '' : val.bear || '').split('\n').filter(Boolean);
      const [la, lb] = val.long !== undefined || val.short !== undefined ? ['Long', 'Short'] : ['Bullish', 'Bearish'];
      if (a.length) { lines.push('`' + la + '`'); a.forEach(l => lines.push('- ' + l)); }
      if (a.length && b.length) lines.push('');
      if (b.length) { lines.push('`' + lb + '`'); b.forEach(l => lines.push('- ' + l)); }
    }
    return lines;
  }
  if (Array.isArray(val)) return val.map(raw).filter(Boolean);
  return [];
}
function prepExport(prep, mode) {
  const type = prep.prepType === 'weekly' ? 'weekly' : 'daily';
  const content = (type === 'daily' ? prep.dailyContent : prep.weeklyContent) || {};
  const sections = prepSections(type);
  const ticker = prep.instrument || 'TICKER';
  const typeLabel = type === 'weekly' ? 'Weekly' : 'Daily';
  const d = isYmd(prep.date) ? prep.date : today();
  if (mode !== 'clean') {
    const ESC = '\u001b', T3 = '```';
    const block = hd => T3 + 'ansi\n' + ESC + '[0;31m' + hd + ESC + '[0m\n' + T3;
    const parts = ['# **' + ticker + ' Review**', '### *' + typeLabel + ' Prep / ' + fmtDate(d) + '*', ''];
    sections.forEach(s => {
      const lines = prepLines(content, s.id);
      if (s.id === 'news') parts.push(block(s.title) + '\n' + (lines.length ? lines.map(l => '- ' + l).join('\n') : '- '));
      else if (s.id === 'hypos') parts.push(block('Hypos') + (lines.length ? '\n' + lines.join('\n') : ''));
      else parts.push(block(s.title) + (lines.length ? '\n' + lines.join('\n') : ''));
      parts.push('');
    });
    parts.push('*— Orochi Trading Journal - ' + typeLabel + ' Prep*');
    return parts.join('\n');
  }
  const parts = ['# **' + ticker + ' Review**', '### *' + typeLabel + ' Prep / ' + fmtDate(d, { month: 'long', day: 'numeric' }) + '*'];
  const raw = l => (typeof l === 'string' ? l : (l.label || '') + (l.text || '')).trim();
  if (sections.some(s => s.id === 'news') && Array.isArray(content.news)) {
    const t = content.news.map(l => (l.label || l.text || '').trim()).filter(Boolean).join('. ');
    if (t) parts.push('*Impactful news: — ' + t + '*');
  }
  const short = (val, map) => { if (!Array.isArray(val)) return; val.forEach(l => { if (l && typeof l === 'object' && l.label && !String(l.text || '').trim()) return; const r = raw(l); for (const [p, sh] of Object.entries(map)) { if (r.startsWith(p)) { const v = r.slice(p.length).trim(); if (v) parts.push('- ' + (sh ? sh + ' – ' : '') + v); return; } } if (r) parts.push('- ' + r); }); };
  sections.forEach(s => {
    if (s.id === 'news') return;
    parts.push('', '---', '## **' + s.title + '**');
    const val = content[s.id];
    if (s.id === 'vwap') short(val, { 'Yearly VWAP: ': 'Y', 'Quarterly VWAP: ': 'Q', 'Monthly VWAP: ': 'M', 'Weekly VWAP: ': 'W' });
    else if (s.id === 'rvwap') short(val, { '7D RVWAP: ': '7D', '30D RVWAP: ': '30D', '90D RVWAP: ': '90D', '365D RVWAP: ': '365D' });
    else if (s.id === 'profile') short(val, { 'Profile Structure: ': '', 'Current Position: ': '', 'Read: ': '' });
    else if (s.id === 'bias') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const ob = (Array.isArray(val.overallBias) ? val.overallBias : []).filter(l => l.text && l.text.trim());
        const nar = (Array.isArray(val.narrative) ? val.narrative : []).filter(l => l.text && l.text.trim());
        if (ob.length) { parts.push('### **Overall Bias**'); ob.forEach(l => parts.push('- ' + l.text.trim())); }
        if (nar.length) { parts.push('### **Narrative**'); nar.forEach(l => parts.push('- ' + l.text.trim())); }
      } else short(val, { 'Overall Bias: ': '', 'Narrative: ': '' });
    } else if (s.id === 'hypos') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const push = (arr, hd) => { const f = (Array.isArray(arr) ? arr : String(arr || '').split('\n').filter(Boolean).map(text => ({ text }))).filter(l => l && l.text && l.text.trim()); if (f.length) { parts.push('### **' + hd + '**'); f.forEach(l => parts.push('- ' + (l.grade ? ' **' + l.grade + '** — ' : '') + l.text.trim())); } };
        push(val.long !== undefined ? val.long : val.bull, 'Long Hypos'); push(val.short !== undefined ? val.short : val.bear, 'Short Hypos');
      }
    } else if (s.id === 'lines') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const g = k => (val[k] || '').trim();
        if (g('bullST') || g('bullLT')) { parts.push('### **Bullish**'); if (g('bullLT')) parts.push('- Long Term – ' + g('bullLT')); if (g('bullST')) parts.push('- Short Term – ' + g('bullST')); }
        if (g('bearST') || g('bearLT')) { parts.push('### **Bearish**'); if (g('bearLT')) parts.push('- Long Term – ' + g('bearLT')); if (g('bearST')) parts.push('- Short Term – ' + g('bearST')); }
      }
    } else prepLines(content, s.id).forEach(l => parts.push('- ' + l));
  });
  parts.push('', '*— Orochi Trading Journal*');
  return parts.join('\n');
}
async function copyText(text) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
  try { const el = document.createElement('textarea'); el.value = text; el.style.cssText = 'position:fixed;top:-9999px;opacity:0'; document.body.appendChild(el); el.focus(); el.select(); const ok = document.execCommand('copy'); el.remove(); return ok; } catch (e) { return false; }
}
