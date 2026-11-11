# 🎄 X-mas Card Studio

별도 회원가입 없이 온라인 크리스마스 카드를 제작하고 **이메일 · 카카오톡 · SMS(모바일 문자)** 로 발송할 수 있는 Next.js 풀스택 웹 애플리케이션입니다.

## 주요 기능

- **카드 에디터 & 실시간 미리보기**: 4가지 크리스마스 테마, 추천 인사말 프리셋, 사진 첨부, 오르골 캐롤(Web Audio API), 봉투/속지 미리보기
- **인터랙티브 수신자 뷰어 (`/c/[slug]`)**: 봉투 열기 애니메이션, Canvas 눈 내림 효과, 캐롤 BGM 재생/음소거, 답장(방명록) 남기기
- **멀티채널 발송 관리 (`/manage/[manageToken]`)**:
  - **이메일**: HTML 카드 메일 발송 (Resend / SMTP 지원, 미설정 시 렌더링 미리보기)
  - **카카오톡**: Kakao JS SDK 공유하기 + 문구/링크 복사
  - **SMS**: 무료 `sms:` URI 스킴으로 모바일 기본 문자 앱 실행 + 문구 복사
  - **열람 및 답장 현황**: 수신자별 열람 횟수, 발송 상태, 받은 답장 실시간 확인

## 시작하기

### 1. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일을 확인/수정하세요.

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# 카카오톡 공유하기 (선택: 카카오 디벨로퍼스 JavaScript 키)
NEXT_PUBLIC_KAKAO_JS_KEY=""

# 이메일 발송 옵션 1: SMTP (예: Gmail 앱 비밀번호, 네이버 메일 등)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# 이메일 발송 옵션 2: Resend API
RESEND_API_KEY=""
RESEND_FROM=""
```

> **참고**: 이메일 키나 카카오 키를 설정하지 않아도 카드 생성, HTML 메일 미리보기, 카톡 문구 복사, SMS(`sms:`) 링크 생성 및 모든 카드 뷰어 기능은 즉시 동작합니다.

### 2. 데이터베이스 초기화 및 실행

```bash
npm install
npx prisma db push
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run lint`: ESLint 검사
- `npm test`: 단위 테스트 실행
