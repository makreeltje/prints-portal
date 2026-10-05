import { Clock, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ApiError } from '../api/client';
import { t } from '../i18n/nl';
import { useAuth } from './context';
import type { AuthMethods } from './types';

/** HTTP 429 keeps the button disabled until the login rate-limit window (one minute) has passed. */
const RATE_LIMIT_WINDOW_MS = 60_000;

type Problem = 'wrong' | 'tooMany' | 'failed' | null;

/** ScreenLogin: local e-mail and password and/or "Inloggen met Authentik", whichever is configured. */
export function LoginPage({ methods }: { methods: AuthMethods }) {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [locked, setLocked] = useState(false);
  // An OIDC failure comes back as /login?error=oidc (GAP-022: no specific copy yet).
  const [problem, setProblem] = useState<Problem>(
    searchParams.get('error') === 'oidc' ? 'failed' : null,
  );
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
      await login(email, password);
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
    <div className="app-frame">
      <main className="pp-center app-login">
        <div className="pp-card pp-sec app-login-card">
          <div className="pp-brand">{t('app.name')}</div>
          <div className="pp-ph">
            <h1>{t('auth.login')}</h1>
          </div>

          {problem === 'wrong' && (
            <div className="pp-alert unpaid" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>{t('auth.wrong')}</div>
            </div>
          )}
          {problem === 'tooMany' && (
            <div className="pp-alert warning" role="alert">
              <Clock className="pp-ico" aria-hidden="true" />
              <div>{t('error.tooManyAttempts')}</div>
            </div>
          )}
          {problem === 'failed' && (
            <div className="pp-alert unpaid" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>{t('error.generic')}</div>
            </div>
          )}

          {methods.local && (
            <form
              className="pp-col app-login-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="pp-field">
                <label htmlFor="login-email">{t('auth.email')}</label>
                <input
                  id="login-email"
                  className="pp-input"
                  type="email"
                  autoComplete="username"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
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

          {methods.local && methods.oidc && (
            <div className="pp-row pp-muted app-login-or" aria-hidden="true">
              <span />
              {t('auth.or')}
              <span />
            </div>
          )}

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
    </div>
  );
}
