import { createContext, useContext } from 'react';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastApi {
  success: (title: string) => void;
  error: (title: string, action?: ToastAction) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (value === null) throw new Error('useToast outside ToastProvider');
  return value;
}
