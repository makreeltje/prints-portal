# Logo

The studio's own mark, for the **Logo** field in Instellingen. It is content of
this installation, not part of the design system: the design system owns the
app's look, this names the business on it.

| file             | use                                                          |
| ---------------- | ------------------------------------------------------------ |
| `meels-logo.png` | **Upload this.** 800px wide, transparent. Mark and wordmark. |
| `meels-logo.svg` | The source, for editing.                                     |
| `meels-mark.png` | The mark alone, 512px square, for a favicon or app icon.     |
| `meels-mark.svg` | The source of the mark.                                      |

## Why it looks the way it does

- **One colour, `#5878d6`.** The app shows the logo in both themes and does
  nothing to adapt it, so a single file has to survive white (the invoice and
  the light sidebar) and `#1a1b26` (the dark sidebar). Measured: **4.14:1 on
  white, 4.13:1 on the dark ground**. The design system's own `primary` fails
  one side or the other (6.12 and 2.79 light; 2.52 and 6.79 dark).
- **No tagline.** The sidebar caps the logo at `--space-7`, 32px tall. A second
  line of type lands at about 4px there, which is mush. It was drawn with
  "3D PRINTS" under the name and removed after seeing it at that size.
- **The M is one stroked path** with round caps and joins, so the diagonals meet
  the stems instead of floating near them.

## Upload PNG, not SVG

The container has no fonts, so text in an uploaded SVG renders as nothing
(measured: a shape drew 1600 pixels, a word drew 0). That is logged as
GAP-104. Nothing is lost by using the PNG: the app rasterises an SVG to an
800px PNG anyway, which is exactly what `meels-logo.png` already is.
