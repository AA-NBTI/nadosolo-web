'use client';

import { useEffect } from 'react';

/**
 * Vercel 새 배포 시 브라우저 캐시와 새 청크 해시 불일치로 인한
 * 'ChunkLoadError' 및 모듈 로딩 실패를 감지하여 자동으로 최신 페이지로 1회 새로고침하는 자가 치유 컴포넌트
 */
export default function ChunkErrorRecovery() {
  useEffect(() => {
    const handleChunkError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const message =
        'message' in e
          ? e.message
          : (e.reason && (e.reason.message || String(e.reason))) || '';

      const isChunkError =
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Load failed');

      if (isChunkError) {
        console.warn('[AutoRecovery] 신규 배포 청크 감지됨. 최신 페이지로 자동 새로고침합니다.');
        const reloadKey = 'nadosolo_chunk_reload_lock';
        const now = Date.now();
        const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');

        // 무한 루프 방지: 최근 10초 내 재시도한 적이 없을 때만 1회 강력 새로고침
        if (now - lastReload > 10000) {
          sessionStorage.setItem(reloadKey, String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}

