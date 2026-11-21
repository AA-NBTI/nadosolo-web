import { redirect } from 'next/navigation';

/**
 * 업체 회원가입(/biz/apply)은 나도솔로 /auth?tab=signup 구조와 동일하게 /biz?tab=signup으로 통합합니다.
 */
export default function BizApplyRedirectPage() {
  redirect('/biz?tab=signup');
}
