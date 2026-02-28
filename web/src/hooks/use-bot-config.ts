import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api';

export interface ConfigItem {
  key: string;
  group: string;
  label: string;
  value: string;
  is_set: boolean;
  required?: boolean;
  secret?: boolean;
  default?: string;
}

interface ConfigResponse {
  config: ConfigItem[];
  env_file: string;
}

async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch(apiUrl('/api/config'));
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useBotConfig() {
  return useQuery({
    queryKey: ['bot-config'],
    queryFn: fetchConfig,
  });
}

export function useSaveConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: Record<string, string>) => {
      const res = await fetch(apiUrl('/api/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
  });
}

export function useRestartBot() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl('/api/restart'), { method: 'POST' });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });
}
