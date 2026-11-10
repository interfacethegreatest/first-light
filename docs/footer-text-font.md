# Footer Text3D font

The decorative footer text uses the existing Helvetiker Regular typeface data bundled with installed Three.js **0.167.1**. No font was downloaded, regenerated, subsetted or otherwise changed, and no dependency upgrade was needed.

## Source and license

- Installed font: `node_modules/three/examples/fonts/helvetiker_regular.typeface.json`.
- Installed provenance: `node_modules/three/examples/fonts/README.md`, headed “MgOpen typefaces”, with its [archived source/license link](https://web.archive.org/web/20050528114140/https://ellak.gr/fonts/mgopen/index.en).
- Installed companion license: `node_modules/three/examples/fonts/LICENSE`.
- Self-hosted copies: [font JSON](../public/fonts/helvetiker_regular.typeface.json) and [LICENSE-helvetiker.txt](../public/fonts/LICENSE-helvetiker.txt), each byte-identical to its installed source.

The font is distributed under the **MAGENTA/MgOpen font license**, separately from Three.js's MIT code license. The complete companion license is retained verbatim, including its copyright, permission and warranty notices. It requires retaining the copyright and permission notice with distributed font copies; modified fonts must follow its MgOpen naming conditions; a typeface may be sold as part of a larger software package but not by itself. The file also retains the complete original embedded `original_font_information.license_description`, license URL and attribution metadata.

Embedded metadata identifies family **Helvetiker**, subfamily **Regular**, PostScript name `Helvetiker-Regular`, version “Version 1.00 2004 initial release”, and manufacturer/copyright holder Magenta Ltd. Both CSS style and weight are `normal`; outline resolution is 1000 units. The original license URL is `http://www.ellak.gr/fonts/MgOpen/license.html`. These metadata values were preserved rather than replaced with an inferred license.

## Verified local asset identities

| Public file | Bytes | SHA-256 |
| --- | ---: | --- |
| `fonts/helvetiker_regular.typeface.json` | 63,182 | `d5c5467690f74061179a292af83bd85c4c551e0f106b2af99714f11184c96981` |
| `fonts/LICENSE-helvetiker.txt` | 2,006 | `35e8279356d7890871c4fce804d157e3f21456a7311ef2caab5cb4705c71b6bd` |

The JSON contains 208 glyph entries. Every character required for **“Make learning tangible.”** is present: the thirteen distinct entries are `M`, `a`, `k`, `e`, space, `l`, `r`, `n`, `i`, `g`, `t`, `b`, and `.`. Each non-space character has outline data; space has an advance of 375 units and intentionally no outline. The text can therefore use this file without missing-glyph substitution.

## Runtime handoff

The canvas owner should load the self-hosted URL as:

```ts
`${import.meta.env.BASE_URL}fonts/helvetiker_regular.typeface.json`
```

This keeps the font beneath either the local root or the GitHub Pages base path. The font JSON is self-contained and needs no remote font service. Retain its license file with the public assets. Accessible DOM text and renderer loading/failure behavior belong to the footer scene implementation.

This verification covers font/license byte identity, parsed metadata, and required glyph outlines/advance. Browser HTTP loading, actual extruded rendering, responsive framing, lifecycle behavior and project tests/build remain for the coordinator's integration verification. No deployment result is claimed here.
