import type { TreeNode } from '../types';
import './vem-document.css';

function Tag({ status }: { status?: string }) {
  if (!status) return null;
  return <span className={`vem-tag ${status}`}>{status}</span>;
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
      {node.desc && <p className="vem-body">{node.desc}</p>}
      {node.quotes?.map((q, i) => <blockquote key={i}>{q}</blockquote>)}
      {node.children?.map((child, i) => (
        <NodeBlock key={i} node={child} level={Math.min(level + 1, 3)} />
      ))}
    </>
  );
}

export function VEMDocumentView({ treeData }: { treeData: TreeNode }) {
  const sections = treeData.children || [];

  return (
    <div className="vem-doc">
      <div className="vem-doc-inner">
        <h1>{treeData.name}</h1>
        {treeData.date && <div className="vem-doc-date">{treeData.date}</div>}
        {treeData.desc && <p className="vem-doc-desc">{treeData.desc}</p>}

        {sections.map((section, i) => (
          <div key={i}>
            {i > 0 && <hr className="vem-divider" />}
            <NodeBlock node={section} level={2} />
          </div>
        ))}
      </div>
    </div>
  );
}
