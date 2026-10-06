import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, RotateCw, TriangleAlert } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { api } from '../api/client';
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
  return (
    <>
      <div className="pp-ph">
        <h1>{t('settings.title')}</h1>
      </div>
      <div className="pp-col pp-gap-4">
        <GeneralSection />
        {settings.isPending ? (
          <LoadingRows rows={3} />
        ) : settings.isError ? (
          <ErrorState body={t('system.errorBody')} onRetry={() => void settings.refetch()} />
        ) : (
          <>
            <PricingSection pricing={settings.data.pricing} />
            <PrintersSection printers={settings.data.printers} />
            <CompanySection company={settings.data.company} />
          </>
        )}
        <CustomersSection />
        <SpoolmanSection />
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="pp-card pp-sec" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
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

function CompanySection({ company }: { company: Settings['company'] }) {
  const id = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({
    name: company.name,
    iban: company.iban,
    address: company.address,
    email: company.email ?? '',
    phone: company.phone ?? '',
  });
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
    <Section title={t('settings.company')}>
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
        <div>
          <button type="submit" className="pp-btn pp-btn-primary" disabled={busy} aria-busy={busy}>
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('common.save')}
          </button>
        </div>
      </form>
    </Section>
  );
}

function CustomersSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const customers = useQuery({
    queryKey: keys.customers(true, false),
    queryFn: () => fetchCustomers(true, false),
  });
  const [saving, setSaving] = useState<string | null>(null);
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
    <Section title={t('settings.customers')}>
      <span className="pp-help">{t('customers.notBilledHelp')}</span>
      {customers.isPending && <LoadingRows rows={2} />}
      {customers.isSuccess && (
        <ul className="pp-plain">
          {customers.data.customers.map((customer) => (
            <li key={customer.folder} className="pp-row pp-setrow">
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
