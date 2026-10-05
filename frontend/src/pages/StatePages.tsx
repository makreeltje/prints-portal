import { Lock, RotateCw, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { t } from '../i18n/nl';

/** ScreenSystemStates 403: shown when a user opens a klant they have no access to. */
export function ForbiddenState() {
  return (
    <div className="pp-state">
      <span className="pp-muted">
        <Lock className="pp-ico pp-ico-24" aria-hidden="true" />
      </span>
      <h1>{t('error.noAccess')}</h1>
      <p>{t('system.forbiddenHelp')}</p>
      <div className="acts">
        <Link className="pp-btn pp-btn-secondary" to="/">
          {t('system.goDashboard')}
        </Link>
      </div>
    </div>
  );
}

/**
 * ScreenSystemStates global error. `withDashboard` is false where there is no
 * session yet (the app could not reach the server at start-up).
 */
export function GlobalErrorState({
  onRetry,
  withDashboard = true,
}: {
  onRetry: () => void;
  withDashboard?: boolean;
}) {
  return (
    <div className="pp-state" role="alert">
      <span className="app-state-error">
        <TriangleAlert className="pp-ico pp-ico-24" aria-hidden="true" />
      </span>
      <h1>{t('error.generic')}</h1>
      <p>{t('system.errorBody')}</p>
      <div className="acts">
        <button type="button" className="pp-btn pp-btn-primary" onClick={onRetry}>
          <RotateCw className="pp-ico" aria-hidden="true" />
          {t('common.retry')}
        </button>
        {withDashboard && (
          <Link className="pp-btn pp-btn-secondary" to="/">
            {t('system.goDashboard')}
          </Link>
        )}
      </div>
    </div>
  );
}
