(function () {
  "use strict";

  function hasFineHoverPointer() {
    return window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isValidGaId(id) {
    return /^G-[A-Z0-9]{6,}$/i.test(String(id || "").trim());
  }

  function parseJsonParams(raw) {
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (err) {
      return {};
    }
    return {};
  }

  function initGA() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    var gaId = window.HEXCARB_GA4_ID;
    if (!isValidGaId(gaId)) {
      window.__hcGAReady = false;
      return;
    }

    if (!document.querySelector('script[data-hc-ga="true"]')) {
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
      script.setAttribute("data-hc-ga", "true");
      document.head.appendChild(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", gaId, {
      anonymize_ip: true,
      send_page_view: true
    });
    window.__hcGAReady = true;
  }

  function track(eventName, params) {
    if (!eventName) return;

    var payload = Object.assign(
      {
        page_path: window.location.pathname
      },
      params || {}
    );

    if (window.__hcGAReady && typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(
      Object.assign(
        {
          event: eventName
        },
        payload
      )
    );
  }

  function initHeader() {
    var header = document.querySelector(".hc-header");
    if (!header) return;

    var menuButton = header.querySelector("[data-hc-menu-btn]");
    var mobileMenu = header.querySelector("[data-hc-mobile-nav]");
    var navLinks = header.querySelector(".hc-nav-links");
    var menuOpenClass = "menu-open";
    var expandedClass = "expanded";
    var desktopQuery = window.matchMedia("(min-width: 901px)");

    function setScrolled() {
      if (window.scrollY > 8) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }

    function closeMenu() {
      if (!menuButton || !mobileMenu) return;
      header.classList.remove(menuOpenClass);
      header.classList.remove(expandedClass);
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
    }

    function openMenu() {
      if (!menuButton || !mobileMenu) return;
      header.classList.add(menuOpenClass);
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "Close menu");
    }

    function setExpanded(isExpanded) {
      if (!desktopQuery.matches || !navLinks || header.classList.contains(menuOpenClass)) {
        header.classList.remove(expandedClass);
        return;
      }
      header.classList.toggle(expandedClass, Boolean(isExpanded));
    }

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
    window.addEventListener("resize", function () {
      setExpanded(false);
    });

    if (navLinks) {
      navLinks.addEventListener("mouseenter", function () {
        setExpanded(true);
      });
      navLinks.addEventListener("mouseleave", function () {
        setExpanded(false);
      });
      navLinks.addEventListener("focusin", function () {
        setExpanded(true);
      });
      navLinks.addEventListener("focusout", function (event) {
        if (!navLinks.contains(event.relatedTarget)) {
          setExpanded(false);
        }
      });
    }

    if (menuButton && mobileMenu) {
      menuButton.addEventListener("click", function () {
        var isOpen = header.classList.contains(menuOpenClass);
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      mobileMenu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          closeMenu();
        });
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          closeMenu();
        }
      });

      document.addEventListener("pointerdown", function (event) {
        if (!header.classList.contains(menuOpenClass)) return;
        if (header.contains(event.target)) return;
        closeMenu();
      });
    }

    var currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
    document.querySelectorAll("[data-nav-path]").forEach(function (link) {
      var navPath = link.getAttribute("data-nav-path");
      if (!navPath) return;
      if (currentPath === navPath || currentPath.indexOf(navPath + "/") === 0) {
        link.classList.add("active");
      }
    });
  }

  function initReveal() {
    var targets = document.querySelectorAll(".hc-reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("in-view");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initHeroCycle() {
    var cycles = document.querySelectorAll("[data-hc-hero-cycle]");
    if (!cycles.length) return;

    cycles.forEach(function (cycle) {
      var panes = Array.prototype.slice.call(cycle.querySelectorAll("[data-hc-hero-pane]"));
      var rails = Array.prototype.slice.call(cycle.querySelectorAll("[data-hc-hero-rail]"));
      if (!panes.length) return;

      var activeIndex = 0;
      var timer = null;
      var duration = 10000;

      function setActive(index) {
        activeIndex = ((index % panes.length) + panes.length) % panes.length;

        panes.forEach(function (pane, paneIndex) {
          pane.classList.toggle("is-active", paneIndex === activeIndex);
        });

        rails.forEach(function (rail, railIndex) {
          rail.classList.remove("is-active");
          var fill = rail.querySelector(".hc-hero-rail-fill");
          if (fill) {
            fill.style.animation = "none";
            fill.offsetHeight;
            fill.style.animation = "";
          }
          if (railIndex === activeIndex) {
            rail.classList.add("is-active");
          }
        });
      }

      function stopCycle() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      function startCycle() {
        stopCycle();
        if (prefersReducedMotion() || panes.length < 2) return;
        timer = window.setInterval(function () {
          setActive(activeIndex + 1);
        }, duration);
      }

      setActive(0);
      startCycle();

      rails.forEach(function (rail, railIndex) {
        rail.addEventListener("click", function () {
          setActive(railIndex);
          startCycle();
        });
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          stopCycle();
        } else {
          startCycle();
        }
      });
    });
  }

  function initMonumentGrid() {
    var grids = document.querySelectorAll("[data-hc-monument-grid]");
    if (!grids.length) return;

    var desktopQuery = window.matchMedia("(min-width: 901px)");

    grids.forEach(function (grid) {
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".hc-app-card"));
      if (!cards.length) return;

      function resetGrid() {
        grid.style.removeProperty("grid-template-columns");
        cards.forEach(function (card) {
          card.classList.remove("is-active");
        });
      }

      function activateCard(index) {
        if (!desktopQuery.matches || prefersReducedMotion()) {
          resetGrid();
          return;
        }
        var template = cards
          .map(function (_, cardIndex) {
            return cardIndex === index ? "2.5fr" : "1fr";
          })
          .join(" ");

        grid.style.gridTemplateColumns = template;
        cards.forEach(function (card, cardIndex) {
          card.classList.toggle("is-active", cardIndex === index);
        });
      }

      cards.forEach(function (card, index) {
        card.addEventListener("mouseenter", function () {
          activateCard(index);
        });
        card.addEventListener("focusin", function () {
          activateCard(index);
        });
      });

      grid.addEventListener("mouseleave", resetGrid);
      grid.addEventListener("focusout", function (event) {
        if (!grid.contains(event.relatedTarget)) {
          resetGrid();
        }
      });

      window.addEventListener("resize", function () {
        if (!desktopQuery.matches) {
          resetGrid();
        }
      });

      resetGrid();
    });
  }

  function initTrackClicks() {
    document.querySelectorAll("[data-track-event]").forEach(function (node) {
      node.addEventListener("click", function () {
        var eventName = node.getAttribute("data-track-event");
        var params = parseJsonParams(node.getAttribute("data-track-params"));
        track(eventName, params);
      });
    });
  }

  function initTrackForms() {
    document.querySelectorAll("form[data-track-form]").forEach(function (form) {
      form.addEventListener("submit", function () {
        track("hc_form_submit", {
          page: window.location.pathname,
          form_id: form.getAttribute("data-track-form") || form.id || "unknown"
        });
      });
    });
  }

  function initPremiumCardInteraction() {
    if (prefersReducedMotion() || !hasFineHoverPointer()) return;

    var cards = document.querySelectorAll(".hc-card, .hc-app-card");
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--hc-mx", x.toFixed(2) + "%");
        card.style.setProperty("--hc-my", y.toFixed(2) + "%");
      });

      card.addEventListener("pointerleave", function () {
        card.style.removeProperty("--hc-mx");
        card.style.removeProperty("--hc-my");
      });
    });
  }

  function initAiLinkFallback() {
    document.querySelectorAll("[data-ai-link]").forEach(function (link) {
      if (link.hasAttribute("data-track-event")) return;
      link.addEventListener("click", function () {
        track("hc_ai_engine_click", {
          page: window.location.pathname,
          location: link.getAttribute("data-ai-link") || "unknown"
        });
      });
    });
  }

  function setYearTokens() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll("[data-hc-year]").forEach(function (node) {
      node.textContent = year;
    });
  }

  window.hexTrack = track;

  document.addEventListener("DOMContentLoaded", function () {
    initGA();
    initHeader();
    initReveal();
    initHeroCycle();
    initMonumentGrid();
    initTrackClicks();
    initTrackForms();
    initAiLinkFallback();
    initPremiumCardInteraction();
    setYearTokens();
  });
})();
