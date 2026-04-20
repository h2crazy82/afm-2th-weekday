# 프롬프트 — [Auth+DB] 쇼핑몰 (결제 기능 제외)

> 아래 내용을 Claude Code에 그대로 붙여넣고 `{{...}}` 를 본인 값으로 채워서 실행.

---

## 전제
- `week-5/community_app/` 의 Auth 코드 재활용
- Supabase 프로젝트 준비

## 쇼핑몰 주제
**{{쇼핑몰 주제 — 예: "의류" / "문구/굿즈" / "디저트/베이커리" / "식물 가게" / "중고 전자기기" / 자유}}**

## 기술 스택
- Backend: Express + Supabase
- Frontend: `public/index.html`
- 배포: Vercel

## DB 스키마
`products` 테이블 (공개):
- `id`, `name`, `price`, `image_url`, `description`, `created_at`

`cart` 테이블 (user별):
- `id`, `user_id` (auth.users FK), `product_id` (products FK), `quantity`, `created_at`

Supabase RLS:
- `products`: SELECT 전체 허용
- `cart`: SELECT/INSERT/UPDATE/DELETE 본인 것만 (`user_id = auth.uid()`)

## Part 1 — 상품 목록 (로그인 없이 접근)
상품 10개 샘플 데이터는 에이전트에게 "{{주제}} 관련 샘플 상품 10개 DB에 넣어줘" 요청.
이미지 URL은 Unsplash 같은 무료 이미지 활용.

## Part 2 — 회원가입/로그인
`community_app` 의 Auth 코드 재활용.

## Part 3 — 장바구니 (로그인 필수)
- **담기:** 상품 카드의 "장바구니 담기" 버튼 → `cart` 에 insert (수량 기본 1)
- **조회:** `/cart` 페이지에서 내 장바구니 목록 표시
- **수량 변경:** +/- 버튼
- **삭제:** 개별 X 버튼
- **합계:** 총 금액 자동 계산
- "주문하기" 버튼은 눌러도 "준비 중입니다" 알림만 (결제는 퀘스트 범위 밖)

## Part 4 — 배포
Vercel 배포 + URL 제출.

## 창의성 포인트 (선택)
- [ ] 상품 검색 / 카테고리 필터
- [ ] 재고 표시
- [ ] 위시리스트 (장바구니와 분리)
- [ ] {{본인 아이디어}}

---

## 📸 스크린샷 (25pt 목표)
- `screenshots/01-products.png` — 상품 목록
- `screenshots/02-cart-add.png` — 장바구니 담기 순간
- `screenshots/03-cart-manage.png` — 장바구니 관리 (수량 변경)
- `screenshots/04-total.png` — 합계 계산 화면

## ✅ 제출 체크
- [ ] Vercel 배포 URL
- [ ] GitHub
- [ ] 스크린샷 4장
- [ ] 에이전트 2회 이상 개선 대화
- [ ] 단톡방 공유
