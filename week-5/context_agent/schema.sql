-- work_logs: 3개 사업 시간 배분 로그
create table if not exists work_logs (
  id bigserial primary key,
  date date not null,
  business text not null check (business in ('lara_edu', 'lara_care', 'ai_fate')),
  task text not null,
  hours numeric(4,2) not null,
  outcome text,
  created_at timestamptz default now()
);

create index if not exists work_logs_date_idx on work_logs (date desc);
create index if not exists work_logs_business_idx on work_logs (business);

-- seed (최근 2주, 12건)
insert into work_logs (date, business, task, hours, outcome) values
  (current_date - 13, 'lara_edu',  '2026 인증평가 자가진단 체크리스트 작성',     3.0, '미비항목 12개 식별'),
  (current_date - 12, 'lara_care', '잠재 B2B 고객 리스트업 (제조업 10곳)',       2.5, '콜드메일 초안'),
  (current_date - 11, 'ai_fate',   '사주 해석 프롬프트 v2 튜닝',                  1.5, 'Claude 4.7로 교체'),
  (current_date - 10, 'lara_care', 'HVAC 서비스 가격표 재설계',                   2.0, '3단계 패키지 확정'),
  (current_date - 9,  'lara_edu',  '위탁훈련 총량제 영향 분석',                   4.0, '전환 시나리오 3안'),
  (current_date - 8,  'lara_care', '콜드메일 20건 발송',                          1.5, '응답 2건'),
  (current_date - 7,  'ai_fate',   '운명연구소 인스타 콘텐츠 5건 생성',           2.0, '발행 완료'),
  (current_date - 5,  'lara_edu',  '훈련과정 설계서 수정 (고용24 반려 대응)',     3.5, '재제출'),
  (current_date - 4,  'lara_care', 'B2B 미팅 (제조업 A사)',                       1.5, '견적 요청 수신'),
  (current_date - 3,  'lara_edu',  'NCS 기반 평가도구 업데이트',                  2.5, '2과목 완료'),
  (current_date - 2,  'lara_care', 'A사 견적서 작성 및 제출',                     2.0, '제출 완료'),
  (current_date - 1,  'ai_fate',   '상담 2건 진행',                               1.5, '만족도 상'),
  (current_date,      'lara_edu',  '인증평가 서류철 폴더링',                      1.0, '진행 중');
