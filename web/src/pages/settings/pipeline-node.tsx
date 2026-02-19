import { createContext, useContext } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PipelineNodeData } from './pipeline-config';
import type { ConfigItem } from '@/hooks/use-bot-config';
import type { BotStatus } from '@/hooks/use-bot-status';

export interface PipelineNodeContextValue {
  status: BotStatus | undefined;
  onNodeClick: (nodeId: string) => void;
}

export const PipelineContext = createContext<PipelineNodeContextValue>({
  status: undefined,
  onNodeClick: () => {},
});

function getModuleStatus(statusKey: string | undefined, status: BotStatus | undefined) {
  if (!statusKey) return { enabled: true, subtitle: '' };
  if (!status) return { enabled: false, subtitle: '' };

  const mod = status.modules[statusKey as keyof BotStatus['modules']];
  if (!mod) return { enabled: false, subtitle: '' };

  const parts: string[] = [];
  if ('provider' in mod && mod.provider) parts.push(mod.provider);
  if ('model' in mod && (mod as { model?: string }).model) parts.push((mod as { model: string }).model);
  if (statusKey === 'storage') {
    const s = mod as BotStatus['modules']['storage'];
    if (s.s3) parts.push(`S3: ${s.s3_bucket}`);
    if (s.local) parts.push('local');
  }

  return { enabled: mod.enabled, subtitle: parts.join(' · ') };
}

const handleStyle = { background: 'transparent', border: 'none', width: 1, height: 1 };

export function PipelineNode({ data }: NodeProps) {
  const nodeData = data as unknown as PipelineNodeData;
  const { status, onNodeClick } = useContext(PipelineContext);
  const Icon = nodeData.icon;
  const { enabled, subtitle } = getModuleStatus(nodeData.statusKey, status);

  return (
    <>
      <Handle type="source" position={Position.Right} id="src-right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="src-bottom" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="src-left" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="src-top" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="tgt-left" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="tgt-top" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="tgt-right" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="tgt-bottom" style={handleStyle} />

      <Card
        className={cn(
          'w-64 cursor-pointer transition-shadow hover:shadow-md',
          !enabled && 'opacity-60',
        )}
      >
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">{nodeData.name}</CardTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <Badge
            variant={enabled ? 'success' : 'secondary'}
            appearance="light"
            size="sm"
            className="shrink-0"
          >
            {enabled ? 'Active' : 'Inactive'}
          </Badge>
        </CardHeader>
      </Card>
    </>
  );
}
