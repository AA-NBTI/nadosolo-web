'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, PhoneCall, Mail, ExternalLink, X } from 'lucide-react';

export default function GlobalFooter() {
  const [activeModal, setActiveModal] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | null>(null);

  return (
    <>
      <footer className="w-full bg-[#0a0d14] border-t border-white/10 text-zinc-400 py-12 px-4 sm:px-6 mt-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-8">
          
          {/* 상단 1열: 이용약관, 개인정보처리방침, 환불규정, 고객센터 바로가기 */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold">
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
              className="text-[#f2ca50] hover:underline font-bold transition-colors cursor-pointer"
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
            <span className="text-zinc-600">|</span>
            <a
              href="tel:051-208-8746"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#f2ca50]" />
              <span>고객센터 051-208-8746</span>
            </a>
          </div>

          {/* 중간 2열: 정식 법정 사업자 정보 (전자상거래법 및 PG사 카드사 심사 표준 규격) */}
          <div className="flex flex-col gap-2 font-sans text-xs text-zinc-400 text-center max-w-4xl mx-auto leading-relaxed">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>상호: <strong className="text-zinc-200">템바보드 주식회사</strong></span>
              <span className="text-zinc-700">|</span>
              <span>대표자: <strong className="text-zinc-200">박경민</strong></span>
              <span className="text-zinc-700">|</span>
              <span>
                사업자등록번호: <strong className="text-zinc-200">107-88-44796</strong>
                <a
                  href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1078844796"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f2ca50] underline font-bold ml-1 hover:text-amber-300"
                >
                  [사업자정보확인]
                </a>
              </span>
              <span className="text-zinc-700">|</span>
              <span>통신판매업신고: <strong className="text-zinc-200">제 2026-부산사하-0589호</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>사업장 소재지: <strong className="text-zinc-200">부산광역시 사하구 하신번영로 328, 302호 (하단동)</strong></span>
              <span className="text-zinc-700">|</span>
              <span>대표전화: <strong className="text-zinc-200">051-208-8746</strong></span>
              <span className="text-zinc-700">|</span>
              <span>전자우편: <strong className="text-zinc-200">anbtiteam@gmail.com</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>개인정보보호책임자: <strong className="text-zinc-200">박경민</strong></span>
              <span className="text-zinc-700">|</span>
              <span>호스팅서비스: <strong className="text-zinc-200">Vercel Inc.</strong></span>
              <span className="text-zinc-700">|</span>
              <span>고객센터 운영시간: <strong className="text-zinc-200">평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)</strong></span>
            </div>

            {/* 결제 심사 필수 배너: 에스크로 및 전자결제 위탁 고지 */}
            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-[#f2ca50]/20 max-w-3xl mx-auto space-y-1.5 text-[11px] text-zinc-300">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-[#f2ca50] shrink-0" />
                <span>
                  <strong>구매안전서비스(에스크로) 안내:</strong> 고객님의 안전한 거래를 위해 현금 결제 시 구매안전서비스를 이용하실 수 있습니다.
                </span>
              </div>
              <div>
                <span>
                  <strong>전자결제 연동 수탁 고지:</strong> 전자결제(PG) 연동 업무는 「개인정보 보호법」 제26조에 따라 수탁사인 <strong>(주)코리아포트원</strong>에 위탁 운영됩니다.
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 mt-2 max-w-2xl mx-auto">
              ※ 나도솔로(nadosolo.com)는 만 19세 이상 성인을 위한 신뢰 기반 프라이빗 소셜 다이닝 플랫폼으로, 정기적인 매너 지표와 5×5×5 다면 평가를 통해 품격 있는 만남을 지향합니다.
            </div>
          </div>

          {/* 하단 3열: 저작권 표시 */}
          <div className="text-center text-xs text-zinc-600 border-t border-white/5 pt-6">
            © 2026 nadosolo.com • 템바보드 주식회사. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ====================================================================
          법정 모달 팝업 레이어 (이용약관 / 개인정보 / 환불규정)
          ==================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151e] border border-[#f2ca50]/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f2ca50]" />
                {activeModal === 'TERMS' && '전자상거래 서비스 이용약관'}
                {activeModal === 'PRIVACY' && '개인정보처리방침'}
                {activeModal === 'REFUND' && '모임 참가비 취소 및 환불규정'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 overflow-y-auto text-xs text-zinc-300 leading-relaxed space-y-4 font-sans">
              {activeModal === 'TERMS' && (
                <>
                  <div className="p-3.5 rounded-lg bg-[#f2ca50]/5 border border-[#f2ca50]/20 text-[#f2ca50]">
                    <strong>[운영 사업자 정보]</strong><br />
                    • 상호: 템바보드 주식회사 | 대표자: 박경민<br />
                    • 사업자등록번호: 107-88-44796 | 통신판매업신고: 제 2026-부산사하-0589호<br />
                    • 사업장 주소: 부산광역시 사하구 하신번영로 328, 302호<br />
                    • 고객센터: 051-208-8746 (anbtiteam@gmail.com)
                  </div>
                  <h4 className="font-bold text-white text-sm">제1조 (목적)</h4>
                  <p>본 약관은 템바보드 주식회사(이하 "회사")가 운영하는 온라인 플랫폼 "나도솔로(nadosolo.com)"에서 제공하는 소셜 다이닝 및 라이프스타일 중개 서비스의 이용 조건 및 절차에 관한 제반 사항을 규정함을 목적으로 합니다.</p>
                  <h4 className="font-bold text-white text-sm">제2조 (회원의 의무 및 매너 규정)</h4>
                  <p>회원은 모임 현장에서 타인을 존중하는 건전한 식사 에티켓을 준수해야 하며, 노쇼(No-Show) 또는 무단 지각 시 서비스 이용이 제한될 수 있습니다.</p>
                </>
              )}

              {activeModal === 'PRIVACY' && (
                <>
                  <h4 className="font-bold text-white text-sm">1. 수집하는 개인정보 항목</h4>
                  <p>회사는 서비스 가입 및 모임 배정을 위해 이름, 성별, 출생연도, 연락처, 이메일, 식단 선호도, 관심사 정보를 수집합니다.</p>
                  <h4 className="font-bold text-white text-sm">2. 개인정보의 보유 및 이용 기간</h4>
                  <p>회원 탈퇴 시 즉시 파기하며, 관계 법령에 따라 거래 내역 등은 관련 법률이 정한 기간 동안 안전하게 보관됩니다.</p>
                  <h4 className="font-bold text-white text-sm">3. 개인정보 위탁 안내</h4>
                  <p>전자결제 처리: (주)코리아포트원 / 클라우드 인프라: Vercel, Supabase</p>
                </>
              )}

              {activeModal === 'REFUND' && (
                <>
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200">
                    <strong>[테이블 예약 보증금 및 참가비 취소/환불 기준]</strong><br />
                    식당 예약 및 3:3 성비 좌석 균형을 위해 다음과 같은 명확한 환불 규정을 적용합니다.
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>모임 시작 3일 전 (72시간 전까지):</strong> 전액 100% 취소 및 환불 가능</li>
                    <li><strong>모임 시작 2일 전 (48시간 전까지):</strong> 결제 금액의 50% 환불</li>
                    <li><strong>모임 시작 1일 전 및 모임 당일:</strong> 예약 좌석 확정 및 식당 보증금 결제로 인해 환불 불가</li>
                    <li><strong>모임 주최 측 사정으로 인한 취소:</strong> 전액 100% 환불 처리</li>
                  </ul>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    환불 문의: 고객센터 (051-208-8746 / anbtiteam@gmail.com)
                  </p>
                </>
              )}
            </div>

            {/* 모달 닫기 푸터 */}
            <div className="p-4 border-t border-white/10 flex justify-end bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
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
