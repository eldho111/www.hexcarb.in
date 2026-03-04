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

  function getThemeStorageKey() {
    return "hc-theme-mode";
  }

  function getStoredTheme() {
    try {
      return window.localStorage.getItem(getThemeStorageKey());
    } catch (err) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      window.localStorage.setItem(getThemeStorageKey(), theme);
    } catch (err) {
      return;
    }
  }

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function normalizeTheme(theme) {
    return theme === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    var normalized = normalizeTheme(theme);
    var root = document.documentElement;
    root.setAttribute("data-theme", normalized);
    root.style.colorScheme = normalized;
    return normalized;
  }

  function updateThemeToggleState(toggle) {
    if (!toggle) return;
    var current = normalizeTheme(document.documentElement.getAttribute("data-theme"));
    var next = current === "dark" ? "light" : "dark";
    var label = toggle.querySelector("[data-hc-theme-label]");

    toggle.setAttribute("data-theme-mode", current);
    toggle.setAttribute("aria-pressed", current === "dark" ? "true" : "false");
    toggle.setAttribute("aria-label", "Switch to " + next + " mode");
    if (label) {
      label.textContent = current === "dark" ? "Dark" : "Light";
    }
  }

  function initThemeMode() {
    var stored = getStoredTheme();
    var initial = stored === "dark" || stored === "light" ? stored : getSystemTheme();
    applyTheme(initial);

    if (!stored && window.matchMedia) {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (event) {
        if (getStoredTheme()) return;
        applyTheme(event.matches ? "dark" : "light");
        updateThemeToggleState(document.querySelector("[data-hc-theme-toggle]"));
      };

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onChange);
      } else if (typeof media.addListener === "function") {
        media.addListener(onChange);
      }
    }
  }

  function initThemeToggle() {
    var header = document.querySelector(".hc-header");
    if (!header) return;

    var navActions = header.querySelector(".hc-nav-actions");
    if (!navActions) return;

    var menuButton = navActions.querySelector("[data-hc-menu-btn]");
    var toggle = navActions.querySelector("[data-hc-theme-toggle]");

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "hc-theme-toggle";
      toggle.setAttribute("data-hc-theme-toggle", "true");
      toggle.innerHTML =
        '<span class="hc-theme-toggle-track" aria-hidden="true"><span class="hc-theme-toggle-thumb"></span></span>' +
        '<span class="hc-theme-toggle-label" data-hc-theme-label></span>';

      if (menuButton && menuButton.parentNode === navActions) {
        navActions.insertBefore(toggle, menuButton);
      } else {
        navActions.appendChild(toggle);
      }
    }

    updateThemeToggleState(toggle);
    toggle.addEventListener("click", function () {
      var current = normalizeTheme(document.documentElement.getAttribute("data-theme"));
      var next = current === "dark" ? "light" : "dark";

      applyTheme(next);
      setStoredTheme(next);
      updateThemeToggleState(toggle);
      track("hc_theme_toggle", {
        mode: next,
        page: window.location.pathname
      });
    });
  }

  function appendQueryParams(url, params) {
    try {
      var target = new URL(url, window.location.origin);
      Object.keys(params).forEach(function (key) {
        if (!target.searchParams.get(key)) {
          target.searchParams.set(key, params[key]);
        }
      });
      return target.pathname + target.search + target.hash;
    } catch (err) {
      return url;
    }
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

  function initQuoteLinkContract() {
    var defaults = {
      source_page: "website",
      source_section: "cta",
      application_slug: "general",
      product_family: "general",
      intent_stage: "evaluate",
      industry: "other",
      priority: "performance"
    };

    document.querySelectorAll('a[href*="/quote.html"]').forEach(function (link) {
      var attrs = {
        source_page: link.getAttribute("data-source-page"),
        source_section: link.getAttribute("data-source-section"),
        application_slug: link.getAttribute("data-application-slug"),
        product_family: link.getAttribute("data-product-family"),
        intent_stage: link.getAttribute("data-intent-stage"),
        industry: link.getAttribute("data-industry"),
        priority: link.getAttribute("data-priority")
      };

      var merged = Object.assign({}, defaults);
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key]) merged[key] = attrs[key];
      });
      link.href = appendQueryParams(link.getAttribute("href"), merged);
    });
  }

  function initFormAntiSpam() {
    var now = Date.now();
    document.querySelectorAll("form[data-hc-antispam]").forEach(function (form) {
      var started = form.querySelector('input[name="hc_started_at"]');
      if (started) {
        started.value = String(now);
      }

      form.addEventListener("submit", function (event) {
        var honey = form.querySelector('input[name="company_website"]');
        if (honey && honey.value && honey.value.trim() !== "") {
          event.preventDefault();
          return;
        }

        var startInput = form.querySelector('input[name="hc_started_at"]');
        var minTime = Number(form.getAttribute("data-hc-min-submit-ms") || "2500");
        var startValue = startInput ? Number(startInput.value || "0") : 0;
        if (startValue > 0 && Date.now() - startValue < minTime) {
          event.preventDefault();
          var statusNode = document.getElementById(form.getAttribute("data-hc-status-id") || "");
          if (statusNode) {
            statusNode.textContent = "Please take a moment to review details before submitting.";
          }
          return;
        }
      });
    });
  }

  function initQuoteQualitySignals() {
    var quoteForm = document.getElementById("hc-quote-form");
    if (!quoteForm) return;

    var tracked = [
      "application_pathway",
      "material_family",
      "quantity_band",
      "timeline"
    ];

    tracked.forEach(function (fieldId) {
      var field = quoteForm.querySelector("#" + fieldId) || quoteForm.querySelector('[name="' + fieldId + '"]');
      if (!field) return;
      field.addEventListener("change", function () {
        track("hc_quote_quality_signal", {
          field: fieldId,
          value_bucket: field.value || "unset"
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
  initThemeMode();

  document.addEventListener("DOMContentLoaded", function () {
    initGA();
    initHeader();
    initThemeToggle();
    initReveal();
    initHeroCycle();
    initMonumentGrid();
    initQuoteLinkContract();
    initFormAntiSpam();
    initQuoteQualitySignals();
    initTrackClicks();
    initTrackForms();
    initAiLinkFallback();
    initPremiumCardInteraction();
    setYearTokens();
  });
})();
