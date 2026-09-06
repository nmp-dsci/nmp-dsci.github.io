/* study.js — the reading furniture for a case study or practice page.
   Builds the table of contents from the numbered H2s, scroll-spies it, inserts
   the one-line section summaries from front matter, and prints a reading time.
   No dependencies; every enhancement degrades to a perfectly usable page if
   this file never loads. */
(function () {
  'use strict';

  var prose = document.querySelector('.prose');
  if (!prose) return;

  var headings = Array.prototype.slice.call(prose.querySelectorAll(':scope > h2'));
  if (!headings.length) return;

  /* ---- 1. stable anchors -------------------------------------------------
     The seven H2s are Markdown, so their ids are kramdown's and can change with
     the wording. Give each a predictable #s1…#s7 so every scorecard row and
     rubric cell can point at the section that proves it. */
  var numbers = headings.map(function (h, i) {
    var m = /^\s*(\d+)/.exec(h.textContent || '');
    var n = m ? parseInt(m[1], 10) : i + 1;
    if (!document.getElementById('s' + n)) h.id = 's' + n;
    return n;
  });

  /* ---- 2. one-line summary under each numbered heading -------------------
     Written in front matter as `sections: [{n: 1, summary: "…"}]` so the lint
     can check it and the author writes it beside the rest of the metadata. */
  var summaries = [];
  try {
    summaries = JSON.parse(prose.getAttribute('data-sections') || '[]') || [];
  } catch (e) { summaries = []; }

  if (summaries.length) {
    headings.forEach(function (h, i) {
      var n = numbers[i];
      var match = null;
      for (var j = 0; j < summaries.length; j++) {
        if (summaries[j] && Number(summaries[j].n) === n) { match = summaries[j]; break; }
      }
      if (!match || !match.summary) return;
      var p = document.createElement('p');
      p.className = 'summary';
      p.textContent = match.summary;
      h.parentNode.insertBefore(p, h.nextSibling);
    });
  }

  /* ---- 3. table of contents ---------------------------------------------- */
  var toc = document.querySelector('[data-toc]');
  var links = [];
  if (toc) {
    var frag = document.createDocumentFragment();
    var title = document.createElement('b');
    title.textContent = 'On this page';
    frag.appendChild(title);

    /* document order: an H2 is an entry, a .slide directly under it is a nested
       entry, so the TOC reads like the deck */
    Array.prototype.forEach.call(prose.children, function (el) {
      var a;
      if (el.tagName === 'H2') {
        a = document.createElement('a');
        a.href = '#' + el.id;
        a.textContent = (el.textContent || '').trim();
        frag.appendChild(a);
        links.push(a);
      } else if (el.classList && el.classList.contains('slide')) {
        var h = el.querySelector('h3');
        if (!h) return;
        if (!el.id) el.id = 'slide-' + (h.textContent || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        a = document.createElement('a');
        a.className = 'sub';
        a.href = '#' + el.id;
        var n = h.querySelector('.n');
        var label = Array.prototype.map.call(h.childNodes, function (c) {
          return c === n ? '' : (c.textContent || '');
        }).join('').replace(/\s+/g, ' ').trim();
        a.textContent = (n ? n.textContent.trim() + ' · ' : '') + label;
        frag.appendChild(a);
      }
    });

    /* the scorecard and the skills list are part of the page too */
    [['#s7-card', 'Production readiness'], ['.skills h2', null]].forEach(function (pair) {
      var el = document.querySelector(pair[0]);
      if (!el) return;
      var id = el.id || (el.id = 'sec-' + pair[0].replace(/\W+/g, '-'));
      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = pair[1] || (el.textContent || '').trim();
      frag.appendChild(a);
      links.push(a);
    });

    var prog = document.createElement('div');
    prog.className = 'prog';
    var bar = document.createElement('i');
    prog.appendChild(bar);
    frag.appendChild(prog);
    toc.appendChild(frag);

    /* scroll-spy: mark the heading nearest the top of the reading area */
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            a.setAttribute('aria-current', a.hash === '#' + entry.target.id ? 'true' : 'false');
          });
        });
      }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });
      headings.forEach(function (h) { spy.observe(h); });
      var card = document.getElementById('s7-card');
      if (card) spy.observe(card);
    }

    /* reading progress, throttled to one write per animation frame */
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var d = document.documentElement;
        var max = d.scrollHeight - d.clientHeight;
        bar.style.width = (max > 0 ? Math.min(100, (100 * d.scrollTop) / max) : 0).toFixed(1) + '%';
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- 3b. scrollable code blocks are keyboard-reachable ----------------
     A <pre> that scrolls horizontally is a scrollable region; without a
     tabindex a keyboard-only visitor cannot scroll it and cannot read the part
     that is cut off. axe reports it as `scrollable-region-focusable`. */
  Array.prototype.forEach.call(document.querySelectorAll('pre'), function (pre) {
    if (pre.scrollWidth > pre.clientWidth + 2 && !pre.hasAttribute('tabindex')) {
      pre.setAttribute('tabindex', '0');
      pre.setAttribute('aria-label', 'Code block, scroll to read');
    }
  });

  /* ---- 4. reading time ---------------------------------------------------
     230 words a minute, the usual figure for technical prose. Rendered into the
     slot the layout already reserved, so there is no layout shift. */
  var slot = document.querySelector('[data-reading-time]');
  if (slot) {
    var words = (prose.innerText || '').trim().split(/\s+/).length;
    slot.textContent = Math.max(1, Math.round(words / 230)) + ' min';
  }
})();
