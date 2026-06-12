/* Interactive property demos for /power-of-nanotubes.html.
   Each demo mounts on [data-demo="..."], runs only while visible,
   pauses when the tab hides, and degrades to static frames under
   prefers-reduced-motion. */
(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
    return null;
  }

  function rgba(c, a) {
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a.toFixed(3) + ")";
  }

  function lerpColor(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  var THEME = {
    ink: { r: 14, g: 24, b: 34 },
    muted: { r: 63, g: 82, b: 104 },
    accent: { r: 164, g: 122, b: 59 },
    bright: { r: 184, g: 136, b: 46 },
    teal: { r: 61, g: 143, b: 130 },
    hot: { r: 196, g: 92, b: 48 },
    dark: false
  };
  var themeListeners = [];

  function readTheme() {
    var styles = getComputedStyle(document.documentElement);
    THEME.dark = document.documentElement.getAttribute("data-theme") === "dark";
    THEME.ink = parseColor(styles.getPropertyValue("--hc-heading")) || THEME.ink;
    THEME.muted = parseColor(styles.getPropertyValue("--hc-text-muted")) || THEME.muted;
    THEME.accent = parseColor(styles.getPropertyValue("--hc-accent")) || THEME.accent;
    THEME.bright = parseColor(styles.getPropertyValue("--hc-accent-bright")) || THEME.bright;
    THEME.teal = parseColor(styles.getPropertyValue("--hc-green")) || THEME.teal;
  }

  function setupCanvas(mount, onResize) {
    var canvas = document.createElement("canvas");
    canvas.className = "hc-demo-canvas";
    canvas.setAttribute("aria-hidden", "true");
    mount.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var box = { w: 0, h: 0 };

    function resize(skipHook) {
      var rect = mount.getBoundingClientRect();
      if (!rect.width) return;
      box.w = rect.width;
      box.h = rect.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (onResize && skipHook !== true) onResize();
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { resize(); }).observe(mount);
    } else {
      window.addEventListener("resize", function () { resize(); });
    }
    // Initial sizing without the hook: callers haven't finished wiring up yet
    // (the hook references the surface object this function returns).
    resize(true);
    return { canvas: canvas, ctx: ctx, box: box, resize: resize };
  }

  // rAF loop that only runs while the mount is on screen and the tab visible.
  function makeLoop(mount, step) {
    var running = false;
    var raf = null;
    var visible = false;

    function frame(ts) {
      raf = null;
      if (!running) return;
      step(ts);
      raf = window.requestAnimationFrame(frame);
    }

    function update() {
      var should = visible && !document.hidden;
      if (should && !running) {
        running = true;
        raf = window.requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        if (raf) {
          window.cancelAnimationFrame(raf);
          raf = null;
        }
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          update();
        });
      }, { threshold: 0.05 }).observe(mount);
    } else {
      visible = true;
      update();
    }
    document.addEventListener("visibilitychange", update);
    return { poke: update };
  }

  // Bounded honeycomb strip: nodes + deduped edges within w x h.
  function buildHoneycomb(w, h, radius, ox, oy) {
    var nodes = [];
    var edges = [];
    var index = {};
    var edgeIndex = {};
    var hexW = Math.sqrt(3) * radius;
    var hexH = 1.5 * radius;
    var cols = Math.ceil(w / hexW) + 1;
    var rows = Math.ceil(h / hexH) + 1;

    function nodeAt(x, y) {
      var key = Math.round(x) + ":" + Math.round(y);
      if (index[key] !== undefined) return index[key];
      var id = nodes.length;
      nodes.push({ hx: x, hy: y, x: x, y: y, t: 0 });
      index[key] = id;
      return id;
    }

    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        var cx = ox + col * hexW + (row % 2 ? hexW / 2 : 0);
        var cy = oy + row * hexH;
        var ring = [];
        for (var k = 0; k < 6; k += 1) {
          var angle = Math.PI / 180 * (60 * k - 30);
          var px = cx + radius * Math.cos(angle);
          var py = cy + radius * Math.sin(angle);
          if (px < ox - radius || px > ox + w + radius || py < oy - radius || py > oy + h + radius) {
            ring.push(-1);
            continue;
          }
          ring.push(nodeAt(px, py));
        }
        for (var e = 0; e < 6; e += 1) {
          var a = ring[e];
          var b = ring[(e + 1) % 6];
          if (a < 0 || b < 0) continue;
          var ekey = Math.min(a, b) + "-" + Math.max(a, b);
          if (!edgeIndex[ekey]) {
            edgeIndex[ekey] = true;
            edges.push({ a: a, b: b });
          }
        }
      }
    }
    return { nodes: nodes, edges: edges };
  }

  var interacted = {};
  function markInteract(demo, action) {
    var host = document.querySelector('[data-demo="' + demo + '"]');
    if (host) {
      var hint = host.parentElement ? host.parentElement.querySelector(".hc-demo-hint") : null;
      if (hint) hint.classList.add("is-done");
    }
    if (interacted[demo]) return;
    interacted[demo] = true;
    if (typeof window.hexTrack === "function") {
      window.hexTrack("hc_property_demo_interact", { demo: demo, action: action || "touch" });
    }
  }

  /* ── 1. Scale zoom: fiber → bundle → tube → atoms, scrubbed by scroll ── */
  function initScaleDemo() {
    var mount = document.querySelector('[data-demo="scale"]');
    var section = document.querySelector(".hc-scale-section");
    var caption = document.getElementById("hc-scale-caption");
    if (!mount || !section) return;

    var STAGES = [
      "Carbon fiber yarn — about 1 mm. You can hold this.",
      "Inside: bundles of tubes — about 1 µm across.",
      "One carbon nanotube — about 10 nm. 10,000× thinner than hair.",
      "The wall itself: carbon atoms, 0.142 nm apart. Pure hexagons."
    ];

    var surface = setupCanvas(mount, draw);
    var ctx = surface.ctx;
    var lattice = null;
    var progress = 0;
    var lastStage = -1;

    function ensureLattice() {
      lattice = buildHoneycomb(surface.box.w, surface.box.h, Math.max(26, surface.box.w / 16), 0, 0);
    }

    function drawStage(i, alpha, scale) {
      var w = surface.box.w;
      var h = surface.box.h;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);
      var ink = rgba(THEME.ink, 0.8);
      var soft = rgba(THEME.muted, 0.5);

      if (i === 0) {
        // Twisted yarn: several thick interleaved strands.
        for (var s = 0; s < 5; s += 1) {
          ctx.strokeStyle = s % 2 ? soft : ink;
          ctx.lineWidth = 14 - s * 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (var x = -20; x <= w + 20; x += 8) {
            var y = h / 2 + Math.sin(x / 60 + s * 1.4) * (16 + s * 5);
            if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (i === 1) {
        // Parallel tube bundle.
        for (var t = 0; t < 12; t += 1) {
          var yy = h * 0.14 + t * (h * 0.72 / 11);
          ctx.strokeStyle = t % 3 === 0 ? rgba(THEME.accent, 0.55) : soft;
          ctx.lineWidth = 7;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(w * 0.06, yy + Math.sin(t) * 4);
          ctx.lineTo(w * 0.94, yy + Math.cos(t) * 4);
          ctx.stroke();
        }
      } else if (i === 2) {
        // One large tube with a hint of lattice texture.
        var top = h * 0.3;
        var bottom = h * 0.7;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.05, top);
        ctx.lineTo(w * 0.95, top);
        ctx.moveTo(w * 0.05, bottom);
        ctx.lineTo(w * 0.95, bottom);
        ctx.stroke();
        ctx.strokeStyle = rgba(THEME.accent, 0.4);
        ctx.lineWidth = 1.2;
        for (var hx = w * 0.08; hx < w * 0.92; hx += 26) {
          ctx.beginPath();
          ctx.moveTo(hx, top + 6);
          ctx.lineTo(hx + 13, (top + bottom) / 2);
          ctx.lineTo(hx, bottom - 6);
          ctx.moveTo(hx + 13, (top + bottom) / 2);
          ctx.lineTo(hx + 26, (top + bottom) / 2);
          ctx.stroke();
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(w * 0.95, h / 2, 14, (bottom - top) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Atomic honeycomb.
        if (!lattice) ensureLattice();
        ctx.strokeStyle = rgba(THEME.muted, 0.55);
        ctx.lineWidth = 1.4;
        lattice.edges.forEach(function (edge) {
          var na = lattice.nodes[edge.a];
          var nb = lattice.nodes[edge.b];
          ctx.beginPath();
          ctx.moveTo(na.x, na.y);
          ctx.lineTo(nb.x, nb.y);
          ctx.stroke();
        });
        ctx.fillStyle = rgba(THEME.accent, 0.85);
        lattice.nodes.forEach(function (node) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();
    }

    function draw() {
      if (!surface.box.w) return;
      if (!lattice) ensureLattice();
      ctx.clearRect(0, 0, surface.box.w, surface.box.h);
      var f = progress * (STAGES.length - 1);
      var i = Math.min(STAGES.length - 2, Math.floor(f));
      var local = f - i;
      drawStage(i, 1 - local, 1 + local * 0.4);
      drawStage(i + 1, local, 0.7 + local * 0.3);

      var stage = Math.round(f);
      if (stage !== lastStage) {
        lastStage = stage;
        if (caption) caption.textContent = STAGES[stage];
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var rect = section.getBoundingClientRect();
        var range = rect.height - window.innerHeight;
        if (range <= 0) return;
        var p = Math.min(1, Math.max(0, -rect.top / range));
        if (Math.abs(p - progress) > 0.001) {
          progress = p;
          draw();
          markInteract("scale", "scrub");
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    themeListeners.push(function () { draw(); });
    draw();
    if (caption) caption.textContent = STAGES[0];
  }

  /* ── 2. Strength: drag the load, steel snaps, the honeycomb springs back ── */
  function initStrengthDemo() {
    var mount = document.querySelector('[data-demo="strength"]');
    if (!mount) return;
    var resetBtn = document.getElementById("hc-strength-reset");
    var surface = setupCanvas(mount, function () { draw(); });
    var ctx = surface.ctx;

    var load = 0;          // current animated load 0..1
    var targetLoad = 0;
    var plastic = 0;       // permanent steel deformation
    var broken = false;
    var dragging = false;
    var dragStartY = 0;

    function beamGeometry(yMid, defl, brokenBeam) {
      // Returns a list of {x, y} centerline points for a clamped beam.
      var w = surface.box.w;
      var pts = [];
      var left = w * 0.1;
      var right = w * 0.9;
      for (var i = 0; i <= 40; i += 1) {
        var t = i / 40;
        var x = left + (right - left) * t;
        var y;
        if (brokenBeam) {
          // Two halves hanging from the clamps.
          var half = t < 0.5 ? t * 2 : (1 - t) * 2;
          y = yMid + half * defl * 2.2;
        } else {
          y = yMid + Math.sin(Math.PI * t) * defl;
        }
        pts.push({ x: x, y: y });
      }
      return pts;
    }

    function drawBeam(pts, style) {
      var thickness = 16;
      ctx.lineWidth = 2;
      ctx.strokeStyle = style.edge;
      // Top and bottom chords.
      [-1, 1].forEach(function (side) {
        ctx.beginPath();
        pts.forEach(function (p, i) {
          var y = p.y + side * thickness / 2;
          if (i === 0) ctx.moveTo(p.x, y); else ctx.lineTo(p.x, y);
        });
        ctx.stroke();
      });
      // Web pattern.
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = style.web;
      for (var i = 0; i < pts.length - 2; i += 2) {
        var p = pts[i];
        var q = pts[i + 2];
        ctx.beginPath();
        if (style.hex) {
          ctx.moveTo(p.x, p.y - thickness / 2);
          ctx.lineTo((p.x + q.x) / 2, p.y + thickness / 2);
          ctx.lineTo(q.x, q.y - thickness / 2);
        } else {
          ctx.moveTo(p.x, p.y - thickness / 2);
          ctx.lineTo(q.x, q.y + thickness / 2);
          ctx.moveTo(p.x, p.y + thickness / 2);
          ctx.lineTo(q.x, q.y - thickness / 2);
        }
        ctx.stroke();
      }
    }

    function drawClamps(yMid) {
      var w = surface.box.w;
      ctx.fillStyle = rgba(THEME.muted, 0.3);
      [w * 0.1, w * 0.9].forEach(function (x) {
        ctx.fillRect(x - 9, yMid - 30, 9, 60);
      });
    }

    function draw() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);

      var steelY = h * 0.3;
      var cntY = h * 0.72;
      var maxDefl = h * 0.12;

      ctx.font = "600 11px 'Space Grotesk', sans-serif";
      ctx.fillStyle = rgba(THEME.muted, 0.9);
      ctx.fillText("STEEL", w * 0.1, steelY - 28);
      ctx.fillStyle = rgba(THEME.accent, 1);
      ctx.fillText("CARBON NANOTUBE", w * 0.1, cntY - 28);

      drawClamps(steelY);
      drawClamps(cntY);

      var steelDefl = broken ? maxDefl : (load * maxDefl + plastic * maxDefl * 0.6);
      drawBeam(beamGeometry(steelY, steelDefl, broken), {
        edge: broken ? rgba(THEME.hot, 0.85) : rgba(THEME.muted, 0.85),
        web: rgba(THEME.muted, 0.4),
        hex: false
      });
      if (broken) {
        ctx.fillStyle = rgba(THEME.hot, 0.9);
        ctx.font = "600 12px 'Space Grotesk', sans-serif";
        ctx.fillText("FAILED", w / 2 - 22, steelY + maxDefl * 2.2 + 26);
      }

      drawBeam(beamGeometry(cntY, load * maxDefl * 0.16, false), {
        edge: rgba(THEME.accent, 0.95),
        web: rgba(THEME.accent, 0.45),
        hex: true
      });

      // Load handle.
      var handleY = h * 0.5;
      ctx.strokeStyle = rgba(THEME.teal, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, handleY - 8);
      ctx.lineTo(w / 2, handleY + 8 + load * 26);
      ctx.stroke();
      ctx.fillStyle = rgba(THEME.teal, dragging ? 1 : 0.75);
      ctx.beginPath();
      ctx.arc(w / 2, handleY + 8 + load * 26, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText("drag down to load ↓", w / 2 + 16, handleY + 12 + load * 26);
    }

    var loop = makeLoop(mount, function () {
      var prev = load;
      load += (targetLoad - load) * 0.14;
      if (!broken && load > 0.92) {
        broken = true;
        if (resetBtn) resetBtn.hidden = false;
        markInteract("strength", "snap");
      }
      plastic = Math.max(plastic, broken ? 1 : load * 0.7);
      if (Math.abs(load - prev) > 0.0005 || dragging) draw();
    });

    mount.addEventListener("pointerdown", function (event) {
      dragging = true;
      dragStartY = event.clientY - targetLoad * 130;
      mount.setPointerCapture(event.pointerId);
      markInteract("strength", "drag");
    });
    mount.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      targetLoad = Math.min(1, Math.max(0, (event.clientY - dragStartY) / 130));
    });
    function release() {
      dragging = false;
      targetLoad = 0;
    }
    mount.addEventListener("pointerup", release);
    mount.addEventListener("pointercancel", release);

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        broken = false;
        plastic = 0;
        load = 0;
        targetLoad = 0;
        resetBtn.hidden = true;
        draw();
      });
    }

    themeListeners.push(draw);
    draw();
    loop.poke();
  }

  /* ── 3. Electron race: hold to inject current into both lanes ── */
  function initElectronDemo() {
    var mount = document.querySelector('[data-demo="electron"]');
    if (!mount) return;
    var copperCount = document.getElementById("hc-count-copper");
    var cntCount = document.getElementById("hc-count-cnt");

    var surface = setupCanvas(mount, function () { draw(); });
    var ctx = surface.ctx;
    var holding = false;
    var particles = [];
    var delivered = { copper: 0, cnt: 0 };

    function laneY(lane) {
      return lane === "copper" ? surface.box.h * 0.3 : surface.box.h * 0.72;
    }

    function spawn() {
      if (particles.length > 420) return;
      // Copper: few, slow, scattering. CNT: many, fast, ballistic.
      for (var c = 0; c < 1; c += 1) {
        particles.push({ lane: "copper", x: surface.box.w * 0.08, y: laneY("copper") + (Math.random() - 0.5) * 18, v: 1.1 + Math.random() * 0.7 });
      }
      for (var n = 0; n < 4; n += 1) {
        particles.push({ lane: "cnt", x: surface.box.w * 0.08, y: laneY("cnt") + (Math.random() - 0.5) * 12, v: 4.6 + Math.random() * 1.6 });
      }
    }

    function drawLane(label, y, color) {
      var w = surface.box.w;
      ctx.strokeStyle = rgba(THEME.muted, 0.35);
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.08, y - 16, w * 0.84, 32);
      ctx.fillStyle = rgba(color, 0.9);
      ctx.font = "600 11px 'Space Grotesk', sans-serif";
      ctx.fillText(label, w * 0.08, y - 24);
      // Electrode bars.
      ctx.fillStyle = rgba(THEME.muted, 0.4);
      ctx.fillRect(w * 0.08 - 6, y - 16, 6, 32);
      ctx.fillRect(w * 0.92, y - 16, 6, 32);
    }

    function draw() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      drawLane("COPPER", laneY("copper"), THEME.muted);
      drawLane("CARBON NANOTUBE", laneY("cnt"), THEME.accent);

      particles.forEach(function (p) {
        ctx.fillStyle = p.lane === "cnt" ? rgba(THEME.teal, 0.9) : rgba(THEME.muted, 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.lane === "cnt" ? 2.4 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(holding ? "current flowing…" : "press and hold to apply current", w * 0.08, h - 12);
    }

    makeLoop(mount, function () {
      if (holding) spawn();
      var goal = surface.box.w * 0.92;
      for (var i = particles.length - 1; i >= 0; i -= 1) {
        var p = particles[i];
        if (p.lane === "copper") {
          // Scattering: random walk, sometimes bounced back.
          p.x += p.v * (Math.random() < 0.12 ? -0.8 : 1);
          p.y += (Math.random() - 0.5) * 3;
          var base = laneY("copper");
          if (p.y < base - 13) p.y = base - 13;
          if (p.y > base + 13) p.y = base + 13;
        } else {
          p.x += p.v;
          p.y += Math.sin(p.x / 24) * 0.4;
        }
        if (p.x >= goal) {
          delivered[p.lane] += 1;
          particles.splice(i, 1);
        } else if (p.x < surface.box.w * 0.06) {
          p.x = surface.box.w * 0.08;
        }
      }
      if (copperCount) copperCount.textContent = String(delivered.copper);
      if (cntCount) cntCount.textContent = String(delivered.cnt);
      draw();
    });

    mount.addEventListener("pointerdown", function (event) {
      holding = true;
      mount.setPointerCapture(event.pointerId);
      markInteract("electron", "hold");
    });
    function stop() { holding = false; }
    mount.addEventListener("pointerup", stop);
    mount.addEventListener("pointercancel", stop);
    mount.addEventListener("pointerleave", stop);

    themeListeners.push(draw);
    draw();
  }

  /* ── 4. Thermal: touch the lattice, heat blooms through it ── */
  function initThermalDemo() {
    var mount = document.querySelector('[data-demo="thermal"]');
    if (!mount) return;

    var surface = setupCanvas(mount, rebuild);
    var ctx = surface.ctx;
    var main = null;
    var ref = null;
    var pointer = { x: -1, y: -1, on: false };

    function rebuild() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      main = buildHoneycomb(w * 0.92, h * 0.62, Math.max(20, w / 22), w * 0.04, h * 0.06);
      ref = buildHoneycomb(w * 0.92, h * 0.16, Math.max(14, w / 34), w * 0.04, h * 0.8);
      draw();
    }

    function diffuse(net, rate) {
      net.edges.forEach(function (edge) {
        var a = net.nodes[edge.a];
        var b = net.nodes[edge.b];
        var flow = (a.t - b.t) * rate;
        a.t -= flow;
        b.t += flow;
      });
      net.nodes.forEach(function (n) { n.t *= 0.992; });
    }

    function inject(net, x, y, amount) {
      net.nodes.forEach(function (n) {
        var dx = n.x - x;
        var dy = n.y - y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 1200) n.t = Math.min(1, n.t + amount * (1 - d2 / 1200));
      });
    }

    function drawNet(net) {
      net.edges.forEach(function (edge) {
        var a = net.nodes[edge.a];
        var b = net.nodes[edge.b];
        var heat = (a.t + b.t) / 2;
        var color = lerpColor(THEME.muted, THEME.hot, Math.min(1, heat * 1.4));
        ctx.strokeStyle = rgba(color, 0.35 + heat * 0.6);
        ctx.lineWidth = 1 + heat * 1.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    }

    function draw() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w || !main) return;
      ctx.clearRect(0, 0, w, h);
      ctx.font = "600 11px 'Space Grotesk', sans-serif";
      ctx.fillStyle = rgba(THEME.accent, 1);
      ctx.fillText("CARBON NANOTUBE NETWORK — touch to heat", w * 0.04, h * 0.045);
      ctx.fillStyle = rgba(THEME.muted, 0.9);
      ctx.fillText("TYPICAL POLYMER — same touch", w * 0.04, h * 0.775);
      drawNet(main);
      drawNet(ref);
    }

    makeLoop(mount, function () {
      if (!main) return;
      if (pointer.on) {
        inject(main, pointer.x, pointer.y, 0.25);
        // Mirror the same x into the reference strip.
        inject(ref, pointer.x, surface.box.h * 0.88, 0.25);
      }
      diffuse(main, 0.16);
      diffuse(ref, 0.012);
      draw();
    });

    function track(event) {
      var rect = mount.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.on = true;
      markInteract("thermal", "heat");
    }
    mount.addEventListener("pointermove", track, { passive: true });
    mount.addEventListener("pointerdown", track, { passive: true });
    mount.addEventListener("pointerleave", function () { pointer.on = false; }, { passive: true });

    themeListeners.push(draw);
    rebuild();
  }

  /* ── 5. Bend: drag the tube to extreme curvature, it springs back ── */
  function initBendDemo() {
    var mount = document.querySelector('[data-demo="bend"]');
    if (!mount) return;
    var surface = setupCanvas(mount, function () { draw(); });
    var ctx = surface.ctx;

    var cp = { y: 0, vy: 0 };   // control-point offset from rest
    var dragging = false;
    var ghostShown = false;
    var KINK = 0.55;            // normalized bend where steel would fail

    function tubePoints(offset) {
      var w = surface.box.w;
      var h = surface.box.h;
      var midY = h * 0.46;
      var pts = [];
      for (var i = 0; i <= 50; i += 1) {
        var t = i / 50;
        // Quadratic bezier: anchors at sides, control point dragged.
        var x = (1 - t) * (1 - t) * (w * 0.06) + 2 * (1 - t) * t * (w / 2) + t * t * (w * 0.94);
        var y = (1 - t) * (1 - t) * midY + 2 * (1 - t) * t * (midY + offset) + t * t * midY;
        pts.push({ x: x, y: y, t: t });
      }
      return pts;
    }

    function drawTube(pts, color, alpha, width) {
      ctx.lineCap = "round";
      [-1, 1].forEach(function (side) {
        ctx.strokeStyle = rgba(color, alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach(function (p, i) {
          var prev = pts[Math.max(0, i - 1)];
          var next = pts[Math.min(pts.length - 1, i + 1)];
          var nx = -(next.y - prev.y);
          var ny = next.x - prev.x;
          var nl = Math.sqrt(nx * nx + ny * ny) || 1;
          var y = p.y + (ny / nl) * side * width;
          var x = p.x + (nx / nl) * side * width;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
      // Hex cross-pattern.
      ctx.strokeStyle = rgba(color, alpha * 0.5);
      ctx.lineWidth = 1;
      for (var i = 2; i < pts.length - 2; i += 3) {
        var p = pts[i];
        var q = pts[i + 2] || p;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - width);
        ctx.lineTo((p.x + q.x) / 2, p.y + width);
        ctx.lineTo(q.x, q.y - width);
        ctx.stroke();
      }
    }

    function draw() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);

      var maxBend = h * 0.4;
      var bendNorm = Math.abs(cp.y) / maxBend;

      if (ghostShown) {
        // Where steel would have stayed: kinked ghost.
        var ghost = tubePoints(KINK * maxBend);
        drawTube(ghost, THEME.muted, 0.25, 9);
        ctx.fillStyle = rgba(THEME.hot, 0.8);
        ctx.font = "600 11px 'Space Grotesk', sans-serif";
        ctx.fillText("steel kinks here — permanently", w / 2 - 80, h * 0.46 + KINK * maxBend * 0.6);
      }

      drawTube(tubePoints(cp.y), THEME.accent, 0.95, 10);

      ctx.fillStyle = rgba(THEME.teal, dragging ? 1 : 0.7);
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.46 + cp.y * 0.5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText("drag the tube", w / 2 + 14, h * 0.46 + cp.y * 0.5 + 4);

      if (bendNorm > KINK && !ghostShown) {
        ghostShown = true;
        markInteract("bend", "kink-passed");
      }
    }

    makeLoop(mount, function () {
      if (!dragging) {
        // Spring back with a soft oscillation.
        var force = -cp.y * 0.08;
        cp.vy = (cp.vy + force) * 0.9;
        cp.y += cp.vy;
        if (Math.abs(cp.y) < 0.2 && Math.abs(cp.vy) < 0.2) {
          cp.y = cp.y * 0.8;
        }
      }
      draw();
    });

    mount.addEventListener("pointerdown", function (event) {
      dragging = true;
      mount.setPointerCapture(event.pointerId);
      markInteract("bend", "drag");
    });
    mount.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var rect = mount.getBoundingClientRect();
      var maxBend = surface.box.h * 0.4;
      cp.y = Math.max(-maxBend, Math.min(maxBend, (event.clientY - rect.top - surface.box.h * 0.46) * 1.6));
    });
    function release() { dragging = false; }
    mount.addEventListener("pointerup", release);
    mount.addEventListener("pointercancel", release);

    themeListeners.push(draw);
    draw();
  }

  /* ── 6. Lightness: same strength, a fraction of the mass ── */
  function initLightnessDemo() {
    var mount = document.querySelector('[data-demo="lightness"]');
    var slider = document.getElementById("hc-lightness-slider");
    if (!mount || !slider) return;

    var surface = setupCanvas(mount, function () { draw(); });
    var ctx = surface.ctx;
    var need = Number(slider.value);
    var shown = { steel: 0, cnt: 0 };

    function hexAt(x, y, r, fill) {
      ctx.beginPath();
      for (var k = 0; k < 6; k += 1) {
        var a = Math.PI / 3 * k + Math.PI / 6;
        var px = x + r * Math.cos(a);
        var py = y + r * Math.sin(a);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (fill) ctx.fill(); else ctx.stroke();
    }

    function drawStack(centerX, units, color, label, mass) {
      var h = surface.box.h;
      var r = 13;
      var perRow = 3;
      ctx.fillStyle = rgba(color, 0.75);
      ctx.strokeStyle = rgba(color, 0.9);
      var n = Math.round(units);
      for (var i = 0; i < n; i += 1) {
        var row = Math.floor(i / perRow);
        var col = i % perRow;
        var x = centerX + (col - 1) * (r * 1.8) + (row % 2 ? r * 0.9 : 0);
        var y = h - 56 - row * (r * 1.6);
        hexAt(x, y, r, true);
      }
      ctx.fillStyle = rgba(THEME.ink, 0.9);
      ctx.font = "600 13px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, centerX, h - 26);
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = rgba(THEME.muted, 0.9);
      ctx.fillText(mass.toFixed(1) + " kg", centerX, h - 10);
      ctx.textAlign = "left";
    }

    function draw() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText("mass needed for the same structural strength", w * 0.04, 18);
      drawStack(w * 0.32, shown.steel, THEME.muted, "STEEL", shown.steel);
      drawStack(w * 0.68, shown.cnt, THEME.accent, "CNT COMPOSITE", shown.cnt);
    }

    makeLoop(mount, function () {
      var targetSteel = need * 6;
      var targetCnt = need * 1;
      var moved = false;
      if (Math.abs(shown.steel - targetSteel) > 0.05) {
        shown.steel += (targetSteel - shown.steel) * 0.12;
        moved = true;
      }
      if (Math.abs(shown.cnt - targetCnt) > 0.05) {
        shown.cnt += (targetCnt - shown.cnt) * 0.12;
        moved = true;
      }
      if (moved) draw();
    });

    slider.addEventListener("input", function () {
      need = Number(slider.value);
      markInteract("lightness", "slide");
    });

    themeListeners.push(draw);
    shown.steel = need * 6;
    shown.cnt = need;
    draw();
  }

  function init() {
    readTheme();
    new MutationObserver(function () {
      readTheme();
      themeListeners.forEach(function (cb) { cb(); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    initScaleDemo();
    initStrengthDemo();
    initElectronDemo();
    initThermalDemo();
    initBendDemo();
    initLightnessDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
