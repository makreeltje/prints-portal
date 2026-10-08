VideoPlayer plays a video asset of a print (GAP-085, new in 1.9). Timelapses were indexed and named but could only be downloaded.

**Anatomy.** In AssetListItem a video row gets an icon button "Afspelen {bestandsnaam}" (`play` icon) before "Downloaden". It opens a Dialog (a bottom sheet at 480px and below) titled with the file name, holding the player and the footer buttons "Downloaden" and "Sluiten". The player is `pp-video`: 16:9, max 720px, `surface-2` ground, `border`, `radius-lg`, an HTML `<video controls preload="metadata">` with `object-fit: contain`. The browser's own controls are kept (they are keyboard and screen-reader accessible; we do not draw our own). **No autoplay**, no sound until the user presses play. **Poster frame:** none — see 2.0 (GAP-089). The `<video>` carries no `poster` attribute; `preload="metadata"` lets the browser show the first frame itself where it can. **Print thumbnail:** when a print has no image and no model, its thumbnail is the neutral `pp-thumb poster` ground with the `file-video` icon and a 20px play badge (`pp-play`) at the bottom right — no frame is extracted (2.0); a print with a model keeps the model thumbnail. **States:** loading ("Video laden…" with a spinner), playing, error (`pp-alert unpaid`, role="alert": "De video kon niet worden afgespeeld." with a hint to download), **unsupported container** (`.mkv`, and any file the browser cannot decode: an `info` alert "Dit formaat speelt niet in de browser." in place of the player; the Download button stays and is the primary action). A user without access to the klant gets no play button, as for downloads. Archived prints whose files are gone show no play button, as for the model.

**Tokens.** `surface-2`, `border`, `radius-lg`, `unpaid`/`unpaid-tint`, `info`/`info-tint`, `muted`, Dialog tokens.

**States.** Closed, loading, playing, error, unsupported, phone sheet, inline in the media strip (2.0).

**Accessibility.** Dialog focus is trapped and returns to the play button; Esc closes; the video has `aria-label` "Timelapse {naam}"; the native controls are used as they are; errors are `role="alert"`; the play badge on a thumbnail is decorative and has no name of its own (the print's name is the name).

**Dutch copy.** Afspelen {bestandsnaam} | Video laden… | De video kon niet worden afgespeeld. | Download het bestand om het in een andere speler te openen. | Dit formaat speelt niet in de browser. | Download het bestand om het af te spelen. | Downloaden | Sluiten

**To measure (owner):** how many prints have only a video and no model (the thumbnail rule), and how many videos are `.mkv` (those cannot play inline; converting to `.mp4` on upload would remove that state).

**2.0.** (2026-10-08) **No poster frame anywhere (GAP-089, resolved; your product decision designed to).** The container image ships no video decoder and none is going in, so nothing in the stack can extract a frame. 1.9's spec asked the app for "a frame at 1 second", which was never buildable, and two of 83 prints are video-only, so the cost of pretending is higher than the benefit of a picture.

- **The spec stops asking for a poster.** The `<video>` has no `poster` attribute; `preload="metadata"` is kept, and whatever first frame the browser can show on its own is a bonus, never something the layout depends on. The player's ground is `surface-2` either way, so an empty frame and a shown frame look the same size.
- **A video-only print's thumbnail** is `pp-thumb poster`: the neutral ground, the `file-video` icon at 24px (16px at `sm`) in `muted`, and the play badge. It is honest — "there is a video here" — and it is the same picture in the card, the row, the share page and the media strip.
- **The media strip button** for a timelapse follows the same rule (ModelPicker, GAP-096): neutral ground, play badge, duration.
- If a decoder ever does go in, the only change is that `pp-thumb poster` and `pp-modelbtn.video .pp-thumb` may hold an `<img>`; nothing else in the spec moves. That is why the ground, the badge and the sizes are specified without it.

**Still worth measuring (owner):** how many of the videos are `.mkv` (the 1.9 question, unanswered). Those cannot play inline at all, and if it is most of them the `info` alert is the normal state rather than the exception, which would change what the button should say.
