import type { LandscapeData, LandscapeCategory, LandscapeCompany } from '../types';

interface CompetitorViewProps {
  data: LandscapeData;
}

function Chip({ company }: { company: LandscapeCompany }) {
  return (
    <span className="map-chip">
      <span className={`dot ${company.threat}`} />
      {company.name}
    </span>
  );
}

function CategoryCard({ category }: { category: LandscapeCategory }) {
  return (
    <div className="category-card">
      <div className="category-title">{category.name}</div>
      {category.companies && (
        <div className="chip-wrap">
          {category.companies.map(c => <Chip key={c.name} company={c} />)}
        </div>
      )}
      {category.subcategories?.map(sub => (
        <div key={sub.name} className="subcategory-block">
          <div className="subcategory-title">{sub.name}</div>
          <div className="chip-wrap">
            {sub.companies.map(c => <Chip key={c.name} company={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompetitorView({ data }: CompetitorViewProps) {
  return (
    <div className="d3-wrap" style={{ display: 'block' }}>
      <div className="landscape-wrap">
        <div className="landscape-header">
          <h2>{data.title}</h2>
          <p>{data.subtitle}</p>
        </div>

        <div className="landscape-legend">
          <span className="legend-item"><span className="dot high" />High threat</span>
          <span className="legend-item"><span className="dot medium" />Medium</span>
          <span className="legend-item"><span className="dot low" />Low</span>
        </div>

        <div className="market-map">
          {data.categories.map(cat => (
            <CategoryCard key={cat.name} category={cat} />
          ))}
        </div>

        <div className="insight-row">
          <div className="insight-card position">
            <div className="card-label">Our Position</div>
            <div className="card-text">{data.our_position}</div>
          </div>
          <div className="insight-card whitespace">
            <div className="card-label">White Space</div>
            <div className="card-text">{data.white_space}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
