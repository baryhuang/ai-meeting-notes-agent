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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useBotConfig,
  useSaveConfig,
  useRestartBot,
  type ConfigItem,
} from '@/hooks/use-bot-config';
import { useBotStatus } from '@/hooks/use-bot-status';
import { INITIAL_NODES, INITIAL_EDGES } from './pipeline-config';
import { PipelineNode, PipelineContext } from './pipeline-node';

const nodeTypes: NodeTypes = {
  pipeline: PipelineNode,
};

const edges: Edge[] = INITIAL_EDGES.map((e) => ({
  ...e,
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
}));

/** Map node IDs to display names and config groups */
const NODE_META: Record<string, { name: string; configGroup: string }> = {
  telegram: { name: 'Telegram', configGroup: 'Telegram' },
  transcription: { name: 'Transcription', configGroup: 'Transcription' },
  storage: { name: 'Storage', configGroup: 'Storage' },
  chat: { name: 'Conversation', configGroup: 'Conversation' },
  file_analysis: { name: 'Claude Code Agent', configGroup: 'Claude Code Agent' },
};

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
        <div className="p-5 text-muted-foreground">Loading configuration...</div>
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

  return (
    <div className="container">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the bot pipeline. Click a node to edit its settings.
          </p>
        </div>

        {/* ── Pipeline diagram ── */}
        <div className="h-[420px] rounded-xl border border-border bg-card">
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
        <div className="flex gap-3 pb-5">
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
      </div>
    </div>
  );
}
