import { FolderOpen, RotateCw } from 'lucide-react';
import { t } from '../i18n/nl';

/**
 * ScreenSystemStates first run: shown when the prints folder is reachable but
 * holds nothing yet. The diagram shows the folder convention the indexer
 * expects, so the first question ("where do my files go?") is answered on the
 * screen itself. Only Admins can start an index, so `onReindex` is optional.
 */
export function FirstRunState({ onReindex }: { onReindex?: () => void }) {
  return (
    <div className="pp-state wide">
      <div className="pp-illus" aria-hidden="true">
        <FolderOpen className="pp-ico pp-ico-24" />
      </div>
      <h1>{t('empty.noPrints.title')}</h1>
      <p>{t('system.firstRunBody')}</p>
      {/* pp-scroll, not pp-card: on a phone the diagram scrolls instead of wrapping. */}
      <div
        className="pp-scroll pp-p4 pp-left-t"
        tabIndex={0}
        role="region"
        aria-label={t('empty.noPrints.title')}
      >
        <div className="pp-mono pp-tree">
          prints/
          <div className="pp-indent-1">
            └─ <b>Koen</b>/ <span className="pp-hintchip">{t('system.folderCustomer')}</span>
          </div>
          <div className="pp-indent-3">
            └─ <b>Bloembak clips</b>/{' '}
            <span className="pp-hintchip">{t('system.folderProject')}</span>
          </div>
          <div className="pp-indent-4">├─ Bloembak_clips.gcode</div>
          <div className="pp-indent-4">├─ Bloembak_clips.3mf</div>
          <div className="pp-indent-4">└─ Bloembak_clips.stl</div>
        </div>
      </div>
      {onReindex !== undefined && (
        <button type="button" className="pp-btn pp-btn-primary" onClick={onReindex}>
          <RotateCw className="pp-ico" aria-hidden="true" />
          {t('empty.reindex')}
        </button>
      )}
    </div>
  );
}
