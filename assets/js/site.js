/* =========================================================
   캠톡메이트 공통 스크립트 (홈페이지 + 랜딩페이지 공용)
   페이지에 해당 요소(id)가 있을 때만 각 기능이 켜집니다.
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return Math.round(n).toLocaleString("ko-KR"); };
  var man = function (n) { var m = Math.round(n / 10000); return m.toLocaleString("ko-KR"); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var get = function (path) { return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, S); };
  var IO = "IntersectionObserver" in window;
  if (IO && !reduce) document.documentElement.classList.add("js");

  /* 숫자를 부드럽게 바꾸는 공용 함수 */
  function tween(el, to, fmt, dur) {
    if (!el) return;
    fmt = fmt || won; dur = dur || 900;
    var from = parseFloat(el.getAttribute("data-cur") || "0");
    el.setAttribute("data-cur", to);
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var t0 = performance.now();
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- 아이콘 스프라이트 (모든 페이지 공용) ---------- */
  var sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    '<symbol id="i-kakao" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.7c-.1.4.3.6.6.4l4.4-2.9c.4 0 .9.1 1.3.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></symbol>' +
    '<symbol id="i-line" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5C6.2 2.5 1.5 6.3 1.5 11c0 4.2 3.7 7.7 8.8 8.4.3.1.8.2.9.5.1.3.1.7 0 1l-.2.9c0 .3-.2 1 .9.6 1.1-.5 6-3.5 8.2-6.1 1.5-1.6 2.3-3.4 2.3-5.3 0-4.7-4.7-8.5-10.4-8.5z"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.2 4.2L19 7"/></symbol>' +
    '<symbol id="i-check-c" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".16"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7.5 12.3l3 3 6-6.3"/></symbol>' +
    '<symbol id="i-x-c" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".16"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></symbol>' +
    '<symbol id="i-alert" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 3.5L2.5 20h19L12 3.5zM12 10v4.5M12 17.5v.1"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M12 5v14M5 12h14"/></symbol>' +
    '<symbol id="i-menu" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></symbol>' +
    '<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4" fill="currentColor"/><path fill="currentColor" d="M4 20c.8-4 4-6 8-6s7.2 2 8 6z"/></symbol>' +
    '<symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></symbol>' +
    '<symbol id="i-end" viewBox="0 0 24 24"><path fill="currentColor" d="M3 14.2c4.9-4.3 13.1-4.3 18 0l-2.3 2.6-3.6-1.4-.4-2.6c-2.4-.8-5-.8-7.4 0l-.4 2.6-3.6 1.4z"/></symbol>' +
    '<symbol id="i-cam" viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="3" fill="currentColor"/><path fill="currentColor" d="M16.5 10.5l5-3v9l-5-3z"/></symbol>' +
    '<symbol id="i-gift" viewBox="0 0 24 24"><path fill="currentColor" d="M4 10h16v3H4zM5 13h6v8H5zM13 13h6v8h-6zM11 10h2v11h-2zM12 9C10 5 6.5 5 6.5 7.3 6.5 9 9 9 12 9zm0 0c2-4 5.5-4 5.5-1.7C17.5 9 15 9 12 9z"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z" opacity=".2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z"/></symbol>' +
    '<symbol id="i-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".18"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M8 9l2 6 2-5 2 5 2-6M7.5 12h9"/></symbol>' +
    '<symbol id="i-wallet" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="3" fill="currentColor" opacity=".18"/><rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l9-3 1.5 3M15 12.5h3"/></symbol>' +
    '<symbol id="i-bolt" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 2L4.5 13.5h6L9.5 22l10-12.5h-6.2z"/></symbol>' +
    '<symbol id="i-zero" viewBox="0 0 24 24"><path fill="currentColor" opacity=".18" d="M12 2.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 21.5l-2.6-1.9-3.2.1-1-3L2.6 14.8l1-3-1-3 2.6-1.9 1-3 3.2.1z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 2.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 21.5l-2.6-1.9-3.2.1-1-3L2.6 14.8l1-3-1-3 2.6-1.9 1-3 3.2.1z"/><ellipse cx="12" cy="12" rx="2.6" ry="3.6" fill="none" stroke="currentColor" stroke-width="2"/></symbol>' +
    '<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".18"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></symbol>' +
    '<symbol id="i-book" viewBox="0 0 24 24"><path fill="currentColor" opacity=".18" d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z"/></symbol>' +
    '<symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></symbol>' +
    '<symbol id="i-telegram" viewBox="0 0 24 24"><path fill="currentColor" d="M21.5 3.6 2.9 10.8c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5zM8.6 13.4l9.6-6.1c.5-.3.9-.1.5.2l-7.9 7.2-.3 3.3-1.9-4.6z"/></symbol>' +
    '<symbol id="i-tel" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 3h3l1.6 4.2-2 1.3a12 12 0 0 0 6.3 6.3l1.3-2 4.2 1.6v3c0 1-.8 1.8-1.8 1.8C10 19.2 4.8 14 4.8 4.8 4.8 3.8 5.6 3 6.6 3z"/></symbol>' +
    '</svg>';
  document.body.insertAdjacentHTML("afterbegin", sprite);

  /* ---------- 연락처·회사정보 바인딩 ---------- */
  $$("[data-href]").forEach(function (a) {
    var key = a.getAttribute("data-href");
    var url = key === "kakao" ? get("contact.kakaoUrl") : key === "line" ? get("contact.lineUrl") : key === "telegram" ? get("contact.telegramUrl") : key === "invite" ? get("contact.inviteUrl") : key === "tel" ? (get("contact.phone") ? "tel:" + get("contact.phone").replace(/[^0-9]/g, "") : "") : "";
    if (!url) { a.hidden = true; return; }
    a.href = url;
    if (/^https?:/.test(url)) { a.target = "_blank"; a.rel = "noopener"; }
  });
  /* ---------- 상담 채널 선택창 ---------- */
  (function () {
    var chans = [
      { key: "kakao", name: "카카오톡", url: get("contact.kakaoUrl"), id: get("contact.kakaoId"), icon: "i-kakao", note: "가장 빨라요" },
      { key: "line", name: "라인", url: get("contact.lineUrl"), id: get("contact.lineId"), icon: "i-line", note: "" },
      { key: "telegram", name: "텔레그램", url: get("contact.telegramUrl"), id: get("contact.telegramId"), icon: "i-telegram", note: "" }
    ].filter(function (c) { return c.url; });
    var btns = $$("[data-consult]");
    if (!btns.length) return;
    // 채널별 아이콘: 링크 없는 채널은 버튼의 작은 아이콘도 숨김
    btns.forEach(function (b) {
      var keys = chans.map(function (c) { return c.key; });
      $$(".chs i", b).forEach(function (i) {
        var k = i.className.indexOf("chs-k") >= 0 ? "kakao" : i.className.indexOf("chs-l") >= 0 ? "line" : "telegram";
        if (keys.indexOf(k) < 0) i.remove();
      });
    });
    if (!chans.length) { btns.forEach(function (b) { b.hidden = true; }); return; }
    if (chans.length === 1) { // 채널이 하나면 바로 연결
      btns.forEach(function (b) { b.href = chans[0].url; b.target = "_blank"; b.rel = "noopener"; b.setAttribute("data-href", chans[0].key); });
      return;
    }
    var sheet = document.createElement("div");
    sheet.className = "consult"; sheet.hidden = true; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "상담 채널 선택");
    sheet.innerHTML = '<div class="consult-bg"></div><div class="consult-box"><div class="consult-head"><b>어디로 상담할까요?</b><button type="button" class="consult-x" aria-label="닫기">×</button></div><p>편한 메신저를 고르세요. 어떤 질문이든 괜찮아요.</p><div class="consult-list">' +
      chans.map(function (c) {
        return '<a class="chan chan--' + c.key + '" href="' + c.url + '" target="_blank" rel="noopener" data-track="' + c.key + '"><svg><use href="#' + c.icon + '"/></svg><span><b>' + c.name + '</b>' + (c.id ? '<small>ID ' + c.id + '</small>' : (c.note ? '<small>' + c.note + '</small>' : '')) + '</span><i>›</i></a>';
      }).join("") + '</div></div>';
    document.body.appendChild(sheet);
    function open() { sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add("is-open"); }); }
    function close() { sheet.classList.remove("is-open"); setTimeout(function () { sheet.hidden = true; }, 220); }
    btns.forEach(function (b) { b.href = "#consult"; b.addEventListener("click", function (e) { e.preventDefault(); open(); try { if (window.gtag) gtag("event", "open_consult"); } catch (x) {} }); });
    sheet.querySelector(".consult-bg").addEventListener("click", close);
    sheet.querySelector(".consult-x").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) close(); });
    $$("[data-track]", sheet).forEach(function (a) { a.addEventListener("click", function () { try { if (window.gtag) gtag("event", "click_" + a.getAttribute("data-track"), { label: "consult" }); if (window.fbq) fbq("trackCustom", "click_" + a.getAttribute("data-track")); } catch (x) {} setTimeout(close, 150); }); });
  })();

  $$("[data-text]").forEach(function (el) {
    var v = get(el.getAttribute("data-text"));
    if (v === undefined || v === null || v === "") { var row = el.closest("[data-optional]"); if (row) row.hidden = true; return; }
    el.textContent = typeof v === "number" ? won(v) : v;
  });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- 토스트 / 복사 ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function selectText(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }
  function copy(text, fallbackEl) {
    try {
      navigator.clipboard.writeText(text).then(function () { toast("복사했어요"); }, function () { if (fallbackEl) selectText(fallbackEl); toast("선택된 내용을 길게 눌러 복사해 주세요"); });
    } catch (e) { if (fallbackEl) selectText(fallbackEl); toast("선택된 내용을 길게 눌러 복사해 주세요"); }
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var v = get(b.getAttribute("data-copy")) || "";
      copy(String(v), b.parentElement && b.parentElement.querySelector("em, b"));
    });
  });

  /* ---------- 헤더 ---------- */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    var mb = $(".menu-btn"), nav = $(".nav");
    if (mb && nav) {
      mb.addEventListener("click", function () { var o = nav.classList.toggle("is-open"); mb.setAttribute("aria-expanded", o); });
      $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("is-open"); mb.setAttribute("aria-expanded", "false"); }); });
    }
  }

  var R = S.rates || { perMinute: 900, callRatio: .7, giftPerHour: 10000, weeksPerMonth: 4.33, minWage: 10320 };

  /* ---------- 히어로: 실시간 통화 화면 ---------- */
  var psTimer = $("#psTimer"), psEarn = $("#psEarn"), psScreen = $("#psScreen");
  if (psTimer && psEarn) {
    var sec = 754, earn = sec * R.perMinute / 60, gifts = [1000, 2000, 3000, 5000];
    var draw = function () {
      var m = Math.floor(sec / 60), s = sec % 60;
      psTimer.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
      psEarn.textContent = won(earn);
      var tv = $("#tdVal"), tb = $("#tdBar");
      if (tv) { var today = 96000 + earn; tv.textContent = won(today) + "원"; if (tb) tb.style.width = Math.min(100, today / 2000) + "%"; }
    };
    draw();
    setInterval(function () {
      sec++; earn += R.perMinute / 60;
      if (sec % 9 === 0 && psScreen && !document.hidden) {
        var g = gifts[Math.floor(Math.random() * gifts.length)];
        earn += g;
        var pop = document.createElement("div");
        pop.className = "gift-pop";
        pop.innerHTML = '<svg width="14" height="14"><use href="#i-gift"/></svg>선물 <b>+' + won(g) + "</b>";
        psScreen.appendChild(pop);
        setTimeout(function () { pop.remove(); }, 2600);
      }
      draw();
    }, 1000);
  }

  /* ---------- 티커 ---------- */
  var track = $("#tickerTrack");
  if (track) {
    var items = [
      "1분 통화 <b>" + won(R.perMinute) + "원</b>",
      "1시간 통화 <b>" + won(R.perMinute * 60) + "원</b>",
      "가입비 · 관리비 <b>0원</b>",
      "출금 <b>" + won(R.minWithdraw) + "원</b>부터 당일 입금",
      "의무 시간 · 위약금 <b>없음</b>",
      "닉네임 활동 · 캡처 차단",
      "3.3% 원천징수 <b>에이전시 부담</b>"
    ];
    var html = items.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    track.innerHTML = html + html.replace(/<span>/g, '<span aria-hidden="true">');
  }

  /* ---------- 수익 계산기 ---------- */
  var calc = $("#calc");
  if (calc) {
    var st = { hours: 3, days: 5, x: 1, ratio: Math.round(R.callRatio * 100), gift: true };
    var hours = $("#cHours"), ratio = $("#cRatio"), giftCb = $("#cGift");
    var fill = function (el) { var p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty("--p", p + "%"); };
    var segs = function (wrapId, values, fmt, key) {
      var w = $(wrapId); if (!w) return;
      w.innerHTML = values.map(function (v) { return '<button type="button" data-v="' + v + '" aria-pressed="' + (v === st[key]) + '">' + fmt(v) + "</button>"; }).join("");
      w.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        st[key] = parseFloat(b.getAttribute("data-v"));
        $$("button", w).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        run();
      });
    };
    segs("#cDays", [1, 2, 3, 4, 5, 6, 7], function (v) { return v + "일"; }, "days");

    var run = function () {
      st.hours = parseFloat(hours.value); st.ratio = parseInt(ratio.value, 10); st.gift = giftCb.checked;
      $("#oHours").textContent = (st.hours % 1 ? st.hours.toFixed(1) : st.hours) + "시간";
      $("#oRatio").textContent = st.ratio + "%";
      fill(hours); fill(ratio);
      var callH = 60 * (st.ratio / 100) * R.perMinute * st.x;
      var giftH = st.gift ? R.giftPerHour : 0;
      var hourly = callH + giftH;
      var daily = hourly * st.hours, weekly = daily * st.days, monthly = weekly * R.weeksPerMonth;
      var minMonthly = R.minWage * st.hours * st.days * R.weeksPerMonth;
      $("#rMonthly").textContent = won(monthly);
      $("#rDaily").textContent = won(daily) + "원";
      $("#rWeekly").textContent = won(weekly) + "원";
      $("#rHourly").textContent = won(hourly) + "원";
      $("#rVs").textContent = (monthly / minMonthly).toFixed(1) + "배";
      $("#rFormula").innerHTML =
        "통화 <b>" + Math.round(60 * st.ratio / 100) + "분</b> × <b>" + won(R.perMinute) + "원</b>" +
        (st.gift ? " + 선물 <b>" + won(R.giftPerHour) + "원</b>" : "") + " = 시간당 <b>" + won(hourly) + "원</b><br>" +
        "× 하루 <b>" + st.hours + "시간</b> × 주 <b>" + st.days + "일</b> × <b>" + R.weeksPerMonth + "주</b> = 월 <b>" + won(monthly) + "원</b>";
    };
    [hours, ratio, giftCb].forEach(function (el) { el.addEventListener("input", run); el.addEventListener("change", run); });
    run();
  }

  /* ---------- 후기 ---------- */
  var grid = $("#rvGrid");
  if (grid && window.REVIEWS) {
    var all = window.REVIEWS, filter = "전체", expanded = false, LIMIT = parseInt(grid.getAttribute("data-limit") || "6", 10);
    if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) LIMIT = 99;
    var colors = ["#E0457B", "#B0418F", "#E86A4F", "#7A4FC9", "#D2345A", "#3F8F7A"];
    var chipWrap = $("#rvChips"), moreBtn = $("#rvMore");
    var tags = ["전체", "부업", "대학생", "전업"];
    if (chipWrap) {
      chipWrap.innerHTML = tags.map(function (t) {
        var c = t === "전체" ? all.length : all.filter(function (r) { return r.tag === t; }).length;
        return '<button type="button" aria-pressed="' + (t === filter) + '" data-t="' + t + '">' + (t === "부업" ? "직장인 부업" : t) + "<span>" + c + "</span></button>";
      }).join("");
      chipWrap.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        filter = b.getAttribute("data-t"); expanded = false;
        $$("button", chipWrap).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        render();
      });
    }
    var card = function (r, i) {
      var badge = r.verified ? '<span class="tag tag--ok"><svg><use href="#i-check"/></svg>정산 확인</span>' : "";
      var sample = r.sample ? '<span class="tag tag--sample" title="실제 후기로 교체 전 예시입니다">예시</span>' : "";
      return '<article class="rv">' +
        '<div class="rv-top"><span class="rv-ava" style="background:' + colors[i % colors.length] + '">' + r.name.charAt(0) + "</span>" +
        '<div class="rv-who"><b>' + r.name + " 님</b><span>" + r.age + " · " + r.job + "</span></div>" +
        '<div class="rv-tags">' + badge + sample + "</div></div>" +
        '<div class="rv-money"><div class="lbl"><span>월 평균 수익</span><span>' + r.schedule + "</span></div>" +
        '<div class="amt">' + man(r.monthly) + "<small>만원</small></div></div>" +
        "<h3>" + r.title + "</h3><p>" + r.quote + "</p>" +
        '<div class="rv-meta"><span>' + r.period + "</span></div></article>";
    };
    var render = function () {
      var list = filter === "전체" ? all : all.filter(function (r) { return r.tag === filter; });
      var shown = expanded ? list : list.slice(0, LIMIT);
      grid.innerHTML = shown.map(function (r) { return card(r, all.indexOf(r)); }).join("");
      if (moreBtn) { moreBtn.hidden = expanded || list.length <= LIMIT; moreBtn.textContent = "후기 " + Math.max(0, list.length - LIMIT) + "개 더 보기"; }
    };
    if (moreBtn) moreBtn.addEventListener("click", function () { expanded = true; render(); });
    render();
  }

  /* ---------- 언론 보도 ---------- */
  var press = $("#pressList");
  if (press && window.PRESS) {
    press.innerHTML = window.PRESS.map(function (n) {
      return '<li><a href="' + n.url + '" target="_blank" rel="noopener"><span class="press-meta"><b>' + n.outlet + '</b><span class="num">' + n.date + '</span></span><span class="press-title">' + n.title + '</span><span class="press-go" aria-hidden="true">원문 보기 →</span></a></li>';
    }).join("");
  }

  /* ---------- FAQ ---------- */
  var faq = $("#faqList");
  if (faq && window.FAQ) {
    faq.innerHTML = window.FAQ.map(function (f, i) {
      return "<details" + (i === 0 ? " open" : "") + "><summary>" + f.q + '<i aria-hidden="true"><svg><use href="#i-plus"/></svg></i></summary><div class="ans">' + f.a + "</div></details>";
    }).join("");
  }

  /* ---------- 히어로 큰 금액 ---------- */
  var hm = $("#heroMoney");
  if (hm && !reduce) {
    hm.setAttribute("data-cur", "0"); hm.textContent = "0";
    var hw = $("#heroMoneyWrap"); if (hw) hw.classList.add("pop");
    setTimeout(function () { tween(hm, 54000, null, 1700); }, 250);
  }

  /* ---------- 히어로 미니 계산기 ---------- */
  var heIn = $("#heIn");
  if (heIn) {
    var heRun = function () {
      var h = parseFloat(heIn.value);
      heIn.style.setProperty("--p", ((h - heIn.min) / (heIn.max - heIn.min) * 100) + "%");
      $("#heH").textContent = h + "시간";
      var hourly = 60 * R.callRatio * R.perMinute + R.giftPerHour;
      tween($("#heOut"), Math.round(hourly * h * 5 * R.weeksPerMonth / 10000), function (v) { return Math.round(v).toLocaleString("ko-KR"); }, 500);
    };
    heIn.addEventListener("input", heRun); heRun();
  }

  /* ---------- 후기 말풍선 띠 ---------- */
  var mq = $("#rvMarquee");
  if (mq && window.REVIEWS) {
    var b = function (r) { return '<div class="bubble"><p>' + r.quote + '</p><span>' + r.name + " 님 · " + r.job + "<b>월 " + man(r.monthly) + "만</b></span></div>"; };
    var half = Math.ceil(window.REVIEWS.length / 2);
    [window.REVIEWS.slice(0, half), window.REVIEWS.slice(half)].forEach(function (list, i) {
      var lane = document.createElement("div");
      lane.className = "rv-lane" + (i ? " rv-lane--rev" : "");
      var h = list.map(b).join("");
      lane.innerHTML = h + h.replace(/class="bubble"/g, 'class="bubble" aria-hidden="true"');
      mq.appendChild(lane);
    });
  }

  /* ---------- 스크롤 연출: 등장 · 숫자 · 하루 타임라인 ---------- */
  if (IO) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in"); ro.unobserve(e.target);
        $$("[data-count]", e.target).concat(e.target.hasAttribute("data-count") ? [e.target] : []).forEach(function (n) {
          var to = parseFloat(n.getAttribute("data-count")); n.setAttribute("data-cur", "0"); tween(n, to, null, 1400);
        });
      });
    }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]").forEach(function (el) { ro.observe(el); });

    var tl = $$(".tl li"), dt = $("#dayTotal"), db = $("#dayBar"), dmax = 0;
    if (tl.length && dt) {
      var last = parseFloat(tl[tl.length - 1].getAttribute("data-sum") || "0");
      var to2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-on");
          var s = parseFloat(e.target.getAttribute("data-sum") || "0");
          if (!dt.hasAttribute("data-cur")) { dt.setAttribute("data-cur", "0"); dt.textContent = "0"; if (db) db.style.width = "0%"; }
          if (s > dmax) { dmax = s; tween(dt, s, null, 700); if (db) db.style.width = (s / last * 100) + "%"; }
        });
      }, { rootMargin: "-40% 0px -45% 0px" });
      tl.forEach(function (li) { to2.observe(li); });
    }
  } else {
    $$(".tl li").forEach(function (li) { li.classList.add("is-on"); });
  }

  /* ---------- 캠톡 소개: 공식 링크 · 영상 ---------- */
  $$("[data-ct]").forEach(function (a) {
    var u = window.CAMTALK_LINKS && window.CAMTALK_LINKS[a.getAttribute("data-ct")];
    if (!u) { a.hidden = true; return; }
    a.href = u; a.target = "_blank"; a.rel = "noopener";
  });
  var vg = $("#ctVideos");
  if (vg && window.VIDEOS) {
    vg.innerHTML = window.VIDEOS.map(function (v) {
      return '<button type="button" class="vcard" data-vid="' + v.id + '" aria-label="' + v.title + ' 영상 재생">' +
        '<span class="vthumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg" onerror="this.remove()"><span class="vplay"><svg><use href="#i-play"/></svg></span><span class="vlen num">' + v.len + '</span></span>' +
        '<span class="vtitle">' + v.title + '</span></button>';
    }).join("");
    vg.addEventListener("click", function (e) {
      var c = e.target.closest(".vcard"); if (!c || c.classList.contains("is-playing")) return;
      var id = c.getAttribute("data-vid"), th = $(".vthumb", c);
      c.classList.add("is-playing");
      th.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="캠톡 영상" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
        '<a class="vout" href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">유튜브에서 보기</a>';
    });
  }

  /* ---------- 전환 이벤트 추적 (GA4 · 메타 픽셀) + UTM ---------- */
  var utm = {};
  try {
    var qs = new URLSearchParams(location.search), keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    keys.forEach(function (k) { var v = qs.get(k); if (v) utm[k] = v; });
    if (Object.keys(utm).length) sessionStorage.setItem("utm", JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem("utm") || "{}");
  } catch (e) {}
  function track(name, extra) {
    var p = Object.assign({ page: location.pathname }, utm, extra || {});
    try { if (window.gtag) gtag("event", name, p); } catch (e) {}
    try { if (window.dataLayer && !window.gtag) dataLayer.push(Object.assign({ event: name }, p)); } catch (e) {}
    try { if (window.fbq) fbq("trackCustom", name, p); } catch (e) {}
  }
  $$("[data-href]").forEach(function (a) {
    var key = a.getAttribute("data-href");
    a.addEventListener("click", function () { track("click_" + key, { label: (a.textContent || "").trim() }); });
  });
  $$("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { track("copy_contact", { what: b.getAttribute("data-copy") }); }); });
})();
