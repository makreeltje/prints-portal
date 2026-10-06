import { describe, expect, it } from 'vitest';
import { t } from './nl';

describe('t', () => {
  it('fills placeholders', () => {
    expect(t('confirm.deleteTag', { name: 'cadeau' })).toBe("Tag 'cadeau' verwijderen?");
  });

  it('picks ICU plural forms', () => {
    expect(t('customers.printCount', { count: 1 })).toBe('1 print');
    expect(t('customers.printCount', { count: 0 })).toBe('0 prints');
    expect(t('customers.printCount', { count: 12 })).toBe('12 prints');
    expect(t('confirm.deleteCustomerBody', { count: 1 })).toBe(
      'De print van deze klant wordt verborgen. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen.',
    );
    expect(t('confirm.deleteTagBody', { count: 3 })).toBe(
      'De tag wordt van 3 prints verwijderd. De prints zelf blijven bestaan.',
    );
  });
});
