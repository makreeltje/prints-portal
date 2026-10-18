import { useInfiniteQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { t } from '../i18n/nl';
import { useDocumentTitle } from '../pages/useDocumentTitle';
import { fetchPrints, keys } from '../prints/api';
import { PrintCard } from '../prints/PrintCard';
import { EMPTY_FILTER, type PrintSummary } from '../prints/types';
import { printHref, useShareSession } from './session';

/**
 * The visitor's **Prints**: ScreenDashboard with the klant axis removed
 * (ScreenShareSession §5, ScreenDashboard 2.14).
 *
 * Gone: the klant strip and its overview dialog (there is one klant, and
 * switching klanten is the thing a session may not do), "Factuur", the
 * selection and the bulk bar, "Toon verwijderde", "Gearchiveerd tonen" — and
 * the FilterBar as a whole. Gone from a card: the filament tint (on a
 * customer's screen a dark filament hides the model, GAP-079), the checkbox,
 * the tags and the meta line. Kept: exactly the facts an Overzicht line
 * carries.
 *
 * Order: newest first, the same order as the Overzicht's list, so the two
 * screens never disagree about which print is the last one. The backend
 * scopes the list to this link's klant, so this page asks for no customer.
 */
export function SessionPrintsPage() {
  useDocumentTitle('session.prints.title');
  const session = useShareSession();
  const prints = useInfiniteQuery({
    queryKey: keys.list(EMPTY_FILTER),
    queryFn: ({ pageParam }) => fetchPrints(EMPTY_FILTER, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });
  const items: PrintSummary[] = prints.data?.pages.flatMap((page) => page.items) ?? [];
  const total = prints.data?.pages[0]?.total ?? null;

  return (
    <>
      <div className="pp-ph">
        <h1>{t('session.prints.title')}</h1>
      </div>
      {prints.isPending ? (
        <LoadingRows rows={4} />
      ) : prints.isError ? (
        <ErrorState body={t('system.errorBody')} onRetry={() => void prints.refetch()} />
      ) : items.length === 0 ? (
        /*
          A klant whose folder is empty — one of the twelve in this library —
          has a deel-link too. The operator's "zodra er bestanden in de map
          staan" is not reused here: a klant has never been told about folders
          and should not learn now (copy-deck 2.14).
        */
        <div className="pp-empty">
          <div className="pp-illus" aria-hidden="true">
            <FolderOpen className="pp-ico pp-ico-24" />
          </div>
          <h3>{t('session.prints.empty')}</h3>
          <p>{t('session.prints.emptyBody')}</p>
        </div>
      ) : (
        <ul className="pp-grid app-plain-list">
          {items.map((print) => (
            <li key={print.id}>
              <PrintCard
                print={print}
                flashing={false}
                onFlashEnd={() => undefined}
                to={printHref(session, print.id)}
                reduced
              />
            </li>
          ))}
        </ul>
      )}
      {total !== null && items.length > 0 && (
        <div className="pp-more">
          <span aria-live="polite">
            {prints.hasNextPage
              ? t('common.count', { shown: items.length, total })
              : t('common.allLoaded')}
          </span>
          {prints.hasNextPage && (
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              disabled={prints.isFetchingNextPage}
              aria-busy={prints.isFetchingNextPage}
              onClick={() => void prints.fetchNextPage()}
            >
              {prints.isFetchingNextPage && <span className="pp-spin" aria-hidden="true" />}
              {t('common.loadMore')}
            </button>
          )}
        </div>
      )}
    </>
  );
}
