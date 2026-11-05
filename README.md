# 캠톡메이트 홈페이지

## 폴더 구조
- index.html — 홈페이지 (메인)
- privacy.html — 개인정보 처리방침
- board/_posts/ — ★ 글 원고(.md). 관리자 페이지(/admin)가 여기 저장함
- board/posts/, board/index.html — 빌드 시 자동 생성 (직접 고치지 말 것)
- admin/ — 글 관리자 페이지 (config.yml에 GitHub 저장소 이름 입력 필요)
- assets/css/site.css — 디자인 (홈·게시판·랜딩 공용)
- assets/js/config.js — ★ 연락처·추적 ID·사업자 정보. 여기만 고치면 전 페이지 반영
- assets/js/tracking.js — GA4/GTM/메타 픽셀 로더 (config 값이 있을 때만 작동)
- assets/js/content.js — 후기·FAQ·언론·영상 데이터
- assets/js/site.js — 계산기·후기·FAQ·전환 이벤트 등 기능
- assets/img/ — 사진(jpg+webp), og.jpg(카톡 공유 이미지), icon-*.png(파비콘)
- sitemap.xml, feed.xml, robots.txt — 검색엔진용 (build_board.py가 자동 생성)
- netlify.toml — Netlify 배포 설정
- build_board.py — 글 원고 → 게시판 페이지·sitemap·RSS 생성 (Netlify가 배포 때마다 자동 실행)
- 배포-안내서.md — 공개 절차

## 게시 전 확인
배포-안내서.md 0번 표의 값을 config.js에 입력.
