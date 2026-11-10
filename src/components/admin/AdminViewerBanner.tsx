'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function AdminViewerBanner() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSessionReady, isImpersonating, currentUser, stopAdminImpersonation } =
    useNadoSoloEngine();

  const onAdminRoute = pathname?.startsWith('/admin') ?? false;

  // /admin 으로 (링크·뒤로가기 등) 돌아오면 회원 열람 상태를 즉시 해제하고 관리자 세션 복원
  useEffect(() => {
    if (isSessionReady && isImpersonating && onAdminRoute) {
      stopAdminImpersonation();
    }
  }, [isSessionReady, isImpersonating, onAdminRoute, stopAdminImpersonation]);

  if (!isSessionReady || !isImpersonating || onAdminRoute) {
    return null;
  }

  const handleReturnToAdmin = () => {
    stopAdminImpersonation();
    router.push('/admin');
  };

  return (
    <aside
      aria-label="관리자 열람"
      className="fixed top-20 right-4 z-[60] flex items-center gap-3 bg-[#0c0d12] border border-white/30 px-3.5 py-2 shadow-2xl font-mono text-sm text-white"
    >
      <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
      <span className="text-zinc-400">관리자 열람</span>
      <span className="text-white font-medium">
        {currentUser?.nickname} ({currentUser?.handle})
      </span>
      <button
        type="button"
        onClick={handleReturnToAdmin}
        className="px-2.5 py-1 bg-[#f04f74] hover:bg-[#d03d60] text-white text-sm font-semibold transition-colors cursor-pointer"
      >
        관리자 복귀
      </button>
    </aside>
  );
}
