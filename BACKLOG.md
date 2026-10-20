# Backlog

Known bugs and wanted improvements. Every item was measured in the running
app against the real library or read out of the code; the numbers are from
2026-10-20, app 1.0.0, design system 2.17.

**This list is not exhaustive, and the reason matters.** Most of it came out of
one week of work on other things, plus one deliberate pass over the live
install's settings and data. **The app has never had a systematic audit**, and
the owner's own walkthrough stopped at Tags (item 14), so eight screens have
never been looked at by the person who uses them. Expect this list to grow
when either of those happens.

**Not in this list:** design-system rounds and their open questions (the owner
runs those), and local review leftovers that were deliberately kept — the
measurement share links and the `testuser` account.

**Design gaps:** `design-system/DESIGN_GAPS.md` holds **182 gaps, 0 open**, so
nothing below is blocked by one. Where a gap is part of an item's history it is
named with its state.

---

## High

### 1. Bedrijfsgegevens is empty, which blocks invoicing and leaves klanten unable to pay

- **Type:** improvement — configuration, **not a code defect**. Every guard
  below behaves exactly as specified.
- **What is wrong:** `company.name`, `company.iban` and `company.address` are
  all empty, and **no klant has a payment link** (0 of 12). Meanwhile **11 of
  12 klanten owe money, €296,04 in total**. Three consequences:
  1. **No final invoice can be made at all.** `finalise` throws
     `company_incomplete`, because `companyReady` wants a non-empty name _and_
     IBAN (`backend/src/finance/invoices.ts:228`, `:470` — the GAP-037 rule).
     Concepts work; "Definitief maken" does not. A payment link does **not**
     satisfy this guard, only the share page's.
  2. **A klant with an open amount is given no way to pay.** The "Betalen"
     block needs an IBAN or that klant's payment link
     (`backend/src/sharing/overview.ts:231`, GAP-103), so it is correctly
     hidden — and the klant reads "Openstaand € x" with no instruction
     anywhere on the page.
  3. **Klanten see the app's name instead of the studio's.** The guest head
     falls back to the company name and then to the app's own, so every
     visitor currently reads "3D Prints Portal".
- **Reproduce:** Instellingen → Bedrijfsgegevens: three empty fields. Open a
  deel-link of a klant with an open amount: a total, "Openstaand", no "Betalen"
  block, no IBAN, and the app's name in the header. Try "Definitief maken" on
  a concept: it fails with `company_incomplete`.
- **Screen / component:** ScreenSettings (Bedrijfsgegevens), ScreenSharePage,
  ScreenInvoices, DocInvoice, DocReminder.
- **Priority:** high — the only item here that stops a workflow outright.
- **Open GAP:** none; GAP-037 and GAP-103 are resolved and are why it behaves
  this way.
- **Ours to improve, separately:** "Definitief maken" should say what is
  missing and point at the settings instead of failing with an error code.

### 2. The whole invoicing flow has never run once

- **Type:** improvement (risk).
- **What is wrong:** **0 invoices exist.** Numbering (`YYYY-NNN`, yearly
  reset), assignment at "Definitief maken", the stored PDF and data snapshot
  on `/data`, line locking, the one-final-invoice-per-print rule, credit notes
  and reminders have therefore never been exercised against real data — only
  by tests. Blocked today by item 1, so the two are one job: fill the fields
  in, then put a real invoice through end to end.
- **Reproduce:** Facturen is empty; `/api/invoices` returns none.
- **Screen / component:** ScreenInvoices, DocInvoice, DocReminder,
  `backend/src/finance/invoices.ts`, `/data`.
- **Priority:** high — this is the part of the app where a defect costs money
  or breaks a legal record, and it is the part that has never been used.
  Everything else here has at least run.
- **Open GAP:** none.

---

## Medium

### 3. 31 spools in Spoolman, and not one print uses them

- **Type:** improvement — needs a decision from the owner first.
- **What is wrong:** Spoolman is configured and reachable and holds **31
  spools**, but **0 of 84 prints has a spool assigned**. So every cost is
  computed from `materialPricesPerKg` rather than from what the filament
  actually cost, and the whole spool surface is unexercised: the per-print
  spool, the per-file and per-slot spool, the picker's search, the archived
  spool rules (GAP-161, GAP-162) and the bulk "Spoel toewijzen" action.
- **Reproduce:** open any print — "Spoel voor de hele print" has nothing
  chosen; Instellingen shows Spoolman connected with its spools listed.
- **Screen / component:** SpoolPicker, ScreenPrintDetail, BulkDialogs,
  CostBreakdown.
- **Priority:** medium. It is not broken, but a sixth of the app is dark and
  the costs are approximations.
- **Open GAP:** none. GAP-161 and GAP-162 are resolved.
- **The decision:** if per-spool costing is wanted, 84 prints need a spool
  (the bulk action exists for exactly this). If it is not, say so and the
  feature can stop being a thing that looks unfinished.

### 4. Ten prints have no cost, eight have no price, and eight would be skipped silently

- **Type:** bug (behaviour) plus data work.
- **What is wrong:** **10 prints have no cost** and **8 have no price**, and
  **25 miss a file type** (18 without G-code, 7 without 3MF, 7 without STL) —
  which is most of the reason the costs are missing, since print time and
  grams come out of the G-code. The part that is ours: a print whose money
  status is `noPrice` is **dropped from a draft invoice** and only reported in
  an `excluded` list (`backend/src/finance/invoices.ts:132`). Once item 1 is
  fixed and invoicing starts, 8 prints quietly will not be billed, and whether
  the owner notices depends on him reading that list.
- **Reproduce:** the dashboard with the "Kosten ontbreken" and "Geen prijs"
  filters; then draft an invoice for a klant who owns one of the 8.
- **Screen / component:** ScreenInvoices, ScreenDashboard, PaymentPanel,
  CostBreakdown.
- **Priority:** medium — low urgency while item 1 blocks invoicing, and then
  immediately a money question.
- **Open GAP:** none.

### 5. The price field is below the fold at every size

- **Type:** improvement.
- **What is wrong:** ScreenPrintDetail's own aim, written in 1.9 and only now
  measured, is that the price field is reachable without scrolling:

  |                                            | 1360 × 900 | 390 × 844 |
  | ------------------------------------------ | ---------- | --------- |
  | top of the field, from the top of the page | 1088px     | 1555px    |
  | below the fold by                          | 188px      | 711px     |

  On a phone it is nearly two screens down. In the same row at 1360px the card
  beside the viewer is **43px shorter** than the viewer (560 × 420 against
  377), so there is slack next to the viewer while the field the owner reaches
  for most is off-screen.

- **Reproduce:** open any print with an order at 1360×900 — Verkoopprijs is
  not on the first screen.
- **Screen / component:** ScreenPrintDetail, PaymentPanel.
- **Priority:** medium — daily friction.
- **Open GAP:** none, but **the fix is the design system's to shape**: moving
  Betaling into the media row is their own suggested remedy and Betaling is a
  whole component. The measurement has been sent; there is nothing to build
  until they answer.

### 6. The backend suite has produced two unexplained failures under load

- **Type:** bug (test reliability).
- **What is wrong:** two failures that have never reproduced.
  `watcher.test.ts > picks up a new customer folder` timed out at **5057ms**
  against a 5000ms limit once, and an earlier full run had a backend failure
  that scrolled past unattributed. Both under a full parallel `npm run
verify`. The watcher test then passed 5 reruns, and again with the pre-fix
  indexer stashed in, so it is timing rather than the change under test.
- **Reproduce:** intermittent; `npm run verify` repeatedly on a loaded
  machine.
- **Screen / component:** `backend/test/indexing/watcher.test.ts` and the
  backend suite's parallelism.
- **Priority:** medium — a flake in CI blocks a merge at the worst moment.
  Raising the timeout is a guess; the honest fix is finding out whether the
  watcher really is slow to see a new folder under load, which is also a
  production question after the "(restored)" incident.
- **Open GAP:** none.

---

## Low

### 7. The operator's video dialog still plays through the download route

- **Type:** improvement (cleanup).
- **What is wrong:** `frontend/src/prints/VideoPlayer.tsx` uses
  `downloadUrl(assetId)` for both the player `src` and the footer link.
  GAP-175 added `GET /api/prints/:id/video`, which serves the same bytes
  inline with ranges for every role. One file is now playable through two
  routes and the newer one can do everything the older one does here. Nothing
  is broken: this dialog is operator-only and its download button should
  download.
- **Screen / component:** VideoPlayer (file-list dialog), AssetListItem.
- **Priority:** low.
- **Open GAP:** none — VideoPlayer 2.16 keeps this form unchanged on purpose,
  so the change is ours to make or skip.

### 8. Two `.mkv` timelapses a klant can neither play nor download

- **Type:** feature.
- **What is wrong:** 2 of 121 videos are `.mkv`; 119 are `.mp4`. No browser
  plays them inline, and role User and visitors have no download, so for those
  two prints "Dit formaat speelt niet in de browser." is the whole answer.
  Converting on index would remove the state.
- **Reproduce:** open a deel-link for one of the two prints and choose the
  timelapse.
- **Screen / component:** VideoPlayer, ModelPicker, the indexer.
- **Priority:** low — 2 prints of 84, against taking on a decoder dependency.
- **Open GAP:** none; VideoPlayer 2.17 closed the question on this measurement
  and left the state as specified.

### 9. A dead copy key, and nothing that would catch the next one

- **Type:** improvement.
- **What is wrong:** `pay.userNote` sits in `frontend/src/i18n/nl.ts` and is
  rendered nowhere, which is correct — 2.16 retired it. The point is that
  nothing caught it: `nl.test.ts` tests the formatter, not usage, so an unused
  key is invisible. A check that every key is referenced, with an allowlist
  for retired ones, catches the reverse mistake too.
- **Screen / component:** `frontend/src/i18n/`.
- **Priority:** low.
- **Open GAP:** none; GAP-179 asked for exactly this state.

### 10. `docker compose pull` cannot fetch the published image

- **Type:** bug (local tooling, not the app).
- **What is wrong:** `docker compose pull` returns **403 Forbidden** for
  `ghcr.io/makreeltje/prints-portal:latest` from a shell not logged in to
  GHCR, and the local image is then silently whatever was pulled last. That
  already produced one wrong claim that 8080 was running the release when it
  was running a build from two days earlier.
- **Reproduce:** `docker compose pull` without `docker login ghcr.io`.
- **Screen / component:** local review setup, `docker-compose.yml`.
- **Priority:** low — one `docker login ghcr.io -u makreeltje` fixes it. Worth
  a line in `DEVELOPMENT.md` so a stale container is never read as the release.
- **Open GAP:** none.

### 11. Nothing automates a backup

- **Type:** feature.
- **What is wrong:** `docs/DEPLOYMENT.md` documents backups as a manual step
  (`sqlite3 … ".backup out.db"`), and there is no backup feature or scheduled
  job in the app. It matters more from the moment invoicing starts, because
  `/data` then holds the stored invoice PDFs and their snapshots, which are
  the record. Downgrades also have no automatic path, so a restore is the only
  way back.
- **Screen / component:** deployment, `/data`.
- **Priority:** low while there is nothing irreplaceable; **it rises to high
  the day item 2 is done.**
- **Open GAP:** none.

### 12. No Editor account has ever existed

- **Type:** improvement (coverage).
- **What is wrong:** the install has two accounts, one Admin and one User, both
  local (no OIDC). The **Editor** role is implemented, specified on every
  screen and tested, but has never been used by a person against real data —
  and it is the role with the most surface after Admin.
- **Reproduce:** Gebruikers lists two accounts.
- **Screen / component:** ScreenUsers, AccessMatrix, and every screen's Editor
  variant.
- **Priority:** low — unless someone else is ever going to help run the
  workshop, in which case it is worth a dry run first.
- **Open GAP:** none.

### 13. PLAN.md does not record M10 as finished

- **Type:** improvement (housekeeping).
- **What is wrong:** every milestone from M2 to M9 ends with a `Status:` line;
  **M1 and M10 have none.** M10's scope is substantively done — the docs all
  exist, the version is 1.0.0, and the security review happened on its own
  branch with fixes — so the plan is simply out of date on its own last line.
- **Screen / component:** `docs/PLAN.md`.
- **Priority:** low.
- **Open GAP:** none.

### 14. Eight screens the owner has never reviewed

- **Type:** improvement (process).
- **What is wrong:** the walkthrough of the app stopped at **Tags**, so
  Wachtrij, Facturen, Openstaand, Deel-links, Toegang, Gebruikers,
  Instellingen and API-docs have never been gone through by the person who
  uses them. Each has been built to spec, verified against the design system
  and covered by tests — none of which finds the things only the owner would
  notice. **This is the main reason the list above should not be read as
  complete.**
- **Priority:** low as a task, high as a caveat.
- **Open GAP:** none.
