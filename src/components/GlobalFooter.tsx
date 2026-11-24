'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/engine/siteConfigEngine';
import { isTablebaroHost, isTablebaroPath } from '@/modules/tenancy';

export default function GlobalFooter({
  isTablebaro: isTablebaroProp,
}: {
  isTablebaro?: boolean;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | null>(null);
  const { config } = useSiteConfig();
  const f = config?.footer;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTablebaro =
    typeof isTablebaroProp === 'boolean'
      ? isTablebaroProp
      : mounted &&
        (isTablebaroHost(window.location.hostname) || isTablebaroPath(pathname));

  const onTablebaroHost = mounted && isTablebaroHost(window.location.hostname);

  return (
    <>
      <footer className="w-full bg-[#090a0f] border-t border-white/10 text-zinc-400 py-10 px-4 sm:px-6 mt-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-6">
          
          {isTablebaro ? (
            <>
              {/* 테이블바로 푸터 브랜드 로고: 상단 헤더와 100% 동일한 구조 및 블루 포인트 컬러 */}
              <div className="flex flex-col items-center justify-center">
                <Link
                  href="/reserve"
                  prefetch={true}
                  className="inline-flex flex-col items-center justify-center shrink-0 hover:opacity-90 transition-opacity select-none py-1"
                >
                  <span className="font-serif-editorial text-[22px] sm:text-[26px] font-normal text-white tracking-[0.04em] uppercase leading-none">
                    TABLEBARO
                  </span>
                  <span className="text-xs font-sans font-medium text-[#3b82f6] tracking-normal mt-1 leading-none">
                    선결제예약 테이블바로
                  </span>
                </Link>
              </div>

              {/* 테이블바로 전용 단정 사이트맵 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-y border-white/10 text-xs sm:text-sm max-w-4xl mx-auto">
                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">예약</span>
                  <div className="flex flex-col gap-1.5">
                    <Link href="/reserve" prefetch={true} className="hover:text-white transition-colors">매장검색</Link>
                    <Link href="/reserve/my" prefetch={true} className="hover:text-white transition-colors">예약확인</Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">매장</span>
                  <div className="flex flex-col gap-1.5">
                    <Link href="/biz" prefetch={true} className="hover:text-white transition-colors">매장관리</Link>
                    <Link href="/biz?tab=signup" prefetch={true} className="hover:text-white transition-colors">입점신청</Link>
                    <a
                      href="https://oops.monster"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      웁스
                    </a>
                    <Link href="/reserve/affiliate" prefetch={true} className="hover:text-white transition-colors">어필리에이트</Link>
                    <a
                      href="https://nadosolo.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      나도솔로
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">솔루션</span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-zinc-400">선결제 예약</span>
                    <span className="text-zinc-400">스케줄 관리</span>
                    <span className="text-zinc-400">좌석 연동</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">정책</span>
                  <div className="flex flex-col gap-1.5">
                    <Link href="/terms" prefetch={true} className="hover:text-white transition-colors">이용약관</Link>
                    <Link href="/privacy" prefetch={true} className="hover:text-white transition-colors">개인정보처리방침</Link>
                    <button
                      type="button"
                      onClick={() => setActiveModal('REFUND')}
                      className="text-left hover:text-white transition-colors cursor-pointer"
                    >
                      환불규정
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 푸터 상단 기본 브랜드 로고: 정통 nadosolo + 솔로공감 나도솔로 */}
              <div className="flex flex-col items-center justify-center">
                <Link
                  href="/"
                  prefetch={true}
                  className="inline-flex flex-col items-center justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
                >
                  <span className="font-serif-editorial text-[26px] sm:text-[30px] font-light text-white tracking-[-0.02em] lowercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] group-hover:text-zinc-100 transition-colors duration-300">
                    nadosolo
                  </span>
                  <div className="w-full flex items-center justify-between mt-1 leading-none select-none">
                    <div className="w-[52%] flex justify-between items-center text-[9.5px] sm:text-[11px] font-serif-editorial font-black text-white group-hover:text-[#f04f74] transition-colors duration-200">
                      <span>솔</span>
                      <span>로</span>
                      <span>공</span>
                      <span>감</span>
                    </div>
                    <div className="w-[6%]" />
                    <div className="w-[42%] flex justify-between items-center text-[9.5px] sm:text-[11px] font-serif-editorial font-black text-[#f04f74] group-hover:text-white transition-colors duration-200">
                      <span>나</span>
                      <span>도</span>
                      <span>솔</span>
                      <span>로</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* 타임레프트 표준 다중 컬럼 사이트맵 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-y border-white/10 text-xs sm:text-sm max-w-4xl mx-auto">
                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">서비스</span>
                  <div className="flex flex-col gap-1.5">
                    <Link href="/meetup" prefetch={true} className="hover:text-white transition-colors">밋업</Link>
                    <Link href="/misik" prefetch={true} className="hover:text-white transition-colors">솔로미식단</Link>
                    <Link href="/yot" prefetch={true} className="hover:text-white transition-colors">솔로엿장수</Link>
                    <Link href="/guide" prefetch={true} className="hover:text-white transition-colors">이용 안내</Link>
                    <Link href="/checklist" prefetch={true} className="hover:text-white transition-colors">체크리스트</Link>
                    <Link href="/locations" prefetch={true} className="hover:text-white transition-colors">운영 도시</Link>
                    <Link href="/pricing" prefetch={true} className="hover:text-white transition-colors">참가권 안내</Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">제휴</span>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href="https://tablebaro.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      테이블바로
                    </a>
                    <a
                      href="https://oops.monster"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      웁스
                    </a>
                    <Link href="/affiliate" prefetch={true} className="hover:text-white transition-colors">어필리에이트</Link>
                    <Link href="/affiliate/dashboard" prefetch={true} className="hover:text-white transition-colors">어필리에이트 관리</Link>
                    <Link href="/about" prefetch={true} className="hover:text-white transition-colors">브랜드 소개</Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">트랙 · 아카이브</span>
                  <div className="flex flex-col gap-1.5">
                    <Link href="/busan" prefetch={true} className="hover:text-white transition-colors">부산 다이닝</Link>
                    <Link href="/dining" prefetch={true} className="hover:text-white transition-colors">소셜 다이닝</Link>
                    <Link href="/salon" prefetch={true} className="hover:text-white transition-colors">소셜 살롱</Link>
                    <Link href="/club" prefetch={true} className="hover:text-white transition-colors">소셜 클럽</Link>
                    <Link href="/showcase" prefetch={true} className="hover:text-white transition-colors">쇼케이스</Link>
                    <Link href="/solotest" prefetch={true} className="hover:text-white transition-colors">솔로 테스트</Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-white font-mono font-semibold block">안전 · 약관</span>
                  <div className="flex flex-col gap-1.5">
                    <Link href="/safety" prefetch={true} className="hover:text-white transition-colors">안전 가이드</Link>
                    <Link href="/terms" prefetch={true} className="hover:text-white transition-colors">이용약관</Link>
                    <Link href="/privacy" prefetch={true} className="hover:text-white transition-colors">개인정보처리방침</Link>
                    <button
                      type="button"
                      onClick={() => setActiveModal('REFUND')}
                      className="text-left hover:text-white transition-colors cursor-pointer"
                    >
                      취소 및 환불규정
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 중간 2열: 정식 법정 사업자 정보 (인스타그램/카카오톡 링크 완전 영구 삭제) */}
          <div className="flex flex-col gap-2 font-sans text-xs text-zinc-400 text-center max-w-4xl mx-auto leading-relaxed font-normal">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>상호: <span className="text-zinc-300">{f?.companyName || '템바보드 주식회사'}</span></span>
              <span className="text-zinc-700">|</span>
              <span>대표자: <span className="text-zinc-300">{f?.ceo || '박경민'}</span></span>
              <span className="text-zinc-700">|</span>
              <span>
                사업자등록번호: <span className="text-zinc-300">{f?.bizNum || '107-88-44796'}</span>
                <a
                  href={`https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${String(f?.bizNum || '107-88-44796').replace(/-/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 underline ml-1 hover:text-white"
                >
                  [사업자정보확인]
                </a>
              </span>
              <span className="text-zinc-700">|</span>
              <span>통신판매업신고: <span className="text-zinc-300">{f?.mailOrderNum || '제 2026-부산사하-0589호'}</span></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-zinc-400">
              <span>주소: <span className="text-zinc-400">{f?.address || '부산광역시 사하구 하단동'}</span></span>
              <span className="text-zinc-700">|</span>
              <span>이메일: <a href={`mailto:${isTablebaro ? 'admin@tablebaro.com' : (f?.email || 'admin@nadosolo.com')}`} className="hover:text-white">{isTablebaro ? 'admin@tablebaro.com' : (f?.email || 'admin@nadosolo.com')}</a></span>
              <span className="text-zinc-700">|</span>
              <span>호스팅 서비스: <span className="text-zinc-400">Vercel Inc.</span></span>
            </div>

            <div className="pt-2 text-zinc-400">
              Copyright © {new Date().getFullYear()} {isTablebaro ? 'TABLEBARO' : 'NADOSOLO'}. All rights reserved.
            </div>
          </div>

        </div>
      </footer>

      {/* 약관 팝업 모달들 */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0c0d12] border border-white/20 p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-serif-editorial text-xl text-white font-normal">
                {activeModal === 'TERMS' && '이용약관'}
                {activeModal === 'PRIVACY' && '개인정보처리방침'}
                {activeModal === 'REFUND' && '취소 및 환불규정'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center border border-white/20 text-zinc-400 hover:text-white cursor-pointer text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-zinc-300 space-y-3 font-light leading-relaxed">
              {activeModal === 'REFUND' && (
                isTablebaro ? (
                  <>
                    <p className="font-medium text-white">제1조 (예약 취소 및 환불 정책)</p>
                    <p>1. 매장별 예약 확정 전 또는 지정된 무료 취소 기한 내에는 예약확인 페이지에서 직접 취소 및 전액 환불이 가능합니다.</p>
                    <p>2. 당일 취소 및 노쇼(No-Show)의 경우 매장 운영 정책에 따라 선결제 금액 환불이 제한될 수 있습니다.</p>
                    <p>3. 매장 사정으로 예약이 거절되거나 만료된 경우 결제 금액은 자동 전액 환불됩니다.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-white">제1조 (취소 및 환불 정책)</p>
                    <p>1. 모임 시작 48시간 전까지는 대시보드에서 전액 무료 취소 또는 다음 회차로의 이월(참가권 1매 보존)이 가능합니다.</p>
                    <p>2. 모임 시작 24시간 이내 취소 또는 당일 불참(노쇼)의 경우, 다른 참가자들과의 테이블 밸런스 및 예약 식당 좌석 보증을 위해 참가권이 보존되지 않으며 환불이 불가합니다.</p>
                    <p>3. 최소 인원 미달 등으로 모임이 성사되지 않을 경우, 결제하신 참가권은 자동으로 다음 회차로 전액 보존 및 연장됩니다.</p>
                  </>
                )
              )}
              {activeModal === 'TERMS' && (
                isTablebaro ? (
                  <>
                    <p className="font-medium text-white">제1조 (테이블바로 서비스 이용약관)</p>
                    <p>1. 테이블바로는 매장 실시간 좌석 조회 및 선결제 예약 중개 솔루션을 제공합니다.</p>
                    <p>2. 실제 매장 이용, 음식·공간 제공 및 현장 추가 결제는 각 입점 매장의 운영 정책에 따릅니다.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-white">제1조 (나도솔로 서비스 이용약관)</p>
                    <p>1. 나도솔로는 소셜 다이닝 매칭 및 다면 관찰 리포트 서비스를 제공합니다.</p>
                    <p>2. 참가자 간 상호 존중 및 비방 금지 원칙을 위반할 경우 서비스 이용이 제한될 수 있습니다.</p>
                  </>
                )
              )}
              {activeModal === 'PRIVACY' && (
                <>
                  <p className="font-medium text-white">제1조 (개인정보 수집 및 이용)</p>
                  <p>1. 예약 접수, 본인 확인, 알림 발송 및 정산 처리 목적에 한해 최소한의 연락처와 이름 정보를 수집·이용합니다.</p>
                  <p>2. 수집된 개인정보는 목적 달성 및 법령상 보관 기간 경과 후 지체 없이 파기합니다.</p>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-6 py-2 border border-white/20 hover:bg-white/10 text-sm font-mono text-white cursor-pointer"
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
