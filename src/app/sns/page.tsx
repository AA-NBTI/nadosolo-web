import React, { Suspense } from 'react';
import { OopsSnsMainContent } from '../oops/page';

export const metadata = {
  title: 'OOPS.MONSTER // SNS',
  description: 'Live field intelligence network of human resistance against autonomous AI decisions.',
};

export default function SnsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f4f0]" />}>
      <OopsSnsMainContent initialView="SNS" />
    </Suspense>
  );
}
