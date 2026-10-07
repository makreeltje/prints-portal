import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../api/client';
import { t, type MessageKey } from '../i18n/nl';
import { useAuth } from './context';

const MIN_PASSWORD_LENGTH = 12;

/**
 * ScreenLogin "Nieuw wachtwoord kiezen": after signing in with a temporary
 * password the user picks their own before anything else is reachable.
 * Uitloggen keeps them from being stuck.
 */
export function NewPasswordPage() {
  const { changePassword, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ password?: MessageKey; repeat?: MessageKey }>({});
  const [failed, setFailed] = useState(false);

  async function submit() {
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) next.password = 'error.passwordTooShort';
    if (repeat !== password) next.repeat = 'error.passwordMismatch';
    setErrors(next);
    setFailed(false);
    if (next.password !== undefined || next.repeat !== undefined) return;
    setSaving(true);
    try {
      await changePassword(password);
    } catch (error) {
      // The backend names why it refused; "Er ging iets mis" threw that away.
      if (error instanceof ApiError && error.code === 'password_too_short') {
        setErrors({ password: 'error.passwordTooShort' });
      } else if (error instanceof ApiError && error.code === 'password_unchanged') {
        setErrors({ password: 'error.passwordUnchanged' }); // ds-gap: GAP-100
      } else {
        setFailed(true);
      }
      setSaving(false);
    }
  }

  return (
    <main className="pp-center">
      <form
        className="pp-auth"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="pp-brand">{t('app.name')}</div>
        <h1>{t('auth.newPasswordTitle')}</h1>
        <span className="pp-muted">{t('auth.newPasswordIntro')}</span>
        {failed && (
          <div className="pp-alert unpaid" role="alert">
            <TriangleAlert className="pp-ico" aria-hidden="true" />
            <div>{t('error.generic')}</div>
          </div>
        )}
        <PasswordField
          id="new-password"
          label={t('auth.newPassword')}
          help={t('auth.passwordHelp')}
          error={errors.password}
          value={password}
          onChange={setPassword}
          autoFocus
        />
        <PasswordField
          id="repeat-password"
          label={t('auth.repeatPassword')}
          error={errors.repeat}
          value={repeat}
          onChange={setRepeat}
        />
        <button
          type="submit"
          className="pp-btn pp-btn-primary"
          disabled={saving}
          aria-busy={saving}
        >
          {saving && <span className="pp-spin" aria-hidden="true" />}
          {t('common.save')}
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-ghost"
          disabled={saving}
          onClick={() => void logout()}
        >
          {t('auth.logout')}
        </button>
      </form>
    </main>
  );
}

/** FormField with a password input; the error replaces the help text. */
export function PasswordField({
  id,
  label,
  help,
  error,
  value,
  onChange,
  autoFocus = false,
}: {
  id: string;
  label: string;
  help?: string;
  error?: MessageKey;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const describedBy = `${id}-note`;
  const showNote = error !== undefined || help !== undefined;
  return (
    <div className="pp-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="pp-input"
        type="password"
        autoComplete="new-password"
        autoFocus={autoFocus}
        // Inside a Dialog, data-autofocus picks the field that gets focus when it opens.
        data-autofocus={autoFocus || undefined}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={showNote ? describedBy : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {error !== undefined ? (
        <span id={describedBy} className="pp-err" role="alert">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          {t(error)}
        </span>
      ) : (
        help !== undefined && (
          <span id={describedBy} className="pp-help">
            {help}
          </span>
        )
      )}
    </div>
  );
}
