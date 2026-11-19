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

    stretch: function () {
      var t = tube(10, 7), b = new Builder();
      b.lattice(t.atoms, t.bonds);
      return b.done({ radius: 9.6, mode: 5, amp: 0.13, orient: mul(rotZ(-1.0), rotX(0.35)), speed: 0.5 });
    },

    current: function () {
      var t = tube(10, 8), b = new Builder(), rand = rng(3);
      b.lattice(t.atoms, t.bonds);
      for (var i = 0; i < 16; i++) {
        var a = rand() * 6.28, r = rand() * t.radius * 0.55;
        b.a.push(r * Math.cos(a), (rand() - 0.5) * t.length, r * Math.sin(a), -0.3);
      }
      return b.done({ radius: 10.4, mode: 7, amp: 0, len: t.length, orient: mul(rotZ(-1.0), rotX(0.35)), speed: 0.5 });
    },

    heat: function () {
      var t = tube(10, 8), b = new Builder();
      b.lattice(t.atoms, t.bonds);
      return b.done({ radius: 10.4, pulse: 2, orient: mul(rotZ(-1.0), rotX(0.35)), speed: 0.5 });
    },

    bend: function () {
      var t = tube(8, 9), b = new Builder();
      b.lattice(t.atoms, t.bonds);
      return b.done({ radius: 11.2, mode: 6, amp: 0.02, orient: mul(rotZ(-1.2), rotX(0.3)), spin: "sway" });
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
        b.strand(wavy(rand, p, d, 13 + rand() * 9, 60, 0.7 + rand() * 0.9), 0.075);
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
    "vec3 deform(vec3 p){",
    "  if(uMode>0.5 && uMode<1.5){",          // rippling sheet
    "    p.y += uAmp*(sin(p.x*0.42+uTime*0.9)*0.9 + sin(p.z*0.36-uTime*0.7)*0.7);",
    "  } else if(uMode>1.5 && uMode<2.5){",   // slow sway along a tube
    "    p.x += uAmp*sin(p.y*0.085+uTime*0.5);",
    "    p.z += uAmp*0.6*cos(p.y*0.07+uTime*0.37);",
    "  } else if(uMode>2.5 && uMode<3.5){",   // drifting in a liquid
    "    p += uAmp*vec3(sin(p.y*0.5+uTime*0.6), sin(p.z*0.45+uTime*0.5+1.7), sin(p.x*0.55+uTime*0.55+3.1));",
    "  } else if(uMode>4.5 && uMode<5.5){",   // pulled along the axis, necking slightly
    "    float k = uAmp*(0.5-0.5*cos(uTime*1.3));",
    "    p.y *= 1.0+k; p.xz *= 1.0-0.45*k;",
    "  } else if(uMode>5.5 && uMode<6.5){",   // flexed into an arc and back
    "    float b = uAmp*sin(uTime*1.1);",
    "    p.x += b*p.y*p.y - b*60.0;",
    "  }",
    "  return p;",
    "}",
    /* A heat pulse climbing each tube: 0 between pulses, 1 at the crest. */
    "float pulse(vec3 p){",
    "  if(uPulse<0.5) return 0.0;",
    "  if(uPulse>1.5) return pow(max(0.0, sin(p.y*0.3 - uTime*2.6)), 5.0);",   // one front along a single tube
    "  float ph = floor(p.x*1.09+0.5)*2.3 + floor(p.z*1.09+0.5)*4.1;",
    "  return pow(max(0.0, sin(p.y*0.8 - uTime*2.4 + ph)), 10.0);",
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
    "  if(iAtom.w<0.0 && uMode>6.5){",         // charge carrier: streams along the bore
    "    c.y = mod(c.y + uTime*(7.0+3.0*fract(c.x*7.3)) + uLen*0.5, uLen) - uLen*0.5;",
    "    g = 1.0;",
    "  } else if(iAtom.w<0.0){",               // wave bead: swings, then dies in the coating
    "    float env = c.y>uCoat ? 1.0 : exp((c.y-uCoat)*2.6);",
    "    c.x += uAmp*env*sin(c.y*1.9 + uTime*3.4 + c.z);",
    "    r *= 0.45 + 0.55*env;",
    "    g = 0.6*env;",
    "  }",
    "  r *= 1.0 + 0.55*g*min(uPulse,1.0);",
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
    "  vec4 mv = uMV*vec4(a + ax*len*aPos.y + n*iR*(1.0+0.55*g*min(uPulse,1.0)), 1.0);",
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
    "uniform float uMetal; uniform float uEnvLo; uniform float uEnvHi; uniform float uAmb; uniform float uGlow; uniform float uCut;",
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
    "  vec3 metal = base*mirror*(1.0+0.6*fres) + vec3(0.9*sharp + 0.25*fres);",
    "  vec3 c = mix(diffuse + vec3(0.08*mirror*fres), metal, uMetal);",
    "  c += uGlow*vGlow;",
    "  c *= 1.0 - uCut*vGlow;",
    "  float f = smoothstep(uNear,uFar,-vP.z);",
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

  function Engine(canvas, lowDetail) {
    var gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl) throw new Error("no webgl2");
    this.gl = gl;
    this.canvas = canvas;
    this.atomProg = compile(gl, VS_ATOM, FS);
    this.bondProg = compile(gl, VS_BOND, FS);
    this.boxProg = compile(gl, VS_BOX, FS);
    this.pointProg = compile(gl, VS_POINT, FS_POINT);
    this.sphere = this.mesh(icosphere(lowDetail ? 2 : 3));
    this.cyl = this.mesh(cylinder(lowDetail ? 12 : 20));
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

    var near = scene.hero ? dist - d.radius * 1.1 : dist + d.radius * 6;
    var far = scene.hero ? dist + d.radius * scene.heroFog : dist + d.radius * 40;

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
      gl.uniform1f(prog.u.uCut, look.cut || 0);
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

  /* ---------- theme-driven look ---------- */

  function parse(str) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(str || "");
    if (m) return [m[1] / 255, m[2] / 255, m[3] / 255];
    var h = /^#([0-9a-f]{6})$/i.exec((str || "").trim());
    if (h) return [parseInt(h[1].slice(0, 2), 16) / 255, parseInt(h[1].slice(2, 4), 16) / 255, parseInt(h[1].slice(4, 6), 16) / 255];
    return null;
  }

  /* Product objects follow one rule: in light mode a pitch-black object on
     pure white, in dark mode a white object on pure black. Light comes from
     above; the page draws the shadow (or glow) underneath. */
  function lookFor(el) {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (el.getAttribute("data-hc-3d") === "dunes") {
      return { base: [1, 1, 1], plate: [1, 1, 1], fog: [0, 0, 0], metal: 1, envLo: 0, envHi: 1, amb: 0, glow: 1 };
    }
    if (dark) {
      return { base: [1, 1, 1], plate: [0.82, 0.82, 0.82], fog: [0, 0, 0], metal: 0.55, envLo: 0.5, envHi: 1.0, amb: 0.75, glow: 0.0, cut: 0.55 };
    }
    return { base: [0.03, 0.03, 0.03], plate: [0.1, 0.1, 0.1], fog: [1, 1, 1], metal: 1, envLo: 0.0, envHi: 0.5, amb: 0.3, glow: 0.85, cut: 0 };
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
      drawn: false
    };

    try {
      if (hero) {
        scene.engine = new Engine(canvas, true);
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
    var dpr = scene.hero ? Math.min(px * 1.5, mobile() ? 2 : 2.5) : Math.min(px * 1.6, 3);
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
      scene.offX = wide ? 0.46 : 0.3;
      scene.offY = wide ? 0.02 : 0.42;
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
      scene.engine.draw(scene, 0, 0, scene.w, scene.h, time);
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

  var last = 0;
  function frame(now) {
    running = false;
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    var time = (now - start) / 1000;
    var any = false;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (!s.visible) continue;
      if (STATIC && s.drawn) continue;
      if (!STATIC) {
        any = true;
        s.spin += dt * (s.hero ? 0.16 : 0.34) * (s.data.speed || 1);
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
