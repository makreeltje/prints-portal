import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Film, Info, Package, Trash2, TriangleAlert } from 'lucide-react';
import {
  Fragment,
  type CSSProperties,
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import { useCurrentUser } from '../auth/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { formatDate, formatDuration, formatGrams } from '../i18n/format';
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
  setPrintSpool,
  setOrderOverrides,
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
import {
  deletePrint,
  downloadUrl,
  fetchPrint,
  keys,
  modelUrl,
  restorePrint,
  setPrintTags,
  modelThumbnailUrl,
} from './api';
import { LacksChip, RecordBadge, TagChip, Thumbnail } from './bits';
import { AssetList, type AssetControls } from './AssetList';
import { OverflowMenu } from '../components/OverflowMenu';
import { TagEditor } from './TagEditor';
import { placeOf } from './filter';
import { assetsForOrder, isSettled, newestFirst, orderLabels, unassignedAssets } from './orders';
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
  const controlsFor = (
    orderId: string | null,
    invoice: { number: string } | null = null,
  ): AssetControls | undefined =>
    canManage
      ? {
          locked: invoice !== null,
          ...(invoice === null ? {} : { invoiceNumber: invoice.number }),
          // So a row can say that it is being costed with the print's spool.
          printSpool: detail.spool,
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
          {/* Rare and hard to undo, so it sits in the menu (OverflowMenu 1.9). */}
          {canManage && detail.status !== 'deleted' && (
            <OverflowMenu
              items={[
                {
                  key: 'delete',
                  label: t('common.delete'),
                  icon: <Trash2 className="pp-ico" aria-hidden="true" />,
                  danger: true,
                  run: () => {
                    setConfirmDelete(true);
                  },
                },
              ]}
            />
          )}
        </div>
        <div className="pp-tags">
          {detail.money !== null && <PaymentBadge status={detail.money.status} />}
          <RecordBadge print={detail} />
          {/* The same chip the card carries, in the header badge row (GAP-090). */}
          <LacksChip lacks={detail.lacks} withText />
          {detail.tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={canManage ? () => void removeTag(tag.id) : undefined}
            />
          ))}
          {canManage && <TagEditor printId={detail.id} current={detail.tags} />}
        </div>
      </div>

      {detail.status === 'archived' && (
        <div className="pp-alert info">
          <Info className="pp-ico" aria-hidden="true" />
          <div>{t('records.archivedNote')}</div>
        </div>
      )}
      {canManage &&
        newestFirst(detail.orders).map((order) =>
          order.invoice == null ? null : (
            <div key={order.id} className="pp-alert info" role="status">
              <Info className="pp-ico" aria-hidden="true" />
              <div>{t('order.lockedNote', { nummer: order.invoice.number })}</div>
            </div>
          ),
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
          quiet={quiet}
          toast={toast}
          controlsFor={controlsFor}
          paymentFor={paymentFor}
          onAdjust={setAdjusting}
          change={change}
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

const LACKS_KEY = { gcode: 'gcode', '3mf': 'threemf', stl: 'stl' } as const;

/**
 * "Deze print" (GAP-095): the facts that belong to the print rather than to an
 * order, in the space the capped viewer leaves beside it. Nothing here repeats
 * PaymentPanel — no price, no payment, no status — because those belong to an
 * order, and that duplication is what made the 1.9 page read wrong.
 */
function ThisPrint({
  detail,
  spoolmanOn,
  quiet,
  toast,
  canManage,
}: {
  detail: PrintDetail;
  spoolmanOn: boolean;
  quiet: (action: () => Promise<unknown>) => Promise<void>;
  toast: ReturnType<typeof useToast>;
  canManage: boolean;
}) {
  const titleId = useId();
  // Every slot that has no spool of its own is costed with the print's.
  const slotsOnPrintSpool = (detail.assets ?? []).reduce(
    (total, asset) =>
      total +
      asset.lines.reduce(
        (lineTotal, line) =>
          lineTotal +
          (line.slots.length === 0
            ? (line.spool ?? null) === null
              ? 1
              : 0
            : line.slots.filter((slot) => slot.spool === null).length),
        0,
      ),
    0,
  );
  const facts: [string, ReactNode][] = [[t('filters.customer'), detail.customerFolder]];
  if (detail.projectFolder !== null && detail.projectFolder !== '') {
    facts.push([t('print.project'), detail.projectFolder]);
  }
  if (detail.printDate !== null) facts.push([t('print.date'), formatDate(detail.printDate)]);
  if (canManage) {
    if (detail.material !== null) facts.push([t('print.material'), detail.material]);
    if (detail.printSeconds !== null) {
      facts.push([t('print.time'), formatDuration(detail.printSeconds)]);
    }
    if (detail.grams !== null) facts.push([t('print.weight'), formatGrams(detail.grams)]);
    if (detail.orders.length > 0) {
      facts.push([t('print.orders'), String(detail.orders.length)]);
    }
  }
  return (
    <section className="pp-card pp-sec pp-gap-3" aria-labelledby={titleId}>
      <b id={titleId} className="pp-strong">
        {t('print.this')}
      </b>
      <dl className="pp-kv tight">
        {facts.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="pp-muted">{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
      {canManage && spoolmanOn && (
        <div className="pp-col pp-gap-1">
          <SpoolPicker
            value={detail.spool}
            label={t('spool.forPrint')}
            onChange={(spoolId) =>
              quiet(async () => {
                const result = await setPrintSpool(detail.id, spoolId);
                // A locked order keeps its spools; say so instead of failing silently.
                if (result.skipped > 0) {
                  toast.success(
                    t('spool.wholePrintSkipped', { n: result.changed, m: result.skipped }),
                  );
                }
              })
            }
          />
          <span className="pp-help">{t('spool.forPrintHelp')}</span>
          {/*
            What this choice is doing right now (2.3, GAP-115). The count is
            the app's: every slot of every file that has no spool of its own is
            costed with this one.
          */}
          <span className="pp-help">
            {slotsOnPrintSpool === 0
              ? t('spool.wholePrint.appliesNone')
              : t('spool.wholePrint.applies', { n: slotsOnPrintSpool })}
          </span>
        </div>
      )}
      {detail.lacks.length > 0 && (
        <span className="pp-help">
          {t('print.lacks.aria', {
            types: detail.lacks
              .map((type) => t('print.lacks.item', { type: t(`print.lacks.${LACKS_KEY[type]}`) }))
              .join(', '),
          })}
        </span>
      )}
    </section>
  );
}

/**
 * The media strip: every model and every timelapse of a print, in one row
 * (GAP-094, GAP-096).
 *
 * It scrolls sideways at any count and never becomes a Select — the owner's
 * choice over 2.0.1's wrap, measured against their library: median 4 pictures,
 * 64 of 83 prints at eight or fewer, the largest 34. 2.3 confirmed it and gave
 * the strip its compact form, because with one image per print a square would
 * be a glyph beside 68px of truncated name.
 *
 * The buttons carry a type glyph and the file name rather than a render, and no
 * duration: the indexer reads none, and reading one in the browser would fetch
 * every video to draw a strip.
 */
function MediaStrip({
  items,
  index,
  colour,
  printId,
  onChoose,
}: {
  items: Picture[];
  index: number;
  colour: string | null;
  printId: string;
  onChoose: (id: string) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const current = items[index];
  /*
    One form for all of a strip's buttons (ModelPicker): squares the moment any
    model can show a picture of itself, compact when none can. A mixed row of
    76px squares and 36px rows is the one thing the spec forbids.
  */
  const squares = items.some((item) => item.kind === 'model' && item.hasPicture);

  // The fading edge is only honest when the row really continues.
  useEffect(() => {
    const element = strip.current;
    if (element === null) return;
    const measure = () => {
      setOverflows(element.scrollWidth > element.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [items.length]);

  const caption =
    current?.kind === 'video'
      ? t('models.videoCaption', { bestandsnaam: current.fileName })
      : t('models.caption', {
          n: index + 1,
          totaal: items.length,
          bestandsnaam: current?.fileName ?? '',
        });

  return (
    <div className="pp-col pp-gap-1">
      <span className="pp-muted pp-text-sm">{caption}</span>
      <div
        ref={strip}
        className={[squares ? 'pp-models' : 'pp-models compact', overflows ? 'is-overflow' : '']
          .filter((name) => name !== '')
          .join(' ')}
        role="group"
        aria-label={
          items.some((item) => item.kind === 'video') ? t('models.groupVideo') : t('models.group')
        }
      >
        {items.map((item, position) => {
          const Glyph = glyphOf(item);
          return (
            <button
              key={item.id}
              type="button"
              className={[
                'pp-modelbtn',
                item.kind === 'video' ? 'video' : '',
                position === index ? 'is-selected' : '',
              ]
                .filter((name) => name !== '')
                .join(' ')}
              aria-pressed={position === index}
              /*
                The name goes on the button, not in a hidden span inside it: a
                .pp-sr is absolutely positioned and takes the body as its
                containing block, so inside a sideways scroller it escapes the
                clip and stretches the page — it made this one 366px too wide.
              */
              aria-label={
                item.kind === 'video'
                  ? t('models.videoName', { bestandsnaam: item.fileName })
                  : t('models.modelName', { bestandsnaam: item.fileName })
              }
              onClick={() => {
                onChoose(item.id);
              }}
            >
              {squares ? (
                <span
                  className={
                    item.kind === 'video' || colour === null ? 'pp-thumb' : 'pp-thumb tinted'
                  }
                  style={
                    item.kind === 'video' || colour === null
                      ? undefined
                      : ({ '--c1': colour } as CSSProperties)
                  }
                >
                  {item.kind === 'model' && item.hasPicture ? (
                    <img
                      className="pp-art"
                      src={modelThumbnailUrl(printId, item.id)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Glyph className="pp-ico pp-ico-24" aria-hidden="true" />
                  )}
                </span>
              ) : (
                <Glyph className="pp-ico pp-ico-20" aria-hidden="true" />
              )}
              <span className="nm">
                {item.kind === 'video' && !squares ? t('models.video') : item.fileName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The type glyph, which is the whole of the picture a compact button has: the
 * thumbnail service makes one image per print, not one per model, so a square
 * would be this same glyph beside 68px of truncated name (2.3, GAP-116).
 *
 * `Film` is the preview's glyph where ModelPicker's prose says "play"; the
 * preview wins because it is the rendered truth, and because a film strip was
 * the point of the owner's complaint that a play badge did not read as video.
 */
function glyphOf(item: Picture): typeof Box {
  if (item.kind === 'video') return Film;
  return /\.3mf$/i.test(item.fileName) ? Package : Box;
}

/** One thing the strip can show: a model to turn, or a timelapse to play. */
interface Picture {
  id: string;
  fileName: string;
  kind: 'model' | 'video';
  /** Whether this file can show a picture of itself, not of its print. */
  hasPicture: boolean;
}

const UNPLAYABLE = /\.(mkv|avi|wmv|flv)$/i;

/**
 * The media row's left half: the viewer, or the inline player when a timelapse
 * is chosen (GAP-096), with the strip under it.
 */
function ModelView({ detail }: { detail: PrintDetail }) {
  // The choice is not stored (ModelPicker 1.9); the first picture opens.
  const [chosen, setChosen] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const videos: Picture[] = (detail.assets ?? [])
    .filter((asset) => asset.type === 'video')
    .map((asset) => ({
      id: asset.id,
      fileName: asset.fileName,
      kind: 'video' as const,
      hasPicture: false,
    }));
  // Ordered by file name with the timelapse last (2.3): the strip is a list of
  // names now, so it needs the order a list of names has.
  const items: Picture[] = [
    ...detail.models
      .map((model) => ({ ...model, kind: 'model' as const }))
      .sort((a, b) => a.fileName.localeCompare(b.fileName, 'nl')),
    ...videos.sort((a, b) => a.fileName.localeCompare(b.fileName, 'nl')),
  ];
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === chosen),
  );
  const current = items[index];
  const strip = items.length > 1 && (
    <MediaStrip
      items={items}
      index={index}
      colour={detail.colour}
      printId={detail.id}
      onChoose={(id) => {
        setFailed(false);
        setChosen(id);
      }}
    />
  );

  if (current?.kind === 'video') {
    const unsupported = UNPLAYABLE.test(current.fileName);
    return (
      <div className="pp-col pp-gap-2">
        <div className="pp-video">
          {unsupported ? (
            <div className="pp-alert info">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>
                <b>{t('video.unsupported.title')}</b>
                <div>{t('video.unsupported.body')}</div>
              </div>
            </div>
          ) : failed ? (
            <div className="pp-alert unpaid" role="alert">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              <div>
                <b>{t('video.error.title')}</b>
                <div>{t('video.error.body')}</div>
              </div>
            </div>
          ) : (
            /* No #t fragment: the file plays from its start. preload="metadata"
               lets the browser show a first frame where it can, and no poster is
               extracted anywhere (GAP-089). */
            <video
              key={current.id}
              controls
              preload="metadata"
              src={downloadUrl(current.id)}
              aria-label={t('models.viewerVideo', { naam: current.fileName })}
              onError={() => {
                setFailed(true);
              }}
            />
          )}
        </div>
        {strip}
      </div>
    );
  }

  if (detail.hasModel) {
    return (
      <div className="pp-col pp-gap-2">
        <Suspense
          fallback={
            <div className="pp-viewer fluid">
              <span className="pp-spin" aria-hidden="true" />
              <span>{t('models.loading')}</span>
            </div>
          }
        >
          <Viewer3D
            // Remounting on a change shows "Model laden…" while the file loads.
            key={current?.id ?? 'first'}
            url={modelUrl(detail, current?.id)}
            name={detail.name}
            colour={detail.colour}
          />
        </Suspense>
        {strip}
      </div>
    );
  }
  return (
    <div className="pp-col app-no-model">
      <div className="pp-viewer is-empty">
        <Box className="pp-ico pp-ico-24" aria-hidden="true" />
        <span>{t('viewer.none')}</span>
      </div>
      {detail.hasThumbnail && (
        <div className="app-detail-thumb">
          <Thumbnail print={detail} />
        </div>
      )}
      {strip}
    </div>
  );
}

/** Admin and Editor part of the page: viewer, spool, files in no order and the orders. */
function ManagedOrders({
  detail,
  spoolmanOn,
  quiet,
  toast,
  controlsFor,
  paymentFor,
  onAdjust,
  change,
}: {
  detail: PrintDetail;
  spoolmanOn: boolean;
  quiet: (action: () => Promise<unknown>) => Promise<void>;
  toast: ReturnType<typeof useToast>;
  controlsFor: (
    orderId: string | null,
    invoice?: { number: string } | null,
  ) => AssetControls | undefined;
  paymentFor: (order: Order) => ReactNode;
  onAdjust: (orderId: string) => void;
  change: (action: () => Promise<unknown>) => Promise<void>;
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
      {/* The media row: the viewer takes what it needs, the facts take the rest
          (GAP-095). The dead space of 1.9 was this card's missing half. */}
      <div className="pp-pdtop">
        <ModelView detail={detail} />
        <ThisPrint detail={detail} spoolmanOn={spoolmanOn} quiet={quiet} toast={toast} canManage />
      </div>
      {unassignedCount > 0 && (
        <div className="pp-alert info" role="status">
          <Info className="pp-ico" aria-hidden="true" />
          <div>
            {t('orders.unassignedAlert', { count: unassignedCount })}
            <div className="pp-mt">{createButton(true)}</div>
          </div>
        </div>
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
                    <AssetList
                      assets={files}
                      controls={controlsFor(order.id, order.invoice)}
                      title={t('order.filesInOrder')}
                    />
                  )}
                  {order.cost !== undefined && (
                    <CostBreakdown
                      cost={order.cost}
                      notBilled={detail.noBilling}
                      printerModel={detail.printerModel}
                      manual={
                        order.overrides !== undefined &&
                        (order.overrides.pricePerKg !== null ||
                          order.overrides.grams !== null ||
                          order.overrides.printSeconds !== null)
                      }
                      // An order on a final invoice has no "Aanpassen" (CostBreakdown 1.6).
                      invoiceNumber={order.invoice?.number ?? null}
                      onAdjust={
                        order.invoice != null
                          ? undefined
                          : () => {
                              onAdjust(order.id);
                            }
                      }
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
      {/*
        One inventory, at print level, each file once and saying which order
        counts it (GAP-097). It sits after the orders, not before them: on an
        ordinary print it is 31% of the page and the operator was scrolling
        past all of it to reach the price. The phone layout already said so,
        and 2.3 made it the rule: one order of blocks at every width.
      */}
      {assets.length > 0 && (
        <div className="pp-pdfiles">
          <AssetList assets={assets} ordLabels={orderLabels(assets, orders)} />
        </div>
      )}
      {assets.some((asset) => asset.lines.length > 0) && (
        <div className="pp-pdnew">{createButton(false)}</div>
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
