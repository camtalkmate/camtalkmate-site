# -*- coding: utf-8 -*-
"""
게시판 빌드 스크립트
- board/_posts/*.md (관리자 페이지 /admin 에서 저장되는 글) 를 읽어
  board/posts/*.html, board/index.html, sitemap.xml, feed.xml 을 만듭니다.
- Netlify가 배포할 때마다 자동으로 실행합니다 (netlify.toml 참고). 직접 실행도 가능: python build_board.py
"""
import re, glob, os, html, datetime, json

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://camtalkus.com"
BRAND = "캠톡어스"
POSTS_DIR = os.path.join(ROOT, "board", "posts")
MD_DIR = os.path.join(ROOT, "board", "_posts")   # 관리자 페이지가 글을 저장하는 곳 (마크다운)

def meta(src, name, prop=False):
    attr = "property" if prop else "name"
    m = re.search(r'<meta\s+%s="%s"\s+content="([^"]*)"' % (attr, re.escape(name)), src)
    return html.unescape(m.group(1)) if m else ""

def read_post(path):
    src = open(path, encoding="utf-8").read()
    slug = os.path.splitext(os.path.basename(path))[0]
    body = re.search(r'<div class="post-body">(.*?)</div>\s*<!-- /post-body -->', src, re.S)
    text = re.sub(r"<[^>]+>", "", body.group(1)) if body else ""
    return {
        "slug": slug,
        "title": re.sub(r"\s*\|\s*" + re.escape(BRAND) + r"\s*$", "", html.unescape(re.search(r"<title>(.*?)</title>", src, re.S).group(1).strip())),
        "description": meta(src, "description"),
        "keywords": meta(src, "keywords"),
        "date": meta(src, "article:published_time", prop=True)[:10],
        "chars": len(re.sub(r"\s", "", text)),
        "url": "%s/board/posts/%s.html" % (SITE, slug),
    }


# ---------- 마크다운 → HTML (외부 패키지 없이, 글에 필요한 문법만) ----------
def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t

def md_to_html(md):
    out, para, lst, quote = [], [], None, []
    def flush_para():
        if para: out.append("<p>" + inline(" ".join(para)) + "</p>"); para.clear()
    def flush_list():
        nonlocal lst
        if lst: out.append("<%s>%s</%s>" % (lst[0], "".join("<li>%s</li>" % inline(i) for i in lst[1]), lst[0])); lst = None
    def flush_quote():
        if quote: out.append("<blockquote><p>" + inline(" ".join(quote)) + "</p></blockquote>"); quote.clear()
    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip(): flush_para(); flush_list(); flush_quote(); continue
        m = re.match(r"^(#{1,4})\s+(.*)", line)
        if m: flush_para(); flush_list(); flush_quote(); lvl = min(max(len(m.group(1)), 2), 4); out.append("<h%d>%s</h%d>" % (lvl, inline(m.group(2)), lvl)); continue
        m = re.match(r"^\s*[-*]\s+(.*)", line)
        if m: flush_para(); flush_quote(); lst = lst or ("ul", []); lst[1].append(m.group(1)); continue
        m = re.match(r"^\s*\d+[.)]\s+(.*)", line)
        if m: flush_para(); flush_quote(); lst = lst or ("ol", []); lst[1].append(m.group(1)); continue
        m = re.match(r"^>\s?(.*)", line)
        if m: flush_para(); flush_list(); quote.append(m.group(1)); continue
        m = re.match(r"^!\[([^\]]*)\]\(([^)\s]+)\)", line.strip())
        if m:
            flush_para(); flush_list(); flush_quote()
            src = m.group(2)
            if src.startswith("/"): src = "../.." + src
            webp = re.sub(r"\.(jpe?g|png)$", ".webp", src)
            pic = '<img src="%s" alt="%s" loading="lazy" width="1200" height="675">' % (src, html.escape(m.group(1)))
            if webp != src: pic = '<picture><source srcset="%s" type="image/webp">%s</picture>' % (webp, pic)
            out.append('<figure class="post-fig">' + pic + "</figure>"); continue
        m = re.match(r"^\*([^*]+)\*$", line.strip())
        if m and out and out[-1].endswith("</figure>"):
            out[-1] = out[-1][:-9] + "<figcaption>" + inline(m.group(1)) + "</figcaption></figure>"; continue
        flush_list(); flush_quote(); para.append(line.strip())
    flush_para(); flush_list(); flush_quote()
    return "\n".join(out)

def read_md(path):
    src = open(path, encoding="utf-8").read()
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", src, re.S)
    meta, body = {}, src
    if m:
        body = m.group(2)
        for ln in m.group(1).splitlines():
            k, _, v = ln.partition(":")
            v = v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'": v = v[1:-1].replace('\\"', '"')
            meta[k.strip()] = v
    slug = os.path.splitext(os.path.basename(path))[0]
    date = str(meta.get("date", ""))[:10]
    text = re.sub(r"[#*>\-\[\]()]", "", body)
    return {"slug": slug, "title": meta.get("title", slug), "description": meta.get("description", ""), "keywords": meta.get("keywords", ""),
            "date": date, "body_md": body, "chars": len(re.sub(r"\s", "", text)), "url": "%s/board/posts/%s.html" % (SITE, slug),
            "draft": str(meta.get("draft", "")).lower() in ("true", "yes", "1"),
            "image": meta.get("image", "") or "/assets/img/og.jpg"}

def page_shell(title, desc, canonical, body, extra_head="", depth=2):
    up = "../" * depth
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)} | {BRAND}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="ko_KR">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{SITE}/assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFF9F7">
<link rel="icon" type="image/png" sizes="32x32" href="{up}assets/img/icon-32.png">
<link rel="apple-touch-icon" href="{up}assets/img/icon-192.png">
<link rel="alternate" type="application/rss+xml" title="{BRAND} 게시판" href="{SITE}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Gasoek+One&family=Noto+Sans+KR:wght@400;500;700;800&display=swap">
<link rel="stylesheet" href="{up}assets/css/site.css">
<script src="{up}assets/js/config.js"></script>
<script src="{up}assets/js/tracking.js"></script>
{extra_head}
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="{up}" aria-label="홈으로"><span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="38" cy="38" r="10" fill="#fff"/><circle cx="62" cy="38" r="10" fill="#fff" fill-opacity=".85"/><path d="M20 74c0-11 8-19 18-19s18 8 18 19z" fill="#fff"/><path d="M44 74c0-11 8-19 18-19s18 8 18 19z" fill="#fff" fill-opacity=".85"/></svg></span><span><span data-text="brand.name">{BRAND}</span><small data-text="brand.agencyLabel">캠톡 공식 에이전시</small></span></a>
    <nav class="nav" id="nav" aria-label="주요 메뉴">
      <a href="{up}">홈</a>
      <a href="{up}board/" class="nav-board">게시판</a>
      <a href="{up}#faq">FAQ</a>
    </nav>
    <div class="header-cta">
      <a class="btn btn--primary btn--sm" data-href="invite">바로 시작하기</a>
      <a class="btn btn--kakao btn--sm" data-href="kakao"><svg><use href="#i-kakao"/></svg>카톡 상담하기</a>
    </div>
    <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="메뉴 열기"><svg><use href="#i-menu"/></svg></button>
  </div>
</header>
<main>
{body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-top">
      <a class="logo" href="{up}"><span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="38" cy="38" r="10" fill="#fff"/><circle cx="62" cy="38" r="10" fill="#fff" fill-opacity=".85"/><path d="M20 74c0-11 8-19 18-19s18 8 18 19z" fill="#fff"/><path d="M44 74c0-11 8-19 18-19s18 8 18 19z" fill="#fff" fill-opacity=".85"/></svg></span><span data-text="brand.name">{BRAND}</span></a>
      <nav class="foot-links" aria-label="하단 메뉴"><a href="{up}">홈</a><a href="{up}board/">게시판</a><a href="{up}#faq">자주 묻는 질문</a><a href="{up}#contact">상담 · 시작</a><a href="{up}privacy.html">개인정보 처리방침</a></nav>
    </div>
    <div class="foot-info">
      <span>상호 <span data-text="company.name"></span></span><span>대표 <span data-text="company.ceo"></span></span><span>사업자등록번호 <span data-text="company.bizNo"></span></span><span data-optional>통신판매업신고 <span data-text="company.ecommerceNo"></span></span><span>주소 <span data-text="company.address"></span></span>
    </div>
    <p class="foot-legal">본 서비스는 만 19세 이상 성인만 이용할 수 있습니다. 글에 나오는 수익 예시는 이해를 돕기 위한 가정치이며 실제 수익은 활동 방식에 따라 달라집니다.</p>
    <p>© <span data-year>2026</span> <span data-text="brand.name">{BRAND}</span>. All rights reserved.</p>
  </div>
</footer>
<script src="{up}assets/js/content.js"></script>
<script src="{up}assets/js/site.js"></script>
</body>
</html>
"""

CTA_BOX = """
<aside class="post-cta">
  <div><b>처음이라 망설여진다면, 일단 물어만 보셔도 괜찮아요.</b><span>캠톡 공식 에이전시 캠톡어스 · 가입비 0원 · 1만원부터 당일 출금</span></div>
  <div class="btn-row"><a class="btn btn--primary" data-href="invite">바로 시작하기</a><a class="btn btn--kakao" data-href="kakao"><svg><use href="#i-kakao"/></svg>카톡 상담하기</a></div>
</aside>"""

def post_page(p, body_html, related):
    canonical = p["url"]
    img = SITE + p["image"]
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Article", "headline": p["title"], "description": p["description"], "datePublished": p["date"], "dateModified": p["date"],
             "inLanguage": "ko", "mainEntityOfPage": canonical, "image": img,
             "author": {"@type": "Organization", "name": BRAND}, "publisher": {"@type": "Organization", "name": BRAND, "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/icon-512.png"}}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "홈", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": "게시판", "item": SITE + "/board/"},
                {"@type": "ListItem", "position": 3, "name": p["title"], "item": canonical}]}
        ]}
    extra = '<meta name="keywords" content="%s">\n<meta property="article:published_time" content="%sT09:00:00+09:00">\n<script type="application/ld+json">%s</script>' % (
        html.escape(p["keywords"]), p["date"], json.dumps(ld, ensure_ascii=False))
    rel = "".join('<li><a href="%s.html"><b>%s</b><span>%s</span></a></li>' % (r["slug"], html.escape(r["title"]), r["date"]) for r in related)
    body = f"""
<article class="post wrap">
  <nav class="crumb" aria-label="경로"><a href="../../">홈</a> › <a href="../">게시판</a></nav>
  <h1>{html.escape(p["title"])}</h1>
  <p class="post-meta"><time datetime="{p["date"]}">{p["date"].replace("-", ".")}</time> · {BRAND} 게시판</p>
  <div class="post-body">{body_html}</div>
  <!-- /post-body -->
  {CTA_BOX}
  <section class="post-rel"><h2>함께 읽으면 좋은 글</h2><ul>{rel}</ul></section>
</article>"""
    page = page_shell(p["title"], p["description"], canonical, body, extra)
    return page.replace(SITE + "/assets/img/og.jpg", img, 1)

def build():
    os.makedirs(POSTS_DIR, exist_ok=True)
    posts = [read_md(f) for f in glob.glob(os.path.join(MD_DIR, "*.md"))]
    posts = [p for p in posts if p["date"] and not p["draft"]]
    posts.sort(key=lambda x: x["date"], reverse=True)

    # 1) 글 페이지 전부 다시 생성 (관리자 페이지에서 고친 내용이 반영되도록 매번 새로 만듦)
    for old in glob.glob(os.path.join(POSTS_DIR, "*.html")):
        os.remove(old)
    for p in posts:
        others = [q for q in posts if q["slug"] != p["slug"]][:3]
        open(os.path.join(POSTS_DIR, p["slug"] + ".html"), "w", encoding="utf-8").write(post_page(p, md_to_html(p["body_md"]), others))

    # 3) 목록 페이지
    items = "".join(f"""
      <li class="post-card">
        <a href="posts/{p["slug"]}.html">
          <span class="post-thumb"><picture><source srcset="..{re.sub(r"[.](jpe?g|png)$", ".webp", p["image"])}" type="image/webp"><img src="..{p["image"]}" alt="" loading="lazy" width="1200" height="675"></picture></span>
          <time datetime="{p["date"]}">{p["date"].replace("-", ".")}</time>
          <h2>{html.escape(p["title"])}</h2>
          <p>{html.escape(p["description"])}</p>
          <span class="more">읽어보기 →</span>
        </a>
      </li>""" for p in posts)
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": BRAND + " 게시판", "url": SITE + "/board/", "inLanguage": "ko",
          "hasPart": [{"@type": "Article", "headline": p["title"], "url": p["url"], "datePublished": p["date"]} for p in posts]}
    body = f"""
<section class="band board-head">
  <div class="aurora" aria-hidden="true"><i></i><i></i></div>
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">캠톡어스 게시판</span>
      <h1 class="h2">캠톡과 캠톡커,<br>궁금한 걸 차근차근 풀어드려요</h1>
      <p>처음 접하는 분들이 많이 묻는 것들을 글로 정리했어요. 읽다가 궁금한 게 생기면 언제든 카톡으로 물어보세요.</p>
    </div>
  </div>
</section>
<section class="band band--2 board-list">
  <div class="wrap"><ul class="post-list">{items}</ul></div>
</section>"""
    page = page_shell("게시판 · 캠톡커 궁금증 풀이", "캠톡커 활동, 수익 구조, 출금과 세금, 안전 기능, 에이전시 고르는 법까지. 캠톡 공식 에이전시 캠톡어스가 처음 시작하는 분들을 위해 정리한 글 모음입니다.", SITE + "/board/", body,
                      '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False), depth=1)
    page = page.replace('<meta property="og:type" content="article">', '<meta property="og:type" content="website">')
    open(os.path.join(ROOT, "board", "index.html"), "w", encoding="utf-8").write(page)

    # 4) sitemap.xml
    today = datetime.date.today().isoformat()
    urls = [(SITE + "/", today, "1.0"), (SITE + "/board/", posts[0]["date"] if posts else today, "0.8")] + [(p["url"], p["date"], "0.7") for p in posts]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        "  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n" % u for u in urls) + "</urlset>\n"
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(sm)

    # 5) feed.xml (RSS 2.0 — 네이버 서치어드바이저 RSS 제출용)
    rss_items = "".join("""  <item>
    <title>%s</title>
    <link>%s</link>
    <guid isPermaLink="true">%s</guid>
    <pubDate>%s</pubDate>
    <description>%s</description>
    <enclosure url="%s" type="image/jpeg"/>
  </item>
""" % (html.escape(p["title"]), p["url"], p["url"], datetime.datetime.strptime(p["date"], "%Y-%m-%d").strftime("%a, %d %b %Y 09:00:00 +0900"), html.escape(p["description"]), SITE + p["image"]) for p in posts)
    rss = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>%s 게시판</title>
  <link>%s/board/</link>
  <atom:link href="%s/feed.xml" rel="self" type="application/rss+xml"/>
  <description>캠톡 공식 에이전시 캠톡어스 — 캠톡커 활동, 수익, 안전에 대한 글</description>
  <language>ko</language>
%s</channel>
</rss>
""" % (BRAND, SITE, SITE, rss_items)
    open(os.path.join(ROOT, "feed.xml"), "w", encoding="utf-8").write(rss)

    print("완료: 글 %d편" % len(posts))
    for p in posts: print("  -", p["date"], p["title"], "(%d자)" % p["chars"])

def stamp_assets():
    """CSS·JS 파일 내용이 바뀌면 주소 끝의 ?v= 값이 자동으로 바뀌어, 방문자 브라우저가 새 파일을 받게 함"""
    import hashlib
    ver = {}
    for f in glob.glob(os.path.join(ROOT, "assets", "css", "*.css")) + glob.glob(os.path.join(ROOT, "assets", "js", "*.js")):
        rel = os.path.relpath(f, ROOT).replace(os.sep, "/")
        ver[rel] = hashlib.md5(open(f, "rb").read()).hexdigest()[:8]
    pat = re.compile(r'((?:\.\./)*)(assets/(?:css|js)/[\w.-]+\.(?:css|js))(\?v=[\w]+)?"')
    n = 0
    for f in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
        if os.sep + "lp" + os.sep in f: continue
        src = open(f, encoding="utf-8").read()
        out = pat.sub(lambda m: m.group(1) + m.group(2) + ("?v=" + ver[m.group(2)] if m.group(2) in ver else (m.group(3) or "")) + '"', src)
        if out != src:
            open(f, "w", encoding="utf-8").write(out); n += 1
    print("자산 버전 표시: 파일 %d개" % n)

if __name__ == "__main__":
    build()
    stamp_assets()
