import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Markmap, deriveOptions } from 'markmap-view';
import type { TreeNode } from '../types';
import { findDateIndex } from '../hooks/useTimelineCutoff';
import type { TimelineRange } from '../hooks/useTimelineCutoff';

export const statusColors: Record<string, string> = {
  origin: '#3a6da0', abandoned: '#c94040', chosen: '#3a7d44',
  partial: '#c07820', excluded: '#8a9e8c', final: '#2a8a7a',
};

export const statusIcons: Record<string, string> = {
  abandoned: '\u274C', chosen: '\u2713', partial: '\u25D0',
  final: '\u2605', excluded: '\u2014', origin: '\u25CF',
};

interface INode {
  content: string;
  children: INode[];
  payload?: Record<string, unknown>;
}

export function jsonToINode(node: TreeNode, depth = 0): INode {
  const color = statusColors[node.status || ''] || '#8a9e8c';
  const icon = statusIcons[node.status || ''] || '';
  const isAbandoned = node.status === 'abandoned' || node.status === 'excluded';
  const isFinal = node.status === 'final';

  let label = node.name;
  if (isAbandoned) label = `<del style="opacity:0.6">${label}</del>`;
  if (isFinal) label = `<strong>${label}</strong>`;

  let content = `<span style="color:${color}">${icon}</span> ${label}`;
  if (depth > 0 && node.date) {
    content += ` <span style="font-size:0.8em;color:#8a9e8c">${node.date}</span>`;
  }
  if (node.desc) {
    content += ` <span style="font-size:0.8em;color:#918a80">${node.desc}</span>`;
  }

  const dateOrd = parseDateOrdinal(node.date || '');
  const children = (node.children || []).map(c => jsonToINode(c, depth + 1));
  return { content, children, payload: dateOrd !== null ? { dateOrd } : undefined };
}

function cloneINode(node: INode): INode {
  return {
    content: node.content,
    children: (node.children || []).map(cloneINode),
    payload: node.payload ? { ...node.payload } : undefined,
  };
}

const MARKMAP_COLORS = ['#3a7d44', '#2a8a7a', '#c07820', '#6b5aa0', '#3a6da0', '#c94040', '#8a6d3b', '#5a7d8a', '#7a5a8a'];

/* ── Date parsing helpers ──────────────────────── */

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export function parseDateOrdinal(dateStr: string): number | null {
  if (!dateStr) return null;
  // "MMM DD" format (e.g. "Feb 23")
  const m = dateStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/);
  if (m) return MONTH_MAP[m[1]] * 100 + parseInt(m[2], 10);
  // ISO "YYYY-MM-DD" format (e.g. "2026-02-23")
  const iso = dateStr.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (iso) return parseInt(iso[1], 10) * 100 + parseInt(iso[2], 10);
  return null;
}

export function collectDates(node: TreeNode): number[] {
  const now = new Date();
  const todayOrd = (now.getMonth() + 1) * 100 + now.getDate();
  const dates: Set<number> = new Set();
  function walk(n: TreeNode) {
    const ord = parseDateOrdinal(n.date || '');
    if (ord !== null && ord <= todayOrd) dates.add(ord);
    (n.children || []).forEach(walk);
  }
  walk(node);
  return Array.from(dates).sort((a, b) => a - b);
}

export function ordinalToLabel(ord: number): string {
  const month = Math.floor(ord / 100);
  const day = ord % 100;
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month]} ${day}`;
}

/**
 * Walk the markmap internal data tree, stash full children list per node,
 * then splice children to only those with dateOrd <= cutoff.
 * Preserves same node objects so D3 keys stay stable → parent-anchored animations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDateFilter(node: any, startOrd: number, endOrd: number): void {
  if (!node) return;

  // Stash full children on first visit
  if (!node._allChildren && node.children) {
    node._allChildren = [...node.children];
  }

  const all = node._allChildren || [];

  // Keep children whose dateOrd is within [startOrd, endOrd] (or no dateOrd = structural)
  node.children = all.filter((child: { payload?: Record<string, unknown> }) => {
    const dateOrd = child.payload?.dateOrd as number | undefined;
    if (dateOrd === undefined) return true;
    return dateOrd >= startOrd && dateOrd <= endOrd;
  });

  // Recurse
  for (const child of node.children) {
    applyDateFilter(child, startOrd, endOrd);
  }
}

/* ── Shared Timeline Bar ───────────────────────── */

interface TimelineBarProps {
  allDates: number[];
  startIndex: number;
  endIndex: number;
  setStartIndex: (i: number) => void;
  setEndIndex: (i: number) => void;
  onRangeChange?: (range: Partial<TimelineRange>) => void;
}

export function TimelineBar({ allDates, startIndex, endIndex, setStartIndex, setEndIndex, onRangeChange }: TimelineBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'start' | 'end' | null>(null);

  const setStart = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(i, endIndex));
    setStartIndex(clamped);
    if (onRangeChange && allDates[clamped] !== undefined) {
      onRangeChange({ startOrd: allDates[clamped] });
    }
  }, [endIndex, setStartIndex, onRangeChange, allDates]);

  const setEnd = useCallback((i: number) => {
    const clamped = Math.min(allDates.length - 1, Math.max(i, startIndex));
    setEndIndex(clamped);
    if (onRangeChange && allDates[clamped] !== undefined) {
      onRangeChange({ endOrd: allDates[clamped] });
    }
  }, [startIndex, allDates.length, setEndIndex, onRangeChange, allDates]);

  // Convert a pointer clientX to the nearest date index
  const xToIndex = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track || allDates.length <= 1) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (allDates.length - 1));
  }, [allDates.length]);

  // Drag handlers
  const onPointerDown = useCallback((handle: 'start' | 'end', e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = handle;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const idx = xToIndex(e.clientX);
    if (draggingRef.current === 'start') {
      setStart(idx);
    } else {
      setEnd(idx);
    }
  }, [xToIndex, setStart, setEnd]);

  const onPointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // Click on track to move nearest handle
  const onTrackClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('tl-knob')) return;
    const idx = xToIndex(e.clientX);
    if (Math.abs(idx - startIndex) <= Math.abs(idx - endIndex)) {
      setStart(idx);
    } else {
      setEnd(idx);
    }
  }, [xToIndex, startIndex, endIndex, setStart, setEnd]);

  // Keyboard: Shift+Arrow for start, Arrow for end
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) setStart(startIndex - 1);
        else setEnd(endIndex - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) setStart(startIndex + 1);
        else setEnd(endIndex + 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startIndex, endIndex, setStart, setEnd]);

  if (allDates.length === 0) return null;

  const pct = (i: number) => allDates.length === 1 ? 50 : (i / (allDates.length - 1)) * 100;
  const startPct = pct(startIndex);
  const endPct = pct(endIndex);

  return (
    <div className="timeline-bar">
      <div
        className="tl-track"
        ref={trackRef}
        onClick={onTrackClick}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Inactive track line */}
        <div className="tl-rail" />

        {/* Active range highlight */}
        <div
          className="tl-progress"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Date dots */}
        {allDates.map((ord, i) => {
          const isInRange = i >= startIndex && i <= endIndex;
          return (
            <div
              key={ord}
              className={`tl-dot${isInRange ? ' active' : ''}`}
              style={{ left: `${pct(i)}%` }}
              title={ordinalToLabel(ord)}
            />
          );
        })}

        {/* Start knob */}
        <div
          className="tl-knob tl-knob-start"
          style={{ left: `${startPct}%` }}
          onPointerDown={(e) => onPointerDown('start', e)}
          title={`Start: ${ordinalToLabel(allDates[startIndex])}`}
        >
          <span className="tl-knob-label">{ordinalToLabel(allDates[startIndex])}</span>
        </div>

        {/* End knob */}
        <div
          className="tl-knob tl-knob-end"
          style={{ left: `${endPct}%` }}
          onPointerDown={(e) => onPointerDown('end', e)}
          title={`End: ${ordinalToLabel(allDates[endIndex])}`}
        >
          <span className="tl-knob-label">{ordinalToLabel(allDates[endIndex])}</span>
        </div>
      </div>

      <span className="tl-counter">
        {ordinalToLabel(allDates[startIndex])} – {ordinalToLabel(allDates[endIndex])}
      </span>
    </div>
  );
}

/* ── Shared markmap + timeline hook ────────────── */

function useMarkmapTimeline(
  svgRef: React.RefObject<SVGSVGElement | null>,
  fullRoot: INode | null,
  allDates: number[],
  expandLevel: number,
  onFitRequest: boolean,
  options: { spacingH: number; spacingV: number; maxW: number },
  externalRange?: TimelineRange | null,
) {
  const mmRef = useRef<Markmap | null>(null);
  const rangeRef = useRef<{ start: number; end: number }>({ start: 0, end: Infinity });
  const mountedRef = useRef(false);

  const initialStart = externalRange?.startOrd != null && allDates.length > 0
    ? findDateIndex(allDates, externalRange.startOrd)
    : 0;
  const initialEnd = externalRange?.endOrd != null && allDates.length > 0
    ? findDateIndex(allDates, externalRange.endOrd)
    : allDates.length - 1;
  const [startIndex, setStartIndex] = useState(initialStart);
  const [endIndex, setEndIndex] = useState(initialEnd);

  // Sync indices when external range or dates change
  useEffect(() => {
    if (externalRange?.startOrd != null && allDates.length > 0) {
      setStartIndex(findDateIndex(allDates, externalRange.startOrd));
    } else {
      setStartIndex(0);
    }
    if (externalRange?.endOrd != null && allDates.length > 0) {
      setEndIndex(findDateIndex(allDates, externalRange.endOrd));
    } else {
      setEndIndex(allDates.length - 1);
    }
  }, [allDates, externalRange?.startOrd, externalRange?.endOrd]);

  const currentStart = allDates[startIndex] ?? 0;
  const currentEnd = allDates[endIndex] ?? Infinity;
  rangeRef.current = { start: currentStart, end: currentEnd };

  // Create markmap (or recreate on expandLevel/fullRoot change)
  useEffect(() => {
    if (!svgRef.current || !fullRoot) return;
    svgRef.current.innerHTML = '';
    mountedRef.current = false;

    const fresh = cloneINode(fullRoot);
    const derived = deriveOptions({
      color: MARKMAP_COLORS,
      spacingHorizontal: options.spacingH,
      spacingVertical: options.spacingV,
      paddingX: 10,
      maxWidth: options.maxW,
      duration: 500,
      initialExpandLevel: expandLevel === -1 ? -1 : expandLevel,
    });
    const mm = Markmap.create(svgRef.current, derived, fresh);
    mmRef.current = mm;

    requestAnimationFrame(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (mm as any).state?.data;
      const r = rangeRef.current;
      if (data && (r.start > 0 || r.end !== Infinity)) {
        applyDateFilter(data, r.start, r.end);
        mm.renderData().then(() => mm.fit());
      }
      mountedRef.current = true;
    });

    return () => {
      mmRef.current = null;
      mountedRef.current = false;
    };
  }, [fullRoot, expandLevel, svgRef, options.spacingH, options.spacingV, options.maxW]);

  // On range change (after mount): mutate internal data, animate
  useEffect(() => {
    if (!mountedRef.current) return;
    const mm = mmRef.current;
    if (!mm) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (mm as any).state?.data;
    if (!data) return;

    applyDateFilter(data, currentStart, currentEnd);
    mm.renderData().then(() => mm.fit());
  }, [currentStart, currentEnd]);

  // Fit on request
  useEffect(() => {
    if (onFitRequest && mmRef.current) mmRef.current.fit();
  }, [onFitRequest]);

  return { startIndex, endIndex, setStartIndex, setEndIndex };
}

/* ── Dimension markmap with timeline ───────────── */

interface MarkmapDimensionViewProps {
  treeData: TreeNode;
  expandLevel: number;
  onFitRequest: boolean;
  timelineRange?: TimelineRange | null;
  onTimelineRangeChange?: (range: Partial<TimelineRange>) => void;
}

const DIM_OPTS = { spacingH: 80, spacingV: 8, maxW: 300 };

export function MarkmapDimensionView({ treeData, expandLevel, onFitRequest, timelineRange, onTimelineRangeChange }: MarkmapDimensionViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const allDates = useMemo(() => collectDates(treeData), [treeData]);
  const fullRoot = useMemo(() => jsonToINode(treeData, 0), [treeData]);

  const { startIndex, endIndex, setStartIndex, setEndIndex } = useMarkmapTimeline(
    svgRef, fullRoot, allDates, expandLevel, onFitRequest, DIM_OPTS, timelineRange,
  );

  return (
    <div className="dim-view">
      <div className="map-wrap">
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
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
