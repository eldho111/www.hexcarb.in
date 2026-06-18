/* Interactive demos for /ai-engine.html — an illustrated walk through what
   the HexCarb AI Engine does: inverse design, property prediction, and an
   active-learning loop. Each demo mounts on [data-ai="..."], runs only while
   visible, pauses when the tab hides, and degrades under reduced motion.
   Models here are illustrative, not the production engine. */
(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

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
    canvas.className = "hc-ai-canvas";
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
    resize(true);
    return { canvas: canvas, ctx: ctx, box: box, resize: resize };
  }

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
        if (raf) { window.cancelAnimationFrame(raf); raf = null; }
      }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible = entry.isIntersecting; update(); });
      }, { threshold: 0.05 }).observe(mount);
    } else {
      visible = true;
      update();
    }
    document.addEventListener("visibilitychange", update);
    return { poke: update };
  }

  var interacted = {};
  function markInteract(demo, action) {
    if (interacted[demo]) return;
    interacted[demo] = true;
    if (typeof window.hexTrack === "function") {
      window.hexTrack("hc_ai_demo_interact", { demo: demo, action: action || "use" });
    }
  }

  /* ── Hero: a "thinking" materials-intelligence network ── */
  function initNetwork() {
    var mount = document.querySelector('[data-ai="network"]');
    if (!mount) return;
    var surface = setupCanvas(mount, build);
    var ctx = surface.ctx;
    var layers = [];
    var pulses = [];
    var pointer = { x: -999, y: -999 };
    var pulseTimer = 0;

    function build() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      // Loose feed-forward layers: inputs → reasoning → outputs.
      var counts = [4, 6, 6, 3];
      layers = counts.map(function (n, li) {
        var nodes = [];
        for (var i = 0; i < n; i += 1) {
          nodes.push({
            x: w * (0.1 + (li / (counts.length - 1)) * 0.8),
            y: h * ((i + 1) / (n + 1)) + (Math.random() - 0.5) * h * 0.04,
            hex: li === 0 || li === counts.length - 1,
            glow: 0
          });
        }
        return nodes;
      });
    }

    function spawnPulse() {
      if (!layers.length) return;
      var path = [];
      var idx = Math.floor(Math.random() * layers[0].length);
      path.push(layers[0][idx]);
      for (var li = 1; li < layers.length; li += 1) {
        idx = Math.floor(Math.random() * layers[li].length);
        path.push(layers[li][idx]);
      }
      pulses.push({ path: path, seg: 0, t: 0, speed: 0.018 + Math.random() * 0.01 });
    }

    function nodeShape(n, r, fill, stroke) {
      ctx.beginPath();
      if (n.hex) {
        for (var k = 0; k < 6; k += 1) {
          var a = Math.PI / 3 * k + Math.PI / 6;
          var px = n.x + r * Math.cos(a);
          var py = n.y + r * Math.sin(a);
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      }
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.4; ctx.stroke(); }
    }

    function draw() {
      var w = surface.box.w, h = surface.box.h;
      if (!w || !layers.length) return;
      ctx.clearRect(0, 0, w, h);

      // Edges between consecutive layers.
      for (var li = 0; li < layers.length - 1; li += 1) {
        layers[li].forEach(function (a) {
          layers[li + 1].forEach(function (b) {
            ctx.strokeStyle = rgba(THEME.muted, 0.12);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          });
        });
      }

      // Travelling pulses light up the path.
      pulses.forEach(function (p) {
        var a = p.path[p.seg];
        var b = p.path[p.seg + 1];
        if (!b) return;
        var x = a.x + (b.x - a.x) * p.t;
        var y = a.y + (b.y - a.y) * p.t;
        ctx.strokeStyle = rgba(THEME.teal, 0.5);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = rgba(THEME.teal, 0.95);
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        b.glow = 1;
      });

      // Nodes.
      layers.forEach(function (nodes) {
        nodes.forEach(function (n) {
          var dx = n.x - pointer.x, dy = n.y - pointer.y;
          var near = clamp(1 - Math.sqrt(dx * dx + dy * dy) / 120, 0, 1);
          var g = Math.max(n.glow, near);
          var col = n.hex ? THEME.accent : THEME.muted;
          nodeShape(n, n.hex ? 7 : 5, rgba(col, 0.12 + g * 0.5), rgba(col, 0.5 + g * 0.5));
          n.glow *= 0.92;
        });
      });
    }

    makeLoop(mount, function (ts) {
      pulseTimer += 1;
      if (pulseTimer % 26 === 0 && pulses.length < 7) spawnPulse();
      pulses.forEach(function (p) {
        p.t += p.speed;
        if (p.t >= 1) { p.t = 0; p.seg += 1; }
      });
      pulses = pulses.filter(function (p) { return p.seg < p.path.length - 1; });
      draw();
    });

    mount.addEventListener("pointermove", function (e) {
      var r = mount.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }, { passive: true });
    mount.addEventListener("pointerleave", function () { pointer.x = -999; pointer.y = -999; }, { passive: true });

    themeListeners.push(draw);
    build();
  }

  /* ── Demo 1: Inverse design — name the target, watch it search ── */
  function initInverse() {
    var mount = document.querySelector('[data-ai="inverse"]');
    if (!mount) return;
    var sElec = document.getElementById("ai-target-elec");
    var sTherm = document.getElementById("ai-target-thermal");
    var sMech = document.getElementById("ai-target-mech");
    var outFamily = document.getElementById("ai-rec-family");
    var outLoading = document.getElementById("ai-rec-loading");
    var outRoute = document.getElementById("ai-rec-route");
    var outConf = document.getElementById("ai-rec-confidence");

    var surface = setupCanvas(mount, function () { draw(); });
    var ctx = surface.ctx;

    // Design space: x = CNT loading (0..1), y = network quality (0..1).
    var target = { x: 0.5, y: 0.6 };
    var agents = [];
    for (var i = 0; i < 16; i += 1) {
      agents.push({ x: Math.random(), y: Math.random(), bx: Math.random(), by: Math.random(), bs: 1e9 });
    }
    var best = { x: 0.5, y: 0.5, score: 1e9 };
    var converge = 0;

    function readTargets() {
      var e = (Number(sElec ? sElec.value : 60)) / 100;
      var t = (Number(sTherm ? sTherm.value : 50)) / 100;
      var m = (Number(sMech ? sMech.value : 40)) / 100;
      // Higher demand → more loading; electrical favours high-quality network
      // at lower loading, mechanical favours more material.
      target.x = clamp(0.2 + m * 0.6 + t * 0.25 - e * 0.15, 0.05, 0.95);
      target.y = clamp(0.35 + e * 0.55 + t * 0.2, 0.1, 0.98);
      return { e: e, t: t, m: m };
    }

    function objective(x, y) {
      var dx = x - target.x, dy = y - target.y;
      return dx * dx + dy * dy;
    }

    function updateRecipe(mix) {
      if (!outFamily) return;
      var family;
      if (mix.m > mix.e && mix.m > mix.t) family = "SWCNT–graphene hybrid";
      else if (mix.t > mix.e) family = "MWCNT + graphene (TIM route)";
      else if (mix.e > 0.6 && best.x < 0.5) family = "SWCNT (HexTubes SW)";
      else family = "MWCNT (HexTubes MW)";
      var loadingPct = (0.3 + best.x * 4.7).toFixed(1);
      var route = best.y > 0.66 ? "Solvent, high-shear + sonication"
        : best.y > 0.4 ? "Aqueous surfactant dispersion"
          : "Dry masterbatch let-down";
      var conf = Math.round(clamp(58 + converge * 36, 58, 95));
      outFamily.textContent = family;
      outLoading.textContent = loadingPct + " wt%";
      outRoute.textContent = route;
      outConf.textContent = conf + "% confidence";
    }

    function draw() {
      var w = surface.box.w, h = surface.box.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      var pad = 30;
      function px(x) { return pad + x * (w - pad * 2); }
      function py(y) { return h - pad - y * (h - pad * 2); }

      // Objective contour rings around the target optimum.
      for (var ring = 6; ring >= 1; ring -= 1) {
        var rr = ring / 6;
        ctx.strokeStyle = rgba(lerpColor(THEME.teal, THEME.accent, 1 - rr), 0.12 + (1 - rr) * 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px(target.x), py(target.y), rr * (w - pad * 2) * 0.42, rr * (h - pad * 2) * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Axes labels.
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("CNT loading →", pad, h - 8);
      ctx.save();
      ctx.translate(12, h - pad);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("network quality →", 0, 0);
      ctx.restore();

      // Agents (the search swarm).
      agents.forEach(function (a) {
        ctx.fillStyle = rgba(THEME.muted, 0.5);
        ctx.beginPath();
        ctx.arc(px(a.x), py(a.y), 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Current best + target.
      ctx.strokeStyle = rgba(THEME.accent, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px(best.x), py(best.y), 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = rgba(THEME.teal, 0.9);
      for (var k = 0; k < 6; k += 1) {
        var ang = Math.PI / 3 * k + Math.PI / 6;
        var bx = px(target.x) + 6 * Math.cos(ang);
        var by = py(target.y) + 6 * Math.sin(ang);
        if (k === 0) ctx.beginPath(), ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rgba(THEME.ink, 0.9);
      ctx.font = "600 11px 'Space Grotesk', sans-serif";
      ctx.fillText(converge > 0.85 ? "OPTIMUM FOUND" : "SEARCHING…", pad, 18);
    }

    var mix = readTargets();
    makeLoop(mount, function () {
      // Particle-swarm-ish descent toward the (shifting) target.
      var inertia = 0.78;
      agents.forEach(function (a) {
        var s = objective(a.x, a.y);
        if (s < a.bs) { a.bs = s; a.bx = a.x; a.by = a.y; }
        if (s < best.score) { best.score = s; best.x = a.x; best.y = a.y; }
        a.vx = (a.vx || 0) * inertia + (a.bx - a.x) * 0.05 + (best.x - a.x) * 0.05 + (Math.random() - 0.5) * 0.01;
        a.vy = (a.vy || 0) * inertia + (a.by - a.y) * 0.05 + (best.y - a.y) * 0.05 + (Math.random() - 0.5) * 0.01;
        a.x = clamp(a.x + a.vx, 0, 1);
        a.y = clamp(a.y + a.vy, 0, 1);
      });
      // Converge metric: how tightly best tracks target.
      var d = Math.sqrt(objective(best.x, best.y));
      converge = clamp(1 - d * 2.4, 0, 1);
      updateRecipe(mix);
      draw();
    });

    function onTarget() {
      mix = readTargets();
      best.score = 1e9; // re-search when the goal moves
      agents.forEach(function (a) { a.bs = 1e9; });
      converge = 0;
      markInteract("inverse", "target");
    }
    [sElec, sTherm, sMech].forEach(function (s) {
      if (s) s.addEventListener("input", onTarget);
    });

    themeListeners.push(draw);
  }

  /* ── Demo 2: Property prediction — turn the knobs, see the outcome ── */
  function initPredict() {
    var mount = document.querySelector('[data-ai="predict"]');
    if (!mount) return;
    var sLoad = document.getElementById("ai-in-loading");
    var sAspect = document.getElementById("ai-in-aspect");
    var sDisp = document.getElementById("ai-in-dispersion");
    var sAlign = document.getElementById("ai-in-align");

    var surface = setupCanvas(mount, function () { rods = null; draw(); });
    var ctx = surface.ctx;
    var rods = null;

    function inputs() {
      return {
        L: Number(sLoad ? sLoad.value : 40) / 100,
        A: Number(sAspect ? sAspect.value : 50) / 100,
        D: Number(sDisp ? sDisp.value : 60) / 100,
        Al: Number(sAlign ? sAlign.value : 30) / 100
      };
    }

    function predict(p) {
      var perc = 1 / (1 + Math.exp(-(p.L * p.A * p.D * 10 - 3)));
      var elec = clamp(perc * 100, 2, 99);
      var therm = clamp(p.L * p.A * p.D * (0.5 + 0.5 * p.Al) * 105, 2, 99);
      var mech = clamp((0.35 + 0.65 * p.D) * Math.pow(p.A, 0.4) * (0.6 + 0.4 * p.Al) * p.L * 130, 2, 99);
      var trans = clamp(100 - p.L * 92, 3, 99);
      var unc = clamp((1 - p.D) * 26 + 6, 5, 34); // poor dispersion → less certain
      return { elec: elec, therm: therm, mech: mech, trans: trans, unc: unc };
    }

    function ensureRods(p) {
      var w = surface.box.w, h = surface.box.h;
      var n = Math.round(8 + p.L * 46);
      rods = [];
      // Clumping when dispersion is poor: cluster around a few seeds.
      var seeds = [];
      var clusters = Math.max(2, Math.round(2 + (1 - p.D) * 5));
      for (var c = 0; c < clusters; c += 1) {
        seeds.push({ x: w * (0.1 + Math.random() * 0.32), y: h * (0.14 + Math.random() * 0.72) });
      }
      for (var i = 0; i < n; i += 1) {
        var spread = 0.04 + p.D * 0.42;
        var useSeed = seeds[i % seeds.length];
        var x = p.D > 0.5
          ? w * (0.06 + Math.random() * 0.4)
          : clamp(useSeed.x + (Math.random() - 0.5) * w * spread, w * 0.05, w * 0.46);
        var y = p.D > 0.5
          ? h * (0.12 + Math.random() * 0.76)
          : clamp(useSeed.y + (Math.random() - 0.5) * h * spread, h * 0.1, h * 0.88);
        rods.push({ x: x, y: y, len: 12 + p.A * 26, ang: Math.random() * Math.PI });
      }
    }

    function bar(x, y, w, val, unc, label, color) {
      var bh = 13;
      ctx.fillStyle = rgba(THEME.muted, 0.16);
      ctx.fillRect(x, y, w, bh);
      ctx.fillStyle = rgba(color, 0.85);
      ctx.fillRect(x, y, w * (val / 100), bh);
      // Uncertainty whisker.
      var cx = x + w * (val / 100);
      var uw = w * (unc / 100);
      ctx.strokeStyle = rgba(THEME.ink, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(clamp(cx - uw, x, x + w), y + bh / 2);
      ctx.lineTo(clamp(cx + uw, x, x + w), y + bh / 2);
      ctx.moveTo(clamp(cx - uw, x, x + w), y + 2); ctx.lineTo(clamp(cx - uw, x, x + w), y + bh - 2);
      ctx.moveTo(clamp(cx + uw, x, x + w), y + 2); ctx.lineTo(clamp(cx + uw, x, x + w), y + bh - 2);
      ctx.stroke();
      ctx.fillStyle = rgba(THEME.ink, 0.9);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(label, x, y - 4);
    }

    function draw() {
      var w = surface.box.w, h = surface.box.h;
      if (!w) return;
      var p = inputs();
      if (!rods) ensureRods(p);
      ctx.clearRect(0, 0, w, h);

      // Left: formulation schematic.
      ctx.strokeStyle = rgba(THEME.muted, 0.4);
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.04, h * 0.08, w * 0.44, h * 0.84);
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "600 10px 'Space Grotesk', sans-serif";
      ctx.fillText("FORMULATION", w * 0.04, h * 0.06);
      rods.forEach(function (r) {
        var ang = r.ang * (1 - p.Al) + (Math.PI / 12) * p.Al; // align toward horizontal
        ctx.strokeStyle = rgba(THEME.accent, 0.6);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(r.x - Math.cos(ang) * r.len / 2, r.y - Math.sin(ang) * r.len / 2);
        ctx.lineTo(r.x + Math.cos(ang) * r.len / 2, r.y + Math.sin(ang) * r.len / 2);
        ctx.stroke();
      });

      // Right: predicted properties.
      var pr = predict(p);
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "600 10px 'Space Grotesk', sans-serif";
      ctx.fillText("PREDICTED — with uncertainty", w * 0.54, h * 0.06);
      var bx = w * 0.54, bw = w * 0.42;
      bar(bx, h * 0.2, bw, pr.elec, pr.unc, "Electrical conductivity", THEME.accent);
      bar(bx, h * 0.42, bw, pr.therm, pr.unc, "Thermal conductivity", THEME.teal);
      bar(bx, h * 0.64, bw, pr.mech, pr.unc, "Tensile strength", THEME.bright);
      bar(bx, h * 0.86, bw, pr.trans, Math.min(pr.unc, 10), "Optical transparency", THEME.muted);
    }

    [sLoad, sAspect, sDisp, sAlign].forEach(function (s) {
      if (s) s.addEventListener("input", function () {
        rods = null;
        markInteract("predict", "knob");
        draw();
      });
    });

    // Static unless reduced motion — redraw on demand only (no rAF needed).
    themeListeners.push(function () { rods = null; draw(); });
    makeLoop(mount, function () { draw(); });
  }

  /* ── Demo 3: Active learning — hunt for the best recipe in fewest runs ──
     Framed concretely: two real knobs, a hidden performance landscape with
     one best recipe, fog that lifts where you test, and a "best so far"
     meter. The engine proposes the most useful next test; you watch it home
     in far faster than random testing would. */
  function initActive() {
    var mount = document.querySelector('[data-ai="active"]');
    if (!mount) return;
    var btnSuggest = document.getElementById("ai-suggest");
    var btnRun = document.getElementById("ai-run");
    var btnAuto = document.getElementById("ai-auto");
    var btnReset = document.getElementById("ai-reset");
    var outCount = document.getElementById("ai-exp-count");
    var outBest = document.getElementById("ai-best");
    var outStatus = document.getElementById("ai-active-status");
    var outCompare = document.getElementById("ai-compare");

    var surface = setupCanvas(mount, function () { /* redraw via loop */ });
    var ctx = surface.ctx;

    // Hidden performance landscape: one clear best recipe + a minor ridge.
    function truth(x, y) {
      function bump(cx, cy, s, a) {
        var dx = x - cx, dy = y - cy;
        return a * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
      }
      return clamp(bump(0.68, 0.62, 0.2, 1) + bump(0.28, 0.32, 0.24, 0.5), 0, 1);
    }
    // Precompute the true optimum value for the "best so far" meter.
    var trueMax = 0;
    for (var sx = 0; sx <= 1; sx += 0.04) {
      for (var sy = 0; sy <= 1; sy += 0.04) { trueMax = Math.max(trueMax, truth(sx, sy)); }
    }

    var samples = [];
    var candidate = null;
    var count = 0;
    var auto = false;
    var autoIv = null;

    function bestValue() {
      var b = 0;
      samples.forEach(function (s) { if (s.v > b) b = s.v; });
      return b;
    }

    function seed() {
      samples = [];
      count = 0;
      auto = false;
      // Seed away from the hidden peak so the hunt is real and visible.
      [[0.14, 0.2], [0.88, 0.86], [0.2, 0.86]].forEach(function (s) {
        samples.push({ x: s[0], y: s[1], v: truth(s[0], s[1]), age: 1 });
      });
      candidate = null;
      status("3 starting experiments on the board. Now hunt for the best recipe.");
      if (outCompare) outCompare.hidden = true;
      sync();
    }

    function status(msg) { if (outStatus) outStatus.textContent = msg; }

    function uncertaintyAt(x, y) {
      var min = 1e9;
      samples.forEach(function (s) {
        var dx = x - s.x, dy = y - s.y;
        min = Math.min(min, dx * dx + dy * dy);
      });
      return clamp(Math.sqrt(min) * 1.7, 0, 1);
    }
    function predictAt(x, y) {
      // Inverse-distance-weighted estimate from measured points.
      var num = 0, den = 0;
      samples.forEach(function (s) {
        var dx = x - s.x, dy = y - s.y;
        var w = 1 / (dx * dx + dy * dy + 0.004);
        num += w * s.v; den += w;
      });
      return den ? num / den : 0;
    }
    // Acquisition: balance "looks promising" with "still unsure" (UCB-style).
    // Exploration weight eases off as evidence accumulates, so the search
    // explores first, then climbs to exploit the best region.
    function acquisition(x, y) {
      var explore = clamp(0.85 - count * 0.06, 0.28, 0.85);
      return predictAt(x, y) + explore * uncertaintyAt(x, y);
    }

    function sync() {
      if (outCount) outCount.textContent = String(count);
      if (outBest) outBest.textContent = Math.round((bestValue() / trueMax) * 100) + "%";
    }

    function draw() {
      var w = surface.box.w, h = surface.box.h;
      if (!w) return;
      var pad = 30;
      function px(x) { return pad + x * (w - pad * 2); }
      function py(y) { return h - pad - y * (h - pad * 2); }
      ctx.clearRect(0, 0, w, h);

      // Faint ghost of the true landscape — a subtle hint of where the peak is.
      var cells = 18;
      var cw = (w - pad * 2) / cells, ch = (h - pad * 2) / cells;
      for (var i = 0; i < cells; i += 1) {
        for (var j = 0; j < cells; j += 1) {
          var x = (i + 0.5) / cells, y = (j + 0.5) / cells;
          var v = truth(x, y);
          ctx.fillStyle = rgba(lerpColor(THEME.muted, THEME.accent, v), 0.06 + v * 0.06);
          ctx.fillRect(pad + i * cw, py(y) - ch / 2, cw + 1, ch + 1);
        }
      }

      // Fog of the unknown, punched open where we've measured.
      ctx.save();
      ctx.fillStyle = THEME.dark ? "rgba(8,14,22,0.74)" : "rgba(244,247,251,0.82)";
      ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.globalCompositeOperation = "destination-out";
      samples.forEach(function (s) {
        var r = (0.13 + s.v * 0.06) * (w - pad * 2) * s.age;
        var g = ctx.createRadialGradient(px(s.x), py(s.y), 0, px(s.x), py(s.y), Math.max(1, r));
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.7, "rgba(0,0,0,0.9)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px(s.x), py(s.y), Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Plot frame + axis labels (concrete knobs).
      ctx.strokeStyle = rgba(THEME.muted, 0.45);
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.fillStyle = rgba(THEME.muted, 0.9);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("CNT loading →", pad + 2, h - pad + 16);
      ctx.save();
      ctx.translate(pad - 14, h - pad);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("dispersion energy →", 0, 0);
      ctx.restore();

      var best = bestValue();
      // Measured points, coloured by performance; the leader gets a ring.
      samples.forEach(function (s) {
        if (s.age < 0.05) return;
        var col = lerpColor(THEME.muted, THEME.teal, s.v);
        ctx.fillStyle = rgba(col, 0.9);
        ctx.beginPath();
        ctx.arc(px(s.x), py(s.y), (3 + s.v * 7) * s.age, 0, Math.PI * 2);
        ctx.fill();
        if (s.v === best && best > 0) {
          ctx.strokeStyle = rgba(THEME.bright, 0.95);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px(s.x), py(s.y), 12 + Math.sin(performance.now() * 0.005) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Candidate crosshair with a plain-language tag.
      if (candidate) {
        var cx = px(candidate.x), cy = py(candidate.y);
        ctx.strokeStyle = rgba(THEME.hot, 0.9);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
        ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
        ctx.stroke();
        ctx.fillStyle = rgba(THEME.hot, 0.95);
        ctx.font = "600 10px 'Space Grotesk', sans-serif";
        ctx.fillText("test here next", cx + 16, cy - 12);
      }

      // "Best recipe so far" meter, top-left.
      ctx.fillStyle = rgba(THEME.ink, 0.9);
      ctx.font = "600 10px 'Space Grotesk', sans-serif";
      ctx.fillText("BEST RECIPE FOUND", pad, 18);
      ctx.fillStyle = rgba(THEME.muted, 0.25);
      ctx.fillRect(pad, 22, 120, 6);
      ctx.fillStyle = rgba(THEME.teal, 0.95);
      ctx.fillRect(pad, 22, 120 * (best / trueMax), 6);
    }

    function suggest() {
      if (candidate) return;
      var bestA = -1, bx = 0.5, by = 0.5;
      for (var gx = 0.06; gx < 1; gx += 0.05) {
        for (var gy = 0.06; gy < 1; gy += 0.05) {
          var a = acquisition(gx, gy);
          if (a > bestA) { bestA = a; bx = gx; by = gy; }
        }
      }
      candidate = { x: bx, y: by };
      status("The engine proposes the most informative recipe to test next — where promise and uncertainty are both high.");
      markInteract("active", "suggest");
    }

    function run() {
      if (!candidate) { suggest(); return; }
      var prevBest = bestValue();
      var v = truth(candidate.x, candidate.y);
      samples.push({ x: candidate.x, y: candidate.y, v: v, age: 0 });
      candidate = null;
      count += 1;
      var pct = Math.round((v / trueMax) * 100);
      var newBest = bestValue();
      if (newBest > prevBest + 0.001) {
        status("Measured " + pct + "% of the best possible — a new leader. The map sharpens around it.");
      } else {
        status("Measured " + pct + "%. Not a winner, but it rules out a region — still progress.");
      }
      if (newBest / trueMax > 0.9) {
        status("Best recipe pinned in just " + count + " guided experiments. That's the point.");
        auto = false;
        if (outCompare) {
          outCompare.hidden = false;
          outCompare.textContent = "Random trial-and-error typically needs 2–3× more runs to reach the same recipe.";
        }
      }
      markInteract("active", "run");
      sync();
    }

    function stopAuto() {
      auto = false;
      if (autoIv) { window.clearInterval(autoIv); autoIv = null; }
      if (btnAuto) btnAuto.textContent = "Auto-run";
    }

    function autoStep() {
      if (bestValue() / trueMax > 0.9) { stopAuto(); return; }
      if (!candidate) suggest(); else run();
    }

    if (btnSuggest) btnSuggest.addEventListener("click", function () { stopAuto(); suggest(); });
    if (btnRun) btnRun.addEventListener("click", function () { stopAuto(); run(); });
    if (btnAuto) btnAuto.addEventListener("click", function () {
      if (auto) { stopAuto(); return; }
      auto = true;
      btnAuto.textContent = "Pause";
      markInteract("active", "auto");
      autoStep();
      autoIv = window.setInterval(autoStep, 620);
    });
    if (btnReset) btnReset.addEventListener("click", function () { stopAuto(); seed(); });

    themeListeners.push(draw);
    makeLoop(mount, function () {
      // Fog lifts smoothly as each measurement settles in.
      samples.forEach(function (s) { if (s.age < 1) s.age = Math.min(1, s.age + 0.06); });
      draw();
    });
    seed();
  }

  /* ── Demo 4: Enterprise — one engine across every program ──
     Toggle the shared engine off and programs crawl in silos; on, every
     measurement compounds into shared knowledge that speeds them all. */
  function initEnterprise() {
    var mount = document.querySelector('[data-ai="enterprise"]');
    if (!mount) return;
    var toggles = Array.prototype.slice.call(document.querySelectorAll("[data-ent-toggle]"));
    var outPrograms = document.getElementById("ai-ent-programs");
    var outExp = document.getElementById("ai-ent-exp");
    var outSpeed = document.getElementById("ai-ent-speed");

    var surface = setupCanvas(mount, function () { layout(); });
    var ctx = surface.ctx;
    var STAGES = ["Design", "Make", "Measure", "Qualify", "Ship"];
    var NAMES = ["EV battery cell", "Aerospace skin", "Thermal module", "Conductive ink"];
    var programs = [];
    var withEngine = true;
    var knowledge = 0;      // grows as measurements compound
    var experiments = 0;
    var pulses = [];

    function layout() {
      programs = NAMES.map(function (name, i) {
        return { name: name, pos: Math.random() * 0.4, row: i, done: 0 };
      });
    }

    function knowledgeSpeed() {
      // Shared engine: speed rises as knowledge compounds. Silos: flat + slow.
      return withEngine ? 0.0016 + knowledge * 0.00045 : 0.0011;
    }

    function draw() {
      var w = surface.box.w, h = surface.box.h;
      if (!w || !programs.length) return;
      ctx.clearRect(0, 0, w, h);

      var leftPad = w * 0.27;
      var trackW = w * 0.66;
      var topPad = h * 0.16;
      var rowH = (h * 0.74) / programs.length;

      // Stage gridlines + labels.
      ctx.font = "9px Inter, sans-serif";
      for (var s = 0; s < STAGES.length; s += 1) {
        var sx = leftPad + trackW * (s / (STAGES.length - 1));
        ctx.strokeStyle = rgba(THEME.muted, 0.16);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, topPad - 8);
        ctx.lineTo(sx, topPad + rowH * programs.length - rowH * 0.4);
        ctx.stroke();
        ctx.fillStyle = rgba(THEME.muted, 0.85);
        ctx.textAlign = "center";
        ctx.fillText(STAGES[s], sx, topPad - 14);
      }
      ctx.textAlign = "left";

      // Knowledge core (right side) — grows with shared learning.
      var coreX = w * 0.93, coreY = topPad - 2;
      if (withEngine) {
        var kr = 6 + Math.min(22, knowledge * 0.6);
        ctx.strokeStyle = rgba(THEME.accent, 0.5);
        ctx.lineWidth = 1.4;
        for (var ring = 0; ring < 6; ring += 1) {
          var rr = 4 + ring * 4 + (knowledge * 0.3);
          if (rr > kr + 14) break;
          ctx.beginPath();
          for (var k = 0; k < 6; k += 1) {
            var a = Math.PI / 3 * k + Math.PI / 6;
            var hx = coreX + rr * Math.cos(a), hy = coreY + rr * Math.sin(a);
            if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Programs.
      programs.forEach(function (p, i) {
        var y = topPad + i * rowH + rowH * 0.2;
        // Label.
        ctx.fillStyle = rgba(THEME.ink, 0.9);
        ctx.font = "600 11px 'Space Grotesk', sans-serif";
        ctx.fillText(p.name, w * 0.04, y + 4);
        // Track.
        ctx.strokeStyle = rgba(THEME.muted, 0.22);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftPad, y);
        ctx.lineTo(leftPad + trackW, y);
        ctx.stroke();
        // Progress fill.
        ctx.strokeStyle = rgba(withEngine ? THEME.teal : THEME.muted, withEngine ? 0.85 : 0.5);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftPad, y);
        ctx.lineTo(leftPad + trackW * clamp(p.pos, 0, 1), y);
        ctx.stroke();
        // Token.
        ctx.fillStyle = rgba(withEngine ? THEME.teal : THEME.muted, 1);
        ctx.beginPath();
        ctx.arc(leftPad + trackW * clamp(p.pos, 0, 1), y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Compounding-knowledge pulses flying to the core.
      pulses.forEach(function (pu) {
        ctx.fillStyle = rgba(THEME.accent, pu.life);
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(withEngine ? "shared engine — every result teaches every program"
        : "siloed — each program learns alone", w * 0.04, h - 8);
    }

    function sync() {
      if (outPrograms) outPrograms.textContent = String(programs.length);
      if (outExp) outExp.textContent = String(experiments);
      if (outSpeed) outSpeed.textContent = withEngine
        ? (1 + knowledge * 0.04).toFixed(1) + "×"
        : "1.0×";
    }

    makeLoop(mount, function () {
      var w = surface.box.w, h = surface.box.h;
      var leftPad = w * 0.27, trackW = w * 0.66, topPad = h * 0.16;
      var rowH = (h * 0.74) / Math.max(1, programs.length);
      programs.forEach(function (p, i) {
        var prev = p.pos;
        p.pos += knowledgeSpeed();
        // Crossing the "Measure" stage emits a knowledge pulse (shared engine).
        var measureAt = 2 / (STAGES.length - 1);
        if (withEngine && prev < measureAt && p.pos >= measureAt) {
          experiments += 1;
          knowledge = Math.min(40, knowledge + 1);
          var y = topPad + i * rowH + rowH * 0.2;
          pulses.push({ x: leftPad + trackW * measureAt, y: y, tx: w * 0.93, ty: topPad - 2, life: 1 });
          sync();
        }
        if (p.pos >= 1) { p.pos = 0; p.done += 1; } // next program in the queue
      });
      pulses.forEach(function (pu) {
        pu.x += (pu.tx - pu.x) * 0.08;
        pu.y += (pu.ty - pu.y) * 0.08;
        pu.life -= 0.02;
      });
      pulses = pulses.filter(function (pu) { return pu.life > 0; });
      draw();
    });

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        withEngine = btn.getAttribute("data-ent-toggle") === "with";
        if (!withEngine) knowledge = 0;
        toggles.forEach(function (o) {
          var on = o === btn;
          o.classList.toggle("is-active", on);
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
        markInteract("enterprise", withEngine ? "with" : "without");
        sync();
      });
    });

    themeListeners.push(draw);
    layout();
    sync();
  }

  function init() {
    readTheme();
    new MutationObserver(function () {
      readTheme();
      themeListeners.forEach(function (cb) { cb(); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    initNetwork();
    initInverse();
    initPredict();
    initActive();
    initEnterprise();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
