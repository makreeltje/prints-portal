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
import { formatDuration, formatFileSize, formatGrams } from '../i18n/format';
import { t } from '../i18n/nl';
import { downloadUrl } from './api';
import { ColourDot, StatusBadge } from './bits';
import type { Asset, AssetType, Line } from './types';

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
 * AssetListItem, read-only for M5: name, size, grams and time, "× n",
 * duplicates, exclusion reasons, plates and slots, download. The count
 * input, the exclusion toggle and spool pickers arrive with M6.
 */
export function AssetList({ assets }: { assets: readonly Asset[] }) {
  return (
    <section className="pp-card pp-assetlist app-assetlist" aria-labelledby="files-title">
      <div className="pp-row app-assetlist-head">
        <h2 id="files-title">{t('print.files')}</h2>
        <span className="pp-muted">{t('print.fileCount', { count: assets.length })}</span>
      </div>
      <ul className="app-plain-list">
        {assets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} />
        ))}
      </ul>
    </section>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
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
        <div className="app-min0">
          <FileName name={asset.fileName} path={asset.subPath} />
          <div className="pp-meta">
            <span className="pp-mono">{formatFileSize(asset.sizeBytes)}</span>
            {own !== undefined && <LineMeta line={own} />}
            {plates.length > 0 && <span>{t('asset.plates', { count: plates.length })}</span>}
            {own?.possibleDuplicate === true && <StatusBadge kind="duplicate" />}
          </div>
          {own?.duplicateOf != null && (
            <div className="pp-reason app-reason-warning">
              <TriangleAlert className="pp-ico" aria-hidden="true" />
              {t('asset.duplicateHint', { fileName: own.duplicateOf })}
            </div>
          )}
          {own !== undefined && <ExclusionReason line={own} />}
        </div>
        <div className="pp-row acts">
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
      {own !== undefined && own.slots.length > 1 && <Slots line={own} />}
      {plates.length > 0 && (
        <ul className="app-plain-list">
          {plates.map((plate) => (
            <li key={plate.id}>
              <div className={plate.excluded ? 'pp-asset child is-excluded' : 'pp-asset child'}>
                <span className="pp-muted">
                  <Layers className="pp-ico pp-ico-20" aria-hidden="true" />
                </span>
                <div className="app-min0">
                  <div className="fn">
                    <span className="a">{t('asset.plate', { n: plate.plateIndex })}</span>
                  </div>
                  <div className="pp-meta">
                    <LineMeta line={plate} />
                  </div>
                  <ExclusionReason line={plate} />
                </div>
              </div>
              {plate.slots.length > 1 && <Slots line={plate} />}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
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
        <b className="app-times">{t('asset.timesPrintedShort', { count: line.timesPrinted })}</b>
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

/** Multi-colour: one indented row per used slot with the slicer colour. */
function Slots({ line }: { line: Line }) {
  return (
    <ul className="app-plain-list">
      {line.slots.map((slot) => (
        <li key={slot.slot} className="pp-slot">
          <b className="app-strong">{t('asset.slot', { n: slot.slot })}</b>
          <span className="pp-num">{formatGrams(slot.grams)}</span>
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
        </li>
      ))}
    </ul>
  );
}
