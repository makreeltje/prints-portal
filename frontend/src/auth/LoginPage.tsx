import { Clock, Info, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ApiError } from '../api/client';
import { t } from '../i18n/nl';
import { useAuth } from './context';
import type { AuthMethods } from './types';

/** HTTP 429 keeps the button disabled until the login rate-limit window (one minute) has passed. */
const RATE_LIMIT_WINDOW_MS = 60_000;

type Problem = 'wrong' | 'tooMany' | 'failed' | null;

/**
 * ScreenLogin (v1.2): e-mail address or name plus password, and/or "Inloggen
 * met Authentik", whichever is configured. Shows why the user is here: wrong
 * credentials, too many attempts, a failed Authentik sign-in or an ended session.
 */
export function LoginPage({ methods, expired }: { methods: AuthMethods; expired: boolean }) {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const oidcFailed = searchParams.get('error') === 'oidc';
  const unlockTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(unlockTimer.current);
    },
    [],
  );

  async function submit() {
    if (submitting || locked) return;
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch (error) {
      setPassword('');
      if (error instanceof ApiError && error.status === 401) setProblem('wrong');
      else if (error instanceof ApiError && error.status === 429) {
        setProblem('tooMany');
        setLocked(true);
        unlockTimer.current = window.setTimeout(() => {
          setLocked(false);
        }, RATE_LIMIT_WINDOW_MS);
      } else setProblem('failed');
      setSubmitting(false);
    }
  }

  function signInWithAuthentik() {
    setRedirecting(true);
    window.location.assign('/api/auth/oidc/login');
  }

  return (
    <main className="pp-center">
      <div className="pp-auth">
        <div className="pp-brand">{t('app.name')}</div>
        <h1>{t('auth.login')}</h1>

        {expired && problem === null && !oidcFailed && (
          <div className="pp-alert info" role="status">
            <Info className="pp-ico" aria-hidden="true" />
            <div>{t('auth.sessionExpired')}</div>
          </div>
        )}
        {problem === 'wrong' && (
          <Alert tone="unpaid" icon="alert">
            {t('auth.wrong')}
          </Alert>
        )}
        {problem === 'tooMany' && (
          <Alert tone="warning" icon="clock">
            {t('error.tooManyAttempts')}
          </Alert>
        )}
        {problem === 'failed' && (
          <Alert tone="unpaid" icon="alert">
            {t('error.generic')}
          </Alert>
        )}
        {oidcFailed && problem === null && (
          <Alert tone="unpaid" icon="alert">
            {t('auth.oidcFailed')}
          </Alert>
        )}

        {methods.local && (
          <form
            className="pp-col"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="pp-field">
              <label htmlFor="login-identifier">{t('auth.identifier')}</label>
              <input
                id="login-identifier"
                className="pp-input"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                }}
              />
            </div>
            <div className="pp-field">
              <label htmlFor="login-password">{t('auth.password')}</label>
              <input
                id="login-password"
                className="pp-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
            </div>
            <button
              type="submit"
              className="pp-btn pp-btn-primary"
              disabled={submitting || locked}
              aria-busy={submitting}
            >
              {submitting && <span className="pp-spin" aria-hidden="true" />}
              {t('auth.login')}
            </button>
          </form>
        )}

        {methods.local && methods.oidc && <div className="or">{t('auth.or')}</div>}

        {methods.oidc && (
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            disabled={redirecting}
            aria-busy={redirecting}
            onClick={signInWithAuthentik}
          >
            {redirecting && <span className="pp-spin" aria-hidden="true" />}
            {redirecting ? t('auth.redirecting') : t('auth.authentik')}
          </button>
        )}
      </div>
    </main>
  );
}

function Alert({
  tone,
  icon,
  children,
}: {
  tone: 'unpaid' | 'warning';
  icon: 'alert' | 'clock';
  children: string;
}) {
  const Icon = icon === 'clock' ? Clock : TriangleAlert;
  return (
    <div className={`pp-alert ${tone}`} role="alert">
      <Icon className="pp-ico" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
