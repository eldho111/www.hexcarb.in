/* Runtime config loaded before hexcarb-ui.js */
(function (windowObj, documentObj) {
  "use strict";

  var meta = documentObj.querySelector('meta[name="hc-ga4-id"]');
  var gaFromMeta = meta && meta.content ? meta.content.trim() : "";
  var gaFromGlobal = typeof windowObj.HEXCARB_GA4_ID === "string" ? windowObj.HEXCARB_GA4_ID.trim() : "";
  var zohoPayFromGlobal = typeof windowObj.HEXCARB_ZOHO_PAY_URL === "string" ? windowObj.HEXCARB_ZOHO_PAY_URL.trim() : "";
  // Set Zoho checkout URL here when available (example: "https://pay.zoho.in/...").
  var zohoPayConfigured = "";

  windowObj.HEXCARB_GA4_ID = gaFromGlobal || gaFromMeta || "";
  windowObj.HEXCARB_ZOHO_PAY_URL = zohoPayFromGlobal || zohoPayConfigured;
})(window, document);
