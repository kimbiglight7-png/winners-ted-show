# 위너스 TED쇼

청중과 발표자를 연결하는 실시간 설문 플랫폼

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **DB**: Supabase (PostgreSQL + Realtime + Auth)
- **배포**: Vercel

---

## 빠른 시작

### 1. 패키지 설치

```bash
npm install
```

### 2. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/schema.sql` 전체 내용을 **SQL Editor**에서 실행
3. **Authentication > Users** 에서 관리자 계정 생성

### 3. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase 프로젝트의 값을 입력:
- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings > API > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role

### 4. 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000

---

## 페이지 구조

| URL | 대상 | 설명 |
|-----|------|------|
| `/` | 청중 | 발표 목록 및 설문 입장 |
| `/survey/[roomId]` | 청중 | 설문 참여 (3문항) |
| `/results/[roomId]` | 청중 | 공개된 결과 열람 |
| `/admin` | 관리자 | 로그인 |
| `/admin/dashboard` | 관리자 | 발표 관리, 방 생성/개폐 |
| `/admin/[roomId]` | 관리자 | 실시간 응답 확인, 결과 공개 |

---

## 관리자 운영 흐름

1. `/admin`에서 로그인
2. `/admin/dashboard`에서 **"발표 추가"** 클릭 → 발표 정보 입력
3. 방이 생성되면 청중에게 `/survey/{roomId}` 링크 공유
4. 발표 종료 후 **"설문 종료"** 클릭
5. **"결과 공개하기"** 클릭 → 청중에게 `/results/{roomId}` 링크 공유

---

## Vercel 배포

1. GitHub에 push
2. [vercel.com](https://vercel.com)에서 레포 import
3. Environment Variables에 `.env.local` 값들 추가
4. Deploy

---

## 설문 항목

1. **좋았던 점** — 발표 내용 중 인상적이거나 유익했던 부분
2. **보완할 점** — 더 발전시키면 좋을 부분이나 아쉬웠던 점
3. **궁금한 점** — 발표 내용과 관련해 더 알고 싶은 것
