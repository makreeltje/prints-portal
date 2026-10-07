import { useQuery } from '@tanstack/react-query';
import { Clock, Download, Link as LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ApiError } from '../api/client';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { PaymentBadge } from '../finance/money';
import { formatDate, formatMoney } from '../i18n/format';
import { t } from '../i18n/nl';
import { calendarDays } from './days';
import {
  fetchShareView,
  overviewUrl,
  shareKeys,
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
                  <BilledLine key={line.id} line={line} />
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
      <span className="pp-muted">{data.label}</span>
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

function BilledLine({ line }: { line: BilledShareLine }) {
  const sub = line.project === null ? day(line.date) : `${line.project} · ${day(line.date)}`;
  return (
    <li className="pp-row pp-share-line">
      <div>
        <b className="pp-strong pp-text-md">{line.description}</b>
        <div className="pp-muted pp-text-sm">{sub}</div>
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
