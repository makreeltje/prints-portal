import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, RotateCw, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { joinSections, useDirtySections } from './useDirtySections';

/** What a section calls to say whether it holds unsaved edits. */
type DirtyReport = (key: string, title: string, isDirty: boolean) => void;
import { api } from '../api/client';
import { formatDate } from '../i18n/format';
import { FieldError, GenericError } from '../components/FieldError';
import { useToast } from '../components/toast-context';
import { t, type MessageKey } from '../i18n/nl';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { fetchCustomers, keys } from '../prints/api';
import { useTheme } from '../theme/useTheme';
import { THEME_ORDER } from '../theme/theme';
import { LogoField } from './LogoField';
import { PricingSection, PrintersSection } from './SettingsPricing';
import {
  fetchSettings,
  fetchSpoolmanStatus,
  financeKeys,
  refreshSpoolman,
  saveSettings,
  setNoBilling,
  setPayLink,
  type Settings,
} from './api';

const THEME_LABELS: Record<(typeof THEME_ORDER)[number], MessageKey> = {
  system: 'settings.theme.system',
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
};

/**
 * ScreenSettings (`/instellingen`, Admin): Algemeen (re-index, theme),
 * Prijzen (Standaardmarge, Stroomtarief, Materiaalprijzen), Printers,
 * Bedrijfsgegevens with the logo, Klanten (niet factureren) and the
 * Spoolman status.
 */
export function SettingsPage() {
  const settings = useQuery({ queryKey: financeKeys.settings, queryFn: fetchSettings });
  const { titles, report } = useDirtySections();
  const navigate = useNavigate();
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = titles.length > 0;
  }, [titles.length]);

  /*
   * Leaving with unsaved edits asks first (ScreenSettings 1.9). The app uses a
   * plain BrowserRouter, so there is no useBlocker; catching the link before it
   * navigates does the same job for every in-app link, and the browser's own
   * prompt covers closing the tab.
   */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement | null)?.closest('a');
      const href = link?.getAttribute('href');
      if (link === null || link === undefined || href === null || href === undefined) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (!href.startsWith('/') || href.startsWith('//')) return;
      if (href === window.location.pathname) return;
      event.preventDefault();
      setLeaveTo(href);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
    };
  }, []);
  return (
    <>
      <div className="pp-ph">
        <h1>{t('settings.title')}</h1>
      </div>
      <ConfirmDialog
        open={leaveTo !== null}
        title={t('settings.leave.title')}
        body={t('settings.leave.body', { secties: joinSections(titles) })}
        confirmLabel={t('settings.leave.go')}
        cancelLabel={t('settings.leave.stay')}
        destructive
        onConfirm={() => {
          const target = leaveTo;
          setLeaveTo(null);
          if (target !== null) void navigate(target);
          return Promise.resolve();
        }}
        onClose={() => {
          setLeaveTo(null);
        }}
      />
      {/*
        Two columns up to a 1080px measure, never three: the track is
        `max(320px, 50% - space-2)`, so a third cannot fit at any width
        (ScreenSettings 2.13, GAP-101). The other half of the fix is this
        order. A section that lists records — one card or row per thing the
        owner has — takes the whole row, because `align-items: start` makes
        the next row begin where the tallest card of this one ends, and a
        1580px Printers put 1402px of nothing beside a 194px Algemeen. The
        four fixed sections are paired by what they are: Algemeen with
        Spoolman (the system), Prijzen with Bedrijfsgegevens (the studio),
        then the two lists, longest last.
      */}
      <div className="pp-settings">
        <GeneralSection />
        <SpoolmanSection />
        {settings.isPending ? (
          <LoadingRows rows={3} />
        ) : settings.isError ? (
          <ErrorState body={t('system.errorBody')} onRetry={() => void settings.refetch()} />
        ) : (
          <>
            <PricingSection pricing={settings.data.pricing} />
            <CompanySection company={settings.data.company} report={report} />
            <PrintersSection printers={settings.data.printers} />
          </>
        )}
        <CustomersSection
          noIban={settings.data !== undefined && settings.data.company.iban.trim() === ''}
        />
      </div>
    </>
  );
}

function Section({
  title,
  children,
  dirty = false,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  /** Shows the "Niet opgeslagen" badge (ScreenSettings 1.9, GAP-083). */
  dirty?: boolean;
  /**
   * `span-2`: a section that draws one card or row per thing the owner has
   * takes the whole row, so its height does not reserve empty space beside
   * the short sections (ScreenSettings 2.13, GAP-101).
   */
  wide?: boolean;
}) {
  const id = useId();
  return (
    <section className={wide ? 'pp-card pp-sec span-2' : 'pp-card pp-sec'} aria-labelledby={id}>
      <div className="pp-row pp-items-center pp-gap-2">
        <h2 id={id}>{title}</h2>
        {dirty && (
          <span className="pp-badge info">
            <TriangleAlert className="pp-ico" aria-hidden="true" />
            {t('settings.dirty')}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function GeneralSection() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const reindex = async () => {
    setState('running');
    try {
      await api('/api/admin/reindex', { method: 'POST', body: { wait: true } });
      setState('done');
      await queryClient.invalidateQueries({ queryKey: keys.all });
    } catch {
      setState('failed');
    }
  };
  return (
    <Section title={t('settings.general')}>
      <div className="pp-row">
        <button
          type="button"
          className="pp-btn pp-btn-secondary"
          disabled={state === 'running'}
          aria-busy={state === 'running'}
          onClick={() => void reindex()}
        >
          {state === 'running' && <span className="pp-spin" aria-hidden="true" />}
          {t('settings.reindex')}
        </button>
      </div>
      <div role="status" aria-live="polite">
        {state === 'done' && (
          <div className="pp-alert paid">
            <CircleCheck className="pp-ico" aria-hidden="true" />
            <div>
              <strong>{t('settings.reindexDone')}</strong>
            </div>
          </div>
        )}
        {state === 'failed' && <GenericError />}
      </div>
      <fieldset className="pp-reset">
        <legend className="pp-flabel pp-fw-medium pp-strong pp-mb-1">{t('settings.theme')}</legend>
        <div className="pp-row pp-gap-4">
          {THEME_ORDER.map((value) => (
            <label key={value} className="pp-opt">
              <input
                type="radio"
                className="pp-radio"
                name="theme"
                checked={theme === value}
                onChange={() => {
                  setTheme(value);
                }}
              />
              {t(THEME_LABELS[value])}
            </label>
          ))}
        </div>
      </fieldset>
    </Section>
  );
}

function CompanySection({
  company,
  report,
}: {
  company: Settings['company'];
  report: DirtyReport;
}) {
  const id = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const saved = {
    name: company.name,
    iban: company.iban,
    address: company.address,
    email: company.email ?? '',
    phone: company.phone ?? '',
  };
  const [values, setValues] = useState(saved);
  const title = t('settings.company');
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useEffect(() => {
    report('company', title, dirty);
  }, [report, title, dirty]);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const field = (key: keyof typeof values, label: MessageKey, multiline = false) => (
    <div className="pp-field">
      <label htmlFor={`${id}-${key}`}>{t(label)}</label>
      {multiline ? (
        <textarea
          id={`${id}-${key}`}
          className="pp-input pp-minh-64"
          value={values[key]}
          onChange={(event) => {
            setValues({ ...values, [key]: event.target.value });
          }}
        />
      ) : (
        <input
          id={`${id}-${key}`}
          className="pp-input"
          type={key === 'email' ? 'email' : 'text'}
          value={values[key]}
          aria-invalid={(key === 'email' && emailInvalid) || undefined}
          aria-describedby={key === 'email' && emailInvalid ? `${id}-email-err` : undefined}
          onChange={(event) => {
            setValues({ ...values, [key]: event.target.value });
          }}
        />
      )}
      {key === 'email' && emailInvalid && (
        <FieldError id={`${id}-email-err`}>{t('error.invalidEmail')}</FieldError>
      )}
      {/*
        A help line, not an error: an IBAN is optional for a studio that is
        never paid by transfer. But without one the share page has no payment
        instruction at all, and nothing else would say so (GAP-103).
      */}
      {key === 'iban' && values.iban.trim() === '' && (
        <span className="pp-help pp-row pp-gap-2 pp-items-start">
          <TriangleAlert className="pp-ico pp-warnico" aria-hidden="true" />
          <span>{t('settings.company.noIban')}</span>
        </span>
      )}
    </div>
  );
  const save = async () => {
    const email = values.email.trim();
    if (email !== '' && !/^[^\s@]+@[^\s@]+$/.test(email)) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);
    setBusy(true);
    try {
      await saveSettings('company', {
        name: values.name.trim(),
        iban: values.iban.trim(),
        address: values.address.trim(),
        email: email === '' ? null : email,
        phone: values.phone.trim() === '' ? null : values.phone.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: financeKeys.settings });
    } catch {
      toast.error(t('error.saveFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title={title} dirty={dirty}>
      <span className="pp-help">{t('settings.companyHelp')}</span>
      <form
        className="pp-col pp-gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="pp-cols-2">
          {field('name', 'settings.name')}
          {field('iban', 'settings.iban')}
        </div>
        {field('address', 'settings.address', true)}
        <div className="pp-cols-2">
          {field('email', 'settings.emailOptional')}
          {field('phone', 'settings.phoneOptional')}
        </div>
        <LogoField />
        <div className="pp-row pp-gap-2">
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            disabled={busy || !dirty}
            aria-busy={busy}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('common.save')}
          </button>
          {dirty && (
            <button
              type="button"
              className="pp-btn pp-btn-ghost"
              onClick={() => {
                setValues(saved);
              }}
            >
              {t('settings.undo')}
            </button>
          )}
        </div>
      </form>
    </Section>
  );
}

function CustomersSection({ noIban }: { noIban: boolean }) {
  const fieldId = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const customers = useQuery({
    queryKey: keys.customers(true, false),
    queryFn: () => fetchCustomers(true, false),
  });
  const [saving, setSaving] = useState<string | null>(null);
  const saveLink = async (folder: string, value: string) => {
    const link = value.trim();
    setSaving(folder);
    try {
      await setPayLink(folder, link === '' ? null : link);
    } catch {
      toast.error(t('error.saveFailed'));
    } finally {
      setSaving(null);
      await queryClient.invalidateQueries({ queryKey: keys.all });
    }
  };

  const toggle = async (folder: string, noBilling: boolean) => {
    setSaving(folder);
    try {
      await setNoBilling(folder, noBilling);
    } catch {
      toast.error(t('error.saveFailed'));
    } finally {
      setSaving(null);
      await queryClient.invalidateQueries({ queryKey: keys.all });
    }
  };
  return (
    <Section title={t('settings.customers')} wide>
      <span className="pp-help">{t('customers.notBilledHelp')}</span>
      {/*
        Written once under the heading, not once per klant: a label belongs to
        its control, an explanation belongs to the section (ScreenSettings
        2.13, GAP-101). Twelve copies of one sentence are one fact and eleven
        obstacles between the owner and the next klant.
      */}
      <span className="pp-help">{t('settings.payLink.help')}</span>
      {customers.isPending && <LoadingRows rows={2} />}
      {customers.isSuccess && (
        <ul className="pp-plain">
          {customers.data.customers.map((customer) => (
            <li key={customer.folder} className="pp-setrow cust">
              <span>
                <b className="pp-strong">{customer.folder}</b>{' '}
                <span className="pp-muted pp-text-sm">
                  {t('customers.printCount', { count: customer.printCount })}
                </span>
              </span>
              <label className="pp-opt">
                <input
                  type="checkbox"
                  role="switch"
                  className="pp-switch"
                  checked={customer.noBilling}
                  disabled={saving === customer.folder}
                  onChange={(event) => void toggle(customer.folder, event.target.checked)}
                />
                {t('customers.notBilled')}
              </label>
              {/*
                An optional payment link, shown on this klant's share page
                beside the bank details (GAP-103). Never for a klant that is
                not billed: they see no amounts at all.
              */}
              {!customer.noBilling && (
                <div className="pp-field pp-w-420">
                  <label htmlFor={`${fieldId}-${customer.folder}`}>{t('settings.payLink')}</label>
                  <input
                    id={`${fieldId}-${customer.folder}`}
                    type="url"
                    className="pp-input"
                    inputMode="url"
                    placeholder="https://"
                    defaultValue={customer.payLink ?? ''}
                    disabled={saving === customer.folder}
                    onBlur={(event) => void saveLink(customer.folder, event.target.value)}
                  />
                  {/* An old link is then visibly old, without the app guessing
                      at an expiry it cannot read (GAP-103). */}
                  {/* A truthy check, not `!== null`: a role that may not see
                      the link gets no field at all, and an older payload has
                      neither. */}
                  {customer.payLink != null && customer.payLinkAddedAt != null && (
                    <span className="pp-help">
                      {t('settings.payLink.added', {
                        datum: formatDate(customer.payLinkAddedAt),
                      })}
                    </span>
                  )}
                  {/*
                    The missing-IBAN warning in Bedrijfsgegevens is not read as
                    "this klant cannot pay" when this klant has a link of its
                    own (ScreenSettings 2.0.1, keyed at last in 2.13).
                  */}
                  {noIban && customer.payLink != null && (
                    <span className="pp-help">{t('settings.payLink.noIban')}</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function SpoolmanSection() {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: financeKeys.spoolman, queryFn: fetchSpoolmanStatus });
  if (status.data?.configured === false) return null;
  const data = status.data;
  return (
    <Section title={t('settings.spoolman')}>
      {data === undefined ? (
        <span className="pp-spin" aria-hidden="true" />
      ) : data.reachable ? (
        <div className="pp-row pp-gap-3">
          <span className="pp-badge paid">
            <CircleCheck className="pp-ico" aria-hidden="true" />
            {t('settings.connected')}
          </span>
          <span className="pp-muted pp-text-sm">
            {t('settings.spoolmanMeta', {
              url: data.url ?? '',
              count: data.spoolCount ?? 0,
              time:
                data.lastSync === null
                  ? '—'
                  : new Date(data.lastSync).toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Amsterdam',
                    }),
            })}
          </span>
        </div>
      ) : (
        <div className="pp-alert warning" role="status">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div>
            <strong>{t('spool.unreachable')}</strong> {data.url}
            <div>
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-sm"
                onClick={() => {
                  void refreshSpoolman().then((next) => {
                    queryClient.setQueryData(financeKeys.spoolman, next);
                  });
                }}
              >
                <RotateCw className="pp-ico" aria-hidden="true" />
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
