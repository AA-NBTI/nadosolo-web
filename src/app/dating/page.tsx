'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DatingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/salon');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-zinc-400 text-sm">소셜 살롱 페이지로 이동 중입니다...</p>
      </div>
    </div>
  );
}
