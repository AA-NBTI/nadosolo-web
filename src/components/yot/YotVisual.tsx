import React from 'react';

interface YotVisualProps {
  count: number; // 1, 2, 3
  className?: string;
}

export default function YotVisual({ count, className = '' }: YotVisualProps) {
  // 실제 전통 가락엿 그래픽 (노릇하고 쫄깃한 황갈색 엿가락 + 쌀가루 텍스처)
  return (
    <div className={`flex items-center justify-center gap-3 select-none ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative flex flex-col items-center animate-bounce"
          style={{ animationDelay: `${idx * 150}ms` }}
        >
          {/* 가락엿 바디 */}
          <div className="w-8 sm:w-10 h-20 sm:h-24 rounded-full bg-gradient-to-b from-[#e6b980] via-[#c99455] to-[#a06d33] border-2 border-[#fff2d6]/40 shadow-[0_8px_16px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-around py-2">
            {/* 엿 가닥 빗살무늬 */}
            <div className="w-full h-1 bg-white/20 -rotate-12" />
            <div className="w-full h-1 bg-white/30 -rotate-12" />
            <div className="w-full h-1 bg-white/20 -rotate-12" />
            
            {/* 쌀가루 하이라이트 */}
            <div className="absolute top-1 left-2 w-2 h-4 rounded-full bg-white/40 blur-[1px]" />
          </div>

          <span className="mt-1.5 text-xs font-mono font-bold text-amber-200">
            엿 #{idx + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
