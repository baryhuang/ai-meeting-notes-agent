import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api';

export interface ZoomStatus {
  connected: boolean;
  email?: string;
  zoom_user_id?: string;
  expires_at?: number;
  connected_at?: string;
  transcript_count?: number;
  last_poll?: string | null;
}

export interface ZoomTranscript {
  id: string;
  meeting_uuid: string;
  meeting_id: string;
  topic: string;
  start_time: string;
  duration: number;
  local_path: string;
  processed_at: string;
  success: boolean;
}

async function fetchZoomStatus(): Promise<ZoomStatus> {
  const res = await fetch(apiUrl('/api/oauth/zoom/status'));
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchZoomTranscripts(
  limit = 50,
  offset = 0
): Promise<{ transcripts: ZoomTranscript[] }> {
  const res = await fetch(
    apiUrl(`/api/zoom/transcripts?limit=${limit}&offset=${offset}`)
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function disconnectZoom(): Promise<void> {
  const res = await fetch(apiUrl('/api/oauth/zoom/disconnect'), { method: 'POST' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export function useZoomStatus() {
  return useQuery({
    queryKey: ['zoom-status'],
    queryFn: fetchZoomStatus,
    refetchInterval: 10_000,
  });
}

export function useZoomTranscripts(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['zoom-transcripts', limit, offset],
    queryFn: () => fetchZoomTranscripts(limit, offset),
    refetchInterval: 30_000,
  });
}

export function useZoomDisconnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectZoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-status'] });
      queryClient.invalidateQueries({ queryKey: ['zoom-transcripts'] });
    },
  });
}
