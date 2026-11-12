# First Light

Turn research findings into web applications, with a traceable path from evidence to implementation.

**Live application:** <https://interfacethegreatest.github.io/first-light/>

**Glass and HTML scene example:** <https://interfacethegreatest.github.io/first-light/examples/glass-panel-3d/>

**Transmission studies:** <https://interfacethegreatest.github.io/first-light/examples/glass-panel-3d/#transmission-studies>

This is a new local React + TypeScript + Vite starter. Its first research topic and application audience are still open. The included web workspace lets you record sources, link findings to implementation decisions, track progress, and export your records. It starts empty, without sample papers or claims.

## Run locally

Use Node.js 24 LTS (or Node.js 22.12+). With nvm, run `nvm use` first.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally <http://127.0.0.1:5173>. Keep using the same origin and port to access the same browser records.

## First research-to-application cycle

1. Copy [the research brief](templates/research-brief.md) into `docs/` and define the question, intended users, and observable application outcome.
2. Review the underlying evidence with [the  review](templates/-review.md). Record limitations and conflicting findings.
3. Add a source in the app. Link a specific finding to a proposed implementation.
4. Complete [the implementation decision](templates/implementation-decision.md), including measurable acceptance criteria, before building the feature.
5. Implement and verify the behavior. Record the actual results in the decision document; use the app to track progress.

`Validated` is a user-reported implementation status. It does not establish scientific validity. Follow [the research workflow](docs/research-workflow.md) for the distinction and review process.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run typecheck` | Check strict TypeScript types. |
| `npm test` | Run automated behavior tests once. |
| `npm run test:watch` | Run tests while making changes. |
| `npm run build` | Type-check and build into `dist/`. |
| `npm run preview` | Serve the built app locally. |
| `npm run check` | Run type checks, tests, and production build. |

## Project map

```text
src/
  App.tsx, App.css       Web workspace and forms
  workspace.ts          Domain types and validation
  useWorkspace.ts       Browser state, persistence, export
  main.tsx, index.css   Application entry and base styles
docs/                   Plan, architecture, research workflow
templates/              Research brief, review, decision record
tests/                  Behavior and persistence verification
```

See [the project plan](docs/project-plan.md) for requirements and acceptance criteria, [the architecture](docs/architecture.md) for technical boundaries, and [CONTRIBUTING.md](CONTRIBUTING.md) for the change workflow.

The [initial verification record](docs/verification.md) lists the checks performed and steps to repeat the browser workflow.

## Calendar star background

First Light uses the Three.js background from Calendar4, retaining its 7,500 stars, slow rotation, bloom, and black backdrop. The interface uses dark translucent surfaces to keep the background visible and the research forms readable. Reduced-motion preferences show a static scene; unavailable WebGL or a failed renderer download leaves a black background and a usable workspace.

See [the source and verification notes](docs/calendar-stars-provenance.md) and the [desktop](docs/previews/calendar-stars-desktop.png) and [mobile](docs/previews/calendar-stars-mobile.png) previews. This update was published with the user's approval through [the successful Pages workflow](https://github.com/interfacethegreatest/first-light/actions/runs/42620982549).

## Calendar interface animations

First Light also reuses Calendar4's spring panel entrances, gentle pointer tilt, rolling button labels, and slow border-color cycle. Focused fields remain steady, touch disables tilt, and reduced motion suppresses the new animation while preserving form values and focus.

Watch the [animation preview](docs/previews/calendar-motion-demo.mp4) and see [the source mapping and verification record](docs/calendar-motion-provenance.md). This update was published with the user's approval through [Pages workflow 42628705528](https://github.com/interfacethegreatest/first-light/actions/runs/42628705528).

## Three.js typography and reusable glass

The main page includes a simple glass **Research draft** panel below the workspace panels and a compact 3D text scene above the footer. The panel follows the original reference design: a regular HTML heading, description and native draft field over the existing Three.js glass surface. The draft is temporary and clears on reload; it is separate from saved research records. The reusable `ThreeDHeading` and bold, beveled footer renderer remain available. A separate [component example](https://interfacethegreatest.github.io/first-light/examples/glass-panel-3d/) demonstrates the reusable glass panel, mount/unmount hook, native HTML inside Drei's `Html`, gentle torus motion, and Calendar4's extracted input container with its outside-click hook. Both pages are included in the normal production build.

Each **Add ** activation appends all three -section boilerplates together: short, medium and long. They expand below the button using the existing parent-height and staggered reveal animations. These are session-only UI sections and do not save a research record or reset the  form.

See the [current change notes](docs/simple-glass--batches.md) and [complete component ](docs/component-catalog.md). Regenerate the and ZIP after edits with `node scripts/export-component-catalog.mjs`.

See the [footer text](docs/footer-3d-text.md), [glass panel](docs/glass-panel-3d.md) and [HTML scene](docs/html-glass-card.md) documentation for component code, attribution and verification. Drafts remain local to the example and do not write research records. Motion respects reduced-motion preferences, page visibility and form focus; unavailable WebGL retains native content.

The [glass and panes guide](docs/glass-and-panes-guide.md) explains CSS composition, native panes, decorative Three.js glass and the separate Drei `Html` scene. The header Moon now rotates around its Y axis at −0.12 radians per second; see [rotation options and checks](docs/moon-rotation.md). Its existing home action stays intact, and rotation pauses offscreen, in hidden tabs or with reduced motion enabled.

The two green indicators beside **Local** and **Stored in this browser** are now small textured Earth scenes using Calendar4's original model. Their reusable `EarthMark` component mirrors the Moon's lifecycle and spins around Y at −0.12 radians per second, pausing offscreen, in hidden tabs and for reduced motion. A shared 2,043,928-byte icon GLB uses a 1024×512 texture; the original assets and full-resolution GLB are preserved. See [the implementation and checks](docs/earth-indicators.md) and [asset provenance](docs/earth-asset-provenance.md). The Moon, cards, forms and other scenes remain intact.

Earth now shares the Moon's zoom-aware render-buffer resolution, replacing its former 1.5× pixel-density cap with the same event-driven 1–4× range. Indicator dimensions and assets stay unchanged. See [the exact code change and zoom checks](docs/earth-resolution.md).

The component example also contains two reusable transmission cards: a thick rounded glass panel, and a cinematic sphere/torus composition around bold extruded text. Their meshes and text share one scene for real shader-based refraction. Native controls adjust lettering, placement, glass text, optical settings, quality and motion. The gallery selects one active Canvas, reuses local assets and respects reduced motion, editing focus, visibility and mobile scrolling. See [implementation and verification](docs/transmission-scenes.md) and the [complete generation prompt](docs/transmission-scenes-generation-prompt.md). No dependencies were added.

The component example also includes [**individual glass objects**](https://interfacethegreatest.github.io/first-light/examples/glass-panel-3d/#glass-objects): a rotating torus and a single blank rounded panel. Each scene contains exactly one mesh, with its title and controls in the surrounding HTML card. Reusable mesh components expose rotation axis and radians per second; full cards add quality, optical settings, activity gates and a retry interface. Both galleries use brighter procedural studio lights and a broad front light, so glass reflects soft highlights without a room/city image. Scene annotation tags are hidden in the older transmission examples too. See [components, usage and verification](docs/isolated-glass-objects.md).

Both cards are also mounted on the [main page](https://interfacethegreatest.github.io/first-light/#glass-objects), below the original Research draft pane. They start at 0.25 rad/s around Y, with transmission 1 and thickness 0.41. The clarity update uses IOR 1.45, chromatic aberration 0.02 and roughness 0.03, with a procedural neutral backdrop for refraction. The cool grey tint and 1.25 lighting multiplier remain. See [the clarity changes and evidence](docs/transmission-reference-debug.md). The main footer's 3D “Make learning tangible.” text rotates around Y at 0.12 rad/s. Both cards and the footer pause with visibility/reduced-motion gates. Existing example defaults remain unchanged. See [the original App additions, layout and verification](docs/main-page-glass-objects.md).

Glass cards now avoid lighting-map recaptures during unrelated form typing, and Suns stop continuous rendering offscreen or in hidden tabs. The design and optical settings remain unchanged. An optional [device check](https://interfacethegreatest.github.io/first-light/performance/) measures actual submitted glass frames on your device without uploading the report or editing research records. Linux WebKit compatibility passed; physical Safari/Apple GPU smoothness awaits a device report. See [the measurement method, results and Safari instructions](docs/browser-device-performance.md).

The main torus/panel canvases now have transparent displayed backgrounds. Their original meshes and shared material remain intact. A separate [glass typography example](https://interfacethegreatest.github.io/first-light/examples/transparent-glass/) demonstrates reusable rounded 3D lettering, with a clearer text-specific optical preset and no backing panel or checkerboard. Its studio background is used only inside offscreen refraction captures; arbitrary page HTML is not refracted. See [components and verification](docs/transparent-glass.md). The normal Pages build includes this example.

## Storage and current limits

Records live in localStorage in one browser and origin, under `first-light.workspace.v1`. They are not saved to Git or shared between devices. Export JSON regularly. There is no import or deletion interface yet; keep important research reasoning in versioned documents as well. Do not put sensitive research data in this starter.

If stored data is corrupt or from an unsupported version, the app preserves the original and warns that new records are session-only. Storage write failures and detected changes from another tab also produce a warning; export before closing or reloading. The starter is intended for one active tab, not concurrent editing.

Each decision links to in the web workspace. Its document can cite additional evidence. No backend, authentication, collaboration, or AI service has been configured. The research domain and license remain open decisions. No license grant is included.

## Repository

The repository uses the `main` branch. A manually triggered [GitHub Pages workflow](.github/workflows/pages.yml) checks, builds, and publishes the app under the repository's name. See [the deployment guide](docs/github-pages.md) for setup and verification.

The [GitHub repository](https://github.com/interfacethegreatest/first-light) is connected and GitHub Pages is enabled. The app is published at <https://interfacethegreatest.github.io/first-light/>. Future deployments use the manual workflow described above.
