# Source typography compared with SparkArt and the app

Only `NewUserCard.tsx` and `newUser.module.css` change for this typography task. App.css, SparkArt and the source template remain unchanged. The title/paragraph content is unchanged.

| Property | SparkArt caption (unchanged) | Source title (updated) | Source prose (updated) |
| --- | --- | --- | --- |
| Font family | App font, inherited | App font, inherited | App font, inherited |
| Size | 6.5px | 14px desktop / 15px mobile, matching app headings | Existing app source style: 10px desktop / 11px mobile |
| Weight | App default 400 | App heading weight 600 | App default 400 |
| Colour | #b5bbcc | `var(--muted, #b5bbcc)` | Existing app source style: #c0c5d3 |
| Tracking | 1.55px | 1.55px | Normal prose spacing |
| Alignment | Existing placement | Left, no underline | Left, aligned with title |

The app supplies its font family through the root:

```css
/* App.css — unchanged */
:root {
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  font-weight: 400;
  --muted: #b5bbcc;
}

.source-content > p {
  font-size: 10px;
  line-height: 1.75;
  color: #c0c5d3;
}

@media (max-width: 720px) {
  .source-content > p { font-size: 11px; }
}
```

The caption provides the shared visual cue:

```css
/* SparkArt.module.css — unchanged; font family is inherited */
.caption {
  font-size: 6.5px;
  letter-spacing: 1.55px;
  color: #b5bbcc;
}
```

The source card adapts that cue at the app's readable heading/body scales:

```css
/* newUser.module.css — source-card rules only */
.heading { padding: 30px 18px 12px 12px; }

.titleText {
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 1.55px;
  color: var(--muted, #b5bbcc);
  text-align: left;
  text-decoration: none;
}

.main .body > p {
  margin: 0;
  font-family: inherit;
  font-weight: inherit;
  text-align: left;
  white-space: pre-wrap;
  user-select: text;
  /* Size, line-height and colour come from App.css's source-content rules. */
}

@media (max-width: 720px) {
  .titleText { font-size: 15px; }
}
```

The card's Poppins font import is removed. Its former title size was 16.8–27.2px, centred and underlined; prose was 13.6px/weight500/line-height1.85. Native controls, body spacing, text selection, reveal behavior, tile geometry and scenes retain their existing implementation.

Code links: [SourceSection](../src/components/sources/SourceSection.tsx) → [NewUserCard](../src/components/cards/newUserCard/NewUserCard.tsx) → [source typography](../src/components/cards/newUserCard/newUser.module.css); reference [SparkArt caption](../src/components/hero/SparkArt.module.css); [app styles](../src/App.css).
