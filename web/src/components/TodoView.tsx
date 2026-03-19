import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronRight, Circle, CheckCircle2, Clock, Mail, CalendarCheck, Settings2, XCircle, User, CalendarDays, FileText } from 'lucide-react';
import { collectDates, parseDateOrdinal, TimelineBar } from './MarkmapView';
import { findDateIndex } from '../hooks/useTimelineCutoff';
import type { TimelineRange } from '../hooks/useTimelineCutoff';
import type { TreeNode } from '../types';

interface TodoViewProps {
  treeData: TreeNode;
  timelineRange: TimelineRange;
  onTimelineRangeChange: (range: Partial<TimelineRange>) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Email Follow-ups & Replies': <Mail size={16} />,
  'Meeting Action Items': <CalendarCheck size={16} />,
  'Prep & Deadlines': <Clock size={16} />,
  'Internal Ops & Setup': <Settings2 size={16} />,
};

function filterTreeByDate(node: TreeNode, startOrd: number, endOrd: number): TreeNode | null {
  const ord = parseDateOrdinal(node.date || '');
  const isLeaf = !node.children || node.children.length === 0;

  if (isLeaf) {
    // Leaf: keep if no date (structural) or date in range
    if (ord === null) return node;
    return (ord >= startOrd && ord <= endOrd) ? node : null;
  }

  // Branch: filter children recursively
  const filteredChildren = node.children!
    .map(c => filterTreeByDate(c, startOrd, endOrd))
    .filter((c): c is TreeNode => c !== null);

  // Keep branch if it has any children remaining
  if (filteredChildren.length === 0 && ord !== null && (ord < startOrd || ord > endOrd)) {
    return null;
  }

  return { ...node, children: filteredChildren };
}

const STATUS_LABELS: Record<string, string> = {
  done: 'Done', final: 'Done', partial: 'In Progress', excluded: 'Excluded',
};

function StatusIcon({ status }: { status?: string }) {
  if (status === 'done' || status === 'final') return <CheckCircle2 size={16} className="todo-icon done" />;
  if (status === 'excluded') return <XCircle size={16} className="todo-icon excluded" />;
  if (status === 'partial') return <Circle size={16} className="todo-icon pending" />;
  return <Circle size={16} className="todo-icon default" />;
}

function TodoItem({ node }: { node: TreeNode }) {
  const [showDetail, setShowDetail] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const owner = node.owner as string | undefined;
  const due = (node as any).due as string | undefined;
  const file = (node as any).file as string | undefined;
  const hasDetails = owner || due || file || node.desc || node.status;

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowDetail(true), 300);
  };
  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowDetail(false);
  };

  return (
    <div
      ref={itemRef}
      className={`todo-item${showDetail ? ' detail-open' : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <StatusIcon status={node.status} />
      <div className="todo-item-content">
        <span className="todo-item-name">{node.name}</span>
        {node.date && <span className="todo-item-date">{node.date}</span>}
      </div>
      {showDetail && hasDetails && (
        <div className="todo-item-detail">
          {node.status && (
            <span className={`todo-detail-tag status-${node.status}`}>
              {STATUS_LABELS[node.status] ?? node.status}
            </span>
          )}
          {owner && (
            <span className="todo-detail-tag"><User size={10} /> {owner}</span>
          )}
          {due && (
            <span className="todo-detail-tag due"><CalendarDays size={10} /> Due {due}</span>
          )}
          {file && (
            <span className="todo-detail-tag file"><FileText size={10} /> {file}</span>
          )}
          {node.desc && (
            <span className="todo-detail-desc">{node.desc}</span>
          )}
        </div>
      )}
    </div>
  );
}

const DONE_STATUSES = new Set(['done', 'final', 'excluded']);

function isDone(node: TreeNode): boolean {
  return DONE_STATUSES.has(node.status || '');
}

function TodoCategory({ node, items }: { node: TreeNode; items: TreeNode[] }) {
  const [expanded, setExpanded] = useState(true);
  const count = items.length;
  const icon = CATEGORY_ICONS[node.name] || <Circle size={16} />;

  if (count === 0) return null;

  return (
    <div className="todo-category">
      <button className="todo-category-header" onClick={() => setExpanded(!expanded)}>
        <ChevronRight size={14} className={`todo-chevron${expanded ? ' expanded' : ''}`} />
        <span className="todo-category-icon">{icon}</span>
        <span className="todo-category-name">{node.name}</span>
        <span className="todo-category-count">{count}</span>
      </button>
      {expanded && (
        <div className="todo-category-items">
          {items.map((child, i) => (
            <TodoItem key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoneSection({ items }: { items: { category: string; node: TreeNode }[] }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="todo-category todo-done-section">
      <button className="todo-category-header" onClick={() => setExpanded(!expanded)}>
        <ChevronRight size={14} className={`todo-chevron${expanded ? ' expanded' : ''}`} />
        <span className="todo-category-icon"><CheckCircle2 size={16} /></span>
        <span className="todo-category-name">Done</span>
        <span className="todo-category-count">{items.length}</span>
      </button>
      {expanded && (
        <div className="todo-category-items">
          {items.map((item, i) => (
            <div key={i} className="todo-done-item-wrap">
              <TodoItem node={item.node} />
              <span className="todo-done-category-label">{item.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TodoView({ treeData, timelineRange, onTimelineRangeChange }: TodoViewProps) {
  const allDates = useMemo(() => collectDates(treeData), [treeData]);

  const initialStart = timelineRange.startOrd != null && allDates.length > 0
    ? findDateIndex(allDates, timelineRange.startOrd) : 0;
  const initialEnd = timelineRange.endOrd != null && allDates.length > 0
    ? findDateIndex(allDates, timelineRange.endOrd) : allDates.length - 1;

  const [startIndex, setStartIndex] = useState(initialStart);
  const [endIndex, setEndIndex] = useState(initialEnd);

  useEffect(() => {
    if (timelineRange.startOrd != null && allDates.length > 0) {
      setStartIndex(findDateIndex(allDates, timelineRange.startOrd));
    } else {
      setStartIndex(0);
    }
    if (timelineRange.endOrd != null && allDates.length > 0) {
      setEndIndex(findDateIndex(allDates, timelineRange.endOrd));
    } else {
      setEndIndex(allDates.length - 1);
    }
  }, [allDates, timelineRange.startOrd, timelineRange.endOrd]);

  const filteredTree = useMemo(() => {
    const startOrd = allDates[startIndex] ?? 0;
    const endOrd = allDates[endIndex] ?? Infinity;
    return filterTreeByDate(treeData, startOrd, endOrd) ?? { ...treeData, children: [] };
  }, [treeData, allDates, startIndex, endIndex]);

  const categories = filteredTree.children ?? [];

  // Separate active vs done items per category
  const { activeCategories, doneItems } = useMemo(() => {
    const active: { node: TreeNode; items: TreeNode[] }[] = [];
    const done: { category: string; node: TreeNode }[] = [];

    for (const cat of categories) {
      const children = cat.children ?? [];
      const activeItems = children.filter(c => !isDone(c));
      const doneChildren = children.filter(c => isDone(c));

      active.push({ node: cat, items: activeItems });
      for (const child of doneChildren) {
        done.push({ category: cat.name, node: child });
      }
    }

    return { activeCategories: active, doneItems: done };
  }, [categories]);

  const activeCount = activeCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="todo-view">
      <div className="todo-header">
        <h2 className="todo-title">{treeData.name}</h2>
        <span className="todo-summary">{activeCount} active, {doneItems.length} done across {categories.length} categories</span>
      </div>
      <div className="todo-list">
        {activeCategories.map((cat, i) => (
          <TodoCategory key={i} node={cat.node} items={cat.items} />
        ))}
        <DoneSection items={doneItems} />
      </div>
      <TimelineBar
        allDates={allDates}
        startIndex={startIndex}
        endIndex={endIndex}
        setStartIndex={setStartIndex}
        setEndIndex={setEndIndex}
        onRangeChange={onTimelineRangeChange}
      />
    </div>
  );
}
