import { redirect } from 'next/navigation';

export default function MirrorRedirectPage() {
  redirect('/dashboard?step=P10_REPORT');
}
