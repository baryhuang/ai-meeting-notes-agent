import { useEffect, useState } from 'react';
import { fetchDimensions, fetchDimensionData, fetchCompetitorData } from '../api';
import type { DimensionMeta, TreeNode, CompetitorData } from '../types';

interface AtlasData {
  dimensions: DimensionMeta[];
  dimensionsData: Record<string, TreeNode>;
  competitorData: CompetitorData | null;
  loading: boolean;
  error: string | null;
}

export function useAtlasData(): AtlasData {
  const [dimensions, setDimensions] = useState<DimensionMeta[]>([]);
  const [dimensionsData, setDimensionsData] = useState<Record<string, TreeNode>>({});
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const dims = await fetchDimensions();
        if (cancelled) return;
        setDimensions(dims);

        // Fetch all dimension data + competitor data in parallel
        const results = await Promise.all([
          ...dims.map(async (d) => {
            const data = await fetchDimensionData(d.id);
            return { id: d.id, data };
          }),
          fetchCompetitorData().then(data => ({ id: '__comp__', data })),
        ]);

        if (cancelled) return;

        const dataMap: Record<string, TreeNode> = {};
        for (const r of results) {
          if (r.id === '__comp__') {
            setCompetitorData(r.data as CompetitorData);
          } else {
            dataMap[r.id] = r.data as TreeNode;
          }
        }
        setDimensionsData(dataMap);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { dimensions, dimensionsData, competitorData, loading, error };
}
