# Atelier UI design system (the token sheet)

The single source of truth for the frontend. Components read these tokens (CSS
variables and the `.atl-*` classes in `src/app/globals.css`), never literals.
Register: calm trust plus editorial gallery, in the Wealthsimple mode. One-line
house style: a black room with deep negative space, one bone light, and one
ivory pass that catches it; every studio and booking is a lit exhibit.

This sheet was set by the Claude Design generate-and-integrate loop (July 6,
2026). It replaced the earlier warm-brass system and the flat wax-seal object.

## Palette (neutral near-black, single theme)

| Role | Value | Use |
|---|---|---|
| field | `#0a0a0b` | page background (near-pure neutral black) |
| surface | `#161617` | cards, panels (clearly above the field) |
| surface-raised | `#202023` | hover, menus, selected cells |
| surface-sunken | `#0e0e0f` | inset wells: inputs, the availability grid |
| ink | `#f5f5f6` | primary text (near-white) |
| muted | `#a6a6ac` | secondary text |
| faint | `#6c6c72` | eyebrow labels, disabled, empty states |
| line | `rgba(255,255,255,0.08)` | 1px borders, placard rules |
| line-strong | `rgba(255,255,255,0.14)` | stronger separators |
| accent | `#ece6d8` | the one interactive color (bone): primary button, links, active, focus |
| accent-dim | `#cfc7b5` | pressed and deep accent |
| accent-soft | `rgba(236,230,216,0.10)` | bone-tinted fill (selected tile) |
| ivory | `#efe9dc` | the pass object surface only (warm paper) |
| confirm | `#74c39a` | reserved: the confirmed tick only, once per screen (sage green) |
| destructive | `#e5674f` | errors, dangerous actions |

Contrast: ink on field ~18:1, muted ~8:1, bone ~16:1, green ~8:1 (all pass 4.5:1
body / 3:1 large). Bone is the only non-neutral color at rest. Green is reserved
for the confirmed state, once per screen. No gold, no brass, no second accent.

## Type

- Display (headings, studio names): Fraunces (variable serif), weight <= 600,
  tracking -0.01em at large sizes.
- UI (body, controls, nav): Geist Sans.
- Numeric: money, hours, totals, positions in Geist Sans with tabular-nums.
- Mono (Geist Mono): the `ATL-` booking reference, the slot-time chips, and the
  eyebrow/index labels only.
- Weight ceiling 600. Sentence case; uppercase only for eyebrow labels and pills.

## Space and shape

- Radii: sm 10, md 14 (base), lg 18, xl 24, pill 999px.
- Spacing base 4px (gaps 8/12/16/24/32/48/64). Card padding 18 to 32px.
- Content width: 76rem gallery, 60rem dashboards, 48rem loop, 30rem forms.

## Depth and material (one top light source)

- `.atl-card`: `background var(--surface)`; 1px `var(--line)`; radius-lg; the
  layered stack `inset 0 1px 0 rgba(255,255,255,.05), 0 2px 4px rgba(0,0,0,.6),
  0 12px 26px rgba(0,0,0,.5), 0 30px 64px rgba(0,0,0,.42)`. Never nest a card in
  a same-fill card.
- `.atl-well`: `background var(--surface-sunken)`; `inset 0 1px 2px rgba(0,0,0,.7),
  inset 0 0 0 1px rgba(255,255,255,.06)`. Used for inputs and the light board.
- Shadows are warm black; higher elevation raises offset/blur and lowers opacity.

## Signature elements (placement rules fixed)

1. The placard (`.atl-placard`, system-wide): a gallery-wall label. A hairline
   top rule, a mono uppercase eyebrow on the left, the value on the right in
   tabular sans (mono only for the `ATL-` reference). Rate, hours, reference,
   total, position.
2. The Atelier pass (`.atl-pass`, once per confirmation, and on the auth panel):
   an ivory studio ticket in real light: a perforated left edge, a debossed "A"
   monogram, real ink text, one specular sweep on entrance, and a soft cast
   shadow lifting it off the black. This is the hero object; it replaces the old
   wax-seal. Reserved green appears only as its confirmed tick.
3. The availability light board (`.atl-tile` variants): an inset well of slot
   tiles. Free tiles carry a bone edge and a faint inner glow; booked tiles are
   dim with a waitlist affordance; blackout/held tiles are hatched and disabled;
   the selected tile fills with accent-soft and a bone ring plus a check badge.

## Motion tokens

- Durations: micro 120ms, small 180ms, standard 240ms, reveal 320ms, hero 480ms.
- Easing: standard `cubic-bezier(0.4,0,0.2,1)`; enter/reveal
  `cubic-bezier(0.16,1,0.3,1)`; exit `cubic-bezier(0.4,0,1,1)`.
- Hover lift 2px; press scale 0.98; stagger 50ms; one specular sweep per screen.
- `prefers-reduced-motion` collapses every animation to opacity-only/instant.

## Finishing

- A neutral key-light vignette from the top over the field, feathered.
- `.atl-grain`: a fixed animated film-grain layer (~4.5%), above the field and
  below the content, stepped so it reads as film.
- One accent moment per screen; the pass carries the one specular sweep.

## The hero moment

The booking flow on the studio detail page: browse the availability light board,
select a slot, Continue to review (with a live hold countdown), then confirm and
land on the ivory pass with the real `ATL-` reference. Every other screen is
quieter so it lands.
