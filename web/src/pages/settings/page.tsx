import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ReactFlow,
  Background,
  ReactFlowProvider,
  type NodeTypes,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useBotConfig,
  useSaveConfig,
  useRestartBot,
  type ConfigItem,
} from '@/hooks/use-bot-config';
import { useBotStatus } from '@/hooks/use-bot-status';
import { INITIAL_NODES, INITIAL_EDGES } from './pipeline-config';
import { PipelineNode, PipelineContext } from './pipeline-node';
import { Activity, Clock, AlertTriangle, Server, Globe, ExternalLink } from 'lucide-react';

const nodeTypes: NodeTypes = {
  pipeline: PipelineNode,
};

const edges: Edge[] = INITIAL_EDGES.map((e) => ({
  ...e,
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
}));

const NODE_META: Record<string, { name: string; configGroup: string }> = {
  telegram: { name: 'Telegram', configGroup: 'Telegram' },
  transcription: { name: 'Transcription', configGroup: 'Transcription' },
  storage: { name: 'Storage', configGroup: 'Storage' },
  chat: { name: 'Conversation', configGroup: 'Conversation' },
  file_analysis: { name: 'Claude Code Agent', configGroup: 'Claude Code Agent' },
};

function formatUptime(seconds: number | null): string {
  if (seconds == null) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

function deploymentLabel(type: string): string {
  switch (type) {
    case 'aws-ecs': return 'AWS ECS';
    case 'aws-ec2': return 'AWS EC2';
    case 'docker': return 'Docker';
    case 'systemd': return 'Systemd Service';
    default: return 'Local';
  }
}

function deploymentVariant(type: string) {
  switch (type) {
    case 'aws-ecs':
    case 'aws-ec2': return 'warning' as const;
    case 'docker': return 'info' as const;
    case 'systemd': return 'primary' as const;
    default: return 'secondary' as const;
  }
}

function ConfigDialog({
  nodeId,
  open,
  onOpenChange,
  configItems,
  onChange,
}: {
  nodeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configItems: ConfigItem[];
  onChange: (key: string, value: string) => void;
}) {
  const meta = NODE_META[nodeId];
  if (!meta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.name} Settings</DialogTitle>
          <DialogDescription>
            Configure environment variables for the {meta.name} module.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {configItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No configurable fields for this module.
            </p>
          ) : (
            <div className="grid gap-4">
              {configItems.map((item) => (
                <div key={item.key} className="grid gap-1.5">
                  <label htmlFor={`dlg-${item.key}`} className="text-sm font-medium text-foreground">
                    {item.label}
                    {item.required && <span className="text-destructive ml-0.5">*</span>}
                    <span className="ml-2 text-xs text-muted-foreground font-mono">
                      {item.key}
                    </span>
                  </label>
                  <Input
                    id={`dlg-${item.key}`}
                    type={item.secret ? 'password' : 'text'}
                    placeholder={
                      item.secret
                        ? item.is_set ? item.value : item.default || 'Not set'
                        : item.default || 'Not set'
                    }
                    defaultValue={item.secret ? '' : item.value}
                    onChange={(e) => onChange(item.key, e.target.value)}
                  />
                  {item.default && (
                    <span className="text-xs text-muted-foreground">
                      Default: {item.default}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsPage() {
  const { data, isLoading, error } = useBotConfig();
  const { data: status } = useBotStatus();
  const saveConfig = useSaveConfig();
  const restartBot = useRestartBot();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!data?.config) return {};
    const map: Record<string, ConfigItem[]> = {};
    for (const item of data.config) {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    }
    return map;
  }, [data]);

  const hasChanges = Object.keys(edits).length > 0;

  function handleChange(key: string, value: string) {
    setEdits((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  async function handleSave(andRestart = false) {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    try {
      await saveConfig.mutateAsync(edits);
      setEdits({});
      toast.success('Configuration saved');
      if (andRestart) {
        await restartBot.mutateAsync();
        toast.success('Bot is restarting...');
      }
    } catch (err) {
      toast.error(`Failed to save: ${err}`);
    }
  }

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: { id: string }) => {
    setSelectedNode(node.id);
  }, []);

  const ctxValue = useMemo(
    () => ({ status, onNodeClick: (id: string) => setSelectedNode(id) }),
    [status],
  );

  const selectedConfigItems = selectedNode
    ? groups[NODE_META[selectedNode]?.configGroup] ?? []
    : [];

  if (isLoading) {
    return (
      <div className="container">
        <div className="p-5 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="p-5 text-destructive">
          Failed to load configuration: {String(error)}
        </div>
      </div>
    );
  }

  const counters = status?.counters;
  const recentErrors = status?.recent_errors ?? [];

  return (
    <div className="container">
      <div className="flex flex-col gap-5">

        {/* ── Status bar ── */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <span className="font-semibold">{status?.bot_name ?? 'Bot'}</span>
              {status ? (
                <Badge variant="success" size="sm">Online</Badge>
              ) : (
                <Badge variant="secondary" size="sm">Offline</Badge>
              )}
            </div>
            {status && (
              <>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  Uptime: {formatUptime(status.uptime_seconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last activity: {formatTimestamp(status.last_activity)}
                </div>
              </>
            )}
            {counters && (
              <div className="flex items-center gap-4 ml-auto text-sm">
                <span><strong>{counters.transcriptions}</strong> transcriptions</span>
                <span><strong>{counters.chats}</strong> chats</span>
                <span><strong>{counters.files}</strong> files</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Deployment info ── */}
        {status?.deployment && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Server className="size-3.5 text-muted-foreground" />
                <Badge variant={deploymentVariant(status.deployment.type)} appearance="light" size="sm">
                  {deploymentLabel(status.deployment.type)}
                </Badge>
              </div>
              {status.deployment.public_ip && (
                <a
                  href={`http://${status.deployment.public_ip}:8080`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline font-mono text-xs"
                >
                  <ExternalLink className="size-3.5" />
                  {status.deployment.public_ip}:8080
                </a>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="size-3.5" />
                {status.deployment.hostname}
                <span className="font-mono text-xs">({status.deployment.private_ip})</span>
              </div>
              {status.deployment.region && (
                <span className="text-muted-foreground">{status.deployment.region}</span>
              )}
              <span className="text-muted-foreground">
                Python {status.deployment.python} · {status.deployment.os}
              </span>
            </CardContent>
          </Card>
        )}

        {/* ── Pipeline diagram ── */}
        <div className="h-[400px] rounded-xl border border-border bg-card">
          <ReactFlowProvider>
            <PipelineContext.Provider value={ctxValue}>
              <ReactFlow
                nodes={INITIAL_NODES}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={20} size={1} />
              </ReactFlow>
            </PipelineContext.Provider>
          </ReactFlowProvider>
        </div>

        <p className="text-xs text-muted-foreground -mt-3">
          Click a node to edit its settings.
        </p>

        {/* ── Config dialog ── */}
        {selectedNode !== null && (
          <ConfigDialog
            nodeId={selectedNode}
            open
            onOpenChange={(open) => { if (!open) setSelectedNode(null); }}
            configItems={selectedConfigItems}
            onChange={handleChange}
          />
        )}

        {/* ── Save buttons ── */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleSave(false)}
            disabled={!hasChanges || saveConfig.isPending}
          >
            {saveConfig.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={!hasChanges || saveConfig.isPending || restartBot.isPending}
          >
            {restartBot.isPending ? 'Restarting...' : 'Save & Restart'}
          </Button>
        </div>

        {/* ── Recent errors ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">No errors</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Time</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentErrors.map((err, i) => (
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

        <div className="pb-5" />
      </div>
    </div>
  );
}
