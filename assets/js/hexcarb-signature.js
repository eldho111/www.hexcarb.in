(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initSignatureField() {
    var body = document.body;
    if (!body) return;

    var signatureMode = body.getAttribute("data-hc-signature-bg");
    if (signatureMode === "history") {
      body.classList.add("hc-signature-history");
      return;
    }

    if (signatureMode !== "field") return;

    var isDesktop = window.matchMedia && window.matchMedia("(min-width: 901px)").matches;
    if (prefersReducedMotion() || !isDesktop) {
      body.classList.add("hc-signature-static");
      return;
    }

    var canvas = document.createElement("canvas");
    canvas.className = "hc-signature-canvas";
    canvas.setAttribute("aria-hidden", "true");
    body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var width = 0;
    var height = 0;
    var raf = null;
    var lastTs = 0;
    var lastScroll = window.scrollY || 0;
    var scrollEnergy = 0;
    var nodes = [];
    var nodeCount = 34;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.height = height * Math.min(window.devicePixelRatio || 1, 1.5);
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      nodes = [];
      for (var i = 0; i < nodeCount; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          r: 1 + Math.random() * 1.8
        });
      }
    }

    function updateNodes() {
      for (var i = 0; i < nodes.length; i += 1) {
        var n = nodes[i];
        n.x += n.vx * (1 + scrollEnergy * 2.2);
        n.y += n.vy * (1 + scrollEnergy * 1.6);

        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }
    }

    function drawField() {
      ctx.clearRect(0, 0, width, height);
      var maxDist = 180;
      var lineAlpha = Math.min(0.3, 0.12 + scrollEnergy * 0.2);

      for (var i = 0; i < nodes.length; i += 1) {
        for (var j = i + 1; j < nodes.length; j += 1) {
          var a = nodes[i];
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) continue;
          var strength = 1 - dist / maxDist;
          ctx.strokeStyle = "rgba(78,124,116," + (lineAlpha * strength).toFixed(3) + ")";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (var k = 0; k < nodes.length; k += 1) {
        var n = nodes[k];
        ctx.fillStyle = "rgba(142,106,53,0.24)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min(64, ts - lastTs);
      lastTs = ts;

      var currentScroll = window.scrollY || 0;
      var speed = Math.abs(currentScroll - lastScroll) / Math.max(dt, 1);
      lastScroll = currentScroll;
      scrollEnergy = Math.min(1.4, scrollEnergy * 0.9 + Math.min(0.8, speed * 0.3));
      scrollEnergy *= 0.96;

      updateNodes();
      drawField();
      raf = window.requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(tick);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && raf) {
        window.cancelAnimationFrame(raf);
        raf = null;
      } else if (!document.hidden && !raf) {
        lastTs = 0;
        raf = window.requestAnimationFrame(tick);
      }
    });
  }

  function initProofAndCaseTracking() {
    if (typeof window.hexTrack !== "function") return;

    document.querySelectorAll("[data-hc-proof-asset]").forEach(function (node) {
      node.addEventListener("click", function () {
        window.hexTrack("hc_proof_asset_click", {
          page: window.location.pathname,
          asset_type: node.getAttribute("data-asset-type") || "unknown",
          asset_id: node.getAttribute("data-hc-proof-asset") || "unknown"
        });
      });
    });

    document.querySelectorAll("[data-hc-case]").forEach(function (node) {
      node.addEventListener("click", function () {
        window.hexTrack("hc_case_study_open", {
          case_slug: node.getAttribute("data-hc-case") || "unknown",
          source_page: window.location.pathname
        });
      });
    });
  }

  function initSelectorTracking() {
    var selector = document.getElementById("hc-materials-selector");
    if (!selector || typeof window.hexTrack !== "function") return;

    window.hexTrack("hc_selector_start", {
      page: "materials_selector",
      entry_section: "hero"
    });

    selector.addEventListener("hc:recommendation", function (event) {
      var detail = event.detail || {};
      window.hexTrack("hc_selector_recommendation_view", {
        industry: detail.industry || "other",
        application_slug: detail.application_slug || "general",
        recommended_family: detail.recommended_family || "general"
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSignatureField();
    initProofAndCaseTracking();
    initSelectorTracking();
  });
})();
