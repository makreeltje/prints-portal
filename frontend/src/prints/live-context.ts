import { createContext, useContext } from 'react';

export type LiveStatus = 'connecting' | 'live' | 'reconnecting';

export interface LiveValue {
  status: LiveStatus;
  /** Prints changed by a live event a moment ago (PrintCard flash). */
  flashing: ReadonlySet<string>;
  doneFlashing: (printId: string) => void;
}

export const LiveContext = createContext<LiveValue>({
  status: 'connecting',
  flashing: new Set(),
  doneFlashing: () => undefined,
});

export function useLive(): LiveValue {
  return useContext(LiveContext);
}
