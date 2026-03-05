import type { ViewType, DimensionMeta } from '../types';

interface TopBarProps {
  currentView: ViewType;
  currentDimIndex: number;
  dimensions: DimensionMeta[];
  expandLevel: number;
  onExpandLevel: (level: number) => void;
}

export function TopBar({ currentView, currentDimIndex, dimensions, expandLevel, onExpandLevel }: TopBarProps) {
  let title = 'CareMojo Decision Atlas';
  let desc = '8 dimensions + competitive evolution';

  if (currentView === 'overview') {
    title = 'CareMojo Full Decision Map';
    desc = '8 dimensions + competitive evolution \u00b7 zoom & drag to explore';
  } else if (currentView === 'd3' && dimensions[currentDimIndex]) {
    const dim = dimensions[currentDimIndex];
    title = dim.title;
    desc = dim.desc;
  } else if (currentView === 'competitor') {
    title = 'Competitor Evolution';
    desc = 'Competitive landscape evolving with scope changes';
  } else if (currentView === 'executive-report') {
    title = 'Executive Report';
    desc = 'Vision & Roadmap Evolution \u00b7 Feb 23 \u2013 Mar 5, 2026';
  }

  const showButtons = currentView === 'overview' || currentView === 'd3';

  const levelButtons = [
    { label: 'L2', value: 2 },
    { label: 'L3', value: 3 },
    { label: 'L4', value: 4 },
    { label: 'All', value: -1 },
  ];

  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="desc">{desc}</div>
      </div>
      {showButtons && (
        <div className="actions">
          {levelButtons.map(b => (
            <button
              key={b.label}
              className={`btn${expandLevel === b.value ? ' active' : ''}`}
              onClick={() => onExpandLevel(b.value)}
            >
              {b.label}
            </button>
          ))}
          <button className="btn" onClick={() => onExpandLevel(0)}>
            Fit
          </button>
        </div>
      )}
    </div>
  );
}
