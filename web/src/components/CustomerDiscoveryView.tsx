import { useMemo, useState } from 'react';
import type { TreeNode } from '../types';

interface CustomerDiscoveryViewProps {
  treeData: TreeNode;
}

type NodeAny = TreeNode & Record<string, unknown>;

interface ContactRow {
  name: string;
  category: string;
  type: string;
  status: string;
  date: string;
  description: string;
  source: string;
  contact: string;
  social: string;
  next: string;
}

function extractContacts(root: TreeNode): { categories: string[]; rows: ContactRow[] } {
  const categories: string[] = [];
  const rows: ContactRow[] = [];

  for (const cat of root.children || []) {
    const catName = cat.name;
    categories.push(catName);
    for (const child of cat.children || []) {
      const n = child as NodeAny;
      rows.push({
        name: child.name,
        category: catName,
        type: (n.type as string) || '',
        status: child.status || '',
        date: child.date || '',
        description: child.desc || '',
        source: (n.source as string) || '',
        contact: (n.contact as string) || '',
        social: (n.social as string) || '',
        next: (n.next as string) || '',
      });
    }
  }
  return { categories, rows };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  chosen: { bg: 'var(--green-light, #e6f9e6)', color: 'var(--green, #2e7d32)' },
  partial: { bg: 'var(--orange-light, #fff3e0)', color: 'var(--orange, #e65100)' },
  origin: { bg: 'var(--blue-light, #e3f2fd)', color: 'var(--blue, #1565c0)' },
};

function StatusBadge({ value }: { value: string }) {
  if (!value) return <span>{'\u2014'}</span>;
  const style = STATUS_COLORS[value] || { bg: 'var(--surface-2, #f5f5f5)', color: 'var(--text-secondary, #666)' };
  return (
    <span
      className="okr-proven-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {value}
    </span>
  );
}

export function CustomerDiscoveryView({ treeData }: CustomerDiscoveryViewProps) {
  const { categories, rows } = useMemo(() => extractContacts(treeData), [treeData]);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const statuses = useMemo(() => [...new Set(rows.map(r => r.status).filter(Boolean))], [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (filterCat !== 'all') result = result.filter(r => r.category === filterCat);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.next.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, filterCat, filterStatus, search]);

  return (
    <div className="okr-table-view">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '24px 24px 0' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Customer Discovery</h2>
        <span style={{ fontSize: 13, opacity: 0.5 }}>{filtered.length} contacts</span>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 24px 0', flexWrap: 'wrap' }}>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border, #ddd)', fontSize: 13, background: 'var(--surface-1, #fff)' }}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border, #ddd)', fontSize: 13, background: 'var(--surface-1, #fff)' }}
        >
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border, #ddd)', fontSize: 13, flex: 1, minWidth: 160, background: 'var(--surface-1, #fff)' }}
        />
      </div>

      <div className="okr-scroll">
        <div className="landscape-table-wrap okr-kpi-scroll">
          <table className="landscape-table okr-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Source</th>
                <th>Description</th>
                <th>Next Steps</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row, i) => (
                  <tr key={i}>
                    <td className="col-name">
                      {row.social ? (
                        <a href={row.social} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue, #1565c0)', textDecoration: 'none' }}>
                          {row.name}
                        </a>
                      ) : row.name}
                    </td>
                    <td style={{ fontSize: 12, opacity: 0.7 }}>{row.category}</td>
                    <td>{row.type || '\u2014'}</td>
                    <td><StatusBadge value={row.status} /></td>
                    <td className="okr-date-col">{row.date || '\u2014'}</td>
                    <td>{row.source || '\u2014'}</td>
                    <td style={{ maxWidth: 320, fontSize: 12 }}>{row.description || '\u2014'}</td>
                    <td style={{ maxWidth: 200, fontSize: 12 }}>{row.next || '\u2014'}</td>
                    <td style={{ fontSize: 12 }}>{row.contact || '\u2014'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="okr-empty">No contacts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
