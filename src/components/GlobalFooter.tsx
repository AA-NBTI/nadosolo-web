'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PhoneCall, X, Instagram, MessageCircle, Globe } from 'lucide-react';
import { useSiteConfig } from '@/engine/siteConfigEngine';

export default function GlobalFooter() {
  const [activeModal, setActiveModal] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | null>(null);
  const { config } = useSiteConfig();
  const f = config?.footer;

  return (
    <>
      <footer className="w-full bg-[#090a0f] border-t border-white/10 text-zinc-400 py-10 px-4 sm:px-6 mt-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-6">
          
          {/* 푸터 상단 기본 브랜드 로고 */}
          <div className="flex flex-col items-center justify-center">
            <Link
              href="/"
              className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-white/90 hover:text-white tracking-tight lowercase transition-opacity"
            >
              nadosolo
            </Link>
          </div>

          {/* 상단 1열: 이용약관, 개인정보처리방침, 환불규정, SNS 링크 */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveModal('TERMS')}
              className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              이용약관
            </button>
            <span className="text-zinc-600">|</span>
            <button
              type="button"
              onClick={() => setActiveModal('PRIVACY')}
              className="text-zinc-200 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              개인정보처리방침
            </button>
            <span className="text-zinc-600">|</span>
            <button
              type="button"
              onClick={() => setActiveModal('REFUND')}
              className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              취소 및 환불규정
            </button>

            {/* SNS 외부 채널 링크 (관리자 설정) */}
            {f?.socialLinks && f.socialLinks.filter((s) => s.visible).length > 0 && (
              <>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <div className="flex items-center gap-3">
                  {f.socialLinks
                    .filter((s) => s.visible)
                    .map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-rose-400 text-xs transition-colors flex items-center gap-1"
                      >
                        {s.platform === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                        {s.platform === 'kakao' && <MessageCircle className="w-3.5 h-3.5" />}
                        {s.platform === 'website' && <Globe className="w-3.5 h-3.5" />}
                        <span>{s.label}</span>
                      </a>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* 중간 2열: 정식 법정 사업자 정보 (관리자 설정 동적 연동) */}
          <div className="flex flex-col gap-2 font-sans text-xs text-zinc-400 text-center max-w-4xl mx-auto leading-relaxed">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>상호: <strong className="text-zinc-300">{f?.companyName || '템바보드 주식회사'}</strong></span>
              <span className="text-zinc-700">|</span>
              <span>대표자: <strong className="text-zinc-300">{f?.ceo || '박경민'}</strong></span>
              <span className="text-zinc-700">|</span>
              <span>
                사업자등록번호: <strong className="text-zinc-300">{f?.bizNum || '107-88-44796'}</strong>
                <a
                  href={`https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${String(f?.bizNum || '107-88-44796').replace(/-/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 underline font-medium ml-1 hover:text-white"
                >
                  [사업자정보확인]
                </a>
              </span>
              <span className="text-zinc-700">|</span>
              <span>통신판매업신고: <strong className="text-zinc-300">{f?.mailOrderNum || '제 2026-부산사하-0589호'}</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>사업장 소재지: <strong className="text-zinc-300">{f?.address || '부산광역시 사하구 하신번영로 328, 302호 (하단동)'}</strong></span>
              <span className="text-zinc-700">|</span>
              <span>대표전화: <strong className="text-zinc-300">{f?.tel || '051-208-8746'}</strong></span>
              <span className="text-zinc-700">|</span>
              <span>전자우편: <strong className="text-zinc-300">{f?.email || 'nadosoloteam@gmail.com'}</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>개인정보보호책임자: <strong className="text-zinc-300">{f?.privacyOfficer || '박경민'}</strong></span>
              <span className="text-zinc-700">|</span>
              <span>호스팅서비스: <strong className="text-zinc-300">{f?.hosting || 'Vercel Inc.'}</strong></span>
              <span className="text-zinc-700">|</span>
              <span>고객센터 운영시간: <strong className="text-zinc-300">{f?.csHours || '평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)'}</strong></span>
            </div>

            {/* 결제 심사 필수 배너 (토스페이먼츠 PG 심사 규격 준수) */}
            <div className="mt-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 max-w-3xl mx-auto space-y-1.5 text-[11px] text-zinc-400">
              <div>
                <strong>구매안전서비스(에스크로) 안내:</strong> 고객님의 안전한 전자상거래를 위해 <strong>토스페이먼츠(주)</strong>의 구매안전(에스크로) 서비스 연동 및 계약 절차를 진행하고 있습니다.
              </div>
              <div>
                <strong>전자결제 연동 수탁 고지:</strong> 전자결제(PG) 및 에스크로 대행 업무는 「개인정보 보호법」 제26조에 따라 수탁사인 <strong>토스페이먼츠(주)</strong>에 위탁 운영됩니다.
              </div>
            </div>
          </div>

          {/* 하단 3열: 저작권 표시 */}
          <div className="text-center text-xs text-zinc-500 border-t border-white/5 pt-5">
            {f?.copyright || '© 2026 nadosolo.com. All rights reserved.'}
          </div>
        </div>
      </footer>

      {/* ====================================================================
          정식 법률 문서 모달 팝업 레이어 (이용약관 / 개인정보처리방침 / 환불규정)
          ==================================================================== */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-[#12151e] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 이용약관 모달 내용 */}
            {activeModal === 'TERMS' && (
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3">
                  서비스 이용약관
                </h3>
                <div className="text-xs sm:text-sm text-zinc-400 space-y-3 leading-relaxed">
                  <p><strong>제1조 (목적)</strong> 본 약관은 템바보드 주식회사(이하 &apos;회사&apos;)가 운영하는 나도솔로(nadosolo.com) 플랫폼(이하 &apos;서비스&apos;)에서 제공하는 솔로 라이프스타일 큐레이션 및 소셜 다이닝 중개 서비스의 이용조건 및 절차를 규정함을 목적으로 합니다.</p>
                  <p><strong>제2조 (회원의 의무 및 에티켓)</strong> 회원은 서비스 이용 시 타인을 존중하는 매너를 준수하여야 하며, 허위 신원 기재, 상대방에 대한 무례한 언행, 영리 목적의 영업 활동 등 건전한 소셜 문화를 저해하는 행위는 엄격히 금지됩니다. 위반 시 사전 경고 없이 이용 자격이 박탈될 수 있습니다.</p>
                  <p><strong>제3조 (서비스 성격)</strong> 본 서비스는 건전한 취향 교류와 사교를 위한 커뮤니티 플랫폼으로, 직업소개소나 결혼중개업이 아니며 참여자 간의 자율적인 소통과 만남을 매개합니다.</p>
                </div>
              </div>
            )}

            {/* 개인정보처리방침 모달 내용 */}
            {activeModal === 'PRIVACY' && (
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3">
                  개인정보처리방침
                </h3>
                <div className="text-xs sm:text-sm text-zinc-400 space-y-3 leading-relaxed">
                  <p><strong>1. 수집하는 개인정보 항목</strong> 회사는 원활한 매칭 및 다이닝 배정을 위해 닉네임, 성별, 연령대, 휴대전화번호, 성향 진단 데이터(NBTI), 결제 정보를 수집합니다.</p>
                  <p><strong>2. 개인정보의 수집 및 이용목적</strong> 소셜 다이닝 테이블 편성 및 자리 배치, 모임 안내 SMS 발송, 결제 및 환불 처리, 비매너 이용자 필터링 등 서비스 품질 관리를 목적으로 합니다.</p>
                  <p><strong>3. 개인정보의 보유 및 파기</strong> 회원은 언제든지 회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있으며, 관계 법령에 따른 의무 보존 기간이 경과한 후 즉시 파기합니다.</p>
                </div>
              </div>
            )}

            {/* 취소 및 환불규정 모달 내용 */}
            {activeModal === 'REFUND' && (
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3">
                  취소 및 환불규정
                </h3>
                <div className="text-xs sm:text-sm text-zinc-400 space-y-3 leading-relaxed">
                  <p><strong>제1조 (환불 기준)</strong> 소셜 다이닝 및 이벤트 참가 취소 시 환불 기준은 다음과 같습니다.</p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
                    <li>모임 시작 3일 전(D-3) 23:59까지 취소 시: <strong>100% 전액 환불</strong></li>
                    <li>모임 시작 2일 전(D-2) 23:59까지 취소 시: <strong>50% 환불</strong></li>
                    <li>모임 시작 1일 전(D-1) 및 당일(D-Day) 취소/노쇼: <strong>환불 불가</strong> (테이블 예약 및 좌석 배정 완료로 인한 손실 발생)</li>
                  </ul>
                  <p><strong>제2조 (회사 귀책 사유)</strong> 최소 인원 미달로 모임이 취소되거나 주최 측 사정으로 행사가 취소될 경우, 참가비는 <strong>100% 전액 환불</strong>됩니다.</p>
                  <p><strong>제3조 (회원 제명 시 처리)</strong> 비매너 행위 등으로 이용 자격이 박탈되거나 제명 조치되는 경우, 이미 예약이 확정된 당일 모임 참가비는 좌석 배정 완료 손실로 환불되지 않으며, 사전에 선결제된 차후 일정 참가권은 전액 환불 처리됩니다.</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
