import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  ExternalLink,
  Film,
  Info,
  Package,
  StickyNote,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  Fragment,
  type CSSProperties,
  lazy,
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import { placeTip } from '../components/tipPlacement';
import { splitName, stemForRow } from './fileLabel';
import { ApiError } from '../api/client';
import { useCurrentUser } from '../auth/context';
import { useShareSession } from '../sharing/session';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { formatDate, formatDuration, formatGrams, formatMoney } from '../i18n/format';
import { isHttpUrl } from '../core/url';
import { MAX_NOTE_LENGTH } from './notes';
import { NoteBlock } from './PrintNote';
import { SourceList } from './PrintSource';
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
  setRequestState,
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
  fetchPrint,
  keys,
  modelUrl,
  restorePrint,
  setPrintTags,
  modelThumbnailUrl,
  setPrintNote,
  setPrintSource,
  videoUrl,
} from './api';
import { LacksChip, RecordBadge, TagChip, Thumbnail } from './bits';
import { AssetList, type AssetControls } from './AssetList';
import { OverflowMenu } from '../components/OverflowMenu';
import { TagEditor } from './TagEditor';
import { placeOf, squashName } from './filter';
import { assetsForOrder, isSettled, newestFirst, orderLabels, unassignedAssets } from './orders';
import type { Order, PrintDetail } from './types';

const Viewer3D = lazy(() => import('./Viewer3D'));

/**
 * ScreenPrintDetail: breadcrumb, name, payment and record badges, tags with
 * the TagEditor and Verwijderen (Admins and Editors), the archived and
 * deleted alerts. Admins and Editors get the viewer, files in no order and
 * one OrderSection per order, newest first (design system 1.4). Role User sees
 * exactly what a visitor with a deel-link sees (2.15, GAP-166): name, the
 * summed price and status, the model and the reduced card — and **no tags**.
 */
export function PrintDetailPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const canManage = user.role === 'Admin' || user.role === 'Editor';
  /*
    A visitor with a deel-link is a User without an account
    (ScreenShareSession). The role already withholds every number a klant may
    not see; what the session changes is the chrome around it — no tags, no
    "Ontbreekt", no archive badge, and the payment without its note.
  */
  const visitor = useShareSession() !== null;
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
        setRequestState: (state) => change(() => setRequestState(order.id, state)),
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
          {/*
            GAP-170, 2.15: for role User and for a visitor the payment is one
            line beside the `<h1>` and the "Betaling" card is gone. Measured at
            390×844 on a visitor's print, the whole `pp-card pp-pay` sat at
            873–971 against a fold at 844, with its badge 89px under it — while
            the status was already on screen at y=201. A card that repeats a
            visible fact and adds one number is not worth 98px below the fold.

            The badge and the amount are wrapped **together** so they stay one
            pair when `.pp-ph` wraps at 360px, and the pairing is the one the
            Overzicht's own lines have used since 1.0.
          */}
          {!canManage && detail.money !== null && (
            <span className="pp-row pp-gap-2">
              <PaymentBadge status={detail.money.status} />
              {detail.money.price !== null && (
                <span className="pp-money pp-text-xl">{formatMoney(detail.money.price)}</span>
              )}
            </span>
          )}
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
        {/*
          The badge row is the operator's now. For role User and for a visitor
          the payment moved up into `.pp-ph` (GAP-170) and the tags are gone
          (GAP-166), so the only thing left that can appear here is a signed-in
          User's archive or delete badge — and when there is none the row is not
          drawn at all, because an empty flex child still costs the column its
          `space-2` gap, and this page is measured against a 844px fold.
        */}
        {(canManage || (!visitor && detail.status !== 'indexed')) && (
          <div className="pp-tags">
            {canManage && detail.money !== null && <PaymentBadge status={detail.money.status} />}
            {/*
              "Gearchiveerd" is a word about the owner's disk, not about the
              klant's print (ScreenShareSession §5, where the same rule keeps
              the badge off a visitor's list).
            */}
            {!visitor && <RecordBadge print={detail} />}
            {/*
              The same chip the card carries, in the badge row (GAP-090) — and
              never for a User or a visitor: "Ontbreekt: 3MF" is a fact about
              the owner's folder and reads to a klant as if something is wrong
              with their print (ScreenPrintDetail 2.14, GAP-158).
            */}
            {canManage && <LacksChip lacks={detail.lacks} withText />}
            {/*
              No tags for role User either, since 2.15 (GAP-166 resolved). The
              two 2.14 files disagreed — ScreenPrintDetail said no tags,
              ScreenShareSession published the same question as a proposal
              naming 1.4 — and the strict half won on the owner's own answer to
              GAP-129: he does not use tags at all, so there is no case in this
              library where his filing word helps a klant. 1.4's "name, price,
              status, thumbnail, 3D model **and tags** only" is superseded, and
              role User's print page is now exactly a visitor's.
            */}
            {canManage &&
              detail.tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} onRemove={() => void removeTag(tag.id)} />
              ))}
            {canManage && <TagEditor printId={detail.id} current={detail.tags} />}
          </div>
        )}
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
        /*
          `pp-pdtop`, the same media row the operator gets, and nothing after
          it (ScreenPrintDetail 2.14 and ScreenShareSession's preview). Until
          2.15 this was a `pp-detail` grid whose second column held the
          "Betaling" card; GAP-170 removed that card for this role, so the row
          is the viewer and the reduced card beside it, and "Deze print" is the
          last thing on the page.
        */
        <div className="pp-pdtop">
          <ModelView detail={detail} />
          {/*
            The reduced card, drawn by 2.14 (GAP-158) and now the main screen
            of every klant who opens a deel-link: klant, project when it
            differs, datum and bron, and nothing that belongs to an order.
          */}
          <ThisPrint
            detail={detail}
            spoolmanOn={spoolmanOn}
            quiet={quiet}
            toast={toast}
            canManage={false}
          />
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
 *
 * **The reduced card (ScreenPrintDetail 2.14, GAP-158 resolved).** For role
 * User and for a visitor with a deel-link the card has an anatomy at last,
 * and it is four rows at most: Klant, Project **only when it differs from the
 * print's name** (GAP-072), Datum, and Bron when there is one — read-only,
 * no chip, no folder name. Nothing else: no Materiaal, Tijd, Gewicht or
 * Bestellingen, no spool row (a spool is a cost input and the owner's stock,
 * which changes under a print that is finished), no note, and no "Ontbreekt"
 * line. A card of two rows is still a card; padding it out with cost inputs
 * would be inventing content for a layout.
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
  /*
    The project only when it says something the name does not — **one condition
    for every role** since 2.15 (GAP-176), through GAP-072's rule and with the
    same `squashName` comparison the breadcrumb has used since 1.9. GAP-095
    specified the operator's card before GAP-072 existed, so it drew the row
    unconditionally; measured in this library that repeated the `<h1>` above it
    on **84 of 84** prints, and a fact identical to the heading is not a fact.
  */
  if (
    detail.projectFolder !== null &&
    detail.projectFolder !== '' &&
    squashName(detail.projectFolder) !== squashName(detail.name)
  ) {
    facts.push([t('print.project'), detail.projectFolder]);
  }
  if (detail.printDate !== null) facts.push([t('print.date'), formatDate(detail.printDate)]);
  /*
    "Bron" is a fact like the others and sits among them, read-only here — a
    User sees it too, because the klant sees it on the share page (PrintSource).
    Editing is the separate control below.
  */
  if (detail.sources.length > 0) {
    facts.push([t('print.source'), <SourceList key="src" sources={detail.sources} />]);
  }
  /*
    Materiaal and Gewicht for every role (GAP-174, the owner's answer: a klant
    reading more detail about what they are paying for). The invoice already
    prints Gram, so the facts were his anyway. **Tijd stays with the operator**
    — machine time is the one input a klant cannot check — and so does the
    Nabestellingen count, which is about the owner's bookkeeping.
  */
  if (detail.material !== null) facts.push([t('print.material'), detail.material]);
  if (canManage && detail.printSeconds !== null) {
    facts.push([t('print.time'), formatDuration(detail.printSeconds)]);
  }
  if (detail.grams !== null) facts.push([t('print.weight'), formatGrams(detail.grams)]);
  if (canManage && detail.orders.length > 0) {
    facts.push([t('print.orders'), String(detail.orders.length)]);
  }
  return (
    <section
      className={canManage ? 'pp-card pp-sec pp-gap-3' : 'pp-card pp-sec'}
      aria-labelledby={titleId}
    >
      {/*
        The reduced card is drawn with a real heading (ScreenPrintDetail 2.14
        and ScreenShareSession's preview, which agree); the operator's card
        keeps the `b.pp-strong` its own preview still shows.
      */}
      {canManage ? (
        <b id={titleId} className="pp-strong">
          {t('print.this')}
        </b>
      ) : (
        <h2 id={titleId}>{t('print.this')}</h2>
      )}
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
            What this choice is doing, keyed on both axes (2.7, GAP-118): the
            present tense belongs to the state, so "Geldt nu" may only appear
            while a spool is actually set. 2.3 keyed it on the slots alone, so
            it claimed two slots were covered while nothing was in force.

            Silence was the obvious fix and the design system rejected it: 83 of
            83 prints have no whole-print spool, so a line only shown when one
            is set is a line almost never seen — and this control earned its
            line by never looking as though it did anything.
          */}
          <span className="pp-help">
            {detail.spool !== null
              ? slotsOnPrintSpool === 0
                ? t('spool.wholePrint.appliesNone')
                : t('spool.wholePrint.applies', { n: slotsOnPrintSpool })
              : slotsOnPrintSpool === 0
                ? t('spool.wholePrint.wouldApplyNone')
                : t('spool.wholePrint.wouldApply', { n: slotsOnPrintSpool })}
          </span>
        </div>
      )}
      {canManage && <SourceEditor detail={detail} quiet={quiet} />}
      {/*
        The note sits at the foot of the card, under the facts and the spool
        control (PrintNote). A User never sees the block at all — the backend
        guarantees it by sending null, and 2.14 says it in the anatomy too.
      */}
      {canManage && detail.note !== null && <NoteBlock note={detail.note} />}
      {canManage && <NoteEditor detail={detail} quiet={quiet} />}
      {/* "Ontbreekt: 3MF" is about the owner's folder, so never on a klant's card. */}
      {canManage && detail.lacks.length > 0 && (
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
  /*
    No two labels in this row may read the same (2.6). The row picks one stem
    length for all of its buttons; where even the longest cannot separate two
    names it keeps the default, because a label that shuffles as you scroll is
    worse than two labels that agree.
  */
  const stem = stemForRow(items.map((item) => item.fileName));
  /*
    The bubble is a sibling of `.pp-models`, never a child: the strip's overflow
    mask makes a stacking context, and a fixed bubble inside it fades with the
    strip's edge (2.6, Floating panels rule 8).
  */
  const [tip, setTip] = useState<{ name: string; rect: DOMRect } | null>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = bubble.current;
    if (tip === null || element === null) return;
    placeTip(element, tip.rect);
  }, [tip]);
  /*
    A name that fits needs no bubble repeating it. The overflow is on `.a`, the
    head: `.nm` is the flex row around both halves and never overflows, so
    asking it is how the first build showed no bubble at all.
  */
  const show = (event: { currentTarget: HTMLButtonElement }, name: string) => {
    const head =
      event.currentTarget.querySelector('.nm .a') ?? event.currentTarget.querySelector('.nm');
    const cut = head !== null && head.scrollWidth > head.clientWidth + 1;
    setTip(cut ? { name, rect: event.currentTarget.getBoundingClientRect() } : null);
  };

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
              onPointerEnter={(event) => {
                show(event, item.fileName);
              }}
              onPointerLeave={() => {
                setTip(null);
              }}
              onFocus={(event) => {
                show(event, item.fileName);
              }}
              onBlur={() => {
                setTip(null);
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
              {item.kind === 'video' && !squares ? (
                <span className="nm">{t('models.video')}</span>
              ) : (
                <FileName name={item.fileName} stem={stem} />
              )}
            </button>
          );
        })}
      </div>
      {tip !== null && (
        <span ref={bubble} className="pp-tip at" role="tooltip" aria-hidden="true">
          {tip.name}
        </span>
      )}
    </div>
  );
}

/**
 * A file name as `.pp-fname`: `.a` holds the head and CSS cuts it with an
 * ellipsis, `.b` holds the tail and never shrinks (2.6). The app chooses only
 * where to cut.
 */
function FileName({ name, stem }: { name: string; stem: number }) {
  const { head, tail } = splitName(name, stem);
  if (tail === '') return <span className="nm">{name}</span>;
  return (
    <span className="nm pp-fname">
      <span className="a">{head}</span>
      <span className="b">{tail}</span>
    </span>
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
  /*
    From the payload's own field since GAP-175, not out of `assets`: a visitor
    has no file list, and the timelapse is the one thing from the folder they
    may see. An operator's strip is built from the same field.
  */
  const videos: Picture[] = detail.videos.map((video) => ({
    id: video.id,
    fileName: video.fileName,
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
              src={videoUrl(detail.id, current.id)}
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
        {/* The Admin-and-Editor branch; a User gets the reduced card above. */}
        <ThisPrint
          detail={detail}
          spoolmanOn={spoolmanOn}
          quiet={quiet}
          toast={toast}
          canManage={true}
        />
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

/**
 * Writing the typed bron (PrintSource, Admin and Editor).
 *
 * Only the typed entry is editable: an entry with the chip follows its `.url`
 * file and the next index pass would undo any edit. Clearing is emptying the
 * field and saving — there is no remove button, because absence is a value and
 * not a separate act (GAP-138).
 */
function SourceEditor({
  detail,
  quiet,
}: {
  detail: PrintDetail;
  quiet: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const typed = detail.sources.find((source) => source.fileName === null) ?? null;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(typed?.url ?? '');
  const [invalid, setInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const errorId = useId();
  const fieldId = useId();

  if (!editing) {
    return (
      <button
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-sm pp-self-start"
        onClick={() => {
          setValue(typed?.url ?? '');
          setInvalid(false);
          setEditing(true);
        }}
      >
        <ExternalLink className="pp-ico" aria-hidden="true" />
        {typed === null ? t('print.source.add') : t('print.source')}
      </button>
    );
  }
  const save = () => {
    const trimmed = value.trim();
    // The only validation: a bron must parse as an absolute http(s) URL.
    if (trimmed !== '' && !isHttpUrl(trimmed)) {
      setInvalid(true);
      return;
    }
    setSaving(true);
    void quiet(async () => {
      await setPrintSource(detail.id, trimmed === '' ? null : trimmed);
      setSaving(false);
      setEditing(false);
    }).finally(() => {
      setSaving(false);
    });
  };
  return (
    <div className="pp-field">
      <label className="pp-label" htmlFor={fieldId}>
        {t('print.source')}
      </label>
      <input
        id={fieldId}
        className="pp-input"
        type="url"
        inputMode="url"
        data-autofocus
        value={value}
        disabled={saving}
        placeholder={t('print.source.placeholder')}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => {
          setValue(event.target.value);
          setInvalid(false);
        }}
      />
      {invalid && (
        <span className="pp-err" id={errorId} role="alert">
          {t('print.source.invalid')}
        </span>
      )}
      <span className="pp-row pp-gap-1">
        <button
          type="button"
          className="pp-btn pp-btn-secondary pp-btn-sm"
          disabled={saving}
          onClick={() => {
            setEditing(false);
          }}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-primary pp-btn-sm"
          disabled={saving}
          onClick={save}
        >
          {saving && <span className="pp-spin" aria-hidden="true" />}
          {t('common.save')}
        </button>
      </span>
    </div>
  );
}

/**
 * Writing the note (PrintNote, Admin and Editor).
 *
 * `maxlength` stops the 281st character, so there is no "too long" error — the
 * state nobody has to be told about. The internal line is tied to the field
 * with `aria-describedby`, never only visual.
 */
function NoteEditor({
  detail,
  quiet,
}: {
  detail: PrintDetail;
  quiet: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(detail.note ?? '');
  const [saving, setSaving] = useState(false);
  const helpId = useId();
  const fieldId = useId();

  if (!editing) {
    return (
      <button
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-sm pp-self-start"
        onClick={() => {
          setValue(detail.note ?? '');
          setEditing(true);
        }}
      >
        <StickyNote className="pp-ico" aria-hidden="true" />
        {detail.note === null ? t('print.note.add') : t('print.note')}
      </button>
    );
  }
  return (
    <div className="pp-field">
      <label className="pp-label" htmlFor={fieldId}>
        {t('print.note')}
      </label>
      <textarea
        id={fieldId}
        className="pp-input"
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        data-autofocus
        value={value}
        disabled={saving}
        placeholder={t('print.note.placeholder')}
        aria-describedby={helpId}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <span className="pp-help" id={helpId}>
        {t('print.note.internal')}
      </span>
      <span className="pp-row pp-gap-1">
        <button
          type="button"
          className="pp-btn pp-btn-secondary pp-btn-sm"
          disabled={saving}
          onClick={() => {
            setEditing(false);
          }}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-primary pp-btn-sm"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void quiet(async () => {
              // Keep the operator's own line breaks; empty clears it.
              await setPrintNote(detail.id, value.trim() === '' ? null : value);
              setEditing(false);
            }).finally(() => {
              setSaving(false);
            });
          }}
        >
          {saving && <span className="pp-spin" aria-hidden="true" />}
          {t('common.save')}
        </button>
      </span>
    </div>
  );
}
