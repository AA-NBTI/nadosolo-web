import { redirect } from 'next/navigation';

export default async function TestRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp) {
    for (const [key, val] of Object.entries(sp)) {
      if (typeof val === 'string') params.set(key, val);
      else if (Array.isArray(val) && val[0]) params.set(key, val[0]);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/checklist?${qs}` : '/checklist');
}
