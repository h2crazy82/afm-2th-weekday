# 프롬프트 — [Auth] 커뮤니티 앱

> 아래 내용을 Claude Code에 그대로 붙여넣고 `{{...}}` 를 본인 값으로 채워서 실행.

---

## 전제
- `week-4/quest/board` (익명 게시판) 구조를 복제해서 시작
- Supabase Auth 활성화 (Email + Password 방식)

## 커뮤니티 주제
**{{커뮤니티 주제 한 줄 — 부트캠프 2기}}**

## 기술 스택
- Backend: Express + Supabase (Auth + DB)
- Frontend: `public/index.html`
- 배포: Vercel

## DB 스키마
`posts` 테이블:
- `id`, `title`, `content`, `user_id` (auth.users FK), `created_at`

Supabase RLS 정책:
- SELECT: 로그인한 누구나
- INSERT: 로그인한 본인만 (`user_id = auth.uid()`)
- UPDATE/DELETE: 본인 글만 (`user_id = auth.uid()`)

## Part 1 — 회원가입 / 로그인
- 이메일 + 비밀번호
- 로그인 상태 유지 (session)
- 로그아웃 버튼

## Part 2 — 게시글 CRUD
- **작성:** 로그인 필수. 제목 + 내용 입력 → `user_id` 자동 첨부
- **조회:** 전체 게시글, 작성자 이름(또는 이메일) 표시
- **수정/삭제:** 본인 글만 (UI 상에서도 남의 글엔 버튼 숨기기)

## Part 3 — 목록 화면
- 최신순
- 제목 / 작성자 / 작성시간
- 클릭 → 상세 페이지 (또는 모달)

## Part 4 — 배포 & 공유
- Vercel 배포
- 배포 URL을 **가족/친구/수강생 1명 이상**에게 공유 → 실제 가입 & 글 작성 확인
- 타인 글쓰기 스크린샷 반드시 캡처 (+5pt)

---

## 📸 스크린샷 (25pt 목표)
- `screenshots/01-signup.png` — 회원가입 화면
- `screenshots/02-login.png` — 로그인 후 상태
- `screenshots/03-write.png` — 글쓰기 화면
- `screenshots/04-list.png` — 게시글 목록 (본인 + 타인 글 공존)
- `screenshots/05-other-user.png` — **타인이 쓴 글 (+5pt 보너스)**

## ✅ 제출 체크
- [ ] Vercel 배포 URL
- [ ] GitHub
- [ ] 스크린샷 5장 (타인 인증 포함)
- [ ] 에이전트 2회 이상 개선 대화
- [ ] 단톡방 공유
