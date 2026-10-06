import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api/client';
import { useCurrentUser } from '../auth/context';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { ErrorState, LoadingRows } from '../pages/ErrorState';
import { useDocumentTitle } from '../pages/useDocumentTitle';
import {
  deleteCustomer,
  fetchCustomers,
  fetchPrints,
  fetchTags,
  keys,
  restoreCustomer,
  restorePrint,
} from './api';
import { EmptyState } from './bits';
import { CustomerStrip } from './CustomerStrip';
import { FilterBar } from './FilterBar';
import { isFiltered, type ViewMode } from './filter';
import { useLive } from './live-context';
import { PrintCard } from './PrintCard';
import { PrintTable } from './PrintTable';
import type { PrintFilter, PrintSummary } from './types';

/** Filters live in the URL, so back/forward and reloads keep them. */
function readFilter(params: URLSearchParams): PrintFilter {
  return {
    customer: params.get('klant'),
    tagIds: params.getAll('tag'),
    search: params.get('q') ?? '',
    archived: params.get('gearchiveerd') === '1',
    deleted: params.get('verwijderd') === '1',
  };
}

function writeFilter(filter: PrintFilter, view: ViewMode): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.customer !== null) params.set('klant', filter.customer);
  for (const tag of filter.tagIds) params.append('tag', tag);
  if (filter.search.trim() !== '') params.set('q', filter.search.trim());
  if (filter.archived) params.set('gearchiveerd', '1');
  if (filter.deleted) params.set('verwijderd', '1');
  if (view === 'list') params.set('weergave', 'lijst');
  return params;
}

/**
 * ScreenDashboard (M5 part): customer cards (chips on phones), FilterBar,
 * PrintCard grid or PrintRow list with "Meer laden", live flashes and the
 * empty states. Prices,
 * openstaand totals, Factuur and the bulk bar arrive with M6/M7.
 */
export function DashboardPage() {
  useDocumentTitle('nav.dashboard');
  const user = useCurrentUser();
  const isAdmin = user.role === 'Admin';
  const canManage = isAdmin || user.role === 'Editor';
  const toast = useToast();
  const queryClient = useQueryClient();
  const live = useLive();
  const [params, setParams] = useSearchParams();
  const filter = useMemo(() => {
    const read = readFilter(params);
    return isAdmin ? read : { ...read, deleted: false };
  }, [params, isAdmin]);
  const view: ViewMode = params.get('weergave') === 'lijst' ? 'list' : 'cards';

  const setFilter = (next: PrintFilter) => {
    setParams(writeFilter(next, view), { replace: true });
  };
  const setView = (next: ViewMode) => {
    setParams(writeFilter(filter, next), { replace: true });
  };

  const prints = useInfiniteQuery({
    queryKey: keys.list(filter),
    queryFn: ({ pageParam }) => fetchPrints(filter, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });
  const customers = useQuery({
    queryKey: keys.customers(filter.archived, filter.deleted),
    queryFn: () => fetchCustomers(filter.archived, filter.deleted),
  });
  const tags = useQuery({ queryKey: keys.tags, queryFn: fetchTags });
  const health = useQuery({
    queryKey: ['healthz'],
    queryFn: () => api<{ checks: { printsRoot: { status: string } } }>('/healthz'),
    enabled: prints.data?.pages[0]?.total === 0,
  });

  const items: PrintSummary[] = prints.data?.pages.flatMap((page) => page.items) ?? [];
  const total = prints.data?.pages[0]?.total ?? null;
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.all });

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
        await queryClient.invalidateQueries({ queryKey: keys.all });
      } catch {
        toast.error(t('error.generic'));
      }
    },
    [queryClient, toast],
  );
  const restore = isAdmin
    ? (print: PrintSummary) => void run(() => restorePrint(print.id))
    : undefined;

  const reindex = isAdmin
    ? () => void run(() => api('/api/admin/reindex', { method: 'POST' }))
    : undefined;

  let body;
  if (prints.isPending) {
    body = <LoadingRows rows={4} />;
  } else if (prints.isError) {
    body = <ErrorState body={t('system.errorBody')} onRetry={() => void prints.refetch()} />;
  } else if (items.length === 0) {
    body = isFiltered(filter) ? (
      <EmptyState
        kind="noResults"
        action={
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            onClick={() => {
              setFilter({
                customer: null,
                tagIds: [],
                search: '',
                archived: false,
                deleted: false,
              });
            }}
          >
            {t('common.clearFilters')}
          </button>
        }
      />
    ) : health.data?.checks.printsRoot.status === 'down' ? (
      <EmptyState
        kind="unreachable"
        action={
          <button type="button" className="pp-btn pp-btn-primary" onClick={() => void refresh()}>
            <RotateCw className="pp-ico" aria-hidden="true" />
            {t('common.retry')}
          </button>
        }
      />
    ) : (
      <EmptyState
        kind="noPrints"
        action={
          reindex === undefined ? undefined : (
            <button type="button" className="pp-btn pp-btn-secondary" onClick={reindex}>
              {t('empty.reindex')}
            </button>
          )
        }
      />
    );
  } else {
    const cards = (
      <ul className="pp-grid app-plain-list">
        {items.map((print) => (
          <li key={print.id}>
            <PrintCard
              print={print}
              flashing={live.flashing.has(print.id)}
              onFlashEnd={() => {
                live.doneFlashing(print.id);
              }}
              restore={
                print.status === 'deleted' && restore !== undefined
                  ? () => {
                      restore(print);
                    }
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    );
    body =
      view === 'cards' ? (
        cards
      ) : (
        <>
          <div className="pp-only-wide">
            <PrintTable
              prints={items}
              flashing={live.flashing}
              onFlashEnd={live.doneFlashing}
              restore={restore}
            />
          </div>
          <div className="pp-only-phone">{cards}</div>
        </>
      );
  }

  return (
    <>
      <div className="pp-ph">
        <h1>{t('nav.dashboard')}</h1>
      </div>
      {customers.data !== undefined && customers.data.customers.length > 0 && (
        <CustomerStrip
          customers={customers.data.customers}
          selected={filter.customer}
          onSelect={(customer) => {
            setFilter({ ...filter, customer });
          }}
          total={total}
          onDelete={
            canManage
              ? async (folder) => {
                  await deleteCustomer(folder);
                  if (filter.customer === folder) setFilter({ ...filter, customer: null });
                  await refresh();
                }
              : undefined
          }
          onRestore={isAdmin ? (folder) => void run(() => restoreCustomer(folder)) : undefined}
        />
      )}
      <FilterBar
        filter={filter}
        onChange={setFilter}
        customers={customers.data?.customers ?? []}
        tags={tags.data?.tags ?? []}
        view={view}
        onView={setView}
        showDeletedOption={isAdmin}
        shown={items.length}
        total={total}
      />
      {body}
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
              onClick={() => void loadMore(prints.fetchNextPage, items.length)}
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

/** LoadMore: after loading, focus moves to the first new item. */
async function loadMore(fetchNext: () => Promise<unknown>, before: number) {
  await fetchNext();
  const links = document.querySelectorAll<HTMLElement>(
    '.pp-main .app-card-link, .pp-main .app-row-link',
  );
  const visible = [...links].filter((link) => link.offsetParent !== null);
  visible[before]?.focus();
}
