/* =========================================================
   추적 코드 로더 — config.js 의 tracking 값이 채워져 있을 때만 작동합니다.
   (GTM이 있으면 GTM만, 없으면 GA4 직접. 메타 픽셀은 ID가 있으면 추가.)
   ========================================================= */
(function () {
  var T = (window.SITE && window.SITE.tracking) || {};
  function addMeta(name, content) { var m = document.createElement("meta"); m.name = name; m.content = content; document.head.appendChild(m); }
  if (T.NAVER_SITE_VERIFY) addMeta("naver-site-verification", T.NAVER_SITE_VERIFY);
  if (T.GOOGLE_SITE_VERIFY) addMeta("google-site-verification", T.GOOGLE_SITE_VERIFY);

  if (T.GTM_ID) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var g = document.createElement("script"); g.async = true;
    g.src = "https://www.googletagmanager.com/gtm.js?id=" + T.GTM_ID;
    document.head.appendChild(g);
  } else if (T.GA4_ID) {
    var a = document.createElement("script"); a.async = true;
    a.src = "https://www.googletagmanager.com/gtag/js?id=" + T.GA4_ID;
    document.head.appendChild(a);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", T.GA4_ID);
  }

  if (T.META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", T.META_PIXEL_ID); fbq("track", "PageView");
  }
})();
