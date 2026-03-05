import type { DimensionMeta, TreeNode, CompetitorData } from './types';
import { insforge } from './insforge';

const BUCKET = 'atlas-data';

async function downloadJson<T>(filename: string): Promise<T> {
  const { data: blob, error } = await insforge.storage
    .from(BUCKET)
    .download(filename);

  if (error || !blob) {
    throw new Error(`Failed to fetch ${filename}: ${error?.message ?? 'unknown error'}`);
  }

  const text = await blob.text();
  return JSON.parse(text) as T;
}

export async function fetchDimensions(): Promise<DimensionMeta[]> {
  return downloadJson<DimensionMeta[]>('dimensions.json');
}

export async function fetchDimensionData(name: string): Promise<TreeNode> {
  return downloadJson<TreeNode>(`${name}.json`);
}

export async function fetchCompetitorData(): Promise<CompetitorData> {
  return downloadJson<CompetitorData>('competitor.json');
}
