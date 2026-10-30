/*
  Research Graph graph motion, version 1.11 (17 October 2026)

  Two behaviours for any SVG with the class rg-graph, both optional and both
  built on the browser's own animation features, with no library:

  1. The graph draws itself once when it scrolls into view: links extend,
     nodes appear, then labels fade in.
  2. When a node is under the pointer or has keyboard focus, everything but
     that node, its links and its neighbours dims.

  When the visitor has asked for reduced motion, the graph does not draw
  itself and the highlight changes at once. Text never waits for the
  animation: it is visible within about a second in every case.

  Usage: include this file, then call RGGraph.init() after the graphs exist.
  Nodes are <rect> or <circle> elements with the class rg-entity-node; links
  are <line> or <path> elements whose ends meet the nodes' centres; labels are <text>
  elements placed just below their node, or a <title> inside a node in a graph
  too dense to label. The rules for drawing a graph are
  in public/brand/metamodel.md.
*/
(function () {
  'use strict';
  var EASE = 'cubic-bezier(0.2, 0, 0, 1)';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function centre(n) {
    if (n.tagName === 'circle') return [+n.getAttribute('cx'), +n.getAttribute('cy')];
    return [+n.getAttribute('x') + n.getAttribute('width') / 2, +n.getAttribute('y') + n.getAttribute('height') / 2];
  }
  function near(a, b) { return Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1; }
  // A link is a straight <line> or a curved <path>; both report their two ends.
  function ends(l) {
    if (l.tagName === 'line') return [[+l.getAttribute('x1'), +l.getAttribute('y1')], [+l.getAttribute('x2'), +l.getAttribute('y2')]];
    var a = l.getPointAtLength(0), b = l.getPointAtLength(l.getTotalLength());
    return [[a.x, a.y], [b.x, b.y]];
  }

  function draw(g) {
    g.classList.add('is-drawn');
    // Steps of 40 milliseconds, shortened for a large graph so it is drawn within about a second.
    var links = g.querySelectorAll('line, path'), nodes = g.querySelectorAll('.rg-entity-node');
    var linkStep = Math.min(40, 400 / links.length), nodeStep = Math.min(40, 400 / nodes.length);
    links.forEach(function (l, i) {
      var len = l.getTotalLength();
      l.style.strokeDasharray = len;
      l.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 700, delay: 250 + i * linkStep, easing: EASE, fill: 'backwards' });
    });
    nodes.forEach(function (n, i) {
      n.animate([{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, delay: i * nodeStep, easing: EASE, fill: 'backwards' });
    });
    g.querySelectorAll('text').forEach(function (t) {
      t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 700, easing: EASE, fill: 'backwards' });
    });
  }

  function highlight(g) {
    var nodes = Array.prototype.slice.call(g.querySelectorAll('.rg-entity-node'));
    var lines = Array.prototype.slice.call(g.querySelectorAll('line, path'));
    var texts = Array.prototype.slice.call(g.querySelectorAll('text'));
    function label(p) {
      var best = null, d = 1e9;
      texts.forEach(function (t) {
        var dd = Math.abs(+t.getAttribute('x') - p[0]) + Math.abs(+t.getAttribute('y') - p[1]);
        if (dd < d) { d = dd; best = t; }
      });
      return best;
    }
    g.classList.add('is-live');
    nodes.forEach(function (n) {
      // A node is named by the label below it or, in a graph too dense to label, by its own title.
      var own = n.querySelector('title');
      var p = centre(n), t = own ? null : label(p);
      var name = own ? own.textContent : t ? t.textContent : '';
      n.setAttribute('tabindex', '0');
      n.setAttribute('role', 'img');
      if (name) n.setAttribute('aria-label', name.trim() + ': show its links');
      function on() {
        var keep = [p];
        lines.forEach(function (l) {
          var e = ends(l), a = e[0], b = e[1];
          var hit = near(a, p) || near(b, p);
          l.classList.toggle('is-dim', !hit);
          if (hit) keep.push(near(a, p) ? b : a);
        });
        nodes.forEach(function (m) { var q = centre(m); m.classList.toggle('is-dim', !keep.some(function (k) { return near(k, q); })); });
        texts.forEach(function (x) { x.classList.add('is-dim'); });
        keep.forEach(function (k) { var x = label(k); if (x) x.classList.remove('is-dim'); });
      }
      function off() { g.querySelectorAll('.is-dim').forEach(function (x) { x.classList.remove('is-dim'); }); }
      n.addEventListener('pointerenter', on);
      n.addEventListener('pointerleave', off);
      n.addEventListener('focus', on);
      n.addEventListener('blur', off);
    });
  }

  function init() {
    var graphs = document.querySelectorAll('.rg-graph');
    // The highlight and keyboard access always run; only the drawing waits on motion.
    var io = reduce || !('IntersectionObserver' in window) ? null : new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        draw(e.target);
      });
    }, { threshold: 0.35 });
    graphs.forEach(function (g) { highlight(g); if (io) io.observe(g); });
  }

  window.RGGraph = { init: init };
})();
