import type { DimensionMeta, TreeNode, CompetitorData } from './types';

const BASE = '/api/atlas';

export async function fetchDimensions(): Promise<DimensionMeta[]> {
  const res = await fetch(`${BASE}/dimensions`);
  if (!res.ok) throw new Error(`Failed to fetch dimensions: ${res.status}`);
  return res.json();
}

export async function fetchDimensionData(name: string): Promise<TreeNode> {
  const res = await fetch(`${BASE}/data/${name}`);
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
  return res.json();
}

export async function fetchCompetitorData(): Promise<CompetitorData> {
  const res = await fetch(`${BASE}/data/competitor`);
  if (!res.ok) throw new Error(`Failed to fetch competitor data: ${res.status}`);
  return res.json();
}
