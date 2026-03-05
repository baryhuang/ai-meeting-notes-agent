import { useState } from 'react';
import type { CompetitorData } from '../types';

const TRANSITIONS: Record<number, string> = {
  0: 'Anna: CNA is just the entry point \u2192 Full Nursing Pathway',
  1: 'Mar 3: Three-phase Roadmap \u2192 Training + Data + AI + Workforce',
  2: 'Mar 4: Human/AI/Robotics three layers \u2192 Competition goes 3D',
};

interface CompetitorViewProps {
  data: CompetitorData;
}

export function CompetitorView({ data }: CompetitorViewProps) {
  const [activeStage, setActiveStage] = useState(0);
  const stage = data.stages[activeStage];

  // Build categories from competitors
  const categories: Record<string, typeof stage.competitors> = {};
  for (const c of stage.competitors) {
    if (!categories[c.category]) categories[c.category] = [];
    categories[c.category].push(c);
  }

  return (
    <div className="d3-wrap" style={{ display: 'block' }}>
      <div className="comp-wrap">
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--red)', display: 'inline-block' }} />High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--orange)', display: 'inline-block' }} />Medium
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--blue)', display: 'inline-block' }} />Low
          </span>
        </div>

        {/* Stage nav */}
        <div className="stage-nav">
          {data.stages.map((s, i) => (
            <button
              key={s.id}
              className={`stage-btn${i === activeStage ? ' active' : ''}`}
              onClick={() => setActiveStage(i)}
            >
              <div className="btn-title">{s.name}</div>
              <div className="btn-date">{s.date}</div>
            </button>
          ))}
        </div>

        {/* Scope bar */}
        <div className="scope-bar">
          <div className="scope-label">Scope</div>
          <div className="scope-text">{stage.scope}</div>
        </div>

        {/* Insight cards */}
        <div className="insight-row">
          <div className="insight-card position">
            <div className="card-label">Our Position</div>
            <div className="card-text">{stage.our_position}</div>
          </div>
          <div className="insight-card whitespace">
            <div className="card-label">White Space</div>
            <div className="card-text">{stage.white_space}</div>
          </div>
        </div>

        {/* Competitor count */}
        <div className="comp-section-title">
          Competitors \u00b7 <span className="comp-count">{stage.total}</span>
        </div>

        {/* Category chips */}
        {Object.entries(categories).map(([cat, comps]) => (
          <div key={cat}>
            <div className={`comp-cat${cat.includes('\u65B0\u589E') ? ' new' : ''}`}>{cat}</div>
            <div className="comp-grid">
              {comps.map(c => (
                <div key={c.name} className={`comp-chip ${c.threat}`}>{c.name}</div>
              ))}
            </div>
          </div>
        ))}

        {/* Transition arrow */}
        {activeStage < data.stages.length - 1 && TRANSITIONS[activeStage] && (
          <div className="transition-box">
            <strong>Inflection Point {'\u2192'}</strong> {TRANSITIONS[activeStage]}
          </div>
        )}
      </div>
    </div>
  );
}
