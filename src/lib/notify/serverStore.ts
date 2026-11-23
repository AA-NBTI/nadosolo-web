import { createAdminClient } from '@/lib/supabase/admin';
import {
  getDefaultNotifyAdapter,
  type NotifyLogRecord,
  type NotifyRequest,
  type NotifyService,
} from '@/modules/notify';

const NOTIFY_LOG_KEYS: Record<NotifyService, string> = {
  NADOSOLO: 'nadosolo_notify_logs_v1',
  TABLEBARO: 'tablebaro_notify_logs_v1',
};

const memLogs: Record<NotifyService, NotifyLogRecord[]> = {
  NADOSOLO: [],
  TABLEBARO: [],
};

const MAX_LOGS = 500;

async function readLogs(service: NotifyService): Promise<NotifyLogRecord[]> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return memLogs[service];
    const { data, error } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', NOTIFY_LOG_KEYS[service])
      .maybeSingle();
    if (!error && Array.isArray(data?.value)) {
      memLogs[service] = data.value as NotifyLogRecord[];
      return memLogs[service];
    }
  } catch {}
  return memLogs[service];
}

async function writeLogs(service: NotifyService, list: NotifyLogRecord[]): Promise<void> {
  memLogs[service] = list;
  try {
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase
      .from('app_configs')
      .upsert(
        { key: NOTIFY_LOG_KEYS[service], value: list, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
  } catch {}
}

export async function listNotifyLogs(service: NotifyService): Promise<NotifyLogRecord[]> {
  return readLogs(service);
}

export async function dispatchNotification(req: NotifyRequest): Promise<NotifyLogRecord> {
  const adapter = getDefaultNotifyAdapter();
  const res = await adapter.send(req);

  const log: NotifyLogRecord = {
    ...req,
    id: `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    provider: res.provider,
    status: !res.ok ? 'FAILED' : res.provider === 'TEST' ? 'LOGGED' : 'SENT',
    messageId: res.messageId || `log_${Date.now()}`,
    error: res.error,
    at: new Date().toISOString(),
  };

  const current = await readLogs(req.service);
  await writeLogs(req.service, [log, ...current].slice(0, MAX_LOGS));
  return log;
}
