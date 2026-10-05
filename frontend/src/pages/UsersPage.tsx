import { ChevronDown, Link, Plus, Trash2, TriangleAlert, User as UserIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { PasswordField } from '../auth/NewPasswordPage';
import { ROLES, type Role, type User } from '../auth/types';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { useToast } from '../components/toast-context';
import { t, type MessageKey } from '../i18n/nl';
import { ErrorState, LoadingRows } from './ErrorState';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; users: User[] };

const MIN_PASSWORD_LENGTH = 12;

/**
 * ScreenUsers (Admin only, v1.2): role changes save immediately; the last
 * Admin cannot be demoted or removed; "Gebruiker maken" and "Wachtwoord
 * resetten" set a temporary password the user replaces at the next sign-in.
 */
export function UsersPage({ localLogin }: { localLogin: boolean }) {
  const toast = useToast();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<{ users: User[] }>('/api/users').then(
      ({ users }) => {
        if (!cancelled) setLoad({ status: 'ready', users });
      },
      () => {
        if (!cancelled) setLoad({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const replaceUser = useCallback((user: User) => {
    setLoad((current) =>
      current.status === 'ready'
        ? { status: 'ready', users: current.users.map((u) => (u.id === user.id ? user : u)) }
        : current,
    );
  }, []);

  const header = (
    <div className="pp-ph">
      <h1>{t('users.title')}</h1>
      {/* Local users only exist while local sign-in is on (not with Authentik). */}
      {localLogin && load.status === 'ready' && (
        <button
          type="button"
          className="pp-btn pp-btn-primary"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus className="pp-ico" aria-hidden="true" />
          {t('users.create')}
        </button>
      )}
    </div>
  );

  if (load.status === 'loading') {
    return (
      <>
        {header}
        <LoadingRows />
      </>
    );
  }
  if (load.status === 'error') {
    return (
      <>
        {header}
        <ErrorState
          body={t('system.errorBody')}
          onRetry={() => {
            setLoad({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
        />
      </>
    );
  }

  const { users } = load;
  const adminCount = users.filter((user) => user.role === 'Admin').length;
  const isLastAdmin = (user: User) => user.role === 'Admin' && adminCount <= 1;
  const canReset = (user: User) => localLogin && user.origin === 'local';

  async function changeRole(user: User, role: Role) {
    setSaving(user.id);
    replaceUser({ ...user, role });
    try {
      replaceUser(await api<User>(`/api/users/${user.id}`, { method: 'PATCH', body: { role } }));
      toast.success(t('toast.saved'));
    } catch {
      replaceUser(user);
      toast.error(t('error.saveFailed'), {
        label: t('common.retry'),
        run: () => void changeRole(user, role),
      });
    } finally {
      setSaving(null);
    }
  }

  async function deleteUser(user: User) {
    try {
      await api(`/api/users/${user.id}`, { method: 'DELETE' });
    } catch (error) {
      // Someone else removed the user already: the list is simply out of date.
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
    setLoad({ status: 'ready', users: users.filter((u) => u.id !== user.id) });
  }

  return (
    <>
      {header}
      <div className="pp-scroll">
        <table className="pp-table">
          <thead>
            <tr>
              <th scope="col">{t('users.user')}</th>
              <th scope="col">{t('users.role')}</th>
              <th scope="col">{t('users.origin')}</th>
              <th scope="col" className="r">
                {t('users.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <Avatar name={user.displayName} />
                </td>
                <td>
                  <RoleSelect
                    user={user}
                    lastAdmin={isLastAdmin(user)}
                    saving={saving === user.id}
                    onChange={(role) => void changeRole(user, role)}
                  />
                </td>
                <td>
                  <OriginBadge user={user} />
                </td>
                <td className="r">
                  <div className="pp-row app-row-actions">
                    {canReset(user) && (
                      <button
                        type="button"
                        className="pp-btn pp-btn-ghost pp-btn-sm"
                        aria-label={`${t('users.resetPassword')}: ${user.displayName}`}
                        onClick={() => {
                          setResetting(user);
                        }}
                      >
                        {t('users.resetPassword')}
                      </button>
                    )}
                    <DeleteButton
                      user={user}
                      disabled={isLastAdmin(user)}
                      onClick={() => {
                        setDeleting(user);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserDialog
        open={creating}
        onClose={() => {
          setCreating(false);
        }}
        onCreated={(user) => {
          setLoad({ status: 'ready', users: [...users, user] });
          toast.success(t('toast.saved'));
        }}
      />
      <ResetPasswordDialog
        user={resetting}
        onClose={() => {
          setResetting(null);
        }}
        onDone={() => {
          toast.success(t('toast.saved'));
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('confirm.deleteUser', { name: deleting?.displayName ?? '' })}
        body={t('confirm.deleteUserBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          if (deleting !== null) await deleteUser(deleting);
        }}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </>
  );
}

function RoleSelect({
  user,
  lastAdmin,
  saving,
  onChange,
}: {
  user: User;
  lastAdmin: boolean;
  saving: boolean;
  onChange: (role: Role) => void;
}) {
  return (
    <div className="pp-col app-cell-stack">
      <div className="pp-iwrap compact">
        <select
          className="pp-input pp-select"
          aria-label={t('users.roleFor', { name: user.displayName })}
          aria-describedby={lastAdmin ? lastAdminHelpId(user) : undefined}
          aria-busy={saving}
          value={user.role}
          disabled={lastAdmin || saving}
          onChange={(event) => {
            onChange(event.target.value as Role);
          }}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`role.${role}`)}
            </option>
          ))}
        </select>
        <ChevronDown className="pp-ico r" aria-hidden="true" />
      </div>
      {lastAdmin && (
        <span id={lastAdminHelpId(user)} className="pp-help">
          {t('users.lastAdmin')}
        </span>
      )}
    </div>
  );
}

function lastAdminHelpId(user: User): string {
  return `last-admin-${user.id}`;
}

function OriginBadge({ user }: { user: User }) {
  return user.origin === 'oidc' ? (
    <span className="pp-badge info">
      <Link className="pp-ico" aria-hidden="true" />
      {t('users.authentik')}
    </span>
  ) : (
    <span className="pp-badge neutral">
      <UserIcon className="pp-ico" aria-hidden="true" />
      {t('users.local')}
    </span>
  );
}

/** Icon button (v1.2); a disabled one explains why through aria-disabled and the help text. */
function DeleteButton({
  user,
  disabled,
  onClick,
}: {
  user: User;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="pp-btn pp-btn-ghost pp-btn-sm pp-btn-icon"
      aria-disabled={disabled || undefined}
      aria-label={`${t('common.delete')}: ${user.displayName}`}
      aria-describedby={disabled ? lastAdminHelpId(user) : undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      <Trash2 className="pp-ico" aria-hidden="true" />
    </button>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}) {
  const [login, setLogin] = useState('');
  const [role, setRole] = useState<Role>('User');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ login?: MessageKey; password?: MessageKey }>({});
  const [failed, setFailed] = useState(false);

  const close = () => {
    setLogin('');
    setRole('User');
    setPassword('');
    setErrors({});
    setFailed(false);
    onClose();
  };

  async function submit() {
    const next: typeof errors = {};
    if (login.trim() === '') next.login = 'error.required';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = 'error.passwordTooShort';
    setErrors(next);
    setFailed(false);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      const user = await api<User>('/api/users', {
        method: 'POST',
        body: { login, role, password },
      });
      setBusy(false);
      onCreated(user);
      close();
    } catch (error) {
      setBusy(false);
      if (error instanceof ApiError && error.code === 'login_taken') {
        setErrors({ login: 'error.userExists' });
      } else if (error instanceof ApiError && error.code === 'password_too_short') {
        setErrors({ password: 'error.passwordTooShort' });
      } else {
        setFailed(true);
      }
    }
  }

  return (
    <Dialog
      open={open}
      title={t('users.create')}
      onClose={close}
      busy={busy}
      onSubmit={() => void submit()}
      footer={<DialogButtons busy={busy} confirmLabel={t('common.create')} onCancel={close} />}
    >
      {failed && <GenericError />}
      <div className="pp-field">
        <label htmlFor="new-user-login">{t('auth.identifier')}</label>
        <input
          id="new-user-login"
          className="pp-input"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          data-autofocus
          aria-invalid={errors.login !== undefined || undefined}
          aria-describedby={errors.login === undefined ? undefined : 'new-user-login-err'}
          value={login}
          onChange={(event) => {
            setLogin(event.target.value);
          }}
        />
        {errors.login !== undefined && (
          <FieldError id="new-user-login-err">{t(errors.login)}</FieldError>
        )}
      </div>
      <div className="pp-field">
        <label htmlFor="new-user-role">{t('users.role')}</label>
        <div className="pp-iwrap">
          <select
            id="new-user-role"
            className="pp-input pp-select"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role);
            }}
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {t(`role.${option}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="pp-ico r" aria-hidden="true" />
        </div>
      </div>
      <PasswordField
        id="new-user-password"
        label={t('users.tempPassword')}
        help={t('users.tempPasswordHelp')}
        error={errors.password}
        value={password}
        onChange={setPassword}
      />
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
  onDone,
}: {
  user: User | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  const close = () => {
    setPassword('');
    setError(undefined);
    setFailed(false);
    onClose();
  };

  async function submit() {
    if (user === null) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('error.passwordTooShort');
      return;
    }
    setError(undefined);
    setFailed(false);
    setBusy(true);
    try {
      await api(`/api/users/${user.id}/password`, { method: 'POST', body: { password } });
      setBusy(false);
      onDone();
      close();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <Dialog
      open={user !== null}
      title={t('users.resetTitle', { name: user?.displayName ?? '' })}
      onClose={close}
      busy={busy}
      onSubmit={() => void submit()}
      footer={<DialogButtons busy={busy} confirmLabel={t('common.save')} onCancel={close} />}
    >
      {failed && <GenericError />}
      <PasswordField
        id="reset-password"
        label={t('users.tempPassword')}
        help={t('users.tempPasswordHelp')}
        error={error}
        value={password}
        onChange={setPassword}
        autoFocus
      />
    </Dialog>
  );
}

function DialogButtons({
  busy,
  confirmLabel,
  onCancel,
}: {
  busy: boolean;
  confirmLabel: string;
  onCancel: () => void;
}) {
  return (
    <>
      <button type="button" className="pp-btn pp-btn-secondary" disabled={busy} onClick={onCancel}>
        {t('common.cancel')}
      </button>
      <button type="submit" className="pp-btn pp-btn-primary" disabled={busy} aria-busy={busy}>
        {busy && <span className="pp-spin" aria-hidden="true" />}
        {confirmLabel}
      </button>
    </>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className="pp-err" role="alert">
      <TriangleAlert className="pp-ico" aria-hidden="true" />
      {children}
    </span>
  );
}

function GenericError() {
  return (
    <div className="pp-alert unpaid" role="alert">
      <TriangleAlert className="pp-ico" aria-hidden="true" />
      <div>{t('error.generic')}</div>
    </div>
  );
}
