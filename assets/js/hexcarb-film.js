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
  var STAMP = "?v=20261201b";
  /* loops are added here as their renders are finished */
  var LOOPS = {};
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

  /* ---- the hero film: the opening shot, then the main film, then round again ---- */
  var STORY = [
    /* [shot, from second, label beside the film, caption under the headline] */
    [0, 0.0, "Single-walled carbon nanotube", "One nanotube: 1.5 nm across, 7,500 times as long."],
    [0, 4.2, "Nanotube rope (bundle of seven)", "Left alone, they cling together in ropes."],
    [1, 0.0, "As made: tangled bundles", "As made: tangled into clumps, most tubes buried."],
    [1, 3.2, "Debundling in liquid", "Debundling: the step that makes them usable."],
    [1, 10.2, "Nanotube dispersion", "Dispersed: every tube free, and never still."],
    [1, 13.6, "Nanotube fibre", "Aligned and spun into fibre."],
    [1, 19.8, "Nanotube thin film", "Coated into a conducting film."],
    [1, 25.2, "Thermal interface: aligned nanotubes", "Stood on end, from chip to heat sink."],
    [1, 31.6, "Composite panel: EMI shielding", "Cast into panels that absorb signals."],
    [1, 39.0, "Battery electrode", "Wired through battery electrodes."]
  ];
  var LENGTHS = [8.6, 47.0];

  function hero(el) {
    el.removeAttribute("data-hc-3d");
    el.classList.add("hc-film-video");
    el.hcHero = true;
    var shots = [video(HERO + "opening", false), video(HERO + "hero", false)];
    shots[0].poster = HERO + "poster.jpg" + STAMP;
    shots[0].preload = "auto";
    shots[1].preload = "metadata";
    shots.forEach(function (v) { el.appendChild(v); });
    var win = el.closest(".hc-film-window");
    if (win) win.classList.add("hc-film-window--video");
    var captionEl = document.querySelector("[data-hc-film-caption]");
    var whatEl = document.querySelector("[data-hc-film-what]");
    var barEl = document.querySelector("[data-hc-film-bar]");
    var on = 0, beat = -1;

    function show(i) {
      var old = shots[on];
      on = i;
      shots.forEach(function (v, k) { v.classList.toggle("is-on", k === i); });
      /* the shot that is leaving keeps playing and falls away as the camera seems to pull back */
      if (old !== shots[i]) {
        old.classList.add("is-leaving");
        window.setTimeout(function () { old.classList.remove("is-leaving"); old.pause(); }, 1700);
      }
      shots[i].currentTime = 0;
      if (el.hcSeen !== false && !REDUCED) shots[i].play().catch(function () {});
    }

    function tick() {
      var v = shots[on], t = v.currentTime || 0, k, now = 0;
      /* once the opening is under way, fetch the main film behind it */
      if (on === 0 && t > 1 && shots[1].preload !== "auto") shots[1].preload = "auto";
      /* hand over a moment before the end, so one shot dissolves into the next */
      if (v.duration && v.duration - t < 1.5 && !v.hcLeaving) {
        v.hcLeaving = true;
        var next = (on + 1) % shots.length;
        window.setTimeout(function () { v.hcLeaving = false; }, 3000);
        show(next);
        return;
      }
      for (k = 0; k < STORY.length; k++) if (STORY[k][0] === on && t >= STORY[k][1]) now = k;
      if (now !== beat) {
        beat = now;
        if (whatEl) whatEl.textContent = STORY[now][2];
        if (captionEl) {
          captionEl.classList.remove("is-in");
          window.setTimeout(function () { captionEl.textContent = STORY[beat][3]; captionEl.classList.add("is-in"); }, 180);
        }
      }
      if (barEl) {
        var done = (on === 0 ? t : LENGTHS[0] + t) / (LENGTHS[0] + LENGTHS[1]);
        barEl.style.transform = "scaleX(" + Math.min(1, done).toFixed(4) + ")";
      }
    }
    shots.forEach(function (v) { v.addEventListener("timeupdate", tick); });
    shots[0].classList.add("is-on");
    /* it is at the top of the page: start at once rather than wait to be told it is on screen */
    if (!REDUCED) shots[0].play().catch(function () {});
    watch.observe(el);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-hc-3d]"), function (el) {
    var kind = el.getAttribute("data-hc-3d");
    if (kind === "journey") { hero(el); return; }
    if (!LOOPS[kind]) return;
    el.removeAttribute("data-hc-3d");
    el.setAttribute("data-hc-loop", kind);
    el.classList.add("hc-loop");
    el.appendChild(video(BASE + kind, true));
    watch.observe(el);
  });
})();
