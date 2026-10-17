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

  /*
    Dutch sends 0 to `other`, so a day count needs an exact arm to say the day
    rather than "0 dagen" (design system 2.11, GAP-150). These three strings
    are the reason the formatter learned `=N` at all.
  */
  it('prefers an exact `=N` arm over the plural forms', () => {
    expect(t('queue.waiting', { count: 0 })).toBe('vandaag gevraagd');
    expect(t('queue.waiting', { count: 1 })).toBe('1 dag geleden gevraagd');
    expect(t('queue.waiting', { count: 118 })).toBe('118 dagen geleden gevraagd');

    expect(t('status.daysOpen', { days: 0 })).toBe('sinds vandaag open');
    expect(t('status.daysOpen', { days: 1 })).toBe('1 dag open');
    expect(t('status.daysOpen', { days: 20 })).toBe('20 dagen open');

    expect(t('outstanding.oldestDays', { days: 0 })).toBe('alles van vandaag');
    expect(t('outstanding.oldestDays', { days: 1 })).toBe('oudste 1 dag');
    expect(t('outstanding.oldestDays', { days: 741 })).toBe('oudste 741 dagen');
  });

  /*
    `outstanding.oldest` is the StatTile label and nothing else; sharing it
    with the badge above is the fault GAP-148 was raised about.
  */
  it('keeps the oldest tile label apart from the oldest age badge', () => {
    expect(t('outstanding.oldest')).toBe('Oudste openstaande print');
  });
});
