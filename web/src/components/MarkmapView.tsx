import { useRef, useEffect, useCallback } from 'react';
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

  // Build root on data change
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

  // Re-render on expand level change
  useEffect(() => {
    renderMarkmap();
  }, [renderMarkmap]);

  // Fit on request
  useEffect(() => {
    if (onFitRequest && mmRef.current) {
      mmRef.current.fit();
    }
  }, [onFitRequest]);

  return (
    <div className="map-wrap">
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

/* ── Dimension-specific markmap view ───────────── */

interface MarkmapDimensionViewProps {
  treeData: TreeNode;
  expandLevel: number;
  onFitRequest: boolean;
}

export function MarkmapDimensionView({ treeData, expandLevel, onFitRequest }: MarkmapDimensionViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  const renderMarkmap = useCallback(() => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = '';
    const root = jsonToINode(treeData, 0);
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
  }, [treeData, expandLevel]);

  useEffect(() => {
    renderMarkmap();
  }, [renderMarkmap]);

  useEffect(() => {
    if (onFitRequest && mmRef.current) {
      mmRef.current.fit();
    }
  }, [onFitRequest]);

  return (
    <div className="map-wrap">
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
