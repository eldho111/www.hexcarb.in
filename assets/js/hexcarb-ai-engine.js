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

  /* ── Demo 3: Active-learning loop — suggest, run, watch uncertainty fall ── */
  function initActive() {
    var mount = document.querySelector('[data-ai="active"]');
    if (!mount) return;
    var btnSuggest = document.getElementById("ai-suggest");
    var btnRun = document.getElementById("ai-run");
    var btnReset = document.getElementById("ai-reset");
    var outCount = document.getElementById("ai-exp-count");
    var outUnc = document.getElementById("ai-uncertainty");

    var surface = setupCanvas(mount, function () { draw(); });
    var ctx = surface.ctx;

    // Hidden "true" response surface (a couple of gaussian bumps).
    function truth(x, y) {
      function bump(cx, cy, s, a) {
        var dx = x - cx, dy = y - cy;
        return a * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
      }
      return clamp(bump(0.7, 0.65, 0.18, 1) + bump(0.3, 0.3, 0.22, 0.6), 0, 1);
    }

    var samples = [];
    var candidate = null;
    var count = 0;

    function seed() {
      samples = [];
      count = 0;
      [[0.2, 0.8], [0.85, 0.25], [0.5, 0.5]].forEach(function (s) {
        samples.push({ x: s[0], y: s[1], v: truth(s[0], s[1]) });
      });
      candidate = null;
      sync();
    }

    function uncertaintyAt(x, y) {
      // Distance to nearest sample → proxy for model uncertainty.
      var min = 1e9;
      samples.forEach(function (s) {
        var dx = x - s.x, dy = y - s.y;
        min = Math.min(min, dx * dx + dy * dy);
      });
      return clamp(Math.sqrt(min) * 1.6, 0, 1);
    }

    function meanUncertainty() {
      var sum = 0, n = 0;
      for (var gx = 0.05; gx < 1; gx += 0.1) {
        for (var gy = 0.05; gy < 1; gy += 0.1) {
          sum += uncertaintyAt(gx, gy); n += 1;
        }
      }
      return sum / n;
    }

    function sync() {
      if (outCount) outCount.textContent = String(count);
      if (outUnc) outUnc.textContent = Math.round(meanUncertainty() * 100) + "%";
    }

    function draw() {
      var w = surface.box.w, h = surface.box.h;
      if (!w) return;
      var pad = 26;
      function px(x) { return pad + x * (w - pad * 2); }
      function py(y) { return h - pad - y * (h - pad * 2); }
      ctx.clearRect(0, 0, w, h);

      // Uncertainty field as a coarse heat grid.
      var cells = 16;
      for (var i = 0; i < cells; i += 1) {
        for (var j = 0; j < cells; j += 1) {
          var x = (i + 0.5) / cells, y = (j + 0.5) / cells;
          var u = uncertaintyAt(x, y);
          ctx.fillStyle = rgba(THEME.accent, u * 0.16);
          ctx.fillRect(px(x) - (w - pad * 2) / cells / 2, py(y) - (h - pad * 2) / cells / 2,
            (w - pad * 2) / cells + 1, (h - pad * 2) / cells + 1);
        }
      }

      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("gold = where the model is still unsure", pad, h - 8);

      // Measured samples sized by value.
      samples.forEach(function (s) {
        ctx.fillStyle = rgba(THEME.teal, 0.85);
        ctx.beginPath();
        ctx.arc(px(s.x), py(s.y), 3 + s.v * 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Candidate crosshair.
      if (candidate) {
        ctx.strokeStyle = rgba(THEME.hot, 0.9);
        ctx.lineWidth = 1.4;
        var cx = px(candidate.x), cy = py(candidate.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
        ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
        ctx.stroke();
        ctx.fillStyle = rgba(THEME.hot, 0.95);
        ctx.font = "600 10px 'Space Grotesk', sans-serif";
        ctx.fillText("proposed next experiment", cx + 16, cy - 10);
      }
    }

    function suggest() {
      // Pick the grid point of maximum uncertainty.
      var bestU = -1, bx = 0.5, by = 0.5;
      for (var gx = 0.08; gx < 1; gx += 0.06) {
        for (var gy = 0.08; gy < 1; gy += 0.06) {
          var u = uncertaintyAt(gx, gy);
          if (u > bestU) { bestU = u; bx = gx; by = gy; }
        }
      }
      candidate = { x: bx, y: by };
      markInteract("active", "suggest");
      draw();
    }

    function run() {
      if (!candidate) { suggest(); return; }
      samples.push({ x: candidate.x, y: candidate.y, v: truth(candidate.x, candidate.y) });
      candidate = null;
      count += 1;
      markInteract("active", "run");
      sync();
      draw();
    }

    if (btnSuggest) btnSuggest.addEventListener("click", suggest);
    if (btnRun) btnRun.addEventListener("click", run);
    if (btnReset) btnReset.addEventListener("click", function () { seed(); draw(); });

    themeListeners.push(draw);
    // Light idle loop so theme + first paint settle; cheap (static between clicks).
    makeLoop(mount, function () { /* no per-frame state; draw on demand */ });
    seed();
    draw();
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
