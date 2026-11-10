export default function GlobalLoading() {
  return (
    // 본문 레이아웃을 가로채거나 깜빡이지 않는 초경량 상단 프로그레스 라인
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-white/5 overflow-hidden pointer-events-none">
      <div className="h-full w-1/3 bg-[#f04f74] animate-pulse shadow-[0_0_8px_#f04f74]" />
    </div>
  );
}
