import {
  Box,
  Download,
  File,
  FileCode,
  FileText,
  Film,
  Info,
  Layers,
  Link as LinkIcon,
  PenTool,
  Play,
  TriangleAlert,
} from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { SpoolPicker } from '../finance/SpoolPicker';
import { formatDuration, formatFileSize, formatGrams } from '../i18n/format';
import { t } from '../i18n/nl';
import { downloadUrl } from './api';
import { VideoPlayer } from './VideoPlayer';
import { ColourDot, StatusBadge } from './bits';
import type { Asset, AssetType, Line, Spool } from './types';

/** What Admins and Editors can change per file, plate or slot (M6). */
export interface AssetControls {
  setTimesPrinted: (line: Line, times: number) => Promise<void>;
  setExcluded: (line: Line, excluded: boolean) => Promise<void>;
  /** Slot 0: the whole file or plate. Absent when Spoolman is not configured. */
  setSpool?: (line: Line, slot: number, spoolId: number | null) => Promise<void>;
  /** The order is on a final invoice: the controls are read-only (AssetListItem 1.6). */
  locked?: boolean;
  /** Invoice number for the "Op factuur {nummer}" badge above the list. */
  invoiceNumber?: string;
  /**
   * The whole-print spool. A slot without its own is costed with this one, and
   * until 2.3 nothing on the row said so: the trigger read "Kies een spoel"
   * while that spool was being used (GAP-115). The trigger draws its swatch, so
   * this is the whole spool and not just its name.
   */
  printSpool?: Spool | null;
}

const ICONS: Record<AssetType, typeof File> = {
  gcode: FileCode,
  '3mf': Layers,
  stl: Box,
  video: Film,
  f3d: PenTool,
  pdf: FileText,
  url: LinkIcon,
  other: File,
};

/**
 * AssetListItem: name, size, grams and time, "× n", duplicates, exclusion
 * reasons, plates and slots, download; with `controls` also "Aantal keer
 * geprint", "Telt niet mee in kosten" and the spool pickers.
 */
export function AssetList({
  assets,
  controls,
  title,
  ordLabels,
}: {
  assets: readonly Asset[];
  controls?: AssetControls;
  /** Card title; default "Bestanden" ("Nog niet in een bestelling" for files in no order). */
  title?: string;
  /** Which order counts each asset, in the print's own file list (GAP-097). */
  ordLabels?: ReadonlyMap<string, string>;
}) {
  const titleId = useId();
  const lockedId = useId();
  /*
    File names that more than one asset of this print carries. Both rows of a
    pair are marked, because neither is "the other one" (2.7, GAP-120).
  */
  const shareAName = new Set(
    assets.map((asset) => asset.fileName).filter((name, index, all) => all.indexOf(name) !== index),
  );
  const rowControls = controls?.locked === true ? { ...controls, lockedHelp: lockedId } : controls;
  return (
    <section className="pp-card pp-assetlist pp-flush" aria-labelledby={titleId}>
      <div className="pp-card-hd rule">
        <h2 id={titleId} className="app-card-heading">
          <b>{title ?? t('print.files')}</b>
        </h2>
        <span className="sub">{t('print.fileCount', { count: assets.length })}</span>
      </div>
      {controls?.locked === true && (
        <div className="pp-lockhelp">
          <span className="pp-badge info">
            <FileText className="pp-ico" aria-hidden="true" />
            {t('status.onInvoice', { number: controls.invoiceNumber ?? '' })}
          </span>
          <span id={lockedId} className="pp-help">
            {t('pay.lockedHelp')}
          </span>
        </div>
      )}
      <ul className="app-plain-list">
        {assets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            controls={rowControls}
            ord={ordLabels?.get(asset.id)}
            sameName={shareAName.has(asset.fileName)}
          />
        ))}
      </ul>
    </section>
  );
}

/** Controls as rows get them: `lockedHelp` is the id of the locked reason. */
type RowControls = AssetControls & { lockedHelp?: string };

function AssetRow({
  asset,
  controls,
  ord,
  sameName = false,
}: {
  asset: Asset;
  controls?: RowControls;
  ord?: string;
  /** Another file of this print carries the same name (2.7, GAP-120). */
  sameName?: boolean;
}) {
  const Icon = ICONS[asset.type];
  const [playing, setPlaying] = useState<Asset | null>(null);
  // A sliced 3MF: the parent row has only the download; plates are child rows.
  const plates = asset.type === '3mf' ? asset.lines : [];
  const own = asset.type === '3mf' ? undefined : asset.lines[0];
  const excluded = own?.excluded === true;
  /*
    `.acts` has two forms and the row says which, because CSS cannot see what
    a band holds (AssetListItem 2.13, GAP-111). Icon buttons only — the
    print's own "Bestanden" card — keep the row's third column. Value
    controls (the count, the exclude toggle, a spool trigger) take
    `.pp-asset.band`: a line of their own under the name block, so the name
    gets the row's full width instead of its 240px floor while the band
    reserves a single-line width it then wraps out of anyway.
  */
  const band = own !== undefined && controls !== undefined;
  return (
    <li>
      <div
        className={[
          'pp-asset',
          band ? 'band' : '',
          excluded ? 'is-excluded' : '',
          controls?.locked === true ? 'is-locked' : '',
        ]
          .filter((name) => name !== '')
          .join(' ')}
      >
        {/*
          `.lead` is a box one line tall with its content centred in it, so a
          20px type icon sits on the first line of a name block of any height
          (2.13). Before it had no class at all, and `align-items: center`
          floated the glyph 44px below the name it belongs to.
        */}
        <span className="lead">
          <Icon className="pp-ico pp-ico-20" aria-hidden="true" />
        </span>
        <div className="body">
          <FileName name={asset.fileName} path={asset.subPath} />
          <div className="pp-meta">
            <span className="pp-mono">{formatFileSize(asset.sizeBytes)}</span>
            {own !== undefined && <LineMeta line={own} />}
            {plates.length > 0 && <span>{t('asset.plates', { count: plates.length })}</span>}
            {own?.possibleDuplicate === true && <StatusBadge kind="duplicate" />}
            {own !== undefined && !own.inOrder && <NotInOrderBadge />}
            {ord !== undefined && <span className="ord">{ord}</span>}
          </div>
          {own !== undefined && !own.inOrder && (
            <span className="pp-help">{t('orders.notInOrderHint')}</span>
          )}
          {own?.duplicateOf != null && (
            <div className="pp-reason app-reason-warning">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              {t('asset.duplicateHint', { fileName: own.duplicateOf })}
            </div>
          )}
          {/*
            Two real files of this print that share a name (2.7, GAP-120).
            Deliberately not the duplicate badge: that one advises deleting one
            and counting the other twice, which here would drop a file off the
            invoice. Plain ink, no warning — nothing needs attention, the
            operator just needs to know which of the two this row is.
          */}
          {sameName && (
            <div className="pp-reason">
              {asset.subPath === ''
                ? t('asset.sameNameNoFolder')
                : t('asset.sameName', { map: asset.subPath })}
            </div>
          )}
          {own !== undefined && <ExclusionReason line={own} />}
        </div>
        <div className="acts">
          {band && <LineControls line={own} controls={controls} />}
          {/*
            In a band the trailing icon buttons are pinned to the row's right
            edge by `.end`, so they end at one x in every row (2.13). With the
            count and the toggle carrying fixed words at the front, the spool
            trigger is the only control whose width is data and it is the last
            one that starts at a fixed x — which is what makes rows line up
            without fixing any width or truncating a spool name. A row with
            icon buttons only has nothing to line up and keeps them as the
            direct children the preview draws.
          */}
          <Trailing wrap={band}>
            {asset.type === 'video' && (
              <button
                type="button"
                className="pp-btn pp-btn-ghost pp-btn-icon"
                aria-label={t('video.play', { bestandsnaam: asset.fileName })}
                onClick={() => {
                  setPlaying(asset);
                }}
              >
                <Play className="pp-ico" aria-hidden="true" />
              </button>
            )}
            <a
              className="pp-btn pp-btn-ghost pp-btn-icon"
              href={downloadUrl(asset.id)}
              download
              aria-label={`${t('common.download')}: ${asset.fileName}`}
            >
              <Download className="pp-ico" aria-hidden="true" />
            </a>
          </Trailing>
        </div>
      </div>
      {playing !== null && (
        <VideoPlayer
          assetId={playing.id}
          fileName={playing.fileName}
          onClose={() => {
            setPlaying(null);
          }}
        />
      )}
      {own !== undefined && own.slots.length > 1 && <Slots line={own} controls={controls} />}
      {plates.length > 0 && (
        <ul className="app-plain-list">
          {plates.map((plate) => (
            <li key={plate.id}>
              <div
                className={[
                  'pp-asset child',
                  controls === undefined ? '' : 'band',
                  plate.excluded ? 'is-excluded' : '',
                  controls?.locked === true ? 'is-locked' : '',
                ]
                  .filter((name) => name !== '')
                  .join(' ')}
              >
                <span className="lead">
                  <Layers className="pp-ico pp-ico-20" aria-hidden="true" />
                </span>
                <div className="body">
                  <div className="fn">
                    <span className="a">{t('asset.plate', { n: plate.plateIndex })}</span>
                  </div>
                  <div className="pp-meta">
                    <LineMeta line={plate} />
                    {!plate.inOrder && <NotInOrderBadge />}
                  </div>
                  {!plate.inOrder && <span className="pp-help">{t('orders.notInOrderHint')}</span>}
                  <ExclusionReason line={plate} />
                </div>
                {controls !== undefined && (
                  <div className="acts">
                    <LineControls line={plate} controls={controls} />
                  </div>
                )}
              </div>
              {plate.slots.length > 1 && <Slots line={plate} controls={controls} />}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** `<span class="end">` in a band, nothing at all in a row of icon buttons. */
function Trailing({ wrap, children }: { wrap: boolean; children: ReactNode }) {
  return wrap ? <span className="end">{children}</span> : <>{children}</>;
}

function NotInOrderBadge() {
  return <span className="pp-badge warning">{t('orders.notInOrder')}</span>;
}

/** File name truncated in the middle: the end (with the extension) always stays visible. */
function FileName({ name, path }: { name: string; path: string }) {
  const tail = Math.min(name.length, 14);
  const full = path === '' ? name : `${path}/${name}`;
  return (
    <div className="fn" title={full}>
      <span className="a">{name.slice(0, name.length - tail)}</span>
      <span className="b">{name.slice(name.length - tail)}</span>
    </div>
  );
}

function LineMeta({ line }: { line: Line }) {
  const parts = [
    line.grams === null ? null : formatGrams(line.grams),
    line.printSeconds === null ? null : formatDuration(line.printSeconds),
  ].filter((part): part is string => part !== null);
  return (
    <>
      <span className="pp-num">
        {parts.length === 0 ? t('print.noWeightOrTime') : parts.join(' · ')}
      </span>
      {line.timesPrinted > 1 && (
        <b className="pp-strong">{t('asset.timesPrintedShort', { count: line.timesPrinted })}</b>
      )}
    </>
  );
}

function ExclusionReason({ line }: { line: Line }) {
  const reason = line.autoExclusionReason;
  if (!line.excluded || reason === null) return null;
  const text =
    reason === 'gcode-present'
      ? t('asset.excludedReason.duplicate')
      : t('asset.excludedReason.folder', { folder: reason.replace(/^folder:/, '') });
  return (
    <div className="pp-reason">
      <Info className="pp-ico" aria-hidden="true" />
      {text}
    </div>
  );
}

/**
 * Multi-colour: one indented row per used slot. Without an assigned spool
 * the slicer colour shows with the hint chip "slicer".
 */
function Slots({ line, controls }: { line: Line; controls?: RowControls }) {
  const setSpool = controls?.setSpool;
  return (
    <ul className="app-plain-list">
      {line.slots.map((slot) => (
        <li key={slot.slot} className="pp-slot">
          <b className="pp-strong">{t('asset.slot', { n: slot.slot })}</b>
          <span className="pp-num">{formatGrams(slot.grams)}</span>
          {slot.spool === null && (
            <span className="sw">
              {slot.colour === null ? (
                <ColourDot colour={null} />
              ) : (
                <>
                  <ColourDot colour={slot.colour} slicer />
                  <span className="pp-hintchip">{t('asset.slicerHint')}</span>
                </>
              )}
              {slot.material}
            </span>
          )}
          {setSpool !== undefined && (
            <SpoolPicker
              value={slot.spool}
              inherited={controls?.printSpool ?? null}
              label={t('asset.slot', { n: slot.slot })}
              disabled={controls?.locked === true}
              describedBy={controls?.lockedHelp}
              onChange={(spoolId) => setSpool(line, slot.slot, spoolId)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * The band, in the order that makes rows agree: the count, the exclude
 * toggle, then the spool trigger (AssetListItem 2.13, GAP-111). The first two
 * carry fixed words and start at one x in every row; the trigger grows with
 * the spool's name but still *starts* at one x. Before this the trigger sat
 * in the middle of a right-aligned flex, so "Aantal keer geprint" landed
 * somewhere different in every row as soon as two spool names differed.
 */
function LineControls({ line, controls }: { line: Line; controls: RowControls }) {
  const setSpool = controls.setSpool;
  const locked = controls.locked === true;
  return (
    <>
      {line.inOrder &&
        (locked ? (
          <span className="pp-qty-text" aria-describedby={controls.lockedHelp}>
            <span className="pp-muted pp-text-sm">{t('asset.timesPrinted')}</span>{' '}
            <b>{t('asset.timesPrintedShort', { count: line.timesPrinted })}</b>
          </span>
        ) : (
          <TimesPrinted line={line} onSave={controls.setTimesPrinted} />
        ))}
      <label className="pp-opt sm">
        <input
          type="checkbox"
          role="switch"
          className="pp-switch"
          disabled={locked}
          aria-describedby={controls.lockedHelp}
          checked={line.excluded}
          onChange={(event) => void controls.setExcluded(line, event.target.checked)}
        />
        {t('asset.excluded')}
      </label>
      {setSpool !== undefined && line.slots.length <= 1 && (
        <SpoolPicker
          value={line.spool ?? line.slots[0]?.spool ?? null}
          inherited={controls.printSpool ?? null}
          label={t('asset.pickSpool')}
          disabled={locked}
          describedBy={controls.lockedHelp}
          onChange={(spoolId) => setSpool(line, 0, spoolId)}
        />
      )}
    </>
  );
}

/** Compact NumberInput: saves on Enter or when focus leaves; min 1, whole numbers. */
function TimesPrinted({
  line,
  onSave,
}: {
  line: Line;
  onSave: (line: Line, times: number) => Promise<void>;
}) {
  const [text, setText] = useState(String(line.timesPrinted));
  // Follow the server value when it changes (a save here or elsewhere).
  const [shown, setShown] = useState(line.timesPrinted);
  if (shown !== line.timesPrinted) {
    setShown(line.timesPrinted);
    setText(String(line.timesPrinted));
  }
  const commit = () => {
    const value = Number(text);
    if (!Number.isInteger(value) || value < 1 || value > 1000) {
      setText(String(line.timesPrinted));
      return;
    }
    if (value !== line.timesPrinted) void onSave(line, value);
  };
  return (
    <label className="pp-qty">
      {t('asset.timesPrinted')}
      <input
        className="pp-input"
        inputMode="numeric"
        value={text}
        aria-label={t('asset.timesPrinted')}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
      />
    </label>
  );
}
