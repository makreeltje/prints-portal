AssetListItem is one file of a print (G-code, 3MF, STL, video, Fusion 360, PDF, URL or other) with its own weight, time and spool.

**Anatomy.** Type icon (20px, `muted`; see README for the icon per type), file name in `mono` truncated in the middle (start shrinks with an ellipsis, the last 10 characters and the extension stay visible), meta line (size, grams, time), per-asset SpoolPicker trigger, the toggle "Telt niet mee in kosten", download button. Excluded items show the name struck through in `muted`. At 480px and below the actions wrap onto a second line.

**Tokens.** `border`, `muted`, `text-strong`, `font-mono`.

**States.** Default, hover (row `primary-tint-soft`), excluded, missing file (warning badge "Bestand ontbreekt"), no weight/time yet (dashes).

**Accessibility.** Full file name in `title` and a tooltip; the toggle has a visible label; download is a real link with `download`.

**Dutch copy.** Telt niet mee in kosten, Downloaden, Bestand ontbreekt, 87 g, 1 u 20 min.
