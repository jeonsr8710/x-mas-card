# 🚀 하이브리드 운영 가이드 (로컬 PC 발송 + Vercel 24시간 카드 열람)

이 프로젝트는 **개인정보 보호**를 위해 다음과 같은 하이브리드 아키텍처로 구성되어 있습니다.

## 1. 개인정보 보안 설계

| 정보 종류                                             | 저장 위치                                                      | 보호 방식                                                                                                                        |
|:------------------------------------------------- |:---------------------------------------------------------- |:---------------------------------------------------------------------------------------------------------------------------- |
| **발신자 계정 비밀번호 / API 키** (Gmail·네이버·Solapi·Resend) | **내 로컬 PC 전용 파일** (`.xmas-settings.local.json`, 권한 `0600`) | `.gitignore`로 GitHub 업로드 차단, 클라우드 DB에도 저장하지 않음                                                                               |
| **수신자 이메일 / 전화번호**                                | 클라우드 DB (`Delivery.targetAddress`)                         | **마스킹 처리(`je********@gmail.com`, `010-****-5678`)** 후 저장 — 원본 연락처 미보관                                                        |
| **카드 제작 / 관리 / 발송 / 설정 기능**                       | **내 로컬 PC 전용**                                             | Vercel 배포 시 자동으로 `PUBLIC_VIEWER_ONLY` 모드가 켜져 `/manage/*`, `/api/settings`, `/api/cards`(POST) 등 모든 관리/발송 API가 `403/404`로 차단됨 |
| **수신자 카드 보기 & 답장** (`/c/[slug]`)                  | **Vercel (24시간 공개)**                                       | 난수화된 12자리 `slug` 링크를 아는 사람만 카드를 열고 답장 가능                                                                                     |

---

## 2. 설정 및 배포 순서

### 1단계: 무료 클라우드 PostgreSQL 만들기

1. [Neon](https://neon.tech) 또는 [Supabase](https://supabase.com)에서 무료 계정을 만들고 PostgreSQL 프로젝트를 생성합니다.
2. 연결 문자열(`DATABASE_URL`, 예: `postgresql://user:password@ep-...neon.tech/neondb?sslmode=require`)을 복사합니다.

### 2단계: GitHub & Vercel 배포 (카드 열람 전용 사이트)

1. 이 프로젝트 폴더를 GitHub 저장소에 올립니다. *(이때 `.env`, `.xmas-settings.local.json`, `prisma/dev.db`는 `.gitignore`에 의해 자동으로 제외됩니다.)*
2. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 저장소 연결
3. Vercel 프로젝트 **Environment Variables**에 아래 항목 추가:
   - `DATABASE_URL`: 1단계에서 복사한 PostgreSQL 주소
4. **Deploy** 클릭 (`package.json`의 `vercel-build` 스크립트가 자동으로 PostgreSQL용 Prisma 스키마를 적용해 빌드합니다.)
5. 배포 완료 후 발급된 도메인(예: `https://my-xmas-card.vercel.app`)을 확인합니다.

### 3단계: 내 로컬 PC를 같은 PostgreSQL에 연결하기

1. 내 PC 프로젝트의 `.env` 파일에서 `DATABASE_URL`을 **1단계의 PostgreSQL 주소**로 교체합니다.
   
   ```env
   DATABASE_URL="postgresql://user:password@ep-...neon.tech/neondb?sslmode=require"
   ```

2. 터미널에서 아래 명령어를 1회 실행해 DB 테이블을 생성하고 로컬 빌드를 갱신합니다.
   
   ```bash
   npm run db:push
   npm run build
   ```

3. 바탕화면의 **크리스마스 카드** 아이콘을 실행한 뒤, 상단 **`발송 설정 → 공유 주소`** 탭에 Vercel 주소(`https://my-xmas-card.vercel.app`)를 입력하고 **`설정 저장`**을 누릅니다.
   
   - 카카오톡 공유를 사용할 경우, [카카오 디벨로퍼스](https://developers.kakao.com) Web 플랫폼에 `http://localhost:3000`과 `https://my-xmas-card.vercel.app`을 모두 등록하세요.

---

## 3. 사용 흐름

1. 내 PC(`localhost:3000`)에서 카드를 만들고 이메일·카카오톡·SMS로 발송합니다.
2. 지인에게는 `https://my-xmas-card.vercel.app/c/...` 링크가 전달되므로, **내 PC를 꺼두어도 지인이 24시간 언제든 카드를 열고 답장을 남길 수 있습니다.**
3. 나중에 내 PC에서 관리 페이지(`/manage/...`)를 열면 지인의 열람 횟수와 답장이 실시간으로 반영되어 보입니다.
