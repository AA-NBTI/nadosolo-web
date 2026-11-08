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
];

interface AdminDesignSystemInspectorProps {
  theme?: 'light' | 'dark';
}

export default function AdminDesignSystemInspector({
  theme = 'dark',
}: AdminDesignSystemInspectorProps) {
  const isDark = theme === 'dark';

  // [페이지 선택기] 기본값: 메인 구매 홈
  const [selectedPageId, setSelectedPageId] = useState<string>('PAGE_MAIN');

  // 현재 선택된 페이지 구조 맵
  const currentPage =
    SITE_PAGE_STRUCTURES.find((p) => p.pageId === selectedPageId) ||
    SITE_PAGE_STRUCTURES[0];

  // [사용자 요청 1 핵심] 대분류 섹션 기본 닫힘(Collapsed) 처리!
  // 초기 상태: 모든 대분류의 secId를 collapsedSections에 넣어 기본 '접힘' 상태로 시작!
  const [collapsedSections, setCollapsedSections] = useState<string[]>(() =>
    currentPage.sections.map((s) => s.secId)
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 페이지 변경 시 해당 페이지의 모든 섹션을 기본 닫힘으로 초기화
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
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
    <div className="space-y-6">
      {/* ==============================================================
          1. 상단 인트로 헤더 & 페이지 선택 탭
          ============================================================== */}
      <div
        className={`p-6 border ${
          isDark
            ? 'bg-[#0c0d12] border-white/10'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-transparent text-[#f04f74] border border-[#f04f74]/60">
                PAGE ARCHITECTURE DICTIONARY
              </span>
              <span
                className={`text-[11px] font-mono ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                총 {SITE_PAGE_STRUCTURES.length}개 페이지 •{' '}
                {currentPage.sections.length}대 분류 • {totalItemsCount}개 공식
                요소
              </span>
            </div>
            <h2
              className={`font-serif-editorial text-2xl font-normal mt-1 ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              사이트 화면 구조 및 공식 소통 명칭 사전
            </h2>
            <p
              className={`text-xs mt-1 font-light leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              사용자와 AI 간의 소통 오류를 원천 차단하기 위해 화면 영역을{' '}
              <strong>[대분류 ➔ 중분류 ➔ 소분류]</strong>로 표준화한 공식
              사전입니다. 각 대분류를 클릭하면 세부 항목이 펼쳐집니다.
            </p>
          </div>

          {/* 전체 접기/펼치기 원클릭 액션 버튼 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={collapseAll}
              className={`px-3 py-1.5 border text-xs font-mono transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                  : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              전체 접기
            </button>
            <button
              type="button"
              onClick={expandAll}
              className={`px-3 py-1.5 border text-xs font-mono transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                  : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              전체 펼치기
            </button>
          </div>
        </div>

        {/* [페이지 선택 탭 바] 등록된 전 페이지 빠른 전환 */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-mono mr-1 ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            페이지 선택:
          </span>
          {SITE_PAGE_STRUCTURES.map((p) => {
            const isSelected = p.pageId === selectedPageId;
            return (
              <button
                key={p.pageId}
                type="button"
                onClick={() => handleSelectPage(p.pageId)}
                className={`px-3 py-1.5 text-xs font-mono transition-all cursor-pointer border ${
                  isSelected
                    ? isDark
                      ? 'border-[#f04f74] bg-[#f04f74]/15 text-[#f04f74] font-bold'
                      : 'border-zinc-900 bg-zinc-900 text-white font-bold'
                    : isDark
                    ? 'border-white/10 bg-transparent text-zinc-400 hover:text-white hover:border-white/20'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span>{p.pageTitle}</span>
                <span className="opacity-60 ml-1.5 text-[10px]">
                  ({p.routePath})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          2. 대분류 아코디언 리스트 (기본 접힘, 클릭 시 펼침)
          ============================================================== */}
      <div className="space-y-3">
        {currentPage.sections.map((sec) => {
          const isCollapsed = collapsedSections.includes(sec.secId);

          return (
            <div
              key={sec.secId}
              className={`border transition-all ${
                isDark
                  ? 'border-white/[0.08] bg-[#0c0d12]'
                  : 'border-zinc-200 bg-white shadow-sm'
              }`}
            >
              {/* [대분류 섹션 헤더] 클릭 시 접기/펼치기 */}
              <div
                onClick={() => toggleSection(sec.secId)}
                className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b transition-colors ${
                  isDark
                    ? isCollapsed
                      ? 'border-transparent bg-transparent hover:bg-white/[0.02]'
                      : 'border-white/10 bg-white/[0.03]'
                    : isCollapsed
                    ? 'border-transparent bg-white hover:bg-zinc-50'
                    : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs sm:text-sm px-2.5 py-1 font-bold border ${
                      isDark
                        ? 'bg-[#f04f74]/15 border-[#f04f74]/40 text-[#f04f74]'
                        : 'bg-zinc-900 border-zinc-900 text-white'
                    }`}
                  >
                    {sec.secId}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#f04f74] font-semibold uppercase tracking-wider">
                        {sec.categoryName}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span
                        className={`text-[10px] font-mono ${
                          isDark ? 'text-zinc-400' : 'text-zinc-500'
                        }`}
                      >
                        {sec.componentPath}
                      </span>
                    </div>
                    <h3
                      className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {sec.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span
                    className={`px-2 py-0.5 border ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {sec.items.length}개 요소
                  </span>
                  <span
                    className={`p-1 rounded-none border ${
                      isDark
                        ? 'border-white/10 text-zinc-400'
                        : 'border-zinc-200 text-zinc-600'
                    }`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </div>
              </div>

              {/* [중분류/소분류 요소 테이블 리스트] - 펼쳤을 때만 렌더링 */}
              {!isCollapsed && (
                <div
                  className={`divide-y ${
                    isDark ? 'divide-white/5' : 'divide-zinc-200'
                  }`}
                >
                  {sec.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start transition-colors ${
                        isDark
                          ? 'hover:bg-white/[0.015]'
                          : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* 1열: 소통용 공식 명칭 및 복사 버튼 (3열) */}
                      <div className="lg:col-span-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                              isDark
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                            }`}
                          >
                            {item.id}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(item.officialName, item.id)
                            }
                            className={`inline-flex items-center gap-1 text-[11px] font-mono cursor-pointer transition-colors ${
                              isDark
                                ? 'text-zinc-400 hover:text-white'
                                : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                            title="공식 명칭 복사하기"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3 h-3 text-[#f04f74]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="text-[10px]">
                              {copiedId === item.id ? '복사됨' : '복사'}
                            </span>
                          </button>
                        </div>

                        {/* 공식 호출 명칭 (강조) */}
                        <div
                          className={`font-mono text-sm sm:text-base font-bold tracking-tight ${
                            isDark ? 'text-white' : 'text-zinc-900'
                          }`}
                        >
                          {item.officialName}
                        </div>

                        <p
                          className={`text-xs font-light leading-relaxed ${
                            isDark ? 'text-zinc-400' : 'text-zinc-600'
                          }`}
                        >
                          {item.role}
                        </p>
                      </div>

                      {/* 2열: 현재 세팅 상태 및 디자인 규칙 (5열) */}
                      <div className="lg:col-span-5 space-y-1 text-xs">
                        <div
                          className={`text-[10px] font-mono uppercase font-semibold flex items-center gap-1 ${
                            isDark ? 'text-zinc-500' : 'text-zinc-500'
                          }`}
                        >
                          <Code2 className="w-3 h-3 text-[#f04f74]" />
                          <span>태그 및 세팅 규격</span>
                        </div>
                        <div
                          className={`p-2 font-mono text-[11px] border leading-relaxed ${
                            isDark
                              ? 'bg-[#07080a] border-white/10 text-zinc-300'
                              : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {item.selector}
                        </div>
                        <p
                          className={`text-xs font-light leading-relaxed pt-0.5 ${
                            isDark ? 'text-zinc-400' : 'text-zinc-600'
                          }`}
                        >
                          <strong
                            className={isDark ? 'text-zinc-200' : 'text-zinc-900'}
                          >
                            세팅 규칙:
                          </strong>{' '}
                          {item.ruleNote}
                        </p>
                      </div>

                      {/* 3열: 실제 화면에 찍혀 있는 텍스트 (4열) */}
                      <div className="lg:col-span-4 space-y-1 text-xs">
                        <div
                          className={`text-[10px] font-mono uppercase font-semibold flex items-center gap-1 ${
                            isDark ? 'text-zinc-500' : 'text-zinc-500'
                          }`}
                        >
                          <FileText className="w-3 h-3 text-[#f04f74]" />
                          <span>현재 화면 문구</span>
                        </div>
                        <div
                          className={`p-2.5 border text-xs leading-relaxed font-sans ${
                            isDark
                              ? 'bg-black/50 border-white/10 text-zinc-200'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {item.currentText || '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==============================================================
          3. 소통 가이드 바
          ============================================================== */}
      <div
        className={`p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono ${
          isDark
            ? 'border-white/10 bg-[#0c0d12]'
            : 'border-zinc-200 bg-white shadow-sm'
        }`}
      >
        <div className="space-y-1">
          <div
            className={`font-bold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            <Bookmark className="w-4 h-4 text-[#f04f74]" />
            <span>AI 어시스턴트와의 원클릭 소통 가이드</span>
          </div>
          <p
            className={`font-light leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            화면의 특정 요소를 수정하고 싶을 때 위 사전의{' '}
            <strong className={isDark ? 'text-zinc-200' : 'text-zinc-900'}>
              [공식 호출 명칭]
            </strong>
            을 그대로 말씀해 주시면 즉시 정확하게 반영됩니다.
            <br />
            예시: <em>&ldquo;SEC-MAIN-01의 헤로-설명문 글자 줄간격 조정해줘&rdquo;</em>,{' '}
            <em>&ldquo;SEC-DINING-02의 챕터-전포와인디너 버튼 색상 바꿔줘&rdquo;</em>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const allNames = currentPage.sections
              .flatMap((s) =>
                s.items.map((i) => `[${i.id}] ${i.officialName} : ${i.role}`)
              )
              .join('\n');
            copyToClipboard(allNames, 'ALL');
          }}
          className={`px-4 py-2 border font-mono text-xs uppercase font-semibold transition-all cursor-pointer shrink-0 ${
            isDark
              ? 'bg-white/5 border-white/20 hover:border-white text-zinc-200 hover:text-white'
              : 'bg-zinc-900 border-zinc-900 hover:bg-zinc-800 text-white'
          }`}
        >
          {copiedId === 'ALL'
            ? '전체 용어 복사 완료'
            : `${currentPage.pageTitle} 전체 용어 복사`}
        </button>
      </div>
    </div>
  );
}
