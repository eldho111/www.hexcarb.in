/* HexCarb 3D — real-time WebGL2 molecular scenes (no dependencies).

   Usage:  <div class="hc-3d" data-hc-3d="nanotube"></div>
   Models: nanotube | mwcnt | graphene | layers | fibre
   Options (data attributes):
     data-hc-3d-view="hero"      wide cinematic framing, tube runs off-frame
     data-hc-3d-surface="graphite"  scene sits on a graphite panel (fixed dark)

   Everything is monochrome: the material and the depth fade are derived from
   the page theme, so the scene inverts with light / dark mode.

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

  /* ---------- lattice builders (bond length = 1) ---------- */

  /* Honeycomb sheet. nx cells of width sqrt(3) across, ny cells of height 3
     along. wrap=true joins the two long edges (used to roll a tube). */
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

  function pack(atoms3, bonds, atomR) {
    var a = new Float32Array(atoms3.length * 4);
    for (var i = 0; i < atoms3.length; i++) {
      a[i * 4] = atoms3[i][0]; a[i * 4 + 1] = atoms3[i][1]; a[i * 4 + 2] = atoms3[i][2]; a[i * 4 + 3] = atomR;
    }
    var b = new Float32Array(bonds.length * 6);
    for (var k = 0; k < bonds.length; k++) {
      var p = atoms3[bonds[k][0]], q = atoms3[bonds[k][1]];
      b[k * 6] = p[0]; b[k * 6 + 1] = p[1]; b[k * 6 + 2] = p[2];
      b[k * 6 + 3] = q[0]; b[k * 6 + 4] = q[1]; b[k * 6 + 5] = q[2];
    }
    return { atoms: a, bonds: b, atomCount: atoms3.length, bondCount: bonds.length };
  }

  /* Zigzag tube (n,0): the sheet's short axis wraps the circumference. */
  function tubeAtoms(n, cells, yOffset) {
    var h = honeycomb(n, cells, true);
    var radius = h.width / (Math.PI * 2);
    var out = h.atoms.map(function (p) {
      var th = (p[0] / h.width) * Math.PI * 2;
      return [radius * Math.cos(th), p[1] - h.length / 2 + (yOffset || 0), radius * Math.sin(th)];
    });
    return { atoms: out, bonds: h.bonds, radius: radius, length: h.length };
  }

  function merge(parts) {
    var atoms = [], bonds = [];
    parts.forEach(function (p) {
      var base = atoms.length;
      p.atoms.forEach(function (a) { atoms.push(a); });
      p.bonds.forEach(function (b) { bonds.push([b[0] + base, b[1] + base]); });
    });
    return { atoms: atoms, bonds: bonds };
  }

  var MODELS = {
    nanotube: function (opts) {
      var t = tubeAtoms(opts.hero ? 14 : 10, opts.hero ? 30 : 6);
      var m = pack(t.atoms, t.bonds, 0.2);
      m.radius = opts.hero ? t.radius : Math.hypot(t.radius, t.length / 2);
      m.tube = t.radius;
      m.mode = 2;
      m.orient = opts.hero ? mul(rotZ(-0.6), rotX(-0.62)) : mul(rotZ(-0.95), rotX(0.45));
      m.spinAxis = "y";
      return m;
    },
    mwcnt: function () {
      var a = tubeAtoms(7, 6), b = tubeAtoms(12, 5, 0), c = tubeAtoms(17, 4, 0);
      var g = merge([a, b, c]);
      var m = pack(g.atoms, g.bonds, 0.2);
      m.radius = Math.hypot(c.radius, a.length / 2);
      m.mode = 0;
      m.orient = mul(rotZ(-0.9), rotX(0.5));
      m.spinAxis = "y";
      return m;
    },
    graphene: function (opts) {
      var nx = opts.hero ? 30 : 7, ny = opts.hero ? 14 : 4;
      var h = honeycomb(nx, ny, false);
      var atoms = h.atoms.map(function (p) { return [p[0] - h.width / 2, 0, p[1] - h.length / 2]; });
      var m = pack(atoms, h.bonds, 0.2);
      m.radius = opts.hero ? h.length * 0.62 : Math.hypot(h.width, h.length) / 2;
      m.mode = 1;
      m.orient = rotX(opts.hero ? 1.02 : 0.9);
      m.spinAxis = "sheet";
      return m;
    },
    layers: function () {
      var parts = [];
      for (var l = -1; l <= 1; l++) {
        var h = honeycomb(6, 3, false);
        var shift = l === 0 ? S3 / 2 : 0;
        parts.push({
          atoms: h.atoms.map(function (p) { return [p[0] - h.width / 2 + shift, l * 2.3, p[1] - h.length / 2]; }),
          bonds: h.bonds
        });
      }
      var g = merge(parts);
      var m = pack(g.atoms, g.bonds, 0.2);
      m.radius = 6.6;
      m.mode = 0;
      m.orient = rotX(0.62);
      m.spinAxis = "y";
      return m;
    },
    fibre: function () {
      /* Twisted bundle of seven strands drawn as smooth bead chains. */
      var atoms = [], bonds = [], strands = 7, steps = 56, len = 13;
      for (var s = 0; s < strands; s++) {
        var ring = s === 0 ? 0 : 1.25;
        var phase = ((s - 1) / 6) * Math.PI * 2;
        for (var i = 0; i < steps; i++) {
          var y = (i / (steps - 1) - 0.5) * len;
          var tw = phase + y * 0.42;
          atoms.push([ring * Math.cos(tw), y, ring * Math.sin(tw)]);
          if (i) bonds.push([atoms.length - 2, atoms.length - 1]);
        }
      }
      var m = pack(atoms, bonds, 0.6);
      m.bondR = 0.6;
      m.radius = len / 2 + 0.6;
      m.mode = 0;
      m.orient = mul(rotZ(-0.95), rotX(0.4));
      m.spinAxis = "y";
      return m;
    }
  };

  /* ---------- shaders ---------- */

  var COMMON = [
    "uniform mat4 uProj;",
    "uniform mat4 uMV;",
    "uniform float uTime;",
    "uniform float uMode;",
    "uniform float uAmp;",
    "vec3 deform(vec3 p){",
    "  if(uMode>0.5 && uMode<1.5){",
    "    p.y += uAmp*(sin(p.x*0.42+uTime*0.9)*0.9 + sin(p.z*0.36-uTime*0.7)*0.7);",
    "  } else if(uMode>1.5){",
    "    p.x += uAmp*sin(p.y*0.085+uTime*0.5);",
    "    p.z += uAmp*0.6*cos(p.y*0.07+uTime*0.37);",
    "  }",
    "  return p;",
    "}"
  ].join("\n");

  var VS_ATOM = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec4 iAtom;",
    COMMON,
    "out vec3 vN; out vec3 vP;",
    "void main(){",
    "  vec3 c = deform(iAtom.xyz);",
    "  vec4 mv = uMV*vec4(c + aPos*iAtom.w, 1.0);",
    "  vN = mat3(uMV)*aPos; vP = mv.xyz;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  var VS_BOND = [
    "#version 300 es",
    "precision highp float;",
    "layout(location=0) in vec3 aPos;",
    "layout(location=1) in vec3 iA;",
    "layout(location=2) in vec3 iB;",
    "uniform float uBondR;",
    COMMON,
    "out vec3 vN; out vec3 vP;",
    "void main(){",
    "  vec3 a = deform(iA); vec3 b = deform(iB);",
    "  vec3 ax = b-a; float len = length(ax); ax /= max(len,1e-5);",
    "  vec3 up = abs(ax.y)<0.95 ? vec3(0.,1.,0.) : vec3(1.,0.,0.);",
    "  vec3 u = normalize(cross(up,ax)); vec3 w = cross(ax,u);",
    "  vec3 n = u*aPos.x + w*aPos.z;",
    "  vec4 mv = uMV*vec4(a + ax*len*aPos.y + n*uBondR, 1.0);",
    "  vN = mat3(uMV)*n; vP = mv.xyz;",
    "  gl_Position = uProj*mv;",
    "}"
  ].join("\n");

  /* Studio lighting: soft key from upper left, cool fill, strong rim, and a
     depth fade into the page colour so the object dissolves into the surface. */
  var FS = [
    "#version 300 es",
    "precision highp float;",
    "in vec3 vN; in vec3 vP;",
    "uniform vec3 uBase; uniform vec3 uFog;",
    "uniform float uNear; uniform float uFar;",
    "uniform float uSpec; uniform float uRim; uniform float uAmb;",
    "out vec4 o;",
    "void main(){",
    "  vec3 n = normalize(vN); vec3 v = normalize(-vP);",
    "  if(dot(n,v)<0.0) n = -n;",
    "  vec3 l1 = normalize(vec3(-0.55,0.75,0.6));",
    "  vec3 l2 = normalize(vec3(0.8,0.1,0.45));",
    "  float d1 = max(dot(n,l1),0.0);",
    "  float d2 = max(dot(n,l2),0.0);",
    "  float hemi = 0.5+0.5*n.y;",
    "  float s1 = pow(max(dot(n,normalize(l1+v)),0.0),64.0);",
    "  float s2 = pow(max(dot(n,normalize(l2+v)),0.0),24.0);",
    "  float fres = pow(1.0-max(dot(n,v),0.0),3.0);",
    "  vec3 c = uBase*(uAmb*(0.55+0.45*hemi) + 0.85*d1 + 0.22*d2);",
    "  c += uSpec*(s1 + 0.22*s2) + uRim*fres;",
    "  float f = smoothstep(uNear,uFar,-vP.z);",
    "  c = mix(c,uFog,f);",
    "  o = vec4(c,1.0);",
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
    this.sphere = this.mesh(icosphere(lowDetail ? 1 : 2));
    this.cyl = this.mesh(cylinder(lowDetail ? 8 : 12));
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
    var out = {
      atomVao: vao(this.sphere, data.atoms, [[1, 4, 0]], 16),
      bondVao: vao(this.cyl, data.bonds, [[1, 3, 0], [2, 3, 12]], 24)
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

    var spin = scene.spin;
    var model = d.spinAxis === "sheet" ? mul(d.orient, rotY(spin * 0.35)) : mul(d.orient, rotY(spin));
    /* offX / offY place the object as a fraction of the half-frame. */
    var halfH = dist * Math.tan(fov / 2);
    var view = mul(translation(scene.offX * halfH * (w / h), scene.offY * halfH, -dist), mul(rotX(scene.tiltX), rotY(scene.tiltY)));
    var mv = mul(view, model);

    var near = scene.hero ? dist - d.radius * 1.1 : dist - d.radius * 0.1;
    var far = scene.hero ? dist + d.radius * scene.heroFog : dist + d.radius * 2.4;

    var self = this;
    function use(prog) {
      gl.useProgram(prog.p);
      gl.uniformMatrix4fv(prog.u.uProj, false, proj);
      gl.uniformMatrix4fv(prog.u.uMV, false, mv);
      gl.uniform1f(prog.u.uTime, time);
      gl.uniform1f(prog.u.uMode, d.mode);
      gl.uniform1f(prog.u.uAmp, d.mode === 1 ? 0.5 : d.mode === 2 ? 1.1 : 0);
      gl.uniform3fv(prog.u.uBase, look.base);
      gl.uniform3fv(prog.u.uFog, look.fog);
      gl.uniform1f(prog.u.uNear, near);
      gl.uniform1f(prog.u.uFar, far);
      gl.uniform1f(prog.u.uSpec, look.spec);
      gl.uniform1f(prog.u.uRim, look.rim);
      gl.uniform1f(prog.u.uAmb, look.amb);
    }

    use(this.bondProg);
    gl.uniform1f(this.bondProg.u.uBondR, d.bondR || 0.085);
    gl.bindVertexArray(gpu.bondVao);
    gl.drawElementsInstanced(gl.TRIANGLES, self.cyl.count, gl.UNSIGNED_SHORT, 0, d.bondCount);

    use(this.atomProg);
    gl.bindVertexArray(gpu.atomVao);
    gl.drawElementsInstanced(gl.TRIANGLES, self.sphere.count, gl.UNSIGNED_SHORT, 0, d.atomCount);
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

  function lookFor(el) {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var surface = el.getAttribute("data-hc-3d-surface");
    if (surface === "graphite") {
      /* Polished silver on a graphite panel, in both themes. */
      return { base: [0.62, 0.62, 0.62], fog: [0.1, 0.1, 0.1], spec: 0.75, rim: 0.3, amb: 0.3 };
    }
    var bg = parse(getComputedStyle(document.documentElement).getPropertyValue("--hc-bg")) || (dark ? [0, 0, 0] : [1, 1, 1]);
    if (dark) {
      /* White ceramic dissolving into black. */
      return { base: [0.78, 0.78, 0.78], fog: bg, spec: 0.55, rim: 0.22, amb: 0.22 };
    }
    /* Graphite dissolving into white. */
    return { base: [0.09, 0.09, 0.09], fog: bg, spec: 0.5, rim: 0.2, amb: 0.5 };
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
        scene.engine = new Engine(canvas, mobile());
      } else {
        if (sharedFailed) throw new Error("shared");
        if (!shared) {
          try {
            shared = new Engine(document.createElement("canvas"), true);
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
    var dpr = Math.min(window.devicePixelRatio || 1, scene.hero ? (mobile() ? 1.5 : 1.75) : 2);
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
        s.spin += dt * (s.hero ? 0.16 : 0.34);
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
