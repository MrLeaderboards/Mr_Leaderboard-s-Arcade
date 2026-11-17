/* ==========================================================
   Mr Leaderboard's Arcade - cookie / ad consent
   ----------------------------------------------------------
   Ads (Monetag) are NOT loaded until the visitor presses
   ACCEPT. DENY keeps the page ad-free. The choice is saved
   in this browser only (localStorage key "mla_consent").

   Each page lists its own ad scripts before loading this file:
     <script>window.MLA_ADS = [ { src: "...", attrs: {...} } ];</script>
     <script src="consent.js" defer></script>

   Any link with data-cookie-settings re-opens the banner.
   ========================================================== */
(function () {
  'use strict';

  var KEY = 'mla_consent';
  var VERSION = 1; // bump to ask everyone again (e.g. new ad partner)
  var loaded = false;

  function readChoice() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && data.v === VERSION ? data.choice : null;
    } catch (e) { return null; }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, choice: choice, at: new Date().toISOString() }));
    } catch (e) { /* storage blocked - banner will simply show again next visit */ }
  }

  function loadAds() {
    if (loaded) return;
    loaded = true;
    var ads = window.MLA_ADS || [];
    ads.forEach(function (ad) {
      var s = document.createElement('script');
      s.src = ad.src;
      s.async = true;
      var attrs = ad.attrs || {};
      Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
      document.head.appendChild(s);
    });
  }

  function removeAdWorkers() {
    // Drop any ad push-notification service worker set up after an earlier "accept".
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister(); });
      }).catch(function () {});
    }
  }

  /* ---------- banner ---------- */
  var css = [
    '#mla-consent{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;',
    'width:min(640px,calc(100% - 32px));background:#0a0a12;color:#fff;border:3px solid #00ffff;',
    'box-shadow:0 0 0 3px #000,0 0 24px rgba(255,0,255,.55);padding:18px 18px 16px;',
    "font-family:'Press Start 2P',ui-monospace,Menlo,Consolas,monospace;font-size:10px;line-height:1.8;text-align:left}",
    '#mla-consent h2{font-size:12px;color:#ffff00;margin:0 0 10px;font-weight:normal;letter-spacing:.5px}',
    '#mla-consent p{margin:0 0 14px;color:#e8e8f0}',
    '#mla-consent a{color:#00ffff;text-decoration:underline}',
    '#mla-consent a:hover{color:#ffff00}',
    '#mla-consent .mla-row{display:flex;gap:12px;flex-wrap:wrap}',
    '#mla-consent button{flex:1 1 140px;font:inherit;font-size:11px;padding:12px 10px;cursor:pointer;',
    'border:3px solid #fff;background:#000;color:#fff;text-transform:uppercase;letter-spacing:1px}',
    '#mla-consent button:hover,#mla-consent button:focus-visible{background:#ff00ff;border-color:#ff00ff;outline:none}',
    '#mla-consent button.mla-accept:hover,#mla-consent button.mla-accept:focus-visible{background:#00ff66;border-color:#00ff66;color:#000}',
    '@media (max-width:480px){#mla-consent{bottom:8px;padding:14px 12px 12px;font-size:9px}}'
  ].join('');

  var banner = null;

  function openBanner() {
    if (banner) { banner.style.display = 'block'; return; }
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    banner = document.createElement('div');
    banner.id = 'mla-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie and ad consent');
    banner.innerHTML =
      '<h2>&gt; COOKIES &amp; ADS</h2>' +
      '<p>This arcade is kept free by ads from Monetag, a third-party ad network. ' +
      'If you accept, Monetag may use cookies, local storage and device identifiers to show ads and measure them. ' +
      'If you deny, no ads or ad cookies are loaded. You can change your mind any time via ' +
      '"Cookie settings". <a href="privacy-policy.html">Privacy Policy</a></p>' +
      '<div class="mla-row">' +
      '<button type="button" class="mla-deny">Deny</button>' +
      '<button type="button" class="mla-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector('.mla-accept').addEventListener('click', function () {
      saveChoice('granted');
      banner.style.display = 'none';
      loadAds();
    });
    banner.querySelector('.mla-deny').addEventListener('click', function () {
      var wasLoaded = loaded;
      saveChoice('denied');
      banner.style.display = 'none';
      removeAdWorkers();
      if (wasLoaded) location.reload(); // unload ads that already ran on this page
    });
  }

  function init() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); openBanner(); }
    });

    var choice = readChoice();
    if (choice === 'granted') loadAds();
    else if (choice === 'denied') removeAdWorkers();
    else openBanner();
  }

  window.MLAConsent = { open: openBanner };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
