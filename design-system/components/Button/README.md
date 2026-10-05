Button triggers an action; use one primary button per view.

**Anatomy.** Optional leading icon (16px), label, optional trailing icon. Variants `pp-btn-primary`, `pp-btn-secondary`, `pp-btn-ghost`, `pp-btn-danger` (outlined) and `pp-btn-danger-solid` (confirm step only). Sizes: default (36px, 44px at 480px and below) and `pp-btn-sm` (32px, desktop tables only). Icon-only uses `pp-btn-icon` and needs an `aria-label`.

**Tokens.** `primary`/`primary-hover`/`on-primary`, `surface`, `surface-2`, `border-strong`, `unpaid`/`unpaid-tint`, `primary-tint*`, `radius-md`, `motion-fast`.

**States.** Default, hover, focus-visible (2px `focus-ring`, 2px offset), active, disabled (50% opacity, `disabled` attribute), loading (`aria-busy="true"`, spinner replaces the leading icon, label stays, button disabled while the request runs).

**Accessibility.** Use `<button>`; links that look like buttons use `<a class="pp-btn">`. Never remove the focus outline. Disabled buttons that explain why use `aria-disabled` plus a tooltip instead of `disabled`.

**Dutch copy.** Opslaan, Annuleren, Markeer als betaald, Alles als betaald, Afschrijven, Verwijderen, Intrekken, Herstellen, Factuur downloaden, Opnieuw proberen.
