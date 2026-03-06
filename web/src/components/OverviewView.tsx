import { useState, useMemo } from 'react';
import type { DimensionMeta, TreeNode, ViewType } from '../types';
import {
  parseDateOrdinal,
  collectDates,
  ordinalToLabel,
  TimelineBar,
  statusColors,
  statusIcons,
} from './MarkmapView';

interface OverviewViewProps {
  dimensions: DimensionMeta[];
  dimensionsData: Record<string, TreeNode>;
  onSwitch: (view: ViewType, dimIndex?: number) => void;
}

interface DayNode {
  name: string;
  status?: string;
  desc?: string;
}

function getNodesForDate(tree: TreeNode, dateOrd: number): DayNode[] {
  const results: DayNode[] = [];
  function walk(node: TreeNode) {
    const ord = parseDateOrdinal(node.date || '');
    if (ord === dateOrd) {
      results.push({ name: node.name, status: node.status, desc: node.desc });
    }
    (node.children || []).forEach(walk);
  }
  walk(tree);
  return results;
}

export function OverviewView({ dimensions, dimensionsData, onSwitch }: OverviewViewProps) {
  const allDates = useMemo(() => {
    const dateSet = new Set<number>();
    for (const dim of dimensions) {
      const tree = dimensionsData[dim.id];
      if (!tree) continue;
      for (const d of collectDates(tree)) dateSet.add(d);
    }
    return Array.from(dateSet).sort((a, b) => a - b);
  }, [dimensions, dimensionsData]);

  const [dateIndex, setDateIndex] = useState(allDates.length - 1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const currentDateOrd = allDates[dateIndex] ?? null;

  const toggleExpand = (dimId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(dimId)) next.delete(dimId);
      else next.add(dimId);
      return next;
    });
  };

  return (
    <div className="overview-view">
      <div className="overview-grid">
        {dimensions.map((dim, i) => {
          const tree = dimensionsData[dim.id];
          const nodes = tree && currentDateOrd !== null
            ? getNodesForDate(tree, currentDateOrd)
            : [];
          const expanded = expandedCards.has(dim.id);

          return (
            <div
              key={dim.id}
              className={`overview-card${expanded ? ' expanded' : ''}`}
              onClick={() => onSwitch('d3', i)}
            >
              <div className="overview-card-header">
                <span className="overview-card-icon">{dim.icon}</span>
                <span className="overview-card-title">{dim.title.replace(/决策树$/, '')}</span>
                {nodes.length > 0 && (
                  <button
                    className="overview-expand-btn"
                    onClick={(e) => toggleExpand(dim.id, e)}
                    title={expanded ? 'Collapse' : 'Expand'}
                  >
                    {expanded ? '\u2212' : '\u002B'}
                  </button>
                )}
              </div>
              <div className="overview-card-body">
                {nodes.length > 0 ? (
                  nodes.map((node, j) => {
                    const color = statusColors[node.status || ''] || '#8a9e8c';
                    const icon = statusIcons[node.status || ''] || '\u25CF';
                    return (
                      <div key={j} className="overview-node">
                        <span className="overview-node-icon" style={{ color }}>{icon}</span>
                        <span className="overview-node-name">{node.name}</span>
                        {node.status && (
                          <span
                            className="overview-node-status"
                            style={{ background: color + '18', color }}
                          >
                            {node.status}
                          </span>
                        )}
                        {node.desc && (
                          <div className="overview-node-desc">{node.desc}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="overview-no-changes">No changes</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDates.length > 0 && (
        <div className="overview-date-label">
          {currentDateOrd !== null ? ordinalToLabel(currentDateOrd) : ''}
        </div>
      )}

      <TimelineBar allDates={allDates} dateIndex={dateIndex} setDateIndex={setDateIndex} />
    </div>
  );
}
