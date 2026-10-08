import { Download, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from '../components/Dialog';
import { t } from '../i18n/nl';
import { downloadUrl } from './api';

/** Containers no browser plays; the file can still be downloaded. */
const UNPLAYABLE = /\.(mkv|avi|wmv|flv)$/i;

/**
 * VideoPlayer (1.9, GAP-085): a timelapse was indexed and named but could only
 * be downloaded. The browser's own controls are kept, because they are already
 * keyboard and screen-reader accessible.
 */
export function VideoPlayer({
  assetId,
  fileName,
  onClose,
}: {
  assetId: string;
  fileName: string;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const unsupported = UNPLAYABLE.test(fileName);

  return (
    <Dialog
      open
      title={fileName}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <a className="pp-btn pp-btn-secondary" href={downloadUrl(assetId)} download>
            <Download className="pp-ico" aria-hidden="true" />
            {t('common.download')}
          </a>
          <button type="button" className="pp-btn pp-btn-primary" onClick={onClose}>
            {t('common.close')}
          </button>
        </>
      }
    >
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
        <div className="pp-video">
          {/* No #t fragment: the file plays from its start (the owner's
              report). preload="metadata" is what shows a first frame. */}
          <video
            controls
            preload="metadata"
            src={downloadUrl(assetId)}
            onError={() => {
              setFailed(true);
            }}
          />
        </div>
      )}
    </Dialog>
  );
}
