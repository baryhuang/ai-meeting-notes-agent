import {
  MessageSquare,
  Mic,
  HardDrive,
  Bot,
  FileSearch,
  type LucideIcon,
} from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

export interface PipelineNodeData {
  nodeId: string;
  name: string;
  icon: LucideIcon;
  configGroup: string;
  statusKey?: 'transcription' | 'chat' | 'file_analysis' | 'storage';
  [key: string]: unknown;
}

const COL_GAP = 320;
const ROW_GAP = 150;

export const INITIAL_NODES: Node<PipelineNodeData>[] = [
  {
    id: 'telegram',
    type: 'pipeline',
    position: { x: 0, y: 0 },
    data: { nodeId: 'telegram', name: 'Telegram', icon: MessageSquare, configGroup: 'Telegram' },
  },
  {
    id: 'transcription',
    type: 'pipeline',
    position: { x: COL_GAP, y: 0 },
    data: { nodeId: 'transcription', name: 'Transcription', icon: Mic, configGroup: 'Transcription', statusKey: 'transcription' },
  },
  {
    id: 'storage',
    type: 'pipeline',
    position: { x: COL_GAP * 2, y: 0 },
    data: { nodeId: 'storage', name: 'Storage', icon: HardDrive, configGroup: 'Storage', statusKey: 'storage' },
  },
  {
    id: 'chat',
    type: 'pipeline',
    position: { x: COL_GAP, y: ROW_GAP },
    data: { nodeId: 'chat', name: 'Conversation', icon: Bot, configGroup: 'Conversation', statusKey: 'chat' },
  },
  {
    id: 'file_analysis',
    type: 'pipeline',
    position: { x: COL_GAP * 2, y: ROW_GAP },
    data: { nodeId: 'file_analysis', name: 'Claude Code Agent', icon: FileSearch, configGroup: 'Claude Code Agent', statusKey: 'file_analysis' },
  },
];

export const INITIAL_EDGES: Edge[] = [
  { id: 'e-telegram-transcription', source: 'telegram', sourceHandle: 'src-right', target: 'transcription', targetHandle: 'tgt-left', label: 'voice/audio' },
  { id: 'e-transcription-storage', source: 'transcription', sourceHandle: 'src-right', target: 'storage', targetHandle: 'tgt-left', label: 'transcript' },
  { id: 'e-transcription-chat', source: 'transcription', sourceHandle: 'src-bottom', target: 'chat', targetHandle: 'tgt-top', label: 'long text' },
  { id: 'e-chat-telegram', source: 'chat', sourceHandle: 'src-left', target: 'telegram', targetHandle: 'tgt-bottom', label: 'reply' },
  { id: 'e-chat-file_analysis', source: 'chat', sourceHandle: 'src-right', target: 'file_analysis', targetHandle: 'tgt-left', label: 'tool call', style: { strokeDasharray: '6 4' } },
  { id: 'e-file_analysis-storage', source: 'file_analysis', sourceHandle: 'src-top', target: 'storage', targetHandle: 'tgt-bottom' },
];
