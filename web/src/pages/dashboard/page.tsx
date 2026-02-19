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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useBotStatus } from '@/hooks/use-bot-status';
import {
  Mic,
  MessageSquare,
  FileText,
  Cloud,
  HardDrive,
  AlertTriangle,
  Activity,
  Clock,
} from 'lucide-react';

function formatUptime(seconds: number | null): string {
  if (seconds == null) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString();
}

export function DashboardPage() {
  const { data: status, isLoading, error } = useBotStatus();

  if (isLoading) {
    return (
      <div className="container">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>Dashboard</ToolbarPageTitle>
            <ToolbarDescription>Loading bot status...</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
        <div className="grid gap-5">
          <Skeleton className="h-24 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="container">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>Dashboard</ToolbarPageTitle>
            <ToolbarDescription>Bot Status Overview</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <AlertTriangle className="mx-auto mb-3 size-8" />
            <p>Could not connect to the bot API.</p>
            <p className="text-sm mt-1">
              Make sure the server is running on port 8080.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { modules, counters, recent_errors } = status;

  return (
    <div className="container">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>Dashboard</ToolbarPageTitle>
          <ToolbarDescription>Bot Status Overview</ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      {/* Top row — bot info */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <span className="font-semibold text-lg">{status.bot_name}</span>
            <Badge variant="success" size="sm">
              Online
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            Uptime: {formatUptime(status.uptime_seconds)}
          </div>
          <div className="text-sm text-muted-foreground">
            Last activity: {formatTimestamp(status.last_activity)}
          </div>
        </CardContent>
      </Card>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {/* Transcription — always shown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mic className="size-4" />
              Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="success" size="sm">
              Active
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {modules.transcription.provider}
            </p>
          </CardContent>
        </Card>

        {/* Conversation — only if enabled */}
        {modules.chat.enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="size-4" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success" size="sm">
                Active
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {modules.chat.provider} &middot; {modules.chat.model}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Claude Code Agent — only if enabled */}
        {modules.file_analysis.enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4" />
                Claude Code Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success" size="sm">
                Active
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {modules.file_analysis.provider}
                {modules.file_analysis.model &&
                  ` \u00b7 ${modules.file_analysis.model}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {modules.storage.s3 ? (
                <Cloud className="size-4" />
              ) : (
                <HardDrive className="size-4" />
              )}
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="success" size="sm">
              Local
            </Badge>
            {modules.storage.s3 && (
              <>
                {' '}
                <Badge variant="primary" size="sm">
                  S3
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {modules.storage.s3_bucket}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-bold">{counters.transcriptions}</p>
            <p className="text-sm text-muted-foreground mt-1">Transcriptions</p>
          </CardContent>
        </Card>
        {modules.chat.enabled && (
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-3xl font-bold">{counters.chats}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Chat Messages
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-bold">{counters.files}</p>
            <p className="text-sm text-muted-foreground mt-1">Files Stored</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent errors table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent_errors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No errors
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Time</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_errors.map((err, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(err.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm">{err.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
