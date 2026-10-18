import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api/client';
import { useCurrentUser } from '../auth/context';
import { useToast } from '../components/toast-context';
import { BulkActionBar } from '../finance/BulkActionBar';
import { BulkFailures } from '../finance/BulkDialogs';
import { InvoiceExportDialog } from '../finance/InvoiceExportDialog';
import type { BulkFailure } from '../finance/bulk-results';
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
import { FirstRunState } from '../pages/FirstRunState';
import { EmptyState } from './bits';
import { CustomerStrip } from './CustomerStrip';
import { FilterBar } from './FilterBar';
import { isFiltered, type ViewMode } from './filter';
import { useLive } from './live-context';
import { PrintCard } from './PrintCard';
import { PrintTable } from './PrintTable';
import {
  EMPTY_FILTER,
  PRINT_SORTS,
  PRINT_STATUS_FILTERS,
  type PrintFilter,
  type PrintSort,
  type PrintStatusFilter,
  type PrintSummary,
} from './types';

/** Filters live in the URL, so back/forward and reloads keep them. */
function readFilter(params: URLSearchParams): PrintFilter {
  return {
    customer: params.get('klant'),
    tagIds: params.getAll('tag'),
    search: params.get('q') ?? '',
    archived: params.get('gearchiveerd') === '1',
    deleted: params.get('verwijderd') === '1',
    sort: readSort(params.get('sorteer')),
    status: readStatus(params.get('status')),
  };
}

const readSort = (value: string | null): PrintSort =>
  PRINT_SORTS.find((sort) => sort === value) ?? 'newest';

const readStatus = (value: string | null): PrintStatusFilter | null =>
  PRINT_STATUS_FILTERS.find((status) => status === value) ?? null;

function writeFilter(filter: PrintFilter, view: ViewMode): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.customer !== null) params.set('klant', filter.customer);
  for (const tag of filter.tagIds) params.append('tag', tag);
  if (filter.search.trim() !== '') params.set('q', filter.search.trim());
  if (filter.archived) params.set('gearchiveerd', '1');
  if (filter.deleted) params.set('verwijderd', '1');
  if (filter.sort !== 'newest') params.set('sorteer', filter.sort);
  if (filter.status !== null) params.set('status', filter.status);
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
  // Selection for the bulk bar (Admins and Editors); only prints still in the list count.
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [bulkFailures, setBulkFailures] = useState<BulkFailure[] | null>(null);
  const [invoiceFor, setInvoiceFor] = useState<string | null>(null);
  const selectedPrints = items.filter((print) => selectedIds.has(print.id));
  const selected = new Set(selectedPrints.map((print) => print.id));
  const toggle = (id: string, on: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
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

  // A first run: nothing indexed and nothing filtered, so there is nothing to filter.
  const firstRun =
    !prints.isPending &&
    !prints.isError &&
    items.length === 0 &&
    !isFiltered(filter) &&
    health.data?.checks.printsRoot.status !== 'down';

  let body;
  if (prints.isPending) {
    body = <LoadingRows rows={4} />;
  } else if (prints.isError) {
    body = <ErrorState body={t('system.errorBody')} onRetry={() => void prints.refetch()} />;
  } else if (items.length === 0) {
    /*
      A klant is a folder on disk, so a klant can exist with nothing in it —
      the start state of every new klant. Its tile still filters, and the
      filter lands here rather than on the library-wide "Geen resultaten"
      (CustomerCard 2.13, GAP-162).
    */
    const emptyCustomer =
      filter.customer !== null &&
      customers.data?.customers.some(
        (candidate) => candidate.folder === filter.customer && candidate.printCount === 0,
      ) === true
        ? filter.customer
        : null;
    body =
      emptyCustomer !== null ? (
        <EmptyState
          kind="customerNoPrints"
          customer={emptyCustomer}
          action={
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              onClick={() => {
                setFilter({ ...EMPTY_FILTER, sort: filter.sort });
              }}
            >
              {t('common.clearFilters')}
            </button>
          }
        />
      ) : isFiltered(filter) ? (
        <EmptyState
          kind="noResults"
          action={
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              onClick={() => {
                // Clearing keeps the chosen order: sorting is not a filter (1.9).
                setFilter({ ...EMPTY_FILTER, sort: filter.sort });
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
        // Nothing indexed and no filter: the first-run page explains the folders.
        <FirstRunState onReindex={reindex} />
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
              selected={selected.has(print.id)}
              onSelect={
                canManage
                  ? (on) => {
                      toggle(print.id, on);
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
              selection={
                canManage
                  ? {
                      selected,
                      toggle,
                      setAll: (on) => {
                        setSelectedIds(on ? new Set(items.map((print) => print.id)) : new Set());
                      },
                    }
                  : undefined
              }
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
          onInvoice={canManage ? setInvoiceFor : undefined}
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
      {!firstRun && (
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
      )}
      {bulkFailures !== null && <BulkFailures failures={bulkFailures} />}
      {invoiceFor !== null && (
        <InvoiceExportDialog
          customer={invoiceFor}
          onClose={() => {
            setInvoiceFor(null);
          }}
        />
      )}
      {body}
      {canManage && selectedPrints.length > 0 && (
        <BulkActionBar
          selected={selectedPrints}
          onClear={clearSelection}
          onFailures={setBulkFailures}
        />
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
