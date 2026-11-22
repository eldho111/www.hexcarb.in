/* Rendered film and loops.
   Where a rendered video exists for a scene, it takes the place of the live 3D
   scene. This file must load before hexcarb-3d.js: it claims those elements by
   removing their data-hc-3d attribute, so the 3D engine leaves them alone.
   Any scene without a video here is still drawn live.
   The videos are black nanotubes on white; the stylesheet turns them inside
   out for dark mode. */
(function () {
  "use strict";

  var HERO = "/assets/media/hero-film/";
  var BASE = "/assets/media/loops/";
  var STAMP = "?v=20261201f";
  var LOOPS = { dispersion: 1, debundle: 1, fibre: 1, tim: 1, hybrid: 1, shield: 1, nanotube: 1, mwcnt: 1,
                stretch: 1, current: 1, heat: 1, bend: 1, "use-battery": 1, "use-concrete": 1, "use-film": 1,
                "use-textile": 1, "use-composite": 1, "use-sport": 1, "use-water": 1, "use-lightning": 1 };
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PHONE = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  if (!document.createElement("video").canPlayType) return;

  function video(src, loop) {
    var v = document.createElement("video");
    v.muted = true;
    v.loop = !!loop;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.preload = "none";
    v.src = src + (PHONE ? "_phone" : "") + ".mp4" + STAMP;
    return v;
  }

  /* play only what is on screen */
  var watch = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var el = e.target;
      el.hcSeen = e.isIntersecting;
      var vids = el.querySelectorAll("video");
      Array.prototype.forEach.call(vids, function (v) {
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          if (!REDUCED && (!el.hcHero || v.classList.contains("is-on"))) v.play().catch(function () {});
        } else {
          v.pause();
        }
      });
    });
  }, { rootMargin: "200px" });

  /* ---- the hero film: one video that runs from the single nanotube to the battery
     electrode and back to the single nanotube, so it loops without a seam ---- */
  var STORY = [
    /* [from second, label beside the film, caption under the headline] */
    [0.0, "Single-walled carbon nanotube", "One nanotube: 1.5 nm across, 7,500 times as long."],
    [4.2, "Nanotube rope (bundle of seven)", "Left alone, they cling together in ropes."],
    [10.3, "As made: tangled bundles", "As made: tangled into clumps, most tubes buried."],
    [15.3, "Debundling in liquid", "Debundling: the step that makes them usable."],
    [22.3, "Nanotube dispersion", "Dispersed: every tube free, and never still."],
    [25.7, "Nanotube fibre", "Aligned and spun into fibre."],
    [31.9, "Nanotube thin film", "Coated into a conducting film."],
    [37.3, "Thermal interface: aligned nanotubes", "Stood on end, from chip to heat sink."],
    [43.7, "Composite panel: EMI shielding", "Cast into panels that absorb signals."],
    [51.1, "Battery electrode", "Wired through battery electrodes."],
    [60.8, "Single-walled carbon nanotube", "One nanotube: 1.5 nm across, 7,500 times as long."]
  ];
  var LENGTH = 62.58;

  function hero(el) {
    el.removeAttribute("data-hc-3d");
    el.classList.add("hc-film-video");
    el.hcHero = true;
    var v = video(HERO + "film", true);
    v.poster = HERO + "poster.jpg" + STAMP;
    v.preload = "auto";
    v.classList.add("is-on");
    el.appendChild(v);
    var win = el.closest(".hc-film-window");
    if (win) win.classList.add("hc-film-window--video");
    var captionEl = document.querySelector("[data-hc-film-caption]");
    var whatEl = document.querySelector("[data-hc-film-what]");
    var barEl = document.querySelector("[data-hc-film-bar]");
    var beat = -1;

    function tick() {
      var t = v.currentTime || 0, k, now = 0;
      for (k = 0; k < STORY.length; k++) if (t >= STORY[k][0]) now = k;
      if (now !== beat) {
        var same = beat >= 0 && STORY[beat][1] === STORY[now][1];
        beat = now;
        if (whatEl) whatEl.textContent = STORY[now][1];
        if (captionEl && !same) {
          captionEl.classList.remove("is-in");
          window.setTimeout(function () { captionEl.textContent = STORY[beat][2]; captionEl.classList.add("is-in"); }, 180);
        }
      }
      if (barEl) barEl.style.transform = "scaleX(" + Math.min(1, t / (v.duration || LENGTH)).toFixed(4) + ")";
    }
    v.addEventListener("timeupdate", tick);
    /* it is at the top of the page: start at once rather than wait to be told it is on screen */
    if (!REDUCED) v.play().catch(function () {});
    watch.observe(el);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-hc-3d]"), function (el) {
    var kind = el.getAttribute("data-hc-3d");
    if (kind === "journey") { hero(el); return; }
    if (!LOOPS[kind]) return;
    el.removeAttribute("data-hc-3d");
    el.setAttribute("data-hc-loop", kind);
    el.classList.add("hc-loop");
    var v = video(BASE + kind, true);
    v.poster = BASE + kind + ".jpg" + STAMP;
    el.appendChild(v);
    watch.observe(el);
  });
})();
