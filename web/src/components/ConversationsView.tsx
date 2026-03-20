import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, MessageSquare, Calendar, Eye, Download, FileText, StickyNote, Search, X, Sparkles } from 'lucide-react';
import { getS3PresignedUrl, queryConversationsAI } from '../api';
import type { TreeNode, AIQueryResult } from '../types';

interface ConversationsViewProps {
  treeData: TreeNode;
}

/** Extract individual filenames from the raw field (handles "cat f1 f2", JSON arrays, single files) */
function parseRawFiles(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === 'string');
  if (typeof raw !== 'string') return [];
  if (raw.startsWith('cat ')) {
    return raw.slice(4).trim().split(/\s+/).filter(f => f.endsWith('.txt') || f.endsWith('.vtt'));
  }
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch { /* fall through */ }
  }
  return [raw];
}

function isS3File(filename: string): boolean {
  return filename.startsWith('transcribe-bot_');
}

function FileButton({ filename, date, label, icon }: { filename: string; date: string; label: string; icon: 'transcript' | 'note' }) {
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async (mode: 'view' | 'download') => {
    const s3Key = `by-dates/${date}/${filename}`;
    setLoading(true);
    try {
      const url = await getS3PresignedUrl(s3Key, mode);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to get presigned URL:', err);
    } finally {
      setLoading(false);
    }
  }, [filename, date]);

  if (!isS3File(filename)) {
    return (
      <div className="conv-file-row">
        {icon === 'transcript' ? <FileText size={12} /> : <StickyNote size={12} />}
        <span className="conv-file-name" title={filename}>{label}</span>
        <span className="conv-file-na">not on S3</span>
      </div>
    );
  }

  return (
    <div className="conv-file-row">
      {icon === 'transcript' ? <FileText size={12} /> : <StickyNote size={12} />}
      <span className="conv-file-name" title={filename}>{label}</span>
      <button className="conv-file-btn view" onClick={() => handleAction('view')} disabled={loading} title="View">
        <Eye size={12} /> View
      </button>
      <button className="conv-file-btn download" onClick={() => handleAction('download')} disabled={loading} title="Download">
        <Download size={12} /> Download
      </button>
    </div>
  );
}

function ConversationFiles({ node, date }: { node: TreeNode; date: string }) {
  const raw = (node as any).raw;
  const notesRaw = (node as any).notes;
  const notes: string[] | undefined = typeof notesRaw === 'string' ? [notesRaw] : Array.isArray(notesRaw) ? notesRaw : undefined;
  const rawFiles = parseRawFiles(raw);

  if (rawFiles.length === 0 && (!notes || notes.length === 0)) return null;

  return (
    <div className="conv-files">
      {rawFiles.map((f, i) => (
        <FileButton key={`raw-${i}`} filename={f} date={date} label={rawFiles.length === 1 ? 'Transcript' : `Transcript ${i + 1}`} icon="transcript" />
      ))}
      {notes?.map((f, i) => (
        <FileButton key={`note-${i}`} filename={f} date={date} label={notes.length === 1 ? 'Note' : `Note ${i + 1}`} icon="note" />
      ))}
    </div>
  );
}

function ConversationItem({ node, defaultExpanded, filter }: { node: TreeNode; defaultExpanded?: boolean; filter: string }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const conversations = (node as any).conversations as string | undefined;
  const date = node.name;

  const filteredChildren = useMemo(() => {
    if (!node.children) return [];
    const sorted = [...node.children].sort((a, b) => {
      const ta = (a as any).time as string | undefined;
      const tb = (b as any).time as string | undefined;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return tb.localeCompare(ta);
    });
    if (!filter) return sorted;
    const lf = filter.toLowerCase();
    return sorted.filter(child => {
      const name = child.name?.toLowerCase() ?? '';
      const desc = child.desc?.toLowerCase() ?? '';
      const participants = ((child as any).participants as string | undefined)?.toLowerCase() ?? '';
      const type = ((child as any).type as string | undefined)?.toLowerCase() ?? '';
      return name.includes(lf) || desc.includes(lf) || participants.includes(lf) || type.includes(lf);
    });
  }, [node.children, filter]);

  const hasChildren = filteredChildren.length > 0;
  // Auto-expand if filter matches some children
  const isExpanded = expanded || (!!filter && hasChildren);

  // Hide entire date group if filter active and no matches
  if (filter && !hasChildren) return null;

  return (
    <div className="conv-date-group">
      <button className="conv-date-header" onClick={() => setExpanded(!expanded)}>
        <ChevronRight size={14} className={`conv-chevron${isExpanded ? ' expanded' : ''}`} />
        <Calendar size={16} className="conv-date-icon" />
        <span className="conv-date-name">{node.name}</span>
        {filter
          ? <span className="conv-date-count">{filteredChildren.length} match{filteredChildren.length !== 1 ? 'es' : ''}</span>
          : conversations && <span className="conv-date-count">{conversations} conversations</span>
        }
      </button>
      {isExpanded && hasChildren && (
        <div className="conv-items">
          {filteredChildren.map((child, i) => (
            <ConversationEntry key={i} node={child} date={date} />
          ))}
        </div>
      )}
      {isExpanded && !hasChildren && (
        <div className="conv-empty">No conversation details synced yet.</div>
      )}
    </div>
  );
}

function ConversationEntry({ node, date }: { node: TreeNode; date: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = node.desc || (node.quotes && node.quotes.length > 0) || (node.children && node.children.length > 0);
  const hasFiles = (node as any).raw || (node as any).notes;
  const time = (node as any).time as string | undefined;
  const type = (node as any).type as string | undefined;
  const participants = (node as any).participants as string | undefined;

  return (
    <div className="conv-entry">
      <button
        className={`conv-entry-header${(hasDetail || hasFiles) ? ' clickable' : ''}`}
        onClick={() => (hasDetail || hasFiles) && setExpanded(!expanded)}
        disabled={!(hasDetail || hasFiles)}
      >
        <MessageSquare size={14} className="conv-entry-icon" />
        <span className="conv-entry-name">{node.name}</span>
        {time && <span className="conv-entry-time">{time}</span>}
        {type && <span className="conv-entry-type">{type}</span>}
        {participants && <span className="conv-entry-participants">{participants}</span>}
        {(hasDetail || hasFiles) && <ChevronRight size={10} className={`conv-chevron-sm${expanded ? ' expanded' : ''}`} />}
      </button>
      {expanded && (
        <div className="conv-entry-detail">
          {node.desc && <p className="conv-entry-desc">{node.desc}</p>}
          <ConversationFiles node={node} date={date} />
          {node.quotes && node.quotes.length > 0 && (
            <div className="conv-entry-quotes">
              {node.quotes.map((q, i) => (
                <blockquote key={i} className="conv-quote">{q}</blockquote>
              ))}
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <div className="conv-entry-children">
              {node.children.map((child, i) => (
                <ConversationEntry key={i} node={child} date={date} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Flatten all conversations for AI context */
function flattenConversations(dateNodes: TreeNode[]): { date: string; name: string; time?: string; type?: string; participants?: string; desc?: string }[] {
  const items: { date: string; name: string; time?: string; type?: string; participants?: string; desc?: string }[] = [];
  for (const dateNode of dateNodes) {
    for (const child of dateNode.children ?? []) {
      items.push({
        date: dateNode.name,
        name: child.name,
        time: (child as any).time,
        type: (child as any).type,
        participants: (child as any).participants,
        desc: child.desc,
      });
    }
  }
  return items;
}

function AIResultPanel({ result, onClose }: { result: AIQueryResult; onClose: () => void }) {
  return (
    <div className="conv-ai-result">
      <div className="conv-ai-result-header">
        <h3>{result.title}</h3>
        <button className="conv-ai-close" onClick={onClose}><X size={14} /></button>
      </div>
      {result.summary && <p className="conv-ai-summary">{result.summary}</p>}
      <div className="conv-ai-table-wrap">
        <table className="conv-ai-table">
          <thead>
            <tr>
              {result.columns.map(col => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i}>
                {result.columns.map(col => (
                  <td key={col.key}>{row[col.key] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConversationsView({ treeData }: ConversationsViewProps) {
  const dateNodes = [...(treeData.children ?? [])].sort((a, b) => b.name.localeCompare(a.name));
  const [query, setQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIQueryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const allConversations = useMemo(() => flattenConversations(dateNodes), [dateNodes]);

  const fireAIQuery = useCallback(async () => {
    if (!query.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await queryConversationsAI(query, allConversations);
      setAiResult(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setAiLoading(false);
    }
  }, [query, aiLoading, allConversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      fireAIQuery();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setAiResult(null);
    setAiError(null);
  };

  const totalConvs = allConversations.length;

  return (
    <div className="conv-view">
      <div className="conv-header">
        <h2 className="conv-title">Conversations</h2>
        <span className="conv-summary">{dateNodes.length} date{dateNodes.length !== 1 ? 's' : ''}, {totalConvs} conversations</span>
      </div>

      {/* Unified search: filters locally as you type, AI search on Enter */}
      <div className="conv-search-bar">
        <Search size={14} className="conv-search-icon" />
        <input
          type="text"
          placeholder="Search conversations... (Enter for AI analysis)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={aiLoading}
        />
        {query && !aiLoading && (
          <button className="conv-search-clear" onClick={clearSearch}>
            <X size={12} />
          </button>
        )}
        <button
          className="conv-ai-btn"
          disabled={aiLoading || !query.trim()}
          onClick={fireAIQuery}
          title="AI analysis (Enter)"
        >
          {aiLoading ? <span className="conv-ai-spinner" /> : <Sparkles size={14} />}
          {aiLoading ? 'Analyzing...' : 'Ask AI'}
        </button>
      </div>

      {aiError && <div className="conv-ai-error">{aiError}</div>}
      {aiResult && <AIResultPanel result={aiResult} onClose={() => setAiResult(null)} />}

      <div className="conv-list">
        {dateNodes.length === 0 && (
          <div className="conv-empty-state">
            No conversations synced yet. Upload meeting transcripts to populate this view.
          </div>
        )}
        {dateNodes.map((node, i) => (
          <ConversationItem key={i} node={node} defaultExpanded={i === 0} filter={query} />
        ))}
      </div>
    </div>
  );
}
