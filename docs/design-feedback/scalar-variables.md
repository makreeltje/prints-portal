# Scalar CSS variables, as shipped in the version we use

Generated from `@scalar/api-reference-react` **0.9.78** by
`scripts/dump-scalar-variables.mjs`, so these are the names and defaults that exist in the
version we ship rather than remembered ones. Regenerate it after a Scalar upgrade.

102 variables are declared. The app maps 30 of them onto our tokens
(`frontend/src/styles/app.css`, `.app-api`, marked `ds-gap: GAP-056`); the rest keep their own value.

`theme: "none"` is set, so Scalar applies no theme of its own: every value below is either our
token or a Scalar default that nothing has overridden yet.

## color

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-color-1` | `var(--text-strong)` | `#1b1b1b` | `#e7e7e7` |
| `--scalar-color-2` | `var(--text)` | `#707070` | `#a4a4a4` |
| `--scalar-color-3` | `var(--muted)` | `#8e8e8e` | `#797979` |
| `--scalar-color-accent` | `var(--primary)` | `#09f` | `#00aeff` |
| `--scalar-color-alert` | `var(--warning)` | `var(--scalar-color-orange)` | — |
| `--scalar-color-blue` | `var(--info)` | `#0072bd` | `#4eb3ec` |
| `--scalar-color-danger` | `var(--unpaid)` | `var(--scalar-color-red)` | `var(--scalar-color-red)` |
| `--scalar-color-green` | `var(--paid)` | `#069061` | `#00b648` |
| `--scalar-color-orange` | `var(--warning)` | `#ff5800` | `#ff8d4d` |
| `--scalar-color-purple` | `var(--primary)` | `#5203d1` | `#b191f9` |
| `--scalar-color-query` | `var(--muted)` | `#007b80` | `#65d4cf` |
| `--scalar-color-red` | `var(--unpaid)` | `#ef0006` | `#dc1b19` |
| `--scalar-color-yellow` | `var(--warning)` | `#edbe20` | `#ffc90d` |

## background

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-background-1` | `var(--surface)` | `#fff` | `#0f0f0f` |
| `--scalar-background-2` | `var(--surface-2)` | `#f6f6f6` | `#1a1a1a` |
| `--scalar-background-3` | `var(--bg)` | `#e7e7e7` | `#272727` |
| `--scalar-background-accent` | `var(--primary-tint)` | `#8ab4f81f` | `#3ea6ff1f` |
| `--scalar-background-alert` | — | `var(--scalar-color-orange)` | `var(--scalar-color-orange)` |
| `--scalar-background-danger` | — | `var(--scalar-color-red)` | `var(--scalar-color-red)` |

## sidebar

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-sidebar-background-1` | `var(--surface)` | — | `var(--scalar-background-1)` |
| `--scalar-sidebar-border-color` | `var(--border)` | — | `var(--scalar-border-color)` |
| `--scalar-sidebar-color-1` | `var(--text-strong)` | — | `var(--scalar-color-1)` |
| `--scalar-sidebar-color-2` | `var(--muted)` | — | `var(--scalar-color-2)` |
| `--scalar-sidebar-color-active` | `var(--primary)` | — | `var(--scalar-sidebar-color-1)` |
| `--scalar-sidebar-indent` | — | `20px` | `20px` |
| `--scalar-sidebar-indent-border` | — | — | `var(--scalar-sidebar-border-color)` |
| `--scalar-sidebar-indent-border-active` | — | — | `var(--scalar-sidebar-border-color)` |
| `--scalar-sidebar-indent-border-hover` | — | — | `var(--scalar-sidebar-border-color)` |
| `--scalar-sidebar-item-active-background` | `var(--primary-tint)` | — | `var(--scalar-background-2)` |
| `--scalar-sidebar-item-hover-background` | — | — | `var(--scalar-background-2)` |
| `--scalar-sidebar-item-hover-color` | — | — | `var(--scalar-sidebar-color-2)` |
| `--scalar-sidebar-padding` | — | `12px` | `12px` |
| `--scalar-sidebar-search-background` | — | — | `var(--scalar-background-2)` |
| `--scalar-sidebar-search-border-color` | — | — | `var(--scalar-border-color)` |
| `--scalar-sidebar-search-color` | — | — | `var(--scalar-color-3)` |

## border

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-border-color` | `var(--border)` | `#dfdfdf` | `#2d2d2d` |
| `--scalar-border-width` | — | `.5px` | `.5px` |

## radius

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-radius` | `var(--radius-md)` | `3px` | `3px` |
| `--scalar-radius-2xl` | — | `min(calc(var(--scalar-radius) * 4), var(--scal…` | `min(calc(var(--scalar-radius) * 4), var(--scal…` |
| `--scalar-radius-3xl` | — | `min(calc(var(--scalar-radius) * 16 / 3), var(-…` | `min(calc(var(--scalar-radius) * 16 / 3), var(-…` |
| `--scalar-radius-full` | — | `calc(var(--scalar-radius) * 9999)` | `calc(var(--scalar-radius) * 9999)` |
| `--scalar-radius-lg` | `var(--radius-lg)` | `min(calc(var(--scalar-radius) * 2), var(--scal…` | `min(calc(var(--scalar-radius) * 2), var(--scal…` |
| `--scalar-radius-max` | — | `20px` | `20px` |
| `--scalar-radius-md` | — | `min(var(--scalar-radius), var(--scalar-radius-…` | `min(var(--scalar-radius), var(--scalar-radius-…` |
| `--scalar-radius-xl` | — | `min(calc(var(--scalar-radius) * 8 / 3), var(--…` | `min(calc(var(--scalar-radius) * 8 / 3), var(--…` |

## font

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-font` | `var(--font-sans)` | `"Inter", ui-sans-serif, system-ui, sans-serif,…` | `"Inter", ui-sans-serif, system-ui, sans-serif,…` |
| `--scalar-font-bold` | — | `700` | `700` |
| `--scalar-font-code` | `var(--font-mono)` | `"JetBrains Mono", ui-monospace, SFMono-Regular…` | `"JetBrains Mono", ui-monospace, SFMono-Regular…` |
| `--scalar-font-medium` | — | `500` | `500` |
| `--scalar-font-normal` | — | `400` | `400` |
| `--scalar-font-size-1` | — | `21px` | `21px` |
| `--scalar-font-size-2` | — | `16px` | `16px` |
| `--scalar-font-size-3` | — | `14px` | `14px` |
| `--scalar-font-size-4` | — | `13px` | `13px` |
| `--scalar-font-size-5` | — | `12px` | `12px` |
| `--scalar-font-size-6` | — | `12px` | `12px` |
| `--scalar-font-size-7` | — | `10px` | `10px` |

## shadow

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-shadow-1` | — | `0 1px 3px 0 #0000001c` | `0 1px 3px 0 #0000001a` |
| `--scalar-shadow-2` | — | `#00000014 0px 13px 20px 0px, #00000014 0px 3px…` | `0 0 0 .5px var(--scalar-border-color), #0f0f0f…` |

## button

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-button-1` | — | `#000` | `#fff` |
| `--scalar-button-1-color` | — | `#fff` | `black` |
| `--scalar-button-1-hover` | — | `#000c` | `#ffffffe6` |

## link

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-link-color` | — | `var(--scalar-color-1)` | `var(--scalar-color-1)` |
| `--scalar-link-color-hover` | — | `var(--scalar-link-color)` | `var(--scalar-link-color)` |
| `--scalar-link-font-weight` | — | `inherit` | `inherit` |

## header

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-header-height` | — | `50px` | `50px` |

## other

| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |
|---|---|---|---|
| `--scalar-address-bar-bg` | — | `var(--scalar-background-1)` | `var(--scalar-background-1)` |
| `--scalar-address-bar-height` | — | `0px` | `0px` |
| `--scalar-backdrop-brightness` | — | `1` | `.5` |
| `--scalar-bold` | — | `600` | `600` |
| `--scalar-focus-color` | — | `var(--scalar-color-accent)` | `var(--scalar-color-accent)` |
| `--scalar-heading-1` | — | `24px` | `24px` |
| `--scalar-heading-2` | — | `20px` | `20px` |
| `--scalar-heading-3` | — | `16px` | `16px` |
| `--scalar-heading-4` | — | `16px` | `16px` |
| `--scalar-heading-5` | — | `16px` | `16px` |
| `--scalar-heading-6` | — | `16px` | `16px` |
| `--scalar-lifted-brightness` | — | `1` | `1.45` |
| `--scalar-line-height-1` | — | `32px` | `32px` |
| `--scalar-line-height-2` | — | `24px` | `24px` |
| `--scalar-line-height-3` | — | `20px` | `20px` |
| `--scalar-line-height-4` | — | `18px` | `18px` |
| `--scalar-line-height-5` | — | `16px` | `16px` |
| `--scalar-loaded-api-reference` | — | `true` | `true` |
| `--scalar-micro` | — | `12px` | `12px` |
| `--scalar-mini` | — | `13px` | `13px` |
| `--scalar-page-description` | — | `16px` | `16px` |
| `--scalar-paragraph` | — | `16px` | `16px` |
| `--scalar-refs-heading-spacing` | — | `24px` | `24px` |
| `--scalar-regular` | — | `400` | `400` |
| `--scalar-scrollbar-color` | — | `#0000002e` | `#ffffff2e` |
| `--scalar-scrollbar-color-active` | — | `#0000005c` | `#ffffff5c` |
| `--scalar-semibold` | — | `500` | `500` |
| `--scalar-small` | — | `14px` | `14px` |
| `--scalar-text-decoration` | — | `none` | `none` |
| `--scalar-text-decoration-color` | — | `currentColor` | `currentColor` |
| `--scalar-text-decoration-color-hover` | — | `currentColor` | `currentColor` |
| `--scalar-text-decoration-hover` | — | `underline` | `underline` |
| `--scalar-tooltip-background` | — | `var(--scalar-background-1)` | `var(--scalar-background-1)` |
| `--scalar-tooltip-color` | — | `var(--scalar-color-1)` | `#fffffff2` |
| `--scalar-tooltip-padding-x` | — | `8px` | `8px` |
| `--scalar-tooltip-padding-y` | — | `6px` | `6px` |

## Still on a value of their own

These are not mapped and do not inherit from a mapped variable, so they keep a literal
value of Scalar's: the list a decision has to cover.

| Variable | Scalar default (light) | Scalar default (dark) |
|---|---|---|
| `--scalar-border-width` | `.5px` | `.5px` |
| `--scalar-button-1-color` | `#fff` | `black` |
| `--scalar-font-bold` | `700` | `700` |
| `--scalar-font-medium` | `500` | `500` |
| `--scalar-font-normal` | `400` | `400` |
| `--scalar-font-size-1` | `21px` | `21px` |
| `--scalar-font-size-2` | `16px` | `16px` |
| `--scalar-font-size-3` | `14px` | `14px` |
| `--scalar-font-size-4` | `13px` | `13px` |
| `--scalar-font-size-5` | `12px` | `12px` |
| `--scalar-font-size-6` | `12px` | `12px` |
| `--scalar-font-size-7` | `10px` | `10px` |
| `--scalar-radius-2xl` | `min(calc(var(--scalar-radius) * 4), var(--scal…` | `min(calc(var(--scalar-radius) * 4), var(--scal…` |
| `--scalar-radius-3xl` | `min(calc(var(--scalar-radius) * 16 / 3), var(-…` | `min(calc(var(--scalar-radius) * 16 / 3), var(-…` |
| `--scalar-radius-full` | `calc(var(--scalar-radius) * 9999)` | `calc(var(--scalar-radius) * 9999)` |
| `--scalar-radius-max` | `20px` | `20px` |
| `--scalar-radius-md` | `min(var(--scalar-radius), var(--scalar-radius-…` | `min(var(--scalar-radius), var(--scalar-radius-…` |
| `--scalar-radius-xl` | `min(calc(var(--scalar-radius) * 8 / 3), var(--…` | `min(calc(var(--scalar-radius) * 8 / 3), var(--…` |
| `--scalar-scrollbar-color` | `#0000002e` | `#ffffff2e` |
| `--scalar-scrollbar-color-active` | `#0000005c` | `#ffffff5c` |
| `--scalar-shadow-1` | `0 1px 3px 0 #0000001c` | `0 1px 3px 0 #0000001a` |
| `--scalar-shadow-2` | `#00000014 0px 13px 20px 0px, #00000014 0px 3px…` | `0 0 0 .5px var(--scalar-border-color), #0f0f0f…` |
