import { useQuery } from '@tanstack/react-query';
import { Box, Check, Clock, Copy, Download, Link as LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ApiError } from '../api/client';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { PaymentBadge } from '../finance/money';
import { formatDate, formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { squashName } from '../prints/filter';
import { calendarDays } from './days';
import {
  fetchShareView,
  overviewUrl,
  shareKeys,
  shareThumbnailUrl,
  type SharePayment,
  shareLogoUrl,
  type BilledShareLine,
  type PlainShareLine,
  type ShareView,
} from './share-api';

const day = (date: string) => formatDate(`${date}T12:00:00Z`);

/**
 * ScreenSharePage (`/share/:token`): what a klant sees, without signing in.
 * One centred column with the studio name or logo, "Overzicht voor {klant}",
 * the label and expiry, "Alleen openstaand", one line per order, the totals
 * and "Download overzicht". A niet-factureren klant gets the print list only.
 * Unknown, expired and revoked links get the same friendly page.
 */
export function SharePage() {
  const { token = '' } = useParams();
  const [onlyOpen, setOnlyOpen] = useState(false);
  const view = useQuery({
    queryKey: shareKeys.view(token, onlyOpen),
    queryFn: () => fetchShareView(token, onlyOpen),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
    placeholderData: (previous) => previous,
  });
  const data = view.data;

  useEffect(() => {
    document.title =
      data === undefined ? t('share.notFound') : t('overview.for', { customer: data.customer });
  }, [data]);

  if (view.isError && view.error instanceof ApiError && view.error.status === 404) {
    return <Gone />;
  }
  if (view.isError) {
    return (
      <main className="pp-share-col">
        <div className="pp-share-body">
          <ErrorState body={t('system.errorBody')} onRetry={() => void view.refetch()} />
        </div>
      </main>
    );
  }
  if (data === undefined) {
    return (
      <main className="pp-share-col" aria-busy="true">
        <div className="pp-share-body">
          <LoadingRows rows={4} />
        </div>
      </main>
    );
  }
  // Without a single price the totals card is left out; no zeros (ScreenSharePage 1.6).
  const priced = data.billed && data.lines.some((line) => line.price !== null);
  return (
    <main className="pp-share-col">
      <Head token={token} data={data} />
      {data.billed ? (
        <div className="pp-share-body pp-pb4">
          <label className="pp-opt pp-text-md">
            <input
              type="checkbox"
              role="switch"
              className="pp-switch"
              checked={onlyOpen}
              onChange={(event) => {
                setOnlyOpen(event.target.checked);
              }}
            />
            {t('invoice.onlyOutstanding')}
          </label>
          {data.lines.length === 0 || (onlyOpen && !priced) ? (
            <p className="pp-muted pp-m0 pp-center-t pp-text-md">{t('overview.nothingOpen')}</p>
          ) : (
            <div className="pp-card pp-share-card">
              <ul className="app-plain-list" aria-busy={view.isFetching}>
                {data.lines.map((line) => (
                  <BilledLine key={line.id} token={token} line={line} />
                ))}
              </ul>
            </div>
          )}
          {priced && (
            <div className="pp-card pp-p4 pp-r-xl">
              <dl className="pp-kv tight">
                <dt>{t('invoice.total')}</dt>
                <dd className="pp-num pp-fw-regular">{formatMoney(data.totals.total)}</dd>
                <dt>{t('invoice.paid')}</dt>
                <dd className="pp-num pp-fw-regular">{formatMoney(data.totals.paid)}</dd>
                <dt>{t('invoice.outstanding')}</dt>
                <dd className="pp-num pp-fw-bold">{formatMoney(data.totals.open)}</dd>
              </dl>
            </div>
          )}
          {data.pay !== null && <PaymentCard pay={data.pay} />}
          <a
            className="pp-btn pp-btn-primary pp-share-cta"
            href={overviewUrl(token, onlyOpen)}
            download
          >
            <Download className="pp-ico" aria-hidden="true" />
            {t('overview.download')}
          </a>
          <span className="pp-help pp-center-t">{t('overview.footnote')}</span>
        </div>
      ) : (
        <div className="pp-share-body pp-pb4">
          <p className="pp-muted pp-m0 pp-center-t pp-text-md">{t('share.notBilledIntro')}</p>
          <PlainList lines={data.lines} />
        </div>
      )}
    </main>
  );
}

function Head({ token, data }: { token: string; data: ShareView }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = data.studio.hasLogo && !logoFailed;
  return (
    <header className="pp-share-head">
      {showLogo ? (
        <div className="pp-brand pp-p0 has-logo">
          <img
            className="logo pp-logo"
            src={shareLogoUrl(token)}
            alt={data.studio.name}
            onError={() => {
              setLogoFailed(true);
            }}
          />
        </div>
      ) : (
        <div className="pp-brand pp-p0">{data.studio.name}</div>
      )}
      <h1>{t('overview.for', { customer: data.customer })}</h1>
      {data.expiresAt !== null && <ExpiryNotice expiresAt={data.expiresAt} />}
    </header>
  );
}

/** "Deze link verloopt over {dagen} dagen ({datum})", or morgen / vandaag (ScreenSharePage 1.6). */
function ExpiryNotice({ expiresAt }: { expiresAt: string }) {
  const days = Math.max(0, calendarDays(new Date(), expiresAt));
  const date = formatDate(expiresAt);
  const text =
    days === 0
      ? t('share.expiresToday', { date })
      : days === 1
        ? t('share.expiresTomorrow', { date })
        : t('overview.expiryNotice', { days, date });
  return (
    <span className="pp-badge info pp-mt">
      <Clock className="pp-ico" aria-hidden="true" />
      {text}
    </span>
  );
}

/** IBAN in groups of four, as the spec shows it; copied without the spaces. */
const groupIban = (iban: string) =>
  iban
    .replace(/\s+/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();

/** The amount pastes into a banking app: no currency sign, comma decimal. */
const plainAmount = (amount: number) => amount.toFixed(2).replace('.', ',');

/**
 * "Betalen" (ScreenSharePage 1.9, GAP-078): shown only while something is open
 * and the studio has an IBAN, so the klant never sees an empty frame.
 */
function PaymentCard({ pay }: { pay: SharePayment }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (copied === null) return;
    const timer = window.setTimeout(() => {
      setCopied(null);
    }, 2000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const rows: {
    key: string;
    label: string;
    shown: string;
    copy: string;
    action: string;
    mono?: boolean;
  }[] = [
    {
      key: 'iban',
      label: t('share.pay.iban'),
      shown: groupIban(pay.iban),
      copy: pay.iban.replace(/\s+/g, ''),
      action: t('share.pay.copy.iban'),
      mono: true,
    },
    {
      key: 'name',
      label: t('share.pay.name'),
      shown: pay.name,
      copy: pay.name,
      action: t('share.pay.copy.name'),
    },
    {
      key: 'amount',
      label: t('share.pay.amount'),
      shown: formatMoney(pay.amount),
      copy: plainAmount(pay.amount),
      action: t('share.pay.copy.amount'),
    },
    {
      key: 'ref',
      label: t('share.pay.ref'),
      shown: pay.reference,
      copy: pay.reference,
      action: t('share.pay.copy.ref'),
    },
  ];

  const copy = (row: { key: string; label: string; copy: string }) => {
    void navigator.clipboard.writeText(row.copy).then(
      () => {
        setCopied(row.key);
        setSaid(t('share.pay.copied', { veld: row.label }));
      },
      () => {
        // A refused clipboard leaves the value on screen to copy by hand.
      },
    );
  };

  return (
    <section className="pp-card pp-sharepay" aria-labelledby="pp-pay-title">
      <h2 id="pp-pay-title">{t('share.pay.title')}</h2>
      {rows.map((row) => (
        <div className="pp-sharepay-row" key={row.key}>
          <div>
            <small>{row.label}</small>
            <b className={row.mono === true ? 'pp-mono' : undefined}>{row.shown}</b>
          </div>
          <button
            type="button"
            className={`pp-btn pp-btn-ghost pp-btn-icon${copied === row.key ? ' done' : ''}`}
            aria-label={row.action}
            onClick={() => {
              copy(row);
            }}
          >
            {copied === row.key ? (
              <Check className="pp-ico" aria-hidden="true" />
            ) : (
              <Copy className="pp-ico" aria-hidden="true" />
            )}
          </button>
        </div>
      ))}
      <p className="pp-muted pp-text-sm pp-m0">
        {t('share.pay.hint')}{' '}
        {pay.email !== null ? (
          <a className="pp-link" href={`mailto:${pay.email}`}>
            {pay.email}
          </a>
        ) : pay.phone !== null ? (
          <a className="pp-link" href={`tel:${pay.phone}`}>
            {pay.phone}
          </a>
        ) : null}
      </p>
      <span className="pp-sr" role="status">
        {said}
      </span>
    </section>
  );
}

/**
 * The second line: project and date, or the date alone when the project only
 * repeats the print's name (GAP-072, official in 2.0). The share page has no
 * klant to name, so the date takes that place.
 */
function lineSubtitle(line: { description: string; project: string | null; date: string }): string {
  if (line.project === null || squashName(line.project) === squashName(line.description))
    return day(line.date);
  return `${line.project} · ${day(line.date)}`;
}

/**
 * The line's thumbnail on a neutral ground: no filament tint here, because a
 * dark filament hid the model on the customer's page (GAP-079). The image is
 * decorative; the line's name carries the meaning.
 */
function LineThumbnail({ token, printId }: { token: string; printId: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="pp-share-thumb">
      {failed ? (
        <Box className="pp-ico" aria-hidden="true" />
      ) : (
        <img
          src={shareThumbnailUrl(token, printId)}
          alt=""
          loading="lazy"
          onError={() => {
            setFailed(true);
          }}
        />
      )}
    </span>
  );
}

function BilledLine({ token, line }: { token: string; line: BilledShareLine }) {
  return (
    <li className="pp-row pp-share-line">
      <div className="pp-share-lead">
        <LineThumbnail token={token} printId={line.printId} />
        <div>
          <b className="pp-strong pp-text-md">{line.description}</b>
          <div className="pp-muted pp-text-sm">{lineSubtitle(line)}</div>
        </div>
      </div>
      <div className="pp-share-amt">
        {line.price === null ? (
          <span className="pp-muted pp-text-md">{t('money.priceTbd')}</span>
        ) : (
          <>
            <span className="pp-money pp-text-md">{formatMoney(line.price)}</span>
            {line.status !== 'noPrice' && <PaymentBadge status={line.status} />}
            {line.status === 'partial' && line.remaining !== null && (
              <span className="pp-remaining">
                {t('status.remaining', { amount: formatMoney(line.remaining) })}
              </span>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** Not-billed variant: Print, Project and Datum; a table on desktop, a list on phones. */
function PlainList({ lines }: { lines: readonly PlainShareLine[] }) {
  return (
    <>
      <div className="pp-only-wide">
        <div className="pp-card pp-flush pp-r-xl">
          <table className="pp-table">
            <thead>
              <tr>
                <th scope="col">{t('overview.col.print')}</th>
                <th scope="col">{t('overview.col.project')}</th>
                <th scope="col">{t('overview.col.date')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.project ?? '—'}</td>
                  <td>{day(line.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pp-only-phone">
        <div className="pp-card pp-share-card">
          <ul className="app-plain-list">
            {lines.map((line) => (
              <li key={line.id} className="pp-row pp-share-line">
                <div>
                  <b className="pp-strong pp-text-md">{line.description}</b>
                  <div className="pp-muted pp-text-sm">
                    {line.project === null ? day(line.date) : `${line.project} · ${day(line.date)}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

/** "Deze link is verlopen of ingetrokken": the same page for every link that does not work. */
function Gone() {
  return (
    <main className="pp-center pp-gap-2 pp-center-t">
      <div className="pp-illus pp-card pp-illus-box">
        <LinkIcon className="pp-ico pp-ico-24" aria-hidden="true" />
      </div>
      <h1 className="pp-share-h404">{t('share.notFound')}</h1>
      <p className="pp-muted pp-m0 pp-maxch">{t('share.askNew')}</p>
    </main>
  );
}
