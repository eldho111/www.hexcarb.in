(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function hasFineHoverPointer() {
    if (!window.matchMedia) return false;
    return window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;
  }

  function parseColor(value) {
    var v = String(value || "").trim();
    var m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) {
      return {
        r: parseInt(m[1].slice(0, 2), 16),
        g: parseInt(m[1].slice(2, 4), 16),
        b: parseInt(m[1].slice(4, 6), 16)
      };
    }
    m = v.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) {
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
    }
    return null;
  }

  function rgba(c, a) {
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a.toFixed(3) + ")";
  }

  function initHexLattice() {
    var mount = document.querySelector("[data-hc-hex-lattice]");
    if (!mount) return;

    var canvas = document.createElement("canvas");
    canvas.className = "hc-hex-lattice-canvas";
    canvas.setAttribute("aria-hidden", "true");
    mount.insertBefore(canvas, mount.firstChild);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var animated = !prefersReducedMotion() && hasFineHoverPointer() &&
      window.matchMedia("(min-width: 901px)").matches;

    var width = 0;
    var height = 0;
    var nodes = [];
    var edges = [];
    var raf = null;
    var pointer = { x: -9999, y: -9999, active: false };
    var pulse = null;
    var pulseTimer = null;
    var colors = {
      bond: { r: 164, g: 122, b: 59 },
      node: { r: 164, g: 122, b: 59 },
      glow: { r: 61, g: 143, b: 130 },
      bondAlpha: 0.32
    };

    function readThemeColors() {
      var styles = getComputedStyle(document.documentElement);
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      colors.bond = parseColor(styles.getPropertyValue(dark ? "--hc-border" : "--hc-text-muted")) || colors.bond;
      colors.node = parseColor(styles.getPropertyValue("--hc-accent")) || colors.node;
      colors.glow = parseColor(styles.getPropertyValue("--hc-green")) || colors.glow;
      colors.bondAlpha = dark ? 0.32 : 0.22;
    }

    // Honeycomb geometry: hexagon centers on an axial grid, vertices deduped
    // by rounded key so neighbouring cells share nodes and bonds.
    function buildLattice() {
      nodes = [];
      edges = [];
      var nodeIndex = {};
      var edgeIndex = {};
      var radius = Math.max(30, Math.min(width, height) / 9);
      var hexW = Math.sqrt(3) * radius;
      var hexH = 1.5 * radius;
      var cols = Math.ceil(width / hexW) + 2;
      var rows = Math.ceil(height / hexH) + 2;

      function nodeAt(x, y) {
        var key = Math.round(x) + ":" + Math.round(y);
        if (nodeIndex[key] !== undefined) return nodeIndex[key];
        var id = nodes.length;
        nodes.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0 });
        nodeIndex[key] = id;
        return id;
      }

      for (var row = -1; row < rows; row += 1) {
        for (var col = -1; col < cols; col += 1) {
          var cx = col * hexW + (row % 2 ? hexW / 2 : 0);
          var cy = row * hexH;
          var ring = [];
          for (var k = 0; k < 6; k += 1) {
            var angle = Math.PI / 180 * (60 * k - 30);
            ring.push(nodeAt(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
          }
          for (var e = 0; e < 6; e += 1) {
            var a = ring[e];
            var b = ring[(e + 1) % 6];
            var ekey = Math.min(a, b) + "-" + Math.max(a, b);
            if (!edgeIndex[ekey]) {
              edgeIndex[ekey] = true;
              edges.push({ a: a, b: b });
            }
          }
        }
      }

      // Adjacency for pulse paths.
      nodes.forEach(function (n) { n.links = []; });
      edges.forEach(function (edge, i) {
        nodes[edge.a].links.push({ edge: i, to: edge.b });
        nodes[edge.b].links.push({ edge: i, to: edge.a });
      });
    }

    function resize() {
      var rect = mount.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLattice();
      if (!animated) draw();
    }

    function startPulse() {
      if (!nodes.length) return;
      var startNode = Math.floor(Math.random() * nodes.length);
      var path = [];
      var current = startNode;
      var lastEdge = -1;
      for (var step = 0; step < 9; step += 1) {
        var options = nodes[current].links.filter(function (l) { return l.edge !== lastEdge; });
        if (!options.length) break;
        var pick = options[Math.floor(Math.random() * options.length)];
        path.push({ from: current, to: pick.to });
        lastEdge = pick.edge;
        current = pick.to;
      }
      if (path.length) {
        pulse = { path: path, t: 0, speed: 0.018 };
      }
    }

    function schedulePulse() {
      if (pulseTimer) window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(function () {
        startPulse();
        schedulePulse();
      }, 3500 + Math.random() * 2500);
    }

    var INFLUENCE = 140;

    function physics() {
      for (var i = 0; i < nodes.length; i += 1) {
        var n = nodes[i];
        var fx = (n.hx - n.x) * 0.02;
        var fy = (n.hy - n.y) * 0.02;

        if (pointer.active) {
          var dx = n.x - pointer.x;
          var dy = n.y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < INFLUENCE && dist > 0.001) {
            var push = (1 - dist / INFLUENCE) * 0.6;
            fx += (dx / dist) * push;
            fy += (dy / dist) * push;
          }
        }

        n.vx = (n.vx + fx) * 0.86;
        n.vy = (n.vy + fy) * 0.86;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < edges.length; i += 1) {
        var a = nodes[edges[i].a];
        var b = nodes[edges[i].b];
        var alpha = colors.bondAlpha;
        var lineColor = colors.bond;
        var lineWidth = 1;

        if (pointer.active) {
          var mx = (a.x + b.x) / 2 - pointer.x;
          var my = (a.y + b.y) / 2 - pointer.y;
          var md = Math.sqrt(mx * mx + my * my);
          if (md < INFLUENCE) {
            var heat = 1 - md / INFLUENCE;
            alpha = colors.bondAlpha + heat * 0.55;
            lineColor = colors.node;
            lineWidth = 1 + heat * 0.8;
          }
        }

        ctx.strokeStyle = rgba(lineColor, alpha);
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      if (pulse) {
        var total = pulse.path.length;
        var pos = pulse.t * total;
        var seg = Math.min(Math.floor(pos), total - 1);
        var local = pos - seg;
        for (var s = 0; s <= seg; s += 1) {
          var pa = nodes[pulse.path[s].from];
          var pb = nodes[pulse.path[s].to];
          var fade = Math.max(0, 1 - (seg - s) * 0.3);
          var endX = s === seg ? pa.x + (pb.x - pa.x) * local : pb.x;
          var endY = s === seg ? pa.y + (pb.y - pa.y) * local : pb.y;
          ctx.strokeStyle = rgba(colors.glow, 0.7 * fade);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        pulse.t += pulse.speed;
        if (pulse.t >= 1) pulse = null;
      }

      for (var k = 0; k < nodes.length; k += 1) {
        var n = nodes[k];
        var r = 1.7;
        var nodeAlpha = 0.5;
        if (pointer.active) {
          var ndx = n.x - pointer.x;
          var ndy = n.y - pointer.y;
          var nd = Math.sqrt(ndx * ndx + ndy * ndy);
          if (nd < INFLUENCE) {
            var glow = 1 - nd / INFLUENCE;
            r = 1.7 + glow * 1.6;
            nodeAlpha = 0.5 + glow * 0.5;
          }
        }
        ctx.fillStyle = rgba(colors.node, nodeAlpha);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick() {
      physics();
      draw();
      raf = window.requestAnimationFrame(tick);
    }

    readThemeColors();
    resize();

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(mount);
    } else {
      window.addEventListener("resize", resize);
    }

    new MutationObserver(function () {
      readThemeColors();
      if (!animated) draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if (!animated) return;

    mount.addEventListener("pointermove", function (event) {
      var rect = mount.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });

    mount.addEventListener("pointerleave", function () {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && raf) {
        window.cancelAnimationFrame(raf);
        raf = null;
        if (pulseTimer) window.clearTimeout(pulseTimer);
        pulseTimer = null;
      } else if (!document.hidden && !raf) {
        raf = window.requestAnimationFrame(tick);
        schedulePulse();
      }
    });

    raf = window.requestAnimationFrame(tick);
    startPulse();
    schedulePulse();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHexLattice);
  } else {
    initHexLattice();
  }
})();
