import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Markmap, deriveOptions } from 'markmap-view';
import type { DimensionMeta, TreeNode, CompetitorData } from '../types';

const statusColors: Record<string, string> = {
  origin: '#3a6da0', abandoned: '#c94040', chosen: '#3a7d44',
  partial: '#c07820', excluded: '#8a9e8c', final: '#2a8a7a',
};

const statusIcons: Record<string, string> = {
  abandoned: '\u274C', chosen: '\u2713', partial: '\u25D0',
  final: '\u2605', excluded: '\u2014', origin: '\u25CF',
};

interface INode {
  content: string;
  children: INode[];
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

  const children = (node.children || []).map(c => jsonToINode(c, depth + 1));
  return { content, children };
}

function buildOverviewRoot(
  dimensionsMeta: DimensionMeta[],
  dataMap: Record<string, TreeNode>,
  compData: CompetitorData | null,
): INode {
  const dimChildren = dimensionsMeta.map(dim => {
    const treeData = dataMap[dim.id];
    if (!treeData) return { content: `${dim.icon} ${dim.title}`, children: [] };
    const children = (treeData.children || []).map(c => jsonToINode(c, 2));
    return {
      content: `${dim.icon} <strong>${dim.title}</strong> <span style="font-size:0.8em;color:#8a9e8c">\u2014 ${dim.desc}</span>`,
      children,
    };
  });

  if (compData?.stages) {
    const compChildren = compData.stages.map(stage => ({
      content: `<strong>${stage.name}</strong> <span style="font-size:0.8em;color:#8a9e8c">${stage.date} \u00b7 ${stage.total}\u5BB6</span>`,
      children: [
        { content: `<span style="color:#3a6da0">Position:</span> ${stage.our_position}`, children: [] },
        { content: `<span style="color:#3a7d44">White space:</span> ${stage.white_space}`, children: [] },
      ],
    }));
    dimChildren.push({
      content: `\u2694\uFE0F <strong>Competitor Evolution</strong> <span style="font-size:0.8em;color:#8a9e8c">\u2014 10 to 80+</span>`,
      children: compChildren,
    });
  }

  return {
    content: '\u2764\uFE0F <strong>CareMojo \u00b7 Decision Atlas</strong>',
    children: dimChildren,
  };
}

function cloneINode(node: INode): INode {
  return { content: node.content, children: (node.children || []).map(cloneINode) };
}

const MARKMAP_COLORS = ['#3a7d44', '#2a8a7a', '#c07820', '#6b5aa0', '#3a6da0', '#c94040', '#8a6d3b', '#5a7d8a', '#7a5a8a'];

/* ── Overview markmap ──────────────────────────── */

interface MarkmapViewProps {
  dimensions: DimensionMeta[];
  dimensionsData: Record<string, TreeNode>;
  competitorData: CompetitorData | null;
  expandLevel: number;
  onFitRequest: boolean;
}

export function MarkmapView({ dimensions, dimensionsData, competitorData, expandLevel, onFitRequest }: MarkmapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const rootRef = useRef<INode | null>(null);

  useEffect(() => {
    if (dimensions.length > 0 && Object.keys(dimensionsData).length > 0) {
      rootRef.current = buildOverviewRoot(dimensions, dimensionsData, competitorData);
    }
  }, [dimensions, dimensionsData, competitorData]);

  const renderMarkmap = useCallback(() => {
    if (!svgRef.current || !rootRef.current) return;
    svgRef.current.innerHTML = '';
    const freshRoot = cloneINode(rootRef.current);
    const derived = deriveOptions({
      color: MARKMAP_COLORS,
      spacingHorizontal: 80,
      spacingVertical: 6,
      paddingX: 10,
      maxWidth: 280,
      duration: 500,
      initialExpandLevel: expandLevel === -1 ? -1 : expandLevel,
    });
    mmRef.current = Markmap.create(svgRef.current, derived, freshRoot);
  }, [expandLevel]);

  useEffect(() => { renderMarkmap(); }, [renderMarkmap]);

  useEffect(() => {
    if (onFitRequest && mmRef.current) mmRef.current.fit();
  }, [onFitRequest]);

  return (
    <div className="map-wrap">
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

/* ── Date parsing helpers ──────────────────────── */

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

/** Parse "Feb 23 放弃" / "Feb 25-26 确定" / "Mar 4-5" → ordinal number for sorting (month*100 + day) */
function parseDateOrdinal(dateStr: string): number | null {
  if (!dateStr) return null;
  const m = dateStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/);
  if (!m) return null;
  return MONTH_MAP[m[1]] * 100 + parseInt(m[2], 10);
}

/** Collect all unique date ordinals from a tree */
function collectDates(node: TreeNode): number[] {
  const dates: Set<number> = new Set();
  function walk(n: TreeNode) {
    const ord = parseDateOrdinal(n.date || '');
    if (ord !== null) dates.add(ord);
    (n.children || []).forEach(walk);
  }
  walk(node);
  return Array.from(dates).sort((a, b) => a - b);
}

/** Get a display label for a date ordinal */
function ordinalToLabel(ord: number): string {
  const month = Math.floor(ord / 100);
  const day = ord % 100;
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month]} ${day}`;
}

/** Filter tree to only include nodes with date <= cutoff ordinal.
 *  Root node is always included. Nodes without parseable dates are included
 *  if they have visible children (to preserve structure). */
function filterTreeByDate(node: TreeNode, cutoff: number): TreeNode | null {
  const ord = parseDateOrdinal(node.date || '');
  // If this node has a date after the cutoff, hide it and its subtree
  if (ord !== null && ord > cutoff) return null;

  const filteredChildren: TreeNode[] = [];
  for (const child of node.children || []) {
    const fc = filterTreeByDate(child, cutoff);
    if (fc) filteredChildren.push(fc);
  }

  // If node has no date (structural) and no visible children, skip it
  // Exception: keep the root (depth 0 behavior handled by caller)
  if (ord === null && filteredChildren.length === 0 && (node.children || []).length > 0) {
    return null;
  }

  return { ...node, children: filteredChildren };
}

/* ── Dimension markmap with timeline ───────────── */

interface MarkmapDimensionViewProps {
  treeData: TreeNode;
  expandLevel: number;
  onFitRequest: boolean;
}

export function MarkmapDimensionView({ treeData, expandLevel, onFitRequest }: MarkmapDimensionViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  // Extract sorted unique dates
  const allDates = useMemo(() => collectDates(treeData), [treeData]);
  const [dateIndex, setDateIndex] = useState(allDates.length - 1);

  // Reset to last date when tree data changes
  useEffect(() => {
    setDateIndex(allDates.length - 1);
  }, [allDates]);

  const currentCutoff = allDates[dateIndex] ?? Infinity;

  // Filter tree by current date
  const filteredTree = useMemo(() => {
    if (dateIndex >= allDates.length - 1) return treeData; // show all
    const filtered = filterTreeByDate(treeData, currentCutoff);
    return filtered || treeData;
  }, [treeData, currentCutoff, dateIndex, allDates.length]);

  const renderMarkmap = useCallback(() => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = '';
    const root = jsonToINode(filteredTree, 0);
    const fresh = cloneINode(root);
    const derived = deriveOptions({
      color: MARKMAP_COLORS,
      spacingHorizontal: 80,
      spacingVertical: 8,
      paddingX: 10,
      maxWidth: 300,
      duration: 500,
      initialExpandLevel: expandLevel === -1 ? -1 : expandLevel,
    });
    mmRef.current = Markmap.create(svgRef.current, derived, fresh);
  }, [filteredTree, expandLevel]);

  useEffect(() => { renderMarkmap(); }, [renderMarkmap]);

  useEffect(() => {
    if (onFitRequest && mmRef.current) mmRef.current.fit();
  }, [onFitRequest]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setDateIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setDateIndex(i => Math.min(allDates.length - 1, i + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allDates.length]);

  const goPrev = () => setDateIndex(i => Math.max(0, i - 1));
  const goNext = () => setDateIndex(i => Math.min(allDates.length - 1, i + 1));

  return (
    <div className="dim-view">
      <div className="map-wrap">
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      </div>
      {allDates.length > 1 && (
        <div className="timeline-bar">
          <button
            className="tl-arrow"
            onClick={goPrev}
            disabled={dateIndex <= 0}
            aria-label="Previous date"
          >
            {'\u2039'}
          </button>

          <div className="tl-track">
            <div
              className="tl-progress"
              style={{ width: `${(dateIndex / (allDates.length - 1)) * 100}%` }}
            />
            {allDates.map((ord, i) => {
              const pct = allDates.length === 1 ? 50 : (i / (allDates.length - 1)) * 100;
              const isActive = i <= dateIndex;
              const isCurrent = i === dateIndex;
              return (
                <button
                  key={ord}
                  className={`tl-dot${isActive ? ' active' : ''}${isCurrent ? ' current' : ''}`}
                  style={{ left: `${pct}%` }}
                  onClick={() => setDateIndex(i)}
                  title={ordinalToLabel(ord)}
                >
                  {isCurrent && (
                    <span className="tl-label">{ordinalToLabel(ord)}</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="tl-arrow"
            onClick={goNext}
            disabled={dateIndex >= allDates.length - 1}
            aria-label="Next date"
          >
            {'\u203A'}
          </button>

          <span className="tl-counter">
            {ordinalToLabel(allDates[dateIndex])}
          </span>
        </div>
      )}
    </div>
  );
}
