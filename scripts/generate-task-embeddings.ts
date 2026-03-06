#!/usr/bin/env bun
/**
 * Generate embeddings for all linear_tasks rows that don't have one yet.
 * Uses InsForge AI embeddings API with openai/text-embedding-3-small.
 *
 * Usage: INSFORGE_API_KEY=... bun scripts/generate-task-embeddings.ts
 */

const API_KEY = process.env.INSFORGE_API_KEY;
const BASE_URL = process.env.INSFORGE_BASE_URL || 'https://gx2m4dge.us-east.insforge.app';

if (!API_KEY) {
  console.error('Set INSFORGE_API_KEY env var');
  process.exit(1);
}

async function dbFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${BASE_URL}/api/database/records/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...opts.headers,
    },
  });
}

async function embed(texts: string[]): Promise<number[][]> {
  const resp = await fetch(`${BASE_URL}/api/ai/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: texts,
    }),
  });
  if (!resp.ok) throw new Error(`Embed failed: ${resp.status} ${await resp.text()}`);
  const json = await resp.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

// Fetch tasks without embeddings (all fields)
const resp = await dbFetch('linear_tasks?embedding=is.null&select=*');
if (!resp.ok) {
  console.error(`Fetch failed: ${resp.status} ${await resp.text()}`);
  process.exit(1);
}

const tasks = await resp.json() as Record<string, string>[];
console.log(`${tasks.length} tasks need embeddings`);

if (tasks.length === 0) {
  console.log('All tasks already have embeddings.');
  process.exit(0);
}

// Process in batches of 50
const BATCH = 50;
let done = 0;

// Fields to include in embedding text
const EMBED_FIELDS = [
  'Title', 'Description', 'Status', 'Priority', 'Project', 'Assignee',
  'Labels', 'Team', 'Cycle Name', 'Due Date', 'Parent issue',
  'Related to', 'Blocked by', 'Duplicate of',
];

for (let i = 0; i < tasks.length; i += BATCH) {
  const batch = tasks.slice(i, i + BATCH);

  const texts = batch.map((t) => {
    const parts: string[] = [];
    for (const field of EMBED_FIELDS) {
      const val = t[field];
      if (val && val.trim()) parts.push(`${field}: ${val}`);
    }
    return parts.join(' | ');
  });

  const embeddings = await embed(texts);

  // Update each task with its embedding
  for (let j = 0; j < batch.length; j++) {
    const id = batch[j].ID;
    const patchResp = await dbFetch(
      `linear_tasks?ID=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ embedding: `[${embeddings[j].join(',')}]` }),
      },
    );
    if (!patchResp.ok) {
      console.error(`  PATCH failed for ${id}: ${patchResp.status}`);
    }
  }

  done += batch.length;
  console.log(`  ${done}/${tasks.length}`);
}

console.log('Done generating embeddings.');
