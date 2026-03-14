import { useState, useMemo, useEffect } from 'react';
import type { TreeNode } from '../types';
import { TimelineBar, collectDates, parseDateOrdinal } from './MarkmapView';
import './vem-document.css';

function Tag({ status }: { status?: string }) {
  if (!status) return null;
  return <span className={`vem-tag ${status}`}>{status}</span>;
}

function InlineMeta({ node }: { node: TreeNode }) {
  return (
    <>
      <Tag status={node.status} />
      {node.verified && <span className="vem-check">&#x2713;</span>}
      {node.date && <span className="vem-date-inline">{node.date}</span>}
    </>
  );
}

/** Parse a desc string into paragraphs and bullet lists */
function DescContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`}>
        {bulletBuffer.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    );
    bulletBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[•●\-]\s*/.test(trimmed)) {
      bulletBuffer.push(trimmed.replace(/^[•●\-]\s*/, ''));
    } else {
      flushBullets();
      if (trimmed) {
        elements.push(<div key={`p-${elements.length}`}>{trimmed}</div>);
      }
    }
  }
  flushBullets();

  return <>{elements}</>;
}

/** Render depth-3+ children inline inside the value cell */
function DeepChildren({ children }: { children: TreeNode[] }) {
  return (
    <>
      {children.map((child, i) => (
        <div key={i}>
          <div className="vem-sub-label">
            {child.name}
            <InlineMeta node={child} />
          </div>
          {child.desc && <DescContent text={child.desc} />}
          {child.children && child.children.length > 0 && (
            <DeepChildren children={child.children} />
          )}
        </div>
      ))}
    </>
  );
}

/** Render a depth-2 node as one or more table rows */
function ContentRows({ node }: { node: TreeNode }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <tr className="vem-content-row">
      <td className="vem-label-cell">
        {node.name}
        <InlineMeta node={node} />
      </td>
      <td className="vem-value-cell">
        {node.desc && <DescContent text={node.desc} />}
        {hasChildren && <DeepChildren children={node.children!} />}
      </td>
    </tr>
  );
}

function filterByDate(node: TreeNode, cutoff: number): TreeNode | null {
  const ord = parseDateOrdinal(node.date || '');
  if (ord !== null && ord > cutoff) return null;
  const children = (node.children || [])
    .map(c => filterByDate(c, cutoff))
    .filter((c): c is TreeNode => c !== null);
  return { ...node, children: children.length > 0 ? children : undefined };
}

export function VEMDocumentView({ treeData }: { treeData: TreeNode }) {
  const allDates = useMemo(() => collectDates(treeData), [treeData]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(allDates.length - 1);

  useEffect(() => {
    setStartIndex(0);
    setEndIndex(allDates.length - 1);
  }, [allDates]);

  const startOrd = allDates[startIndex] ?? 0;
  const endOrd = allDates[endIndex] ?? Infinity;
  const filtered = useMemo(() => {
    if (endOrd === Infinity && startOrd === 0) return treeData;
    return filterByDate(treeData, endOrd) || treeData;
  }, [treeData, startOrd, endOrd]);

  const sections = filtered.children || [];

  return (
    <div className="vem-doc">
      <div className="vem-doc-inner">
        <table className="vem-table">
          <tbody>
            {/* Title banner */}
            <tr className="vem-title-row">
              <td colSpan={2}>{filtered.name}</td>
            </tr>

            {sections.map((section, si) => {
              const depth2 = section.children || [];
              return [
                /* Section banner */
                <tr key={`s-${si}`} className="vem-section-row">
                  <td colSpan={2}>{section.name}</td>
                </tr>,
                /* If section has no children, render its own desc as a full-width row */
                ...(depth2.length === 0 && section.desc
                  ? [
                      <tr key={`sd-${si}`} className="vem-content-row">
                        <td colSpan={2} className="vem-value-cell" style={{ width: '100%' }}>
                          <DescContent text={section.desc} />
                        </td>
                      </tr>,
                    ]
                  : []),
                /* Content rows for each depth-2 child */
                ...depth2.map((child, ci) => (
                  <ContentRows key={`r-${si}-${ci}`} node={child} />
                )),
              ];
            })}
          </tbody>
        </table>
      </div>
      <TimelineBar allDates={allDates} startIndex={startIndex} endIndex={endIndex} setStartIndex={setStartIndex} setEndIndex={setEndIndex} />
    </div>
  );
}
