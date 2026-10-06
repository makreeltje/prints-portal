import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Info, Trash2, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import { useCurrentUser } from '../auth/context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/toast-context';
import { formatDate } from '../i18n/format';
import { t } from '../i18n/nl';
import { LoadingRows } from '../pages/ErrorState';
import { ForbiddenState, GlobalErrorState } from '../pages/StatePages';
import { deletePrint, fetchPrint, keys, modelUrl, restorePrint, setPrintTags } from './api';
import { RecordBadge, TagChip, Thumbnail } from './bits';
import { AssetList } from './AssetList';
import { TagEditor } from './TagEditor';
import { placeOf } from './filter';
import { Meta } from './PrintCard';
import type { PrintDetail } from './types';

const Viewer3D = lazy(() => import('./Viewer3D'));

/**
 * ScreenPrintDetail (M5 part): breadcrumb, name, record badge, tags with the
 * TagEditor and Verwijderen (Admins and Editors), the archived and deleted alerts,
 * Viewer3D and the file list. Spool, costs and payment arrive with M6.
 * Users see name, status, tags and the model, no files (owner decision).
 * One column until M6 brings the right-hand column (spool, costs, payment);
 * the viewer becomes `pp-viewer fluid` in that two-column layout.
 */
export function PrintDetailPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const canManage = user.role === 'Admin' || user.role === 'Editor';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
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

      <ModelView detail={detail} />

      {detail.assets !== null && detail.assets.length > 0 && <AssetList assets={detail.assets} />}

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
          <div className="pp-viewer">
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
      <div className="pp-viewer">
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
