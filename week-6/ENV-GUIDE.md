# 환경변수 채우기 가이드

> Q3 (`shopping_mall_v2`)와 Q4 (`paid_content`)의 `.env` 파일에 들어가는 값을 어디서 어떻게 가져오는지 단계별 안내.
>
> **자동 채워진 항목**: Supabase URL, Supabase Anon Key (Supabase MCP로 자동 조회 후 .env에 저장됨 ✅)
>
> **사용자가 채워야 하는 항목**: 5개 (Q3) / 2개 (Q4) — 아래 표 참고

## ✅ 이미 자동으로 채워진 값

두 .env 파일에 다음 값은 이미 들어가 있음:

| 키 | 값 |
|----|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gtyyriwpaixkalaupbsp.supabase.co` (afm-2th 프로젝트) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` (legacy anon JWT) |

---

## ⚠️ 사용자가 채워야 하는 값

### Q3 + Q4 공통 — 3개

#### 1. `SUPABASE_SERVICE_ROLE_KEY`

서버 사이드에서 RLS 우회용 키. **노출되면 모든 데이터 마음대로 조작 가능 → 클라이언트에 절대 노출 금지** (그래서 NEXT_PUBLIC_ 접두어 안 붙음).

**가져오는 곳**:
1. https://supabase.com/dashboard 접속
2. 좌측 프로젝트 목록에서 **afm-2th** 선택
3. 좌측 톱니바퀴 → **Project Settings** → **API**
4. "Project API keys" 섹션에서 **`service_role`** 행 → "Reveal" 클릭 → 복사
5. 두 .env 파일 모두에 붙여넣기

**모양**: `eyJhbGciOiJI...` (JWT 형식, anon key랑 비슷하지만 다른 값)

#### 2. `NEXT_PUBLIC_TOSS_CLIENT_KEY` + `TOSS_SECRET_KEY`

토스페이먼츠 결제 위젯용 (테스트 키).

**가져오는 곳**:
1. https://developers.tosspayments.com/ 로그인
2. 좌측 **내 개발정보** → 첫 화면이 키 목록
3. **테스트 모드** 탭에서:
   - **클라이언트 키** → `NEXT_PUBLIC_TOSS_CLIENT_KEY` (예: `test_ck_...`)
   - **시크릿 키** → `TOSS_SECRET_KEY` (예: `test_sk_...`)
4. 두 .env 파일 모두에 붙여넣기

> 💡 **이미 발급받아 둔 상태**라고 하셨음 — 키가 어디 있는지만 다시 확인.

---

### Q3 전용 — 추가 4개

#### 3. ImageKit 3종 (`NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`, `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`)

상품 이미지 업로드용.

**가져오는 곳**:
1. https://imagekit.io/dashboard 접속
2. 좌측 **Developer Options** → **API Keys**
3. 다음 3개 복사:
   - **URL Endpoint** (예: `https://ik.imagekit.io/your_account_name`) → `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
   - **Public Key** (예: `public_...`) → `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
   - **Private Key** (예: `private_...`) → `IMAGEKIT_PRIVATE_KEY` (⚠️ 노출 금지)
4. Q3 `.env`에만 추가 (Q4는 안 씀)

#### 4. `RESEND_API_KEY` (선택 — 비워도 동작)

주문 확인 이메일 발송용 (창의성 보너스 5pt).

**가져오는 곳**:
1. https://resend.com/ 가입 (Google/GitHub 로그인)
2. 좌측 **API Keys** → **Create API Key** → 이름 "shopping-mall-v2"
3. 생성된 `re_...` 복사 → Q3 `.env`의 `RESEND_API_KEY`에 붙여넣기

> 💡 이 키 없이도 결제는 정상 동작. 단지 결제 후 이메일이 안 발송됨. 비워두면 코드가 자동으로 스킵.
>
> 💡 무료 티어: 발신 도메인 검증 없이 `onboarding@resend.dev`에서 본인 이메일로만 발송 가능 (테스트용 충분).

---

## 📋 채우기 체크리스트

`.env` 파일을 직접 열어서 채워도 되고, 다음 명령어로 한 번에 채워도 됨:

```bash
# Q3
cd week-6/shopping_mall_v2
$EDITOR .env   # 또는 cursor / code .env

# Q4
cd ../paid_content
$EDITOR .env
```

### Q3 (`week-6/shopping_mall_v2/.env`) 체크리스트
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase 대시보드 → Project Settings → API → service_role)
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY` (test_ck_...)
- [ ] `TOSS_SECRET_KEY` (test_sk_...)
- [ ] `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
- [ ] `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
- [ ] `IMAGEKIT_PRIVATE_KEY`
- [ ] `RESEND_API_KEY` (선택, 비워도 됨)

### Q4 (`week-6/paid_content/.env`) 체크리스트
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Q3와 동일 값)
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY` (Q3와 동일 값)
- [ ] `TOSS_SECRET_KEY` (Q3와 동일 값)
- [ ] `ANTHROPIC_API_KEY` (선택 — 프리미엄 AI 생성 기능. 비워두면 /custom 라우트가 "AI 모듈 셋업 중" 안내만 노출)

#### `ANTHROPIC_API_KEY` 발급 (선택, Q4 프리미엄용)

`/custom` 라우트의 AI 맞춤 프롬프트 생성 기능에 필요. 비우면 결제 차단됨 (서비스는 정상).

**가져오는 곳**:
1. https://console.anthropic.com/ 가입/로그인
2. 좌측 **API Keys** → **Create Key**
3. 이름 "paid-content-prod" 입력 → 생성된 `sk-ant-...` 복사
4. **결제 등록 필수** (https://console.anthropic.com/settings/plans) — 최소 $5 충전 후 사용 가능
5. Q4 `.env`의 `ANTHROPIC_API_KEY=`에 붙여넣기

**모델**: 기본값으로 `claude-haiku-4-5` 사용 (1회 생성당 약 ₩30~80 비용 추정).

---

## 🚀 채우기 끝나면 다음 단계

`.env`만 채우면 **나머지는 내가 자동 처리**:

1. **로컬 빌드 검증** — `next build`로 문제 없는지 확인
2. **Vercel CLI 배포** — `vercel link` + `vercel env add` (각 키 자동 등록) + `vercel --prod`
3. **두 앱의 production URL을 README에 자동 업데이트**

채우기 끝났으면 **"채웠어"** 또는 **"배포 시작"**이라고 알려줘.

---

## 🔒 보안 메모

- `.env`는 `.gitignore`에 들어가 있어서 GitHub에 안 올라감 ✅
- Vercel 환경변수에 등록 후엔 `.env`는 로컬에만 존재
- `SUPABASE_SERVICE_ROLE_KEY`, `TOSS_SECRET_KEY`, `IMAGEKIT_PRIVATE_KEY`는 절대 클라이언트(브라우저)로 가지 않음 — 모두 서버 라우트에서만 사용
