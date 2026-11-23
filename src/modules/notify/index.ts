export type NotifyProvider = 'TEST' | 'SOLAPI' | 'ALIGO';

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

export function getDefaultNotifyAdapter(): NotifyAdapter {
  const solKey = process.env.SOLAPI_API_KEY?.trim();
  const solSec = process.env.SOLAPI_API_SECRET?.trim();
  const sender = process.env.NOTIFY_SENDER_PHONE?.trim() || '';
  if (solKey && solSec && sender) {
    return createSolapiNotifyAdapter(solKey, solSec, sender);
  }
  return createTestNotifyAdapter();
}
