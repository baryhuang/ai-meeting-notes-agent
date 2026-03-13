import { useState, useCallback } from 'react';

const LS_START_KEY = 'atlas_timeline_start';
const LS_END_KEY = 'atlas_timeline_cutoff';

/**
 * Find the largest index where allDates[i] <= targetOrd.
 * Returns 0 if all dates are greater, or allDates.length - 1 if target exceeds all.
 */
export function findDateIndex(allDates: number[], targetOrd: number): number {
  if (allDates.length === 0) return 0;
  let best = 0;
  for (let i = 0; i < allDates.length; i++) {
    if (allDates[i] <= targetOrd) best = i;
    else break;
  }
  return best;
}

export interface TimelineRange {
  startOrd: number | null;
  endOrd: number | null;
}

export function useTimelineRange(): [TimelineRange, (range: Partial<TimelineRange>) => void] {
  const [range, setRangeState] = useState<TimelineRange>(() => {
    let startOrd: number | null = null;
    let endOrd: number | null = null;
    try {
      const rawStart = localStorage.getItem(LS_START_KEY);
      if (rawStart) startOrd = parseInt(rawStart, 10);
      const rawEnd = localStorage.getItem(LS_END_KEY);
      if (rawEnd) endOrd = parseInt(rawEnd, 10);
    } catch { /* ignore */ }
    return { startOrd, endOrd };
  });

  const setRange = useCallback((update: Partial<TimelineRange>) => {
    setRangeState(prev => {
      const next = { ...prev, ...update };
      try {
        if (next.startOrd !== null) {
          localStorage.setItem(LS_START_KEY, String(next.startOrd));
        } else {
          localStorage.removeItem(LS_START_KEY);
        }
        if (next.endOrd !== null) {
          localStorage.setItem(LS_END_KEY, String(next.endOrd));
        } else {
          localStorage.removeItem(LS_END_KEY);
        }
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return [range, setRange];
}
