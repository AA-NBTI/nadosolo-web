export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] bg-[#07080a] flex flex-col items-center justify-center px-6">
      {/* 상단 고정 핑크로즈 프로그레스 라인 */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-white/5 overflow-hidden">
        <div className="h-full w-1/3 bg-[#f04f74] animate-pulse shadow-[0_0_12px_#f04f74]" />
      </div>

      {/* 중앙 미니멀 로딩 인디케이터 */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#f04f74] animate-spin" />
        <span className="text-[11px] font-mono tracking-[0.25em] text-zinc-400 uppercase">
          LOADING
        </span>
      </div>
    </div>
  );
}

