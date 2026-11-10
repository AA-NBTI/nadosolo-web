'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Bookmark,
  Layers,
  Code2,
  FileText,
  Copy,
  Check,
  FolderTree,
  LayoutGrid,
} from 'lucide-react';

export interface StructureItem {
  id: string; // 소통용 고유 코드 (예: SEC-01-B)
  officialName: string; // 공식 소통 명칭 (예: 헤로-메인헤드카피)
  role: string; // 역할 설명
  selector: string; // 코드 태그 및 CSS 주요 규격
  ruleNote: string; // 세팅 규칙 (줄바꿈, 폰트, 폭 등)
  currentText?: string; // 현재 적용된 실제 텍스트
}

export interface SectionStructure {
  secId: string;
  secNumber: string;
  title: string;
  categoryName: string; // 대분류 명칭
  desc: string;
  componentPath: string;
  items: StructureItem[];
}

export interface PageStructureMap {
  pageId: string;
  pageTitle: string;
  routePath: string;
  desc: string;
  sections: SectionStructure[];
}

// ============================================================================
// 사이트 전 페이지 공식 소통 구조 사전 (Page Structure Dictionary)
// ============================================================================
export const SITE_PAGE_STRUCTURES: PageStructureMap[] = [
  // --------------------------------------------------------------------------
  // 0. 관리자 대시보드 (/admin) - 최고관리자 전용 규격
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_ADMIN',
    pageTitle: '관리자 대시보드',
    routePath: '/admin',
    desc: '관리자 캔버스 규격, 폭, 사이드바, 타이포그래피, 모노크롬 테마',
    sections: [
      {
        secId: 'SEC-ADMIN-01',
        secNumber: '01',
        categoryName: '화면',
        title: '영역',
        desc: '관리자 화면 가로 폭 및 패딩',
        componentPath: 'src/app/admin/page.tsx',
        items: [
          {
            id: 'SEC-ADMIN-01-A',
            officialName: '관리자-컨테이너폭',
            role: '전체 화면 최대 너비',
            selector: 'max-w-[1600px] (1,600px)',
            ruleNote: '지시 예: "폭 100 늘려", "폭 1400으로"',
            currentText: '1,600px (가용 본문: 약 1,224px)',
          },
          {
            id: 'SEC-ADMIN-01-B',
            officialName: '관리자-사이드바폭',
            role: '좌측 네비게이션 너비',
            selector: 'w-72 (288px)',
            ruleNote: '지시 예: "사이드바 폭 300으로"',
            currentText: '288px (18rem)',
          },
          {
            id: 'SEC-ADMIN-01-C',
            officialName: '관리자-가용본문폭',
            role: '우측 메인 작업 영역 너비',
            selector: '약 1,224px (1600px - 여백64px - 사이드바288px - 갭24px)',
            ruleNote: '컨테이너 및 사이드바 폭에 연동',
            currentText: '1,224px (실가용 폭)',
          },
          {
            id: 'SEC-ADMIN-01-D',
            officialName: '관리자-외곽패딩',
            role: '화면 좌우 여백',
            selector: 'px-4 sm:px-6 lg:px-8 (좌우 각 32px)',
            ruleNote: '지시 예: "여백 좁혀", "패딩 16으로"',
            currentText: '좌우 32px (총 64px)',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-02',
        secNumber: '02',
        categoryName: '폰트',
        title: '타이포',
        desc: '대시보드 10pt 미만 금지 헌법 준수 규격',
        componentPath: 'src/app/admin/page.tsx',
        items: [
          {
            id: 'SEC-ADMIN-02-A',
            officialName: '관리자-대분류폰트',
            role: '사이드바 그룹 헤더 폰트',
            selector: 'text-[15px] font-medium (15px / 약 11.25pt)',
            ruleNote: '지시 예: "대분류 폰트 1줄여", "대분류 폰트 16으로"',
            currentText: '15px (Medium 500)',
          },
          {
            id: 'SEC-ADMIN-02-B',
            officialName: '관리자-중분류폰트',
            role: '사이드바 세부 메뉴 탭 폰트',
            selector: 'text-sm font-normal (14px / 약 10.5pt)',
            ruleNote: '지시 예: "중분류 폰트 1줄여", "중분류 폰트 15로"',
            currentText: '14px (Normal 400)',
          },
          {
            id: 'SEC-ADMIN-02-C',
            officialName: '관리자-본문폰트',
            role: '리포트 및 표 본문 텍스트',
            selector: 'text-sm font-light (14px / 약 10.5pt)',
            ruleNote: '지시 예: "본문 폰트 1키워", "본문 폰트 15로"',
            currentText: '14px (Pretendard)',
          },
          {
            id: 'SEC-ADMIN-02-D',
            officialName: '관리자-타이틀폰트',
            role: '섹션 헤더 및 화면 대제목',
            selector: 'text-2xl font-serif-editorial (24px / 약 18pt)',
            ruleNote: '지시 예: "타이틀 폰트 20으로"',
            currentText: '24px (Editorial)',
          },
          {
            id: 'SEC-ADMIN-02-E',
            officialName: '관리자-최소폰트하한',
            role: '헌법 제4조 절대 하한선',
            selector: 'text-sm (14px / 약 10.5pt, 10pt 미만 영구 금지)',
            ruleNote: '전역 강제 기준 (배지·라벨 포함)',
            currentText: '14px (10.5pt 준수)',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-03',
        secNumber: '03',
        categoryName: '컬러',
        title: '모노크롬',
        desc: '헌법 제5조 모노크롬 철칙 준수',
        componentPath: 'src/app/admin/page.tsx',
        items: [
          {
            id: 'SEC-ADMIN-03-A',
            officialName: '관리자-배경컬러',
            role: '대시보드 메인 캔버스 배경색',
            selector: 'bg-[#07080a] (다크 흑색)',
            ruleNote: '무채색 모노크롬',
            currentText: '#07080a',
          },
          {
            id: 'SEC-ADMIN-03-B',
            officialName: '관리자-카드컬러',
            role: '패널 및 박스 표면색',
            selector: 'bg-[#0c0d12] (Zinc Dark)',
            ruleNote: '무채색 모노크롬',
            currentText: '#0c0d12',
          },
          {
            id: 'SEC-ADMIN-03-C',
            officialName: '관리자-보더컬러',
            role: '경계선 및 분할선 투명 라인',
            selector: 'border-white/10 (10% 투명 백색)',
            ruleNote: '유색 보더 일절 금지',
            currentText: 'rgba(255,255,255,0.10)',
          },
          {
            id: 'SEC-ADMIN-03-D',
            officialName: '관리자-포인트컬러',
            role: '유일 허용 브랜드 액센트',
            selector: 'text-[#f04f74] / bg-[#f04f74]',
            ruleNote: '상태 도트 및 활성 탭에만 절제 적용',
            currentText: '#f04f74 (딥 핑크로즈)',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-04',
        secNumber: '04',
        categoryName: '조직',
        title: '거버넌스',
        desc: '회장실 직속 안프로 사단 가·나·다·라·마 5대 프로 직보 체계',
        componentPath: 'src/app/admin/page.tsx',
        items: [
          {
            id: 'SEC-ADMIN-04-A',
            officialName: '관리자-거버넌스총괄',
            role: '회장실 직속 총괄수석실장 (안프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[0]',
            ruleNote: '회장 직속 보좌 및 5대 프로 통합 직보',
            currentText: '안프로 (Executive Chief of Staff / COO)',
          },
          {
            id: 'SEC-ADMIN-04-B',
            officialName: '관리자-감사총괄',
            role: '1순위 헌법 수호 및 감사 총괄 (가프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[1]',
            ruleNote: '10pt 미만 금지, 단일 명사, 모노크롬 감사',
            currentText: '가프로 (Chief Compliance Officer)',
          },
          {
            id: 'SEC-ADMIN-04-C',
            officialName: '관리자-기획총괄',
            role: '2순위 프로덕트 기획 총괄 (나프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[2]',
            ruleNote: '솔로 재정의, 능동 여정, 질문지 1:1 매핑',
            currentText: '나프로 (Chief Product Officer)',
          },
          {
            id: 'SEC-ADMIN-04-D',
            officialName: '관리자-개발총괄',
            role: '3순위 시스템 개발 총괄 (다프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[3]',
            ruleNote: '5×5×5 엔진, 100점 정규화, 0-Error 빌드',
            currentText: '다프로 (Chief Technology Officer)',
          },
          {
            id: 'SEC-ADMIN-04-E',
            officialName: '관리자-수익총괄',
            role: '4순위 수익성 및 퍼널 총괄 (라프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[4]',
            ruleNote: '3만원 라이선스 결제 퍼널, CVR, 정체 감지',
            currentText: '라프로 (Chief Revenue Officer)',
          },
          {
            id: 'SEC-ADMIN-04-F',
            officialName: '관리자-매칭총괄',
            role: '5순위 테이블 매칭 및 현장 관제 (마프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[5]',
            ruleNote: 'NBTI 3:3 매칭, D-1 다이닝, 대화카드 덱',
            currentText: '마프로 (Chief Field & Matching Officer)',
          },
          {
            id: 'SEC-ADMIN-04-G',
            officialName: '관리자-데이터총괄',
            role: '6순위 데이터 무결성 및 SSOT 인텔리전스 (바프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[6]',
            ruleNote: '실서버 DB SSOT 무결성 보증, 더미 0건 상시 감사',
            currentText: '바프로 (Chief Data Officer)',
          },
          {
            id: 'SEC-ADMIN-04-H',
            officialName: '관리자-운영총괄',
            role: '7순위 회원 온보딩 및 고객 경험 (사프로)',
            selector: 'EXECUTIVE_GOVERNANCE_TEAM[7]',
            ruleNote: '온보딩 완료율 100% 추적, 정체 회원 1:1 케어',
            currentText: '사프로 (Chief Experience Officer)',
          },
        ],
      },
    ],
  },
  // --------------------------------------------------------------------------
  // 1. 메인 구매 퍼널 홈 (/)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_MAIN',
    pageTitle: '메인 구매 홈',
    routePath: '/',
    desc: '구매 밸류 제안, 라이브 오픈 테이블 예약, 결제 전환 핵심 퍼널',
    sections: [
      {
        secId: 'SEC-MAIN-00',
        secNumber: '00',
        categoryName: '상단 네비게이션',
        title: '글로벌 헤더 (Global Header)',
        desc: '화면 최상단 고정 GNB 바 (1280px 폭 일치, 투명 백드롭)',
        componentPath: 'src/components/GlobalHeader.tsx',
        items: [
          {
            id: 'SEC-MAIN-00-A',
            officialName: '헤더-브랜드로고',
            role: '브랜드 로고 및 거점 안내',
            selector: 'Link > span.font-serif-editorial (26~30px) + 한글 솔로공감/나도솔로',
            ruleNote: '상단 nadosolo 영문과 하단 한글 분기 폭 100% 수직 정렬, 호버 시 핑크(#f04f74) 전환',
            currentText: 'nadosolo (솔로공감 나도솔로) • Private Salon Busan',
          },
          {
            id: 'SEC-MAIN-00-B',
            officialName: '헤더-GNB메뉴',
            role: '주요 서비스 대메뉴 링크 목록',
            selector: 'nav > Link (text-xs font-mono tracking-[0.2em])',
            ruleNote: '활성 시 text-white font-semibold, 비활성 시 text-zinc-400 font-light',
            currentText: '소셜 다이닝 | 쇼케이스 | 소셜 살롱 | 소셜 클럽 | 테마 밋업',
          },
          {
            id: 'SEC-MAIN-00-C',
            officialName: '헤더-유저유틸',
            role: '초대 뱃지 및 회원/관리자 메뉴',
            selector: 'div.flex > span.rounded-full + Link / button',
            ruleNote: '로그인 시 마이페이지/로그아웃/관리자(방패아이콘) 노출',
            currentText: 'INVITATION ONLY • [프로필] • [로그아웃] • [관리자]',
          },
        ],
      },
      {
        secId: 'SEC-MAIN-01',
        secNumber: '01',
        categoryName: '최상단 히어로',
        title: '구매 밸류 히어로 (Purchase Booking Hero)',
        desc: '서비스 본질 제안과 핵심 3대 구매 조건을 안내하는 메인 첫 화면 (8 : 4 그리드 분할)',
        componentPath: 'src/app/page.tsx (Line 160~275)',
        items: [
          {
            id: 'SEC-MAIN-01-A',
            officialName: '헤로-메타뱃지',
            role: '상단 펄스 뱃지 라벨',
            selector: 'div.inline-flex.rounded-full (text-[10px] font-mono tracking-[0.3em])',
            ruleNote: '핑크 도트(#f04f74) animate-ping 적용, 대문자 영문 표기',
            currentText: 'Curated Private Dining • Booking Hub',
          },
          {
            id: 'SEC-MAIN-01-B1',
            officialName: '헤로-헤드카피-1행',
            role: '대제목 첫 번째 줄',
            selector: 'h1 > span:first-child (font-serif-editorial 4xl~68px font-normal)',
            ruleNote: '글자 수 10~14자 내외, 줄바꿈 태그(<br>) 없이 컨테이너 폭에 맞춰 자연스럽게 배치',
            currentText: '삶의 결이 통하는 6인의 저녁,',
          },
          {
            id: 'SEC-MAIN-01-B2',
            officialName: '헤로-헤드카피-2행',
            role: '대제목 두 번째 줄 (강조 이탤릭)',
            selector: 'h1 > span:last-child (font-light italic text-[#f5f2eb]/90 mt-1)',
            ruleNote: '글자 수 13~16자 내외, 1행과 균형 유지하며 우측 카드 영역 침범 금지',
            currentText: '이번 주말 당신의 식탁을 예약하세요',
          },
          {
            id: 'SEC-MAIN-01-C',
            officialName: '헤로-설명문',
            role: '서비스 본질 및 BM 투명 고지 본문',
            selector: 'p (text-sm sm:text-base text-zinc-300 font-light leading-relaxed pt-2)',
            ruleNote: '[필수 표준] <br> 태그 일절 미사용, break-keep 미사용. 영역 끝까지 한 글자씩 꽉 차는 직사각형 블록 유지',
            currentText: '신원과 에티켓이 검증된 6인의 참가자가 엄선된 프라이빗 룸에 모여 코스 디너와 와인을 함께합니다. 식사와 주류 비용은 당일 현장에서 1/N 실비로 정산하며, 온라인 참가비 ₩30,000은 다면 관찰 엔진 라이선스 및 소셜 리포트 발행비입니다.',
          },
          {
            id: 'SEC-MAIN-01-D',
            officialName: '헤로-서브링크바',
            role: '쇼케이스 및 가이드 페이지 빠른 이동',
            selector: 'div.flex > Link (text-xs font-mono text-zinc-400 underline)',
            ruleNote: '호버 시 핑크(#f04f74) 전환, 화살표 아이콘 동반',
            currentText: '더 알아보기: [브랜드 쇼케이스 ➔] • [프로세스 가이드 ➔]',
          },
          {
            id: 'SEC-MAIN-01-E',
            officialName: '헤로-티켓스펙카드',
            role: '우측 4열 핵심 조건 요약 박스 (구매 전환 앵커)',
            selector: 'div.lg:col-span-4 (border border-white/10 p-6 bg-white/[0.02])',
            ruleNote: '온라인 결제 ₩30,000(리포트 라이선스) / 현장 1/N 실비 / 3:3 정원 / [오픈 테이블 바로 보기] 버튼',
            currentText: 'TICKET SPECIFICATIONS (온라인 ₩30,000 / 식음료 1/N / 3:3 밸런스 / 100% 검증)',
          },
        ],
      },
      {
        secId: 'SEC-MAIN-02',
        secNumber: '02',
        categoryName: '인터랙티브 바',
        title: '실시간 예약 필터 바 (Interactive Booking Filter Bar)',
        desc: '스크롤 시 상단에 부드럽게 고정되는 3대 조건 필터 바',
        componentPath: 'src/app/page.tsx (Line 280~376)',
        items: [
          {
            id: 'SEC-MAIN-02-A',
            officialName: '필터-지역선택',
            role: '모임 거점 필터 버튼 그룹',
            selector: 'div.inline-flex > button (text-xs font-mono rounded px-2.5 py-1)',
            ruleNote: '활성 시 bg-white text-black font-semibold, 비활성 시 text-zinc-400',
            currentText: '지역 전체 | 전포 | 해운대 | 서면 | 광안리',
          },
          {
            id: 'SEC-MAIN-02-B',
            officialName: '필터-테마선택',
            role: '연령 및 테마 트랙 필터 그룹',
            selector: 'div.inline-flex > button (text-xs font-mono rounded px-2.5 py-1)',
            ruleNote: '활성 시 bg-[#f04f74] text-white font-semibold',
            currentText: '테마 전체 | 5060 골든 | 3040 커리어 | 와인 페어링',
          },
          {
            id: 'SEC-MAIN-02-C',
            officialName: '필터-요일선택',
            role: '일정 요일 필터 그룹',
            selector: 'div.inline-flex > button (text-xs font-mono rounded px-2.5 py-1)',
            ruleNote: '활성 시 bg-zinc-700 text-white font-semibold',
            currentText: '요일 전체 | 금요일 | 토요일 | 일요일',
          },
          {
            id: 'SEC-MAIN-02-D',
            officialName: '필터-결과카운터및허브',
            role: '실시간 개수 안내 및 도시 변경 모달 버튼',
            selector: 'div.flex > span + button (text-xs font-mono text-zinc-400)',
            ruleNote: '클릭 시 CitySwitcherModal 오픈',
            currentText: '예약 가능 N개 테이블 • [부산 허브 변경]',
          },
        ],
      },
      {
        secId: 'SEC-MAIN-03',
        secNumber: '03',
        categoryName: '구매 메인 그리드',
        title: '라이브 오픈 테이블 카드 (Live Booking Cards Grid)',
        desc: '실제 참가 신청 및 결제가 이루어지는 핵심 테이블 카드 목록 (5 : 7 분할)',
        componentPath: 'src/app/page.tsx (Line 380~460)',
        items: [
          {
            id: 'SEC-MAIN-03-A',
            officialName: '테이블-사진및잔여석',
            role: '좌측 5열 실사 룸 사진 및 잔여석 배지',
            selector: 'div.lg:col-span-5 > img (aspect-[16/10]) + div.badge',
            ruleNote: '호버 시 scale-105 부드러운 줌, 좌측 상단 마감임박/잔여석 핑크 뱃지, 좌측 하단 지역 태그',
            currentText: '사진 프레임 + [여성 1석 잔여 / 마감 임박] + [BUSAN JEONPO]',
          },
          {
            id: 'SEC-MAIN-03-B',
            officialName: '테이블-메타라벨',
            role: '테마명 및 일정 안내 라벨',
            selector: 'div.flex > span.text-[#f04f74] • span.text-zinc-200 (text-xs font-mono)',
            ruleNote: '테마명은 브랜드 포인트 컬러(#f04f74) 강조, 일정은 text-zinc-200',
            currentText: '5060 골든 & 와인 페어링 • 매주 금요일 19:30',
          },
          {
            id: 'SEC-MAIN-03-C',
            officialName: '테이블-타이틀',
            role: '테이블 모임 공식 제목',
            selector: 'h3.font-serif-editorial (text-2xl sm:text-3xl font-normal text-white)',
            ruleNote: '호버 시 text-[#f5f2eb] 전환, leading-snug',
            currentText: '금요 프라이빗 내추럴 와인 & 셰프 디너',
          },
          {
            id: 'SEC-MAIN-03-D',
            officialName: '테이블-설명문',
            role: '다이닝 코스 및 분위기 상세 설명',
            selector: 'p (text-xs sm:text-sm text-zinc-300 font-light leading-relaxed)',
            ruleNote: '[필수 표준] <br> 없이 영역 끝까지 한 글자 단위로 매끄럽게 개행되는 직사각형 텍스트 블록',
            currentText: '소음과 외부 시선이 차단된 프라이빗 룸에서 제철 재료로 빚어낸 셰프의 시그니처 코스와 엄선된 와인을 즐깁니다.',
          },
          {
            id: 'SEC-MAIN-03-E',
            officialName: '테이블-장소및스펙태그',
            role: '매장명 핀 아이콘 및 3대 특징 뱃지',
            selector: 'div.flex > MapPin + div.tags (text-[10px] font-mono)',
            ruleNote: '매장명 앞에 핑크 맵핀, 하단에 3개 사각 태그 나열',
            currentText: '장소: 비스트로 아틀리에 • [3:3 엄선 큐레이션] [단독 룸 대관] [소셜 리포트 발행]',
          },
          {
            id: 'SEC-MAIN-03-F',
            officialName: '테이블-가격및신청버튼',
            role: '가격 표시 및 즉시 예약 결제 CTA 버튼',
            selector: 'div.flex > span.text-2xl (₩30,000) + button (신청하기)',
            ruleNote: '버튼 클릭 시 CheckoutModal(토스페이먼츠 및 환불규정) 즉시 팝업',
            currentText: '₩30,000 (리포트 라이선스) • 식음료 1/N 현장 결제 • [신청하기 ➔]',
          },
        ],
      },
      {
        secId: 'SEC-MAIN-04',
        secNumber: '04',
        categoryName: '구매 안심 프로세스',
        title: '참여 4단계 프로세스 (4-Step Dining Protocol)',
        desc: '신청 후 모임 당일과 사후 리포트까지의 진행 과정을 안내하여 구매 망설임 해소',
        componentPath: 'src/app/page.tsx (Line 465~525)',
        items: [
          {
            id: 'SEC-MAIN-04-A',
            officialName: '여정-1단계신청',
            role: 'PHASE 01: 온라인 결제 및 매너 서약 안내',
            selector: 'div.p-6.border > span.font-mono (text-[#f04f74] text-xl) + h3 + p',
            ruleNote: '온라인 라이선스 ₩30,000 결제 및 매너 서약 완료',
            currentText: '01 온라인 참가 신청 (INSTANT BOOKING)',
          },
          {
            id: 'SEC-MAIN-04-B',
            officialName: '여정-2단계매칭',
            role: 'PHASE 02: 3:3 밸런스 테이블 편성 안내',
            selector: 'div.p-6.border > span.font-mono (text-[#f04f74] text-xl) + h3 + p',
            ruleNote: '연령·성비·소셜 모드 사전 조율 및 안내',
            currentText: '02 테이블 큐레이션 (CURATED SEATING)',
          },
          {
            id: 'SEC-MAIN-04-C',
            officialName: '여정-3단계디너',
            role: 'PHASE 03: 1/N 실비 정산 및 식사 안내',
            selector: 'div.p-6.border > span.font-mono (text-[#f04f74] text-xl) + h3 + p',
            ruleNote: '프라이빗 룸, 셰프 코스, 현장 테이블 1/N 분할 결제',
            currentText: '03 프라이빗 디너 (PRIVATE DINING & 1/N)',
          },
          {
            id: 'SEC-MAIN-04-D',
            officialName: '여정-4단계리포트',
            role: 'PHASE 04: 상호평가 완료 후 리포트 해금',
            selector: 'div.p-6.border > span.font-mono (text-[#f04f74] text-xl) + h3 + p',
            ruleNote: '상호평가 완료 시 5대 앵커 메타인지 리포트 열람',
            currentText: '04 소셜 리포트 해금 (METAPERCEPTION REPORT)',
          },
        ],
      },
      {
        secId: 'SEC-MAIN-05',
        secNumber: '05',
        categoryName: '핵심 서비스 안내',
        title: '신뢰 및 환불 정책 고지 (Trust & Refund Assurance)',
        desc: '무단 불참 차단, 100% 전액 환불 기준 투명 고지',
        componentPath: 'src/app/page.tsx (Line 530~585)',
        items: [
          {
            id: 'SEC-MAIN-05-A',
            officialName: '안심-환불규정보증',
            role: '모임 48시간 전 취소 시 100% 환불 보증',
            selector: 'div.border > ShieldCheck + h4 + p',
            ruleNote: '48시간 전 전액 환불, 24시간 전 50%, 당일 취소 시 패널티 부과',
            currentText: '100% 투명 환불 보증제 (48시간 전 취소 시 즉시 전액 환불)',
          },
          {
            id: 'SEC-MAIN-05-B',
            officialName: '안심-노쇼대체시스템',
            role: '당일 결원 발생 시 신뢰 회원 자동 긴급 투입 시스템',
            selector: 'div.border > Users + h4 + p',
            ruleNote: '6인 정원(3:3) 무결점 보장',
            currentText: '실시간 스탠바이 긴급 투입 (3:3 테이블 정원 무결성 보장)',
          },
        ],
      },
      {
        secId: 'SEC-MAIN-06',
        secNumber: '06',
        categoryName: '하단 푸터',
        title: '글로벌 푸터 (Global Footer)',
        desc: '사업자 법정 정보, 약관 링크, 저작권 고지 (1280px 폭 일치)',
        componentPath: 'src/components/GlobalFooter.tsx',
        items: [
          {
            id: 'SEC-MAIN-06-A',
            officialName: '푸터-사업자정보',
            role: '상호, 대표자, 사업자등록번호, 통신판매업, 소재지',
            selector: 'footer > div.text-xs.text-zinc-500.font-light',
            ruleNote: '법정 고지 사항 100% 표기',
            currentText: '상호: 솔로공감 나도솔로 • 사업자등록번호: 000-00-00000',
          },
          {
            id: 'SEC-MAIN-06-B',
            officialName: '푸터-약관링크',
            role: '이용약관, 개인정보처리방침, 환불규정, 문의하기',
            selector: 'footer > div.flex > Link (text-xs text-zinc-400)',
            ruleNote: '모달 또는 별도 페이지 연결',
            currentText: '이용약관 | 개인정보처리방침 | 취소 및 환불규정 | 고객센터',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 2. 소셜 다이닝 상세 (/dining)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_DINING',
    pageTitle: '소셜 다이닝',
    routePath: '/dining',
    desc: '다이닝 챕터별 코스 소개, 엄선 제휴 매장 큐레이션, 에티켓 서약',
    sections: [
      {
        secId: 'SEC-DINING-01',
        secNumber: '01',
        categoryName: '다이닝 히어로',
        title: '다이닝 챕터 히어로 (Dining Chapter Hero)',
        desc: '부산 엄선 프라이빗 룸 다이닝 큐레이션 헤드',
        componentPath: 'src/app/dining/page.tsx (Line 80~150)',
        items: [
          {
            id: 'SEC-DINING-01-A',
            officialName: '다이닝헤로-타이틀',
            role: '다이닝 페이지 대제목',
            selector: 'h1.font-serif-editorial (text-4xl~6xl)',
            ruleNote: '부산 전포·해운대·서면 3대 거점 다이닝 제안',
            currentText: '부산 프라이빗 소셜 다이닝',
          },
          {
            id: 'SEC-DINING-01-B',
            officialName: '다이닝헤로-설명문',
            role: '엄선 룸 대관 및 1/N 실비 정산 원칙',
            selector: 'p.font-light.leading-relaxed',
            ruleNote: '온라인 ₩30,000 / 현장 식음료 1/N 실비 투명 명시',
            currentText: '외부 소음과 시선이 완벽히 차단된 단독 룸에서 제철 셰프 코스와 와인을 나눕니다.',
          },
        ],
      },
      {
        secId: 'SEC-DINING-02',
        secNumber: '02',
        categoryName: '챕터 목록',
        title: '다이닝 챕터별 카드 (Dining Chapters)',
        desc: '금요 전포, 토요 해운대, 주말 서면 3대 챕터 상세',
        componentPath: 'src/app/dining/page.tsx (Line 155~240)',
        items: [
          {
            id: 'SEC-DINING-02-A',
            officialName: '챕터-전포와인디너',
            role: 'CHAPTER 01: 금요 전포 내추럴 와인 & 셰프 디너',
            selector: 'div.chapter-card-01',
            ruleNote: '3:3 큐레이션 / 여성 1석 잔여',
            currentText: '금요 프라이빗 내추럴 와인 & 셰프 디너 (비스트로 아틀리에)',
          },
          {
            id: 'SEC-DINING-02-B',
            officialName: '챕터-해운대오션디너',
            role: 'CHAPTER 02: 토요 해운대 오션 테라스 코스 페어링',
            selector: 'div.chapter-card-02',
            ruleNote: '5060 골든 트랙 / 여성 2석 잔여',
            currentText: '토요 해운대 오션 테라스 코스 페어링 (오션 스위트 다이닝)',
          },
          {
            id: 'SEC-DINING-02-C',
            officialName: '챕터-서면살롱디너',
            role: 'CHAPTER 03: 주말 갈라 프라이빗 아카이브 다이닝',
            selector: 'div.chapter-card-03',
            ruleNote: '대화 플레이북 키트 완비 / 인비테이션 접수중',
            currentText: '주말 갈라 프라이빗 아카이브 다이닝 (까사 아카이브 살롱)',
          },
        ],
      },
      {
        secId: 'SEC-DINING-03',
        secNumber: '03',
        categoryName: '엄선 공간 갤러리',
        title: '제휴 베뉴 큐레이션 (Curated Partner Venues)',
        desc: '테이블 간격 3m, 앰비언트 음향, 전담 셰프 매장 소개',
        componentPath: 'src/app/dining/page.tsx (Line 245~310)',
        items: [
          {
            id: 'SEC-DINING-03-A',
            officialName: '베뉴-매장스펙카드',
            role: '비스트로 아틀리에 / 오션 스위트 / 까사 아카이브',
            selector: 'div.grid-cols-3 > div.venue-card',
            ruleNote: '실사 이미지 + 위치 + 특장점 뱃지',
            currentText: '비스트로 아틀리에 • 오션 스위트 라운지 • 까사 아카이브 살롱',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. 브랜드 쇼케이스 (/showcase)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_SHOWCASE',
    pageTitle: '브랜드 쇼케이스',
    routePath: '/showcase',
    desc: '브랜드 세계관, 롤링 히어로, 다면 관찰 엔진 리포트 비주얼 쇼케이스',
    sections: [
      {
        secId: 'SEC-SHOWCASE-01',
        secNumber: '01',
        categoryName: '롤링 비주얼',
        title: '비주얼 롤링 히어로 (SectorRollingHero)',
        desc: '모듈러 비주얼 롤링 배너 및 핵심 가치 슬라이더',
        componentPath: 'src/components/sectors/SectorRollingHero.tsx',
        items: [
          {
            id: 'SEC-SHOWCASE-01-A',
            officialName: '쇼케이스-롤링배너',
            role: '살롱 전경 및 디너 테이블 롤링 이미지',
            selector: 'div.rolling-hero-container',
            ruleNote: '자동 슬라이드 및 인디케이터',
            currentText: '프라이빗 살롱 다이닝 & 소셜 메타인지 플랫폼',
          },
        ],
      },
      {
        secId: 'SEC-SHOWCASE-02',
        secNumber: '02',
        categoryName: '다면 관찰 엔진',
        title: '소셜 미러 리포트 쇼케이스 (SectorSocialMirror)',
        desc: '5대 단일 명사 앵커와 레이더 차트 미리보기',
        componentPath: 'src/components/sectors/SectorSocialMirror.tsx',
        items: [
          {
            id: 'SEC-SHOWCASE-02-A',
            officialName: '쇼케이스-레이더차트',
            role: '5×5×5 다면 평가 레이더 차트 그래픽',
            selector: 'div.radar-chart-container',
            ruleNote: '질문/미소/경청/배려/시선 5대 단일 명사 지표',
            currentText: '타인의 시선으로 발견하는 나의 소통 강점 리포트',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 4. 프로세스 가이드 (/guide)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_GUIDE',
    pageTitle: '프로세스 가이드',
    routePath: '/guide',
    desc: '참가 신청부터 테이블 매너 서약, 현장 1/N 정산, 리포트 발행 전 과정 상세 안내',
    sections: [
      {
        secId: 'SEC-GUIDE-01',
        secNumber: '01',
        categoryName: '가이드 헤로',
        title: '진행 여정 총괄 (Guide Hero)',
        desc: '참가자가 경험하게 될 4단계 투명 프로토콜',
        componentPath: 'src/app/guide/page.tsx',
        items: [
          {
            id: 'SEC-GUIDE-01-A',
            officialName: '가이드-헤드라인',
            role: '가이드 페이지 대제목',
            selector: 'h1.font-serif-editorial',
            ruleNote: '단계별 안심 안내',
            currentText: '나도솔로 다이닝 가이드 & 에티켓 헌장',
          },
        ],
      },
      {
        secId: 'SEC-GUIDE-02',
        secNumber: '02',
        categoryName: '정산 안내',
        title: '1/N 현장 정산 원칙 (Settlement Guide)',
        desc: '온라인 라이선스비 ₩30,000과 식음료 현장 카드 결제 원칙 분리 안내',
        componentPath: 'src/app/guide/page.tsx',
        items: [
          {
            id: 'SEC-GUIDE-02-A',
            officialName: '가이드-정산안내블록',
            role: '식음료 비용 투명 고지',
            selector: 'div.settlement-card',
            ruleNote: '당일 식당에서 참가자들이 1/N 실비로 직접 결제함을 명시',
            currentText: '식음료 대금은 현장에서 테이블 1/N 실비 결제 (나도솔로 수취 일절 없음)',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 5. 마이 대시보드 (/dashboard)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_DASHBOARD',
    pageTitle: '마이 대시보드',
    routePath: '/dashboard',
    desc: '내 소셜 리포트 열람, 동석자 상호평가 입력기, 신청 내역 관리',
    sections: [
      {
        secId: 'SEC-DASH-01',
        secNumber: '01',
        categoryName: '회원 상태바',
        title: '프로필 및 신뢰 지수 바 (Member Trust Bar)',
        desc: '현재 로그인 회원의 프로필, 신뢰점수(100점), 보유 뱃지',
        componentPath: 'src/app/dashboard/page.tsx',
        items: [
          {
            id: 'SEC-DASH-01-A',
            officialName: '대시-프로필요약',
            role: '닉네임, 매너등급, 신뢰점수',
            selector: 'div.profile-summary-bar',
            ruleNote: '80점 이상 시 우수 회원 뱃지',
            currentText: '홍길동 회원님 • 신뢰점수 94점 • 골든 매너 뱃지',
          },
        ],
      },
      {
        secId: 'SEC-DASH-02',
        secNumber: '02',
        categoryName: '상호평가 해금',
        title: '상호평가 잠금해제 락커 (Reciprocal Evaluation Unlocker)',
        desc: '동석자 전원 평가 완료 시에만 내 리포트가 해금되는 상호주의 시스템',
        componentPath: 'src/app/dashboard/page.tsx',
        items: [
          {
            id: 'SEC-DASH-02-A',
            officialName: '대시-상호평가락커',
            role: '동석자 5인 관찰 평가 완료 프로그레스 바',
            selector: 'div.reciprocal-unlock-card',
            ruleNote: '5/5 완료 시 리포트 열람 버튼 활성화',
            currentText: '동석자 관찰 평가 100% 완료 시 내 소셜 리포트 해금',
          },
        ],
      },
    ],
  },
  // --------------------------------------------------------------------------
  // 5-1. 솔로 소통 성향 자가진단 (/test)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_TEST',
    pageTitle: '솔로 소통 성향 자가진단',
    routePath: '/test',
    desc: '5개 문항 기반 소통 템포, 식탁 취향, 만남 목적 진단 및 아키타입 기준선 측정',
    sections: [
      {
        secId: 'SEC-TEST-01',
        secNumber: '01',
        categoryName: '인터랙티브 진단 카드',
        title: '소통 성향 5문항 카드 컨테이너',
        desc: '모바일 반응형 1문항 1카드 선택지 및 진행도 프로그레스',
        componentPath: 'src/app/test/page.tsx',
        items: [
          {
            id: 'SEC-TEST-01-A',
            officialName: '진단-진행바',
            role: '문항 진행률 게이지',
            selector: 'div.h-1.bg-white > div.bg-[#f04f74]',
            ruleNote: '1문항 응답 시마다 폭 20% 증가',
            currentText: 'QUESTION 01 / 05',
          },
          {
            id: 'SEC-TEST-01-B',
            officialName: '진단-선택카드',
            role: 'A/B 선택지 카드 버튼',
            selector: 'button.w-full.text-left',
            ruleNote: '선택 시 #f04f74 테두리 및 180ms 후 다음 문항 자동 전환',
            currentText: '질문을 먼저 건네며 테이블의 물꼬를 트는 화자형',
          },
          {
            id: 'SEC-TEST-01-C',
            officialName: '진단-결과아키타입',
            role: '진단 완료 시 산출된 소통 유형 및 4대 단일명사 앵커 뱃지',
            selector: 'h3.font-serif-editorial + div.anchors',
            ruleNote: '단일 명사 헌법 준수 앵커 표출',
            currentText: '여백을 품은 경청자 (#경청, #여백, #시선, #품격)',
          },
        ],
      },
    ],
  },
  // --------------------------------------------------------------------------
  // 6. 관리자 파이프라인 관제 대시보드 (/admin)
  // --------------------------------------------------------------------------
  {
    pageId: 'PAGE_ADMIN_PIPELINE',
    pageTitle: '관리자 파이프라인 관제',
    routePath: '/admin',
    desc: '매칭 & 다면 관제 파이프라인 6단계 모듈 제어 및 가상 시뮬레이터',
    sections: [
      {
        secId: 'SEC-ADMIN-PIPE-01',
        secNumber: '01',
        categoryName: '파이프라인 모듈 리스트',
        title: '파이프라인 엔진 마스터 리스트 (Pipeline Engine Master List)',
        desc: '0~6층 파이프라인 모듈 전체를 한눈에 조망하고 클릭 시 상세 진입하는 마스터 뷰',
        componentPath: 'src/components/admin/AdminPipelineEngineManager.tsx',
        items: [
          {
            id: 'SEC-ADMIN-PIPE-01-A',
            officialName: '어드민-모듈마스터리스트',
            role: '6개 파이프라인 모듈 카드 리스트 (클릭 시 상세 진입)',
            selector: 'div.cursor-pointer.group > h4',
            ruleNote: '모듈별 사용자 노출 ON/OFF 뱃지, 엔진 가동 상태, 규칙 수 표기',
            currentText: '1~6층 모듈 마스터 리스트 (클릭 시 세부 규칙 설정 화면 진입)',
          },
          {
            id: 'SEC-ADMIN-PIPE-01-B',
            officialName: '어드민-시뮬레이터실행버튼',
            role: '가상 120명 합성 데이터 매칭 시뮬레이터 원클릭 실행',
            selector: 'button (border-[#f04f74] bg-black/60)',
            ruleNote: '실행 시 제약 위반 수(0건 목표), 결성 테이블 수, 궁합 지수 즉시 산출',
            currentText: '가상 120명 시뮬레이션 실행',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-PIPE-02',
        secNumber: '02',
        categoryName: '모듈 세부 규칙 제어',
        title: '모듈 상세 드릴다운 뷰 (Module Detail Drill-down Screen)',
        desc: '마스터 리스트에서 클릭하여 진입한 모듈의 조건 및 평가 노출 여부 독립 설정 패널',
        componentPath: 'src/components/admin/AdminPipelineEngineManager.tsx',
        items: [
          {
            id: 'SEC-ADMIN-PIPE-02-A',
            officialName: '어드민-사용자노출토글',
            role: '모듈 및 세부 조건의 사용자 화면 노출/비노출 여부 제어',
            selector: 'button.flex.items-center.gap-1.5 > span',
            ruleNote: '노출 ON 시 핑크로즈(#f04f74), 비노출 OFF 시 무채색 텍스트',
            currentText: '사용자 노출 ON / 비노출 OFF',
          },
          {
            id: 'SEC-ADMIN-PIPE-02-B',
            officialName: '어드민-하드제약스위치',
            role: '위반 시 즉시 탈락 하드 제약 여부 토글',
            selector: 'button (하드 제약 / 일반 기준)',
            ruleNote: '하드 제약 시 위반 0건 강제 검증 대상 등록',
            currentText: '하드 제약 (위반 즉시 탈락)',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-EVAL-01',
        secNumber: '03',
        categoryName: '평가엔진 도메인 리스트',
        title: '5대 도메인 × 5대 기준 평가엔진 (Eval Engine Manager)',
        desc: '5대 도메인 및 5대 기준을 컴팩트 목록으로 먼저 조망하고 클릭 시 세부 슬롯 진입',
        componentPath: 'src/components/admin/AdminEvalEngineManager.tsx',
        items: [
          {
            id: 'SEC-ADMIN-EVAL-01-A',
            officialName: '어드민-도메인마스터리스트',
            role: '5대 도메인 및 5대 기준 컴팩트 행 목록 (클릭 시 5개 슬롯 상세 진입)',
            selector: 'div.cursor-pointer.group > div > span',
            ruleNote: '도메인별 활성 슬롯 수(5/5) 및 100점 환산 표기',
            currentText: '5대 도메인 컴팩트 목록',
          },
          {
            id: 'SEC-ADMIN-EVAL-01-B',
            officialName: '어드민-슬롯평가토글',
            role: '도메인 내 세부 단일명사 슬롯 평가 포함/제외 제어',
            selector: 'button (평가 포함 ON / 평가 제외 OFF)',
            ruleNote: '단일 명사 1요소 원칙 준수',
            currentText: '평가 포함 ON / 평가 제외 OFF',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-SINGLE-01',
        secNumber: '04',
        categoryName: '시스템 테스트',
        title: '1인 테스트',
        desc: '1인 단위 질문 모듈 테스트 및 매칭 검증',
        componentPath: 'src/components/admin/AdminSingleAuditReportManager.tsx',
        items: [
          {
            id: 'SEC-ADMIN-SINGLE-01-A',
            officialName: '어드민-1인테스트리스트',
            role: '등록된 1인 테스트 케이스 비교 체크 컴팩트 목록',
            selector: 'div.cursor-pointer.group > div > span',
            ruleNote: '인적사항, 목적, 8옥탄트 성향(W/D), 추정 궁합 점수 표기',
            currentText: '1인 테스트 대상자 비교 목록',
          },
          {
            id: 'SEC-ADMIN-SINGLE-01-B',
            officialName: '어드민-매칭시뮬레이션보고서',
            role: '1인의 1~6층 모듈별 점수 및 최종 6인 테이블 룸 편성 보고서',
            selector: 'div.matching-report-panel',
            ruleNote: '동석자 5인 명단, 1:1 궁합도, 하드 제약 안전성 검증 결과',
            currentText: '최종 6인 테이블 매칭 및 동석자 궁합 보고서',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-TEST-REPORT-01',
        secNumber: '05',
        categoryName: '시스템 점검',
        title: '프로세스 점검',
        desc: '회원 자격증명(aa, bb, admin/aa1111) 및 6단계 프로세스 검증',
        componentPath: 'src/components/admin/AdminProcessTestReportManager.tsx',
        items: [
          {
            id: 'SEC-ADMIN-TEST-REPORT-01-A',
            officialName: '어드민-검증계정리스트',
            role: 'aa, bb, admin 계정 아이디, 핸들, 비밀번호(aa1111) 자격증명 컴팩트 목록',
            selector: 'div.border.border-white\\/10 > div',
            ruleNote: '클릭 시 하위 상세(이메일, 직무, 역할, 진입경로) 펼침',
            currentText: '검증 회원 자격증명 목록',
          },
          {
            id: 'SEC-ADMIN-TEST-REPORT-01-B',
            officialName: '어드민-프로세스동선보고서',
            role: 'P01~P10 6개 핵심 프로세스 검증 결과 및 브라우저 재현 가이드',
            selector: 'div.border.border-white\\/10 > div',
            ruleNote: '리스트 우선 조망 ➔ 클릭 시 입출력 및 동선 재현 가이드 노출',
            currentText: '프로세스별 검증 상태 및 동선 단계',
          },
          {
            id: 'SEC-ADMIN-TEST-REPORT-01-C',
            officialName: '어드민-아키텍처변경대조표',
            role: 'Before(기존 아키텍처) vs After(개편 아키텍처) 세부 대조 및 헌법 근거/영향도 지표',
            selector: 'div.border.border-white\\/10 > div.transition-colors',
            ruleNote: 'Before(기존 문제점) vs After(해결책) 2열 대조 카드 및 헌법 조항 명시',
            currentText: '아키텍처 변경 비교 (Before vs After) 대조표',
          },
        ],
      },
      {
        secId: 'SEC-ADMIN-AUDIT-REPORT-01',
        secNumber: '06',
        categoryName: '보고서',
        title: '프로세스 점검 보고 & 관리자 최종 승인',
        desc: '6단계 프로세스 검증 항목별 테스트 결과 및 관리자 서명 승인 보드',
        componentPath: 'src/components/admin/AdminAuditReportManager.tsx',
        items: [
          {
            id: 'SEC-ADMIN-AUDIT-01-A',
            officialName: '보고-계획로드맵',
            role: '6단계 프로세스 진행 현황 및 승인율 조망',
            selector: 'div.grid.grid-cols-1.sm:grid-cols-2.lg:grid-cols-3',
            ruleNote: '단계별 승인 건수 및 완료 상태 뱃지 렌더링',
            currentText: '계획 및 단계별 승인율',
          },
          {
            id: 'SEC-ADMIN-AUDIT-01-B',
            officialName: '보고-체크리스트',
            role: '1줄 컴팩트 항목 목록 ➔ 클릭 시 검증 시나리오 및 승인 버튼 노출',
            selector: 'div.border.border-white\\/10 > div',
            ruleNote: '리스트 우선 조망 철칙 준수, 단일 명사 필터 적용',
            currentText: '점검 항목 세부 내역',
          },
          {
            id: 'SEC-ADMIN-AUDIT-01-C',
            officialName: '보고-최종승인보드',
            role: '관리자 최종 승인 판정 및 서명 현황 보고서',
            selector: 'div.p-5.border.border-white\\/15',
            ruleNote: '가동 승인 상태 및 승인일시 자동 기록',
            currentText: '나도솔로 정식 서비스 가동 승인 보고서',
          },
        ],
      },
    ],
  },
];

const PAGE_SHORT_TITLES: Record<string, string> = {
  PAGE_ADMIN: '관리자',
  PAGE_MAIN: '메인',
  PAGE_DINING: '다이닝',
  PAGE_SHOWCASE: '쇼케이스',
  PAGE_GUIDE: '가이드',
  PAGE_DASHBOARD: '대시보드',
  PAGE_TEST: '진단',
  PAGE_ADMIN_PIPELINE: '파이프라인',
};

interface AdminDesignSystemInspectorProps {
  theme?: 'light' | 'dark';
}

export default function AdminDesignSystemInspector({
  theme = 'dark',
}: AdminDesignSystemInspectorProps) {
  const isDark = theme === 'dark';

  // [페이지 선택기] 기본값: 관리자 대시보드
  const [selectedPageId, setSelectedPageId] = useState<string>('PAGE_ADMIN');

  // 개별 규격 항목 펼침 상태 (기본: 모두 닫힘)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // 현재 선택된 페이지 구조 맵
  const currentPage =
    SITE_PAGE_STRUCTURES.find((p) => p.pageId === selectedPageId) ||
    SITE_PAGE_STRUCTURES[0];

  // 대분류 섹션 기본 닫힘(Collapsed) 처리
  const [collapsedSections, setCollapsedSections] = useState<string[]>(() =>
    currentPage.sections.map((s) => s.secId)
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 페이지 변경 시 해당 페이지의 모든 섹션을 기본 닫힘으로 초기화
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setExpandedItemId(null);
    const targetPage = SITE_PAGE_STRUCTURES.find((p) => p.pageId === pageId);
    if (targetPage) {
      setCollapsedSections(targetPage.sections.map((s) => s.secId));
    }
  };

  // 단일 섹션 접기/펼치기 토글
  const toggleSection = (secId: string) => {
    setCollapsedSections((prev) =>
      prev.includes(secId)
        ? prev.filter((id) => id !== secId)
        : [...prev, secId]
    );
  };

  // 전체 섹션 한 번에 접기
  const collapseAll = () => {
    setCollapsedSections(currentPage.sections.map((s) => s.secId));
    setExpandedItemId(null);
  };

  // 전체 섹션 한 번에 펼치기
  const expandAll = () => {
    setCollapsedSections([]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalItemsCount = currentPage.sections.reduce(
    (acc, sec) => acc + sec.items.length,
    0
  );

  return (
    <div className="space-y-4">
      {/* ==============================================================
          1. 상단 인트로 헤더 & 페이지 선택 탭
          ============================================================== */}
      <div
        className={`p-5 border ${
          isDark
            ? 'bg-[#0c0d12] border-white/10'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
            <h2
              className={`font-mono text-xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              디자인
            </h2>
            <span
              className={`text-sm font-mono ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              {totalItemsCount}건
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={collapseAll}
              className={`px-3 py-1.5 border text-sm font-mono transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                  : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              접기
            </button>
            <button
              type="button"
              onClick={expandAll}
              className={`px-3 py-1.5 border text-sm font-mono transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                  : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              펼치기
            </button>
          </div>
        </div>

        {/* [페이지 탭] */}
        <div className="pt-3.5 flex flex-wrap items-center gap-2">
          {SITE_PAGE_STRUCTURES.map((p) => {
            const isSelected = p.pageId === selectedPageId;
            const shortTitle = PAGE_SHORT_TITLES[p.pageId] || p.pageTitle;
            return (
              <button
                key={p.pageId}
                type="button"
                onClick={() => handleSelectPage(p.pageId)}
                className={`px-3 py-1.5 text-sm font-mono transition-all cursor-pointer border ${
                  isSelected
                    ? isDark
                      ? 'border-white/40 bg-white/15 text-white font-bold'
                      : 'border-zinc-900 bg-zinc-900 text-white font-bold'
                    : isDark
                    ? 'border-white/10 bg-transparent text-zinc-400 hover:text-white hover:border-white/20'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {shortTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          2. 대분류 아코디언 2열 그리드 리스트 (기본 접힘, 클릭 시 펼침)
          ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {currentPage.sections.map((sec) => {
          const isCollapsed = collapsedSections.includes(sec.secId);

          return (
            <div
              key={sec.secId}
              className={`border transition-all ${
                isDark
                  ? 'border-white/[0.08] bg-[#0c0d12]'
                  : 'border-zinc-200 bg-white shadow-sm'
              } ${isCollapsed ? '' : 'col-span-full'}`}
            >
              {/* [대분류 섹션 헤더] 클릭 시 접기/펼치기 */}
              <div
                onClick={() => toggleSection(sec.secId)}
                className={`p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                  isDark
                    ? isCollapsed
                      ? 'bg-transparent hover:bg-white/[0.02]'
                      : 'border-b border-white/10 bg-white/[0.03]'
                    : isCollapsed
                    ? 'bg-white hover:bg-zinc-50'
                    : 'border-b border-zinc-200 bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono text-sm px-2 py-0.5 font-bold border shrink-0 ${
                      isDark
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-zinc-900 border-zinc-900 text-white'
                    }`}
                  >
                    {sec.secId}
                  </span>

                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="text-sm font-mono text-zinc-300 font-semibold uppercase shrink-0">
                      [{sec.categoryName}]
                    </span>
                    <h3
                      className={`text-sm font-bold font-mono truncate ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {sec.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-sm font-mono shrink-0">
                  <span
                    className={`px-2 py-0.5 border ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {sec.items.length}건
                  </span>
                  <span
                    className={`p-1 border ${
                      isDark
                        ? 'border-white/10 text-zinc-400'
                        : 'border-zinc-200 text-zinc-600'
                    }`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>

              {/* [하위 요소 리스트] 2열 그리드로 한눈에 조망 ➔ 클릭 시 상세 확장 (Click-to-Reveal) */}
              {!isCollapsed && (
                <div
                  className={`p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 ${
                    isDark ? 'bg-black/30' : 'bg-zinc-50'
                  }`}
                >
                  {sec.items.map((item) => {
                    const isItemExpanded = expandedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`border transition-colors ${
                          isDark
                            ? 'border-white/10 bg-[#0c0d12]'
                            : 'border-zinc-200 bg-white'
                        } ${
                          isItemExpanded
                            ? isDark
                              ? 'col-span-full border-white/30 bg-white/[0.04]'
                              : 'col-span-full border-zinc-400 bg-zinc-100'
                            : isDark
                            ? 'hover:border-white/20 hover:bg-white/[0.02]'
                            : 'hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        {/* 1단계: 초간결 1줄 직관 조망 행 */}
                        <div
                          onClick={() =>
                            setExpandedItemId(isItemExpanded ? null : item.id)
                          }
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3 shrink-0">
                              {isItemExpanded ? '▾' : '▸'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-sm font-mono border shrink-0 ${
                                isDark
                                  ? 'bg-white/10 text-white font-semibold border-white/20'
                                  : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                              }`}
                            >
                              {item.id}
                            </span>
                            <span
                              className={`text-sm font-bold font-mono truncate ${
                                isDark ? 'text-white' : 'text-zinc-900'
                              }`}
                            >
                              {item.officialName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-sm font-mono px-2 py-0.5 border ${
                                isDark
                                  ? 'bg-white/5 border-white/10 text-zinc-300'
                                  : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                              }`}
                            >
                              {item.role}
                            </span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                                isItemExpanded ? 'rotate-90 text-white' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* 2단계: 클릭 시 상세 키-값 카드 펼침 (Click-to-Reveal) */}
                        {isItemExpanded && (
                          <div
                            className={`px-6 py-4 border-t grid grid-cols-1 md:grid-cols-3 gap-3 text-sm ${
                              isDark
                                ? 'bg-black/40 border-white/[0.06]'
                                : 'bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <div
                              className={`p-3 border space-y-1 ${
                                isDark
                                  ? 'bg-white/[0.02] border-white/10'
                                  : 'bg-white border-zinc-200'
                              }`}
                            >
                              <span className="text-sm font-mono text-zinc-400 block font-semibold">
                                [호출 명칭]
                              </span>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`font-mono font-bold ${
                                    isDark ? 'text-white' : 'text-zinc-900'
                                  }`}
                                >
                                  {item.officialName}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(item.officialName, item.id);
                                  }}
                                  className="text-sm text-white hover:underline cursor-pointer"
                                >
                                  {copiedId === item.id ? '복사됨' : '복사'}
                                </button>
                              </div>
                            </div>

                            <div
                              className={`p-3 border space-y-1 ${
                                isDark
                                  ? 'bg-white/[0.02] border-white/10'
                                  : 'bg-white border-zinc-200'
                              }`}
                            >
                              <span className="text-sm font-mono text-zinc-400 block font-semibold">
                                [설정 규칙 및 지시어]
                              </span>
                              <p
                                className={`font-mono ${
                                  isDark ? 'text-white' : 'text-zinc-800'
                                }`}
                              >
                                {item.ruleNote}
                              </p>
                            </div>

                            <div
                              className={`p-3 border space-y-1 ${
                                isDark
                                  ? 'bg-white/[0.02] border-white/10'
                                  : 'bg-white border-zinc-200'
                              }`}
                            >
                              <span className="text-sm font-mono text-zinc-400 block font-semibold">
                                [현재 설정값 / 화면 문구]
                              </span>
                              <p
                                className={
                                  isDark ? 'text-zinc-200' : 'text-zinc-700'
                                }
                              >
                                {item.currentText || item.selector}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==============================================================
          3. 하단 바 (단일 액션 및 간결화)
          ============================================================== */}
      <div
        className={`p-3.5 border flex items-center justify-between gap-3 text-sm font-mono ${
          isDark
            ? 'border-white/10 bg-[#0c0d12]'
            : 'border-zinc-200 bg-white shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
            호출명칭
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const allNames = currentPage.sections
              .flatMap((s) =>
                s.items.map((i) => `[${i.id}] ${i.officialName} : ${i.selector}`)
              )
              .join('\n');
            copyToClipboard(allNames, 'ALL');
          }}
          className={`px-3 py-1 border text-sm font-mono transition-all cursor-pointer shrink-0 ${
            isDark
              ? 'bg-white/5 border-white/20 hover:border-white text-zinc-200 hover:text-white'
              : 'bg-zinc-900 border-zinc-900 hover:bg-zinc-800 text-white'
          }`}
        >
          {copiedId === 'ALL' ? '완료' : '복사'}
        </button>
      </div>
    </div>
  );
}
