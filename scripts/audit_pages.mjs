#!/usr/bin/env node
/* audit_pages.mjs — the measured half of the design audit, in a real browser.
 *
 * scripts/contrast_audit.py proves colour and scripts/lint_case_study.py proves
 * the case-study contract. Neither can see layout, so this covers the rest of
 * the M-checks in .claude/skills/design-audit/SKILL.md:
 *
 *   M1  nothing renders under 12.8px (DESIGN.md rule 2)
 *   M2  no horizontal document overflow, at any width
 *   M3  anything wider than its parent has an ancestor that scrolls
 *   M4  no SVG label escapes its viewBox
 *   M5  6-9 distinct font sizes per page
 *   M7  under prefers-reduced-motion, nothing animates
 *   M8  with animation frozen at its start state, nothing is invisible
 *   M9  standalone targets are at least 24x24 (WCAG 2.5.8; inline links exempt)
 *   M10 with JavaScript off the page reads and the nav dropdown still opens
 *   plus axe-core across every page in both themes
 *
 * Setup (the deps are deliberately not committed):
 *     npm i --no-save playwright axe-core
 *     npx playwright install chromium      # first run only
 *
 * Usage:
 *     node scripts/audit_pages.mjs http://127.0.0.1:8801
 *     node scripts/audit_pages.mjs https://nmp-dsci.github.io
 *
 * Exits non-zero if anything fails, so it can gate a branch.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = (process.argv[2] || 'http://127.0.0.1:8801').replace(/\/$/, '');
const PAGES = ['/', '/about/', '/projects/data-pilot/', '/projects/convfinqa-agent/',
  '/projects/transcript-rag/', '/practices/eval-loop/', '/practices/ways-of-working/',
  '/practices/production-scale/'];
const WIDTHS = [390, 768, 1280];
const SCHEMES = ['light', 'dark'];
const MIN_FONT = 12.79;   // --t-2, minus a rounding hair
const MIN_TARGET = 24;    // WCAG 2.5.8 AA

const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
let failures = 0;
const note = (ok, line) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${line}`); };

/* ---------------------------------------------------- the layout measurement */
const layoutProbe = ({ minFont, minTarget }) => {
  const de = document.documentElement;
  const small = [], sizes = {}, unc = [], tap = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('.sr-only')) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const isSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';

    if (!el.children.length && el.textContent.trim() && !isSvg) {
      const f = parseFloat(cs.fontSize);
      sizes[f.toFixed(2)] = 1;
      if (f < minFont) small.push(`${el.tagName}.${el.getAttribute('class') || ''}@${f}px`);
    }
    /* A full-bleed figure is meant to be wider than its padded parent, so the
       deliberate negative-margin frames are not overflow. */
    if (el.parentElement && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && !isSvg
        && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll'
        && !el.classList.contains('sys-fig') && !el.closest('.dia-frame'))
      unc.push(`${el.tagName}.${(el.getAttribute('class') || '').slice(0, 34)}`);

    if (/^(A|BUTTON|SUMMARY)$/.test(el.tagName)) {
      const r = el.getBoundingClientRect();
      /* WCAG 2.5.8 exempts a target set inline in a sentence of other text. */
      if (r.width > 0 && r.height > 0 && (r.height < minTarget || r.width < minTarget)
          && !el.closest('p, li, dd, figcaption'))
        tap.push(`${el.tagName}.${el.getAttribute('class') || ''}@${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  });

  const svgOver = [];
  document.querySelectorAll('svg.dia').forEach((svg) => {
    const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    if (vb.length !== 4) return;
    svg.querySelectorAll('text').forEach((t) => {
      let b; try { b = t.getBBox(); } catch { return; }
      if (b.x < vb[0] - 1 || b.x + b.width > vb[0] + vb[2] + 1 || b.y + b.height > vb[1] + vb[3] + 1)
        svgOver.push((t.textContent || '').slice(0, 20));
    });
  });

  return {
    docOverflow: de.scrollWidth > de.clientWidth + 1, scrollW: de.scrollWidth, clientW: de.clientWidth,
    small: [...new Set(small)], unc: [...new Set(unc)], tap: [...new Set(tap)],
    svgOver, sizes: Object.keys(sizes).length,
  };
};

const b = await chromium.launch();

/* ------------------------------------------- M1-M5, M9 across the whole grid */
console.log(`\n=== layout · ${PAGES.length} pages x ${WIDTHS.length} widths x ${SCHEMES.length} themes ===`);
for (const colorScheme of SCHEMES) {
  for (const width of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width, height: 900 }, colorScheme });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      await p.waitForTimeout(120);
      const r = await p.evaluate(layoutProbe, { minFont: MIN_FONT, minTarget: MIN_TARGET });
      const bad = r.docOverflow || r.small.length || r.unc.length || r.svgOver.length
        || r.tap.length || r.sizes < 6 || r.sizes > 9;
      note(!bad, `${colorScheme.padEnd(5)} ${String(width).padStart(4)} ${path.padEnd(31)} `
        + `ovf=${r.docOverflow ? `${r.scrollW}>${r.clientW}` : '-'} small=${r.small.length} `
        + `unc=${r.unc.length} svg=${r.svgOver.length} tap=${r.tap.length} sizes=${r.sizes}`);
      for (const k of ['small', 'unc', 'tap', 'svgOver'])
        r[k].slice(0, 4).forEach((v) => console.log(`         · ${k}: ${v}`));
    }
    await ctx.close();
  }
}

/* ------------------------------------------------------------- axe-core, WCAG */
console.log('\n=== axe-core · WCAG 2.0/2.1/2.2 A+AA, plus best-practice ===');
for (const colorScheme of SCHEMES) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme });
  const p = await ctx.newPage();
  for (const path of PAGES) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.addScriptTag({ content: axeSrc });
    const r = await p.evaluate(async () => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    }));
    note(!r.violations.length, `${colorScheme.padEnd(5)} ${path.padEnd(31)} `
      + (r.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(' ') || 'clean'));
    for (const v of r.violations)
      for (const n of v.nodes.slice(0, 3)) console.log(`         · ${v.id}: ${n.html.slice(0, 100)}`);
  }
  await ctx.close();
}

/* -------------------------------------------- M7, M8, M10 — the motion contract */
console.log('\n=== motion and degradation ===');
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const m = await p.evaluate(() => {
    const star = document.querySelector('.star');
    const cells = [...star.querySelectorAll('.cell,.md')];
    return { isIn: star.classList.contains('is-in'), n: cells.length,
      animated: cells.some((c) => getComputedStyle(c).animationName === 'cell-in') };
  });
  note(m.isIn && m.animated, `reveal runs: is-in=${m.isIn} animated=${m.animated} cells=${m.n}`);

  /* M8 — the reveal must never be what decides whether content is visible. */
  await p.evaluate(() => {
    document.querySelector('.star').classList.add('is-in');
    document.querySelectorAll('#rubric .dia path,#rubric .dia line').forEach((el) => {
      const L = el.getTotalLength(); el.style.strokeDasharray = L; el.style.strokeDashoffset = L;
    });
  });
  await p.waitForTimeout(1600);
  const frozen = await p.evaluate(() => {
    const cells = [...document.querySelectorAll('.star .cell,.star .md')];
    const ls = [...document.querySelectorAll('#rubric .dia path,#rubric .dia line')];
    return { hidden: cells.filter((c) => parseFloat(getComputedStyle(c).opacity) < 0.5).length,
      dashed: ls.filter((l) => l.style.strokeDasharray !== '' && parseFloat(l.style.strokeDashoffset || 0) > 0.5).length };
  });
  note(frozen.hidden === 0, `M8 animation frozen: ${frozen.hidden} cells invisible (must be 0)`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const cells = [...document.querySelectorAll('.star .cell,.star .md')];
    return { animating: cells.filter((c) => getComputedStyle(c).animationName !== 'none').length,
      allVisible: cells.every((c) => parseFloat(getComputedStyle(c).opacity) === 1) };
  });
  note(r.animating === 0 && r.allVisible, `M7 reduced motion: ${r.animating} animating, all visible=${r.allVisible}`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const cells = await p.locator('.cell').count();
  await p.locator('.nav-drop summary').click();
  const opens = await p.locator('.nav-drop-panel a').first().isVisible();
  note(cells > 0 && opens, `M10 no JavaScript: ${cells} cells rendered, dropdown opens=${opens}`);
  await ctx.close();
}

await b.close();
console.log(`\n${'='.repeat(64)}\naudit_pages: ${failures} failing check${failures === 1 ? '' : 's'}`);
process.exit(failures ? 1 : 0);
