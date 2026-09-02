/* reveal.js — the site's one signature moment, and its only animation.

   Two effects, both on the home page, both once, both on first view:
     · the rubric matrix arrives one row at a time (CSS, staggered by --d)
     · the eval-loop figure draws its own connectors

   Everything here is an enhancement over a page that is already complete and
   readable. If this file never loads, nothing is hidden and nothing is missing
   — that is why the CSS animates only under `.is-in`, which only this file
   adds. Motion is disabled outright when the visitor asks for less of it. */
(function () {
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  /* Fire once, when at least a fifth of the element is on screen. */
  function once(el, fn) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        fn(e.target);
      });
    }, { threshold: 0.2 });
    io.observe(el);
  }

  /* ---- 1. the matrix, a row at a time -----------------------------------
     Each cell carries `--d`, its row number, written by rubric-matrix.html.
     The delay lives in CSS so the whole effect is one class. */
  var star = document.querySelector('.star');
  if (star) once(star, function (el) { el.classList.add('is-in'); });

  /* ---- 2. the eval loop draws itself ------------------------------------
     Connectors only. Boxes and labels are present from the first paint, so the
     figure is legible for the whole ~1.2s the strokes take.

     The dash properties are a TEMPORARY override and every one of them is
     cleared on a timer, whether or not the transition ever ran. Without that
     the failure mode is a diagram with no arrows — a stalled transition would
     leave every connector dashed out of sight for good. The animation is never
     allowed to be the thing that decides whether content is visible. */
  var fig = document.querySelector('#rubric .dia');
  if (!fig) return;

  once(fig, function (svg) {
    var lines = svg.querySelectorAll('path, line, polyline');
    if (!lines.length) return;

    Array.prototype.forEach.call(lines, function (el, i) {
      var len;
      try { len = el.getTotalLength(); } catch (e) { return; }
      if (!len || !isFinite(len)) return;

      var delay = i * 45;
      var clear = function () {
        el.style.transition = '';
        el.style.strokeDasharray = '';
        el.style.strokeDashoffset = '';
      };

      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      /* Two frames, so the starting offset is painted before the transition. */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.transition = 'stroke-dashoffset 700ms cubic-bezier(.2,.7,.2,1) ' + delay + 'ms';
          el.style.strokeDashoffset = '0';
        });
      });
      /* The guarantee: drawn or not, the line is back to its real state. */
      el.addEventListener('transitionend', clear, { once: true });
      setTimeout(clear, delay + 700 + 400);
    });
  });
})();
