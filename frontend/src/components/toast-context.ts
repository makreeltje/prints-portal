import { createContext, useContext } from 'react';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastApi {
  success: (title: string) => void;
  error: (title: string, action?: ToastAction) => void;
  /**
   * A warning that stays until dismissed (e.g. live connection lost). Returns
   * its id, so the caller can take it back when the condition is over.
   */
  warning: (title: string) => number;
  /** Removes a toast by the id `warning` returned; unknown ids are ignored. */
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (value === null) throw new Error('useToast outside ToastProvider');
  return value;
}
