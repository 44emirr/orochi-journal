/* Sample-data generator for testing: run __OJ.seed(120) in the console. Never runs on its own. */
function seedTrades(n = 120, seed0 = 7) {
  let s = seed0; const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const syms = ['NQ1!', 'NQ1!', 'NQ1!', 'ES1!', 'ES1!', 'XAUUSD', 'BTCUSD', 'MNQH6'];
  const setups = ['Breakout pullback', 'Rotational play', 'Acceptance', 'Failed auction', 'VWAP reversion', 'Value edge fade'];
  const confs = ['Aligned with DVA', 'In rhythm', 'Location confluence', 'Delta absorption', 'HTF narrative'];
  const out = []; let d = parseYmd(today()); let made = 0; let seq = 0;
  while (made < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const k = rnd() < .25 ? 0 : 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < k && made < n; i++) {
        const risk = pick([100, 150, 200, 250]); const win = rnd() < .54; const be = rnd() < .06;
        const rr = be ? 0 : win ? +(0.6 + rnd() * 3.2).toFixed(2) : -(0.4 + rnd() * 0.7).toFixed(2);
        const pnl = +(risk * rr).toFixed(2); const open = made < 2 && rnd() < .5;
        const eh = 9 + Math.floor(rnd() * 6), em = Math.floor(rnd() * 60), hold = 3 + Math.floor(rnd() * 140);
        const xm = eh * 60 + em + hold; const reviewed = rnd() < .7;
        out.push({
          id: Date.now() * 1000 - (seq++), symbol: pick(syms), type: rnd() < .58 ? 'Long' : 'Short', entryDate: ymd(d), entryTime: pad2(eh) + ':' + pad2(em),
          exitDone: !open, exitDate: open ? '' : ymd(d), exitTime: open ? '' : pad2(Math.min(23, Math.floor(xm / 60))) + ':' + pad2(xm % 60),
          risk: String(risk), riskUnit: '$', plannedRR: String(pick([2, 2.5, 3, 4])), actualRR: open ? '' : String(Math.abs(rr)), pnl: open ? null : pnl, pnlUnit: '$',
          grade: pick(['A+', 'A+', 'B+', 'B+', 'C']), setupType: pick(setups), confluences: pick(confs) + ', ' + pick(confs),
          preOutlook: '## State of the market\nImbalanced to the upside after accepting above prior value.\n\n## Setup\n' + pick(setups) + ' into the **value edge** with delta confirming.\n\n## The plan\nFirst target prior high, runner into the single prints.',
          reflection: open || !reviewed ? '' : '## What happened\nWaited for the pullback and took the entry on confirmation.\n\n## What I did well\nSized to plan and let the trade work.\n\n## Forward Rule\nWhen price accepts back inside value, I will stand aside.',
          outcome: open ? '' : be ? 'Breakeven' : win ? (rr > 2 ? 'Full TP' : 'Partial Win') : 'Stopped Out',
          mfe: open ? '' : String(Math.round(risk * (win ? Math.abs(rr) + rnd() * 1.2 : rnd() * 0.9))), mae: open ? '' : String(Math.round(risk * (win ? rnd() * 0.7 : Math.abs(rr)))),
          mistakes: !win && rnd() < .6 ? [pick(MISTAKES).id] : [], images: [], starred: rnd() < .12, isDraft: false, createdAt: Date.now(), updatedAt: Date.now(),
        });
        made++;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return out;
}
