import { RotateCw, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { t } from '../i18n/nl';

/** Skeleton spec: show after 200 ms of waiting, so fast loads do not flash. */
const SKELETON_DELAY_MS = 200;

/** ErrorState: loading failed; never shows raw server errors. */
export function ErrorState({ body, onRetry }: { body: string; onRetry: () => void }) {
  return (
    <div className="pp-alert unpaid app-error-state" role="alert">
      <div className="pp-row app-error-title">
        <TriangleAlert className="pp-ico" aria-hidden="true" />
        <b>{t('error.generic')}</b>
      </div>
      <div>{body}</div>
      <button type="button" className="pp-btn pp-btn-primary" onClick={onRetry}>
        <RotateCw className="pp-ico" aria-hidden="true" />
        {t('common.retry')}
      </button>
    </div>
  );
}

/** Skeleton rows while a list loads; announced once as "Laden…". */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, SKELETON_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="pp-col" aria-busy="true">
      <span className="pp-sr" role="status">
        {t('common.loading')}
      </span>
      {visible &&
        Array.from({ length: rows }, (_, index) => (
          <div key={index} className="pp-skel app-skel-row" aria-hidden="true" />
        ))}
    </div>
  );
}
