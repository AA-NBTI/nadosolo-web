'use client';

import React, { useState } from 'react';
import { PhoneCall, X } from 'lucide-react';

export default function GlobalFooter() {
  const [activeModal, setActiveModal] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | null>(null);

  return (
    <>
      <footer className="w-full bg-[#090a0f] border-t border-white/10 text-zinc-400 py-10 px-4 sm:px-6 mt-auto">
        <div className="w-full max-w-[1200px] mx-auto space-y-7">
          
          {/* 상단 1열: 이용약관, 개인정보처리방침, 환불규정, 고객센터 */}
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
          </div>

          {/* 중간 2열: 정식 법정 사업자 정보 (단정한 모노크롬 톤) */}
          <div className="flex flex-col gap-2 font-sans text-xs text-zinc-400 text-center max-w-4xl mx-auto leading-relaxed">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>상호: <strong className="text-zinc-300">템바보드 주식회사</strong></span>
              <span className="text-zinc-700">|</span>
              <span>대표자: <strong className="text-zinc-300">박경민</strong></span>
              <span className="text-zinc-700">|</span>
              <span>
                사업자등록번호: <strong className="text-zinc-300">107-88-44796</strong>
                <a
                  href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1078844796"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 underline font-medium ml-1 hover:text-white"
                >
                  [사업자정보확인]
                </a>
              </span>
              <span className="text-zinc-700">|</span>
              <span>통신판매업신고: <strong className="text-zinc-300">제 2026-부산사하-0589호</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>사업장 소재지: <strong className="text-zinc-300">부산광역시 사하구 하신번영로 328, 302호 (하단동)</strong></span>
              <span className="text-zinc-700">|</span>
              <span>대표전화: <strong className="text-zinc-300">051-208-8746</strong></span>
              <span className="text-zinc-700">|</span>
              <span>전자우편: <strong className="text-zinc-300">nadosoloteam@gmail.com</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>개인정보보호책임자: <strong className="text-zinc-300">박경민</strong></span>
              <span className="text-zinc-700">|</span>
              <span>호스팅서비스: <strong className="text-zinc-300">Vercel Inc.</strong></span>
              <span className="text-zinc-700">|</span>
              <span>고객센터 운영시간: <strong className="text-zinc-300">평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)</strong></span>
            </div>

            {/* 결제 심사 필수 배너 (단정하고 차분한 모노크롬 톤) */}
            <div className="mt-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 max-w-3xl mx-auto space-y-1 text-[11px] text-zinc-400">
              <div>
                <strong>구매안전서비스(에스크로) 안내:</strong> 고객님의 안전한 거래를 위해 현금 결제 시 구매안전서비스를 이용하실 수 있습니다.
              </div>
              <div>
                <strong>전자결제 연동 수탁 고지:</strong> 전자결제(PG) 연동 업무는 「개인정보 보호법」 제26조에 따라 수탁사인 <strong>(주)코리아포트원</strong>에 위탁 운영됩니다.
              </div>
            </div>
          </div>

          {/* 하단 3열: 저작권 표시 */}
          <div className="text-center text-xs text-zinc-500 border-t border-white/5 pt-5">
            © 2026 nadosolo.com. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ====================================================================
          정식 법률 문서 모달 팝업 레이어 (이용약관 / 개인정보처리방침 / 환불규정)
          ==================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151e] border border-white/20 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-base font-bold text-white">
                {activeModal === 'TERMS' && '전자상거래 서비스 이용약관'}
                {activeModal === 'PRIVACY' && '개인정보처리방침'}
                {activeModal === 'REFUND' && '취소 및 환불 / 모임 예약 규정'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 본문 (정식 법률 조항 문서) */}
            <div className="p-6 overflow-y-auto text-xs text-zinc-300 leading-relaxed space-y-4 font-sans">
              
              {/* ----------------- 1. 전자상거래 서비스 이용약관 ----------------- */}
              {activeModal === 'TERMS' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs">
                    <strong>[운영 사업자 정보]</strong><br />
                    • 상호: 템바보드 주식회사 | 대표자: 박경민<br />
                    • 사업자등록번호: 107-88-44796 | 통신판매업신고: 제 2026-부산사하-0589호<br />
                    • 사업장 소재지: 부산광역시 사하구 하신번영로 328, 302호 (하단동)<br />
                    • 대표전화: 051-208-8746 | 고객센터: nadosoloteam@gmail.com
                  </div>

                  <h4 className="font-bold text-white text-sm">제1조 (목적)</h4>
                  <p>본 약관은 템바보드 주식회사(이하 "회사"라 함)가 운영하는 온라인 플랫폼 "나도솔로(nadosolo.com)"(이하 "몰" 또는 "서비스"라 함)에서 제공하는 소셜 다이닝 및 라이프스타일 중개 서비스, 디지털 코칭 리포트 및 제반 부가서비스를 이용함에 있어 "회사"와 "이용자"의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

                  <h4 className="font-bold text-white text-sm">제2조 (정의)</h4>
                  <p>
                    1. "몰"이란 회사가 서비스(소셜 다이닝 참가 신청, 5×5×5 다면 평가 리포트 등)를 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 말합니다.<br />
                    2. "이용자"란 "몰"에 접속하여 본 약관에 따라 "몰"이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br />
                    3. "회원"이라 함은 "몰"에 개인정보를 제공하여 회원등록을 한 자로서, "몰"의 정보를 지속적으로 제공받으며 "몰"이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
                  </p>

                  <h4 className="font-bold text-white text-sm">제3조 (약관의 명시와 개정)</h4>
                  <p>회사는 본 약관의 내용과 상호, 대표자 성명, 영업소 소재지 주소, 사업자등록번호, 통신판매업 신고번호, 고객센터 연락처 등을 이용자가 쉽게 알 수 있도록 서비스 초기 화면(푸터)에 게시합니다. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>

                  <h4 className="font-bold text-white text-sm">제4조 (서비스의 제공 및 변경)</h4>
                  <p>
                    1. 회사는 다음과 같은 업무를 수행합니다:<br />
                    &nbsp;&nbsp;가. 오프라인 6인 소셜 다이닝 좌석 매칭 및 제휴 식당 예약 중개<br />
                    &nbsp;&nbsp;나. 동석자 간 5×5×5 다면 매트릭스 평가 데이터 산출 및 디지털 개인 코칭 리포트 제공<br />
                    &nbsp;&nbsp;다. 기타 회사가 정하는 제반 라이프스타일 교류 서비스<br />
                    2. 회사는 기술적 사양의 변경이나 불가피한 여건이 발생할 경우 제공할 서비스의 내용을 변경할 수 있으며, 이 경우 사전에 공지합니다.
                  </p>

                  <h4 className="font-bold text-white text-sm">제5조 (회원의 의무 및 현장 에티켓)</h4>
                  <p>
                    1. 회원은 서비스 이용과 관련하여 타인을 비방하거나 불쾌감을 주는 행위, 과도한 영업/홍보/종교 활동을 하여서는 안 됩니다.<br />
                    2. 회원은 약속된 모임 시간에 정시 참석할 의무가 있으며, 무단 불참(노쇼) 또는 지각으로 인하여 타 회원에게 피해를 준 경우 매너 점수 감점 또는 향후 서비스 이용 정지 처분을 받을 수 있습니다.<br />
                    3. 식사 비용은 현장에서 동석자 간 1/N 균등 정산을 원칙으로 합니다.
                  </p>

                  <h4 className="font-bold text-white text-sm">제6조 (청약철회 및 환불)</h4>
                  <p>모임 참가 신청 취소 및 환불은 회사의 '취소 및 환불규정'에 따르며, 식당 예약 확정 및 성비 밸런스 유지를 위해 모임 시작 일정에 따라 단계별 취소 수수료가 적용됩니다.</p>

                  <h4 className="font-bold text-white text-sm">제7조 (분쟁 해결 및 관할법원)</h4>
                  <p>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</p>

                  <div className="pt-2 text-zinc-500 text-[11px] border-t border-white/5">
                    부칙: 본 약관은 2026년 11월 1일부터 시행됩니다.
                  </div>
                </div>
              )}

              {/* ----------------- 2. 개인정보처리방침 ----------------- */}
              {activeModal === 'PRIVACY' && (
                <div className="space-y-4">
                  <p>템바보드 주식회사(이하 '회사')는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.</p>

                  <h4 className="font-bold text-white text-sm">제1조 (개인정보의 처리 목적)</h4>
                  <p>
                    회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법률에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.<br />
                    1. <strong>회원 가입 및 본인 식별</strong>: 회원제 서비스 이용에 따른 본인확인, 연령 확인(만 19세 이상), 부정이용 방지<br />
                    2. <strong>소셜 다이닝 좌석 매칭</strong>: 성별, 연령대, 직업군, 식단 선호도, 관심사 기반 6인 테이블 조화 구성<br />
                    3. <strong>참가비 결제 및 정산</strong>: 모임 참가 예약금 결제 승인, 환불 처리, 영수증 발급<br />
                    4. <strong>고객 상담 및 공지사항 전달</strong>: 모임 장소 안내, 1:1 고객 문의 응대
                  </p>

                  <h4 className="font-bold text-white text-sm">제2조 (처리하는 개인정보의 항목)</h4>
                  <p>
                    1. <strong>필수 항목</strong>: 이름, 닉네임, 성별, 출생연도, 휴대전화번호, 이메일 주소, @핸들<br />
                    2. <strong>선택 항목</strong>: 직업/직장, 식단 제약(비건, 할랄, 논알콜 등), 관심사 카테고리, 자기소개<br />
                    3. <strong>서비스 이용 과정 생성 항목</strong>: 접속 IP, 쿠키, 서비스 이용 기록, 5×5×5 다면 평가 지표 점수
                  </p>

                  <h4 className="font-bold text-white text-sm">제3조 (개인정보의 보유 및 이용 기간)</h4>
                  <p>
                    회사는 관계 법령의 규정에 따라 다음과 같이 개인정보를 보존합니다:<br />
                    • 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)<br />
                    • 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)<br />
                    • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)<br />
                    • 웹사이트 방문 기록: 3개월 (통신비밀보호법)
                  </p>

                  <h4 className="font-bold text-white text-sm">제4조 (개인정보 처리 업무의 위탁)</h4>
                  <p>회사는 원활한 서비스 제공 및 전자결제 처리를 위하여 다음과 같이 개인정보 처리 업무를 외부 전문기관에 위탁하고 있습니다:</p>
                  
                  <div className="overflow-x-auto my-2">
                    <table className="w-full border-collapse border border-white/10 text-[11px] text-left">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="p-2 text-white font-semibold">수탁업체</th>
                          <th className="p-2 text-white font-semibold">위탁 업무 내용</th>
                          <th className="p-2 text-white font-semibold">보유 및 이용 기간</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5">
                          <td className="p-2 text-zinc-300 font-medium">(주)코리아포트원 (PortOne)</td>
                          <td className="p-2 text-zinc-400">전자결제(신용카드, 간편결제 등) 승인 및 중계 대행</td>
                          <td className="p-2 text-zinc-500">회원 탈퇴 또는 법정 의무 보존 기간까지</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="p-2 text-zinc-300 font-medium">Vercel Inc. / Supabase Inc.</td>
                          <td className="p-2 text-zinc-400">클라우드 호스팅 인프라 제공 및 DB 데이터 보관</td>
                          <td className="p-2 text-zinc-500">서비스 이용 계약 종료 시까지</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-bold text-white text-sm">제5조 (개인정보 보호책임자)</h4>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300">
                    • 성명: 박경민 (대표이사)<br />
                    • 소속: 템바보드 주식회사<br />
                    • 전자우편: nadosoloteam@gmail.com | 전화번호: 051-208-8746
                  </div>

                  <div className="pt-2 text-zinc-500 text-[11px] border-t border-white/5">
                    공고일자: 2026년 11월 1일 | 시행일자: 2026년 11월 1일
                  </div>
                </div>
              )}

              {/* ----------------- 3. 취소 및 환불규정 ----------------- */}
              {activeModal === 'REFUND' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                    <strong>전자상거래법 및 공정거래위원회 표준약관 준수 고지</strong><br />
                    나도솔로(nadosolo.com)는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 소비자분쟁해결기준을 준수합니다.
                  </div>

                  <h4 className="font-bold text-white text-sm">1. 모임 참가 신청 취소 및 환불 기준</h4>
                  <p>오프라인 6인 다이닝은 3:3 성비 균형 및 식당 사전 예약 보증금이 결제되는 특성상, 모임 시작 시점을 기준으로 아래와 같은 취소 및 환불 기준을 엄격히 적용합니다:</p>
                  
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-200 font-medium">• 모임 시작 3일 전 (72시간 전까지)</span>
                      <strong className="text-zinc-100">결제 금액 100% 전액 환불</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-200 font-medium">• 모임 시작 2일 전 (48시간 전까지)</span>
                      <strong className="text-zinc-100">결제 금액의 50% 환불</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-medium">• 모임 시작 1일 전 및 당일 취소 / 노쇼</span>
                      <strong className="text-zinc-400">환불 불가</strong>
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-sm">2. 주최 측 사정으로 인한 취소 시 환불</h4>
                  <p>천재지변, 제휴 레스토랑의 긴급 사정, 또는 최소 성비 미달 등으로 인하여 모임이 주최 측에 의해 부득이하게 취소되는 경우, 회사는 즉시 사전 안내를 진행하며 결제 금액 전액(100%)을 즉시 환불 처리합니다.</p>

                  <h4 className="font-bold text-white text-sm">3. 환불 처리 절차 및 소요 기간</h4>
                  <p>
                    • 신용카드 / 체크카드 결제: 취소 승인 후 카드사 영업일 기준 3~5일 이내 카드사 한도 복원 또는 계좌 환급<br />
                    • 간편결제(카카오페이, 네이버페이, 토스페이 등): 결제 수단 정책에 따라 당일 또는 익영업일 내 즉시 환불<br />
                    • 환불 관련 문의는 고객센터(051-208-8746 / nadosoloteam@gmail.com)로 접수해 주시면 신속히 처리해 드립니다.
                  </p>

                  <div className="pt-2 text-zinc-500 text-[11px] border-t border-white/5">
                    공고일자: 2026년 11월 1일 | 시행일자: 2026년 11월 1일
                  </div>
                </div>
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
