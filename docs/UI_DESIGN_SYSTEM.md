# Atelier UI design system (the token sheet)

The single source of truth for the frontend. Components read these tokens (CSS
variables in `src/app/globals.css`), never literals. Register: calm trust plus
editorial gallery. One-line house style: a warm, dim gallery wall where each
studio and booking is a labelled exhibit.

## Palette (dark, warm; single theme)

| Role | Value | Use |
|---|---|---|
| field | `#15120d` | page background (warm near-black) |
| surface | `#1e1a13` | cards, panels |
| surface-raised | `#26211a` | menus, hover, raised cells |
| ink | `#f4efe4` | primary text (warm off-white) |
| muted | `#b0a692` | secondary text |
| faint | `#7a7060` | eyebrow labels, disabled, empty states |
| accent | `#caa04a` | the one interactive color (brass): links, primary button, focus, active slot |
| accent-soft | `#2a2416` | accent-tinted fills (selected chip background) |
| accent-deep | `#7d631f` | pressed/deep accent |
| reserved (seal) | `#7fa06e` | the confirmation seal only, once per screen (sage) |
| destructive | `#c85a44` | errors, dangerous actions |
| hairline | `rgba(244,239,228,0.09)` | 1px borders, placard rules |

Contrast: ink on field ~13:1, muted on field ~5.3:1, accent on field ~6:1 (all pass 4.5:1 body / 3:1 large).

## Type

- Display (headings h1/h2): Fraunces (variable serif, editorial warmth), weight <= 600.
- UI (body, controls): Geist Sans.
- Precise (numbers, booking references, spec values): Geist Mono, tabular.
- Weight ceiling: 600. Titles and buttons sentence case; uppercase only for eyebrow labels and pills.
- Size steps (rem): 0.75, 0.8125, 0.875, 1, 1.125, 1.375, 1.75, 2.25, 3.

## Space and shape

- Radii: sm 8px, md 12px (base), lg 16px, pill 999px.
- Spacing base: 4px (gaps 8/12/16/24/32).
- Card padding: 20 to 24px. Content width: 72rem gallery, 28rem forms.

## Depth and material

- One light source: top. Cards = surface fill, a 1px hairline top edge (inset highlight), and a layered warm shadow stack:
  `0 1px 2px rgba(0,0,0,.4), 0 12px 28px rgba(0,0,0,.34), 0 24px 60px rgba(0,0,0,.28)`.
- Shadow tint is warm black, never pure `#000` flat. Elevation raises offset/blur and lowers opacity.
- No glass (dark theme); panels are lit warm surfaces.

## Signature elements (two, placement rules fixed)

1. Placard (system-wide): a gallery wall label. A hairline top rule, an uppercase mono eyebrow on the left, a value on the right. Used for studio price/hours, booking summaries, availability legend. Class `.placard` / `.eyebrow`.
2. Brass seal (once per confirmation): a circular brass stamp holding the `ATL-` booking reference on the confirmation screen. Class `.seal`. Reserved sage is allowed only inside it.

## Motion tokens

- Durations: micro 150ms, standard 220ms, reveal 320ms.
- Easing: standard `cubic-bezier(0.4,0,0.2,1)`; enter/decelerate `cubic-bezier(0,0,0.2,1)`; exit/accelerate `cubic-bezier(0.4,0,1,1)`.
- Hover lift 2px; press scale 0.98; stagger 50ms. `prefers-reduced-motion` collapses to opacity-only/instant.

## Finishing

- Field carries a warm radial vignette and a faint animated grain (~4%).
- Layered shadow stack on every card; one accent element per screen; no second accent.

## The hero moment

The booking wizard on a studio detail page, ending on the confirmation screen with the brass seal and the `ATL-` reference. Every other screen is quieter so it lands.
