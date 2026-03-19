import { useState, useCallback } from 'react';
import { ChevronRight, MessageSquare, Calendar, Eye, Download, FileText, StickyNote } from 'lucide-react';
import { getS3PresignedUrl } from '../api';
import type { TreeNode } from '../types';

interface ConversationsViewProps {
  treeData: TreeNode;
}

/** Extract individual filenames from the raw field (handles "cat f1 f2", JSON arrays, single files) */
function parseRawFiles(raw: string | undefined): string[] {
  if (!raw) return [];
  // "cat file1.txt file2.txt" → strip cat prefix, split by space
  if (raw.startsWith('cat ')) {
    return raw.slice(4).trim().split(/\s+/).filter(f => f.endsWith('.txt') || f.endsWith('.vtt'));
  }
  // JSON array as string: '["file1.txt", "file2.txt"]'
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch { /* fall through */ }
  }
  // Single file
  return [raw];
}

/** Only transcribe-bot_* files live on S3. Zoom VTTs and others are not on S3. */
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
  const raw = (node as any).raw as string | undefined;
  const notes = (node as any).notes as string[] | undefined;
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

function ConversationItem({ node, defaultExpanded }: { node: TreeNode; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const conversations = (node as any).conversations as string | undefined;
  const hasChildren = node.children && node.children.length > 0;
  const date = node.name; // e.g. "2026-03-18"

  return (
    <div className="conv-date-group">
      <button className="conv-date-header" onClick={() => setExpanded(!expanded)}>
        <ChevronRight size={14} className={`conv-chevron${expanded ? ' expanded' : ''}`} />
        <Calendar size={16} className="conv-date-icon" />
        <span className="conv-date-name">{node.name}</span>
        {conversations && <span className="conv-date-count">{conversations} conversations</span>}
      </button>
      {expanded && hasChildren && (
        <div className="conv-items">
          {[...node.children!].sort((a, b) => {
            const ta = (a as any).time as string | undefined;
            const tb = (b as any).time as string | undefined;
            if (!ta && !tb) return 0;
            if (!ta) return 1;
            if (!tb) return -1;
            return tb.localeCompare(ta);
          }).map((child, i) => (
            <ConversationEntry key={i} node={child} date={date} />
          ))}
        </div>
      )}
      {expanded && !hasChildren && (
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

export function ConversationsView({ treeData }: ConversationsViewProps) {
  const dateNodes = [...(treeData.children ?? [])].sort((a, b) => b.name.localeCompare(a.name));

  return (
    <div className="conv-view">
      <div className="conv-header">
        <h2 className="conv-title">Conversations</h2>
        <span className="conv-summary">{dateNodes.length} date{dateNodes.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="conv-list">
        {dateNodes.length === 0 && (
          <div className="conv-empty-state">
            No conversations synced yet. Upload meeting transcripts to populate this view.
          </div>
        )}
        {dateNodes.map((node, i) => (
          <ConversationItem key={i} node={node} defaultExpanded={i === 0} />
        ))}
      </div>
    </div>
  );
}
