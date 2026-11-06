/* =========================================================
   사이트 공통 설정 — 홈페이지와 모든 랜딩페이지가 이 파일 하나를 함께 씁니다.
   연락처·회사정보·단가가 바뀌면 여기만 고치면 전 페이지에 반영됩니다.
   "★입력" 표시가 있는 항목은 실제 정보로 바꿔 주세요.
   ========================================================= */
window.SITE = {
  /* 사이트 주소 (도메인 연결 후 실제 주소로) — canonical·OG·sitemap에 쓰임 */
  siteUrl: "https://camtalkmate.com",

  /* ★ 추적 코드 — 각 서비스에서 발급받은 ID를 넣으면 자동으로 켜집니다. 비워두면 꺼짐. */
  tracking: {
    GTM_ID: "",            // 예: "GTM-XXXXXXX"  (구글 태그 매니저 — 있으면 GA4보다 우선)
    GA4_ID: "",            // 예: "G-XXXXXXXXXX" (구글 애널리틱스 4)
    META_PIXEL_ID: "",     // 예: "1234567890"   (메타/인스타 광고 픽셀)
    NAVER_SITE_VERIFY: "", // 네이버 서치어드바이저 소유확인 메타값
    GOOGLE_SITE_VERIFY: "" // 구글 서치콘솔 소유확인 메타값
  },

  brand: {
    name: "캠톡메이트",
    short: "캠톡메이트",
    agencyLabel: "캠톡 공식 에이전시"
  },

  /* 캠톡 가입 시 입력하는 에이전시(파트너) 코드. 입력하면 시작 방법 안내에 자동 표시 */
  agencyCode: "",                                  // ★입력: 예) "gpartners01"

  /* 캠톡 플랫폼 공개 정보 (2026.11.03 확인) — 수치가 바뀌면 여기서 수정 */
  platform: {
    operator: "메이트네트웍스",
    operatorSince: "2012",
    publisher: "비씨이노베이션",
    playRank: "#2",                 // 구글플레이 데이트 카테고리 최고 매출 순위
    playRankDate: "2026.11.03",
    calls: "1억 콜",                // 누적 통화 수 (운영사 2025.05 발표)
    stores: "App Store · Google Play · One Store",
    os: "iOS 14 이상 · Android 7.0 이상 · 웹 브라우저"
  },

  contact: {
    inviteUrl: "https://link.camtalk.kr/gg/aresjsh", // 캠톡 소속 가입 초대링크
    kakaoUrl: "https://open.kakao.com/o/sKg3aPVi", // ★입력: 카카오 오픈채팅/채널 링크
    kakaoId: "camtalkmate",                        // ★입력: 화면에 보여줄 카카오 ID
    lineUrl: "https://line.me/R/ti/p/~camtalkmate",                                    // ★입력: 라인 링크 (예: https://line.me/ti/p/XXXX). 비우면 라인 버튼 숨김
    lineId: "camtalkmate",
    telegramUrl: "https://t.me/camtalkmate",                                // ★입력: 텔레그램 링크 (예: https://t.me/camtalkmate). 비우면 숨김
    telegramId: "camtalkmate",
    phone: "",                                      // 전화 상담을 받는다면 입력 (예: "010-0000-0000")
    hours: "24시간 상담 · 평균 10분 이내 답변"
  },

  /* 온라인 신청서 접수 주소
     - 비워두면: 작성 내용을 복사해서 카카오톡으로 보내는 방식으로 동작
     - 구글 Apps Script / Formspree 등 주소를 넣으면: 그 주소로 바로 접수 */
  form: {
    endpoint: ""
  },

  /* 출금신청 접수 — 구글 Apps Script 웹 앱 URL (출금신청-설정.md 참고)
     비워두면 출금신청 페이지가 "준비 중" 안내를 보여줍니다. */
  withdraw: {
    endpoint: "https://script.google.com/macros/s/AKfycbzuT6zPaSCMBBpbMHSzZghxEOK1r19ECIUY9QOzD2FtxtyQGAEfSMMWHg6eIf-SvGKX/exec",
    minAmount: 10000,             // 최소 출금 금액
    step: 10000,                  // 금액 단위
    quickAdd: [10000, 50000, 100000, 500000, 1000000],
    banks: ["국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행", "카카오뱅크", "토스뱅크", "케이뱅크",
            "SC제일은행", "씨티은행", "대구은행", "부산은행", "광주은행", "제주은행", "전북은행", "경남은행", "새마을금고", "신협", "우체국"],
    notices: [
      ["소속 확정 전에 획득한 캐시도 그대로 인정", "돼요. 소속 확정 전·후와 관계없이 보유 캐시로 출금을 신청할 수 있어요."],
      ["지급은 낮 시간 신청 시 30분 이내", " 송금하고, 심야 시간 신청분은 오전 9시에 일괄 송금해요."],
      ["3.3% 원천징수와 송금수수료는 캠톡메이트가 부담", "해요. 신청한 금액 전액을 그대로 받아요."],
      ["주민등록번호는 사업소득세 신고에만", " 사용하고, 신고 후 즉시 폐기해요. 신분증 사진은 받지 않아요."]
    ]
  },

  /* 수익 단가 — 계산기·안내 문구에 자동 반영 */
  rates: {
    perMinute: 900,          // 1분 통화 단가(캐시). 1캐시 = 1원
    callRatio: 0.7,          // 접속 시간 중 실제 통화 비율 기본값
    giftPerHour: 10000,      // 시간당 선물 수익 가정 기본값(보수적으로)
    weeksPerMonth: 4.33,
    minWage: 10320,          // 비교용 최저시급 (2026년 기준)
    minWithdraw: 10000       // 최소 출금 단위
  },

  settlement: {
    daytime: "낮 시간 신청 시 30분 안팎으로 입금",
    night: "심야 신청분은 다음 날 오전 9시 일괄 입금",
    tax: "3.3% 원천징수와 송금 수수료는 에이전시가 부담합니다. 종합소득세 신고는 본인이 진행합니다." // ★확인: 실제 정책에 맞게
  },

  company: {                 // 푸터 사업자 정보
    name: "오스트빅 주식회사",
    ceo: "서정권",
    bizNo: "843-86-00717",
    ecommerceNo: "제2018-서울강남-00461호",
    address: "서울특별시 강남구 테헤란로82길 15, 1156호(대치동, 디아이타워)",
    email: ""
  }
};
