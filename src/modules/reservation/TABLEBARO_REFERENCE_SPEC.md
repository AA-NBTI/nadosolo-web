# 테이블바로(TABLEBARO) 공식 레퍼런스 기준서

> **목적**: 테이블바로가 임의 개발로 기능을 누락하지 않도록 **1단계(테이블링)** → **2단계(캐치테이블)** 표준 기능을 1:1 체크리스트로 고정하고 검증한다.

---

## 1단계 레퍼런스: 테이블링 (Tabling) — 현장·원격 웨이팅 및 기본 예약

| 코드 | 기능명 | 구현 상태 | 담당 파일 |
| :---: | :--- | :---: | :--- |
| TB-01 | 매장 탐색 목록 및 업종·지역 검색 (`/reserve`) | ✅ 완료 | `src/app/reserve/page.tsx`, `src/app/api/reservations/public/route.ts` |
| TB-02 | 무가입 3초 사전 예약 및 내 예약 조회·취소 (`/reserve/my`) | ✅ 완료 | `src/app/reserve/[resourceId]/page.tsx`, `src/app/reserve/my/page.tsx` |
| TB-03 | 원격 줄서기(웨이팅) 번호표 발급 및 중복 방지 | ✅ 완료 | `src/modules/reservation/waiting.ts`, `src/app/api/reservations/waiting/route.ts` |
| TB-04 | 실시간 내 대기 순번("내 앞에 N팀") 조회 및 손님 대기 취소 | ✅ 완료 | `src/app/reserve/[resourceId]/page.tsx`, `src/app/api/reservations/waiting/route.ts` |
| TB-05 | 사장님 웨이팅 관제 (`입장호출` · `착석` · `노쇼`) | ✅ 완료 | `src/app/biz/page.tsx`, `src/app/api/partners/reservations/route.ts` |
| TB-06 | 피크타임 원격 웨이팅 접수 일시정지/마감 토글 | ✅ 완료 | `src/modules/reservation/waiting.ts`, `src/app/biz/page.tsx` |
| TB-07 | 알림 발송 어댑터 (카카오 알림톡 / SMS) | ⏳ 예정 | 알림톡/SMS 연동 어댑터 신설 필요 |

---

## 2단계 레퍼런스: 캐치테이블 (Catch Table) — 고도화된 좌석·매출 관리

| 코드 | 기능명 | 구현 상태 | 담당 파일 |
| :---: | :--- | :---: | :--- |
| CT-01 | 복수 유닛(홀/룸/바) · 브레이크타임 · 특정일 휴무 | ✅ 완료 | `src/modules/reservation/availability.ts` |
| CT-02 | 실시간 홀 테이블 보드 ↔ 당일 온라인 잔여석 연동 | ✅ 완료 | `src/modules/reservation/availability.ts`, `src/app/biz/page.tsx` |
| CT-03 | 요일별 차등 영업시간(평일 vs 주말) UI | ✅ 완료 | `src/app/biz/page.tsx`, `src/modules/reservation/availability.ts` |
| CT-04 | DB 레벨 동시성 락(오픈런 중복 차단 RPC) | ⏳ 보완 | Supabase RPC 트랜잭션 락 추가 |
| CT-05 | 고객 CRM (방문·노쇼 배지 + 메모 + 블랙리스트 차단) | ✅ 완료 | `src/app/biz/page.tsx`, `src/app/api/partners/reservations/route.ts` |
| CT-06 | 매장 리치 프로필 (대표 사진 · 메뉴 · 주차/콜키지 태그) | ✅ 완료 | `src/app/biz/page.tsx`, `src/app/reserve/page.tsx`, `src/app/reserve/[resourceId]/page.tsx` |
| CT-07 | 선결제 예약 및 환불 정산 (PG) | ✅ 완료 | `src/modules/payment`, `src/app/api/reservations/pay/route.ts` |
