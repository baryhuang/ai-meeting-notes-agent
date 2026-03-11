import { useState, useMemo, useEffect } from 'react';
import type { TreeNode } from '../types';
import { TimelineBar, collectDates, parseDateOrdinal } from './MarkmapView';
import './vem-document.css';

function TextWithBreaks({ text }: { text: string }) {
  const parts = text.split('\n');
  return <>{parts.map((line, i) => i === 0 ? line : <span key={i}><br />{line}</span>)}</>;
}

function Tag({ status }: { status?: string }) {
  if (!status) return null;
  return <span className={`vem-tag ${status}`}>{status}</span>;
}

function filterByDate(node: TreeNode, cutoff: number): TreeNode | null {
  const ord = parseDateOrdinal(node.date || '');
  if (ord !== null && ord > cutoff) return null;
  const children = (node.children || [])
    .map(c => filterByDate(c, cutoff))
    .filter((c): c is TreeNode => c !== null);
  return { ...node, children: children.length > 0 ? children : undefined };
}

function NodeBlock({ node, level }: { node: TreeNode; level: number }) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <>
      <Heading>
        {node.name}
        <Tag status={node.status} />
        {node.verified && <span className="vem-check">&#x2713;</span>}
        {node.date && <span className="vem-date-inline">{node.date}</span>}
      </Heading>
      {node.desc && <p className="vem-body"><TextWithBreaks text={node.desc} /></p>}
      {node.quotes?.map((q, i) => <blockquote key={i}><TextWithBreaks text={q} /></blockquote>)}
      {node.children?.map((child, i) => (
        <NodeBlock key={i} node={child} level={Math.min(level + 1, 3)} />
      ))}
    </>
  );
}

export function VEMDocumentView({ treeData }: { treeData: TreeNode }) {
  const allDates = useMemo(() => collectDates(treeData), [treeData]);
  const [dateIndex, setDateIndex] = useState(allDates.length - 1);

  useEffect(() => {
    setDateIndex(allDates.length - 1);
  }, [allDates]);

  const cutoff = allDates[dateIndex] ?? Infinity;
  const filtered = useMemo(() => {
    if (cutoff === Infinity) return treeData;
    return filterByDate(treeData, cutoff) || treeData;
  }, [treeData, cutoff]);

  const sections = filtered.children || [];

  return (
    <div className="vem-doc">
      <div className="vem-doc-inner">
        <h1>{filtered.name}</h1>
        {filtered.date && <div className="vem-doc-date">{filtered.date}</div>}
        {filtered.desc && <p className="vem-doc-desc"><TextWithBreaks text={filtered.desc} /></p>}

        {sections.map((section, i) => (
          <section key={i} className="vem-section">
            <NodeBlock node={section} level={2} />
          </section>
        ))}
      </div>
      <TimelineBar allDates={allDates} dateIndex={dateIndex} setDateIndex={setDateIndex} />
    </div>
  );
}
