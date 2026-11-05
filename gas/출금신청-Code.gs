/* =====================================================================
   캠톡메이트 관리자 서버 스크립트 v3 (Google Apps Script)
   - 관리자 계정(아이디/비밀번호) 로그인, 계정 추가·삭제·비밀번호 변경
   - 출금신청 접수·관리
   ---------------------------------------------------------------------
   구글 스프레드시트 → 확장 프로그램 → Apps Script 에 붙여넣고
   "배포 → 배포 관리 → 수정 → 새 버전 → 배포" 로 반영합니다.
   ★ 아래 3줄만 바꾸면 됩니다.
   ===================================================================== */
var SECRET_KEY     = "바꿔주세요-암호화키-아무문장";   // ★ 암호화 키. 한 번 정하면 절대 바꾸지 마세요(바꾸면 기존 데이터 해독 불가)
var INIT_PASSWORD  = "바꿔주세요-최초비밀번호";       // ★ 최고관리자(admin) 최초 비밀번호. 첫 실행 때 계정이 만들어지고, 이후엔 관리자 페이지에서 변경
var NOTIFY_EMAIL   = "";                              // 새 출금신청이 오면 알림받을 이메일 (비우면 알림 없음)

/* GitHub 연동 (게시판 글쓰기·사이트 설정). 토큰은 코드가 아니라 "프로젝트 설정 → 스크립트 속성"에 GITHUB_TOKEN 으로 저장 */
var GH_OWNER = "camtalkmate", GH_REPO = "camtalkmate-site", GH_BRANCH = "main";

var MASTER_ID = "admin";
var TOKEN_HOURS = 12;          // 로그인 유지 시간
var MAX_FAIL = 5;              // 비밀번호 연속 실패 허용 횟수
var LOCK_MIN = 10;             // 잠금 시간(분)

var WD_SHEET = "출금신청";
var WD_HEADERS = ["접수번호", "접수일시", "상태", "캠톡 닉네임", "전화번호", "신청금액", "은행", "계좌번호", "예금주",
                  "주민번호 앞자리", "주민번호 뒷자리(암호화)", "메모", "처리일시", "유입경로", "기기"];
var AD_SHEET = "관리자";
var AD_HEADERS = ["아이디", "이름", "권한", "비밀번호(해시)", "솔트", "생성일시", "마지막 로그인", "실패횟수", "잠금해제시각"];

/* ---------- 공통 ---------- */
function out(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function err(msg) { return out({ ok: false, error: msg }); }
function now() { return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss"); }
function digits(s) { return String(s || "").replace(/[^0-9]/g, ""); }
function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#FFE3EC");
  }
  return sh;
}
function b64(bytes) { return Utilities.base64EncodeWebSafe(bytes); }
function hex(bytes) { return bytes.map(function (b) { return ("0" + (b & 0xff).toString(16)).slice(-2); }).join(""); }
function sha(s) { return hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }
function hmac(s) { return hex(Utilities.computeHmacSha256Signature(s, SECRET_KEY, Utilities.Charset.UTF_8)); }
function hashPw(pw, salt) { var h = salt + ":" + pw; for (var i = 0; i < 2000; i++) h = sha(h + salt); return h; }
function randomStr(n) { var s = "", c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; for (var i = 0; i < n; i++) s += c.charAt(Math.floor(Math.random() * c.length)); return s; }

/* 주민번호 뒷자리 암호화 (키 기반 XOR → 16진수) */
function keystream(id) { return Utilities.computeHmacSha256Signature(String(id) + "|rrn", SECRET_KEY); }
function encRRN(id, back7) {
  var ks = keystream(id), h = "";
  for (var i = 0; i < back7.length; i++) h += ("0" + (((back7.charCodeAt(i) ^ (ks[i] & 0xff)) & 0xff).toString(16))).slice(-2);
  return "enc:" + h;
}
function decRRN(id, enc) {
  if (!enc || String(enc).indexOf("enc:") !== 0) return String(enc || "");
  var ks = keystream(id), h = String(enc).slice(4), s = "";
  for (var i = 0; i < h.length; i += 2) s += String.fromCharCode((parseInt(h.substr(i, 2), 16) ^ (ks[i / 2] & 0xff)) & 0xff);
  return s;
}

/* ---------- 관리자 계정 ---------- */
function adminSheet() {
  var sh = getSheet(AD_SHEET, AD_HEADERS);
  if (sh.getLastRow() < 2) { // 최초 1회: 최고관리자 생성
    var salt = randomStr(16);
    sh.appendRow([MASTER_ID, "최고관리자", "master", hashPw(INIT_PASSWORD, salt), salt, now(), "", 0, ""]);
  }
  return sh;
}
function findAdmin(id) {
  var sh = adminSheet(), last = sh.getLastRow();
  if (last < 2) return null;
  var vals = sh.getRange(2, 1, last - 1, AD_HEADERS.length).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).toLowerCase() === String(id).toLowerCase()) {
    var r = vals[i];
    return { row: i + 2, id: r[0], name: r[1], role: r[2], hash: r[3], salt: r[4], createdAt: r[5], lastLogin: r[6], fail: +r[7] || 0, lockUntil: r[8] ? new Date(r[8]) : null };
  }
  return null;
}
function makeToken(id, role) {
  var exp = Date.now() + TOKEN_HOURS * 3600 * 1000;
  var body = id + "|" + role + "|" + exp;
  return b64(Utilities.newBlob(body + "|" + hmac(body)).getBytes());
}
function checkToken(token) {
  try {
    var s = Utilities.newBlob(Utilities.base64DecodeWebSafe(String(token || ""))).getDataAsString();
    var p = s.split("|"); if (p.length !== 4) return null;
    var body = p[0] + "|" + p[1] + "|" + p[2];
    if (hmac(body) !== p[3]) return null;
    if (Date.now() > +p[2]) return null;
    var a = findAdmin(p[0]); if (!a) return null; // 삭제된 계정
    return { id: a.id, name: a.name, role: a.role, exp: +p[2] };
  } catch (e) { return null; }
}
function login(b) {
  var id = String(b.id || "").trim(), pw = String(b.pw || "");
  if (!id || !pw) return err("아이디와 비밀번호를 입력해 주세요");
  var a = findAdmin(id);
  if (!a) return err("아이디 또는 비밀번호가 틀렸습니다");
  var sh = adminSheet();
  if (a.lockUntil && a.lockUntil > new Date()) return err("비밀번호를 여러 번 틀려 잠겼습니다. " + Math.ceil((a.lockUntil - new Date()) / 60000) + "분 뒤 다시 시도해 주세요");
  if (hashPw(pw, a.salt) !== a.hash) {
    var f = a.fail + 1;
    sh.getRange(a.row, 8).setValue(f);
    if (f >= MAX_FAIL) { sh.getRange(a.row, 9).setValue(new Date(Date.now() + LOCK_MIN * 60000)); sh.getRange(a.row, 8).setValue(0); return err("비밀번호를 " + MAX_FAIL + "회 틀려 " + LOCK_MIN + "분간 잠겼습니다"); }
    return err("아이디 또는 비밀번호가 틀렸습니다 (" + f + "/" + MAX_FAIL + ")");
  }
  sh.getRange(a.row, 7).setValue(now()); sh.getRange(a.row, 8).setValue(0); sh.getRange(a.row, 9).setValue("");
  return out({ ok: true, token: makeToken(a.id, a.role), user: { id: a.id, name: a.name, role: a.role } });
}
function listAdmins() {
  var sh = adminSheet(), last = sh.getLastRow();
  var vals = sh.getRange(2, 1, last - 1, AD_HEADERS.length).getDisplayValues();
  return out({ ok: true, admins: vals.map(function (r) { return { id: r[0], name: r[1], role: r[2], createdAt: r[5], lastLogin: r[6] }; }) });
}
function addAdmin(b, me) {
  if (me.role !== "master") return err("최고관리자만 계정을 추가할 수 있습니다");
  var id = String(b.id || "").trim().toLowerCase(), name = String(b.name || "").trim(), pw = String(b.pw || "");
  if (!/^[a-z0-9_]{3,20}$/.test(id)) return err("아이디는 영문 소문자·숫자 3~20자로 만들어 주세요");
  if (pw.length < 8) return err("비밀번호는 8자 이상으로 해주세요");
  if (findAdmin(id)) return err("이미 있는 아이디입니다");
  var salt = randomStr(16);
  adminSheet().appendRow([id, name || id, b.role === "master" ? "master" : "staff", hashPw(pw, salt), salt, now(), "", 0, ""]);
  return out({ ok: true });
}
function deleteAdmin(b, me) {
  if (me.role !== "master") return err("최고관리자만 계정을 삭제할 수 있습니다");
  var a = findAdmin(b.id); if (!a) return err("계정을 찾을 수 없습니다");
  if (a.id === MASTER_ID) return err("최고관리자 계정은 삭제할 수 없습니다");
  if (a.id === me.id) return err("자기 자신은 삭제할 수 없습니다");
  adminSheet().deleteRow(a.row);
  return out({ ok: true });
}
function changePw(b, me) {
  var target = b.id ? String(b.id) : me.id;
  if (target !== me.id && me.role !== "master") return err("다른 계정의 비밀번호는 최고관리자만 바꿀 수 있습니다");
  var a = findAdmin(target); if (!a) return err("계정을 찾을 수 없습니다");
  if (target === me.id) { if (hashPw(String(b.oldPw || ""), a.salt) !== a.hash) return err("현재 비밀번호가 틀렸습니다"); }
  var pw = String(b.newPw || ""); if (pw.length < 8) return err("새 비밀번호는 8자 이상으로 해주세요");
  var salt = randomStr(16), sh = adminSheet();
  sh.getRange(a.row, 4).setValue(hashPw(pw, salt)); sh.getRange(a.row, 5).setValue(salt);
  return out({ ok: true });
}

/* ---------- 웹 요청 ---------- */
function doGet() { return out({ ok: true, service: "camtalkmate-admin", v: 2 }); }
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var b = {};
    try { b = JSON.parse(e.postData.contents || "{}"); } catch (x) { return err("잘못된 요청"); }
    var action = b.action || "submit";
    if (action === "submit") return submit(b);          // 공개: 출금신청 접수
    if (action === "login") return login(b);            // 공개: 로그인
    var me = checkToken(b.token);
    if (!me) return out({ ok: false, error: "로그인이 필요합니다", auth: true });
    switch (action) {
      case "me":         return out({ ok: true, user: me });
      case "wd.list":    return wdList();
      case "wd.status":  return wdStatus(b);
      case "wd.memo":    return wdMemo(b);
      case "wd.delete":  return wdDelete(b, me);
      case "ad.list":    return listAdmins();
      case "ad.add":     return addAdmin(b, me);
      case "ad.delete":  return deleteAdmin(b, me);
      case "ad.pw":      return changePw(b, me);
      case "post.list":  return postList();
      case "post.get":   return postGet(b);
      case "post.save":  return postSave(b, me);
      case "post.delete":return postDelete(b, me);
      case "img.upload": return imgUpload(b);
      case "set.get":    return settingsGet();
      case "set.save":   return settingsSave(b, me);
      case "gh.status":  return ghStatus();
    }
    return err("알 수 없는 요청");
  } catch (x) {
    return err("서버 오류: " + x);
  } finally { try { lock.releaseLock(); } catch (x2) {} }
}

/* ---------- 출금신청 접수 ---------- */
function submit(b) {
  if (b.website) return out({ ok: true, id: "-" }); // 허니팟
  var nick = String(b.nick || "").trim(), phone = digits(b.phone), amount = parseInt(digits(b.amount), 10) || 0;
  var bank = String(b.bank || "").trim(), account = String(b.account || "").trim(), holder = String(b.holder || "").trim();
  var rrnF = digits(b.rrnFront), rrnB = digits(b.rrnBack);
  if (!nick) return err("캠톡 닉네임을 입력해 주세요");
  if (!/^01[016789][0-9]{7,8}$/.test(phone)) return err("전화번호 형식을 확인해 주세요");
  if (amount < 10000 || amount % 10000 !== 0) return err("출금 금액은 1만원 이상, 1만원 단위입니다");
  if (!bank) return err("은행을 선택해 주세요");
  if (digits(account).length < 8) return err("계좌번호를 확인해 주세요");
  if (!holder) return err("예금주를 입력해 주세요");
  if (rrnF.length !== 6 || rrnB.length !== 7) return err("주민등록번호 13자리를 확인해 주세요");
  if (!b.agree) return err("개인정보 수집·이용에 동의해 주세요");

  var sh = getSheet(WD_SHEET, WD_HEADERS), last = sh.getLastRow();
  if (last > 1) { // 3분 내 같은 번호·금액 중복 방지
    var recent = sh.getRange(Math.max(2, last - 20), 1, Math.min(21, last - 1), 6).getValues();
    for (var i = recent.length - 1; i >= 0; i--) {
      var r = recent[i];
      if (digits(r[4]) === phone && Number(r[5]) === amount && new Date() - new Date(String(r[1]).replace(/-/g, "/")) < 180000) return out({ ok: true, id: r[0], dup: true });
    }
  }
  var id = "W" + Utilities.formatDate(new Date(), "Asia/Seoul", "yyMMdd") + "-" + ("000" + last).slice(-4);
  sh.appendRow([id, now(), "대기", nick, phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3"), amount, bank, "'" + account, holder,
                "'" + rrnF, encRRN(id, rrnB), "", "", String(b.utm || ""), String(b.ua || "").slice(0, 120)]);
  sh.getRange(sh.getLastRow(), 6).setNumberFormat("#,##0");
  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, "[캠톡메이트] 출금신청 " + id + " · " + nick + " · " + amount.toLocaleString() + "원",
        "접수번호: " + id + "\n닉네임: " + nick + "\n전화: " + phone + "\n금액: " + amount.toLocaleString() + "원\n은행: " + bank + " " + account + " (" + holder + ")\n\n관리자 페이지에서 확인하세요.");
    } catch (x) {}
  }
  return out({ ok: true, id: id });
}

/* ---------- 출금신청 관리 ---------- */
function wdList() {
  var sh = getSheet(WD_SHEET, WD_HEADERS), last = sh.getLastRow();
  if (last < 2) return out({ ok: true, rows: [] });
  var vals = sh.getRange(2, 1, last - 1, WD_HEADERS.length).getDisplayValues();
  return out({ ok: true, rows: vals.map(function (r, i) {
    return { row: i + 2, id: r[0], at: r[1], status: r[2], nick: r[3], phone: r[4], amount: r[5], bank: r[6], account: r[7],
             holder: r[8], rrnFront: r[9], rrnBack: decRRN(r[0], r[10]), memo: r[11], doneAt: r[12], utm: r[13], ua: r[14] };
  }).reverse() });
}
function wdRow(id) {
  var sh = getSheet(WD_SHEET, WD_HEADERS), last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}
function wdStatus(b) {
  var r = wdRow(b.id); if (!r) return err("항목을 찾을 수 없습니다");
  var st = String(b.status || "대기");
  if (["대기", "송금완료", "보류", "취소"].indexOf(st) < 0) return err("상태값 오류");
  var sh = getSheet(WD_SHEET, WD_HEADERS);
  sh.getRange(r, 3).setValue(st); sh.getRange(r, 13).setValue(st === "대기" ? "" : now());
  return out({ ok: true });
}
function wdMemo(b) {
  var r = wdRow(b.id); if (!r) return err("항목을 찾을 수 없습니다");
  getSheet(WD_SHEET, WD_HEADERS).getRange(r, 12).setValue(String(b.memo || ""));
  return out({ ok: true });
}
function wdDelete(b, me) {
  if (me.role !== "master") return err("최고관리자만 삭제할 수 있습니다");
  var r = wdRow(b.id); if (!r) return err("항목을 찾을 수 없습니다");
  getSheet(WD_SHEET, WD_HEADERS).deleteRow(r);
  return out({ ok: true });
}

/* ---------- GitHub 연동 ---------- */
function ghToken() { return PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN") || ""; }
function gh(method, path, payload) {
  var tok = ghToken(); if (!tok) throw new Error("GitHub 토큰이 아직 등록되지 않았습니다 (스크립트 속성 GITHUB_TOKEN)");
  var opt = { method: method, muteHttpExceptions: true, headers: { Authorization: "Bearer " + tok, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } };
  if (payload) { opt.contentType = "application/json"; opt.payload = JSON.stringify(payload); }
  var res = UrlFetchApp.fetch("https://api.github.com" + path, opt), code = res.getResponseCode(), txt = res.getContentText();
  var json = null; try { json = JSON.parse(txt); } catch (e) {}
  if (code >= 300) throw new Error("GitHub 오류 " + code + ": " + ((json && json.message) || txt).slice(0, 200));
  return json;
}
function ghGetFile(path) { // {content(utf8), sha} or null
  try {
    var j = gh("get", "/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + encodeURI(path) + "?ref=" + GH_BRANCH);
    return { content: Utilities.newBlob(Utilities.base64Decode(String(j.content).replace(/\n/g, ""))).getDataAsString("UTF-8"), sha: j.sha };
  } catch (e) { if (String(e).indexOf("404") >= 0) return null; throw e; }
}
function ghPutFile(path, content, message, sha, isBase64) {
  var body = { message: message, branch: GH_BRANCH, content: isBase64 ? content : Utilities.base64Encode(content, Utilities.Charset.UTF_8) };
  if (sha) body.sha = sha;
  return gh("put", "/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + encodeURI(path), body);
}
function ghStatus() {
  try { var j = gh("get", "/repos/" + GH_OWNER + "/" + GH_REPO); return out({ ok: true, repo: j.full_name, connected: true }); }
  catch (e) { return out({ ok: true, connected: false, error: String(e.message || e) }); }
}

/* ---------- 게시판 글 ---------- */
function parseMd(src) {
  var m = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/), meta = {}, body = src;
  if (m) {
    body = m[2];
    m[1].split("\n").forEach(function (ln) {
      var i = ln.indexOf(":"); if (i < 0) return;
      var k = ln.slice(0, i).trim(), v = ln.slice(i + 1).trim();
      if (v.length >= 2 && v[0] === v[v.length - 1] && (v[0] === '"' || v[0] === "'")) v = v.slice(1, -1).replace(/\\"/g, '"');
      meta[k] = v;
    });
  }
  return { meta: meta, body: body };
}
function q(v) { return '"' + String(v || "").replace(/"/g, '\\"') + '"'; }
function buildMd(b) {
  var fm = ["---", "title: " + q(b.title), "date: " + String(b.date || "").slice(0, 10), "description: " + q(b.description), "keywords: " + q(b.keywords)];
  if (b.image) fm.push("image: " + q(b.image));
  if (b.draft) fm.push("draft: true");
  fm.push("---", "");
  return fm.join("\n") + String(b.body || "").replace(/\r\n/g, "\n").trim() + "\n";
}
function postList() {
  var files = gh("get", "/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/board/_posts?ref=" + GH_BRANCH);
  var posts = [];
  files.forEach(function (f) {
    if (!/\.md$/.test(f.name)) return;
    var slug = f.name.replace(/\.md$/, "");
    var fc = ghGetFile("board/_posts/" + f.name), p = parseMd(fc.content);
    posts.push({ slug: slug, title: p.meta.title || slug, date: String(p.meta.date || "").slice(0, 10), draft: /^(true|yes|1)$/i.test(p.meta.draft || ""), description: p.meta.description || "", image: p.meta.image || "", chars: p.body.replace(/\s/g, "").length });
  });
  posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return out({ ok: true, posts: posts });
}
function postGet(b) {
  var slug = String(b.slug || "").replace(/[^a-z0-9\-]/g, ""); if (!slug) return err("주소(slug)가 없습니다");
  var fc = ghGetFile("board/_posts/" + slug + ".md"); if (!fc) return err("글을 찾을 수 없습니다");
  var p = parseMd(fc.content);
  return out({ ok: true, post: { slug: slug, title: p.meta.title || "", date: String(p.meta.date || "").slice(0, 10), description: p.meta.description || "", keywords: p.meta.keywords || "", image: p.meta.image || "", draft: /^(true|yes|1)$/i.test(p.meta.draft || ""), body: p.body.replace(/^\n+/, "") }, sha: fc.sha });
}
function postSave(b, me) {
  var slug = String(b.slug || "").toLowerCase().replace(/[^a-z0-9\-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!slug) slug = "post-" + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd-HHmm");
  if (!String(b.title || "").trim()) return err("제목을 입력해 주세요");
  if (!String(b.body || "").trim()) return err("본문을 입력해 주세요");
  if (!b.date) b.date = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
  var path = "board/_posts/" + slug + ".md", cur = ghGetFile(path);
  if (cur && !b.overwrite && !b.sha) return err("같은 주소의 글이 이미 있습니다: " + slug);
  var md = buildMd(b);
  ghPutFile(path, md, (cur ? "글 수정: " : "글 작성: ") + b.title + " (" + me.id + ")", cur ? cur.sha : null);
  return out({ ok: true, slug: slug, url: "/board/posts/" + slug + ".html" });
}
function postDelete(b, me) {
  if (me.role !== "master") return err("최고관리자만 글을 삭제할 수 있습니다");
  var slug = String(b.slug || "").replace(/[^a-z0-9\-]/g, ""), path = "board/_posts/" + slug + ".md", cur = ghGetFile(path);
  if (!cur) return err("글을 찾을 수 없습니다");
  gh("delete", "/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + encodeURI(path), { message: "글 삭제: " + slug + " (" + me.id + ")", branch: GH_BRANCH, sha: cur.sha });
  return out({ ok: true });
}
function imgUpload(b) {
  var name = String(b.name || "image").toLowerCase().replace(/[^a-z0-9.\-_]/g, "-"), ext = (name.match(/\.(jpe?g|png|webp|gif)$/) || [".jpg"])[0];
  if (!/^(jpe?g|png|webp|gif)$/.test(ext.slice(1))) return err("이미지 파일(jpg, png, webp, gif)만 올릴 수 있어요");
  var data = String(b.base64 || "").replace(/^data:[^,]*,/, "");
  if (!data) return err("이미지 데이터가 없습니다");
  if (data.length > 6 * 1024 * 1024) return err("이미지는 4MB 이하로 올려 주세요");
  var fname = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd-HHmmss") + "-" + name.replace(/\.[^.]+$/, "").slice(0, 40) + ext;
  var path = "assets/img/uploads/" + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMM") + "/" + fname;
  ghPutFile(path, data, "이미지 업로드: " + fname, null, true);
  return out({ ok: true, path: "/" + path });
}

/* ---------- 사이트 설정 (config.js) ---------- */
var SET_KEYS = ["contact.kakaoUrl", "contact.kakaoId", "contact.lineUrl", "contact.lineId", "contact.telegramUrl", "contact.telegramId", "contact.phone", "contact.hours", "contact.inviteUrl", "agencyCode",
                "tracking.GTM_ID", "tracking.GA4_ID", "tracking.META_PIXEL_ID", "tracking.NAVER_SITE_VERIFY", "tracking.GOOGLE_SITE_VERIFY", "company.email"];
function setRe(key) { var k = key.split(".").pop(); return new RegExp("(^\\s*" + k + "\\s*:\\s*)\"((?:[^\"\\\\]|\\\\.)*)\"", "m"); }
function settingsGet() {
  var fc = ghGetFile("assets/js/config.js"); if (!fc) return err("config.js 를 찾을 수 없습니다");
  var vals = {};
  SET_KEYS.forEach(function (k) { var m = fc.content.match(setRe(k)); vals[k] = m ? m[2].replace(/\\"/g, '"') : ""; });
  return out({ ok: true, values: vals });
}
function settingsSave(b, me) {
  if (me.role !== "master") return err("최고관리자만 사이트 설정을 바꿀 수 있습니다");
  var fc = ghGetFile("assets/js/config.js"); if (!fc) return err("config.js 를 찾을 수 없습니다");
  var src = fc.content, changed = [];
  SET_KEYS.forEach(function (k) {
    if (!(k in (b.values || {}))) return;
    var v = String(b.values[k] || "").replace(/"/g, '\\"').replace(/[\r\n]/g, " ");
    var re = setRe(k); if (!re.test(src)) return;
    var before = src; src = src.replace(re, "$1\"" + v + "\""); if (src !== before) changed.push(k);
  });
  if (!changed.length) return out({ ok: true, changed: [] });
  ghPutFile("assets/js/config.js", src, "사이트 설정 변경: " + changed.join(", ") + " (" + me.id + ")", fc.sha);
  return out({ ok: true, changed: changed });
}
