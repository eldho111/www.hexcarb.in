/* Runtime config loaded before hexcarb-ui.js */
(function (windowObj, documentObj) {
  "use strict";

  var meta = documentObj.querySelector('meta[name="hc-ga4-id"]');
  var gaFromMeta = meta && meta.content ? meta.content.trim() : "";
  var gaFromGlobal = typeof windowObj.HEXCARB_GA4_ID === "string" ? windowObj.HEXCARB_GA4_ID.trim() : "";

  windowObj.HEXCARB_GA4_ID = gaFromGlobal || gaFromMeta || "";
})(window, document);
