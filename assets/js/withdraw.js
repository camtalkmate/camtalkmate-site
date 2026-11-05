/* 출금 신청 페이지 동작 — 설정은 config.js 의 withdraw 항목 */
(function () {
  "use strict";
  var S = window.SITE || {}, W = S.withdraw || {};
  var $ = function (s) { return document.querySelector(s); };
  var won = function (n) { return Math.round(n).toLocaleString("ko-KR"); };
  var digits = function (s) { return String(s || "").replace(/[^0-9]/g, ""); };
  var MIN = W.minAmount || 10000, STEP = W.step || 10000;

  /* 안내 문구 */
  var nt = $("#notices");
  (W.notices || []).forEach(function (n) {
    var li = document.createElement("li");
    li.innerHTML = "<strong></strong><span></span>";
    li.firstChild.textContent = n[0]; li.lastChild.textContent = n[1];
    nt.appendChild(li);
  });

  /* 접수 주소가 없으면 준비 중 안내 */
  var form = $("#wf"), offline = $("#offline");
  if (!W.endpoint) { offline.hidden = false; form.classList.add("is-disabled"); }

  /* 은행 목록 */
  var bank = $("#bank"), etcWrap = $("#bankEtcWrap"), etc = $("#bankEtc");
  (W.banks || []).concat(["기타 (직접 입력)"]).forEach(function (b) {
    var o = document.createElement("option"); o.value = b; o.textContent = b; bank.appendChild(o);
  });
  bank.addEventListener("change", function () {
    var isEtc = bank.value.indexOf("기타") === 0;
    etcWrap.hidden = !isEtc; etc.required = isEtc;
    if (isEtc) etc.focus();
  });

  /* 금액 */
  var amount = $("#amount"), net = $("#net"), quick = $("#quick");
  function getAmount() { return parseInt(digits(amount.value), 10) || 0; }
  function setAmount(v) {
    v = Math.max(0, Math.floor(v / STEP) * STEP);
    amount.value = v ? won(v) : "";
    net.textContent = won(v) + "원";
    net.classList.add("pop"); setTimeout(function () { net.classList.remove("pop"); }, 300);
  }
  (W.quickAdd || []).forEach(function (v) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = "+" + (v >= 10000 ? (v / 10000) + "만원" : won(v) + "원");
    b.addEventListener("click", function () { setAmount(getAmount() + v); });
    quick.appendChild(b);
  });
  amount.addEventListener("input", function () {
    var v = parseInt(digits(amount.value), 10) || 0;
    amount.value = v ? won(v) : "";
    net.textContent = won(Math.floor(v / STEP) * STEP) + "원";
  });
  amount.addEventListener("blur", function () { setAmount(getAmount()); });

  /* 전화번호·계좌·주민번호 입력 보정 */
  var phone = $("#phone");
  phone.addEventListener("input", function () {
    var d = digits(phone.value).slice(0, 11);
    phone.value = d.length > 7 ? d.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3") : d.length > 3 ? d.replace(/(\d{3})(\d+)/, "$1-$2") : d;
  });
  var rrnF = $("#rrnFront"), rrnB = $("#rrnBack");
  rrnF.addEventListener("input", function () { rrnF.value = digits(rrnF.value).slice(0, 6); if (rrnF.value.length === 6) rrnB.focus(); });
  rrnB.addEventListener("input", function () { rrnB.value = digits(rrnB.value).slice(0, 7); });
  $("#eye").addEventListener("click", function () {
    var show = rrnB.type === "password"; rrnB.type = show ? "text" : "password"; this.textContent = show ? "숨김" : "보기";
  });

  /* 검증 */
  var err = $("#err");
  function fail(msg, el) {
    err.textContent = msg; err.hidden = false;
    if (el) { el.focus(); el.classList.add("is-bad"); setTimeout(function () { el.classList.remove("is-bad"); }, 1500); }
    err.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  function validRRN(f, b) {
    if (f.length !== 6 || b.length !== 7) return "주민등록번호 13자리를 정확히 입력해 주세요";
    var g = +b[0];
    if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(g) < 0) return "주민등록번호 뒷자리 첫 숫자를 확인해 주세요";
    var yy = +f.slice(0, 2), mm = +f.slice(2, 4), dd = +f.slice(4, 6);
    var year = (g === 1 || g === 2 || g === 5 || g === 6) ? 1900 + yy : 2000 + yy;
    var d = new Date(year, mm - 1, dd);
    if (mm < 1 || mm > 12 || d.getMonth() !== mm - 1 || d.getDate() !== dd) return "주민등록번호 앞자리(생년월일)를 확인해 주세요";
    var t = new Date(), age = t.getFullYear() - year - ((t.getMonth() + 1 < mm || (t.getMonth() + 1 === mm && t.getDate() < dd)) ? 1 : 0);
    if (age < 19) return "만 19세 이상만 캠톡커로 활동할 수 있어요";
    return "";
  }
  function validate() {
    err.hidden = true;
    var nick = $("#nick").value.trim(); if (!nick) return fail("캠톡 닉네임을 입력해 주세요", $("#nick"));
    var ph = digits(phone.value); if (!/^01[016789][0-9]{7,8}$/.test(ph)) return fail("전화번호 형식을 확인해 주세요 (예: 010-1234-5678)", phone);
    var amt = getAmount();
    if (amt < MIN) return fail("출금 금액은 " + won(MIN) + "원 이상부터 신청할 수 있어요", amount);
    if (amt % STEP !== 0) return fail("출금 금액은 " + won(STEP) + "원 단위로 신청할 수 있어요", amount);
    if (!bank.value) return fail("은행을 선택해 주세요", bank);
    if (bank.value.indexOf("기타") === 0 && !etc.value.trim()) return fail("은행명을 직접 입력해 주세요", etc);
    if (digits($("#account").value).length < 8) return fail("계좌번호를 확인해 주세요", $("#account"));
    if (!$("#holder").value.trim()) return fail("예금주를 입력해 주세요", $("#holder"));
    var r = validRRN(rrnF.value, rrnB.value); if (r) return fail(r, rrnF);
    if (!$("#agree").checked) return fail("개인정보 수집·이용에 동의해 주세요", $("#agree"));
    return true;
  }

  /* 전송 */
  var btn = $("#submit"), busy = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy || !validate()) return;
    if (!W.endpoint) { fail("지금은 카카오톡으로 신청을 받고 있어요. 위의 '카톡으로 신청하기'를 눌러 주세요"); return; }
    var utm = {}; try { utm = JSON.parse(sessionStorage.getItem("utm") || "{}"); } catch (e2) {}
    var data = {
      action: "submit",
      nick: $("#nick").value.trim(), phone: digits(phone.value), amount: getAmount(),
      bank: bank.value.indexOf("기타") === 0 ? etc.value.trim() : bank.value,
      account: $("#account").value.trim(), holder: $("#holder").value.trim(),
      rrnFront: rrnF.value, rrnBack: rrnB.value, agree: true,
      website: form.website.value, utm: Object.keys(utm).map(function (k) { return k + "=" + utm[k]; }).join("&"),
      ua: navigator.userAgent
    };
    busy = true; btn.disabled = true; btn.firstChild.textContent = "접수 중…";
    fetch(W.endpoint, { method: "POST", body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || "접수에 실패했어요");
        try { if (window.gtag) gtag("event", "withdraw_submit", { amount: data.amount }); } catch (e3) {}
        try { if (window.fbq) fbq("trackCustom", "withdraw_submit", { amount: data.amount }); } catch (e4) {}
        try { sessionStorage.setItem("wd_done", JSON.stringify({ id: res.id, amount: data.amount, nick: data.nick, bank: data.bank })); } catch (e5) {}
        location.href = "withdraw-done.html";
      })
      .catch(function (ex) {
        busy = false; btn.disabled = false; btn.firstChild.textContent = "출금 신청하기";
        fail((ex && ex.message) || "접수에 실패했어요. 잠시 후 다시 시도하거나 카카오톡으로 알려주세요");
      });
  });
})();
