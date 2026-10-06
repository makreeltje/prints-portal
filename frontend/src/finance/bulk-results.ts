import { t } from '../i18n/nl';
import type { BulkResult } from './api';

/** One print that a bulk action could not update, with the reason in words. */
export interface BulkFailure {
  id: string;
  name: string;
  reason: string;
}

/** The BulkDialogs reasons; anything else is "Er ging iets mis". */
export function reasonOf(result: BulkResult): string {
  const n = result.orderNumber ?? 1;
  switch (result.error) {
    case 'paid':
      return t('bulk.reason.paid', { n });
    case 'written_off':
      return t('bulk.reason.writtenOff', { n });
    case 'locked':
      return t('bulk.reason.invoiced', { number: result.invoiceNumber ?? '' });
    case 'not_billed':
      return t('bulk.reason.notBilled');
    case 'no_cost':
      return t('bulk.reason.noCost');
    case 'not_found':
    case 'forbidden':
      return t('bulk.reason.noAccess');
    default:
      return t('error.generic');
  }
}
