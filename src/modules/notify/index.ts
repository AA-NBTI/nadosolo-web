export type NotifyProvider = 'TEST' | 'SOLAPI' | 'ALIGO' | 'OOPS';

export type NotifyService = 'NADOSOLO' | 'TABLEBARO';

export type NotifyTemplate =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'MEETUP_REVEAL';

export interface NotifyRequest {
  service: NotifyService;
  template: NotifyTemplate;
  to: string;
  title: string;
  body: string;
  linkUrl?: string;
  /** OOPS 독립 푸시용 요원 코드 (예: OP-XXXXXX 또는 ALL) */
  oopsTarget?: string;
}

export interface NotifyResult {
  ok: boolean;
  provider: NotifyProvider;
  messageId: string;
  error?: string;
}

export interface NotifyAdapter {
  readonly provider: NotifyProvider;
  send(req: NotifyRequest): Promise<NotifyResult>;
}

export interface NotifyLogRecord extends NotifyRequest {
  id: string;
  provider: NotifyProvider;
  status: 'SENT' | 'LOGGED' | 'FAILED';
  messageId: string;
  error?: string;
  at: string;
}

export function createTestNotifyAdapter(): NotifyAdapter {
  return {
    provider: 'TEST',
    async send(req) {
      return {
        ok: true,
        provider: 'TEST',
        messageId: `ntf_test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      };
    },
  };
}

export function createSolapiNotifyAdapter(apiKey: string, apiSecret: string, sender: string): NotifyAdapter {
  return {
    provider: 'SOLAPI',
    async send(req) {
      const cleanTo = req.to.replace(/\D/g, '');
      if (!cleanTo) {
        return { ok: false, provider: 'SOLAPI', messageId: '', error: '수신 번호 누락' };
      }
      // SOLAPI v4 메시지 발송 규격 (인증 헤더는 실제 운영 시 crypto HMAC-SHA256 서명 적용)
      try {
        const crypto = await import('node:crypto');
        const date = new Date().toISOString();
        const salt = crypto.randomBytes(16).toString('hex');
        const signature = crypto
          .createHmac('sha256', apiSecret)
          .update(date + salt)
          .digest('hex');

        const res = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers: {
            Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              to: cleanTo,
              from: sender.replace(/\D/g, ''),
              text: `[${req.title}] ${req.body}${req.linkUrl ? `\n${req.linkUrl}` : ''}`,
            },
          }),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, any>;
        if (!res.ok) {
          return {
            ok: false,
            provider: 'SOLAPI',
            messageId: '',
            error: data?.errorMessage || '솔라피 발송 실패',
          };
        }
        return {
          ok: true,
          provider: 'SOLAPI',
          messageId: String(data?.messageId || `sol_${Date.now()}`),
        };
      } catch (e) {
        return {
          ok: false,
          provider: 'SOLAPI',
          messageId: '',
          error: (e as Error).message,
        };
      }
    },
  };
}

/**
 * [OOPS 범용 알림 어댑터]
 * 나도솔로/테이블바로에서 OOPS REST API v1(/api/oops/v1/send)을 호출하여 발송하는 표준 클라이언트
 */
export function createOopsNotifyAdapter(options?: {
  apiBaseUrl?: string;
  apiKey?: string;
}): NotifyAdapter {
  return {
    provider: 'OOPS',
    async send(req) {
      const baseUrl =
        options?.apiBaseUrl ||
        process.env.OOPS_API_BASE_URL ||
        (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}` : 'https://oops.monster');
      const apiKey =
        options?.apiKey ||
        process.env.OOPS_API_KEY ||
        process.env.ADMIN_PASSWORD ||
        'oops_secret_key_2026';

      const target = req.oopsTarget || 'ALL';

      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/oops/v1/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            target,
            title: `[${req.service}] ${req.title}`,
            body: req.body,
            url: req.linkUrl || '/',
            sourceService: req.service,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as Record<string, any>;
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            provider: 'OOPS',
            messageId: '',
            error: data?.error || 'OOPS API 호출 실패',
          };
        }

        return {
          ok: true,
          provider: 'OOPS',
          messageId: String(data.messageId || `oops_${Date.now()}`),
        };
      } catch (e) {
        return {
          ok: false,
          provider: 'OOPS',
          messageId: '',
          error: (e as Error).message,
        };
      }
    },
  };
}

export function getDefaultNotifyAdapter(): NotifyAdapter {
  // 1순위: OOPS 범용 알림 사용 플래그 활성화 시 OOPS 어댑터 우선 사용
  if (process.env.USE_OOPS_NOTIFY === 'true' || process.env.NEXT_PUBLIC_USE_OOPS === 'true') {
    return createOopsNotifyAdapter();
  }
  const solKey = process.env.SOLAPI_API_KEY?.trim();
  const solSec = process.env.SOLAPI_API_SECRET?.trim();
  const sender = process.env.NOTIFY_SENDER_PHONE?.trim() || '';
  if (solKey && solSec && sender) {
    return createSolapiNotifyAdapter(solKey, solSec, sender);
  }
  return createTestNotifyAdapter();
}
