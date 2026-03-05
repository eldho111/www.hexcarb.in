/* History page renderer and interactions */
(function (windowObj, documentObj) {
  "use strict";

  function prefersReducedMotion() {
    return windowObj.matchMedia && windowObj.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function track(eventName, params) {
    if (typeof windowObj.hexTrack !== "function") return;
    windowObj.hexTrack(eventName, params || {});
  }

  function toSlug(input) {
    return String(input || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function safeMilestones(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(function (item) {
      return item && typeof item === "object" && item.id && item.year_label && item.title;
    });
  }

  function safeEras(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(function (item) {
      return item && item.id && Number.isFinite(Number(item.year_start)) && Number.isFinite(Number(item.year_end));
    });
  }

  function safeFacts(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(function (item) {
      return item && item.fact_id && item.title && item.statement;
    });
  }

  function safeGaps(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(function (item) {
      return item && item.gap_id && item.title && item.summary;
    });
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function confidenceLabel(level) {
    var lookup = {
      established: "Established",
      strong: "Strong",
      emerging: "Emerging"
    };
    return lookup[level] || "Strong";
  }

  function deploymentLabel(level) {
    var lookup = {
      deployed: "Deployed",
      pilot: "Pilot",
      lab: "Lab"
    };
    return lookup[level] || "Pilot";
  }

  function escapeAttr(text) {
    return String(text || "").replace(/"/g, "&quot;");
  }

  function factReferenceAnchor(factId, refIndex) {
    return "hc-ref-fact-" + factId + "-" + String(refIndex + 1);
  }

  function gapReferenceAnchor(gapId, refIndex) {
    return "hc-ref-gap-" + gapId + "-" + String(refIndex + 1);
  }

  function buildSupLinks(refs, anchorBuilder, idKey) {
    var supWrap = documentObj.createElement("span");
    supWrap.className = "hc-history-sup-wrap";

    refs.forEach(function (_, refIndex) {
      var sup = documentObj.createElement("a");
      sup.className = "hc-history-sup";
      sup.href = "#" + anchorBuilder(idKey, refIndex);
      sup.textContent = "[" + String(refIndex + 1) + "]";
      supWrap.appendChild(sup);
    });

    return supWrap;
  }

  function buildMilestoneCard(milestone, index) {
    var article = documentObj.createElement("article");
    article.className = "hc-card hc-history-card hc-reveal";
    article.id = "hc-history-" + milestone.id;
    article.setAttribute("data-hc-history-id", milestone.id);
    article.setAttribute("data-hc-history-year", milestone.year_label);
    article.setAttribute("data-hc-history-material", milestone.material_family || "unknown");

    var imageSrc = milestone.image || "/assets/media/history/timeline-01.svg";
    var refs = asArray(milestone.references);

    var header = documentObj.createElement("header");
    header.className = "hc-history-card-head";
    header.innerHTML =
      '<span class="hc-history-year-pill">' +
      milestone.year_label +
      "</span>" +
      '<span class="hc-history-breakthrough">' +
      (milestone.breakthrough_type || "Breakthrough") +
      "</span>";

    var title = documentObj.createElement("h3");
    title.textContent = milestone.title;

    var summary = documentObj.createElement("p");
    summary.className = "hc-history-summary";
    summary.textContent = milestone.summary || "";

    if (refs.length) {
      summary.appendChild(documentObj.createTextNode(" "));
      var supWrap = documentObj.createElement("span");
      supWrap.className = "hc-history-sup-wrap";
      refs.forEach(function (ref, refIndex) {
        var sup = documentObj.createElement("a");
        sup.className = "hc-history-sup";
        sup.href = "#hc-ref-" + ref.reference_id;
        sup.textContent = "[" + String(refIndex + 1) + "]";
        sup.setAttribute("data-hc-ref-id", ref.reference_id || "");
        sup.setAttribute("data-hc-ref-milestone", milestone.id || "");
        supWrap.appendChild(sup);
      });
      summary.appendChild(supWrap);
    }

    var media = documentObj.createElement("figure");
    media.className = "hc-history-media";
    media.innerHTML =
      '<img src="' +
      escapeAttr(imageSrc) +
      '" alt="' +
      escapeAttr(milestone.title) +
      ' visual" width="960" height="560" loading="' +
      (index < 2 ? "eager" : "lazy") +
      '" decoding="async" />';

    var use = documentObj.createElement("p");
    use.className = "hc-history-current-use";
    use.innerHTML = "<strong>Current Use:</strong> " + (milestone.current_use_snapshot || "");

    var meta = documentObj.createElement("div");
    meta.className = "hc-history-meta";
    meta.innerHTML =
      '<span class="hc-pill">' +
      (milestone.material_family || "Carbon nanomaterials") +
      "</span>" +
      '<span class="hc-pill">Milestone ' +
      String(index + 1) +
      "</span>" +
      '<span class="hc-pill hc-history-pill-confidence">' +
      confidenceLabel(milestone.confidence_level) +
      " confidence</span>" +
      '<span class="hc-pill hc-history-pill-deployment">' +
      deploymentLabel(milestone.deployment_level) +
      " stage</span>";

    asArray(milestone.impact_tags).slice(0, 2).forEach(function (tag) {
      var span = documentObj.createElement("span");
      span.className = "hc-pill hc-history-pill-tag";
      span.textContent = String(tag).replace(/_/g, " ");
      meta.appendChild(span);
    });

    article.appendChild(header);
    article.appendChild(title);
    article.appendChild(summary);
    article.appendChild(media);
    article.appendChild(use);
    article.appendChild(meta);
    return article;
  }

  function buildMarker(milestone, index) {
    var item = documentObj.createElement("li");
    item.className = "hc-history-marker";
    item.setAttribute("data-marker-index", String(index));
    item.innerHTML =
      '<a href="#hc-history-' +
      milestone.id +
      '" class="hc-history-marker-link">' +
      '<span class="hc-history-marker-dot" aria-hidden="true"></span>' +
      '<span class="hc-history-marker-label">' +
      milestone.year_label +
      "</span>" +
      "</a>";
    return item;
  }

  function renderReferenceGroup(milestone) {
    var refs = asArray(milestone.references);
    if (!refs.length) return null;

    var group = documentObj.createElement("article");
    group.className = "hc-history-ref-group hc-card hc-reveal";
    group.id = "hc-ref-group-" + milestone.id;

    var head = documentObj.createElement("h3");
    head.textContent = milestone.year_label + " - " + milestone.title;
    group.appendChild(head);

    var list = documentObj.createElement("ol");
    list.className = "hc-history-ref-list";

    refs.forEach(function (ref) {
      var li = documentObj.createElement("li");
      li.id = "hc-ref-" + ref.reference_id;

      var link = documentObj.createElement("a");
      link.href = ref.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = ref.title;
      link.setAttribute("data-hc-ref-id", ref.reference_id || "");
      link.setAttribute("data-hc-ref-milestone", milestone.id || "");
      link.setAttribute("data-hc-ref-domain", toSlug(ref.url).split("_")[0] || "external");

      var meta = documentObj.createElement("span");
      meta.className = "hc-history-ref-meta";
      meta.textContent =
        (ref.source_type || "source") +
        " | " +
        String(ref.publication_year || "n/a") +
        " | accessed " +
        String(ref.accessed_on || "n/a");

      li.appendChild(link);
      li.appendChild(meta);
      list.appendChild(li);
    });

    group.appendChild(list);
    return group;
  }

  function renderFactReferenceGroup(facts) {
    if (!facts.length) return null;

    var group = documentObj.createElement("article");
    group.className = "hc-history-ref-group hc-card hc-reveal";
    group.id = "hc-ref-group-facts";

    var head = documentObj.createElement("h3");
    head.textContent = "Wonder Facts - Reference Pack";
    group.appendChild(head);

    var list = documentObj.createElement("ol");
    list.className = "hc-history-ref-list";

    facts.forEach(function (fact) {
      asArray(fact.references).forEach(function (ref, index) {
        var li = documentObj.createElement("li");
        li.id = factReferenceAnchor(fact.fact_id, index);

        var label = documentObj.createElement("strong");
        label.textContent = fact.title + ": ";

        var link = documentObj.createElement("a");
        link.href = ref.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = ref.title;
        link.setAttribute("data-hc-ref-id", ref.reference_id || "");
        link.setAttribute("data-hc-ref-milestone", fact.fact_id || "history_fact");
        link.setAttribute("data-hc-ref-domain", toSlug(ref.url).split("_")[0] || "external");

        var meta = documentObj.createElement("span");
        meta.className = "hc-history-ref-meta";
        meta.textContent =
          (ref.source_type || "source") +
          " | " +
          String(ref.publication_year || "n/a") +
          " | accessed " +
          String(ref.accessed_on || "n/a");

        li.appendChild(label);
        li.appendChild(link);
        li.appendChild(meta);
        list.appendChild(li);
      });
    });

    group.appendChild(list);
    return group;
  }

  function renderGapReferenceGroup(gaps) {
    if (!gaps.length) return null;

    var group = documentObj.createElement("article");
    group.className = "hc-history-ref-group hc-card hc-reveal";
    group.id = "hc-ref-group-gaps";

    var head = documentObj.createElement("h3");
    head.textContent = "Adoption Gap - Reference Pack";
    group.appendChild(head);

    var list = documentObj.createElement("ol");
    list.className = "hc-history-ref-list";

    gaps.forEach(function (gap) {
      asArray(gap.references).forEach(function (ref, index) {
        var li = documentObj.createElement("li");
        li.id = gapReferenceAnchor(gap.gap_id, index);

        var label = documentObj.createElement("strong");
        label.textContent = gap.title + ": ";

        var link = documentObj.createElement("a");
        link.href = ref.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = ref.title;
        link.setAttribute("data-hc-ref-id", ref.reference_id || "");
        link.setAttribute("data-hc-ref-milestone", gap.gap_id || "history_gap");
        link.setAttribute("data-hc-ref-domain", toSlug(ref.url).split("_")[0] || "external");

        var meta = documentObj.createElement("span");
        meta.className = "hc-history-ref-meta";
        meta.textContent =
          (ref.source_type || "source") +
          " | " +
          String(ref.publication_year || "n/a") +
          " | accessed " +
          String(ref.accessed_on || "n/a");

        li.appendChild(label);
        li.appendChild(link);
        li.appendChild(meta);
        list.appendChild(li);
      });
    });

    group.appendChild(list);
    return group;
  }

  function buildFactCard(fact) {
    var card = documentObj.createElement("article");
    card.className = "hc-card hc-history-fact-card hc-reveal";
    card.setAttribute("data-hc-fact-id", fact.fact_id);
    card.setAttribute("data-hc-fact-material", fact.material_family || "advanced_carbon");
    card.setAttribute("data-hc-fact-confidence", fact.confidence_level || "strong");

    var refs = asArray(fact.references);

    var label = documentObj.createElement("span");
    label.className = "hc-kicker";
    label.textContent = "Wonder Fact";

    var confidence = documentObj.createElement("span");
    confidence.className = "hc-history-confidence hc-history-confidence-" + (fact.confidence_level || "strong");
    confidence.textContent = confidenceLabel(fact.confidence_level) + " confidence";

    var title = documentObj.createElement("h3");
    title.textContent = fact.title;

    var statement = documentObj.createElement("p");
    statement.textContent = fact.statement;

    if (refs.length) {
      statement.appendChild(documentObj.createTextNode(" "));
      statement.appendChild(buildSupLinks(refs, factReferenceAnchor, fact.fact_id));
    }

    var meta = documentObj.createElement("div");
    meta.className = "hc-history-fact-meta";
    meta.innerHTML = '<span class="hc-pill">' + (fact.material_family || "Advanced carbon") + "</span>";

    card.appendChild(label);
    card.appendChild(confidence);
    card.appendChild(title);
    card.appendChild(statement);
    card.appendChild(meta);
    return card;
  }

  function buildGapCard(gap) {
    var card = documentObj.createElement("article");
    card.className = "hc-card hc-history-gap-card hc-reveal";
    card.setAttribute("data-hc-gap-id", gap.gap_id);

    var title = documentObj.createElement("h3");
    title.textContent = gap.title;

    var summary = documentObj.createElement("p");
    summary.textContent = gap.summary;

    var meta = documentObj.createElement("div");
    meta.className = "hc-history-gap-meta";
    meta.innerHTML = '<span class="hc-pill">' + String(gap.constraint_type || "adoption") + "</span>";

    var refs = asArray(gap.references);
    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(meta);

    if (refs.length) {
      var linkWrap = documentObj.createElement("p");
      linkWrap.className = "hc-history-gap-link";
      var link = documentObj.createElement("a");
      link.className = "hc-link-inline";
      link.href = "#" + gapReferenceAnchor(gap.gap_id, 0);
      link.textContent = "View evidence [1]";
      link.setAttribute("data-hc-gap-id", gap.gap_id || "unknown");
      link.setAttribute("data-hc-gap-link", "true");
      linkWrap.appendChild(link);
      card.appendChild(linkWrap);
    }

    return card;
  }

  function inEra(year, era) {
    var y = Number(year);
    return y >= Number(era.year_start) && y <= Number(era.year_end);
  }

  function buildEraCard(era, milestones, maxCount) {
    var count = milestones.filter(function (milestone) {
      return inEra(milestone.year_start, era);
    }).length;

    var card = documentObj.createElement("article");
    card.className = "hc-history-era-card hc-reveal";
    card.setAttribute("data-hc-era-id", era.id);
    card.setAttribute("data-hc-era-count", String(count));

    var fillPercent = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

    card.innerHTML =
      '<div class="hc-history-era-head">' +
      '<span class="hc-history-era-label">' +
      era.label +
      "</span>" +
      '<h3 class="hc-history-era-range">' +
      era.year_range +
      "</h3>" +
      "</div>" +
      '<p class="hc-history-era-thesis">' +
      era.thesis +
      "</p>" +
      '<div class="hc-history-era-track" aria-hidden="true"><span style="height:' +
      String(Math.max(fillPercent, 8)) +
      '%"></span></div>' +
      '<div class="hc-history-era-meta">' +
      '<span class="hc-pill">' +
      String(count) +
      " milestones</span>" +
      '<span class="hc-pill hc-history-pill-confidence">' +
      confidenceLabel(era.confidence_level) +
      " evidence</span>" +
      "</div>";

    return card;
  }

  function initDynamicReveals(nodes) {
    if (!nodes || !nodes.length) return;

    if (!("IntersectionObserver" in windowObj)) {
      nodes.forEach(function (node) {
        node.classList.add("in-view");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initHistoryPage() {
    var page = documentObj.querySelector("[data-hc-history-page]");
    if (!page) return;

    var listRoot = documentObj.getElementById("hc-history-list");
    var markerRoot = documentObj.getElementById("hc-history-markers");
    var referencesRoot = documentObj.getElementById("hc-history-references");
    var activeYearNode = documentObj.getElementById("hc-history-active-year");
    var progressNode = documentObj.getElementById("hc-history-progress");
    var growthRoot = documentObj.getElementById("hc-history-growth-bars");
    var factsRoot = documentObj.getElementById("hc-history-facts");
    var gapsRoot = documentObj.getElementById("hc-history-gaps");
    if (!listRoot || !markerRoot || !referencesRoot || !activeYearNode || !progressNode) return;

    var milestones = safeMilestones(windowObj.HEXCARB_HISTORY_DATA).sort(function (a, b) {
      return Number(a.year_start || 0) - Number(b.year_start || 0);
    });
    var eras = safeEras(windowObj.HEXCARB_HISTORY_ERAS);
    var facts = safeFacts(windowObj.HEXCARB_HISTORY_FACTS);
    var gaps = safeGaps(windowObj.HEXCARB_HISTORY_ADOPTION_GAPS);
    if (!milestones.length) return;

    listRoot.innerHTML = "";
    markerRoot.innerHTML = "";
    referencesRoot.innerHTML = "";
    if (growthRoot) growthRoot.innerHTML = "";
    if (factsRoot) factsRoot.innerHTML = "";
    if (gapsRoot) gapsRoot.innerHTML = "";

    milestones.forEach(function (milestone, index) {
      listRoot.appendChild(buildMilestoneCard(milestone, index));
      markerRoot.appendChild(buildMarker(milestone, index));
      var refGroup = renderReferenceGroup(milestone);
      if (refGroup) referencesRoot.appendChild(refGroup);
    });

    if (factsRoot) {
      facts.forEach(function (fact) {
        factsRoot.appendChild(buildFactCard(fact));
      });
    }

    if (gapsRoot) {
      gaps.forEach(function (gap) {
        gapsRoot.appendChild(buildGapCard(gap));
      });
    }

    var factRefGroup = renderFactReferenceGroup(facts);
    if (factRefGroup) referencesRoot.appendChild(factRefGroup);
    var gapRefGroup = renderGapReferenceGroup(gaps);
    if (gapRefGroup) referencesRoot.appendChild(gapRefGroup);

    var maxEraCount = 0;
    eras.forEach(function (era) {
      var eraCount = milestones.filter(function (milestone) {
        return inEra(milestone.year_start, era);
      }).length;
      maxEraCount = Math.max(maxEraCount, eraCount);
    });

    if (growthRoot) {
      eras.forEach(function (era) {
        growthRoot.appendChild(buildEraCard(era, milestones, maxEraCount));
      });
    }

    initDynamicReveals(
      Array.prototype.slice
        .call(listRoot.querySelectorAll(".hc-reveal"))
        .concat(Array.prototype.slice.call(referencesRoot.querySelectorAll(".hc-reveal")))
        .concat(growthRoot ? Array.prototype.slice.call(growthRoot.querySelectorAll(".hc-reveal")) : [])
        .concat(factsRoot ? Array.prototype.slice.call(factsRoot.querySelectorAll(".hc-reveal")) : [])
        .concat(gapsRoot ? Array.prototype.slice.call(gapsRoot.querySelectorAll(".hc-reveal")) : [])
    );

    var cards = Array.prototype.slice.call(listRoot.querySelectorAll("[data-hc-history-id]"));
    var markers = Array.prototype.slice.call(markerRoot.querySelectorAll(".hc-history-marker"));
    var eraCards = growthRoot ? Array.prototype.slice.call(growthRoot.querySelectorAll("[data-hc-era-id]")) : [];
    var factCards = factsRoot ? Array.prototype.slice.call(factsRoot.querySelectorAll("[data-hc-fact-id]")) : [];

    var viewedMilestones = Object.create(null);
    var viewedEras = Object.create(null);
    var viewedFacts = Object.create(null);
    var activeIndex = 0;

    function setActiveEra(milestoneIndex) {
      if (!eras.length || !eraCards.length) return;

      var activeMilestone = milestones[milestoneIndex] || milestones[0];
      var activeYear = Number(activeMilestone.year_start || 0);
      var activeEra = null;

      eras.forEach(function (era, eraIndex) {
        var isActive = inEra(activeYear, era);
        if (isActive) activeEra = era;
        if (eraCards[eraIndex]) {
          eraCards[eraIndex].classList.toggle("is-active", isActive);
        }
      });

      if (activeEra && !viewedEras[activeEra.id]) {
        viewedEras[activeEra.id] = true;
        var count = milestones.filter(function (milestone) {
          return inEra(milestone.year_start, activeEra);
        }).length;
        track("hc_history_growth_view", {
          era_id: activeEra.id,
          active_year: activeMilestone.year_label || "unknown",
          milestone_count: count
        });
      }
    }

    function updateRail(index) {
      if (index < 0 || index >= milestones.length) return;
      activeIndex = index;
      var active = milestones[index];
      activeYearNode.textContent = active.year_label;
      var ratio = milestones.length > 1 ? index / (milestones.length - 1) : 1;
      progressNode.style.height = String(Math.max(6, ratio * 100)) + "%";

      markers.forEach(function (marker, markerIndex) {
        marker.classList.toggle("is-active", markerIndex === index);
      });

      setActiveEra(index);
    }

    function computeActiveIndex() {
      var targetY = windowObj.innerHeight * 0.33;
      var bestIndex = 0;
      var bestDistance = Infinity;

      cards.forEach(function (card, index) {
        var rect = card.getBoundingClientRect();
        var center = rect.top + rect.height * 0.32;
        var distance = Math.abs(center - targetY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      if (bestIndex !== activeIndex) {
        updateRail(bestIndex);
      }
    }

    updateRail(0);

    if (!prefersReducedMotion()) {
      windowObj.addEventListener(
        "scroll",
        function () {
          computeActiveIndex();
          cards.forEach(function (card) {
            var media = card.querySelector(".hc-history-media img");
            if (!media) return;
            var rect = card.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > windowObj.innerHeight) return;
            var offset = (rect.top + rect.height * 0.5 - windowObj.innerHeight * 0.5) * -0.015;
            media.style.transform = "translateY(" + offset.toFixed(2) + "px) scale(1.02)";
          });
        },
        { passive: true }
      );
    }

    if ("IntersectionObserver" in windowObj) {
      var milestoneObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.getAttribute("data-hc-history-id");
            if (!id || viewedMilestones[id]) return;
            viewedMilestones[id] = true;

            track("hc_history_milestone_view", {
              milestone_id: id,
              year_label: entry.target.getAttribute("data-hc-history-year") || "unknown",
              material_family: entry.target.getAttribute("data-hc-history-material") || "unknown"
            });
          });
        },
        {
          threshold: 0.42
        }
      );

      cards.forEach(function (card) {
        milestoneObserver.observe(card);
      });

      var factObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var factId = entry.target.getAttribute("data-hc-fact-id") || "unknown";
            if (viewedFacts[factId]) return;
            viewedFacts[factId] = true;
            track("hc_history_fact_view", {
              fact_id: factId,
              material_family: entry.target.getAttribute("data-hc-fact-material") || "advanced_carbon",
              confidence_level: entry.target.getAttribute("data-hc-fact-confidence") || "strong"
            });
          });
        },
        {
          threshold: 0.45
        }
      );

      factCards.forEach(function (card) {
        factObserver.observe(card);
      });
    }

    documentObj.querySelectorAll("[data-hc-ref-id]").forEach(function (node) {
      node.addEventListener("click", function () {
        var refId = node.getAttribute("data-hc-ref-id") || "unknown";
        var milestoneId = node.getAttribute("data-hc-ref-milestone") || "unknown";
        var href = node.getAttribute("href") || "";
        var sourceDomain = "internal";
        if (href.indexOf("http") === 0) {
          var domain = href.replace(/^https?:\/\//, "").split("/")[0];
          sourceDomain = domain || "external";
        }
        track("hc_history_reference_click", {
          reference_id: refId,
          source_domain: sourceDomain,
          milestone_id: milestoneId
        });
      });
    });

    documentObj.querySelectorAll("[data-hc-history-app]").forEach(function (node) {
      node.addEventListener("click", function () {
        track("hc_history_application_click", {
          application_slug: node.getAttribute("data-hc-history-app") || "general",
          industry: node.getAttribute("data-hc-history-industry") || "other",
          source_section: node.getAttribute("data-hc-history-source") || "history_page"
        });
      });
    });

    documentObj.querySelectorAll("[data-hc-history-quote]").forEach(function (node) {
      node.addEventListener("click", function () {
        track("hc_history_quote_click", {
          source_section: node.getAttribute("data-hc-history-source") || "history_page",
          intent_stage: node.getAttribute("data-intent-stage") || "evaluate",
          material_family: node.getAttribute("data-material-family") || "advanced_carbon"
        });
      });
    });

    documentObj.querySelectorAll("[data-hc-gap-link]").forEach(function (node) {
      node.addEventListener("click", function () {
        track("hc_history_gap_click", {
          gap_id: node.getAttribute("data-hc-gap-id") || "unknown",
          source_section: "adoption_gap"
        });
      });
    });
  }

  documentObj.addEventListener("DOMContentLoaded", initHistoryPage);
})(window, document);
