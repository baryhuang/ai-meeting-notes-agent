import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api';

export interface BotStatus {
  bot_name: string;
  started_at: string | null;
  uptime_seconds: number | null;
  last_activity: string | null;
  modules: {
    transcription: { enabled: boolean; provider: string };
    chat: { enabled: boolean; provider: string; model: string };
    file_analysis: {
      enabled: boolean;
      provider: string;
      model: string;
      base_url: string;
    };
    storage: {
      enabled: boolean;
      local: boolean;
      s3: boolean;
      s3_bucket: string;
    };
  };
  counters: {
    transcriptions: number;
    chats: number;
    files: number;
  };
  recent_errors: Array<{ timestamp: string; message: string }>;
  deployment: {
    type: 'local' | 'aws-ecs' | 'aws-ec2' | 'docker' | 'systemd';
    hostname: string;
    private_ip: string;
    public_ip: string;
    region: string;
    detail: string;
    python: string;
    os: string;
  };
}

async function fetchBotStatus(): Promise<BotStatus> {
  const res = await fetch(apiUrl('/api/status'));
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useBotStatus() {
  return useQuery({
    queryKey: ['bot-status'],
    queryFn: fetchBotStatus,
    refetchInterval: 10_000,
  });
}
