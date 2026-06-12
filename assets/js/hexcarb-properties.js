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
      "Inside: bundles of nanotubes — about 1 µm across.",
      "A single nanotube — about 1.5 nm wide. 50,000× thinner than a hair.",
      "The wall itself: carbon atoms, 0.142 nm apart. Pure hexagons."
    ];
    var MAG_MAX_LOG = Math.log10(7000000); // ×7,000,000 from 1 mm to bond scale

    var surface = setupCanvas(mount, function () { lattice = null; });
    var ctx = surface.ctx;
    var lattice = null;
    var progress = 0;
    var lastStage = -1;
    var pointer = { x: 0.5, y: 0.5 };
    var clock = 0;

    function ensureLattice() {
      lattice = buildHoneycomb(surface.box.w, surface.box.h, Math.max(26, surface.box.w / 16), 0, 0);
    }

    function drawStage(i, alpha, scale) {
      if (alpha <= 0.01) return;
      var w = surface.box.w;
      var h = surface.box.h;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);

      if (i === 0) {
        // Twisted yarn: gradient-shaded strands with a drifting weave.
        for (var s = 0; s < 6; s += 1) {
          var grad = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.7);
          grad.addColorStop(0, rgba(THEME.muted, 0.25));
          grad.addColorStop(0.45, rgba(THEME.ink, 0.85));
          grad.addColorStop(0.55, rgba(THEME.ink, 0.95));
          grad.addColorStop(1, rgba(THEME.muted, 0.3));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 15 - s * 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (var x = -20; x <= w + 20; x += 8) {
            var y = h / 2 + Math.sin(x / 64 + s * 1.35 + clock * 0.0002) * (16 + s * 5.5);
            if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        // Specular highlight along the top of the bundle.
        ctx.strokeStyle = rgba({ r: 255, g: 255, b: 255 }, THEME.dark ? 0.16 : 0.65);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (var hxx = -20; hxx <= w + 20; hxx += 10) {
          var hy = h / 2 - 20 + Math.sin(hxx / 64 + clock * 0.0002) * 14;
          if (hxx === -20) ctx.moveTo(hxx, hy); else ctx.lineTo(hxx, hy);
        }
        ctx.stroke();
      } else if (i === 1) {
        // Bundle: perspective-tapered tubes with end ellipses.
        for (var t = 0; t < 13; t += 1) {
          var yy = h * 0.12 + t * (h * 0.76 / 12);
          var sway = Math.sin(clock * 0.0004 + t) * 2.5;
          var near = t % 3 === 0;
          var color = near ? THEME.accent : THEME.muted;
          var bodyGrad = ctx.createLinearGradient(0, yy - 5, 0, yy + 5);
          bodyGrad.addColorStop(0, rgba(color, near ? 0.7 : 0.42));
          bodyGrad.addColorStop(0.5, rgba(color, near ? 0.4 : 0.22));
          bodyGrad.addColorStop(1, rgba(color, near ? 0.7 : 0.42));
          ctx.strokeStyle = bodyGrad;
          ctx.lineWidth = near ? 9 : 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(w * 0.05, yy + sway);
          ctx.lineTo(w * 0.95, yy - sway);
          ctx.stroke();
          ctx.strokeStyle = rgba(color, near ? 0.85 : 0.5);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(w * 0.95, yy - sway, 3.4, near ? 5 : 3.4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (i === 2) {
        // A single tube with a chiral hexagon wrap and a specular band.
        var top = h * 0.3;
        var bottom = h * 0.7;
        var mid = (top + bottom) / 2;
        var radius = (bottom - top) / 2;
        // Wall shading.
        var shellGrad = ctx.createLinearGradient(0, top, 0, bottom);
        shellGrad.addColorStop(0, rgba(THEME.muted, 0.18));
        shellGrad.addColorStop(0.22, rgba({ r: 255, g: 255, b: 255 }, THEME.dark ? 0.07 : 0.5));
        shellGrad.addColorStop(0.6, rgba(THEME.muted, 0.08));
        shellGrad.addColorStop(1, rgba(THEME.muted, 0.24));
        ctx.fillStyle = shellGrad;
        ctx.fillRect(w * 0.05, top, w * 0.9, bottom - top);
        // Chiral wrap: two crossing helix families → hexagon rhythm.
        ctx.strokeStyle = rgba(THEME.accent, 0.45);
        ctx.lineWidth = 1.2;
        var pitch = 30;
        for (var d = -1; d <= 1; d += 2) {
          for (var x0 = w * 0.05 - radius * 2; x0 < w * 0.95; x0 += pitch) {
            ctx.beginPath();
            for (var ph = 0; ph <= Math.PI; ph += 0.2) {
              var px = x0 + (ph / Math.PI) * pitch * 2.2;
              var py = mid + d * Math.cos(ph) * radius;
              if (px < w * 0.05 || px > w * 0.95) continue;
              if (ph === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
        }
        // Outline + cap.
        ctx.strokeStyle = rgba(THEME.ink, 0.85);
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(w * 0.05, top); ctx.lineTo(w * 0.95, top);
        ctx.moveTo(w * 0.05, bottom); ctx.lineTo(w * 0.95, bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w * 0.95, mid, 13, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Atomic honeycomb with shimmer + pointer parallax.
        if (!lattice) ensureLattice();
        var par = { x: (pointer.x - 0.5) * 12, y: (pointer.y - 0.5) * 12 };
        ctx.save();
        ctx.translate(par.x, par.y);
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
        lattice.nodes.forEach(function (node, idx) {
          var pulse = 0.75 + Math.sin(clock * 0.002 + idx * 1.7) * 0.25;
          ctx.fillStyle = rgba(THEME.accent, 0.55 + pulse * 0.35);
          ctx.beginPath();
          ctx.arc(node.x, node.y, 2.6 + pulse * 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
      ctx.restore();
    }

    function formatMag(mag) {
      if (mag < 1000) return "×" + Math.round(mag);
      return "×" + Math.round(mag).toLocaleString("en-US");
    }

    function formatSize(mag) {
      var nm = 1e6 / mag; // 1 mm = 1e6 nm
      if (nm >= 1e6) return "1 mm";
      if (nm >= 1000) return (nm / 1000).toFixed(nm >= 10000 ? 0 : 1) + " µm";
      return nm >= 10 ? Math.round(nm) + " nm" : nm.toFixed(1) + " nm";
    }

    function drawChrome() {
      var w = surface.box.w;
      var h = surface.box.h;
      var mag = Math.pow(10, progress * MAG_MAX_LOG);

      // Magnification counter, top-right.
      ctx.textAlign = "right";
      ctx.fillStyle = rgba(THEME.ink, 0.92);
      ctx.font = "600 " + Math.max(20, Math.min(30, w / 26)) + "px 'Space Grotesk', sans-serif";
      ctx.fillText(formatMag(mag), w - 18, 36);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      ctx.fillText("MAGNIFICATION", w - 18, 52);
      ctx.textAlign = "left";

      // Log-scale ruler along the bottom.
      var pad = 56;
      var y = h - 24;
      ctx.strokeStyle = rgba(THEME.muted, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = rgba(THEME.muted, 0.85);
      [["1 mm", 0], ["1 µm", Math.log10(1000) / MAG_MAX_LOG], ["1 nm", Math.log10(1e6) / MAG_MAX_LOG]].forEach(function (tick) {
        var tx = pad + (w - pad * 2) * tick[1];
        ctx.beginPath();
        ctx.moveTo(tx, y - 4);
        ctx.lineTo(tx, y + 4);
        ctx.stroke();
        ctx.fillText(tick[0], tx - 10, y + 16);
      });
      // Hexagon marker at the current scale.
      var mx = pad + (w - pad * 2) * progress;
      ctx.fillStyle = rgba(THEME.bright, 1);
      ctx.beginPath();
      for (var k = 0; k < 6; k += 1) {
        var a = Math.PI / 3 * k + Math.PI / 6;
        var px = mx + 6 * Math.cos(a);
        var py = y + 6 * Math.sin(a);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(THEME.ink, 0.9);
      ctx.font = "600 11px 'Space Grotesk', sans-serif";
      ctx.fillText(formatSize(mag), mx + 12, y - 8);
    }

    function draw() {
      if (!surface.box.w) return;
      if (!lattice) ensureLattice();
      var w = surface.box.w;
      var h = surface.box.h;
      ctx.clearRect(0, 0, w, h);

      var f = progress * (STAGES.length - 1);
      var i = Math.min(STAGES.length - 2, Math.floor(f));
      var local = f - i;
      drawStage(i, 1 - local, 1 + local * 0.4);
      drawStage(i + 1, local, 0.7 + local * 0.3);

      // Depth cue: the deeper you zoom, the darker the field.
      ctx.fillStyle = "rgba(8,14,22," + (progress * (THEME.dark ? 0.34 : 0.16)).toFixed(3) + ")";
      ctx.fillRect(0, 0, w, h);

      drawChrome();

      var stage = Math.round(f);
      if (stage !== lastStage) {
        lastStage = stage;
        if (caption) caption.textContent = STAGES[stage];
      }
    }

    makeLoop(mount, function (ts) {
      clock = ts;
      draw();
    });

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
          markInteract("scale", "scrub");
        }
      });
    }

    mount.addEventListener("pointermove", function (event) {
      var rect = mount.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    }, { passive: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    themeListeners.push(function () { draw(); });
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
    var maxLoad = 0;       // highest load reached (drives the recorded curve)
    var broken = false;
    var dragging = false;
    var dragStartY = 0;
    var YIELD = 0.45;      // steel yield point (normalized)
    var FRACTURE = 0.92;   // steel fracture point

    function steelStress(strain) {
      // Elastic → yield plateau with slight hardening → fracture.
      if (strain <= YIELD) return strain * 1.0;
      return YIELD + (strain - YIELD) * 0.25;
    }

    function drawStressStrain() {
      var w = surface.box.w;
      var h = surface.box.h;
      var gx = w * 0.6;
      var gy = 16;
      var gw = w * 0.34;
      var gh = h * 0.3;

      ctx.fillStyle = THEME.dark ? "rgba(8,14,22,0.55)" : "rgba(255,255,255,0.7)";
      ctx.fillRect(gx - 8, gy - 6, gw + 16, gh + 30);
      ctx.strokeStyle = rgba(THEME.muted, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx, gy + gh);
      ctx.lineTo(gx + gw, gy + gh);
      ctx.stroke();
      ctx.font = "9px Inter, sans-serif";
      ctx.fillStyle = rgba(THEME.muted, 0.9);
      ctx.fillText("stress", gx + 2, gy + 8);
      ctx.fillText("strain →", gx + gw - 38, gy + gh + 12);

      function plot(stressFn, upTo, color, slope) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (var s = 0; s <= upTo; s += 0.02) {
          var px = gx + s * gw;
          var py = gy + gh - Math.min(1, stressFn(s) * slope) * (gh - 6);
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      var recorded = Math.max(maxLoad, 0.02);
      // Steel: recorded curve up to the furthest strain reached.
      plot(steelStress, broken ? FRACTURE : recorded, rgba(THEME.muted, 0.95), 1.15);
      if (broken) {
        var fx = gx + FRACTURE * gw;
        var fy = gy + gh - Math.min(1, steelStress(FRACTURE) * 1.15) * (gh - 6);
        ctx.strokeStyle = rgba(THEME.hot, 1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx - 4, fy - 4); ctx.lineTo(fx + 4, fy + 4);
        ctx.moveTo(fx + 4, fy - 4); ctx.lineTo(fx - 4, fy + 4);
        ctx.stroke();
      }
      // CNT: steep, purely elastic, keeps going past steel's fracture.
      plot(function (s) { return s; }, recorded, rgba(THEME.accent, 0.95), 2.1);

      // Operating points at the current load.
      if (load > 0.02 && !broken) {
        ctx.fillStyle = rgba(THEME.muted, 1);
        ctx.beginPath();
        ctx.arc(gx + load * gw, gy + gh - Math.min(1, steelStress(load) * 1.15) * (gh - 6), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (load > 0.02) {
        ctx.fillStyle = rgba(THEME.accent, 1);
        ctx.beginPath();
        ctx.arc(gx + load * gw, gy + gh - Math.min(1, load * 2.1) * (gh - 6), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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

      drawStressStrain();
    }

    var loop = makeLoop(mount, function () {
      var prev = load;
      load += (targetLoad - load) * 0.14;
      maxLoad = Math.max(maxLoad, load);
      if (!broken && load > FRACTURE) {
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
        maxLoad = 0;
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
    var sparks = [];
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
      // Translucent wipe instead of a clear: electrons leave fading streaks.
      ctx.fillStyle = THEME.dark ? "rgba(12,21,32,0.26)" : "rgba(255,255,255,0.3)";
      ctx.fillRect(0, 0, w, h);
      drawLane("COPPER — electrons scatter every ~40 nm", laneY("copper"), THEME.muted);
      drawLane("CARBON NANOTUBE — ballistic transport", laneY("cnt"), THEME.accent);

      particles.forEach(function (p) {
        ctx.fillStyle = p.lane === "cnt" ? rgba(THEME.teal, 0.95) : rgba(THEME.muted, 0.85);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.lane === "cnt" ? 2.4 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Scattering events flash briefly.
      for (var i = sparks.length - 1; i >= 0; i -= 1) {
        var s = sparks[i];
        ctx.fillStyle = rgba(THEME.hot, s.life * 0.8);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.6 + (1 - s.life) * 3, 0, Math.PI * 2);
        ctx.fill();
        s.life -= 0.06;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      ctx.fillStyle = rgba(THEME.muted, 0.95);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(holding ? "current flowing…" : "press and hold to apply current", w * 0.08, h - 12);
    }

    makeLoop(mount, function () {
      if (holding) spawn();
      var goal = surface.box.w * 0.92;
      for (var i = particles.length - 1; i >= 0; i -= 1) {
        var p = particles[i];
        if (p.lane === "copper") {
          // Scattering: random walk, sometimes bounced back with a spark.
          var scattered = Math.random() < 0.12;
          p.x += p.v * (scattered ? -0.8 : 1);
          p.y += (Math.random() - 0.5) * 3;
          if (scattered && sparks.length < 40) {
            sparks.push({ x: p.x, y: p.y, life: 1 });
          }
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

    var clock = 0;

    function drawNet(net) {
      // Phonons: hot atoms vibrate — jitter amplitude tracks temperature.
      var jx = [];
      var jy = [];
      net.nodes.forEach(function (n, idx) {
        var amp = n.t * 2.4;
        jx[idx] = n.x + Math.sin(clock * 0.025 + idx * 2.1) * amp;
        jy[idx] = n.y + Math.cos(clock * 0.031 + idx * 1.3) * amp;
      });
      net.edges.forEach(function (edge) {
        var a = net.nodes[edge.a];
        var b = net.nodes[edge.b];
        var heat = (a.t + b.t) / 2;
        var color = lerpColor(THEME.muted, THEME.hot, Math.min(1, heat * 1.4));
        ctx.strokeStyle = rgba(color, 0.35 + heat * 0.6);
        ctx.lineWidth = 1 + heat * 1.4;
        ctx.beginPath();
        ctx.moveTo(jx[edge.a], jy[edge.a]);
        ctx.lineTo(jx[edge.b], jy[edge.b]);
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

    makeLoop(mount, function (ts) {
      clock = ts / 16;
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

  /* ── 7. Real-world perspectives: one stage, five jobs ── */
  function initPerspectivesDemo() {
    var mount = document.querySelector('[data-demo="perspectives"]');
    if (!mount) return;
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-persp]"));
    var toggles = Array.prototype.slice.call(document.querySelectorAll("[data-cnt-toggle]"));
    var sliderWrap = document.getElementById("hc-persp-slider-wrap");
    var slider = document.getElementById("hc-persp-slider");
    var titleNode = document.getElementById("hc-persp-title");
    var descNode = document.getElementById("hc-persp-desc");
    var factsNode = document.getElementById("hc-persp-facts");
    var linkNode = document.getElementById("hc-persp-link");

    var surface = setupCanvas(mount, function () { seeded = null; });
    var ctx = surface.ctx;
    var state = {
      key: "battery",
      withCNT: true,
      density: 0.55,
      clock: 0,
      fade: 0,
      pointer: { x: 0.5, y: 0.5, on: false }
    };
    var seeded = null;

    function seededRandom(seedStart) {
      var seed = seedStart;
      return function () {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    }

    function ensureSeeds() {
      if (seeded) return;
      var w = surface.box.w;
      var h = surface.box.h;
      var rand = seededRandom(48271);
      seeded = { particles: [], rods: [], cracks: [] };
      for (var i = 0; i < 26; i += 1) {
        seeded.particles.push({
          x: w * (0.08 + rand() * 0.84),
          y: h * (0.12 + rand() * 0.55),
          r: 9 + rand() * 13
        });
      }
      for (var j = 0; j < 130; j += 1) {
        var angle = rand() * Math.PI;
        var len = 26 + rand() * 30;
        var cx = w * (0.06 + rand() * 0.88);
        var cy = h * (0.12 + rand() * 0.68);
        seeded.rods.push({
          x1: cx - Math.cos(angle) * len / 2, y1: cy - Math.sin(angle) * len / 2,
          x2: cx + Math.cos(angle) * len / 2, y2: cy + Math.sin(angle) * len / 2,
          order: rand()
        });
      }
    }

    var PERSPECTIVES = {
      battery: {
        title: "Battery electrode — conductive additive",
        desc: "Active cathode particles store the energy, but they barely conduct. A sparse CNT web wires every particle to the current collector.",
        facts: [
          "Under 1 wt% CNT replaces 3–5 wt% carbon black — more space for active material.",
          "A connected network sustains faster charge and discharge rates."
        ],
        link: "/shop.html#hexflow-a",
        label: "HexFlow dispersions",
        draw: function () {
          ensureSeeds();
          var w = surface.box.w;
          var h = surface.box.h;
          // Current collector.
          ctx.fillStyle = rgba(THEME.muted, 0.5);
          ctx.fillRect(w * 0.05, h * 0.82, w * 0.9, 7);
          ctx.font = "9px Inter, sans-serif";
          ctx.fillStyle = rgba(THEME.muted, 0.9);
          ctx.fillText("current collector", w * 0.05, h * 0.82 + 20);

          // CNT web: connect each particle to its nearest lower neighbour, chain to collector.
          if (state.withCNT) {
            ctx.strokeStyle = rgba(THEME.accent, 0.6);
            ctx.lineWidth = 1.1;
            seeded.particles.forEach(function (p) {
              var best = null;
              var bestD = 1e9;
              seeded.particles.forEach(function (q) {
                if (q === p || q.y <= p.y) return;
                var d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y);
                if (d < bestD) { bestD = d; best = q; }
              });
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              if (best && bestD < (w * 0.3) * (w * 0.3)) {
                ctx.lineTo(best.x, best.y);
              } else {
                ctx.lineTo(p.x + (p.x > w / 2 ? 10 : -10), h * 0.82);
              }
              ctx.stroke();
            });
            // Charge pulses drifting down the web.
            var t = (state.clock % 1400) / 1400;
            seeded.particles.forEach(function (p, idx) {
              if (idx % 3 !== 0) return;
              var py = p.y + (h * 0.82 - p.y) * ((t + idx * 0.13) % 1);
              ctx.fillStyle = rgba(THEME.teal, 0.9);
              ctx.beginPath();
              ctx.arc(p.x, py, 2, 0, Math.PI * 2);
              ctx.fill();
            });
          }

          // Particles: lit when connected, dim and stranded otherwise.
          seeded.particles.forEach(function (p) {
            var lit = state.withCNT || p.y + p.r > h * 0.74;
            ctx.fillStyle = lit ? rgba(THEME.teal, 0.3) : rgba(THEME.muted, 0.14);
            ctx.strokeStyle = lit ? rgba(THEME.teal, 0.8) : rgba(THEME.muted, 0.4);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          ctx.fillStyle = rgba(THEME.ink, 0.9);
          ctx.font = "600 11px 'Space Grotesk', sans-serif";
          ctx.fillText(state.withCNT ? "EVERY PARTICLE WIRED IN" : "STRANDED CAPACITY", w * 0.05, h * 0.08);
        }
      },

      concrete: {
        title: "Concrete additive — crack bridging",
        desc: "Concrete fails by microcracks growing into fractures. CNTs stitch across crack faces at the nanoscale and arrest them early.",
        facts: [
          "Nanoscale crack bridging improves flexural strength and durability.",
          "The conductive network is piezoresistive — the structure can sense its own strain."
        ],
        link: "/shop.html#hexblend",
        label: "HexBlend masterbatches",
        draw: function () {
          var w = surface.box.w;
          var h = surface.box.h;
          // Block under cyclic load.
          var pulse = 0.5 + Math.sin(state.clock * 0.0025) * 0.5;
          ctx.strokeStyle = rgba(THEME.muted, 0.7);
          ctx.lineWidth = 2;
          ctx.strokeRect(w * 0.16, h * 0.16, w * 0.68, h * 0.62);
          ctx.fillStyle = rgba(THEME.muted, 0.07);
          ctx.fillRect(w * 0.16, h * 0.16, w * 0.68, h * 0.62);
          // Load arrows.
          ctx.fillStyle = rgba(THEME.teal, 0.5 + pulse * 0.4);
          [[w * 0.5, h * 0.07, 0], [w * 0.5, h * 0.9, 1]].forEach(function (a) {
            ctx.beginPath();
            if (a[2] === 0) {
              ctx.moveTo(a[0] - 8, a[1]); ctx.lineTo(a[0] + 8, a[1]); ctx.lineTo(a[0], a[1] + 10);
            } else {
              ctx.moveTo(a[0] - 8, a[1]); ctx.lineTo(a[0] + 8, a[1]); ctx.lineTo(a[0], a[1] - 10);
            }
            ctx.closePath();
            ctx.fill();
          });

          // Crack from the top edge; CNT caps its growth.
          var maxLen = state.withCNT ? 0.24 : 0.55;
          var crackLen = (0.12 + pulse * maxLen) * h;
          ctx.strokeStyle = rgba(THEME.hot, 0.85);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          var cx = w * 0.5;
          var cy = h * 0.16;
          ctx.moveTo(cx, cy);
          var segments = 9;
          for (var s = 1; s <= segments; s += 1) {
            cx += Math.sin(s * 2.3) * 9;
            cy += crackLen / segments;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();

          if (state.withCNT) {
            // Fibers stitching across the crack near the tip.
            ctx.strokeStyle = rgba(THEME.accent, 0.9);
            ctx.lineWidth = 1.4;
            for (var f = 0; f < 7; f += 1) {
              var fy = h * 0.18 + (crackLen * (0.3 + f * 0.1));
              var fx = w * 0.5 + Math.sin((f + 1) * 2.3) * 7;
              ctx.beginPath();
              ctx.moveTo(fx - 13, fy - 4);
              ctx.lineTo(fx + 13, fy + 4);
              ctx.stroke();
            }
            ctx.fillStyle = rgba(THEME.accent, 1);
            ctx.font = "600 11px 'Space Grotesk', sans-serif";
            ctx.fillText("CRACK ARRESTED", w * 0.56, h * 0.42);
          } else {
            ctx.fillStyle = rgba(THEME.hot, 0.95);
            ctx.font = "600 11px 'Space Grotesk', sans-serif";
            ctx.fillText("CRACK GROWING", w * 0.56, h * 0.5);
          }
        }
      },

      film: {
        title: "Thin film — transparent conductor & EMI shield",
        desc: "Scatter enough tubes on a film and the network suddenly connects — sheet resistance collapses while the film stays see-through.",
        facts: [
          "Percolation at very low loading keeps films transparent and flexible.",
          "The same networks shield electromagnetic interference in lightweight housings."
        ],
        link: "/shop.html#hexink",
        label: "HexInk printed systems",
        slider: true,
        draw: function () {
          ensureSeeds();
          var w = surface.box.w;
          var h = surface.box.h;
          var density = state.withCNT ? state.density : 0;
          var connected = density >= 0.45;

          // What's behind the film stays visible: a circuit hint.
          ctx.fillStyle = rgba(THEME.muted, 0.25);
          ctx.font = "600 " + Math.round(w / 14) + "px 'Space Grotesk', sans-serif";
          ctx.fillText("DISPLAY", w * 0.3, h * 0.5);

          // Film.
          ctx.fillStyle = connected ? "rgba(180,140,60,0.06)" : "rgba(128,148,168,0.05)";
          ctx.fillRect(w * 0.05, h * 0.08, w * 0.9, h * 0.7);
          ctx.strokeStyle = rgba(THEME.muted, 0.5);
          ctx.lineWidth = 1;
          ctx.strokeRect(w * 0.05, h * 0.08, w * 0.9, h * 0.7);

          // Rod network: draw the first density-fraction of rods. Sparse
          // networks read grey and broken; past percolation they turn gold.
          var visible = Math.round(seeded.rods.length * density);
          seeded.rods.forEach(function (rod, idx) {
            if (idx >= visible) return;
            ctx.strokeStyle = connected
              ? rgba(THEME.accent, 0.7)
              : rgba(THEME.muted, 0.45);
            ctx.lineWidth = connected ? 1.3 : 1;
            ctx.beginPath();
            ctx.moveTo(rod.x1, rod.y1);
            ctx.lineTo(rod.x2, rod.y2);
            ctx.stroke();
          });

          // Once percolated, a current path lights up across the film.
          if (connected) {
            var path = seeded.rods.slice(0, visible)
              .map(function (rod) { return { x: (rod.x1 + rod.x2) / 2, y: (rod.y1 + rod.y2) / 2, o: rod.order }; })
              .filter(function (p) { return p.o < 0.3; })
              .sort(function (a, b) { return a.x - b.x; });
            if (path.length > 2) {
              ctx.strokeStyle = rgba(THEME.teal, 0.9);
              ctx.lineWidth = 1.8;
              ctx.setLineDash([7, 9]);
              ctx.lineDashOffset = -state.clock * 0.04;
              ctx.beginPath();
              ctx.moveTo(w * 0.05, path[0].y);
              path.forEach(function (p) { ctx.lineTo(p.x, p.y); });
              ctx.lineTo(w * 0.95, path[path.length - 1].y);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }

          // Readout: LED + sheet resistance.
          ctx.fillStyle = connected ? rgba(THEME.teal, 0.95) : rgba(THEME.muted, 0.3);
          ctx.beginPath();
          ctx.arc(w * 0.09, h * 0.9, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgba(THEME.ink, 0.9);
          ctx.font = "600 12px 'Space Grotesk', sans-serif";
          var ohms = connected
            ? Math.round(400 - (density - 0.45) * 550) + " Ω/sq"
            : "insulating";
          ctx.fillText("sheet resistance: " + ohms, w * 0.13, h * 0.9 + 4);
          ctx.fillStyle = rgba(THEME.muted, 0.85);
          ctx.font = "10px Inter, sans-serif";
          ctx.fillText(connected ? "network percolated — film conducts" : "below percolation — add density", w * 0.13, h * 0.9 + 18);
        }
      },

      textile: {
        title: "E-textile fiber — fabric that senses",
        desc: "Conductive CNT yarns woven into cloth change resistance as they stretch. Flex the fabric and read the signal — a wearable strain sensor.",
        facts: [
          "Conductive, washable yarns survive textile processing.",
          "Resistance tracks strain — motion, breathing, and pressure sensing."
        ],
        link: "/shop.html#hexweave",
        label: "HexWeave fibers",
        draw: function () {
          var w = surface.box.w;
          var h = surface.box.h;
          var flex = state.pointer.on ? (state.pointer.y - 0.45) * 60 : Math.sin(state.clock * 0.0012) * 8;
          var cnt = state.withCNT;

          function warpY(x, row) {
            var fall = Math.exp(-Math.pow((x - state.pointer.x * w) / (w * 0.22), 2));
            return h * (0.16 + row * 0.085) + flex * fall;
          }

          // Weave: horizontal yarns (every third is a CNT yarn when enabled).
          for (var row = 0; row < 7; row += 1) {
            var isCnt = cnt && row % 3 === 1;
            ctx.strokeStyle = isCnt ? rgba(THEME.accent, 0.95) : rgba(THEME.muted, 0.55);
            ctx.lineWidth = isCnt ? 3 : 2.2;
            ctx.beginPath();
            for (var x = w * 0.06; x <= w * 0.94; x += 7) {
              var y = warpY(x, row) + Math.sin(x / 16 + row) * 1.6;
              if (x === w * 0.06) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          // Vertical yarns.
          ctx.strokeStyle = rgba(THEME.muted, 0.35);
          ctx.lineWidth = 2;
          for (var col = 0; col < 14; col += 1) {
            var vx = w * (0.08 + col * 0.062);
            ctx.beginPath();
            ctx.moveTo(vx, warpY(vx, 0) - 6);
            ctx.lineTo(vx, warpY(vx, 6) + 6);
            ctx.stroke();
          }

          // Live resistance trace.
          var baseY = h * 0.88;
          ctx.strokeStyle = rgba(THEME.muted, 0.4);
          ctx.beginPath();
          ctx.moveTo(w * 0.06, baseY);
          ctx.lineTo(w * 0.94, baseY);
          ctx.stroke();
          if (cnt) {
            state.trace = state.trace || [];
            state.trace.push(Math.abs(flex));
            if (state.trace.length > 90) state.trace.shift();
            ctx.strokeStyle = rgba(THEME.teal, 0.95);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            state.trace.forEach(function (v, idx) {
              var tx = w * 0.06 + (idx / 89) * w * 0.88;
              var ty = baseY - Math.min(28, v * 0.9);
              if (idx === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
            });
            ctx.stroke();
            ctx.fillStyle = rgba(THEME.muted, 0.85);
            ctx.font = "10px Inter, sans-serif";
            ctx.fillText("ΔR — strain signal", w * 0.06, baseY + 14);
          } else {
            ctx.fillStyle = rgba(THEME.muted, 0.6);
            ctx.font = "10px Inter, sans-serif";
            ctx.fillText("plain fabric — no signal", w * 0.06, baseY + 14);
          }
        }
      },

      sports: {
        title: "Sports gear — stiffness you can feel",
        desc: "A bike frame or racket flexes under every stroke, wasting your effort. CNT-reinforced layups stay stiff at the same weight — and damp the sting.",
        facts: [
          "Already used in bike frames, rackets, hockey sticks, and skis.",
          "Higher stiffness-to-weight plus vibration damping for better feel."
        ],
        link: "/shop.html#hexblend",
        label: "HexBlend masterbatches",
        draw: function () {
          var w = surface.box.w;
          var h = surface.box.h;
          var cnt = state.withCNT;
          var pedal = Math.sin(state.clock * 0.004);
          var flex = pedal * (cnt ? 3 : 14);

          ctx.font = "600 11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = rgba(THEME.ink, 0.9);
          ctx.fillText(cnt ? "STIFF FRAME — POWER TO THE ROAD" : "FLEXING FRAME — WASTED WATTS", w * 0.06, h * 0.1);

          // Simplified bike frame (two triangles) that flexes at the bottom bracket.
          var bbx = w * 0.5 + flex;
          var bby = h * 0.66;
          var rearX = w * 0.24;
          var frontX = w * 0.74 + flex * 0.4;
          var seatX = w * 0.42 + flex * 0.7;
          var headX = w * 0.66 + flex * 0.5;

          ctx.strokeStyle = cnt ? rgba(THEME.accent, 0.95) : rgba(THEME.muted, 0.8);
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(rearX, bby); ctx.lineTo(bbx, bby);
          ctx.lineTo(seatX, h * 0.3); ctx.lineTo(rearX, bby);
          ctx.moveTo(seatX, h * 0.3); ctx.lineTo(headX, h * 0.32);
          ctx.lineTo(frontX, bby); ctx.lineTo(bbx, bby);
          ctx.stroke();
          // Wheels.
          ctx.lineWidth = 2.4;
          ctx.strokeStyle = rgba(THEME.muted, 0.6);
          [rearX, frontX].forEach(function (wx) {
            ctx.beginPath();
            ctx.arc(wx, bby, h * 0.16, 0, Math.PI * 2);
            ctx.stroke();
          });
          // Pedal force arrow.
          ctx.fillStyle = rgba(THEME.teal, 0.6 + Math.abs(pedal) * 0.4);
          ctx.beginPath();
          ctx.moveTo(bbx - 7, bby + 14);
          ctx.lineTo(bbx + 7, bby + 14);
          ctx.lineTo(bbx, bby + 26);
          ctx.closePath();
          ctx.fill();
        }
      },

      water: {
        title: "Water filtration — fast, selective membranes",
        desc: "Water slips through the smooth bore of a nanotube almost without friction, while larger contaminants and ions are turned away at the entrance.",
        facts: [
          "Frictionless flow: orders of magnitude faster than predicted for pores this small.",
          "A route to low-pressure desalination and precision filtration."
        ],
        link: "/shop.html#hextubes-s",
        label: "HexTubes SW",
        draw: function () {
          ensureSeeds();
          var w = surface.box.w;
          var h = surface.box.h;
          var cnt = state.withCNT;
          var mx = w * 0.5;

          ctx.font = "600 11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = rgba(THEME.ink, 0.9);
          ctx.fillText(cnt ? "CNT MEMBRANE — CLEAN WATER THROUGH" : "NO MEMBRANE — EVERYTHING PASSES", w * 0.06, h * 0.1);

          // Membrane wall with aligned tube channels.
          if (cnt) {
            ctx.fillStyle = rgba(THEME.muted, 0.3);
            ctx.fillRect(mx - 12, h * 0.16, 24, h * 0.66);
            ctx.strokeStyle = rgba(THEME.accent, 0.9);
            ctx.lineWidth = 2;
            for (var c = 0; c < 6; c += 1) {
              var cy = h * (0.22 + c * 0.11);
              ctx.beginPath();
              ctx.moveTo(mx - 12, cy); ctx.lineTo(mx + 12, cy);
              ctx.stroke();
            }
          }

          // Particles: small water dots pass; big contaminants bounce (with CNT).
          var t = state.clock * 0.001;
          for (var i = 0; i < 26; i += 1) {
            var lane = h * (0.2 + (i % 6) * 0.105);
            var speed = 0.08 + (i % 5) * 0.012;
            var phase = ((t * speed * 60 + i * 0.17) % 1.2);
            var px = w * 0.07 + phase * w * 0.86;
            var big = i % 4 === 0;
            if (cnt && big && px > mx - 22) px = mx - 22 + Math.sin(t * 4 + i) * 3;
            if (!cnt || !big || px <= mx - 18) {
              ctx.fillStyle = big ? rgba(THEME.hot, 0.75) : rgba(THEME.teal, 0.85);
              ctx.beginPath();
              ctx.arc(px, lane + Math.sin(t * 3 + i) * 2.5, big ? 5 : 2.4, 0, Math.PI * 2);
              ctx.fill();
            } else if (big) {
              ctx.fillStyle = rgba(THEME.hot, 0.75);
              ctx.beginPath();
              ctx.arc(px, lane, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.fillStyle = rgba(THEME.muted, 0.85);
          ctx.font = "10px Inter, sans-serif";
          ctx.fillText("feed →", w * 0.07, h * 0.92);
          if (cnt) ctx.fillText("permeate (clean) →", mx + 24, h * 0.92);
        }
      },

      lightning: {
        title: "Aerospace — lightning-strike protection",
        desc: "Composite aircraft skins are insulating, so a strike burns a hole. A featherweight CNT veil spreads the current across the whole surface.",
        facts: [
          "Replaces heavy copper mesh in composite skins at a fraction of the weight.",
          "The conductive veil spreads strike current before it can concentrate."
        ],
        link: "/shop.html#hexweave",
        label: "HexWeave & HexLayers",
        draw: function () {
          var w = surface.box.w;
          var h = surface.box.h;
          var cnt = state.withCNT;
          var cycle = (state.clock % 2200) / 2200;
          var strike = cycle < 0.18;

          ctx.font = "600 11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = rgba(THEME.ink, 0.9);
          ctx.fillText(cnt ? "CNT VEIL — CURRENT SPREADS, SKIN SURVIVES" : "BARE COMPOSITE — STRIKE BURNS IN", w * 0.06, h * 0.1);

          // Wing cross-section.
          ctx.strokeStyle = rgba(THEME.muted, 0.75);
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(w * 0.08, h * 0.62);
          ctx.quadraticCurveTo(w * 0.34, h * 0.34, w * 0.92, h * 0.56);
          ctx.quadraticCurveTo(w * 0.5, h * 0.7, w * 0.08, h * 0.62);
          ctx.stroke();

          var hitX = w * 0.42;
          var hitY = h * 0.43;

          // Lightning bolt.
          if (strike) {
            ctx.strokeStyle = rgba(THEME.teal, 0.95);
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(hitX + 26, h * 0.06);
            ctx.lineTo(hitX + 8, h * 0.2);
            ctx.lineTo(hitX + 18, h * 0.24);
            ctx.lineTo(hitX, hitY);
            ctx.stroke();
          }

          if (cnt) {
            // Veil: current spreads outward along the skin after each strike.
            var spread = Math.min(1, cycle * 2.2);
            ctx.strokeStyle = rgba(THEME.accent, 0.85 * (1 - spread * 0.6));
            ctx.lineWidth = 2;
            for (var s = 1; s <= 4; s += 1) {
              var reach = spread * w * 0.11 * s;
              ctx.beginPath();
              ctx.moveTo(hitX - reach, hitY + reach * 0.32);
              ctx.quadraticCurveTo(hitX, hitY - 6 + s * 2, hitX + reach, hitY + reach * 0.2);
              ctx.stroke();
            }
          } else {
            // Concentrated damage flash + char mark.
            if (strike) {
              ctx.fillStyle = rgba(THEME.hot, 0.85);
              ctx.beginPath();
              ctx.arc(hitX, hitY, 9 + Math.random() * 4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = rgba(THEME.hot, 0.5);
            ctx.beginPath();
            ctx.arc(hitX, hitY, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },

      polymer: {
        title: "Polymer composite — reinforcement at 1–3 wt%",
        desc: "Under shear, neat polymer chains slide and stay deformed. A CNT network pins the chains, so the part stays stiff and sheds static.",
        facts: [
          "Stiffness, creep, and wear improve at just 1–3 wt% loading.",
          "The percolated network adds static dissipation for ESD-safe parts."
        ],
        link: "/shop.html#hexrubber",
        label: "HexRubber & HexBlend",
        draw: function () {
          var w = surface.box.w;
          var h = surface.box.h;
          var cnt = state.withCNT;
          var shear = Math.sin(state.clock * 0.0018) * (cnt ? 8 : 26);

          ctx.font = "600 11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = rgba(THEME.ink, 0.9);
          ctx.fillText(cnt ? "NETWORK PINNED — LOW CREEP" : "CHAINS SLIDING — PERMANENT SET", w * 0.06, h * 0.1);

          // Polymer chains shearing.
          for (var c = 0; c < 8; c += 1) {
            var cy = h * (0.2 + c * 0.085);
            var offset = shear * (c / 8);
            ctx.strokeStyle = rgba(THEME.muted, 0.6);
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (var x = w * 0.06; x <= w * 0.94; x += 6) {
              var y = cy + Math.sin(x / 18 + c * 2 + state.clock * 0.001) * 4;
              var sx = x + offset;
              if (x === w * 0.06) ctx.moveTo(sx, y); else ctx.lineTo(sx, y);
            }
            ctx.stroke();
          }

          if (cnt) {
            // Pinning rods across chains.
            ctx.strokeStyle = rgba(THEME.accent, 0.9);
            ctx.lineWidth = 2.4;
            for (var r = 0; r < 6; r += 1) {
              var rx = w * (0.14 + r * 0.14);
              ctx.beginPath();
              ctx.moveTo(rx, h * 0.18);
              ctx.lineTo(rx + 14, h * 0.84);
              ctx.stroke();
            }
          }

          // Shear arrows.
          ctx.fillStyle = rgba(THEME.teal, 0.8);
          ctx.font = "12px Inter, sans-serif";
          ctx.fillText("⟵ shear ⟶", w * 0.42, h * 0.95);
        }
      }
    };

    function applyMeta() {
      var p = PERSPECTIVES[state.key];
      if (titleNode) titleNode.textContent = p.title;
      if (descNode) descNode.textContent = p.desc;
      if (factsNode) {
        factsNode.innerHTML = "";
        p.facts.forEach(function (fact) {
          var li = document.createElement("li");
          li.textContent = fact;
          factsNode.appendChild(li);
        });
      }
      if (linkNode) {
        linkNode.href = p.link;
        linkNode.textContent = "Open " + p.label + " →";
      }
      if (sliderWrap) sliderWrap.hidden = !p.slider;
    }

    function draw() {
      var w = surface.box.w;
      var h = surface.box.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      PERSPECTIVES[state.key].draw();
      if (state.fade > 0.01) {
        ctx.fillStyle = THEME.dark ? "rgba(12,21,32," + state.fade + ")" : "rgba(255,255,255," + state.fade + ")";
        ctx.fillRect(0, 0, w, h);
      }
    }

    makeLoop(mount, function (ts) {
      state.clock = ts;
      if (state.fade > 0) state.fade = Math.max(0, state.fade - 0.07);
      draw();
    });

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var key = chip.getAttribute("data-persp");
        if (!PERSPECTIVES[key] || key === state.key) return;
        state.key = key;
        state.fade = 1;
        state.trace = [];
        chips.forEach(function (other) {
          other.classList.toggle("is-active", other === chip);
          other.setAttribute("aria-pressed", other === chip ? "true" : "false");
        });
        applyMeta();
        markInteract("perspectives", key);
        if (typeof window.hexTrack === "function") {
          window.hexTrack("hc_property_perspective_view", { perspective: key });
        }
      });
    });

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.withCNT = btn.getAttribute("data-cnt-toggle") === "with";
        toggles.forEach(function (other) {
          var on = other === btn;
          other.classList.toggle("is-active", on);
          other.setAttribute("aria-pressed", on ? "true" : "false");
        });
        markInteract("perspectives", "toggle");
      });
    });

    if (slider) {
      slider.addEventListener("input", function () {
        state.density = Number(slider.value) / 100;
        // Moving the density slider implies CNTs are in — switch the toggle
        // so the slider always has a visible effect.
        if (!state.withCNT) {
          state.withCNT = true;
          toggles.forEach(function (other) {
            var on = other.getAttribute("data-cnt-toggle") === "with";
            other.classList.toggle("is-active", on);
            other.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
        markInteract("perspectives", "density");
      });
    }

    mount.addEventListener("pointermove", function (event) {
      var rect = mount.getBoundingClientRect();
      state.pointer.x = (event.clientX - rect.left) / rect.width;
      state.pointer.y = (event.clientY - rect.top) / rect.height;
      state.pointer.on = true;
    }, { passive: true });
    mount.addEventListener("pointerleave", function () {
      state.pointer.on = false;
    }, { passive: true });

    themeListeners.push(draw);
    applyMeta();
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
    initPerspectivesDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
