import { ChevronDown, Users } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client';
import type { User } from '../auth/types';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { ErrorState, LoadingRows } from './ErrorState';

interface AccessUser extends User {
  customers: string[];
}

interface Matrix {
  customers: string[];
  users: AccessUser[];
}

interface Change {
  userId: string;
  customerFolder: string;
  granted: boolean;
}

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; matrix: Matrix };

const cellKey = (userId: string, customer: string) => `${userId}\u0000${customer}`;

/**
 * ScreenAccess (Admin only): Users × klanten. Each cell saves immediately
 * with a brief tint; a failure rolls back with a toast. Editor and Admin
 * rows are always on.
 */
export function AccessPage() {
  const toast = useToast();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [attempt, setAttempt] = useState(0);
  /**
   * Which menu is open ("col:{klant}" or "row:{id}"). The cell has to carry
   * `has-pop` while it is,
   * because a popover's own z-index is only compared inside its own stacking
   * context and loses to a sticky sibling cell (GAP-098).
   */
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Matrix>('/api/access').then(
      (matrix) => {
        if (!cancelled) setLoad({ status: 'ready', matrix });
      },
      () => {
        if (!cancelled) setLoad({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const title = (
    <div className="pp-ph">
      <h1>{t('access.title')}</h1>
    </div>
  );

  if (load.status === 'loading') {
    return (
      <>
        {title}
        <LoadingRows />
      </>
    );
  }
  if (load.status === 'error') {
    return (
      <>
        {title}
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

  const { customers, users } = load.matrix;
  const grantees = users.filter((user) => user.role === 'User');
  // Editors and Admins see every klant: shown checked and disabled, Editors first (AccessMatrix v1.2).
  const allAccess = [
    ...users.filter((user) => user.role === 'Editor'),
    ...users.filter((user) => user.role === 'Admin'),
  ];

  const apply = (changes: readonly Change[]) => {
    setLoad((current) => {
      if (current.status !== 'ready') return current;
      return {
        status: 'ready',
        matrix: {
          ...current.matrix,
          users: current.matrix.users.map((user) => {
            const mine = changes.filter((change) => change.userId === user.id);
            if (mine.length === 0) return user;
            const set = new Set(user.customers);
            for (const change of mine) {
              if (change.granted) set.add(change.customerFolder);
              else set.delete(change.customerFolder);
            }
            return { ...user, customers: [...set] };
          }),
        },
      };
    });
  };

  async function save(changes: Change[]) {
    const effective = changes.filter((change) => {
      const user = grantees.find((u) => u.id === change.userId);
      return (
        user !== undefined && user.customers.includes(change.customerFolder) !== change.granted
      );
    });
    if (effective.length === 0) return;
    const keys = effective.map((change) => cellKey(change.userId, change.customerFolder));
    apply(effective);
    setBusy((current) => new Set([...current, ...keys]));
    try {
      await api('/api/access', { method: 'PATCH', body: { changes: effective } });
      setSaved(new Set(keys));
    } catch {
      apply(effective.map((change) => ({ ...change, granted: !change.granted })));
      toast.error(t('error.saveFailed'), {
        label: t('common.retry'),
        run: () => void save(effective),
      });
    } finally {
      setBusy((current) => new Set([...current].filter((key) => !keys.includes(key))));
    }
  }

  const setColumn = (customer: string, granted: boolean) =>
    void save(grantees.map((user) => ({ userId: user.id, customerFolder: customer, granted })));
  const setRow = (user: AccessUser, granted: boolean) =>
    void save(
      customers.map((customer) => ({ userId: user.id, customerFolder: customer, granted })),
    );

  // Nobody has the role User, so there is nothing to grant (ScreenAccess 1.7:
  // the help line stays above the AccessMatrix empty state).
  if (grantees.length === 0) {
    return (
      <>
        {title}
        <p className="pp-help pp-m0">{t('access.allAccessRoles')}</p>
        <div className="pp-empty">
          <div className="pp-illus" aria-hidden="true">
            <Users className="pp-ico pp-ico-24" />
          </div>
          <h3>{t('access.empty.title')}</h3>
          <p>{t('access.empty.body')}</p>
          <Link className="pp-link" to="/gebruikers">
            {t('access.empty.link')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {title}
      <div className="pp-only-wide">
        <div className="pp-scroll" tabIndex={0} role="region" aria-label={t('nav.access')}>
          <table className="pp-matrix" onKeyDown={moveBetweenCells}>
            <thead>
              <tr>
                <th scope="col">{t('users.user')}</th>
                {customers.map((customer) => (
                  <th
                    key={customer}
                    scope="col"
                    className={menuOpenFor === `col:${customer}` ? 'has-pop' : undefined}
                  >
                    <BulkMenu
                      label={customer}
                      name={t('access.colMenu', { klant: customer })}
                      disabled={grantees.length === 0}
                      open={menuOpenFor === `col:${customer}`}
                      onOpenChange={(next) => {
                        setMenuOpenFor(next ? `col:${customer}` : null);
                      }}
                      onAll={() => {
                        setColumn(customer, true);
                      }}
                      onNone={() => {
                        setColumn(customer, false);
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grantees.map((user, row) => (
                <tr key={user.id}>
                  <th
                    scope="row"
                    className={menuOpenFor === `row:${user.id}` ? 'has-pop' : undefined}
                  >
                    <BulkMenu
                      label={user.displayName}
                      disabled={customers.length === 0}
                      open={menuOpenFor === `row:${user.id}`}
                      onOpenChange={(next) => {
                        setMenuOpenFor(next ? `row:${user.id}` : null);
                      }}
                      onAll={() => {
                        setRow(user, true);
                      }}
                      onNone={() => {
                        setRow(user, false);
                      }}
                    />
                  </th>
                  {customers.map((customer, column) => {
                    const key = cellKey(user.id, customer);
                    return (
                      <td
                        key={customer}
                        className={saved.has(key) ? 'app-saved' : undefined}
                        onAnimationEnd={() => {
                          setSaved((current) => new Set([...current].filter((k) => k !== key)));
                        }}
                      >
                        <label className="pp-opt">
                          <input
                            type="checkbox"
                            className="pp-check"
                            data-row={row}
                            data-column={column}
                            aria-label={t('access.cell', { user: user.displayName, customer })}
                            checked={user.customers.includes(customer)}
                            disabled={busy.has(key)}
                            aria-busy={busy.has(key)}
                            onChange={(event) =>
                              void save([
                                {
                                  userId: user.id,
                                  customerFolder: customer,
                                  granted: event.target.checked,
                                },
                              ])
                            }
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {allAccess.map((user) => {
                return (
                  <tr key={user.id}>
                    <th scope="row">
                      {user.displayName}{' '}
                      <span className="pp-muted app-role-note">· {t(`role.${user.role}`)}</span>
                    </th>
                    {customers.map((customer) => (
                      <td key={customer}>
                        <label className="pp-opt">
                          <input
                            type="checkbox"
                            className="pp-check"
                            checked
                            disabled
                            aria-label={t('access.cell', { user: user.displayName, customer })}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <span className="pp-help">{t('access.allAccessRoles')}</span>
      </div>

      {/* Phone (480px and below): one card per user with a list of klant checkboxes. */}
      <div className="pp-only-phone">
        <div className="pp-col">
          {grantees.map((user) => (
            <div key={user.id} className="pp-card pp-sec app-access-card">
              <b>{user.displayName}</b>
              {customers.map((customer) => {
                const key = cellKey(user.id, customer);
                return (
                  <label key={customer} className="pp-opt">
                    <input
                      type="checkbox"
                      className="pp-check"
                      // The card heading names the user; the label names it too for screen readers.
                      aria-label={t('access.cell', { user: user.displayName, customer })}
                      checked={user.customers.includes(customer)}
                      disabled={busy.has(key)}
                      aria-busy={busy.has(key)}
                      onChange={(event) =>
                        void save([
                          {
                            userId: user.id,
                            customerFolder: customer,
                            granted: event.target.checked,
                          },
                        ])
                      }
                    />
                    {customer}
                  </label>
                );
              })}
            </div>
          ))}
          {allAccess.map((user) => (
            <div key={user.id} className="pp-card pp-sec app-access-card">
              <b>
                {user.displayName}{' '}
                <span className="pp-muted app-role-note">· {t(`role.${user.role}`)}</span>
              </b>
              {customers.map((customer) => (
                <label key={customer} className="pp-opt">
                  <input
                    type="checkbox"
                    className="pp-check"
                    checked
                    disabled
                    aria-label={t('access.cell', { user: user.displayName, customer })}
                  />
                  {customer}
                </label>
              ))}
            </div>
          ))}
          <span className="pp-help">{t('access.allAccessRoles')}</span>
        </div>
      </div>
    </>
  );
}

/** Arrow keys move between the matrix checkboxes (AccessMatrix accessibility notes). */
function moveBetweenCells(event: KeyboardEvent<HTMLTableElement>) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.row === undefined) return;
  const delta: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };
  const step = delta[event.key];
  if (step === undefined) return;
  const row = Number(target.dataset.row) + step[0];
  const column = Number(target.dataset.column) + step[1];
  const next = event.currentTarget.querySelector<HTMLInputElement>(
    `input[data-row="${String(row)}"][data-column="${String(column)}"]`,
  );
  if (next !== null) {
    event.preventDefault();
    next.focus();
  }
}

/** Header menu with "Alles selecteren" and "Niets selecteren" (Popover). */
function BulkMenu({
  label,
  name,
  disabled,
  open,
  onOpenChange,
  onAll,
  onNone,
}: {
  label: string;
  /** Accessible name when the visible label alone does not tell two menus apart. */
  name?: string;
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  const setOpen = onOpenChange;
  /**
   * The parent passes a fresh callback each render, so the pointer effect reads
   * it through a ref: listing it as a dependency would re-run the effect on
   * every render and move focus back to the first item while the menu is open.
   */
  const latestOpenChange = useRef(onOpenChange);
  useEffect(() => {
    latestOpenChange.current = onOpenChange;
  });
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstItem = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItem.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) latestOpenChange.current(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  let menu: ReactNode = null;
  if (open) {
    menu = (
      <div
        className="pp-pop pp-col app-bulk-menu"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            close();
          }
        }}
      >
        <button
          ref={firstItem}
          type="button"
          className="pp-btn pp-btn-ghost pp-btn-sm"
          onClick={() => {
            close();
            onAll();
          }}
        >
          {t('common.selectAll')}
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-ghost pp-btn-sm"
          onClick={() => {
            close();
            onNone();
          }}
        >
          {t('common.selectNone')}
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapper} className="pp-anchor end">
      <button
        ref={trigger}
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-sm"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={name}
        disabled={disabled}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {label}
        <ChevronDown className="pp-ico" aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}
