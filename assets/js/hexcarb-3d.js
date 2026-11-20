/* HexCarb 3D — real-time WebGL2 material scenes (no dependencies).

   Usage:  <div class="hc-3d" data-hc-3d="nanotube"></div>

   Material models (atom by atom):
     nanotube    single-walled tube
     mwcnt       multi-walled tube (three nested walls)
     graphene    one rippling sheet
     layers      stacked sheets

   Application models (each shows how the material is actually used):
     dispersion  many very long, wavy nanotubes drifting in a liquid
     fibre       nanotubes aligned and twisted into a yarn
     tim         an aligned nanotube forest between two plates; heat pulses
                 travel along the tube axes from the hot plate to the cold one
     shield      a nanotube network coating on a surface; incoming waves die
                 out inside the coating
     hybrid      nanotubes bridging across a graphene sheet

   Property models (one behaviour of a single tube each):
     stretch     pulled along its axis and released
     current     charge carriers streaming down the bore
     heat        a heat front running along the wall
     bend        flexed hard and springing back

   Backdrop:
     dunes       a drifting field of particles (drawn as points)

   Hero film:
     journey     one tube -> dispersed -> yarn -> film -> thermal forest ->
                 composite -> battery slurry -> transistor -> one tube,
                 looping; captions via [data-hc-film-caption]

   Options (data attributes):
     data-hc-3d-view="hero"         wide cinematic framing, tube runs off-frame
     data-hc-3d-surface="graphite"  scene sits on a graphite panel (fixed dark)

   Everything is monochrome: material and depth fade come from the page theme,
   so a scene inverts with light / dark mode.

   One WebGL context is shared by every small scene on a page (rendered
   off-screen, then copied into each scene's 2D canvas). A hero scene gets a
   direct context of its own. Scenes only animate while on screen. */
(function () {
  "use strict";

  var S3 = Math.sqrt(3);
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAVE_DATA = !!(navigator.connection && navigator.connection.saveData);
  var STATIC = REDUCED || SAVE_DATA;

  /* ---------- matrices (column-major) ---------- */

  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    var o = new Float32Array(16);
    o[0] = f / aspect;
    o[5] = f;
    o[10] = (far + near) / (near - far);
    o[11] = -1;
    o[14] = (2 * far * near) / (near - far);
    return o;
  }

  function translation(x, y, z) {
    var o = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    o[12] = x; o[13] = y; o[14] = z;
    return o;
  }

  function rotX(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  function rotY(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  function rotZ(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /* Deterministic random numbers so a model looks the same on every visit. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- meshes ---------- */

  function icosphere(level) {
    var t = (1 + Math.sqrt(5)) / 2;
    var v = [
      -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
      0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
      t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1
    ];
    var f = [
      0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
      1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
      3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
      4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
    ];
    function norm(i) {
      var l = Math.hypot(v[i], v[i + 1], v[i + 2]);
      v[i] /= l; v[i + 1] /= l; v[i + 2] /= l;
    }
    for (var i = 0; i < v.length; i += 3) norm(i);
    for (var n = 0; n < level; n++) {
      var cache = {};
      var nf = [];
      var mid = function (a, b) {
        var key = a < b ? a + "_" + b : b + "_" + a;
        if (cache[key] !== undefined) return cache[key];
        var idx = v.length / 3;
        v.push((v[a * 3] + v[b * 3]) / 2, (v[a * 3 + 1] + v[b * 3 + 1]) / 2, (v[a * 3 + 2] + v[b * 3 + 2]) / 2);
        norm(idx * 3);
        cache[key] = idx;
        return idx;
      };
      for (var k = 0; k < f.length; k += 3) {
        var a = f[k], b = f[k + 1], c = f[k + 2];
        var ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        nf.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
      }
      f = nf;
    }
    return { pos: new Float32Array(v), idx: new Uint16Array(f) };
  }

  /* Open cylinder along +Y from 0 to 1, radius 1. */
  function cylinder(seg) {
    var v = [], f = [];
    for (var i = 0; i < seg; i++) {
      var a = (i / seg) * Math.PI * 2;
      v.push(Math.cos(a), 0, Math.sin(a), Math.cos(a), 1, Math.sin(a));
    }
    for (var j = 0; j < seg; j++) {
      var p = j * 2, q = ((j + 1) % seg) * 2;
      f.push(p, q, p + 1, q, q + 1, p + 1);
    }
    return { pos: new Float32Array(v), idx: new Uint16Array(f) };
  }

  /* Unit cube centred on the origin, flat-shaded: position + normal per vertex. */
  function cube() {
    var faces = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
    ];
    var v = [], f = [];
    faces.forEach(function (n, i) {
      var u = [n[1], n[2], n[0]], w = [n[2], n[0], n[1]];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) {
        v.push(
          (n[0] + u[0] * c[0] + w[0] * c[1]) / 2,
          (n[1] + u[1] * c[0] + w[1] * c[1]) / 2,
          (n[2] + u[2] * c[0] + w[2] * c[1]) / 2,
          n[0], n[1], n[2]
        );
      });
      f.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    return { data: new Float32Array(v), idx: new Uint16Array(f) };
  }

  /* ---------- lattice and strand builders ---------- */

  var ATOM_R = 0.2, BOND_R = 0.085;

  /* Honeycomb sheet (bond length 1). nx cells of width sqrt(3) across, ny
     cells of height 3 along. wrap=true joins the long edges to roll a tube. */
  function honeycomb(nx, ny, wrap) {
    var atoms = [], bonds = [];
    function id(i, j, k) { return (j * nx + i) * 4 + k; }
    for (var j = 0; j < ny; j++) {
      for (var i = 0; i < nx; i++) {
        var x = i * S3, y = j * 3;
        atoms.push([x, y], [x + S3 / 2, y + 0.5], [x + S3 / 2, y + 1.5], [x, y + 2]);
        bonds.push([id(i, j, 0), id(i, j, 1)], [id(i, j, 1), id(i, j, 2)], [id(i, j, 2), id(i, j, 3)]);
        if (j + 1 < ny) bonds.push([id(i, j, 3), id(i, j + 1, 0)]);
        var ni = i + 1;
        if (ni === nx) {
          if (!wrap) continue;
          ni = 0;
        }
        bonds.push([id(i, j, 1), id(ni, j, 0)], [id(i, j, 2), id(ni, j, 3)]);
      }
    }
    return { atoms: atoms, bonds: bonds, width: nx * S3, length: ny * 3 - 1 };
  }

  /* A model under construction: spheres, sticks and flat plates. */
  function Builder() {
    this.a = [];   // x, y, z, radius  (negative radius marks a wave particle)
    this.b = [];   // ax, ay, az, bx, by, bz, radius
    this.plates = [];
  }

  Builder.prototype.lattice = function (atoms3, bonds) {
    var self = this;
    atoms3.forEach(function (p) { self.a.push(p[0], p[1], p[2], ATOM_R); });
    bonds.forEach(function (k) {
      var p = atoms3[k[0]], q = atoms3[k[1]];
      self.b.push(p[0], p[1], p[2], q[0], q[1], q[2], BOND_R);
    });
  };

  /* A smooth tube through a list of points: sticks with round joints. */
  Builder.prototype.strand = function (pts, r) {
    for (var i = 0; i < pts.length; i++) {
      this.a.push(pts[i][0], pts[i][1], pts[i][2], r);
      if (i) this.b.push(pts[i - 1][0], pts[i - 1][1], pts[i - 1][2], pts[i][0], pts[i][1], pts[i][2], r);
    }
  };

  Builder.prototype.plate = function (cx, cy, cz, sx, sy, sz) {
    this.plates.push({ c: [cx, cy, cz], s: [sx, sy, sz] });
  };

  Builder.prototype.done = function (props) {
    var m = {
      atoms: new Float32Array(this.a),
      bonds: new Float32Array(this.b),
      atomCount: this.a.length / 4,
      bondCount: this.b.length / 7,
      plates: this.plates,
      mode: 0,
      amp: 0,
      pulse: 0,
      spin: "turn",
      speed: 1
    };
    for (var k in props) m[k] = props[k];
    return m;
  };

  /* Zigzag tube (n,0): the sheet's short axis wraps the circumference. */
  function tube(n, cells) {
    var h = honeycomb(n, cells, true);
    var radius = h.width / (Math.PI * 2);
    return {
      atoms: h.atoms.map(function (p) {
        var th = (p[0] / h.width) * Math.PI * 2;
        return [radius * Math.cos(th), p[1] - h.length / 2, radius * Math.sin(th)];
      }),
      bonds: h.bonds,
      radius: radius,
      length: h.length
    };
  }

  /* A long wavy nanotube: a straight run from p along unit direction d, bent
     by two slow sine waves across it. */
  function wavy(rand, p, d, len, steps, wobble) {
    var up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var u = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]];
    var ul = Math.hypot(u[0], u[1], u[2]);
    u = [u[0] / ul, u[1] / ul, u[2] / ul];
    var w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    var f1 = 0.6 + rand() * 0.9, f2 = 0.5 + rand() * 1.1, p1 = rand() * 6.28, p2 = rand() * 6.28;
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, s = (t - 0.5) * len;
      var a = wobble * Math.sin(t * 6.28 * f1 + p1), b = wobble * Math.sin(t * 6.28 * f2 + p2);
      pts.push([
        p[0] + d[0] * s + u[0] * a + w[0] * b,
        p[1] + d[1] * s + u[1] * a + w[1] * b,
        p[2] + d[2] * s + u[2] * a + w[2] * b
      ]);
    }
    return pts;
  }

  /* Tubes lie left to right, tilted slightly toward the viewer. */
  var PROP_VIEW = mul(rotX(0.3), rotZ(-Math.PI / 2));

  var MODELS = {
    nanotube: function (opts) {
      var t = tube(opts.hero ? 14 : 10, opts.hero ? 30 : 6);
      var b = new Builder();
      b.lattice(t.atoms, t.bonds);
      return b.done({
        radius: opts.hero ? t.radius : Math.hypot(t.radius, t.length / 2),
        mode: 2,
        amp: 1.1,
        orient: opts.hero ? mul(rotZ(-0.6), rotX(-0.62)) : mul(rotZ(-0.95), rotX(0.45))
      });
    },

    mwcnt: function () {
      var b = new Builder();
      var walls = [tube(7, 6), tube(12, 5), tube(17, 4)];
      walls.forEach(function (w) { b.lattice(w.atoms, w.bonds); });
      return b.done({
        radius: Math.hypot(walls[2].radius, walls[0].length / 2),
        orient: mul(rotZ(-0.9), rotX(0.5))
      });
    },

    graphene: function () {
      var h = honeycomb(8, 4, false);
      var b = new Builder();
      b.lattice(h.atoms.map(function (p) { return [p[0] - h.width / 2, 0, p[1] - h.length / 2]; }), h.bonds);
      return b.done({
        radius: Math.hypot(h.width, h.length) / 2,
        mode: 1,
        amp: 0.5,
        orient: rotX(0.9),
        spin: "sway"
      });
    },

    layers: function () {
      var b = new Builder();
      for (var l = -1; l <= 1; l++) {
        var h = honeycomb(6, 3, false);
        var shift = l === 0 ? S3 / 2 : 0;
        b.lattice(h.atoms.map(function (p) { return [p[0] - h.width / 2 + shift, l * 2.3, p[1] - h.length / 2]; }), h.bonds);
      }
      return b.done({ radius: 6.6, orient: rotX(0.62) });
    },

    /* Property scenes: the nanotube (upper) beside the everyday material it
       is compared with (lower). Both lie along local y; the comparison object
       sits at positive local x, which the shaders test against uSplit. */
    stretch: function () {
      var t = tube(10, 7), b = new Builder(), GAP = 4.6;
      b.lattice(t.atoms.map(function (a) { return [a[0] - GAP, a[1], a[2]]; }), t.bonds);
      [-1, 1].forEach(function (side) {          // steel bar in two halves so it can part
        var pts = [];
        for (var i = 0; i < 20; i++) pts.push([GAP, side * (0.26 + i * 0.51), 0]);
        b.strand(pts, 1.9);
      });
      return b.done({ radius: 11.2, mode: 5, split: 0, orient: PROP_VIEW, spin: "none" });
    },

    current: function () {
      var t = tube(10, 8), b = new Builder(), rand = rng(3), GAP = 4.6;
      b.lattice(t.atoms.map(function (a) { return [a[0] - GAP, a[1], a[2]]; }), t.bonds);
      for (var i = 0; i < 14; i++) {
        var a = rand() * 6.28, r = rand() * t.radius * 0.5;
        b.a.push(-GAP + r * Math.cos(a), (rand() - 0.5) * t.length, r * Math.sin(a), -0.3);
      }
      for (var ix = -1; ix <= 1; ix++) {         // copper: a regular block of atoms
        for (var iz = -1; iz <= 1; iz++) {
          for (var iy = 0; iy < 17; iy++) b.a.push(GAP + ix * 1.35, (iy - 8) * 1.38, iz * 1.35, 0.46);
        }
      }
      for (var k = 0; k < 12; k++) {
        b.a.push(GAP + (rand() - 0.5) * 2.4, (rand() - 0.5) * t.length, (rand() - 0.5) * 2.4, -0.26);
      }
      return b.done({ radius: 11.6, mode: 7, split: 0, len: t.length, orient: PROP_VIEW, spin: "none" });
    },

    heat: function () {
      var t = tube(10, 8), b = new Builder(), rand = rng(9), GAP = 4.6;
      b.lattice(t.atoms.map(function (a) { return [a[0] - GAP, a[1], a[2]]; }), t.bonds);
      for (var i = 0; i < 5; i++) {              // polymer: a few tangled chains
        var p = [GAP + (rand() - 0.5) * 1.6, 0, (rand() - 0.5) * 1.6];
        b.strand(wavy(rand, p, [0, 1, 0], t.length, 46, 0.55), 0.5);
      }
      return b.done({ radius: 11.6, pulse: 2, split: 0, orient: PROP_VIEW, spin: "none" });
    },

    bend: function () {
      var t = tube(8, 9), b = new Builder(), GAP = 3.6, pts = [];
      b.lattice(t.atoms.map(function (a) { return [a[0] - GAP, a[1], a[2]]; }), t.bonds);
      for (var i = 0; i <= 48; i++) pts.push([GAP, (i / 48 - 0.5) * 25, 0]);
      b.strand(pts, 0.85);                       // steel rod
      return b.done({ radius: 12.4, mode: 6, amp: 0.02, split: 0, orient: PROP_VIEW, spin: "none" });
    },

    /* ---- Use-case models: what the nanotubes do inside each product ---- */

    /* Battery electrode: storage particles wired together by a nanotube web. */
    "use-battery": function () {
      var rand = rng(101), b = new Builder();
      [[0, 0, 0], [2.7, 0.6, 0.4], [-2.5, 0.9, -0.6], [0.6, 2.5, -0.8], [-0.9, -2.5, 0.7], [1.9, -1.9, -1.4], [-1.6, 1.2, 2.2]].forEach(function (c) {
        b.a.push(c[0], c[1], c[2], 1.35);
      });
      for (var i = 0; i < 26; i++) {
        var z = rand() * 2 - 1, th = rand() * 6.28, q = Math.sqrt(1 - z * z);
        b.strand(wavy(rand, [(rand() - 0.5) * 5, (rand() - 0.5) * 5, (rand() - 0.5) * 4], [q * Math.cos(th), z, q * Math.sin(th)], 7 + rand() * 4, 40, 0.8), 0.07);
      }
      return b.done({ radius: 5.0, orient: rotX(0.25), speed: 0.6 });
    },

    /* Concrete: a crack, with nanotubes stitched across its faces. */
    "use-concrete": function () {
      var rand = rng(102), b = new Builder();
      b.plate(-2.75, 0, 0, 4.6, 3.8, 3.8);
      b.plate(2.75, 0, 0, 4.6, 3.8, 3.8);
      for (var i = 0; i < 12; i++) {
        b.strand(wavy(rand, [0, (rand() - 0.5) * 3.2, (rand() - 0.5) * 3.2], [1, 0, 0], 2.2, 14, 0.1), 0.09);
      }
      return b.done({ radius: 5.1, orient: rotX(0.34), spin: "sway" });
    },

    /* Thin film: a sparse connected network on a sheet. */
    "use-film": function () {
      var rand = rng(103), b = new Builder();
      b.plate(0, -0.2, 0, 9.4, 0.16, 6.2);
      for (var i = 0; i < 30; i++) {
        var th = rand() * 6.28;
        var pts = wavy(rand, [(rand() - 0.5) * 8, 0.02, (rand() - 0.5) * 5], [Math.cos(th), 0, Math.sin(th)], 3 + rand() * 4, 26, 0.22).filter(function (q) {
          return Math.abs(q[0]) < 4.5 && Math.abs(q[2]) < 2.9;
        }).map(function (q) { return [q[0], 0.02 + Math.abs(q[1]) * 0.2, q[2]]; });
        if (pts.length > 3) b.strand(pts, 0.07);
      }
      return b.done({ radius: 4.8, orient: rotX(0.6), spin: "sway" });
    },

    /* E-textile: nanotube yarns woven over and under. */
    "use-textile": function () {
      var b = new Builder(), n = 6, pitch = 1.25, half = (n - 1) * pitch / 2 + 1.1;
      for (var i = 0; i < n; i++) {
        var o = (i - (n - 1) / 2) * pitch, warp = [], weft = [];
        for (var k = 0; k <= 60; k++) {
          var t = (k / 60 - 0.5) * 2 * half;
          var wave = 0.3 * Math.cos((t / pitch) * Math.PI + (n % 2 ? 0 : Math.PI / 2) + i * Math.PI);
          warp.push([o, wave, t]);
          weft.push([t, -wave, o]);
        }
        b.strand(warp, 0.3);
        b.strand(weft, 0.3);
      }
      return b.done({ radius: 4.7, orient: rotX(0.75), spin: "sway" });
    },

    /* Polymer composite: thick polymer chains pinned by fine straight tubes. */
    "use-composite": function () {
      var rand = rng(105), b = new Builder(), i, z, th, q;
      for (i = 0; i < 6; i++) {
        z = rand() * 2 - 1; th = rand() * 6.28; q = Math.sqrt(1 - z * z);
        b.strand(wavy(rand, [(rand() - 0.5) * 3, (rand() - 0.5) * 3, (rand() - 0.5) * 3], [q * Math.cos(th), z, q * Math.sin(th)], 8.5, 60, 1.2), 0.42);
      }
      for (i = 0; i < 12; i++) {
        z = rand() * 2 - 1; th = rand() * 6.28; q = Math.sqrt(1 - z * z);
        b.strand(wavy(rand, [(rand() - 0.5) * 4, (rand() - 0.5) * 4, (rand() - 0.5) * 4], [q * Math.cos(th), z, q * Math.sin(th)], 9, 20, 0.08), 0.08);
      }
      return b.done({ radius: 4.7, orient: rotX(0.25), speed: 0.6 });
    },

    /* Sports gear: a racket frame. */
    "use-sport": function () {
      var b = new Builder(), rx = 2.5, ry = 3.1, cy = 1.9, k, x, y, lim, ring = [];
      for (k = 0; k <= 64; k++) {
        var a = (k / 64) * Math.PI * 2;
        ring.push([rx * Math.cos(a), cy + ry * Math.sin(a), 0]);
      }
      b.strand(ring, 0.2);
      for (x = -2; x <= 2.01; x += 0.5) {
        lim = ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)));
        b.strand([[x, cy - lim, 0], [x, cy + lim, 0]], 0.035);
      }
      for (y = -2.5; y <= 2.51; y += 0.5) {
        lim = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)));
        b.strand([[-lim, cy + y, 0], [lim, cy + y, 0]], 0.035);
      }
      b.strand([[-1.05, cy - ry + 0.3, 0], [-0.2, -2.3, 0]], 0.16);
      b.strand([[1.05, cy - ry + 0.3, 0], [0.2, -2.3, 0]], 0.16);
      var grip = [];
      for (k = 0; k <= 10; k++) grip.push([0, -2.2 - k * 0.4, 0]);
      b.strand(grip, 0.32);
      return b.done({ radius: 5.5, orient: mul(rotZ(-0.45), rotX(0.15)), offsetY: 0.12, speed: 0.8 });
    },

    /* Water filtration: water passes down the bores, larger particles do not. */
    "use-water": function () {
      var rand = rng(107), b = new Builder(), t = tube(6, 2), pitch = 4.1, i, j;
      for (i = -1; i <= 1; i++) {
        for (j = -1; j <= 1; j++) {
          b.lattice(t.atoms.map(function (a) { return [a[0] + i * pitch, a[1], a[2] + j * pitch]; }), t.bonds);
          for (var k = 0; k < 2; k++) b.a.push(i * pitch + (rand() - 0.5) * 0.9, (rand() - 0.5) * 13, j * pitch + (rand() - 0.5) * 0.9, -0.3);
        }
      }
      [[-2.05, 3.6, -2.05], [2.05, 3.7, 2.05], [2.05, 3.5, -2.05], [-2.05, 3.8, 2.05]].forEach(function (c) {
        b.a.push(c[0], c[1], c[2], 1.15);
      });
      return b.done({ radius: 6.9, mode: 7, len: 13, orient: rotX(0.36), speed: 0.5 });
    },

    /* Lightning protection: a conductive veil spreads the strike across the skin. */
    "use-lightning": function () {
      var b = new Builder(), x, z, k;
      b.plate(0, -1.5, 0, 9.4, 0.5, 6.4);
      for (x = -4; x <= 4.01; x += 1) b.strand([[x, -1.2, -3], [x, -1.2, 3]], 0.06);
      for (z = -3; z <= 3.01; z += 1) b.strand([[-4.5, -1.2, z], [4.5, -1.2, z]], 0.06);
      var bolt = [[1.6, 5.6, 0.3], [0.5, 4.2, -0.2], [1.3, 3.2, 0.2], [-0.1, 1.7, -0.3], [0.8, 0.8, 0.1], [0, -1.15, 0]], pts = [];
      for (k = 0; k < bolt.length; k++) pts.push(bolt[k]);
      b.strand(pts, 0.15);
      return b.done({ radius: 5.5, orient: rotX(0.42), offsetY: -0.12, spin: "sway" });
    },

    /* Hero film. One world, one camera, the same material in every form:
         one tube -> a rope of seven -> ropes dispersed -> fibre -> film ->
         thermal forest (close, then the whole pad) -> composite panel
         (absorbing a signal, then holding a crack) -> battery electrode ->
         one tube as a transistor -> back to one tube.

       Real sizes this follows (far stages use 1 unit = 0.2 micrometre):
         tube      1.5 nm across, about 100 micrometres long
         fibre     about 25-30 micrometres across: a rope of ropes
         film      5-30 micrometres thick, so tubes lie flat in it
         forest    100 micrometres tall, in a pad centimetres wide
         electrode particles about 10 micrometres; one tube spans about ten

       Tubes never travel alone: every line belongs to a rope of 3-7 that run
       together with a slow twist. Each strand carries six positions and
       glides between them. Line thickness is exaggerated; counts stand in
       for far larger real numbers. */
    journey: function () {
      var small = window.innerWidth < 760;
      var TARGET = small ? 190 : 640, S = small ? 14 : 20, R = 2.6;
      var rand = rng(2026), tubeModel = MODELS.nanotube({ hero: true });
      var bonds = [], i, j, n;
      var BUNDLE = 70, FW = 1000, FH = 760, TUBE = 500;
      var MW = 720, MH = 540;   // the film: a smaller sheet, so the same ropes pack it densely

      function unit() {
        var z = rand() * 2 - 1, th = rand() * 6.28, q = Math.sqrt(1 - z * z);
        return [q * Math.cos(th), z, q * Math.sin(th)];
      }
      function clampTo(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

      /* one rope's centre line in each of the six forms, as S+1 points */
      function paths(first) {
        var out = [], k, u;
        /* 0 dispersed */
        out.push(first
          ? wavy(rand, [0, 0, 0], [0, 1, 0], 1900, S, 0)
          : wavy(rand, [(rand() - 0.5) * 1300, (rand() - 0.5) * 1300, (rand() - 0.5) * 900], unit(), 1300 + rand() * 600, S, 130));
        /* 1 fibre: a place in the round bundle, twisted along the axis */
        var rr = first ? 0 : BUNDLE * Math.sqrt(rand()), ph = rand() * 6.28, a1 = [];
        for (k = 0; k <= S; k++) {
          u = k / S;
          var y = (u - 0.5) * 1900, tw = ph + y * 0.0055;
          a1.push([rr * Math.cos(tw), y, rr * Math.sin(tw)]);
        }
        out.push(a1);
        /* 2 film: long, curved, lying flat */
        var fa = rand() * 3.1416, cx = (rand() - 0.5) * MW, cy = (rand() - 0.5) * MH, len = TUBE * (0.8 + rand() * 0.5);
        var b1 = (rand() - 0.5) * 150, b2 = (rand() - 0.5) * 70, p2 = rand() * 6.28, lz = 6 + rand() * 46, a2 = [];
        for (k = 0; k <= S; k++) {
          u = k / S;
          var sl = (u - 0.5) * len, bow = b1 * Math.sin(u * 3.1416) + b2 * Math.sin(u * 9.42 + p2);
          a2.push([clampTo(cx + Math.cos(fa) * sl - Math.sin(fa) * bow, -MW / 2, MW / 2),
                   clampTo(cy + Math.sin(fa) * sl + Math.cos(fa) * bow, -MH / 2, MH / 2), lz]);
        }
        out.push(a2);
        /* 3 forest: upright, slightly wavy, as tall as a tube is long */
        var gx = (rand() - 0.5) * (FW - 40), gy = (rand() - 0.5) * (FH - 40), gp = rand() * 6.28, wob = 4 + rand() * 7, a3 = [];
        for (k = 0; k <= S; k++) {
          u = k / S;
          a3.push([gx + wob * Math.sin(u * 5 + gp), gy + wob * Math.cos(u * 4 + gp), u * TUBE]);
        }
        out.push(a3);
        /* 4 composite: every direction through a panel */
        var cd = unit(), cc = [(rand() - 0.5) * 800, (rand() - 0.5) * 580, 20 + rand() * 110], cl = TUBE * (0.7 + rand() * 0.5), a4 = [];
        for (k = 0; k <= S; k++) {
          var cs = (k / S - 0.5) * cl;
          a4.push([clampTo(cc[0] + cd[0] * cs, -445, 445), clampTo(cc[1] + cd[1] * cs, -320, 320), clampTo(cc[2] + cd[2] * cs * 0.4, 10, 140)]);
        }
        out.push(a4);
        /* 5 electrode: one tube length winding through the coated layer */
        var ed = unit();
        ed[2] *= 0.5;
        out.push(wavy(rand, [(rand() - 0.5) * 860, (rand() - 0.5) * 640, 60 + rand() * 250], ed, TUBE * (0.9 + rand() * 0.3), S, 45).map(function (q) {
          return [clampTo(q[0], -490, 490), clampTo(q[1], -370, 370), clampTo(q[2], 10, 360)];
        }));
        return out;
      }

      /* offset a centre line sideways: member m of a rope, twisting slowly */
      function member(line, rho, phase) {
        var out = [], k;
        for (k = 0; k <= S; k++) {
          var a = line[Math.max(0, k - 1)], b = line[Math.min(S, k + 1)];
          var t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(t[0], t[1], t[2]) || 1;
          t = [t[0] / tl, t[1] / tl, t[2] / tl];
          var up = Math.abs(t[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
          var e1 = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]];
          var l1 = Math.hypot(e1[0], e1[1], e1[2]) || 1;
          e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
          var e2 = [t[1] * e1[2] - t[2] * e1[1], t[2] * e1[0] - t[0] * e1[2], t[0] * e1[1] - t[1] * e1[0]];
          var ang = phase + k * 0.42, c = Math.cos(ang) * rho, d = Math.sin(ang) * rho;
          out.push([line[k][0] + e1[0] * c + e2[0] * d, line[k][1] + e1[1] * c + e2[1] * d, line[k][2] + e1[2] * c + e2[2] * d]);
        }
        return out;
      }

      var strands = 0, rope = 0;
      while (strands < TARGET) {
        var first = rope === 0, lines = paths(first), seed = first ? 0 : rand();
        /* rope 0 is the seven-tube rope the film opens on */
        var size = first ? 7 : [3, 4, 5, 7][Math.floor(rand() * 4)];
        for (j = 0; j < size; j++) {
          var centre = size === 7 && j === 0;
          var rho = centre ? 0 : size === 7 ? R * 2.1 : R / Math.sin(Math.PI / size) * 1.05;
          var phase = (size === 7 ? (j - 1) / 6 : j / size) * 6.2832;
          /* in the film the ropes loosen and their tubes fan out across the sheet */
          var form = lines.map(function (line, f) {
            if (f === 2) return member(line, (rho || R * 2.1) * 3.4 + (centre ? 6 : 0), phase + (centre ? 1 : 0));
            return centre ? line : member(line, rho, phase);
          });
          for (i = 1; i <= S; i++) {
            for (n = 0; n < 6; n++) bonds.push(form[n][i - 1][0], form[n][i - 1][1], form[n][i - 1][2]);
            for (n = 0; n < 6; n++) bonds.push(form[n][i][0], form[n][i][1], form[n][i][2]);
            bonds.push(R, seed);
          }
          strands++;
        }
        rope++;
      }

      /* fixed things use the same six-slot layout with one position repeated */
      function fixed(list, x, y, z, r) {
        for (var q = 0; q < 6; q++) list.push(x, y, z);
        list.push(r);
      }
      /* storage particles about 10 micrometres across, packed on the foil,
         with one corner cut away in steps so the tube network shows */
      var grains = [], PIT = 54, gx2, gy2, gz2;
      for (gz2 = 0; gz2 < (small ? 4 : 6); gz2++) {
        for (gx2 = -9; gx2 <= 9; gx2++) {
          for (gy2 = -7; gy2 <= 7; gy2++) {
            var px = gx2 * PIT + (gz2 % 2 ? PIT / 2 : 0), py = gy2 * PIT + (gz2 % 2 ? PIT / 2 : 0);
            if (Math.abs(px) > 500 || Math.abs(py) > 380) continue;
            if (small && (gx2 + gy2) % 2) continue;
            /* the cut: nearer the viewing corner, fewer layers remain */
            var cut = (px + 500) / 1000 * 0.6 + (py + 380) / 760 * 0.4;
            if (gz2 > 5.6 * cut - 0.6) continue;
            fixed(grains, px + (rand() - 0.5) * 9, py + (rand() - 0.5) * 9, 30 + gz2 * 47, 24 + rand() * 3);
          }
        }
      }
      /* incoming waves for the shielding panel: beads on lines above it */
      var waves = [];
      [[-250, -120], [0, 90], [260, -40]].forEach(function (wv) {
        for (i = 0; i < 80; i++) fixed(waves, wv[0], wv[1], 6 + i * 11, 8);
      });
      /* charge carriers for the transistor: beads inside the tube's bore */
      var carriers = new Builder();
      for (i = 0; i < 9; i++) carriers.a.push((rand() - 0.5) * 2.4, (rand() - 0.5) * 58, (rand() - 0.5) * 2.4, -1.5);

      return {
        journey: true,
        tube: tubeModel,
        carriers: carriers.done({}),
        mBonds: new Float32Array(bonds),
        mBondCount: bonds.length / 38,
        mGrains: new Float32Array(grains),
        mGrainCount: grains.length / 19,
        mWaves: new Float32Array(waves),
        mWaveCount: waves.length / 19,
        radius: tubeModel.radius,
        orient: tubeModel.orient,
        plates: [], atoms: new Float32Array(0), bonds: new Float32Array(0), atomCount: 0, bondCount: 0,
        mode: 0, amp: 0, pulse: 0, spin: "none", speed: 1
      };
    },

    /* Backdrop: a jittered grid of points; the shader lifts it into dunes. */
    dunes: function () {
      var rand = rng(77), pts = [], nx = 230, nz = 120;
      for (var i = 0; i < nx; i++) {
        for (var j = 0; j < nz; j++) {
          pts.push((i / (nx - 1) - 0.5) * 34 + (rand() - 0.5) * 0.3, (j / (nz - 1) - 0.5) * 22 + (rand() - 0.5) * 0.3, rand());
        }
      }
      var m = new Builder().done({ radius: 5.2, orient: rotX(0.3), spin: "none", offsetY: -0.1 });
      m.points = new Float32Array(pts);
      m.pointCount = pts.length / 3;
      return m;
    },

    /* Dispersion: long tubes at every angle, suspended and slowly drifting. */
    dispersion: function () {
      var rand = rng(11), b = new Builder();
      for (var i = 0; i < 54; i++) {
        var z = rand() * 2 - 1, th = rand() * 6.28, q = Math.sqrt(1 - z * z);
        var d = [q * Math.cos(th), z, q * Math.sin(th)];
        var p = [(rand() - 0.5) * 7, (rand() - 0.5) * 7, (rand() - 0.5) * 7];
        b.strand(wavy(rand, p, d, 13 + rand() * 9, 96, 0.7 + rand() * 0.9), 0.085);
      }
      return b.done({ radius: 7.4, mode: 3, amp: 0.34, orient: rotX(0.25), speed: 0.45 });
    },

    /* Fibre: many aligned tubes twisted together into one yarn. */
    fibre: function () {
      var b = new Builder(), steps = 84, len = 17;
      var rings = [[1, 0], [6, 0.66], [12, 1.3]];
      rings.forEach(function (ring) {
        for (var s = 0; s < ring[0]; s++) {
          var phase = (s / ring[0]) * Math.PI * 2, pts = [];
          for (var i = 0; i <= steps; i++) {
            var y = (i / steps - 0.5) * len, tw = phase + y * 0.36;
            pts.push([ring[1] * Math.cos(tw), y, ring[1] * Math.sin(tw)]);
          }
          b.strand(pts, 0.33);
        }
      });
      return b.done({ radius: 5.6, orient: mul(rotZ(-0.95), rotX(0.4)), speed: 1.4 });
    },

    /* Thermal interface: a vertically aligned forest between a hot surface
       and a heat sink. Heat travels along each tube's axis. */
    tim: function () {
      var rand = rng(5), b = new Builder(), n = 8, gap = 0.92, h = 3.6;
      for (var ix = 0; ix < n; ix++) {
        for (var iz = 0; iz < n; iz++) {
          var x = (ix - (n - 1) / 2) * gap + (rand() - 0.5) * 0.3;
          var z = (iz - (n - 1) / 2) * gap + (rand() - 0.5) * 0.3;
          var ph = rand() * 6.28, wob = 0.07 + rand() * 0.1, pts = [];
          for (var i = 0; i <= 22; i++) {
            var t = i / 22;
            pts.push([x + wob * Math.sin(t * 5 + ph), -h + t * 2 * h, z + wob * Math.cos(t * 4 + ph)]);
          }
          b.strand(pts, 0.135);
        }
      }
      b.plate(0, -h - 0.3, 0, 8.6, 0.6, 8.6);
      b.plate(0, h + 0.3, 0, 8.6, 0.6, 8.6);
      return b.done({ radius: 7.2, pulse: 1, orient: rotX(0.36), speed: 0.55 });
    },

    /* Shielding: a nanotube network coating on a surface. Waves arrive from
       above and lose their amplitude inside the coating. */
    shield: function () {
      var rand = rng(23), b = new Builder(), half = 4.2, top = 0.1, base = -1.5;
      for (var i = 0; i < 90; i++) {
        var th = rand() * 6.28;
        var d = [Math.cos(th), (rand() - 0.5) * 0.16, Math.sin(th)];
        var l = Math.hypot(d[0], d[1], d[2]);
        d = [d[0] / l, d[1] / l, d[2] / l];
        var p = [(rand() - 0.5) * 2 * half, base + 0.15 + rand() * (top - base - 0.3), (rand() - 0.5) * 2 * half];
        var pts = wavy(rand, p, d, 5 + rand() * 5, 34, 0.14).filter(function (q) {
          return Math.abs(q[0]) < half && Math.abs(q[2]) < half && q[1] < top && q[1] > base;
        });
        if (pts.length > 3) b.strand(pts, 0.07);
      }
      b.plate(0, base - 0.3, 0, half * 2 + 0.2, 0.6, half * 2 + 0.2);
      /* Wave trains: beads on vertical lines; the shader swings them sideways. */
      [[-2.4, -1.6], [0.2, 1.4], [2.6, -0.4]].forEach(function (w) {
        for (var k = 0; k < 70; k++) {
          b.a.push(w[0], base + 0.05 + (k / 69) * 8.2, w[1], -0.1);
        }
      });
      return b.done({ radius: 7.2, mode: 4, amp: 0.62, coat: top, orient: rotX(0.3), speed: 0.5, offsetY: -0.28 });
    },

    /* Hybrid: nanotubes lying across a graphene sheet, bridging it. */
    hybrid: function () {
      var rand = rng(41), b = new Builder();
      var h = honeycomb(9, 5, false);
      b.lattice(h.atoms.map(function (p) { return [p[0] - h.width / 2, 0, p[1] - h.length / 2]; }), h.bonds);
      [[-0.9, 0.35], [0.5, -0.5], [1.25, 0.2], [-0.3, 1.1]].forEach(function (s, i) {
        var d = [Math.cos(s[0]), 0, Math.sin(s[0])];
        var pts = wavy(rand, [s[1] * 3, 0.62, (i - 1.5) * 2.6], d, 19, 44, 0.3).map(function (q) {
          return [q[0], 0.62 + Math.abs(q[1] - 0.62) * 0.4, q[2]];
        });
        b.strand(pts, 0.34);
      });
      return b.done({ radius: 10.4, orient: rotX(0.82), spin: "sway" });
    }
  };

  /* ---------- shaders ---------- */

  var COMMON = [
    "uniform mat4 uProj;",
    "uniform mat4 uMV;",
    "uniform float uTime;",
    "uniform float uMode;",
    "uniform float uAmp;",
    "uniform float uPulse;",
    "uniform float uGrow;",
    "uniform float uSplit;",                 // local x beyond this = the comparison object
    "float rs = 1.0;",                       // radius scale set by deform()
    "float grow(vec3 p){ return smoothstep(0.0, 7.0, uGrow + p.y); }",
    "vec3 deform(vec3 p){",
    "  rs = 1.0;",
    "  if(uMode>0.5 && uMode<1.5){",          // rippling sheet
    "    p.y += uAmp*(sin(p.x*0.42+uTime*0.9)*0.9 + sin(p.z*0.36-uTime*0.7)*0.7);",
    "  } else if(uMode>1.5 && uMode<2.5){",   // slow sway along a tube
    "    p.x += uAmp*sin(p.y*0.085+uTime*0.5);",
    "    p.z += uAmp*0.6*cos(p.y*0.07+uTime*0.37);",
    "  } else if(uMode>2.5 && uMode<3.5){",   // drifting in a liquid
    "    p += uAmp*vec3(sin(p.y*0.5+uTime*0.6), sin(p.z*0.45+uTime*0.5+1.7), sin(p.x*0.55+uTime*0.55+3.1));",
    "  } else if(uMode>4.5 && uMode<5.5){",   // same load on both: steel necks and snaps, the tube holds
    "    float ph = fract(uTime/7.0); float load = smoothstep(0.0,0.5,ph); float gone = smoothstep(0.92,1.0,ph);",
    "    if(p.x<uSplit){ p.y *= 1.0+0.05*load*(1.0-gone); }",
    "    else {",
    "      float snap = step(0.5,ph);",
    "      rs = mix(1.0-0.64*load*exp(-p.y*p.y/7.0), 1.0, gone);",
    "      p.y *= 1.0+0.12*load*(1.0-snap);",
    "      p.y += sign(p.y)*1.7*snap*(1.0-gone);",
    "    }",
    "  } else if(uMode>5.5 && uMode<6.5){",   // both bent: the tube springs back, the rod stays kinked
    "    float ph = fract(uTime/7.0); float up = smoothstep(0.0,0.3,ph); float gone = smoothstep(0.92,1.0,ph);",
    "    if(p.x<uSplit){ p.x -= uAmp*up*(1.0-smoothstep(0.36,0.62,ph))*p.y*p.y; }",
    "    else { p.x += 9.0*uAmp*up*(1.0-gone)*abs(p.y); }",
    "  }",
    "  return p;",
    "}",
    /* A heat pulse climbing each tube: 0 between pulses, 1 at the crest. */
    "float pulse(vec3 p){",
    "  if(uPulse<0.5) return 0.0;",
    "  if(uPulse>1.5){",                       // heat front: crosses the tube at once, crawls through the polymer
    "    float ph = fract(uTime/7.0); float gone = 1.0-smoothstep(0.9,1.0,ph);",
    "    float front = p.x<uSplit ? -14.0+90.0*ph : -14.0+8.0*ph;",
    "    return gone*(p.x<uSplit ? 1.0 : 0.7)*(1.0-smoothstep(front-2.5,front+2.5,p.y));",
    "  }",
    "  float ph = floor(p.x*1.09+0.5)*2.3 + floor(p.z*1.09+0.5)*4.1;",
    "  return pow(max(0.0, sin(p.y*0.8 - uTime*2.4 + ph)), 60.0);",
    "}"
  ].join("\n");

  var VS_ATOM = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec4 iAtom;",
    "uniform float uCoat;",
    "uniform float uLen;",
    COMMON,
    "out vec3 vN; out vec3 vP; out float vGlow;",
    "void main(){",
    "  vec3 c = deform(iAtom.xyz);",
    "  float r = abs(iAtom.w);",
    "  float g = pulse(iAtom.xyz);",
    "  if(iAtom.w<0.0 && uMode>6.5){",         // charge carriers: straight through the tube, scattering in copper
    "    if(iAtom.x<uSplit){",
    "      c.y = mod(c.y + uTime*(9.0+3.0*fract(c.z*7.3)) + uLen*0.5, uLen) - uLen*0.5;",
    "    } else {",
    "      c.y = mod(c.y + uTime*1.2 + uLen*0.5, uLen) - uLen*0.5;",
    "      c.x += 0.6*sin(uTime*7.0 + iAtom.y*5.0); c.z += 0.6*cos(uTime*6.1 + iAtom.y*3.0);",
    "    }",
    "    g = 1.0;",
    "  } else if(iAtom.w<0.0){",               // wave bead: swings, then dies in the coating
    "    float env = c.y>uCoat ? 1.0 : exp((c.y-uCoat)*2.6);",
    "    c.x += uAmp*env*sin(c.y*1.9 + uTime*3.4 + c.z);",
    "    r *= 0.45 + 0.55*env;",
    "    g = env;",
    "  }",
    "  r *= (1.0 + 0.3*g*(uPulse>1.5 ? 0.0 : uPulse))*grow(iAtom.xyz)*rs;",
    "  vec4 mv = uMV*vec4(c + aPos*r, 1.0);",
    "  vN = mat3(uMV)*aPos; vP = mv.xyz; vGlow = g;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  var VS_BOND = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec3 iA;",
    "layout(location=2) in vec3 iB;",
    "layout(location=3) in float iR;",
    COMMON,
    "out vec3 vN; out vec3 vP; out float vGlow;",
    "void main(){",
    "  vec3 a = deform(iA); vec3 b = deform(iB);",
    "  vec3 ax = b-a; float len = length(ax); ax /= max(len,1e-5);",
    "  vec3 up = abs(ax.y)<0.95 ? vec3(0.,1.,0.) : vec3(1.,0.,0.);",
    "  vec3 u = normalize(cross(up,ax)); vec3 w = cross(ax,u);",
    "  vec3 n = u*aPos.x + w*aPos.z;",
    "  float g = pulse(mix(iA,iB,aPos.y));",
    "  vec4 mv = uMV*vec4(a + ax*len*aPos.y + n*iR*rs*(1.0+0.3*g*(uPulse>1.5 ? 0.0 : uPulse))*grow(0.5*(iA+iB)), 1.0);",
    "  vN = mat3(uMV)*n; vP = mv.xyz; vGlow = g;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  var VS_BOX = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec3 aNor;",
    "uniform mat4 uProj; uniform mat4 uMV;",
    "uniform vec3 uC; uniform vec3 uS;",
    "out vec3 vN; out vec3 vP; out float vGlow;",
    "void main(){",
    "  vec4 mv = uMV*vec4(uC + aPos*uS, 1.0);",
    "  vN = mat3(uMV)*aNor; vP = mv.xyz; vGlow = 0.0;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  /* Polished metal in a photo studio. The surface mostly mirrors a simple
     environment: a dark floor, a bright ceiling and three softboxes. That is
     what gives chrome its hard black-to-white bands. Depth fades into the
     page colour. Everything is computed in linear light. */
  var FS = [
    "#version 300 es",
    "precision highp float;",
    "in vec3 vN; in vec3 vP; in float vGlow;",
    "uniform vec3 uBase; uniform vec3 uFog;",
    "uniform float uNear; uniform float uFar;",
    "uniform float uMetal; uniform float uEnvLo; uniform float uEnvHi; uniform float uAmb; uniform float uGlow; uniform float uCut; uniform float uSheen; uniform float uFogMax; uniform float uShine; uniform vec3 uSignal;",
    "out vec4 o;",
    "float env(vec3 r){",
    "  float v = mix(uEnvLo, uEnvHi, smoothstep(-0.35,0.75,r.y));",
    "  v += 2.2*smoothstep(0.5,0.86,r.y)*smoothstep(-0.8,-0.2,r.x)*(1.0-smoothstep(0.3,0.8,r.x));",
    "  v += 1.2*smoothstep(0.62,0.93,r.x)*smoothstep(-0.4,0.15,r.y)*(1.0-smoothstep(0.5,0.85,r.y));",
    "  v += 0.7*smoothstep(0.72,0.97,-r.x)*smoothstep(-0.25,0.4,r.y)*(1.0-smoothstep(0.6,0.9,r.y));",
    "  v *= 1.0 - 0.8*smoothstep(-0.02,-0.5,r.y)*(1.0-smoothstep(-0.75,-1.0,r.y)*0.6);",
    "  return v;",
    "}",
    "void main(){",
    "  vec3 n = normalize(vN); vec3 v = normalize(-vP);",
    "  if(dot(n,v)<0.0) n = -n;",
    "  float ndv = max(dot(n,v),0.0);",
    "  vec3 l1 = normalize(vec3(-0.18,0.95,0.26));",
    "  float d1 = max(dot(n,l1),0.0);",
    "  float hemi = 0.5+0.5*n.y;",
    "  vec3 base = pow(uBase, vec3(2.2));",
    "  vec3 diffuse = base*(uAmb*(0.4+0.6*hemi) + 0.9*d1);",
    "  float fres = pow(1.0-ndv,5.0);",
    "  float mirror = env(reflect(-v,n));",
    "  float sharp = pow(max(dot(n,normalize(l1+v)),0.0),120.0);",
    "  vec3 metal = base*mirror*(1.0+0.6*fres) + vec3(uShine*(0.9*sharp + 0.25*fres));",
    "  vec3 c = mix(diffuse + vec3(0.08*mirror*fres), metal, uMetal);",
    "  vec3 rr = reflect(-v,n);",
    /* Piano-black gloss: a long overhead softbox, a tight hot spot, a thin rim. */
    "  float band = smoothstep(0.45,0.98,rr.y);",
    "  float hot = pow(max(dot(n,normalize(l1+v)),0.0),34.0);",
    "  c += uSheen*(0.16*band*band*band + 0.7*hot + 0.1*fres);",
    "  c = mix(c, pow(uSignal, vec3(2.2)), clamp(uGlow*vGlow, 0.0, 1.0));",
    "  c *= 1.0 - uCut*vGlow;",
    "  float f = uFogMax*smoothstep(uNear,uFar,-vP.z);",
    "  c = mix(c, pow(uFog, vec3(2.2)), f);",
    "  o = vec4(pow(c, vec3(1.0/2.2)), 1.0);",
    "}"
  ].join("\n");

  /* Particle field: each point rides a slow travelling surface. */
  var VS_POINT = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPt;",
    "uniform mat4 uProj; uniform mat4 uMV; uniform float uTime; uniform float uPx;",
    "out float vA;",
    "void main(){",
    "  float x = aPt.x, z = aPt.y;",
    "  float h = 1.5*sin(x*0.24 + uTime*0.16)*cos(z*0.3 - uTime*0.11)",
    "          + 0.9*sin(x*0.52 - z*0.38 + uTime*0.22)",
    "          + 0.35*sin(x*1.3 + z*0.9 + uTime*0.4);",
    "  vec4 mv = uMV*vec4(x, h, z, 1.0);",
    "  gl_Position = uProj*mv;",
    "  float d = -mv.z;",
    "  gl_PointSize = uPx*(0.5+1.3*aPt.z)*(26.0/d);",
    "  float crest = smoothstep(-1.2, 2.2, h);",
    "  vA = (0.1 + 0.9*crest*crest)*(0.35+0.65*aPt.z)*smoothstep(46.0, 16.0, d);",
    "}"
  ].join("\n");

  var FS_POINT = [
    "#version 300 es",
    "precision highp float;",
    "in float vA; out vec4 o;",
    "void main(){",
    "  vec2 q = gl_PointCoord*2.0-1.0;",
    "  float a = vA*smoothstep(1.0, 0.2, dot(q,q));",
    "  o = vec4(a, a, a, a);",
    "}"
  ].join("\n");

  /* Morphing strands: each instance carries six positions, blended by uW.
     uStrand scales the radius in; uHeat sends bright points up the forest. */
  var MORPH_COMMON = [
    "uniform mat4 uProj; uniform mat4 uMV; uniform float uW[6]; uniform float uStrand;",
    "uniform float uHeat; uniform float uTime; uniform float uWave; uniform float uCrack;",
    /* the panel parts along x=0, widest at its lower face; tubes that cross stretch over the gap */
    "vec3 crack(vec3 p){ p.x += sign(p.x)*0.5*uCrack*clamp(1.0-p.z/118.0,0.0,1.0); return p; }",
    "float heat(vec3 c, vec3 seed){",
    "  return uHeat*pow(max(0.0, sin(c.z*0.022 - uTime*3.0 + seed.x*0.31 + seed.y*0.17)), 40.0);",
    "}"
  ].join("\n");

  var VS_MATOM = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec3 iP0;",
    "layout(location=2) in vec3 iP1;",
    "layout(location=3) in vec3 iP2;",
    "layout(location=4) in vec3 iP3;",
    "layout(location=5) in vec3 iP4;",
    "layout(location=6) in vec3 iP5;",
    "layout(location=7) in float iR;",
    MORPH_COMMON,
    "out vec3 vN; out vec3 vP; out float vGlow;",
    "void main(){",
    "  vec3 c = crack(iP0*uW[0] + iP1*uW[1] + iP2*uW[2] + iP3*uW[3] + iP4*uW[4] + iP5*uW[5]);",
    "  float g = heat(c, iP3);",
    "  float rad = iR*uStrand*(1.0+0.9*g);",
    "  if(uWave>0.5){",                         // travelling wave: full above the panel, fading inside it
    "    float env = c.z>150.0 ? 1.0 : exp((c.z-150.0)*0.03);",
    "    c.x += 34.0*env*sin(c.z*0.03 + uTime*4.0 + c.y*0.02);",
    "    rad *= 0.25 + 0.75*env;",
    "    g = env;",
    "  }",
    "  vec4 mv = uMV*vec4(c + aPos*rad, 1.0);",
    "  vN = mat3(uMV)*aPos; vP = mv.xyz; vGlow = g;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  var VS_MBOND = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec3 iA0;",
    "layout(location=2) in vec3 iA1;",
    "layout(location=3) in vec3 iA2;",
    "layout(location=4) in vec3 iA3;",
    "layout(location=5) in vec3 iA4;",
    "layout(location=6) in vec3 iA5;",
    "layout(location=7) in vec3 iB0;",
    "layout(location=8) in vec3 iB1;",
    "layout(location=9) in vec3 iB2;",
    "layout(location=10) in vec3 iB3;",
    "layout(location=11) in vec3 iB4;",
    "layout(location=12) in vec3 iB5;",
    "layout(location=13) in float iR;",
    "layout(location=14) in float iSeed;",
    "uniform int uFrom; uniform int uTo; uniform float uT;",
    MORPH_COMMON,
    "vec3 pick(int i, vec3 p0, vec3 p1, vec3 p2, vec3 p3, vec3 p4, vec3 p5){",
    "  return i==0 ? p0 : i==1 ? p1 : i==2 ? p2 : i==3 ? p3 : i==4 ? p4 : p5;",
    "}",
    "out vec3 vN; out vec3 vP; out float vGlow;",
    "void main(){",
    /* each rope leaves a little after the last and eases in and out, so a
       change sweeps through the material instead of snapping */
    "  float t = clamp(uT*1.5 - 0.5*iSeed, 0.0, 1.0);",
    "  t = t*t*t*(t*(t*6.0-15.0)+10.0);",
    "  vec3 a = crack(mix(pick(uFrom,iA0,iA1,iA2,iA3,iA4,iA5), pick(uTo,iA0,iA1,iA2,iA3,iA4,iA5), t));",
    "  vec3 b = crack(mix(pick(uFrom,iB0,iB1,iB2,iB3,iB4,iB5), pick(uTo,iB0,iB1,iB2,iB3,iB4,iB5), t));",
    "  vec3 ax = b-a; float len = length(ax); ax /= max(len,1e-5);",
    "  vec3 up = abs(ax.y)<0.95 ? vec3(0.,1.,0.) : vec3(1.,0.,0.);",
    "  vec3 u = normalize(cross(up,ax)); vec3 w = cross(ax,u);",
    "  vec3 n = u*aPos.x + w*aPos.z;",
    "  float g = heat(mix(a,b,aPos.y), mix(iA3,iB3,aPos.y));",
    "  vec4 mv = uMV*vec4(a + ax*len*aPos.y + n*iR*uStrand*(1.0+0.9*g), 1.0);",
    "  vN = mat3(uMV)*n; vP = mv.xyz; vGlow = g;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  function compile(gl, vs, fs) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    var u = {};
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p: p, u: u };
  }

  /* ---------- engine: one WebGL2 context ---------- */

  function Engine(canvas, lowDetail, sides) {
    var gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl) throw new Error("no webgl2");
    this.gl = gl;
    this.canvas = canvas;
    this.atomProg = compile(gl, VS_ATOM, FS);
    this.bondProg = compile(gl, VS_BOND, FS);
    this.boxProg = compile(gl, VS_BOX, FS);
    this.pointProg = compile(gl, VS_POINT, FS_POINT);
    this.mAtomProg = compile(gl, VS_MATOM, FS);
    this.mBondProg = compile(gl, VS_MBOND, FS);
    this.sphereLo = this.mesh(icosphere(1));
    this.sphere = this.mesh(icosphere(lowDetail ? 2 : 3));
    this.cyl = this.mesh(cylinder(sides || (lowDetail ? 12 : 20)));
    this.box = this.boxMesh(cube());
    this.cache = {};
    gl.enable(gl.DEPTH_TEST);
  }

  Engine.prototype.mesh = function (m) {
    var gl = this.gl;
    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, m.pos, gl.STATIC_DRAW);
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
    return { vb: vb, ib: ib, count: m.idx.length };
  };

  Engine.prototype.boxMesh = function (m) {
    var gl = this.gl;
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, m.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao: vao, count: m.idx.length };
  };

  /* GPU buffers for a model, built once per engine. */
  Engine.prototype.model = function (key, data) {
    if (this.cache[key]) return this.cache[key];
    var gl = this.gl;
    function vao(mesh, inst, layout, stride) {
      var v = gl.createVertexArray();
      gl.bindVertexArray(v);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vb);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW);
      layout.forEach(function (l) {
        gl.enableVertexAttribArray(l[0]);
        gl.vertexAttribPointer(l[0], l[1], gl.FLOAT, false, stride, l[2]);
        gl.vertexAttribDivisor(l[0], 1);
      });
      gl.bindVertexArray(null);
      return v;
    }
    var pointVao = null;
    if (data.points) {
      pointVao = gl.createVertexArray();
      gl.bindVertexArray(pointVao);
      var pb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pb);
      gl.bufferData(gl.ARRAY_BUFFER, data.points, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    }
    var out = {
      pointVao: pointVao,
      atomVao: data.atomCount ? vao(this.sphere, data.atoms, [[1, 4, 0]], 16) : null,
      bondVao: data.bondCount ? vao(this.cyl, data.bonds, [[1, 3, 0], [2, 3, 12], [3, 1, 24]], 28) : null
    };
    this.cache[key] = out;
    return out;
  };

  Engine.prototype.draw = function (scene, x, y, w, h, time) {
    var gl = this.gl;
    var d = scene.data;
    var gpu = this.model(scene.key, d);
    var look = scene.look;

    gl.viewport(x, y, w, h);
    gl.scissor(x, y, w, h);

    var fov = scene.hero ? 0.5 : 0.6;
    var dist = scene.hero ? d.radius * scene.heroDist : (d.radius / Math.sin(fov / 2)) * 1.04;
    var proj = perspective(fov, w / h, Math.max(0.1, dist - d.radius * 4), dist + d.radius * 12);

    var turn = d.spin === "sway" ? Math.sin(scene.spin * 0.6) * 0.5 : d.spin === "none" ? 0 : scene.spin;
    var model = mul(d.orient, rotY(turn));
    /* offX / offY place the object as a fraction of the half-frame. */
    var halfH = dist * Math.tan(fov / 2);
    var offY = scene.offY + (d.offsetY || 0);
    var view = mul(translation(scene.offX * halfH * (w / h), offY * halfH, -dist), mul(rotX(scene.tiltX), rotY(scene.tiltY)));
    var mv = mul(view, model);

    var near = scene.hero ? dist - d.radius * 1.1 : dist - d.radius * 0.5;
    var far = scene.hero ? dist + d.radius * scene.heroFog : dist + d.radius * 1.1;

    function use(prog) {
      gl.useProgram(prog.p);
      gl.uniformMatrix4fv(prog.u.uProj, false, proj);
      gl.uniformMatrix4fv(prog.u.uMV, false, mv);
      gl.uniform1f(prog.u.uTime, time);
      gl.uniform1f(prog.u.uMode, d.mode);
      gl.uniform1f(prog.u.uAmp, d.amp);
      gl.uniform1f(prog.u.uPulse, d.pulse);
      gl.uniform3fv(prog.u.uBase, look.base);
      gl.uniform3fv(prog.u.uFog, look.fog);
      gl.uniform1f(prog.u.uNear, near);
      gl.uniform1f(prog.u.uFar, far);
      gl.uniform1f(prog.u.uMetal, look.metal);
      gl.uniform1f(prog.u.uEnvLo, look.envLo);
      gl.uniform1f(prog.u.uEnvHi, look.envHi);
      gl.uniform1f(prog.u.uAmb, look.amb);
      gl.uniform1f(prog.u.uGlow, look.glow);
      gl.uniform3fv(prog.u.uSignal, SIGNAL);
      gl.uniform1f(prog.u.uCut, look.cut || 0);
      gl.uniform1f(prog.u.uSheen, look.sheen || 0);
      gl.uniform1f(prog.u.uShine, look.shine === undefined ? 1 : look.shine);
      gl.uniform1f(prog.u.uFogMax, scene.hero ? 1 : (look.depth === undefined ? 1 : look.depth));
      gl.uniform1f(prog.u.uGrow, scene.grow === undefined ? 1e5 : scene.grow);
      gl.uniform1f(prog.u.uSplit, d.split === undefined ? 1e5 : d.split);
    }

    if (gpu.pointVao) {
      var pp = this.pointProg;
      gl.useProgram(pp.p);
      gl.uniformMatrix4fv(pp.u.uProj, false, proj);
      gl.uniformMatrix4fv(pp.u.uMV, false, mv);
      gl.uniform1f(pp.u.uTime, time);
      gl.uniform1f(pp.u.uPx, h / 520);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(gpu.pointVao);
      gl.drawArrays(gl.POINTS, 0, d.pointCount);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      return;
    }

    if (d.plates.length) {
      use(this.boxProg);
      gl.uniform3fv(this.boxProg.u.uBase, look.plate);
      gl.uniform1f(this.boxProg.u.uMetal, look.metal * 0.45);
      gl.bindVertexArray(this.box.vao);
      for (var i = 0; i < d.plates.length; i++) {
        gl.uniform3fv(this.boxProg.u.uC, d.plates[i].c);
        gl.uniform3fv(this.boxProg.u.uS, d.plates[i].s);
        gl.drawElements(gl.TRIANGLES, this.box.count, gl.UNSIGNED_SHORT, 0);
      }
    }

    if (gpu.bondVao) {
      use(this.bondProg);
      gl.bindVertexArray(gpu.bondVao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.cyl.count, gl.UNSIGNED_SHORT, 0, d.bondCount);
    }

    use(this.atomProg);
    gl.uniform1f(this.atomProg.u.uCoat, d.coat || 0);
    gl.uniform1f(this.atomProg.u.uLen, d.len || 1);
    gl.bindVertexArray(gpu.atomVao);
    gl.drawElementsInstanced(gl.TRIANGLES, this.sphere.count, gl.UNSIGNED_SHORT, 0, d.atomCount);
    gl.bindVertexArray(null);
  };

  /* ---------- hero film: timeline, camera, stages ---------- */

  var FILM_LENGTH = 45;   // seconds per loop
  /* camera distance over time: [second, distance]; eased in log space */
  var FILM_CAMERA = [[0, 46], [3, 46], [5.2, 100], [6, 100], [9.5, 2300], [11.5, 1150], [14, 1150],
                     [16, 1900], [18.5, 1900], [20.5, 2750], [22.3, 2750], [23.5, 250000], [24.6, 250000],
                     [26.4, 2650], [32, 2650], [34, 2700], [36.5, 2700], [39, 170], [43, 170], [45, 46]];
  /* when each form takes over from the one before: [start, end] */
  var FILM_MORPH = [[9.0, 12.0], [13.6, 16.6], [18.1, 21.0], [24.4, 27.0], [31.6, 34.6]];
  var FILM_RETURN = [36.2, 38.6];
  /* far stages are drawn at 0.2 micrometre per unit; the atom tube at 0.194 nm per unit */
  var NM_FAR = 200, NM_NEAR = 0.194;

  /* smootherstep: zero speed and zero acceleration at both ends */
  function ease(a, b, x) {
    x = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function filmState(c) {
    var d = 46, i, k;
    for (i = 1; i < FILM_CAMERA.length; i++) {
      if (c <= FILM_CAMERA[i][0]) {
        var a = FILM_CAMERA[i - 1], b = FILM_CAMERA[i];
        d = Math.exp(Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * ease(a[0], b[0], c));
        break;
      }
    }
    /* the camera never sits perfectly still: a slow breath on every hold */
    d *= 1 + 0.025 * Math.sin(c * 0.9) * ease(6, 9, c) * (1 - ease(36, 38, c));
    var w = [1, 0, 0, 0, 0, 0], from = 0, to = 0, t = 1;
    for (k = 0; k < FILM_MORPH.length; k++) {
      var m = ease(FILM_MORPH[k][0], FILM_MORPH[k][1], c);
      for (i = 0; i < 6; i++) w[i] *= 1 - m;
      w[k + 1] += m;
      if (c >= FILM_MORPH[k][0]) {
        from = k; to = k + 1;
        t = Math.min(1, (c - FILM_MORPH[k][0]) / (FILM_MORPH[k][1] - FILM_MORPH[k][0]));
      }
    }
    if (c >= FILM_RETURN[0]) {
      from = 5; to = 0;
      t = Math.min(1, (c - FILM_RETURN[0]) / (FILM_RETURN[1] - FILM_RETURN[0]));
    }
    var back = ease(FILM_RETURN[0], FILM_RETURN[1], c);
    for (i = 0; i < 6; i++) w[i] *= 1 - back;
    w[0] += back;

    var on = (c > 39.3 && c < 40.6) || (c > 41.4 && c < 42.6);
    var stage = c < 3 ? 0 : c < 6 ? 1 : c < 9.5 ? 2 : c < 14 ? 3 : c < 18.5 ? 4 : c < 22.6 ? 5 : c < 24.9 ? 6 :
                c < 29.3 ? 7 : c < 32 ? 8 : c < 37.2 ? 9 : c < 44 ? (on ? 10 : 11) : 0;

    /* turn freely while it is a tube and a fibre; face the viewer from the film on */
    var turn = c < 3 ? c * 0.15 : 0.45 + (c - 3) * 0.05;
    turn *= 1 - ease(14, 16, c);
    turn += 0.1 * Math.sin(c * 0.45) * ease(16, 18, c) * (1 - ease(36.5, 38, c));
    turn -= 1.0 * ease(18.5, 20.5, c) * (1 - ease(24.8, 26.6, c));     // look in between the plates
    turn -= 0.62 * ease(24.8, 26.6, c) * (1 - ease(36.5, 38, c));      // three-quarter view of panel and electrode
    return {
      dist: d,
      w: w,
      from: from,
      to: to,
      t: t,
      turn: turn,
      stage: stage,
      neighbours: c > 3 && c < 12 ? 8.3 + 70 * (1 - ease(3, 5, c)) : 0,   // six tubes close in to form a rope
      heat: w[3] * ease(20.3, 21.2, c),
      crack: w[4] * 64 * ease(29.3, 30.6, c) * (1 - ease(31.6, 32.2, c)),
      gate: ease(38.2, 39.2, c) * (1 - ease(43, 44.4, c)),
      on: on,
      progress: c / FILM_LENGTH
    };
  }

  /* a true scale bar: pick a round length that is 60-130 px wide right now */
  function filmScale(scene, st) {
    var pxPerUnit = (scene.h / scene.dpr) / (2 * st.dist * Math.tan(0.25));
    var nmPerUnit = st.dist < 520 ? NM_NEAR : NM_FAR;
    var want = (110 / pxPerUnit) * nmPerUnit, pow = Math.pow(10, Math.floor(Math.log(want) / Math.LN10));
    var nice = want / pow >= 5 ? 5 * pow : want / pow >= 2 ? 2 * pow : pow;
    var label = nice < 1 ? nice.toFixed(1) + " nm" : nice < 1000 ? nice + " nm" :
                nice < 1e6 ? nice / 1000 + " µm" : nice < 1e7 ? nice / 1e6 + " mm" : nice / 1e7 + " cm";
    return { px: (nice / nmPerUnit) * pxPerUnit, label: label };
  }

  Engine.prototype.filmBuffers = function (d) {
    if (this.film) return this.film;
    var gl = this.gl, self = this;
    function build(mesh, data, stride, layout) {
      var v = gl.createVertexArray();
      gl.bindVertexArray(v);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vb);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      layout.forEach(function (l) {
        gl.enableVertexAttribArray(l[0]);
        gl.vertexAttribPointer(l[0], l[1], gl.FLOAT, false, stride, l[2]);
        gl.vertexAttribDivisor(l[0], 1);
      });
      gl.bindVertexArray(null);
      return v;
    }
    var i, atomLayout = [], bondLayout = [];
    for (i = 0; i < 6; i++) atomLayout.push([i + 1, 3, i * 12]);
    atomLayout.push([7, 1, 72]);
    for (i = 0; i < 12; i++) bondLayout.push([i + 1, 3, i * 12]);
    bondLayout.push([13, 1, 144]);
    bondLayout.push([14, 1, 148]);
    this.film = {
      bonds: build(self.cyl, d.mBonds, 152, bondLayout.slice(0, 13).concat([[14, 1, 148]])),
      grains: build(self.sphere, d.mGrains, 76, atomLayout),
      waves: build(self.sphereLo, d.mWaves, 76, atomLayout)
    };
    return this.film;
  };

  Engine.prototype.journey = function (scene, w, h, clock) {
    var gl = this.gl, d = scene.data, look = scene.look, self = this;
    var c = ((clock % FILM_LENGTH) + FILM_LENGTH) % FILM_LENGTH;
    var st = filmState(c);
    scene.film = st;
    scene.filmScale = filmScale(scene, st);

    gl.viewport(0, 0, w, h);
    var fov = 0.5, dist = st.dist;
    var proj = perspective(fov, w / h, dist * 0.06, dist * 6 + 6000);
    var halfH = dist * Math.tan(fov / 2);
    var view = mul(translation(scene.offX * halfH * (w / h), scene.offY * halfH, -dist),
                   mul(rotX(scene.tiltX), rotY(scene.tiltY)));
    var world = mul(d.orient, rotY(st.turn + (scene.scrollTurn || 0)));
    /* on the widest shot, aim at the middle of the pad rather than its corner */
    var wide = ease(9000, 120000, dist);
    if (wide > 0) world = mul(world, translation(-49440 * wide, -37560 * wide, 0));
    var mv = mul(view, world);

    /* close up the tube dissolves with depth, as before; further out the
       whole form keeps its tone. */
    var far = ease(90, 420, dist);
    var fogNear = (dist - d.radius * 1.1) * (1 - far) + dist * 0.75 * far;
    var fogFar = (dist + d.radius * 5.5) * (1 - far) + dist * 2.6 * far;
    var fogMax = 1 - 0.78 * far;
    var sheet = look.sheet || [0.82, 0.82, 0.82];
    var part = look.part || [0.42, 0.42, 0.42];

    function use(prog, matrix) {
      gl.useProgram(prog.p);
      gl.uniformMatrix4fv(prog.u.uProj, false, proj);
      gl.uniformMatrix4fv(prog.u.uMV, false, matrix || mv);
      gl.uniform1f(prog.u.uTime, clock);
      gl.uniform1f(prog.u.uMode, 0);
      gl.uniform1f(prog.u.uAmp, 0);
      gl.uniform1f(prog.u.uPulse, 0);
      gl.uniform1f(prog.u.uGrow, 1e5);
      gl.uniform1f(prog.u.uSplit, 1e5);
      gl.uniform3fv(prog.u.uBase, look.base);
      gl.uniform3fv(prog.u.uFog, look.fog);
      gl.uniform1f(prog.u.uNear, fogNear);
      gl.uniform1f(prog.u.uFar, fogFar);
      gl.uniform1f(prog.u.uMetal, look.metal);
      gl.uniform1f(prog.u.uEnvLo, look.envLo);
      gl.uniform1f(prog.u.uEnvHi, look.envHi);
      gl.uniform1f(prog.u.uAmb, look.amb);
      gl.uniform1f(prog.u.uGlow, 1.0);
      gl.uniform3fv(prog.u.uSignal, SIGNAL);
      gl.uniform1f(prog.u.uCut, 0);
      gl.uniform1f(prog.u.uSheen, look.sheen || 0);
      gl.uniform1f(prog.u.uShine, look.shine === undefined ? 1 : look.shine);
      gl.uniform1f(prog.u.uFogMax, fogMax);
    }

    /* a flat-shaded slab in model space */
    function slab(cx, cy, cz, sx, sy, sz, colour) {
      if (sx <= 0.01 || sy <= 0.01 || sz <= 0.01) return;
      var bp = self.boxProg;
      use(bp);
      gl.uniform3fv(bp.u.uBase, colour);
      gl.uniform1f(bp.u.uMetal, 0);
      gl.uniform1f(bp.u.uSheen, 0);
      gl.uniform1f(bp.u.uShine, 0);
      gl.uniform1f(bp.u.uAmb, 1.0);
      gl.uniform3fv(bp.u.uC, [cx, cy, cz]);
      gl.uniform3fv(bp.u.uS, [sx, sy, sz]);
      gl.bindVertexArray(self.box.vao);
      gl.drawElements(gl.TRIANGLES, self.box.count, gl.UNSIGNED_SHORT, 0);
    }

    /* 1. the atom-by-atom tube, while it is large enough to see */
    if (dist < 900) {
      var gpu = this.model("journey:tube", d.tube);
      use(this.bondProg);
      gl.bindVertexArray(gpu.bondVao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.cyl.count, gl.UNSIGNED_SHORT, 0, d.tube.bondCount);
      use(this.atomProg);
      gl.uniform1f(this.atomProg.u.uCoat, 0);
      gl.uniform1f(this.atomProg.u.uLen, 1);
      gl.bindVertexArray(gpu.atomVao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.sphere.count, gl.UNSIGNED_SHORT, 0, d.tube.atomCount);

      /* six neighbours slide in beside it and lock into a rope (bonds only) */
      if (st.neighbours > 0) {
        gl.bindVertexArray(gpu.bondVao);
        for (var nb = 0; nb < 6; nb++) {
          var ang = nb * 1.0472 + 0.5;
          use(this.bondProg, mul(mv, translation(Math.cos(ang) * st.neighbours, 0, Math.sin(ang) * st.neighbours)));
          gl.drawElementsInstanced(gl.TRIANGLES, this.cyl.count, gl.UNSIGNED_SHORT, 0, d.tube.bondCount);
        }
      }

      /* transistor: the tube lies on a gate insulator between two contacts.
         Gate on: it lights and carriers stream through. Gate off: they stop. */
      if (st.gate > 0.01) {
        var g = st.gate;
        slab(0, 0, -9.5, 26 * g, 78 * g, 2.2, sheet);
        slab(0, 0, -15, 30 * g, 86 * g, 8, st.on ? sheet : part);
        slab(0, -29, -1, 22 * g, 15 * g, 15 * g, part);
        slab(0, 29, -1, 22 * g, 15 * g, 15 * g, part);
        if (st.on) {
          var cg = this.model("journey:carriers", d.carriers);
          use(this.atomProg);
          gl.uniform1f(this.atomProg.u.uMode, 7);
          gl.uniform1f(this.atomProg.u.uLen, 58);
          gl.uniform1f(this.atomProg.u.uCoat, 0);
          gl.uniform1f(this.atomProg.u.uGlow, 1.4);
          gl.bindVertexArray(cg.atomVao);
          gl.drawElementsInstanced(gl.TRIANGLES, this.sphere.count, gl.UNSIGNED_SHORT, 0, d.carriers.atomCount);
        }
      }
    }

    /* 2. the ropes, once the camera is far enough for them to read */
    var strand = ease(260, 900, dist);
    if (strand > 0.001) {
      var buf = this.filmBuffers(d), wv = new Float32Array(st.w);
      var f2 = st.w[2], f3 = st.w[3], f4 = st.w[4], f5 = st.w[5];

      /* film: a pale sheet under the mat */
      slab(0, 0, -12, 800 * f2, 610 * f2, 10, sheet);

      /* thermal: the section sits at one corner of a pad centimetres wide.
         Chip below, finned heat sink above, and the rest of the 100
         micrometre layer shown solid where it is not cut open. */
      if (f3 > 0.01) {
        var PX = 100000, PY = 76000, ox = PX / 2 - 560, oy = PY / 2 - 440, k3 = f3 * f3 * f3;
        var sxp = 1120 + (PX - 1120) * k3, syp = 880 + (PY - 880) * k3, cxp = ox * k3, cyp = oy * k3;
        slab(cxp, cyp, -7 - 1500 * f3, sxp, syp, 3000 * f3, part);                 // chip
        slab(cxp, cyp, 507 + 1750 * f3, sxp, syp, 3500 * f3, part);                // heat sink base
        for (var fin = 0; fin < 12; fin++) {
          slab(cxp, cyp + (fin / 11 - 0.5) * (syp - 2600 * k3), 507 + 3500 * f3 + 6500 * k3, sxp, 2600 * k3 + 30 * f3, 13000 * k3 + 150 * f3, part);
        }
        if (k3 > 0.02) {                                                          // the layer beyond the cut
          slab(560 + (PX - 1120) / 2 * k3, cyp, 250, (PX - 1120) * k3, syp, 500, look.base);
          slab(0, 440 + (PY - 880) / 2 * k3, 250, 1120, (PY - 880) * k3, 500, look.base);
        }
      }

      /* composite: a panel 150 thick, drawn by its edges so the network
         shows. When it cracks, the two halves part along x=0. */
      if (f4 > 0.01) {
        var X = 460 * f4, Y = 335 * f4, T = 7, gap = st.crack, ex, ey;
        for (ex = -1; ex <= 1; ex += 2) {
          for (ey = -1; ey <= 1; ey += 2) {
            slab(ex * (X + gap * 0.5), ey * Y, 75, T, T, 150 * f4, part);
            slab(ex * (X / 2 + (ey < 0 ? gap * 0.5 : 0) + 2), ey * Y, 0, X - 4, T, T, part);        // lower edges, parted
            slab(ex * X / 2, ey * Y, 150, X, T, T, part);                                           // upper edges, whole
            slab(ex * (X + (ey < 0 ? gap * 0.5 : 0)), 0, ey < 0 ? 0 : 150, T, 2 * Y, T, part);
          }
        }
        if (gap > 0.5) {                                                           // the crack faces
          slab(-gap * 0.25, 0, 52, gap * 0.02 + 2, 2 * Y, 104, sheet);
          slab(gap * 0.25, 0, 52, gap * 0.02 + 2, 2 * Y, 104, sheet);
        }
      }

      /* electrode: metal foil (the current collector) under the coated layer */
      if (f5 > 0.01) slab(0, 0, -10, 1060 * f5, 820 * f5, 14, sheet);

      use(this.mBondProg);
      gl.uniform1i(this.mBondProg.u.uFrom, st.from);
      gl.uniform1i(this.mBondProg.u.uTo, st.to);
      gl.uniform1f(this.mBondProg.u.uT, st.t);
      gl.uniform1f(this.mBondProg.u.uStrand, strand);
      gl.uniform1f(this.mBondProg.u.uHeat, st.heat);
      gl.uniform1f(this.mBondProg.u.uWave, 0);
      gl.uniform1f(this.mBondProg.u.uCrack, st.crack);
      gl.bindVertexArray(buf.bonds);
      gl.drawElementsInstanced(gl.TRIANGLES, this.cyl.count, gl.UNSIGNED_SHORT, 0, d.mBondCount);

      use(this.mAtomProg);
      gl.uniform1fv(this.mAtomProg.u["uW[0]"], wv);
      gl.uniform1f(this.mAtomProg.u.uHeat, 0);
      gl.uniform1f(this.mAtomProg.u.uCrack, 0);

      /* shielding: waves arrive at the panel and die out inside it */
      var signal = f4 * (1 - ease(29.0, 29.6, c));
      if (signal > 0.01) {
        gl.uniform1f(this.mAtomProg.u.uStrand, signal * strand);
        gl.uniform1f(this.mAtomProg.u.uWave, 1);
        gl.bindVertexArray(buf.waves);
        gl.drawElementsInstanced(gl.TRIANGLES, this.sphereLo.count, gl.UNSIGNED_SHORT, 0, d.mWaveCount);
      }

      /* electrode: storage particles packed on the foil, ropes between them */
      if (f5 > 0.01) {
        gl.uniform1f(this.mAtomProg.u.uStrand, f5 * strand);
        gl.uniform1f(this.mAtomProg.u.uWave, 0);
        gl.uniform3fv(this.mAtomProg.u.uBase, part);
        gl.uniform1f(this.mAtomProg.u.uMetal, 0.25);
        gl.bindVertexArray(buf.grains);
        gl.drawElementsInstanced(gl.TRIANGLES, this.sphere.count, gl.UNSIGNED_SHORT, 0, d.mGrainCount);
      }
    }
    gl.bindVertexArray(null);
  };

  /* ---------- theme-driven look ---------- */

  function parse(str) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(str || "");
    if (m) return [m[1] / 255, m[2] / 255, m[3] / 255];
    var h = /^#([0-9a-f]{6})$/i.exec((str || "").trim());
    if (h) return [parseInt(h[1].slice(0, 2), 16) / 255, parseInt(h[1].slice(2, 4), 16) / 255, parseInt(h[1].slice(4, 6), 16) / 255];
    return null;
  }

  /* Product objects follow one rule in both themes: a pitch-black object on
     a pure white window, lit from above, with the page drawing the shadow
     underneath. The home hero film follows the same rule: in dark mode it
     plays on a white backdrop that fades into the black page. */
  function lookFor(el) {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (el.getAttribute("data-hc-3d") === "dunes") {
      return { base: [1, 1, 1], plate: [1, 1, 1], fog: [0, 0, 0], metal: 1, envLo: 0, envHi: 1, amb: 0, glow: 1 };
    }
    return { base: [0.03, 0.03, 0.03], plate: [0.1, 0.1, 0.1], fog: [1, 1, 1], metal: 1, envLo: 0.0, envHi: 0.5, amb: 0.3, glow: 1.0, cut: 0, sheen: 0.16, shine: 0.22, depth: 0.07 };
  }

  /* The one accent colour, read from the page (--hc-signal). */
  var SIGNAL = [1, 0.35, 0.12];
  function readSignal() {
    var c = parse(getComputedStyle(document.documentElement).getPropertyValue("--hc-signal"));
    if (c) SIGNAL = c;
  }

  /* ---------- scenes ---------- */

  var scenes = [];
  var shared = null;       // Engine for small scenes
  var sharedFailed = false;
  var pointer = { x: 0, y: 0 };
  var running = false;
  var start = performance.now();

  function mobile() {
    return window.innerWidth < 760;
  }

  function makeScene(el) {
    var kind = el.getAttribute("data-hc-3d");
    if (!MODELS[kind]) return null;
    var hero = el.getAttribute("data-hc-3d-view") === "hero";
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    var scene = {
      el: el,
      canvas: canvas,
      kind: kind,
      hero: hero,
      key: kind + (hero ? ":hero" : ""),
      data: MODELS[kind]({ hero: hero }),
      visible: false,
      spin: Math.random() * 6.28,
      tiltX: 0,
      tiltY: 0,
      offX: 0,
      offY: 0,
      heroDist: 12,
      heroFog: 5.5,
      look: lookFor(el),
      w: 0,
      h: 0,
      dpr: 1,
      drawn: false,
      born: 0
    };

    try {
      if (hero) {
        scene.engine = new Engine(canvas, true, scene.data.journey && !mobile() ? 18 : 0);
      } else {
        if (sharedFailed) throw new Error("shared");
        if (!shared) {
          try {
            shared = new Engine(document.createElement("canvas"), mobile());
          } catch (e) {
            sharedFailed = true;
            throw e;
          }
        }
        scene.ctx2d = canvas.getContext("2d");
      }
    } catch (err) {
      el.classList.add("hc-3d--fallback");
      el.removeChild(canvas);
      return null;
    }
    el.classList.add("hc-3d--live");
    return scene;
  }

  function measure(scene) {
    var r = scene.el.getBoundingClientRect();
    var px = window.devicePixelRatio || 1;
    /* the film is drawn sharper than the screen when the machine allows; see tune() */
    if (scene.quality === undefined) scene.quality = mobile() ? 1.15 : 1.5;
    var dpr = scene.data.journey ? Math.min(px * scene.quality, mobile() ? 2 : 2.6) : scene.hero ? Math.min(px * 1.5, mobile() ? 2 : 2.5) : Math.min(px * 1.6, 3);
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (w !== scene.w || h !== scene.h) {
      scene.w = w; scene.h = h; scene.dpr = dpr;
      scene.canvas.width = w;
      scene.canvas.height = h;
      scene.drawn = false;
    }
    if (scene.hero) {
      /* Wide screens: the tube sits right of the copy. Narrow: behind it, higher. */
      var wide = r.width > 900;
      scene.offX = wide ? 0.46 : scene.data.journey ? 0 : 0.3;
      scene.offY = wide ? 0.02 : scene.data.journey ? 0 : 0.42;
      scene.heroDist = wide ? 12 : 15;
    }
  }

  function render(scene, time) {
    if (!scene.w || !scene.h) return;
    if (scene.hero) {
      var gl = scene.engine.gl;
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (scene.data.journey) {
        /* data-hc-film-at="seconds" freezes the film at one moment (stills, checks). */
        var hold = scene.el.getAttribute("data-hc-film-at");
        scene.engine.journey(scene, scene.w, scene.h, hold !== null ? parseFloat(hold) : STATIC ? 12.5 : (performance.now() - (scene.born || performance.now())) / 1000);
        caption(scene);
      } else {
        scene.engine.draw(scene, 0, 0, scene.w, scene.h, time);
      }
    } else {
      var c = shared.canvas;
      if (c.width < scene.w || c.height < scene.h) {
        c.width = Math.max(c.width, scene.w);
        c.height = Math.max(c.height, scene.h);
      }
      var g = shared.gl;
      g.enable(g.SCISSOR_TEST);
      g.clearColor(0, 0, 0, 0);
      g.viewport(0, c.height - scene.h, scene.w, scene.h);
      g.scissor(0, c.height - scene.h, scene.w, scene.h);
      g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
      shared.draw(scene, 0, c.height - scene.h, scene.w, scene.h, time);
      scene.ctx2d.clearRect(0, 0, scene.w, scene.h);
      scene.ctx2d.drawImage(c, 0, 0, scene.w, scene.h, 0, 0, scene.w, scene.h);
    }
    scene.drawn = true;
  }

  /* The film's caption line and progress bar live in the page. */
  function caption(scene) {
    var st = scene.film;
    if (!st) return;
    if (scene.captionEl === undefined) {
      scene.captionEl = document.querySelector("[data-hc-film-caption]") || null;
      scene.barEl = document.querySelector("[data-hc-film-bar]") || null;
      try {
        scene.captions = scene.captionEl ? JSON.parse(scene.captionEl.getAttribute("data-captions")) : [];
      } catch (e) {
        scene.captions = [];
      }
    }
    if (scene.barEl) scene.barEl.style.transform = "scaleX(" + st.progress.toFixed(4) + ")";
    if (scene.whatEl === undefined) {
      scene.whatEl = document.querySelector("[data-hc-film-what]") || null;
      try {
        scene.names = scene.whatEl ? JSON.parse(scene.whatEl.getAttribute("data-names")) : [];
      } catch (e2) {
        scene.names = [];
      }
    }
    if (scene.whatEl && scene.whatStage !== st.stage) {
      scene.whatStage = st.stage;
      scene.whatEl.textContent = scene.names[st.stage] || "";
    }
    if (scene.scaleEl === undefined) {
      scene.scaleEl = document.querySelector("[data-hc-film-scale]") || null;
      scene.scaleBarEl = document.querySelector("[data-hc-film-scalebar]") || null;
    }
    if (scene.scaleEl && scene.filmScale) {
      if (scene.scaleLabel !== scene.filmScale.label) {
        scene.scaleLabel = scene.filmScale.label;
        scene.scaleEl.textContent = scene.filmScale.label;
      }
      if (scene.scaleBarEl) scene.scaleBarEl.style.width = scene.filmScale.px.toFixed(1) + "px";
    }
    if (scene.captionEl && scene.captionStage !== st.stage) {
      scene.captionStage = st.stage;
      var el = scene.captionEl, text = scene.captions[st.stage] || "";
      el.classList.remove("is-in");
      window.setTimeout(function () { el.textContent = text; el.classList.add("is-in"); }, 180);
    }
  }

  /* Keep the film as sharp as this machine can draw smoothly. Slow frames
     lower the render scale a step; a long smooth run raises it again. */
  function tune(scene, dt) {
    if (STATIC || !scene.data.journey || scene.el.hasAttribute("data-hc-film-at")) return;
    scene.load = scene.load === undefined ? dt : scene.load * 0.94 + dt * 0.06;
    scene.settle = (scene.settle || 0) + 1;
    if (scene.settle < 90) return;
    var top = mobile() ? 1.15 : 1.5;
    if (scene.load > 1 / 40 && scene.quality > 0.7) {
      scene.quality = Math.max(0.7, scene.quality - 0.15);
    } else if (scene.load < 1 / 57 && scene.quality < top && scene.settle > 420) {
      scene.quality = Math.min(top, scene.quality + 0.1);
    } else {
      return;
    }
    scene.settle = 0;
    scene.load = undefined;
    measure(scene);
  }

  var last = 0;
  var lastScroll = window.scrollY || 0;
  function frame(now) {
    running = false;
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    var time = (now - start) / 1000;
    var any = false;
    var sy = window.scrollY || 0;
    var scrollDelta = sy - lastScroll;
    lastScroll = sy;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (!s.visible) continue;
      if (STATIC && s.drawn) continue;
      if (!STATIC) {
        any = true;
        s.spin += dt * (s.hero ? 0.16 : 0.34) * (s.data.speed || 1);
        if (s.hero) {
          tune(s, dt);
          /* Build-in on first sight, then turn with the page scroll. */
          if (!s.born) s.born = now;
          s.grow = -52 + ((now - s.born) / 1000) * 62;
          s.spin += scrollDelta * 0.0035;
          s.scrollTurn = (s.scrollTurn || 0) + scrollDelta * 0.0012;
        }
        var tx = pointer.y * (s.hero ? 0.1 : 0.22);
        var ty = pointer.x * (s.hero ? 0.14 : 0.3);
        s.tiltX += (tx - s.tiltX) * 0.06;
        s.tiltY += (ty - s.tiltY) * 0.06;
      }
      render(s, STATIC ? 0 : time);
    }
    if (any && !document.hidden) schedule();
  }

  function schedule() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function init() {
    var nodes = document.querySelectorAll("[data-hc-3d]");
    if (!nodes.length) return;
    readSignal();

    var probe = document.createElement("canvas");
    if (!probe.getContext || !window.WebGL2RenderingContext) {
      nodes.forEach(function (n) { n.classList.add("hc-3d--fallback"); });
      return;
    }

    nodes.forEach(function (n) {
      var s = makeScene(n);
      if (s) scenes.push(s);
    });
    if (!scenes.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        for (var i = 0; i < scenes.length; i++) {
          if (scenes[i].el === e.target) {
            scenes[i].visible = e.isIntersecting;
            if (e.isIntersecting) measure(scenes[i]);
          }
        }
      });
      schedule();
    }, { rootMargin: "120px" });
    scenes.forEach(function (s) { io.observe(s.el); });

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        scenes.forEach(function (s) { if (s.visible) measure(s); });
        schedule();
      }, 120);
    });

    if (!STATIC) {
      window.addEventListener("pointermove", function (e) {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { last = performance.now(); schedule(); }
    });

    new MutationObserver(function () {
      readSignal();
      scenes.forEach(function (s) { s.look = lookFor(s.el); s.drawn = false; });
      schedule();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    scenes.forEach(function (s) {
      if (!s.hero) return;
      s.canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); s.visible = false; });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
