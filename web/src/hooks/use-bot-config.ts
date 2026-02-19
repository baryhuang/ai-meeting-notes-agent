import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const res = await fetch('/api/config');
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
      const res = await fetch('/api/config', {
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
      const res = await fetch('/api/restart', { method: 'POST' });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });
}
