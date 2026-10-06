import { CircleCheck, TriangleAlert, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastAction, type ToastApi } from './toast-context';

/** Toast: success toasts live 6 seconds (paused on hover), errors stay until dismissed. */
const TOAST_LIFETIME_MS = 6000;

type Tone = 'paid' | 'unpaid' | 'warning';

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  action?: ToastAction;
}

export function ToastProvider({
  children,
  dismissLabel,
}: {
  children: ReactNode;
  dismissLabel: string;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number) => {
      timers.current.set(
        id,
        window.setTimeout(() => {
          dismiss(id);
        }, TOAST_LIFETIME_MS),
      );
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title) => {
        const id = nextId.current++;
        setToasts((current) => [...current, { id, tone: 'paid', title }]);
        schedule(id);
      },
      error: (title, action) => {
        const id = nextId.current++;
        setToasts((current) => [...current, { id, tone: 'unpaid', title, action }]);
      },
      warning: (title) => {
        const id = nextId.current++;
        setToasts((current) => [...current, { id, tone: 'warning', title }]);
      },
    }),
    [schedule],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="app-toasts pp-col" role="status">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pp-alert ${toast.tone} pp-toast`}
            role={toast.tone === 'unpaid' ? 'alert' : undefined}
            onMouseEnter={() => {
              if (toast.tone === 'paid') window.clearTimeout(timers.current.get(toast.id));
            }}
            onMouseLeave={() => {
              if (toast.tone === 'paid') schedule(toast.id);
            }}
          >
            {toast.tone === 'paid' ? (
              <CircleCheck className="pp-ico" aria-hidden="true" />
            ) : (
              <TriangleAlert className="pp-ico" aria-hidden="true" />
            )}
            <div>
              <strong>{toast.title}</strong>
              {toast.action !== undefined && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="pp-link app-link-button"
                    onClick={() => {
                      dismiss(toast.id);
                      toast.action?.run();
                    }}
                  >
                    {toast.action.label}
                  </button>
                </>
              )}
            </div>
            {toast.tone !== 'paid' && (
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-icon pp-btn-sm"
                aria-label={dismissLabel}
                onClick={() => {
                  dismiss(toast.id);
                }}
              >
                <X className="pp-ico" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
