import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Info, Trash2, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import { useCurrentUser } from '../auth/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { formatDate } from '../i18n/format';
import { t } from '../i18n/nl';
import { LoadingRows } from '../pages/ErrorState';
import { ForbiddenState, GlobalErrorState } from '../pages/StatePages';
import {
  addPayment,
  createOrder,
  deleteOrder,
  fetchSpoolmanStatus,
  financeKeys,
  setLineExcluded,
  setLineOverride,
  setOrderOverrides,
  setPrintSpool,
  setSalePrice,
  setTimesPrinted,
  undoPayment,
  undoWriteOff,
  writeOff,
} from '../finance/api';
import { CostBreakdown } from '../finance/CostBreakdown';
import { CostOverrideDialog } from '../finance/CostOverrideDialog';
import { PaymentBadge } from '../finance/money';
import { NabestellingDialog } from '../finance/NabestellingDialog';
import { OrderSection } from '../finance/OrderSection';
import { PaymentPanel } from '../finance/PaymentPanel';
import { SpoolPicker } from '../finance/SpoolPicker';
import { deletePrint, fetchPrint, keys, modelUrl, restorePrint, setPrintTags } from './api';
import { RecordBadge, TagChip, Thumbnail } from './bits';
import { AssetList, type AssetControls } from './AssetList';
import { TagEditor } from './TagEditor';
import { placeOf } from './filter';
import { Meta } from './PrintCard';
import { assetsForOrder, isSettled, newestFirst, unassignedAssets } from './orders';
import type { Order, PrintDetail } from './types';

const Viewer3D = lazy(() => import('./Viewer3D'));

/**
 * ScreenPrintDetail: breadcrumb, name, payment and record badges, tags with
 * the TagEditor and Verwijderen (Admins and Editors), the archived and
 * deleted alerts. Admins and Editors get the viewer, files in no order and
 * one OrderSection per order, newest first (design system 1.4). Users see
 * name, the summed price and status, tags and the model only.
 */
export function PrintDetailPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const canManage = user.role === 'Admin' || user.role === 'Editor';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const spoolman = useQuery({
    queryKey: financeKeys.spoolman,
    queryFn: fetchSpoolmanStatus,
    enabled: canManage,
    staleTime: 60_000,
  });
  const print = useQuery({
    queryKey: keys.detail(id),
    queryFn: () => fetchPrint(id),
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
  });

  const title = print.data?.name;
  useEffect(() => {
    if (title !== undefined) document.title = `${title} · ${t('app.name')}`;
  }, [title]);

  if (print.isPending) return <LoadingRows rows={6} />;
  if (print.isError) {
    if (print.error instanceof ApiError && print.error.status === 403) return <ForbiddenState />;
    return <GlobalErrorState onRetry={() => void print.refetch()} />;
  }
  const detail = print.data;

  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.all });
  /** Runs a change and refetches; a failure shows "Opslaan mislukt" and is rethrown for the caller. */
  const change = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      toast.error(t('error.saveFailed'));
      throw error;
    } finally {
      await refresh();
    }
  };
  const quiet = (action: () => Promise<unknown>) => change(action).catch(() => undefined);
  const spoolmanOn = canManage && spoolman.data?.configured === true;
  const controlsFor = (orderId: string | null): AssetControls | undefined =>
    canManage
      ? {
          setTimesPrinted: (line, times) =>
            quiet(() => setTimesPrinted(detail.id, line.id, times, orderId ?? undefined)),
          setExcluded: (line, excluded) =>
            quiet(() => setLineExcluded(detail.id, line.id, excluded)),
          ...(spoolmanOn
            ? {
                setSpool: (line, slot, spoolId) =>
                  quiet(() => setLineOverride(detail.id, line.id, { slot, spoolId })),
              }
            : {}),
        }
      : undefined;
  const paymentFor = (order: Order) => (
    <PaymentPanel
      order={order}
      printName={detail.name}
      markupPercent={detail.markupPercent}
      notBilled={detail.noBilling}
      cost={order.cost?.totalCost ?? null}
      role={user.role}
      actions={{
        setSalePrice: (price) => change(() => setSalePrice(order.id, price)),
        addPayment: (amount) => change(() => addPayment(order.id, amount)),
        writeOff: (reason) => change(() => writeOff(order.id, reason)),
        undoPayment: () => change(() => undoPayment(order.id)),
        undoWriteOff: () => change(() => undoWriteOff(order.id)),
      }}
    />
  );
  const adjustingOrder = detail.orders.find((order) => order.id === adjusting) ?? null;
  const removeTag = async (tagId: string) => {
    try {
      await setPrintTags(
        detail.id,
        detail.tags.filter((tag) => tag.id !== tagId).map((tag) => tag.id),
      );
      await refresh();
    } catch {
      toast.error(t('error.saveFailed'));
    }
  };
  // Users see one price and status: the sum over all orders (PrintCard rules).
  const userOrder: Order | null =
    detail.money === null
      ? null
      : {
          id: detail.id,
          number: 1,
          createdAt: '',
          date: '',
          status: detail.money.status,
          price: detail.money.price,
        };
  const restore = async () => {
    try {
      await restorePrint(detail.id);
      await refresh();
    } catch {
      toast.error(t('error.generic'));
    }
  };

  return (
    <>
      <div className="pp-col pp-gap-2">
        <span className="pp-crumb">{placeOf(detail)}</span>
        <div className="pp-ph">
          <h1>{detail.name}</h1>
          {canManage && detail.status !== 'deleted' && (
            <button
              type="button"
              className="pp-btn pp-btn-danger pp-btn-sm"
              onClick={() => {
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="pp-ico" aria-hidden="true" />
              {t('common.delete')}
            </button>
          )}
        </div>
        <div className="pp-tags">
          {detail.money !== null && <PaymentBadge status={detail.money.status} />}
          <RecordBadge print={detail} />
          {detail.tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={canManage ? () => void removeTag(tag.id) : undefined}
            />
          ))}
          {canManage && <TagEditor printId={detail.id} current={detail.tags} />}
        </div>
        <Meta print={detail} />
      </div>

      {detail.status === 'archived' && (
        <div className="pp-alert info">
          <Info className="pp-ico" aria-hidden="true" />
          <div>{t('records.archivedNote')}</div>
        </div>
      )}
      {detail.status === 'deleted' && detail.deletedAt !== null && (
        <div className="pp-alert unpaid">
          <TriangleAlert className="pp-ico" aria-hidden="true" />
          <div className="pp-row app-alert-row">
            <span>{t('records.deletedOn', { date: formatDate(detail.deletedAt) })}</span>
            {user.role === 'Admin' && (
              <button
                type="button"
                className="pp-btn pp-btn-secondary pp-btn-sm"
                onClick={() => void restore()}
              >
                {t('common.restore')}
              </button>
            )}
          </div>
        </div>
      )}

      {canManage ? (
        <ManagedOrders
          detail={detail}
          spoolmanOn={spoolmanOn}
          controlsFor={controlsFor}
          paymentFor={paymentFor}
          onAdjust={setAdjusting}
          change={change}
          quiet={quiet}
        />
      ) : (
        <div className="pp-detail">
          <div>
            <ModelView detail={detail} />
          </div>
          <div>{userOrder !== null && paymentFor(userOrder)}</div>
        </div>
      )}
      {adjustingOrder !== null && (
        <CostOverrideDialog
          open
          subject={detail.name}
          initial={
            adjustingOrder.overrides ?? { pricePerKg: null, grams: null, printSeconds: null }
          }
          priceFromSpoolman={detail.spool?.pricePerKg !== null && detail.spool !== null}
          onSave={(overrides) => change(() => setOrderOverrides(adjustingOrder.id, overrides))}
          onClose={() => {
            setAdjusting(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t('confirm.deletePrint', { name: detail.name })}
        body={t('confirm.deletePrintBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          await deletePrint(detail.id);
          await refresh();
          void navigate('/');
        }}
        onClose={() => {
          setConfirmDelete(false);
        }}
      />
    </>
  );
}

/** Viewer3D when there is a model; otherwise "Geen 3D-model beschikbaar" and the thumbnail. */
function ModelView({ detail }: { detail: PrintDetail }) {
  if (detail.hasModel) {
    return (
      <Suspense
        fallback={
          <div className="pp-viewer fluid">
            <span className="pp-spin" aria-hidden="true" />
            <span>{t('viewer.loading')}</span>
          </div>
        }
      >
        <Viewer3D url={modelUrl(detail)} name={detail.name} colour={detail.colour} />
      </Suspense>
    );
  }
  return (
    <div className="pp-col app-no-model">
      <div className="pp-viewer fluid">
        <Box className="pp-ico pp-ico-24" aria-hidden="true" />
        <span>{t('viewer.none')}</span>
      </div>
      {detail.hasThumbnail && (
        <div className="app-detail-thumb">
          <Thumbnail print={detail} />
        </div>
      )}
    </div>
  );
}

/** Admin and Editor part of the page: viewer, spool, files in no order and the orders. */
function ManagedOrders({
  detail,
  spoolmanOn,
  controlsFor,
  paymentFor,
  onAdjust,
  change,
  quiet,
}: {
  detail: PrintDetail;
  spoolmanOn: boolean;
  controlsFor: (orderId: string | null) => AssetControls | undefined;
  paymentFor: (order: Order) => ReactNode;
  onAdjust: (orderId: string) => void;
  change: (action: () => Promise<unknown>) => Promise<void>;
  quiet: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const assets = detail.assets ?? [];
  const unassigned = unassignedAssets(assets);
  const unassignedCount = unassigned.reduce((total, asset) => total + asset.lines.length, 0);
  const orders = newestFirst(detail.orders);
  const current = orders.find((order) => !isSettled(order.status))?.id ?? null;
  const createButton = (small: boolean) => (
    <button
      type="button"
      className={small ? 'pp-btn pp-btn-secondary pp-btn-sm' : 'pp-btn pp-btn-secondary'}
      onClick={() => {
        setCreating(true);
      }}
    >
      {t('orders.create')}
    </button>
  );
  return (
    <>
      <ModelView detail={detail} />
      {spoolmanOn && (
        // ds-gap: GAP-040 (placement of "Spoel voor de hele print" with orders)
        <section className="pp-card pp-sec pp-gap-2" aria-labelledby="spool-title">
          <b id="spool-title" className="pp-strong">
            {t('spool.forPrint')}
          </b>
          <SpoolPicker
            value={detail.spool}
            label={t('spool.forPrint')}
            onChange={(spoolId) => quiet(() => setPrintSpool(detail.id, spoolId))}
          />
          <span className="pp-help">{t('spool.forPrintHelp')}</span>
        </section>
      )}
      {unassignedCount > 0 && (
        <>
          <div className="pp-alert info" role="status">
            <Info className="pp-ico" aria-hidden="true" />
            <div>
              {t('orders.unassignedAlert', { count: unassignedCount })}
              <div className="pp-mt">{createButton(true)}</div>
            </div>
          </div>
          <AssetList
            assets={unassigned}
            controls={controlsFor(null)}
            label={t('orders.unassignedGroup')}
          />
        </>
      )}
      <div className="pp-orders">
        {orders.map((order) => {
          const files = assetsForOrder(assets, order);
          return (
            <OrderSection
              key={order.id}
              order={order}
              current={order.id === current}
              files={
                <>
                  {files.length > 0 && (
                    <AssetList assets={files} controls={controlsFor(order.id)} />
                  )}
                  {order.cost !== undefined && (
                    <CostBreakdown
                      cost={order.cost}
                      notBilled={detail.noBilling}
                      manual={
                        order.overrides !== undefined &&
                        (order.overrides.pricePerKg !== null ||
                          order.overrides.grams !== null ||
                          order.overrides.printSeconds !== null)
                      }
                      onAdjust={() => {
                        onAdjust(order.id);
                      }}
                    />
                  )}
                </>
              }
              payment={paymentFor(order)}
              onDelete={() => change(() => deleteOrder(order.id))}
            />
          );
        })}
      </div>
      {assets.some((asset) => asset.lines.length > 0) && (
        <div className="pp-row">{createButton(false)}</div>
      )}
      {creating && (
        <NabestellingDialog
          assets={assets}
          orders={detail.orders}
          onCreate={async (items) => {
            await change(() => createOrder(detail.id, items));
          }}
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </>
  );
}
