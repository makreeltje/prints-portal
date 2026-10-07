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
  TriangleAlert,
} from 'lucide-react';
import { useId, useState } from 'react';
import { SpoolPicker } from '../finance/SpoolPicker';
import { formatDuration, formatFileSize, formatGrams } from '../i18n/format';
import { t } from '../i18n/nl';
import { downloadUrl } from './api';
import { ColourDot, StatusBadge } from './bits';
import type { Asset, AssetType, Line } from './types';

/** What Admins and Editors can change per file, plate or slot (M6). */
export interface AssetControls {
  setTimesPrinted: (line: Line, times: number) => Promise<void>;
  setExcluded: (line: Line, excluded: boolean) => Promise<void>;
  /** Slot 0: the whole file or plate. Absent when Spoolman is not configured. */
  setSpool?: (line: Line, slot: number, spoolId: number | null) => Promise<void>;
  /** The order is on a final invoice: the controls are read-only (GAP-048 placeholder). */
  locked?: boolean;
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
}: {
  assets: readonly Asset[];
  controls?: AssetControls;
  /** Card title; default "Bestanden" ("Nog niet in een bestelling" for files in no order). */
  title?: string;
}) {
  const titleId = useId();
  const lockedId = useId();
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
        // ds-gap: GAP-048 visible reason for the read-only controls of a locked order
        <div className="pp-p3">
          <span id={lockedId} className="pp-help">
            {t('pay.lockedHelp')}
          </span>
        </div>
      )}
      <ul className="app-plain-list">
        {assets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} controls={rowControls} />
        ))}
      </ul>
    </section>
  );
}

/** Controls as rows get them: `lockedHelp` is the id of the locked reason. */
type RowControls = AssetControls & { lockedHelp?: string };

function AssetRow({ asset, controls }: { asset: Asset; controls?: RowControls }) {
  const Icon = ICONS[asset.type];
  // A sliced 3MF: the parent row has only the download; plates are child rows.
  const plates = asset.type === '3mf' ? asset.lines : [];
  const own = asset.type === '3mf' ? undefined : asset.lines[0];
  const excluded = own?.excluded === true;
  return (
    <li>
      <div className={excluded ? 'pp-asset is-excluded' : 'pp-asset'}>
        <span className="pp-muted">
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
          {own !== undefined && <ExclusionReason line={own} />}
        </div>
        <div className="pp-row acts">
          {own !== undefined && controls !== undefined && (
            <LineControls line={own} controls={controls} />
          )}
          <a
            className="pp-btn pp-btn-ghost pp-btn-icon"
            href={downloadUrl(asset.id)}
            download
            aria-label={`${t('common.download')}: ${asset.fileName}`}
          >
            <Download className="pp-ico" aria-hidden="true" />
          </a>
        </div>
      </div>
      {own !== undefined && own.slots.length > 1 && <Slots line={own} controls={controls} />}
      {plates.length > 0 && (
        <ul className="app-plain-list">
          {plates.map((plate) => (
            <li key={plate.id}>
              <div className={plate.excluded ? 'pp-asset child is-excluded' : 'pp-asset child'}>
                <span className="pp-muted">
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
                  <div className="pp-row acts">
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
              label={t('asset.slot', { n: slot.slot })}
              disabled={controls?.locked === true} // ds-gap: GAP-048
              describedBy={controls?.lockedHelp}
              onChange={(spoolId) => setSpool(line, slot.slot, spoolId)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/** "Aantal keer geprint", the file's own spool (one slot) and "Telt niet mee in kosten". */
function LineControls({ line, controls }: { line: Line; controls: RowControls }) {
  const setSpool = controls.setSpool;
  const locked = controls.locked === true;
  return (
    <>
      {line.inOrder &&
        (locked ? (
          // ds-gap: GAP-048 a locked order shows the count as text
          <span className="pp-text-sm" aria-describedby={controls.lockedHelp}>
            {t('asset.timesPrinted')} <b className="pp-num">{line.timesPrinted}</b>
          </span>
        ) : (
          <TimesPrinted line={line} onSave={controls.setTimesPrinted} />
        ))}
      {setSpool !== undefined && line.slots.length <= 1 && (
        <SpoolPicker
          value={line.spool ?? line.slots[0]?.spool ?? null}
          label={t('asset.pickSpool')}
          disabled={locked} // ds-gap: GAP-048
          describedBy={controls.lockedHelp}
          onChange={(spoolId) => setSpool(line, 0, spoolId)}
        />
      )}
      <label className="pp-opt sm">
        <input
          type="checkbox"
          role="switch"
          className="pp-switch"
          disabled={locked} // ds-gap: GAP-048
          aria-describedby={controls.lockedHelp}
          checked={line.excluded}
          onChange={(event) => void controls.setExcluded(line, event.target.checked)}
        />
        {t('asset.excluded')}
      </label>
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
