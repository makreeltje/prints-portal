import { ChevronDown, Link, Trash2, User as UserIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { ROLES, type Role, type User } from '../auth/types';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { ErrorState, LoadingRows } from './ErrorState';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; users: User[] };

/**
 * ScreenUsers (Admin only): role changes save immediately; the last Admin
 * cannot be demoted or removed. Not built yet, waiting for the design
 * system: "Gebruiker maken" (GAP-018, GAP-019, GAP-022), "Wachtwoord
 * resetten" (GAP-019) and changing roles on phones (GAP-020).
 */
export function UsersPage() {
  const toast = useToast();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
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

  if (load.status === 'loading') {
    return (
      <Page>
        <LoadingRows />
      </Page>
    );
  }
  if (load.status === 'error') {
    return (
      <Page>
        <ErrorState
          body={t('system.errorBody')}
          onRetry={() => {
            setLoad({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
        />
      </Page>
    );
  }

  const { users } = load;
  const adminCount = users.filter((user) => user.role === 'Admin').length;
  const isLastAdmin = (user: User) => user.role === 'Admin' && adminCount <= 1;

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
    <Page>
      <div className="pp-scroll app-desktop-only">
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
                    <DeleteButton
                      user={user}
                      disabled={isLastAdmin(user)}
                      describedBy={lastAdminHelpId(user)}
                      small
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

      {/* Phone: one card per user; the role is shown, not editable yet (GAP-020). */}
      <div className="pp-col app-phone-only">
        {users.map((user) => (
          <div key={user.id} className="pp-card pp-sec app-user-card">
            <Avatar name={user.displayName} role={user.role} />
            <div className="pp-row">
              <OriginBadge user={user} />
            </div>
            {isLastAdmin(user) && (
              <span id={`${lastAdminHelpId(user)}-card`} className="pp-help">
                {t('users.lastAdmin')}
              </span>
            )}
            <div className="pp-row">
              <DeleteButton
                user={user}
                disabled={isLastAdmin(user)}
                describedBy={`${lastAdminHelpId(user)}-card`}
                onClick={() => {
                  setDeleting(user);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title={t('confirm.deleteUser', { name: deleting?.displayName ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          if (deleting !== null) await deleteUser(deleting);
        }}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pp-ph">
        <h1>{t('users.title')}</h1>
      </div>
      {children}
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
  const helpId = lastAdminHelpId(user);
  return (
    <div className="pp-col app-cell-stack">
      <div className="pp-iwrap">
        <select
          className="pp-input pp-select"
          aria-label={t('users.roleFor', { name: user.displayName })}
          aria-describedby={lastAdmin ? helpId : undefined}
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
        <span id={helpId} className="pp-help">
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

function DeleteButton({
  user,
  disabled,
  describedBy,
  small = false,
  onClick,
}: {
  user: User;
  disabled: boolean;
  describedBy: string;
  small?: boolean;
  onClick: () => void;
}) {
  return (
    // Button spec: a disabled button that explains why uses aria-disabled, so it stays focusable.
    <button
      type="button"
      className={`pp-btn pp-btn-ghost${small ? ' pp-btn-sm' : ''}`}
      aria-disabled={disabled || undefined}
      aria-label={`${t('common.delete')}: ${user.displayName}`}
      aria-describedby={disabled ? describedBy : undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      <Trash2 className="pp-ico" aria-hidden="true" />
      {t('common.delete')}
    </button>
  );
}
