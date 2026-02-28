import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useZoomStatus,
  useZoomTranscripts,
  useZoomDisconnect,
} from '@/hooks/use-zoom-status';
import { apiUrl } from '@/lib/api';
import { Video, Clock, FileText, Unplug } from 'lucide-react';

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString();
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return '-';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function IntegrationsPage() {
  const { data: zoomStatus, isLoading: statusLoading } = useZoomStatus();
  const { data: transcriptsData, isLoading: transcriptsLoading } =
    useZoomTranscripts();
  const disconnectMutation = useZoomDisconnect();

  const connected = zoomStatus?.connected ?? false;

  return (
    <div className="container">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>Integrations</ToolbarPageTitle>
          <ToolbarDescription>
            Connect external services to pull meeting transcripts automatically
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      {/* Zoom Integration Card */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="size-5" />
            Zoom
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : connected ? (
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="success" size="sm">
                Connected
              </Badge>
              {zoomStatus?.email && (
                <span className="text-sm text-muted-foreground">
                  {zoomStatus.email}
                </span>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                {zoomStatus?.transcript_count ?? 0} transcripts
              </div>
              {zoomStatus?.last_poll && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  Last poll: {formatTimestamp(zoomStatus.last_poll)}
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                <Unplug className="size-4 mr-1" />
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Connect your Zoom account to automatically pull meeting
                transcripts.
              </p>
              <Button
                onClick={() => {
                  window.location.href = apiUrl('/api/oauth/zoom/authorize');
                }}
              >
                <Video className="size-4 mr-2" />
                Connect Zoom
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transcripts */}
      {connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4" />
              Recent Zoom Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transcriptsLoading ? (
              <Skeleton className="h-32" />
            ) : !transcriptsData?.transcripts?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No transcripts yet. Transcripts will appear here after the
                next poll.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead className="w-40">Date</TableHead>
                    <TableHead className="w-24">Duration</TableHead>
                    <TableHead className="w-40">Pulled At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transcriptsData.transcripts.map((t) => (
                    <TableRow key={t.meeting_uuid}>
                      <TableCell className="font-medium">
                        {t.topic || 'Untitled Meeting'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(t.start_time)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(t.duration)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(t.processed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
