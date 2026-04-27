# 🗺 PROJECT MINIMAP — 라라에듀 AI 콘텐츠 빌더 한눈에 보기

> MISSION / DEV / AUDIENCES 3종 문서를 7개 다이어그램으로 시각화. GitHub에서 자동 렌더링됨.
> 막히거나 PR 리뷰할 때 "왜 만들지?" "어디까지 했지?" 답하는 사령탑.

---

## 1. 📦 Plan Hub — 전체 문서 구조 + 흐름

기획서 3종이 어떻게 7주차 MVP → 8주차 데모데이 → Phase 2 SaaS로 이어지는가.

```mermaid
flowchart TB
    classDef doc fill:#fef3c7,stroke:#d97706,color:#92400e,font-weight:bold
    classDef mvp fill:#dbeafe,stroke:#2563eb,color:#1e40af,font-weight:bold
    classDef demo fill:#dcfce7,stroke:#16a34a,color:#15803d,font-weight:bold
    classDef phase2 fill:#fce7f3,stroke:#db2777,color:#9f1239,font-weight:bold

    M[MISSION.md<br/>왜 / 누구를 위해]:::doc
    D[DEV.md<br/>어떻게 / 무엇을]:::doc
    A[AUDIENCES.md<br/>어떻게 알릴지]:::doc

    MVP[7주차 MVP<br/>Day1~7]:::mvp
    Beta[8주차 베타<br/>라라에듀 직원 7명]:::mvp
    Demo[데모데이<br/>김지원 PM 발표]:::demo

    Sales5[거래처 5사 무료 베타]:::phase2
    LI[LinkedIn HRD 그룹]:::phase2
    Conf[한국HRD협회 발표]:::phase2

    M --> D
    M --> A
    D --> MVP
    MVP --> Beta
    Beta --> Demo
    A --> Sales5
    Sales5 --> LI
    LI --> Conf
    Demo --> Sales5
```

---

## 2. 🔄 김지원 PM의 하루 — Before vs After

도구가 PM 한 명의 워크플로우를 어떻게 바꾸는지 가시화. **이 변화가 안 일어나면 도구는 실패**.

```mermaid
flowchart LR
    classDef pain fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef gain fill:#d1fae5,stroke:#059669,color:#064e3b

    subgraph BEFORE [현재 — 야근 30 퍼센트]
        direction TB
        B1[09:00 견적 시스템<br/>신규 4-5건]:::pain
        B2[11:00 1차 매핑<br/>수동]:::pain
        B3[14:00 ReportLab<br/>자동 6페이지]:::pain
        B4[15:00 사례 3개<br/>PPT 30번 켜기]:::pain
        B5[20:00 야근<br/>또는 토요일]:::pain
        B1 --> B2 --> B3 --> B4 --> B5
    end

    subgraph AFTER [목표 — 30분 / 1건]
        direction TB
        A1[09:00 신규 4-5건]:::gain
        A2[09:30 도구에 회사 정보<br/>업로드]:::gain
        A3[09:35 AI 1차 초안<br/>차시별]:::gain
        A4[09:55 채팅 수정<br/>이 부분만 디테일]:::gain
        A5[10:00 MD 다운로드<br/>발송]:::gain
        A1 --> A2 --> A3 --> A4 --> A5
    end

    BEFORE -.->|10배 단축| AFTER
```

---

## 3. 🏗 MVP Architecture — 7주차에 만드는 것

데이터 흐름 + 외부 의존. 박스 하나가 빠지면 MVP 안 돌아감.

```mermaid
flowchart TB
    classDef ui fill:#e0e7ff,stroke:#4f46e5,color:#3730a3
    classDef api fill:#fef3c7,stroke:#d97706,color:#92400e
    classDef db fill:#fce7f3,stroke:#db2777,color:#9f1239
    classDef ext fill:#f3e8ff,stroke:#9333ea,color:#6b21a8

    PM([라라에듀 PM])

    subgraph Frontend [Next.js App Router on Vercel]
        UI1[고객사 등록 폼]:::ui
        UI2[채팅 인터페이스]:::ui
        UI3[고객사별 이력]:::ui
        UI4[MD 다운로드 버튼]:::ui
    end

    subgraph Backend [Server Components + Route Handlers]
        Auth[Supabase Auth<br/>이메일+비밀번호]:::api
        StreamAPI[Vercel AI SDK<br/>토큰 스트리밍]:::api
    end

    subgraph DB [(Supabase Postgres)]
        T1[client_companies<br/>252사]:::db
        T2[content_assets<br/>라라에듀 5차시 시드]:::db
        T3[generation_sessions]:::db
        T4[session_messages<br/>user/assistant]:::db
    end

    Claude[Claude API<br/>haiku-4-5 / sonnet-4-6]:::ext
    Storage[Supabase Storage<br/>로고 업로드 - Phase2]:::ext

    PM --> UI1 --> Auth
    UI1 --> T1
    UI2 --> StreamAPI --> Claude
    Claude -.system prompt.-> T2
    StreamAPI --> T4
    UI3 --> T3
    T3 --> T4
    T4 --> UI4
```

---

## 4. 📅 7주차 ~ 데모데이 Gantt

```mermaid
gantt
    title 7주차 MVP 구현 + 8주차 발표 (총 14일)
    dateFormat YYYY-MM-DD
    axisFormat %m/%d
    section 7주차 MVP
    Setup + Auth          :w7a, 2026-05-04, 2d
    고객사 폼/목록        :w7b, after w7a, 1d
    Claude API + 스트리밍 :crit, w7c, after w7b, 2d
    채팅 이력 + 재방문    :w7d, after w7c, 1d
    MD 다운로드 + 배포    :w7e, after w7d, 1d
    section 8주차 발표
    김지원 실사용 1라운드 :crit, w8a, 2026-05-11, 2d
    데모 시나리오 작성    :w8b, after w8a, 2d
    슬라이드 10장         :w8c, after w8b, 2d
    데모데이              :milestone, w8d, after w8c, 0d
    section 졸업 후
    거래처 5사 콜드콜     :p2a, after w8d, 14d
    HRD테크설래투 게시기  :p2b, after p2a, 7d
```

---

## 5. 👥 페르소나 × 채널 매핑

누구를 어디서 만날지. **A는 옆자리, C는 LinkedIn에서 — 메시지는 다르게**.

```mermaid
flowchart LR
    classDef p1 fill:#dbeafe,stroke:#2563eb,color:#1e40af
    classDef p2 fill:#dcfce7,stroke:#16a34a,color:#15803d
    classDef p3 fill:#fce7f3,stroke:#db2777,color:#9f1239
    classDef ch fill:#f1f5f9,stroke:#64748b,color:#334155

    P1[페르소나 A<br/>김지원<br/>라라에듀 PM 35]:::p1
    P2[페르소나 B<br/>박정욱<br/>제조업체 HRD 47]:::p2
    P3[페르소나 C<br/>이수정<br/>대기업 HRD 41]:::p3

    C1[옆자리<br/>1번 사용자]:::ch
    C2[HRD테크설래투<br/>네이버 카페 1.2만]:::ch
    C3[LinkedIn 한국 HRD<br/>약 8천명]:::ch
    C4[한국HRD협회<br/>오프라인 100-200]:::ch
    C5[직접 콜드콜<br/>라라에듀 거래처]:::ch

    P1 -->|0주차| C1
    P2 -->|2-3개월| C2
    P2 -->|2-3개월| C5
    P3 -->|3-6개월| C3
    P3 -->|3-6개월| C4

    Stage1[STAGE 1<br/>내부 검증]
    Stage2[STAGE 2<br/>기존 거래처 5명]
    Stage3[STAGE 3<br/>외부 5명]

    C1 --> Stage1 --> Stage2
    C2 --> Stage3
    C5 --> Stage2
    C3 --> Stage3
    C4 --> Stage3
```

---

## 6. 🎯 경쟁사 포지셔닝 — 우리가 노릴 빈 자리

```mermaid
quadrantChart
    title 경쟁사 vs 라라에듀 빌더 — 가격대 × 한국 제조업 특화도
    x-axis 글로벌 표준 --> 한국 제조업 특화
    y-axis 저가 (PM 1명 월 5만원) --> 고가 (연 3천만+)
    quadrant-1 고가 + 특화 (희소)
    quadrant-2 고가 + 글로벌 (Docebo Sana 영역)
    quadrant-3 저가 + 글로벌 (없음 — 가능성)
    quadrant-4 저가 + 특화 (블루오션 ★)
    Docebo: [0.2, 0.85]
    Sana Labs: [0.15, 0.8]
    휴넷: [0.7, 0.55]
    "라라에듀 빌더 (target)": [0.95, 0.2]
```

> **블루오션 가설**: 한국 제조업 직무 교육 콘텐츠 자동 맞춤화 + PM 1명 월 5만원 가격대.
> Docebo·Sana는 글로벌·고가, 휴넷은 콘텐츠 표준화 → **빈 사분면 4번**.

---

## 7. 🧠 Definition of Success — 합격 / 실패 신호

3개월 시점 기준. 이 기준 안 맞으면 즉시 피봇.

```mermaid
mindmap
  root((3개월 합격 기준))
    PM 실사용
      매주 5건 신규 견적<br/>이 도구로
      4-8h → 30분 이하<br/>10배 단축
      라라에듀 PM 2명<br/>완전 정착
    외부 검증
      거래처 1곳 이상<br/>실제 공급
      만족도 인터뷰 1회<br/>인용 가능 후기
      재계약 동의 1건
    실패 신호 즉시 피봇
      김지원 PM 1주<br/>'PPT가 빠르겠어요'
      Claude API 비용<br/>월 견적의 20%+
      거래처 만족도<br/>'기존 자료 더 좋다'
    Phase 2 진입 트리거
      베타 5명 NPS 30+
      WAU 도구당 2회+
      자발적 추천 1건+
```

---

## 8. ⚠️ Pre-mortem — "실패한다면 왜?"

DEV.md §5 위험 요소를 인과 그래프로.

```mermaid
flowchart TB
    classDef root fill:#fee2e2,stroke:#dc2626,color:#7f1d1d,font-weight:bold
    classDef cause fill:#fef3c7,stroke:#d97706,color:#92400e
    classDef fix fill:#d1fae5,stroke:#059669,color:#064e3b

    Fail([3개월 후 실패]):::root

    C1[김지원이 안 씀]:::cause
    C2[Claude API 비용 폭주]:::cause
    C3[고객사 자료 품질 낮음]:::cause
    C4[기획만 있고 코드 없음]:::cause

    F1[7주차 시작 전<br/>30분 인터뷰 → 워크플로우 매핑]:::fix
    F2[haiku-4-5 메인<br/>+ prompt cache]:::fix
    F3[5차시 시드 → RAG 진화<br/>벡터 DB 도입]:::fix
    F4[Day 7까지 무조건 배포<br/>완성도 50%여도 OK]:::fix

    C1 --> Fail
    C2 --> Fail
    C3 --> Fail
    C4 --> Fail

    F1 -.해결.-> C1
    F2 -.해결.-> C2
    F3 -.해결.-> C3
    F4 -.해결.-> C4
```

---

## 9. 🔁 결정 트리 — 막혔을 때 펼쳐볼 의사결정

핵심 결정 5개를 의사결정 흐름으로.

```mermaid
flowchart TD
    Q1{기능 추가<br/>요청 들어옴} --> A1{MVP 핵심 3개<br/>중 하나?}
    A1 -->|YES| Build[즉시 구현]
    A1 -->|NO| A2{8주차 데모에<br/>꼭 필요?}
    A2 -->|YES| Phase1B[7주차 후반에 추가]
    A2 -->|NO| Backlog[Phase 2 백로그]

    Q2{생성 결과<br/>품질 낮음} --> A3{원인은?}
    A3 -->|컨텍스트 부족| AddAsset[content_assets 시드 추가]
    A3 -->|모델 한계| Upgrade[sonnet-4-6 업그레이드<br/>+ 비용 모니터]
    A3 -->|프롬프트 부족| RefinePrompt[system prompt 개선]

    Q3{Claude 비용<br/>견적 20% 초과} --> Cache[prompt cache 도입]
    Q3 --> Throttle[하루 N회 제한]
    Q3 --> Sonnet[복잡한 건만 sonnet]
```

---

## 📍 Quick Index

| 섹션 | 무엇을 보여주나 | 언제 펼쳐 보나 |
|------|----------------|---------------|
| 1. Plan Hub | 3종 문서 → MVP → 데모 → Phase 2 | 신규 합류자에게 5분 브리핑 |
| 2. Before/After | 김지원 PM의 하루 변화 | 영업 / 발표 슬라이드 만들 때 |
| 3. MVP Architecture | 7주차에 만들 시스템 | 코딩 시작 전 / PR 리뷰 |
| 4. Gantt | 14일 일정 | 매일 아침 진척 점검 |
| 5. 페르소나 × 채널 | 누구에게 어떻게 알릴지 | AUDIENCES.md 액션 짤 때 |
| 6. 경쟁사 포지셔닝 | 우리가 노릴 빈 자리 | 가격 / 메시지 결정할 때 |
| 7. Success / 실패 신호 | 3개월 기준 | 매주 회고 |
| 8. Pre-mortem | 실패하면 왜? + 해결책 | 위험 신호 보일 때 |
| 9. 결정 트리 | 막혔을 때 의사결정 | 새 요청·이슈 들어올 때 |

---

> **이 미니맵의 메타 규칙**:
> - 다이어그램이 텍스트 문서를 대체하지 않음 — 네비게이션이지 본문 아님
> - 코드 / 일정이 변하면 이 파일도 같이 변경 (분기당 1회 점검)
> - 새 다이어그램 추가는 환영, 단 본문 9개 → 12개 넘으면 분리 검토
