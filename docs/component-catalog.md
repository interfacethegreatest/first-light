# First Light: complete local component source snapshot

This is a **local working-tree snapshot, including uncommitted source**. It is not a deployment record or a claim about the live site.

Snapshot SHA-256: `c7dd30b65a4acedf36beea948dd4a5b4184e85530874216cdf4df95ecb47651e`. All **96 files under src/** plus **2 explicit compatibility/example entries** are included below in full and in the accompanying ZIP: **98 selected source files**, with no source truncation.

Additional files: `public/media/moon/Moon.jsx` and `examples/glass-panel-3d/main.tsx`. The example entry mounts the optional GlassPanelExample; it is supporting application code, not an additional React component.

The inventory lists component-bearing modules, their primary exports and any named component exports reviewed in this source tree. It does not equate every function with a React component. Hooks, template objects, styles, HTML boilerplate, domain logic and application entry files are included separately. Internal components/helpers remain in their complete parent module.

Application usage is literal relative-import reachability from `src/main.tsx`, including lazy/conditional imports. It describes code connections, not whether a component is mounted at a given moment. A compatibility re-export is identified separately rather than counted as a new implementation. Optional example status is stated only where supported by the source.

The ZIP contains exact bytes for every `src/...` file and the two explicitly listed source entries. Public model/font binaries, dependencies, tests and repository configuration remain in the project and are outside this source-only delivery. The manifest records every selected source filename, byte count and SHA-256. Code fences add a separator newline only when a source file lacks its final newline; the ZIP preserves that distinction exactly. Non-UTF-8 files, if any, are shown completely as base64 and labeled.

Regenerate with `node scripts/export-component-catalog.mjs`; verify without writing with `node scripts/export-component-catalog.mjs --verify`.

<a id="contents"></a>
## Contents

- [Component module inventory](#component-inventory)
- [Hooks and template objects](#support-inventory)
- [Application, workspace data and shared styles](#group-application)
  - [src/App.css](#file-src-app-css-60f5dcfc)
  - [src/App.tsx](#file-src-app-tsx-26ad4b83)
  - [src/index.css](#file-src-index-css-85da3662)
  - [src/main.tsx](#file-src-main-tsx-1cd8b187)
  - [src/styles/glass.css](#file-src-styles-glass-css-975b3a29)
  - [src/useWorkspace.ts](#file-src-useworkspace-ts-99acf686)
  - [src/workspace-contract.md](#file-src-workspace-contract-md-ef2e856e)
  - [src/workspace.ts](#file-src-workspace-ts-f008b068)
- [Header, hero and shared tile decoration](#group-header-hero)
  - [src/components/decorations/TileGrid.module.css](#file-src-components-decorations-tilegrid-module-css-2c841db1)
  - [src/components/decorations/TileGrid.tsx](#file-src-components-decorations-tilegrid-tsx-e0b092ce)
  - [src/components/header/HeaderExport.module.css](#file-src-components-header-headerexport-module-css-89cd3b52)
  - [src/components/header/HeaderExport.tsx](#file-src-components-header-headerexport-tsx-f32ff3f0)
  - [src/components/header/HeaderFrame.module.css](#file-src-components-header-headerframe-module-css-b61d3fa7)
  - [src/components/header/HeaderFrame.tsx](#file-src-components-header-headerframe-tsx-f82d57d5)
  - [src/components/header/HeaderTitle.module.css](#file-src-components-header-headertitle-module-css-c8d17dc9)
  - [src/components/header/HeaderTitle.tsx](#file-src-components-header-headertitle-tsx-6e8b2481)
  - [src/components/header/MoonBanner.module.css](#file-src-components-header-moonbanner-module-css-910bb8d8)
  - [src/components/header/MoonBanner.tsx](#file-src-components-header-moonbanner-tsx-91446d9d)
  - [src/components/header/headerFrameTemplate.tsx](#file-src-components-header-headerframetemplate-tsx-cd627118)
  - [src/components/header/headerTitleTemplate.tsx](#file-src-components-header-headertitletemplate-tsx-f4573482)
  - [src/components/hero/SparkArt.module.css](#file-src-components-hero-sparkart-module-css-61ef0c6c)
  - [src/components/hero/SparkArt.tsx](#file-src-components-hero-sparkart-tsx-cd70b642)
- [Source sections and reusable cards](#group-sources)
  - [src/components/cards/newUserCard/CardTiles.tsx](#file-src-components-cards-newusercard-cardtiles-tsx-c0d432f9)
  - [src/components/cards/newUserCard/NewUserCard.tsx](#file-src-components-cards-newusercard-newusercard-tsx-a9bb3792)
  - [src/components/cards/newUserCard/cardTiles.module.css](#file-src-components-cards-newusercard-cardtiles-module-css-58f31a0f)
  - [src/components/cards/newUserCard/newUser.module.css](#file-src-components-cards-newusercard-newuser-module-css-1bb7bfce)
  - [src/components/sources/AddSourceButton.tsx](#file-src-components-sources-addsourcebutton-tsx-b6039eb7)
  - [src/components/sources/AnimatedHeight.tsx](#file-src-components-sources-animatedheight-tsx-04002a1d)
  - [src/components/sources/SourceSection.tsx](#file-src-components-sources-sourcesection-tsx-5ae105a6)
  - [src/components/sources/SourceSections.tsx](#file-src-components-sources-sourcesections-tsx-8083ead8)
  - [src/components/sources/sourceSectionTemplate.tsx](#file-src-components-sources-sourcesectiontemplate-tsx-7f370d1e)
  - [src/components/sources/useSourceSections.ts](#file-src-components-sources-usesourcesections-ts-b79d0cd7)
- [Calendar motion and preferences](#group-motion)
  - [src/components/calendarMotion/CalendarButton.tsx](#file-src-components-calendarmotion-calendarbutton-tsx-59204ed1)
  - [src/components/calendarMotion/CalendarPanel.tsx](#file-src-components-calendarmotion-calendarpanel-tsx-72c451ec)
  - [src/components/calendarMotion/calendarMotion.css](#file-src-components-calendarmotion-calendarmotion-css-8053ff84)
  - [src/components/calendarMotion/useCalendarMotionPreferences.ts](#file-src-components-calendarmotion-usecalendarmotionpreferences-ts-d360d67a)
- [Moon mark and compatibility scene](#group-moon)
  - [src/components/misc/MoonMark/MoonMark.module.css](#file-src-components-misc-moonmark-moonmark-module-css-8925e135)
  - [src/components/misc/MoonMark/MoonMark.tsx](#file-src-components-misc-moonmark-moonmark-tsx-5568e43c)
  - [src/components/misc/MoonMark/MoonMarkCanvas.tsx](#file-src-components-misc-moonmark-moonmarkcanvas-tsx-dbaa12ed)
  - [src/components/misc/MoonMark/MoonModel.tsx](#file-src-components-misc-moonmark-moonmodel-tsx-ea70a7a5)
  - [src/components/misc/MoonMark/moonMarkTemplate.tsx](#file-src-components-misc-moonmark-moonmarktemplate-tsx-6159c5b4)
  - [src/components/misc/MoonMark/useMoonActivity.ts](#file-src-components-misc-moonmark-usemoonactivity-ts-4d569350)
  - [src/components/misc/MoonMark/useMoonResolution.ts](#file-src-components-misc-moonmark-usemoonresolution-ts-cf2037e9)
  - [src/components/react three fibre/moonScene/MoonScene.tsx](#file-src-components-react-three-fibre-moonscene-moonscene-tsx-2b0910dd)
  - [public/media/moon/Moon.jsx](#file-public-media-moon-moon-jsx-8bd8aa08)
- [Calendar Sun scene](#group-sun)
  - [src/components/react three fibre/sunScene/Sun.tsx](#file-src-components-react-three-fibre-sunscene-sun-tsx-3d493c6f)
  - [src/components/react three fibre/sunScene/SunScene.tsx](#file-src-components-react-three-fibre-sunscene-sunscene-tsx-9facbfc3)
  - [src/components/react three fibre/sunScene/styles.module.css](#file-src-components-react-three-fibre-sunscene-styles-module-css-072f41a8)
- [Star background](#group-stars)
  - [src/components/backgrounds/starsBackground/Model.tsx](#file-src-components-backgrounds-starsbackground-model-tsx-5e6c0430)
  - [src/components/backgrounds/starsBackground/Scene.tsx](#file-src-components-backgrounds-starsbackground-scene-tsx-0857e8dc)
  - [src/components/backgrounds/starsBackground/StarBackground.tsx](#file-src-components-backgrounds-starsbackground-starbackground-tsx-b6114512)
- [Shared glass surfaces and panes](#group-surfaces)
  - [src/components/glass/AppleGlass.module.css](#file-src-components-glass-appleglass-module-css-ab4ba2bc)
  - [src/components/glass/AppleGlassLens.tsx](#file-src-components-glass-appleglasslens-tsx-80cc41c4)
  - [src/components/glass/GlassySurface.module.css](#file-src-components-glass-glassysurface-module-css-15793ca8)
  - [src/components/glass/appleGlassBoilerplate.html](#file-src-components-glass-appleglassboilerplate-html-8d84c597)
  - [src/components/panes/PaneBackground.module.css](#file-src-components-panes-panebackground-module-css-b1828d9c)
  - [src/components/panes/PaneBackground.tsx](#file-src-components-panes-panebackground-tsx-6489588a)
- [Three.js glass panel and example](#group-glass-3d)
  - [src/components/glass-panel-3d/GlassMaterial.tsx](#file-src-components-glass-panel-3d-glassmaterial-tsx-92394bc8)
  - [src/components/glass-panel-3d/GlassPanel3D.module.css](#file-src-components-glass-panel-3d-glasspanel3d-module-css-8f2208a9)
  - [src/components/glass-panel-3d/GlassPanel3D.tsx](#file-src-components-glass-panel-3d-glasspanel3d-tsx-4820d591)
  - [src/components/glass-panel-3d/GlassPanelCanvas.tsx](#file-src-components-glass-panel-3d-glasspanelcanvas-tsx-84952dc4)
  - [src/components/glass-panel-3d/GlassPanelExample.module.css](#file-src-components-glass-panel-3d-glasspanelexample-module-css-5c79b0ac)
  - [src/components/glass-panel-3d/GlassPanelExample.tsx](#file-src-components-glass-panel-3d-glasspanelexample-tsx-73100257)
  - [src/components/glass-panel-3d/ResearchDraftPanel.module.css](#file-src-components-glass-panel-3d-researchdraftpanel-module-css-2a353987)
  - [src/components/glass-panel-3d/ResearchDraftPanel.tsx](#file-src-components-glass-panel-3d-researchdraftpanel-tsx-0a7c8199)
  - [src/components/glass-panel-3d/useGlassPanelMount.ts](#file-src-components-glass-panel-3d-useglasspanelmount-ts-156e0735)
  - [examples/glass-panel-3d/main.tsx](#file-examples-glass-panel-3d-main-tsx-00f7f408)
- [HTML glass card and scene helpers](#group-html-glass)
  - [src/components/html-glass-card/HtmlGlassCanvas.tsx](#file-src-components-html-glass-card-htmlglasscanvas-tsx-68256d4e)
  - [src/components/html-glass-card/HtmlGlassCard.module.css](#file-src-components-html-glass-card-htmlglasscard-module-css-655d53c6)
  - [src/components/html-glass-card/HtmlGlassCard.tsx](#file-src-components-html-glass-card-htmlglasscard-tsx-cc6acc96)
  - [src/components/html-glass-card/HtmlGlassCardContent.tsx](#file-src-components-html-glass-card-htmlglasscardcontent-tsx-bce2b899)
  - [src/components/html-glass-card/moveHtmlHost.ts](#file-src-components-html-glass-card-movehtmlhost-ts-fc90908f)
  - [src/components/html-glass-card/useHtmlSceneActivity.ts](#file-src-components-html-glass-card-usehtmlsceneactivity-ts-87b6214d)
- [Transmission materials and scene cards](#group-transmission)
  - [src/components/transmission/GlassCards.css](#file-src-components-transmission-glasscards-css-c731421e)
  - [src/components/transmission/GlassCards.tsx](#file-src-components-transmission-glasscards-tsx-26d03c88)
  - [src/components/transmission/GlassPrimitives.tsx](#file-src-components-transmission-glassprimitives-tsx-f38b34f5)
  - [src/components/transmission/GlassStudioEnvironment.tsx](#file-src-components-transmission-glassstudioenvironment-tsx-21c64c8f)
  - [src/components/transmission/TransmissionCanvas.tsx](#file-src-components-transmission-transmissioncanvas-tsx-a549c86f)
  - [src/components/transmission/transmissionAssets.ts](#file-src-components-transmission-transmissionassets-ts-aaaad7ce)
  - [src/components/transmission/transmissionTypes.ts](#file-src-components-transmission-transmissiontypes-ts-54133895)
  - [src/components/transmission/useTransmissionActivity.ts](#file-src-components-transmission-usetransmissionactivity-ts-6c4da281)
- [Isolated glass objects and rotation](#group-glass-objects)
  - [src/components/glass-objects/GlassObjectCanvas.tsx](#file-src-components-glass-objects-glassobjectcanvas-tsx-0ec44c1a)
  - [src/components/glass-objects/GlassObjectCards.css](#file-src-components-glass-objects-glassobjectcards-css-c8823ea3)
  - [src/components/glass-objects/GlassObjectCards.tsx](#file-src-components-glass-objects-glassobjectcards-tsx-6093911e)
  - [src/components/glass-objects/GlassPanelObject.tsx](#file-src-components-glass-objects-glasspanelobject-tsx-4f9bd3ee)
  - [src/components/glass-objects/GlassTorusObject.tsx](#file-src-components-glass-objects-glasstorusobject-tsx-e34da6e7)
  - [src/components/glass-objects/glassObjectSceneTypes.ts](#file-src-components-glass-objects-glassobjectscenetypes-ts-1e871685)
  - [src/components/glass-objects/glassObjectTypes.ts](#file-src-components-glass-objects-glassobjecttypes-ts-e1d62c5f)
  - [src/components/glass-objects/useObjectRotation.ts](#file-src-components-glass-objects-useobjectrotation-ts-15db3c06)
- [Modal input container and outside-click hook](#group-input)
  - [src/components/input/ModalInput/ModalInputContainer.module.css](#file-src-components-input-modalinput-modalinputcontainer-module-css-6254925b)
  - [src/components/input/ModalInput/ModalInputContainer.tsx](#file-src-components-input-modalinput-modalinputcontainer-tsx-4e26eac1)
  - [src/components/input/outsideClick.tsx](#file-src-components-input-outsideclick-tsx-418bbec8)
- [3D typography and footer scene](#group-typography)
  - [src/components/typography/FooterTextCanvas.tsx](#file-src-components-typography-footertextcanvas-tsx-619ac822)
  - [src/components/typography/FooterTextScene.module.css](#file-src-components-typography-footertextscene-module-css-7ee8c7ed)
  - [src/components/typography/FooterTextScene.tsx](#file-src-components-typography-footertextscene-tsx-8ca2a2d9)
  - [src/components/typography/ThreeDHeading.module.css](#file-src-components-typography-threedheading-module-css-5f49d170)
  - [src/components/typography/ThreeDHeading.tsx](#file-src-components-typography-threedheading-tsx-c460028a)
  - [src/components/typography/useFooterTextActivity.ts](#file-src-components-typography-usefootertextactivity-ts-7e8a705d)

<a id="component-inventory"></a>
## Component module inventory

47 component-bearing or compatibility modules; 2 compatibility re-exports. This is a module inventory, not a speculative total of React functions.

| Module | Primary / named exports | Complete source | Application use |
| --- | --- | --- | --- |
| App | App | [src/App.tsx](#file-src-app-tsx-26ad4b83) | Imported from application entry (including lazy/conditional paths) |
| Model | Model | [src/components/backgrounds/starsBackground/Model.tsx](#file-src-components-backgrounds-starsbackground-model-tsx-5e6c0430) | Imported from application entry (including lazy/conditional paths) |
| Scene | Scene | [src/components/backgrounds/starsBackground/Scene.tsx](#file-src-components-backgrounds-starsbackground-scene-tsx-0857e8dc) | Imported from application entry (including lazy/conditional paths) |
| StarBackground | StarBackground | [src/components/backgrounds/starsBackground/StarBackground.tsx](#file-src-components-backgrounds-starsbackground-starbackground-tsx-b6114512) | Imported from application entry (including lazy/conditional paths) |
| CalendarButton | CalendarButton | [src/components/calendarMotion/CalendarButton.tsx](#file-src-components-calendarmotion-calendarbutton-tsx-59204ed1) | Imported from application entry (including lazy/conditional paths) |
| CalendarPanel | CalendarPanel | [src/components/calendarMotion/CalendarPanel.tsx](#file-src-components-calendarmotion-calendarpanel-tsx-72c451ec) | Imported from application entry (including lazy/conditional paths) |
| CardTiles | CardTiles | [src/components/cards/newUserCard/CardTiles.tsx](#file-src-components-cards-newusercard-cardtiles-tsx-c0d432f9) | Imported from application entry (including lazy/conditional paths) |
| NewUserCard | NewUserCard | [src/components/cards/newUserCard/NewUserCard.tsx](#file-src-components-cards-newusercard-newusercard-tsx-a9bb3792) | Imported from application entry (including lazy/conditional paths) |
| TileGrid | TileGrid | [src/components/decorations/TileGrid.tsx](#file-src-components-decorations-tilegrid-tsx-e0b092ce) | Imported from application entry (including lazy/conditional paths) |
| AppleGlassLens | AppleGlassLens | [src/components/glass/AppleGlassLens.tsx](#file-src-components-glass-appleglasslens-tsx-80cc41c4) | Imported from application entry (including lazy/conditional paths) |
| GlassObjectCanvas | GlassObjectCanvas | [src/components/glass-objects/GlassObjectCanvas.tsx](#file-src-components-glass-objects-glassobjectcanvas-tsx-0ec44c1a) | Imported from application entry (including lazy/conditional paths) |
| GlassObjectCards | see full module; GlassTorusCard; GlassPanelCard; GlassObjectGallery | [src/components/glass-objects/GlassObjectCards.tsx](#file-src-components-glass-objects-glassobjectcards-tsx-6093911e) | Imported from application entry (including lazy/conditional paths) |
| GlassPanelObject | see full module; GlassPanelObject | [src/components/glass-objects/GlassPanelObject.tsx](#file-src-components-glass-objects-glasspanelobject-tsx-4f9bd3ee) | Imported from application entry (including lazy/conditional paths) |
| GlassTorusObject | see full module; GlassTorusObject | [src/components/glass-objects/GlassTorusObject.tsx](#file-src-components-glass-objects-glasstorusobject-tsx-e34da6e7) | Imported from application entry (including lazy/conditional paths) |
| GlassMaterial | GlassMaterial | [src/components/glass-panel-3d/GlassMaterial.tsx](#file-src-components-glass-panel-3d-glassmaterial-tsx-92394bc8) | Imported from application entry (including lazy/conditional paths) |
| GlassPanel3D | GlassPanel3D | [src/components/glass-panel-3d/GlassPanel3D.tsx](#file-src-components-glass-panel-3d-glasspanel3d-tsx-4820d591) | Imported from application entry (including lazy/conditional paths) |
| GlassPanelCanvas | GlassPanelCanvas | [src/components/glass-panel-3d/GlassPanelCanvas.tsx](#file-src-components-glass-panel-3d-glasspanelcanvas-tsx-84952dc4) | Imported from application entry (including lazy/conditional paths) |
| GlassPanelExample | GlassPanelExample | [src/components/glass-panel-3d/GlassPanelExample.tsx](#file-src-components-glass-panel-3d-glasspanelexample-tsx-73100257) | Optional example; not imported from application entry |
| ResearchDraftPanel | ResearchDraftPanel | [src/components/glass-panel-3d/ResearchDraftPanel.tsx](#file-src-components-glass-panel-3d-researchdraftpanel-tsx-0a7c8199) | Imported from application entry (including lazy/conditional paths) |
| HeaderExport | HeaderExport | [src/components/header/HeaderExport.tsx](#file-src-components-header-headerexport-tsx-f32ff3f0) | Imported from application entry (including lazy/conditional paths) |
| HeaderFrame | HeaderFrame | [src/components/header/HeaderFrame.tsx](#file-src-components-header-headerframe-tsx-f82d57d5) | Imported from application entry (including lazy/conditional paths) |
| HeaderTitle | HeaderTitle | [src/components/header/HeaderTitle.tsx](#file-src-components-header-headertitle-tsx-6e8b2481) | Imported from application entry (including lazy/conditional paths) |
| MoonBanner | MoonBanner | [src/components/header/MoonBanner.tsx](#file-src-components-header-moonbanner-tsx-91446d9d) | Imported from application entry (including lazy/conditional paths) |
| SparkArt | SparkArt | [src/components/hero/SparkArt.tsx](#file-src-components-hero-sparkart-tsx-cd70b642) | Imported from application entry (including lazy/conditional paths) |
| HtmlGlassCanvas | HtmlGlassCanvas | [src/components/html-glass-card/HtmlGlassCanvas.tsx](#file-src-components-html-glass-card-htmlglasscanvas-tsx-68256d4e) | Standalone/reusable; not imported from application entry |
| HtmlGlassCard | HtmlGlassCard | [src/components/html-glass-card/HtmlGlassCard.tsx](#file-src-components-html-glass-card-htmlglasscard-tsx-cc6acc96) | Standalone/reusable; not imported from application entry |
| HtmlGlassCardContent | HtmlGlassCardContent | [src/components/html-glass-card/HtmlGlassCardContent.tsx](#file-src-components-html-glass-card-htmlglasscardcontent-tsx-bce2b899) | Standalone/reusable; not imported from application entry |
| ModalInputContainer | ModalInputContainer | [src/components/input/ModalInput/ModalInputContainer.tsx](#file-src-components-input-modalinput-modalinputcontainer-tsx-4e26eac1) | Standalone/reusable; not imported from application entry |
| MoonMark | MoonMark; MoonCredit | [src/components/misc/MoonMark/MoonMark.tsx](#file-src-components-misc-moonmark-moonmark-tsx-5568e43c) | Imported from application entry (including lazy/conditional paths) |
| MoonMarkCanvas | MoonMarkCanvas | [src/components/misc/MoonMark/MoonMarkCanvas.tsx](#file-src-components-misc-moonmark-moonmarkcanvas-tsx-dbaa12ed) | Imported from application entry (including lazy/conditional paths) |
| MoonModel | MoonModel | [src/components/misc/MoonMark/MoonModel.tsx](#file-src-components-misc-moonmark-moonmodel-tsx-ea70a7a5) | Imported from application entry (including lazy/conditional paths) |
| PaneBackground | PaneBackground | [src/components/panes/PaneBackground.tsx](#file-src-components-panes-panebackground-tsx-6489588a) | Imported from application entry (including lazy/conditional paths) |
| MoonScene | default re-export of MoonMarkCanvas | [src/components/react three fibre/moonScene/MoonScene.tsx](#file-src-components-react-three-fibre-moonscene-moonscene-tsx-2b0910dd) | Standalone/reusable; not imported from application entry |
| Sun | Model | [src/components/react three fibre/sunScene/Sun.tsx](#file-src-components-react-three-fibre-sunscene-sun-tsx-3d493c6f) | Imported from application entry (including lazy/conditional paths) |
| SunScene | SunScene | [src/components/react three fibre/sunScene/SunScene.tsx](#file-src-components-react-three-fibre-sunscene-sunscene-tsx-9facbfc3) | Imported from application entry (including lazy/conditional paths) |
| AddSourceButton | AddSourceButton | [src/components/sources/AddSourceButton.tsx](#file-src-components-sources-addsourcebutton-tsx-b6039eb7) | Imported from application entry (including lazy/conditional paths) |
| AnimatedHeight | AnimatedHeight | [src/components/sources/AnimatedHeight.tsx](#file-src-components-sources-animatedheight-tsx-04002a1d) | Imported from application entry (including lazy/conditional paths) |
| SourceSection | SourceSection | [src/components/sources/SourceSection.tsx](#file-src-components-sources-sourcesection-tsx-5ae105a6) | Imported from application entry (including lazy/conditional paths) |
| SourceSections | SourceSections | [src/components/sources/SourceSections.tsx](#file-src-components-sources-sourcesections-tsx-8083ead8) | Imported from application entry (including lazy/conditional paths) |
| GlassCards | see full module; RoundedTransmissionCard; CinematicTransmissionCard; TransmissionGallery | [src/components/transmission/GlassCards.tsx](#file-src-components-transmission-glasscards-tsx-26d03c88) | Standalone/reusable; not imported from application entry |
| GlassPrimitives | see full module; TransmissionSurface; GlassSphere; GlassTorus | [src/components/transmission/GlassPrimitives.tsx](#file-src-components-transmission-glassprimitives-tsx-f38b34f5) | Imported from application entry (including lazy/conditional paths) |
| GlassStudioEnvironment | see full module; GlassStudioEnvironment | [src/components/transmission/GlassStudioEnvironment.tsx](#file-src-components-transmission-glassstudioenvironment-tsx-21c64c8f) | Imported from application entry (including lazy/conditional paths) |
| TransmissionCanvas | TransmissionCanvas | [src/components/transmission/TransmissionCanvas.tsx](#file-src-components-transmission-transmissioncanvas-tsx-a549c86f) | Standalone/reusable; not imported from application entry |
| FooterTextCanvas | FooterTextCanvas | [src/components/typography/FooterTextCanvas.tsx](#file-src-components-typography-footertextcanvas-tsx-619ac822) | Imported from application entry (including lazy/conditional paths) |
| FooterTextScene | FooterTextScene | [src/components/typography/FooterTextScene.tsx](#file-src-components-typography-footertextscene-tsx-8ca2a2d9) | Imported from application entry (including lazy/conditional paths) |
| ThreeDHeading | ThreeDHeading | [src/components/typography/ThreeDHeading.tsx](#file-src-components-typography-threedheading-tsx-c460028a) | Standalone/reusable; not imported from application entry |
| Moon | default re-export of MoonModel | [public/media/moon/Moon.jsx](#file-public-media-moon-moon-jsx-8bd8aa08) | Standalone/reusable; not imported from application entry |

<a id="support-inventory"></a>
## Hooks and template objects

| Kind | Export | Complete source |
| --- | --- | --- |
| Hook | useCalendarMotionPreferences | [src/components/calendarMotion/useCalendarMotionPreferences.ts](#file-src-components-calendarmotion-usecalendarmotionpreferences-ts-d360d67a) |
| Hook | useObjectRotation | [src/components/glass-objects/useObjectRotation.ts](#file-src-components-glass-objects-useobjectrotation-ts-15db3c06) |
| Hook | useGlassPanelMount | [src/components/glass-panel-3d/useGlassPanelMount.ts](#file-src-components-glass-panel-3d-useglasspanelmount-ts-156e0735) |
| Hook | useHtmlSceneActivity | [src/components/html-glass-card/useHtmlSceneActivity.ts](#file-src-components-html-glass-card-usehtmlsceneactivity-ts-87b6214d) |
| Hook | useOutsideClick | [src/components/input/outsideClick.tsx](#file-src-components-input-outsideclick-tsx-418bbec8) |
| Hook | useMoonActivity | [src/components/misc/MoonMark/useMoonActivity.ts](#file-src-components-misc-moonmark-usemoonactivity-ts-4d569350) |
| Hook | useMoonResolution | [src/components/misc/MoonMark/useMoonResolution.ts](#file-src-components-misc-moonmark-usemoonresolution-ts-cf2037e9) |
| Hook | useSourceSections | [src/components/sources/useSourceSections.ts](#file-src-components-sources-usesourcesections-ts-b79d0cd7) |
| Hook | useTransmissionActivity | [src/components/transmission/useTransmissionActivity.ts](#file-src-components-transmission-usetransmissionactivity-ts-6c4da281) |
| Hook | useFooterTextActivity | [src/components/typography/useFooterTextActivity.ts](#file-src-components-typography-usefootertextactivity-ts-7e8a705d) |
| Hook | useWorkspace | [src/useWorkspace.ts](#file-src-useworkspace-ts-99acf686) |
| Template | headerFrameTemplate | [src/components/header/headerFrameTemplate.tsx](#file-src-components-header-headerframetemplate-tsx-cd627118) |
| Template | headerTitleTemplate | [src/components/header/headerTitleTemplate.tsx](#file-src-components-header-headertitletemplate-tsx-f4573482) |
| Template | moonMarkTemplate | [src/components/misc/MoonMark/moonMarkTemplate.tsx](#file-src-components-misc-moonmark-moonmarktemplate-tsx-6159c5b4) |
| Template | sourceSectionTemplate | [src/components/sources/sourceSectionTemplate.tsx](#file-src-components-sources-sourcesectiontemplate-tsx-7f370d1e) |

<a id="group-application"></a>
## Application, workspace data and shared styles

<a id="file-src-app-css-60f5dcfc"></a>
### src/App.css

16865 bytes · SHA-256 `eb5a3b96cd0f8acb0ea53138ff4f933e80342e40cb5859ad2198683bdbdcca5f` · utf8

```css
:root {
  color-scheme:dark;
  font-family:Inter,"Segoe UI",Arial,sans-serif;
  color:#f3f4f7;
  background:#000000;
  font-synthesis:none;
  text-rendering:optimizeLegibility;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  font-weight:400;
  --ink:#f3f4f7;
  --muted:#b5bbcc;
  --line:rgba(225, 231, 255, 0.16);
  --accent:#ff9470;
  --paper:rgba(15, 17, 26, 0.84);
  --sage:rgba(170, 188, 160, 0.08);
}
* {
  box-sizing:border-box
}
body {
  margin:0;
  min-width:320px
}
button,input,textarea,select {
  font:inherit
}
button,a,input,textarea,select {
  -webkit-tap-highlight-color:transparent
}
button {
  cursor:pointer
}
a {
  color:inherit
}
button:disabled {
  cursor:not-allowed;
  opacity:.45
}
input,textarea,select {
  min-width:0
}
button:focus-visible,a:focus-visible {
  outline:3px solid #ffaf86;
  outline-offset:4px
}
input:focus-visible,textarea:focus-visible,select:focus-visible {
  outline:2px solid #ff9470;
  outline-offset:2px
}
button,select {
  touch-action:manipulation
}
textarea {
  resize:vertical
}
h1,h2,h3,h4,h5,p {
  margin:0
}
ul {
  padding:0;
  margin:0;
  list-style:none
}
.skip-link {
  position:fixed;
  z-index:10;
  top:8px;
  left:8px;
  transform:translateY(-150%);
  padding:12px;
  background:#20232f;
  color:white
}
.skip-link:focus {
  transform:translateY(0)
}
.brand-dot {
  color:var(--accent)
}
.small-dot {
  width:5px;
  height:5px;
  background:#c2d7ad;
  border-radius:50%;
  display:inline-block
}
.button {
  border:0;
  border-radius:5px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:20px;
  font-size:12px;
  font-weight:600;
  min-height:41px;
  padding:11px 16px;
  transition:background .15s,color .15s
}
.button-secondary {
  background:transparent;
  border:1px solid rgba(225, 231, 255, 0.22);
  gap:9px
}
.button-secondary:hover {
  background:rgba(255, 255, 255, 0.08)
}
.button-primary {
  background:var(--ink);
  color:#0c0e17
}
.button-primary:hover:enabled {
  background:#d6dce8
}
.button-primary>span {
  font-weight:400;
  font-size:19px;
  line-height:12px
}
.page-shell {
  max-width:1420px;
  padding:0 5.5%;
  margin:auto
}
.hero {
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:56px 0 41px;
  gap:40px
}
.hero-copy {
  max-width:685px
}
.eyebrow {
  font-size:9px;
  font-weight:650;
  letter-spacing:1.6px;
  color:#b5bbcc;
  display:flex;
  align-items:center;
  gap:9px
}
.tiny-line {
  width:21px;
  height:1px;
  background:var(--accent)
}
h1 {
  font-size:clamp(38px,4.1vw,59px);
  font-weight:500;
  line-height:1.12;
  letter-spacing:-2.7px;
  margin:18px 0 19px
}
h1>span {
  color:#b5bbcc
}
.hero-description {
  max-width:480px;
  font-size:13px;
  line-height:1.85;
  color:#c0c3ce
}
.workflow-strip {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  border-top:1px solid var(--line);
  border-bottom:1px solid var(--line);
  padding:20px 0;
  font-size:11px;
  color:#b5bbcc
}
.workflow-strip>span {
  display:flex;
  gap:10px;
  align-items:center;
  white-space:nowrap
}
.workflow-strip b {
  font-size:9px;
  font-weight:500;
  color:#b5bbcc
}
.workflow-strip>svg {
  color:#b9c2d4;
  width:14px;
  flex-shrink:0
}
.workspace-heading {
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  margin:39px 0 21px;
  scroll-margin-top:20px
}
.workspace-heading h2 {
  font-size:25px;
  letter-spacing:-.7px;
  font-weight:500;
  margin-top:8px
}
.privacy-note {
  display:flex;
  align-items:center;
  gap:7px;
  font-size:10px;
  color:#b5bbcc;
  margin-bottom:3px
}
.stats-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  overflow:hidden;
  margin-bottom:24px
}
.stat {
  display:flex;
  flex-direction:column;
  padding:21px 25px 19px
}
.stat+.stat {
  border-left:1px solid var(--line)
}
.stat-label {
  font-size:11px;
  color:#b5bbcc
}
.stat-value {
  font-size:33px;
  letter-spacing:-1px;
  line-height:1.2;
  margin:8px 0 5px;
  font-weight:450;
  display:flex;
  align-items:center;
  justify-content:space-between
}
.stat-spark {
  color:#b3c5a6;
  font-size:30px;
  margin-right:3px
}
.stat-detail {
  font-size:9px;
  color:#b5bbcc
}
.workspace-grid {
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.56fr);
  gap:24px;
  align-items:start
}
.glass-workspace-section {
  margin-top:32px;
  min-width:0;
}
.main-glass-objects {
  display:grid;
  grid-template-columns:minmax(0,1fr);
  gap:24px;
  margin-top:32px;
  min-width:0;
  scroll-margin-top:24px;
  align-items:start;
}
@media (min-width:1000px) {
  .main-glass-objects {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
.panel,
.workspace-panel-surface,
.stats-grid,
.decision-card,
.next-step {
  position: relative;
  isolation: isolate;
}

.panel {
  overflow:hidden
}
.panel-heading {
  display:flex;
  align-items:center;
  gap:13px;
  padding:23px 24px;
  border-bottom:1px solid var(--line)
}
.step-number {
  font-size:10px;
  color:#b5bbcc;
  border:1px solid rgba(225, 231, 255, 0.18);
  border-radius:5px;
  padding:8px
}
.panel-heading h3 {
  font-size:14px;
  font-weight:600;
  letter-spacing:-.2px
}
.panel-heading p {
  font-size:10px;
  color:#b5bbcc;
  margin-top:5px;
  line-height:1.6
}
.entry-form {
  padding:24px;
  display:flex;
  flex-direction:column;
  gap:17px
}
.field {
  display:flex;
  flex-direction:column;
  gap:8px;
  min-width:0
}
.field label {
  font-size:11px;
  font-weight:550;
  color:#d7dbe6
}
.field label>span:not(.optional) {
  color:#ff9470
}
.optional {
  font-weight:400;
  color:#b5bbcc;
  font-size:10px;
  margin-left:5px
}
.field input,.field textarea,.field select,.status-control select {
  padding:11px 12px;
  font-size:11px;
  line-height:1.65;
  max-width:100%;
  width:100%
}
.field input::placeholder,.field textarea::placeholder {
  color:#b5bbcc;
  opacity:1
}
.field textarea {
  min-height:76px
}
.field select {
  padding-right:28px;
  cursor:pointer
}
.field select:disabled {
  cursor:not-allowed
}
.field-hint {
  font-size:9px;
  color:#b5bbcc;
  line-height:1.6
}
.source-panel .entry-form>.button {
  align-self:flex-start;
  min-width:132px
}
.form-error {
  color:#ffb39a;
  background:rgba(112, 41, 29, 0.40);
  padding:10px 12px;
  border-radius:4px;
  font-size:11px;
  line-height:1.6
}
.form-success {
  font-size:10px;
  color:#b4dfaa;
  line-height:1.6
}
.form-success:empty {
  position:absolute;
  width:1px;
  height:1px;
  overflow:hidden;
  clip-path:inset(50%);
  white-space:nowrap
}
.library-section,.decisions-section {
  border-top:1px solid var(--line);
  padding:23px 24px
}
.list-heading {
  display:flex;
  align-items:center;
  gap:9px
}
.list-heading h4 {
  font-size:10px;
  font-weight:600;
  color:#b5bbcc
}
.list-heading>span {
  font-size:9px;
  color:#b5bbcc;
  min-width:19px;
  height:19px;
  background:rgba(255, 255, 255, 0.08);
  border-radius:4px;
  display:inline-flex;
  align-items:center;
  justify-content:center
}
.empty-state {
  text-align:center;
  display:flex;
  align-items:center;
  flex-direction:column
}
.source-empty {
  padding:35px 8px 18px
}
.empty-symbol {
  width:35px;
  height:35px;
  border:1px solid rgba(225, 231, 255, 0.18);
  border-radius:8px;
  color:#b9c1d0;
  display:flex;
  justify-content:center;
  align-items:center;
  font-size:21px;
  margin-bottom:16px
}
.empty-state h4 {
  font-size:12px;
  font-weight:500;
  color:#d0d5e1;
  letter-spacing:-.1px
}
.empty-state p {
  font-size:10px;
  color:#b5bbcc;
  line-height:1.8;
  max-width:310px;
  margin:9px auto 0
}
.source-list {
  margin-top:15px
}
.source-list>li {
  display:flex;
  gap:12px;
  padding:17px 0;
  border-top:1px solid rgba(225, 231, 255, 0.12)
}
.source-index {
  font-size:9px;
  color:#b5bbcc;
  padding-top:3px
}
.source-content {
  min-width:0;
  flex:1
}
.source-content>a {
  font-size:12px;
  font-weight:550;
  line-height:1.6;
  text-decoration:none;
  display:flex;
  gap:10px;
  justify-content:space-between;
  align-items:flex-start;
  overflow-wrap:anywhere
}
.source-content>a:hover {
  text-decoration:underline
}
.source-content>a>svg {
  flex-shrink:0;
  margin-top:2px;
  color:#b5bbcc
}
.source-host {
  font-size:9px;
  display:block;
  color:#b5bbcc;
  margin-top:3px;
  overflow-wrap:anywhere
}
.source-content>p {
  font-size:10px;
  line-height:1.75;
  color:#c0c5d3;
  margin-top:9px;
  white-space:pre-wrap;
  overflow-wrap:anywhere
}
.decision-field-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px
}
.decision-field-grid textarea {
  min-height:111px
}
.decision-form-footer {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px
}
.decision-empty {
  padding:37px 20px 27px
}
.empty-orbit {
  display:flex;
  align-items:center;
  gap:14px;
  font-size:16px;
  color:#bcc4d5;
  margin-bottom:20px
}
.empty-orbit>span:first-child {
  height:25px;
  width:25px;
  border:1px solid rgba(225, 231, 255, 0.22);
  border-radius:50%;
  background:rgba(255, 255, 255, 0.04)
}
.empty-orbit>span:last-child {
  height:25px;
  width:25px;
  border:1px solid rgba(225, 231, 255, 0.22);
  border-radius:5px;
  background:rgba(255, 255, 255, 0.04)
}
.empty-tag {
  font-size:7px;
  color:#b5bbcc;
  letter-spacing:1.4px;
  border:1px solid rgba(225, 231, 255, 0.16);
  padding:6px 9px;
  border-radius:3px;
  margin-top:18px
}
.validation-note {
  font-size:9px;
  color:#b5bbcc;
  line-height:1.8;
  border-top:1px solid rgba(225, 231, 255, 0.12);
  margin-top:10px;
  padding-top:16px
}
.decision-list {
  display:flex;
  flex-direction:column;
  gap:13px;
  margin-top:19px
}
.decision-card {
  padding:19px
}
.decision-card-top {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:17px
}
.decision-id {
  font-size:8px;
  color:#b5bbcc;
  letter-spacing:1px
}
.status-badge {
  font-size:8px;
  display:inline-flex;
  align-items:center;
  gap:5px;
  border-radius:4px;
  padding:5px 7px;
  background:rgba(211, 218, 245, 0.12);
  color:#cdd2e0
}
.status-badge>span {
  width:4px;
  height:4px;
  border-radius:50%;
  background:currentColor
}
.status-building {
  color:#ffc192;
  background:rgba(170, 97, 39, 0.20)
}
.status-validated {
  color:#b8dfb1;
  background:rgba(93, 138, 75, 0.23)
}
.decision-card h5 {
  text-transform:uppercase;
  font-size:8px;
  letter-spacing:.8px;
  font-weight:550;
  color:#b5bbcc;
  margin-bottom:6px
}
.decision-text {
  font-size:11px;
  line-height:1.8;
  white-space:pre-wrap;
  overflow-wrap:anywhere
}
.implementation-block {
  margin-top:13px;
  padding-top:13px;
  border-top:1px solid rgba(225, 231, 255, 0.12)
}
.decision-card-bottom {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
  margin-top:18px;
  padding-top:15px;
  border-top:1px solid rgba(225, 231, 255, 0.12)
}
.decision-source-link {
  display:flex;
  gap:6px;
  align-items:center;
  font-size:9px;
  line-height:1.6;
  color:#b5bbcc;
  text-decoration:none;
  overflow-wrap:anywhere;
  min-width:0
}
.decision-source-link:hover {
  text-decoration:underline
}
.decision-source-link>svg {
  flex-shrink:0;
  width:13px
}
.status-control {
  font-size:9px;
  display:flex;
  gap:8px;
  align-items:center;
  color:#b5bbcc;
  flex-shrink:0
}
.status-control select {
  font-size:9px;
  min-height:34px;
  padding:6px;
  width:auto;
  min-width:84px
}
.notice {
  padding:13px 17px;
  border:1px solid rgba(246, 196, 100, 0.30);
  border-radius:5px;
  font-size:11px;
  line-height:1.8;
  margin-bottom:16px
}
.notice-warning {
  background:rgba(117, 77, 20, 0.35);
  color:#ffd59d
}
.notice-error {
  background:rgba(112, 41, 29, 0.40);
  color:#ffb39a;
  border-color:rgba(255, 140, 105, 0.30)
}
.workspace-feedback {
  font-size:10px;
  color:#b5dfab;
  line-height:1.7;
  margin-bottom:15px
}
.workspace-feedback:empty {
  position:absolute;
  width:1px;
  height:1px;
  overflow:hidden;
  clip-path:inset(50%);
  white-space:nowrap
}
.next-step {
  display:flex;
  align-items:center;
  gap:18px;
  padding:22px 25px;
  margin-top:25px
}
.next-step-icon {
  font-size:29px;
  color:#b7c3a8
}
.next-step h3 {
  font-size:12px;
  font-weight:550;
  letter-spacing:-.1px
}
.next-step p {
  font-size:10px;
  color:#b5bbcc;
  line-height:1.8;
  margin-top:5px;
  max-width:810px
}
.site-footer {
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:30px 0 35px;
  gap:20px
}
.site-footer>span {
  font-size:16px;
  letter-spacing:-.6px;
  font-weight:600;
  white-space:nowrap
}
.footer-tagline {
  font-size:9px;
  font-weight:400;
  color:#b5bbcc;
  letter-spacing:0;
  margin-left:17px
}
.site-footer p {
  font-size:9px;
  color:#b5bbcc;
  line-height:1.7;
  text-align:right
}
@media(max-width:1000px) {
  .page-shell {
    padding:0 4%
  }
  .workspace-grid {
    grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);
    gap:17px
  }
  .entry-form,.panel-heading,.library-section,.decisions-section {
    padding:20px
  }
  .decision-field-grid {
    grid-template-columns:1fr
  }
  .decision-field-grid textarea {
    min-height:90px
  }
  .workflow-strip {
    font-size:10px;
    gap:9px
  }
  .workflow-strip>span {
    gap:7px
  }
  .decision-form-footer {
    align-items:flex-start;
    flex-direction:column;
    gap:13px
  }
  .decision-form-footer>.button {
    align-self:flex-end
  }
  .decision-card-bottom {
    flex-wrap:wrap
  }
  .source-panel .entry-form>.button {
    min-height:41px
  }
}
@media(max-width:720px) {
  .page-shell {
    padding:0 5%
  }
  .hero {
    padding:37px 0 30px;
    gap:10px
  }
  .hero-copy {
    position:relative;
    z-index:1
  }
  .eyebrow {
    font-size:8px;
    letter-spacing:1.1px
  }
  h1 {
    font-size:43px;
    letter-spacing:-2px;
    margin-top:17px
  }
  .hero-description {
    font-size:12px;
    max-width:390px
  }
  .workflow-strip {
    display:grid;
    grid-template-columns:1fr 14px 1fr;
    gap:16px 11px;
    padding:18px 0;
    max-width:100%
  }
  .workflow-strip>svg:nth-of-type(2) {
    display:none
  }
  .workflow-strip>span {
    font-size:10px
  }
  .workflow-strip>svg {
    justify-self:center
  }
  .workspace-heading {
    margin-top:30px
  }
  .workspace-heading h2 {
    font-size:23px
  }
  .privacy-note {
    font-size:9px
  }
  .stats-grid {
    margin-bottom:18px
  }
  .stat {
    padding:15px 12px
  }
  .stat-label {
    font-size:9px;
    min-height:27px;
    line-height:1.5
  }
  .stat-value {
    font-size:29px;
    margin-top:4px
  }
  .stat-detail {
    font-size:8px;
    line-height:1.6;
    max-width:100px
  }
  .stat-spark {
    font-size:22px;
    margin:0
  }
  .workspace-grid {
    grid-template-columns:1fr;
    gap:19px
  }
  .panel-heading,.entry-form,.library-section,.decisions-section {
    padding:21px
  }
  .panel-heading h3 {
    font-size:15px
  }
  .panel-heading p {
    font-size:11px
  }
  .field label {
    font-size:12px
  }
  .field input,.field textarea,.field select {
    font-size:13px;
    min-height:44px
  }
  .button {
    min-height:44px
  }
  .field-hint {
    font-size:10px
  }
  .decision-field-grid {
    gap:17px
  }
  .decision-form-footer {
    flex-direction:row;
    align-items:center
  }
  .decision-form-footer>.field-hint {
    max-width:140px
  }
  .decision-empty {
    padding-top:30px
  }
  .decision-card h5 {
    font-size:9px
  }
  .decision-text {
    font-size:12px
  }
  .source-content>a {
    font-size:13px
  }
  .source-content>p {
    font-size:11px
  }
  .validation-note {
    font-size:10px
  }
  .next-step {
    padding:19px;
    gap:14px;
    align-items:flex-start
  }
  .next-step h3 {
    font-size:12px
  }
  .next-step p {
    font-size:10px
  }
  .next-step-icon {
    font-size:25px
  }
  .site-footer {
    align-items:flex-start;
    flex-direction:column;
    gap:11px;
    padding:26px 0
  }
  .site-footer p {
    text-align:left;
    font-size:9px
  }
  .form-error,.form-success,.notice,.workspace-feedback {
    font-size:12px
  }
}
@media(max-width:420px) {
  h1 {
    font-size:42px
  }
  .hero-description {
    max-width:330px
  }
  .privacy-note {
    max-width:113px;
    line-height:1.5;
    align-items:flex-start
  }
  .privacy-note .small-dot {
    flex-shrink:0;
    margin-top:4px
  }
  .stat-label {
    font-size:8px
  }
  .stat {
    padding:13px 10px
  }
  .stat-detail {
    font-size:7.5px
  }
  .stat-value {
    font-size:27px
  }
  .stat-spark {
    font-size:20px
  }
  .decision-form-footer {
    flex-direction:column;
    align-items:flex-start
  }
  .decision-form-footer>.field-hint {
    max-width:none
  }
  .decision-form-footer>.button {
    align-self:flex-end
  }
  .decision-card {
    padding:15px
  }
  .footer-tagline {
    margin-left:11px
  }
}
@media(prefers-reduced-motion:reduce) {
  * {
    scroll-behavior:auto!important;
    transition:none!important
  }
}
```

[Back to contents](#contents)

<a id="file-src-app-tsx-26ad4b83"></a>
### src/App.tsx

16157 bytes · SHA-256 `612690da865ea467d52b48ee7b9b04da0f106b002c5c78b4e6e5160a25f55860` · utf8

```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { useWorkspace } from './useWorkspace'
import type { ImplementationStatus } from './workspace'
import CalendarPanel from './components/calendarMotion/CalendarPanel'
import CalendarButton from './components/calendarMotion/CalendarButton'
import AddSourceButton from './components/sources/AddSourceButton'
import SourceSections from './components/sources/SourceSections'
import useSourceSections from './components/sources/useSourceSections'
import MoonBanner from './components/header/MoonBanner'
import { MoonCredit } from './components/misc/MoonMark/MoonMark'
import SparkArt from './components/hero/SparkArt'
import PaneBackground from './components/panes/PaneBackground'
import FooterTextScene from './components/typography/FooterTextScene'
import ResearchDraftPanel from './components/glass-panel-3d/ResearchDraftPanel'
import { GlassTorusCard, GlassPanelCard } from './components/glass-objects/GlassObjectCards'
import './App.css'

const MAIN_GLASS_PROPS = {
  initialSpin: true,
  initialRotationAxis: 'y' as const,
  initialRotationSpeed: 0.25,
  lightingIntensity: 1.25,
  initialMaterial: {
    transmission: 1,
    thickness: 0.41,
    ior: 1.7,
    chromaticAberration: 0.062,
    roughness: 0.08,
    color: '#cdd2d9',
  },
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  )
}

const statuses: { value: ImplementationStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'building', label: 'Building' },
  { value: 'validated', label: 'Validated' },
]

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export default function App() {
  useEffect(() => {
    const target = window.location.hash
    if (target !== '#glass-workspace' && target !== '#glass-objects') return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(target.slice(1))?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const { workspace, storageWarning, addSource, addDecision, updateDecisionStatus, exportWorkspace } = useWorkspace()
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceNotes, setSourceNotes] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [sourceSuccess, setSourceSuccess] = useState('')
  const { sourceSections, introduceSourceSection } = useSourceSections()
  const [selectedSource, setSelectedSource] = useState('')
  const [finding, setFinding] = useState('')
  const [implementation, setImplementation] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const [decisionSuccess, setDecisionSuccess] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const effectiveSource = selectedSource || workspace.sources[0]?.id || ''
  const validated = workspace.decisions.filter((decision) => decision.status === 'validated').length

  function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSourceError('')
    setSourceSuccess('')
    try {
      addSource({ title: sourceTitle, url: sourceUrl, notes: sourceNotes })
      setSourceTitle('')
      setSourceUrl('')
      setSourceNotes('')
      setSourceSuccess('Source added to your research library.')
    } catch (error) {
      setSourceError(errorMessage(error))
    }
  }

  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDecisionError('')
    setDecisionSuccess('')
    try {
      addDecision({ sourceId: effectiveSource, finding, implementation })
      setFinding('')
      setImplementation('')
      setDecisionSuccess('Implementation decision added. Start building when you are ready.')
    } catch (error) {
      setDecisionError(errorMessage(error))
    }
  }

  function changeStatus(id: string, status: ImplementationStatus) {
    setWorkspaceError('')
    setWorkspaceMessage('')
    try {
      updateDecisionStatus(id, status)
      setWorkspaceMessage(`Implementation status updated to ${status}.`)
    } catch (error) {
      setWorkspaceError(errorMessage(error))
    }
  }

  function downloadWorkspace() {
    setWorkspaceError('')
    setWorkspaceMessage('')
    try {
      const url = URL.createObjectURL(new Blob([exportWorkspace()], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'first-light-workspace.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setWorkspaceMessage('Workspace exported as JSON. Keep it as a backup; restoring exports is not available yet.')
    } catch (error) {
      setWorkspaceError(errorMessage(error))
    }
  }

  return (
    <>
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <MoonBanner onExport={downloadWorkspace} />

      <main id="top" className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="tiny-line" />IDEAS, GROUNDED IN EVIDENCE</p>
            <h1 id="hero-title">Good research.<br /><span>Real applications.</span></h1>
            <p className="hero-description">A place to turn what you learn into what you build. Collect the evidence, connect the findings, and give your next web application a clear starting point.</p>
          </div>
          <SparkArt />
        </section>

        <section className="workflow-strip" aria-label="Research to application workflow">
          <span><b>01</b> Collect sources</span><Arrow /><span><b>02</b> Connect findings</span><Arrow /><span><b>03</b> Build an application</span><Arrow /><span><b>04</b> Verify the result</span>
        </section>

        <div className="workspace-heading" id="workspace">
          <div><p className="eyebrow">YOUR STARTING POINT</p><h2>The workspace</h2></div>
          <span className="privacy-note"><span className="small-dot" />Stored in this browser</span>
        </div>

        {storageWarning && <div className="notice notice-warning" role="alert">{storageWarning}</div>}
        {workspaceError && <div className="notice notice-error" role="alert">{workspaceError}</div>}
        <div className="workspace-feedback" role="status" aria-live="polite">{workspaceMessage}</div>

        <PaneBackground as="section" className="stats-grid" aria-label="Workspace overview">
          <div className="stat"><span className="stat-label">Research sources</span><span className="stat-value">{String(workspace.sources.length).padStart(2, '0')}</span><span className="stat-detail">The evidence behind your ideas</span></div>
          <div className="stat"><span className="stat-label">Implementation decisions</span><span className="stat-value">{String(workspace.decisions.length).padStart(2, '0')}</span><span className="stat-detail">Findings with a plan of action</span></div>
          <div className="stat"><span className="stat-label">Marked validated</span><span className="stat-value">{String(validated).padStart(2, '0')}<span className="stat-spark">✳</span></span><span className="stat-detail">Status reported by you</span></div>
        </PaneBackground>

        <div className="workspace-grid">
          <CalendarPanel>
          <PaneBackground as="section" className="panel source-panel" aria-labelledby="sources-heading">
            <div className="panel-heading"><span className="step-number">01</span><div><h3 id="sources-heading">Research library</h3><p>Start with something worth building on.</p></div></div>
            <form onSubmit={submitSource} noValidate className="entry-form">
              <div className="field"><label htmlFor="source-title">Source title <span aria-hidden="true">*</span></label><PaneBackground as="input" id="source-title" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder="A paper, study, or research article" required /></div>
              <div className="field"><label htmlFor="source-url">Source URL <span aria-hidden="true">*</span></label><PaneBackground as="input" id="source-url" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required /><span className="field-hint">Link to the original research where possible.</span></div>
              <div className="field"><label htmlFor="source-notes">Source notes <span className="optional">optional</span></label><PaneBackground as="textarea" id="source-notes" rows={3} value={sourceNotes} onChange={(event) => setSourceNotes(event.target.value)} placeholder="Why is this source useful? Note its context or limitations." /></div>
              {sourceError && <p className="form-error" role="alert">{sourceError}</p>}
              <p className="form-success" role="status" aria-live="polite">{sourceSuccess}</p>
              <div className="entry-form" style={{ padding: 0, gap: 0, minWidth: 0 }}>
                <AddSourceButton onClick={introduceSourceSection} />
                <SourceSections sections={sourceSections} />
              </div>
            </form>
            <div className="library-section"><div className="list-heading"><h4>Your sources</h4><span>{workspace.sources.length}</span></div>
              {workspace.sources.length === 0 ? <div className="empty-state source-empty"><span className="empty-symbol" aria-hidden="true"><Arrow diagonal /></span><h4>A clean page. A clear beginning.</h4><p>Add your first source above. Your evidence will live here, ready to inform the next step.</p></div> : <ul className="source-list">{workspace.sources.map((source, index) => <li key={source.id}><span className="source-index">{String(index + 1).padStart(2, '0')}</span><div className="source-content"><a href={source.url} target="_blank" rel="noreferrer">{source.title}<Arrow diagonal /></a><span className="source-host">{new URL(source.url).hostname}</span>{source.notes && <p>{source.notes}</p>}</div></li>)}</ul>}
            </div>
          </PaneBackground>
          </CalendarPanel>

          <CalendarPanel>
          <PaneBackground as="section" className="panel decision-panel" aria-labelledby="decisions-heading">
            <div className="panel-heading"><span className="step-number">02</span><div><h3 id="decisions-heading">From finding to feature</h3><p>Make the connection between evidence and action.</p></div></div>
            <form onSubmit={submitDecision} noValidate className="entry-form">
              <div className="field"><label htmlFor="decision-source">Research source <span aria-hidden="true">*</span></label><PaneBackground as="select" id="decision-source" value={effectiveSource} onChange={(event) => setSelectedSource(event.target.value)} disabled={workspace.sources.length === 0} required>{workspace.sources.length === 0 && <option value="">Add a source to get started</option>}{workspace.sources.map((source) => <option value={source.id} key={source.id}>{source.title}</option>)}</PaneBackground></div>
              <div className="decision-field-grid"><div className="field"><label htmlFor="research-finding">Research finding <span aria-hidden="true">*</span></label><PaneBackground as="textarea" id="research-finding" rows={4} value={finding} onChange={(event) => setFinding(event.target.value)} placeholder="What does the evidence suggest? Include the limits of the finding." required /></div><div className="field"><label htmlFor="implementation-plan">Implementation plan <span aria-hidden="true">*</span></label><PaneBackground as="textarea" id="implementation-plan" rows={4} value={implementation} onChange={(event) => setImplementation(event.target.value)} placeholder="How will this inform your web application? What will you test?" required /></div></div>
              {decisionError && <p className="form-error" role="alert">{decisionError}</p>}
              <p className="form-success" role="status" aria-live="polite">{decisionSuccess}</p>
              <div className="decision-form-footer"><span className="field-hint">Every decision starts with a source.</span><CalendarButton className="button button-primary" type="submit" label="Add decision" hoverLabel="Plan feature" disabled={workspace.sources.length === 0} icon={<span aria-hidden="true">+</span>} /></div>
            </form>

            <div className="decisions-section"><div className="list-heading"><h4>Implementation decisions</h4><span>{workspace.decisions.length}</span></div>
              {workspace.decisions.length === 0 ? <div className="empty-state decision-empty"><div className="empty-orbit" aria-hidden="true"><span />→<span /></div><h4>Give your research a direction.</h4><p>Connect a finding to a concrete implementation. Then track it from the first plan to a result you have checked.</p><span className="empty-tag">RESEARCH → APPLICATION</span></div> : <ul className="decision-list">{workspace.decisions.map((decision, index) => {
                const source = workspace.sources.find((item) => item.id === decision.sourceId)
                return <PaneBackground as="li" key={decision.id} className="decision-card"><div className="decision-card-top"><span className="decision-id">DECISION {String(index + 1).padStart(2, '0')}</span><span className={`status-badge status-${decision.status}`}><span />{statuses.find((status) => status.value === decision.status)?.label}</span></div><h5>Finding</h5><p className="decision-text">{decision.finding}</p><div className="implementation-block"><h5>Implementation</h5><p className="decision-text">{decision.implementation}</p></div><div className="decision-card-bottom">{source && <a className="decision-source-link" href={source.url} target="_blank" rel="noreferrer"><Arrow diagonal />{source.title}</a>}<label className="status-control">Status<PaneBackground as="select" aria-label={`Status for decision ${index + 1}`} value={decision.status} onChange={(event) => changeStatus(decision.id, event.target.value as ImplementationStatus)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</PaneBackground></label></div></PaneBackground>
              })}</ul>}
              <p className="validation-note">“Validated” is a status you set after checking an implementation. It does not establish scientific validity. Record the test and its results in the repository’s decision template.</p>
            </div>
          </PaneBackground>
          </CalendarPanel>
        </div>

        <section id="glass-workspace" aria-label="Idea draft" className="glass-workspace-section" data-main-glass="">
          <ResearchDraftPanel />
        </section>

        <section id="glass-objects" aria-label="Glass objects" className="main-glass-objects">
          <GlassTorusCard {...MAIN_GLASS_PROPS} />
          <GlassPanelCard {...MAIN_GLASS_PROPS} />
        </section>

        <PaneBackground as="aside" className="next-step"><div className="next-step-icon" aria-hidden="true">✳</div><div><h3>A small beginning. Room to grow.</h3><p>Choose a research question, review the evidence, then build the smallest application that can test your idea. Research and decision templates are included in the repository.</p></div></PaneBackground>
        <FooterTextScene rotationSpeed={0.12} />
        <footer className="site-footer"><span>first light<span className="brand-dot">.</span><span className="footer-tagline">Make learning tangible.</span></span><p>Local browser storage · Export regularly for backup · No account needed<br /><MoonCredit /></p></footer>
      </main>
    </>
  )
}
```

[Back to contents](#contents)

<a id="file-src-index-css-85da3662"></a>
### src/index.css

611 bytes · SHA-256 `9e2d2076f977f9057f1902abbf2c30deac701e7d4775076264255c766a638a1e` · utf8

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: inherit; }
.app-content { position: relative; z-index: 1; min-height: 100vh; font-family: inherit; color: inherit; }
button, input, textarea, select { font: inherit; }
button, a, input, textarea, select { -webkit-tap-highlight-color: transparent; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; }
:focus-visible { outline: 3px solid #b44b24; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
}
```

[Back to contents](#contents)

<a id="file-src-main-tsx-1cd8b187"></a>
### src/main.tsx

728 bytes · SHA-256 `66858a9c416e355f934be1175c403961653ec41f51dcd7034460016d31ed8cee` · utf8

```tsx
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppleGlassLens, { appleGlassTheme } from './components/glass/AppleGlassLens'
import './index.css'

// A failed decorative chunk must not prevent the research workspace from loading.
const StarBackground = lazy(() =>
  import('./components/backgrounds/starsBackground/StarBackground').catch(() => ({
    default: () => <></>,
  })),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <StarBackground />
    </Suspense>
    <div className="app-content" style={appleGlassTheme}>
      <App />
    </div>
    <AppleGlassLens />
  </StrictMode>,
)
```

[Back to contents](#contents)

<a id="file-src-styles-glass-css-975b3a29"></a>
### src/styles/glass.css

368 bytes · SHA-256 `cb95178d3923ad79794150bab7e59ed8e15547db7b4b3d55692a9c956ee53a7d` · utf8

```css
:root {
  --workspace-glass-background: rgba(35, 37, 49, 0.5);
  --workspace-glass-blur: blur(7px);
  --workspace-glass-shadow:
    inset 0 0 0 1000px rgba(35, 37, 49, 0.015),
    0 18px 45px rgba(0, 0, 0, 0.28);
  --workspace-panel-border: 1px solid rgba(240, 248, 255, 0.12);
  --workspace-panel-radius: 6px;
  --workspace-glass-colour: rgba(240, 248, 255, 0.88);
}
```

[Back to contents](#contents)

<a id="file-src-useworkspace-ts-99acf686"></a>
### src/useWorkspace.ts

3343 bytes · SHA-256 `c417c77cf0de427ceb887fbe1ac25dfc8dc77a061403b5c5a850571f05a12da1` · utf8

```ts
import { useState } from 'react'
import {
  STORAGE_KEY, createDecision, createSource, emptyWorkspace, isImplementationStatus, parseWorkspace,
  type DecisionInput, type ImplementationStatus, type SourceInput, type Workspace,
} from './workspace'

interface Session {
  workspace: Workspace
  storageWarning: string | null
  canPersist: boolean
  savedRaw: string | null
}

function loadSession(): Session {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      workspace: emptyWorkspace(), canPersist: false, savedRaw: null,
      storageWarning: 'Browser storage is unavailable. Changes last only for this session. Export your workspace before leaving.',
    }
  }
  if (raw === null) return { workspace: emptyWorkspace(), storageWarning: null, canPersist: true, savedRaw: null }
  try {
    return { workspace: parseWorkspace(raw), storageWarning: null, canPersist: true, savedRaw: raw }
  } catch {
    return {
      workspace: emptyWorkspace(), canPersist: false, savedRaw: raw,
      storageWarning: 'Saved data could not be read. The original has been left untouched in browser storage. New changes are session-only; export them before leaving.',
    }
  }
}

export function useWorkspace() {
  const [session, setSession] = useState<Session>(loadSession)

  // Event handlers perform persistence once, outside React state updaters/effects.
  function save(workspace: Workspace) {
    const next = { ...session, workspace }
    if (session.canPersist) {
      try {
        // Never overwrite edits made in another tab since this session loaded/saved.
        if (localStorage.getItem(STORAGE_KEY) !== session.savedRaw) {
          next.canPersist = false
          next.storageWarning = 'Saved data changed in another tab. Your changes are session-only to avoid overwriting it. Export this workspace before reloading.'
        } else {
          next.savedRaw = JSON.stringify(workspace)
          localStorage.setItem(STORAGE_KEY, next.savedRaw)
        }
      } catch {
        next.canPersist = false
        next.storageWarning = 'Changes could not be saved in this browser. They remain available in this session. Export your workspace before leaving.'
      }
    }
    setSession(next)
  }

  function addSource(input: SourceInput): void {
    const source = createSource(input)
    save({ ...session.workspace, sources: [...session.workspace.sources, source] })
  }

  function addDecision(input: DecisionInput): void {
    const decision = createDecision(input, session.workspace)
    save({ ...session.workspace, decisions: [...session.workspace.decisions, decision] })
  }

  function updateDecisionStatus(id: string, status: ImplementationStatus): void {
    if (!isImplementationStatus(status)) throw new Error('Choose a valid implementation status.')
    if (!session.workspace.decisions.some(decision => decision.id === id)) throw new Error('Implementation decision not found.')
    save({
      ...session.workspace,
      decisions: session.workspace.decisions.map(decision => decision.id === id ? { ...decision, status } : decision),
    })
  }

  return {
    workspace: session.workspace,
    storageWarning: session.storageWarning,
    addSource, addDecision, updateDecisionStatus,
    exportWorkspace: () => JSON.stringify(session.workspace, null, 2),
  }
}
```

[Back to contents](#contents)

<a id="file-src-workspace-contract-md-ef2e856e"></a>
### src/workspace-contract.md

1606 bytes · SHA-256 `7d0073c2cc388c7cadcadd447b7ed53587693ca0f1074e94bfc98eba1267ba38` · utf8

```markdown
# Internal implementation contract

`workspace.ts` exports `ResearchSource` (`id`, `title`, `url`, `notes`, `createdAt`, all strings), `ImplementationStatus` (`'planned' | 'building' | 'validated'`), `ImplementationDecision` (`id`, `sourceId`, `finding`, `implementation`, `createdAt`, all strings, plus `status`), `Workspace` (`version: 1`, `sources: ResearchSource[]`, `decisions: ImplementationDecision[]`), `SourceInput` (`title`, `url`, `notes`, all strings), and `DecisionInput` (`sourceId`, `finding`, `implementation`, all strings).

`useWorkspace.ts` exports `useWorkspace()`, returning `{workspace, storageWarning, addSource, addDecision, updateDecisionStatus, exportWorkspace}`. `storageWarning` is `string | null`. `addSource(input: SourceInput)` and `addDecision(input: DecisionInput)` validate and throw `Error` for invalid input; return void. `updateDecisionStatus(id: string, status: ImplementationStatus)` returns void. `exportWorkspace()` returns a formatted JSON string. Failures to persist do not throw; they set `storageWarning` and leave the current session usable. The UI must show that warning.

Use named import `{ useWorkspace } from './useWorkspace'` and type imports from `'./workspace'`. The UI owns its form drafts and feedback. Forms should clear only after successful additions. Export can download a Blob named `first-light-workspace.json`. No deletion/import functionality in this increment. Start empty; no made-up sources. The App default export takes no props. Parent `main.tsx` supplies StrictMode. Tests will use accessible field labels and roles, not CSS selectors.
```

[Back to contents](#contents)

<a id="file-src-workspace-ts-f008b068"></a>
### src/workspace.ts

4051 bytes · SHA-256 `3839119062435c0bb7cc64b5d4e755bf13256978d31e22a87b6447d975dd2b8a` · utf8

```ts
export type ImplementationStatus = 'planned' | 'building' | 'validated'

export interface ResearchSource {
  id: string
  title: string
  url: string
  notes: string
  createdAt: string
}

export interface ImplementationDecision {
  id: string
  sourceId: string
  finding: string
  implementation: string
  status: ImplementationStatus
  createdAt: string
}

export interface Workspace {
  version: 1
  sources: ResearchSource[]
  decisions: ImplementationDecision[]
}

export interface SourceInput { title: string; url: string; notes: string }
export interface DecisionInput { sourceId: string; finding: string; implementation: string }

export const STORAGE_KEY = 'first-light.workspace.v1'
export const emptyWorkspace = (): Workspace => ({ version: 1, sources: [], decisions: [] })

function required(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname && !url.username && !url.password
  } catch {
    return false
  }
}

export function createSource(input: SourceInput): ResearchSource {
  const title = required(input.title, 'Source title')
  const url = required(input.url, 'Source URL')
  if (!isHttpUrl(url)) throw new Error('Enter a full http:// or https:// URL without embedded credentials.')
  return { id: crypto.randomUUID(), title, url, notes: input.notes.trim(), createdAt: new Date().toISOString() }
}

export function createDecision(input: DecisionInput, workspace: Workspace): ImplementationDecision {
  if (!workspace.sources.some(source => source.id === input.sourceId)) {
    throw new Error('Choose an existing research source before adding a decision.')
  }
  return {
    id: crypto.randomUUID(),
    sourceId: input.sourceId,
    finding: required(input.finding, 'Research finding'),
    implementation: required(input.implementation, 'Proposed implementation'),
    status: 'planned',
    createdAt: new Date().toISOString(),
  }
}

export function isImplementationStatus(value: unknown): value is ImplementationStatus {
  return value === 'planned' || value === 'building' || value === 'validated'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim()
}

function isTimestamp(value: unknown): boolean {
  return nonEmptyString(value) && Number.isFinite(Date.parse(value))
}

/** Validate persisted data before it is rendered or used as a link target. */
export function parseWorkspace(raw: string): Workspace {
  const value: unknown = JSON.parse(raw)
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.sources) || !Array.isArray(value.decisions)) {
    throw new Error('Unsupported workspace format.')
  }
  const ids = new Set<string>()
  const sourceIds = new Set<string>()
  for (const source of value.sources) {
    if (!isRecord(source) || !nonEmptyString(source.id) || ids.has(source.id)
      || !nonEmptyString(source.title) || typeof source.url !== 'string' || !isHttpUrl(source.url)
      || typeof source.notes !== 'string' || !isTimestamp(source.createdAt)) {
      throw new Error('Invalid saved research source.')
    }
    ids.add(source.id)
    sourceIds.add(source.id)
  }
  for (const decision of value.decisions) {
    if (!isRecord(decision) || !nonEmptyString(decision.id) || ids.has(decision.id)
      || typeof decision.sourceId !== 'string' || !sourceIds.has(decision.sourceId)
      || !nonEmptyString(decision.finding) || !nonEmptyString(decision.implementation)
      || !isImplementationStatus(decision.status) || !isTimestamp(decision.createdAt)) {
      throw new Error('Invalid saved implementation decision.')
    }
    ids.add(decision.id)
  }
  return value as unknown as Workspace
}
```

[Back to contents](#contents)


<a id="group-header-hero"></a>
## Header, hero and shared tile decoration

<a id="file-src-components-decorations-tilegrid-module-css-2c841db1"></a>
### src/components/decorations/TileGrid.module.css

685 bytes · SHA-256 `cfb70da7d3406c9141ead2617dd8357bd8541f730c2dcf23135d40867f9dae2b` · utf8

```css
.grid {
  --tile-line-width: 1px;
  --tile-line-colour: rgba(225, 231, 255, 0.09);
  --tile-cell-size: 28px;
  background-image:
    linear-gradient(to right, var(--tile-line-colour) var(--tile-line-width), transparent var(--tile-line-width)),
    linear-gradient(to bottom, var(--tile-line-colour) var(--tile-line-width), transparent var(--tile-line-width));
  background-size: var(--tile-cell-size) var(--tile-cell-size);
  mask-image: radial-gradient(ellipse at center, #000 20%, transparent 73%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 73%);
  pointer-events: none;
}

@media (max-width: 720px) {
  .grid {
    --tile-cell-size: 22px;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-decorations-tilegrid-tsx-e0b092ce"></a>
### src/components/decorations/TileGrid.tsx

424 bytes · SHA-256 `98d1a9123e6c186502023a42fe6b78368b84334fefd984650ef16975ba142945` · utf8

```tsx
import type { HTMLAttributes } from 'react'
import styles from './TileGrid.module.css'

// Layout belongs to the caller; both hero and source cards share this paint.
export default function TileGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`${styles.grid}${className ? ` ${className}` : ''}`}
      data-tile-grid
      aria-hidden="true"
    />
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headerexport-module-css-89cd3b52"></a>
### src/components/header/HeaderExport.module.css

964 bytes · SHA-256 `c2ef5da3ad0cf6c3b616ecf06e556f5cd6cb2bd498a61b4fdda1168d37a6d35e` · utf8

```css
.wrapper {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-self: center;
  min-width: 0;
  max-width: 100%;
}

.wrapper .button {
  flex: 0 0 auto;
  min-height: 41px;
  margin: 0;
  padding: 11px 16px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.mobileIcon {
  display: none;
  pointer-events: none;
}

.wrapper .button:focus-visible {
  outline: 3px solid #ffaf86;
  outline-offset: 4px;
}

@media (max-width: 760px) {
  .wrapper .button {
    padding: 9px 12px;
    font-size: 11px;
  }
}

@media (max-width: 560px) {
  .wrapper {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
  }

  .wrapper .button {
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
    border-radius: 12px;
  }

  .wrapper .button :global(.calendar-button-labels) {
    display: none;
  }

  .mobileIcon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headerexport-tsx-f32ff3f0"></a>
### src/components/header/HeaderExport.tsx

982 bytes · SHA-256 `ce326a8a045f24cae6eea4191aa0b3e9d573d47619830c4cfc432badc9ff099e` · utf8

```tsx
import CalendarButton from '../calendarMotion/CalendarButton'
import styles from './HeaderExport.module.css'

export interface HeaderExportProps {
  onExport: () => void
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" />
    </svg>
  )
}

export default function HeaderExport({ onExport }: HeaderExportProps) {
  return (
    <div data-header-export className={styles.wrapper}>
      <CalendarButton
        className={`button button-secondary export-button ${styles.button}`}
        type="button"
        label="Export workspace"
        hoverLabel="Download JSON"
        title="Export workspace"
        onClick={onExport}
        icon={<DownloadIcon />}
      />
      <span className={styles.mobileIcon} aria-hidden="true"><DownloadIcon /></span>
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headerframe-module-css-b61d3fa7"></a>
### src/components/header/HeaderFrame.module.css

192 bytes · SHA-256 `b5ddb048d119db6413bbe8c5d7bc03328dc7fab7c6b89e70fabfbb78d756dafb` · utf8

```css
.frame {
  composes: background from '../panes/PaneBackground.module.css';
  font-family: inherit;
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  overflow: visible;
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headerframe-tsx-f82d57d5"></a>
### src/components/header/HeaderFrame.tsx

520 bytes · SHA-256 `c79ce1d4e25170fa2719745209b57714da6a3e9fbed7ab1fd357418063ad5230` · utf8

```tsx
import type { HTMLAttributes } from 'react'
import PaneBackground from '../panes/PaneBackground'
import styles from './HeaderFrame.module.css'

export interface HeaderFrameProps extends HTMLAttributes<HTMLElement> {
  as?: 'header' | 'div'
}

export default function HeaderFrame({ as: Element = 'div', className, ...props }: HeaderFrameProps) {
  return (
    <PaneBackground
      as={Element}
      {...props}
      data-header-frame
      className={`${styles.frame}${className ? ` ${className}` : ''}`}
    />
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headertitle-module-css-c8d17dc9"></a>
### src/components/header/HeaderTitle.module.css

787 bytes · SHA-256 `7c4fde9abc83b29103b399f57c7679e1ebfd5a2b387f9600c9e9d7692dd6a8d3` · utf8

```css
.title {
  display: inline-flex;
  direction: ltr;
  writing-mode: horizontal-tb;
  flex-direction: row;
  flex-wrap: nowrap;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  gap: clamp(12px, 1.6vw, 22px);
  width: max-content;
  max-width: 100%;
  padding: 12px 20px 12px 12px;
  white-space: nowrap;
}

.title .scene {
  display: block;
  flex: 0 0 auto;
  width: clamp(72px, 9vw, 112px);
  height: clamp(72px, 9vw, 112px);
  overflow: visible;
  pointer-events: none;
}

.wordmark {
  flex: 0 0 auto;
  font-size: clamp(26px, 2.5vw, 36px);
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: -1.4px;
  white-space: nowrap;
}

.dot {
  color: var(--accent, #ff9470);
}

@media (max-width: 560px) {
  .title {
    gap: 12px;
    padding: 10px 12px;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headertitle-tsx-6e8b2481"></a>
### src/components/header/HeaderTitle.tsx

672 bytes · SHA-256 `eec818becda6b24a111071c345bc6dd622b69db8453ae3841efd7cff9ab8d145` · utf8

```tsx
import { moonMarkTemplate } from '../misc/MoonMark/moonMarkTemplate'
import HeaderFrame from './HeaderFrame'
import styles from './HeaderTitle.module.css'

export interface HeaderTitleProps {
  className?: string
}

export default function HeaderTitle({ className }: HeaderTitleProps) {
  return (
    <HeaderFrame as="div" data-header-title className={`${styles.title}${className ? ` ${className}` : ''}`}>
      {moonMarkTemplate.render({ size: 112, animate: true, rotationAxis: 'y', rotationSpeed: -0.12, className: styles.scene })}
      <span className={styles.wordmark}>first light<span className={`brand-dot ${styles.dot}`}>.</span></span>
    </HeaderFrame>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-header-moonbanner-module-css-910bb8d8"></a>
### src/components/header/MoonBanner.module.css

1759 bytes · SHA-256 `79b95750dfd236f3bf62ef316b2bd142ae0b93f513567effbbab39b6181e110e` · utf8

```css
.banner:global(.site-header) {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 28px;
  width: calc(100% - 40px);
  max-width: 1420px;
  min-width: 0;
  min-height: 0;
  margin: 20px auto 0;
  padding: 20px 28px;
}

.banner .home {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  padding: 4px 8px 4px 0;
  border-radius: 16px;
  color: inherit;
  font: inherit;
  letter-spacing: normal;
  text-decoration: none;
  white-space: normal;
}

.banner .context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding-left: 14px;
  color: var(--muted, #b5bbcc);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: normal;
}

.localBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 7px;
  border: 1px solid rgba(225, 231, 255, 0.2);
  border-radius: 5px;
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.localBadge > span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c2d7ad;
}

.home:focus-visible {
  outline: 3px solid #ffaf86;
  outline-offset: 4px;
}

@media (max-width: 760px) {
  .banner:global(.site-header) {
    gap: 18px;
    width: calc(100% - 28px);
    margin-top: 14px;
    padding: 18px 20px;
  }

  .banner .home {
    gap: 9px;
  }

  .banner .context {
    gap: 7px 10px;
    font-size: 11px;
  }
}

@media (max-width: 560px) {
  .banner:global(.site-header) {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    width: calc(100% - 24px);
    margin-top: 12px;
    padding: 12px;
  }

  .banner .home {
    flex: 1 1 0;
    padding-right: 0;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-header-moonbanner-tsx-91446d9d"></a>
### src/components/header/MoonBanner.tsx

889 bytes · SHA-256 `13867f0433270e1b7a79a67b444fea24314b359a07f43e4d19e8ddf0206e7659` · utf8

```tsx
import HeaderExport from './HeaderExport'
import { headerFrameTemplate } from './headerFrameTemplate'
import { headerTitleTemplate } from './headerTitleTemplate'
import styles from './MoonBanner.module.css'

export interface MoonBannerProps {
  onExport: () => void
}

export default function MoonBanner({ onExport }: MoonBannerProps) {
  return headerFrameTemplate.render({
    as: 'header',
    className: `site-header ${styles.banner}`,
    children: (
      <>
        <a className={`brand ${styles.home}`} href="#top" aria-label="First Light home">
          {headerTitleTemplate.render()}
          <div className={`header-context ${styles.context}`}>
            <span>Research workspace</span>
            <span className={styles.localBadge}><span aria-hidden="true" />Local</span>
          </div>
        </a>
        <HeaderExport onExport={onExport} />
      </>
    ),
  })
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headerframetemplate-tsx-cd627118"></a>
### src/components/header/headerFrameTemplate.tsx

235 bytes · SHA-256 `7c36411f82a31ce0e5c3631f91d8531321864936e1b1cc3e8bb9a938ab284c46` · utf8

```tsx
import type { ReactElement } from 'react'
import HeaderFrame, { type HeaderFrameProps } from './HeaderFrame'

export const headerFrameTemplate = {
  render: (props: HeaderFrameProps = {}): ReactElement => <HeaderFrame {...props} />,
}
```

[Back to contents](#contents)

<a id="file-src-components-header-headertitletemplate-tsx-f4573482"></a>
### src/components/header/headerTitleTemplate.tsx

313 bytes · SHA-256 `cef618cef89c8c0d6d4379ac9b001d4a7027a6ea90442659ba097770de09345c` · utf8

```tsx
import type { ReactElement } from 'react'
import HeaderTitle, { type HeaderTitleProps } from './HeaderTitle'

// A fitted visual object; the caller owns navigation and workspace metadata.
export const headerTitleTemplate = {
  render: (props: HeaderTitleProps = {}): ReactElement => <HeaderTitle {...props} />,
}
```

[Back to contents](#contents)

<a id="file-src-components-hero-sparkart-module-css-61ef0c6c"></a>
### src/components/hero/SparkArt.module.css

785 bytes · SHA-256 `631f8dd171c702222ebcead539ca40b76f8f04e3dc79e43febb0f051e899b520` · utf8

```css
.art {
  position: relative;
  width: 255px;
  height: 232px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  pointer-events: none;
}

.grid {
  position: absolute;
  inset: 0;
}

.sun {
  color: #ff9470;
  position: relative;
  z-index: 1;
  margin-top: -16px;
}

.caption {
  position: absolute;
  bottom: 21px;
  font-size: 6.5px;
  letter-spacing: 1.55px;
  color: #b5bbcc;
}

@media (max-width: 1000px) {
  .art {
    width: 205px;
  }
}

@media (max-width: 720px) {
  .art {
    width: 108px;
    height: 188px;
    opacity: 0.8;
    margin-right: -6px;
    align-self: flex-start;
  }

  .sun {
    width: 100px;
  }

  .caption {
    display: none;
  }
}

@media (max-width: 420px) {
  .art {
    display: none;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-hero-sparkart-tsx-cd70b642"></a>
### src/components/hero/SparkArt.tsx

671 bytes · SHA-256 `dca3c18b81279c81e71489d7f306cda41ed29266056d3fe27af0198304177cda` · utf8

```tsx
import TileGrid from '../decorations/TileGrid'
import styles from './SparkArt.module.css'

export default function SparkArt() {
  return (
    <div className={styles.art} aria-hidden="true" data-spark-art>
      <TileGrid className={styles.grid} />
      <svg aria-hidden="true" className={styles.sun} width="180" height="122" viewBox="0 0 180 122" fill="none">
        <path d="M20 102h140M33 113h114M90 9v17M30 35l12 12M150 35l-12 12M10 76h18M152 76h18" stroke="currentColor" strokeWidth="2" />
        <path d="M43 102a47 47 0 0 1 94 0" fill="currentColor" />
      </svg>
      <span className={styles.caption}>EVERY BUILD STARTS WITH A SPARK</span>
    </div>
  )
}
```

[Back to contents](#contents)


<a id="group-sources"></a>
## Source sections and reusable cards

<a id="file-src-components-cards-newusercard-cardtiles-tsx-c0d432f9"></a>
### src/components/cards/newUserCard/CardTiles.tsx

928 bytes · SHA-256 `eee1bcd1326860c7bc66e841c9bf19dfc4c702856d563f992d83915c2cd2f8f0` · utf8

```tsx
import TileGrid from '../../decorations/TileGrid'
import styles from './cardTiles.module.css'

const tileNames = [
  'tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6', 'tile7',
  'tile9', 'tile10', 'tile12', 'tile13', 'tile15',
] as const

const loaderNames = [
  'loader', 'loader2', 'loader3', 'loader4', 'loader5', 'loader6',
] as const

export default function CardTiles({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <div
      className={styles.viewport}
      data-card-tiles
      data-reduced-motion={reducedMotion}
      aria-hidden="true"
    >
      <TileGrid className={styles.pattern} data-tile-pattern>
        {tileNames.map(name => (
          <div key={name} className={`${styles.tile} ${styles[name]}`} />
        ))}
        {loaderNames.map(name => (
          <div key={name} className={`${styles.loaderLine} ${styles[name]}`} />
        ))}
      </TileGrid>
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-cards-newusercard-newusercard-tsx-a9bb3792"></a>
### src/components/cards/newUserCard/NewUserCard.tsx

4554 bytes · SHA-256 `f69dd8b6d5b5a36136f38fe8c6a4f44d1ef77dc5dbea40eb854cb270eecd2b65` · utf8

```tsx
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import SunScene from '../../react three fibre/sunScene/SunScene'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import PaneBackground, { paneBackgroundClassName } from '../../panes/PaneBackground'
import CardTiles from './CardTiles'
import styles from './newUser.module.css'

interface NewUserCardProps {
  headingId: string
  title: string
  children: ReactNode
  controls?: ReactNode
  borderTone?: 'aliceblue' | 'slatepurple'
  surfaceClassName?: string
}

const frameVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
  settled: { transition: { staggerChildren: 0 } },
}

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  settled: { opacity: 1, y: 0, transition: { duration: 0 } },
}

// Keep transforms out of the badge variants: CSS centers it with translateX.
const badgeVariants: Variants = {
  hidden: { opacity: 0 },
  // An explicit delay replaces Framer's inherited stagger slot. Start after
  // the body (0.16s) while preserving the existing section DOM order.
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut', delay: 0.2 } },
  settled: { opacity: 1, transition: { duration: 0, delay: 0 } },
}

export default function NewUserCard({
  headingId,
  title,
  children,
  controls,
  borderTone = 'aliceblue',
  surfaceClassName,
}: NewUserCardProps) {
  const { reducedMotion, coarsePointer } = useCalendarMotionPreferences()
  const frame = useRef<HTMLDivElement>(null)
  const [insideParentTilt, setInsideParentTilt] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [settledOverride, setSettledOverride] = useState(reducedMotion)
  const tiltEnabled = !insideParentTilt && !reducedMotion && !coarsePointer && !focusWithin

  useLayoutEffect(() => {
    setInsideParentTilt(Boolean(frame.current?.parentElement?.closest('.calendar-panel-tilt')))
  }, [])

  useEffect(() => {
    if (reducedMotion) setSettledOverride(true)
  }, [reducedMotion])

  return (
    <motion.div
      ref={frame}
      className={`${styles.frame}${reducedMotion ? ` ${styles.reduced}` : ''}`}
      variants={frameVariants}
      animate={reducedMotion || settledOverride ? 'settled' : undefined}
      onFocusCapture={() => {
        setFocusWithin(true)
        // Keep the settled label after blur so ancestor timing cannot replay.
        setSettledOverride(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false)
        }
      }}
    >
      <Tilt
        className={`${styles.tilt}${tiltEnabled ? '' : ` ${styles.steady}`}`}
        scale={1}
        tiltMaxAngleX={2}
        tiltMaxAngleY={2}
        tiltEnable={tiltEnabled}
        tiltAngleXManual={tiltEnabled ? null : 0}
        tiltAngleYManual={tiltEnabled ? null : 0}
      >
        <PaneBackground
          as="section"
          className={`${styles.main}${surfaceClassName ? ` ${surfaceClassName}` : ''}`}
          data-new-user-card
          aria-labelledby={headingId}
          data-border-tone={borderTone}
          style={{ width: '100%', minWidth: 0, height: 'auto', overflowWrap: 'anywhere' }}
        >
          <CardTiles reducedMotion={reducedMotion} />

          <motion.div className={styles.heading} variants={contentVariants}>
            <h3 id={headingId} className={styles.titleText}>{title}</h3>
            {controls && <div className={styles.controls}>{controls}</div>}
          </motion.div>

          <small className={styles.credit}>
            <a href="https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914" target="_blank" rel="noreferrer">Sun</a>
            {' by Akshat · '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          </small>

          <motion.div className={`${paneBackgroundClassName} ${styles.planetContainer}`} variants={badgeVariants} aria-hidden="true">
            <div className={styles.planet}><SunScene /></div>
          </motion.div>

          <motion.div className={`entry-form source-content ${styles.body}`} variants={contentVariants}>{children}</motion.div>
        </PaneBackground>
      </Tilt>
    </motion.div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-cards-newusercard-cardtiles-module-css-58f31a0f"></a>
### src/components/cards/newUserCard/cardTiles.module.css

5890 bytes · SHA-256 `d172443310417ab71896b0e7b5ed302c2f739410d973bfea33a20b107603473f` · utf8

```css
.viewport {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 160px;
  display: grid;
  justify-content: center;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

/* Clip this fixed canvas on narrow cards instead of rescaling its artwork. */
.pattern {
  box-sizing: border-box;
  width: 374px;
  height: 160px;
  padding: 1px;
  display: grid;
  grid-template-columns: 93px 93px 93px 93px;
  grid-template-rows: 28px 52px 52px 14px;
}

/* Only source cards replace TileGrid's shared spark paint with the interlock. */
.viewport .pattern {
  background-image: none;
  mask-image: none;
  -webkit-mask-image: none;
}

.tile,
.loaderLine {
  box-sizing: border-box;
}

.tile {
  cursor: pointer;
  transition: background-color 0.5s ease;
  z-index: 1;
}

.tile1 { grid-row-start: 1; grid-row-end: 2; grid-column-start: 1; grid-column-end: 2; width: 93px; height: 28px; }
.tile2 { grid-row-start: 1; grid-row-end: 2; grid-column-start: 2; grid-column-end: 3; width: 93px; height: 28px; }
.tile3 { grid-row-start: 1; grid-row-end: 2; grid-column-start: 3; grid-column-end: 4; width: 93px; height: 28px; }
.tile4 { grid-row-start: 1; grid-row-end: 3; grid-column-start: 4; grid-column-end: 5; width: 93px; height: 80px; }
.tile5 { grid-row-start: 2; grid-row-end: 3; grid-column-start: 1; grid-column-end: 2; width: 93px; height: 52px; }
.tile6 { grid-row-start: 2; grid-row-end: 3; grid-column-start: 2; grid-column-end: 3; width: 93px; height: 52px; }
.tile7 { grid-row-start: 2; grid-row-end: 3; grid-column-start: 3; grid-column-end: 4; width: 93px; height: 52px; }
.tile9 { grid-row-start: 3; grid-row-end: 4; grid-column-start: 1; grid-column-end: 2; width: 93px; height: 52px; }
.tile10 { grid-row-start: 3; grid-row-end: 4; grid-column-start: 2; grid-column-end: 4; width: 186px; height: 52px; }
.tile12 { grid-row-start: 3; grid-row-end: 4; grid-column-start: 4; grid-column-end: 5; width: 93px; height: 52px; }
.tile13 { grid-row-start: 4; grid-row-end: 5; grid-column-start: 1; grid-column-end: 2; width: 93px; height: 14px; }
/* Source tile 15's 200% of the fixed 14px footer row becomes 28px. */
.tile15 { grid-row-start: 4; grid-row-end: 5; grid-column-start: 3; grid-column-end: 4; width: 93px; height: 28px; }

.tile1:is(:hover, :focus-within),
.tile2:is(:hover, :focus-within),
.tile4:is(:hover, :focus-within),
.tile5:is(:hover, :focus-within),
.tile6:is(:hover, :focus-within),
.tile7:is(:hover, :focus-within),
.tile10:is(:hover, :focus-within),
.tile12:is(:hover, :focus-within),
.tile13:is(:hover, :focus-within),
.tile15:is(:hover, :focus-within) {
  background-color: rgba(48, 121, 97, 0.036);
}

[data-new-user-card]:is(:hover, :focus-within) .tile1,
[data-new-user-card]:is(:hover, :focus-within) .tile5,
[data-new-user-card]:is(:hover, :focus-within) .tile9 {
  border-bottom: 2px solid rgba(90, 89, 89, 0.17);
  border-right: 2px solid rgba(90, 89, 89, 0.17);
}

[data-new-user-card]:is(:hover, :focus-within) .tile2,
[data-new-user-card]:is(:hover, :focus-within) .tile3,
[data-new-user-card]:is(:hover, :focus-within) .tile6,
[data-new-user-card]:is(:hover, :focus-within) .tile10 {
  border-bottom: 2px solid rgba(90, 89, 89, 0.17);
}

[data-new-user-card]:is(:hover, :focus-within) .tile3,
[data-new-user-card]:is(:hover, :focus-within) .tile5,
[data-new-user-card]:is(:hover, :focus-within) .tile9 {
  background-color: rgba(48, 121, 97, 0.036);
}

.loader,
.loader2,
.loader3 {
  align-self: end;
  justify-self: start;
  width: 0px;
  height: 0px;
  margin-right: 23px;
}

.loader { grid-row-start: 1; grid-row-end: 2; grid-column-start: 4; grid-column-end: 5; }
.loader2 { grid-row-start: 2; grid-row-end: 3; grid-column-start: 3; grid-column-end: 5; }
.loader3 { grid-row-start: 3; grid-row-end: 4; grid-column-start: 4; grid-column-end: 5; }

.loader4,
.loader5,
.loader6 {
  align-self: start;
  width: 93px;
  height: 0px;
}

.loader4 { grid-row-start: 4; grid-row-end: 5; grid-column-start: 1; grid-column-end: 2; }
.loader5 { grid-row-start: 1; grid-row-end: 5; grid-column-start: 2; grid-column-end: 3; }
/* The source's invalid 4.4 end line resolves to the same one-column span. */
.loader6 { grid-row-start: 1; grid-row-end: 5; grid-column-start: 3; grid-column-end: 4; }

[data-new-user-card]:is(:hover, :focus-within) .loader {
  animation: progress 0.3s linear forwards;
}

[data-new-user-card]:is(:hover, :focus-within) .loader2 {
  animation: progress 0.4s linear forwards;
}

[data-new-user-card]:is(:hover, :focus-within) .loader3 {
  animation: progress3 0.6s linear forwards;
}

[data-new-user-card]:is(:hover, :focus-within) .loader4 {
  animation: progressFooter 0.1s linear forwards;
}

[data-new-user-card]:is(:hover, :focus-within) .loader5,
[data-new-user-card]:is(:hover, :focus-within) .loader6 {
  animation: progressFull 0.3s linear forwards;
}

@keyframes progress {
  from { width: 0%; border: 1px solid rgba(90, 89, 89, 0.17); }
  to { width: 100%; border: 1px solid rgba(90, 89, 89, 0.17); }
}

@keyframes progress3 {
  from { width: 0%; border: 1px solid rgba(90, 89, 89, 0.17); }
  to { width: 67%; border: 1.5px solid rgba(90, 89, 89, 0.09); }
}

/* 110% of the 14px footer row and 146px full row span, respectively. */
@keyframes progressFooter {
  from { height: 0px; border-right: 2px solid rgba(90, 89, 89, 0.17); }
  to { height: 15.4px; border-right: 3px solid rgba(104, 103, 103, 0.11); }
}

@keyframes progressFull {
  from { height: 0px; border-right: 2px solid rgba(90, 89, 89, 0.17); }
  to { height: 160.6px; border-right: 3px solid rgba(104, 103, 103, 0.11); }
}

.viewport[data-reduced-motion='true'] .tile,
.viewport[data-reduced-motion='true'] .loaderLine {
  animation: none !important;
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .tile,
  .loaderLine {
    animation: none !important;
    transition: none !important;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-cards-newusercard-newuser-module-css-1bb7bfce"></a>
### src/components/cards/newUserCard/newUser.module.css

3365 bytes · SHA-256 `6bc6cbf9260bd687c427b2cea4766939949677ad18d4f8cc76492f95f2b7ed29` · utf8

```css
/* Calendar4 NewUserCard, adapted to available width and natural content height.
   Decorative grid layers never intercept source text, links, or form controls. */
.frame,
.main,
.planetContainer,
.planet {
  box-sizing: border-box;
}

.frame {
  position: relative;
  width: 100%;
  max-width: 374px;
  min-width: 0;
  margin-inline: auto;
  padding-bottom: 26px;
}

.tilt {
  width: 100%;
  min-width: 0;
}

.tilt.steady {
  transform: none !important;
  transition: none !important;
}

.main {
  position: relative;
  width: 100%;
  min-width: 0;
  height: auto;
  transition: box-shadow 0.3s ease;
  overflow: visible;
  isolation: isolate;
  cursor: default;
  user-select: text;
}

.main::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(48, 121, 97, 0.153), transparent, transparent);
  border-radius: 30%;
  transform: translate(-65%, -65%);
  transition: all 0.3s ease;
  opacity: 0;
  pointer-events: none;
  z-index: 0;
}

.main:hover::before {
  width: 400px;
  height: 400px;
  transform: translate(-52%, -52%);
  opacity: 1;
}

.heading {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 30px 18px 12px 12px;
}

.titleText {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 1.55px;
  text-decoration: none;
  text-align: left;
  color: var(--muted, #b5bbcc);
  user-select: text;
}

.controls {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  flex-shrink: 1;
  min-width: 0;
  max-width: 100%;
  gap: 8px;
  padding: 3px;
  overflow-x: auto;
  white-space: nowrap;
}

.controls > * {
  flex-shrink: 0;
}

.main .body {
  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
  padding: 12px 18px 90px 12px;
  overflow: visible;
  user-select: text;
}

.main .body > p {
  margin: 0;
  font-family: inherit;
  font-weight: inherit;
  text-align: left;
  white-space: pre-wrap;
  user-select: text;
}

.body :where(img, video, canvas, input, textarea, select) {
  max-width: 100%;
}

.credit {
  position: absolute;
  z-index: 3;
  bottom: 36px;
  left: 14px;
  right: 14px;
  font-size: 9px;
  line-height: 1.6;
  text-align: center;
  color: rgba(240, 248, 255, 0.76);
  user-select: text;
}

.credit a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.planetContainer {
  position: absolute;
  isolation: isolate;
  z-index: 3;
  left: 50%;
  bottom: -26px;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: visible;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.planet {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.reduced .main,
.reduced .main::before {
  animation: none !important;
  transition: none !important;
}

@media (max-width: 720px) {
  .titleText {
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tilt {
    transform: none !important;
    transition: none !important;
  }

  .main,
  .main::before {
    animation: none !important;
    transition: none !important;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-sources-addsourcebutton-tsx-b6039eb7"></a>
### src/components/sources/AddSourceButton.tsx

521 bytes · SHA-256 `7a7c9336b4107948fa0003a886dbb4bb170c33460b9d3106884129e1e5967c66` · utf8

```tsx
import CalendarButton from '../calendarMotion/CalendarButton'

interface AddSourceButtonProps {
  onClick: () => void
  sectionsId?: string
}

export default function AddSourceButton({
  onClick,
  sectionsId = 'source-sections',
}: AddSourceButtonProps) {
  return (
    <CalendarButton
      className="button button-primary"
      type="button"
      label="Add source"
      hoverLabel="New section"
      onClick={onClick}
      aria-controls={sectionsId}
      icon={<span aria-hidden="true">+</span>}
    />
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-sources-animatedheight-tsx-04002a1d"></a>
### src/components/sources/AnimatedHeight.tsx

5397 bytes · SHA-256 `7f91250e40823ef0f7510c391e636c55054c6026c135f72fd8a14f9e8b1b00a3` · utf8

```tsx
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import { useCalendarMotionPreferences } from '../calendarMotion/useCalendarMotionPreferences'

export type HeightSettlement = { immediate: boolean }

interface AnimatedHeightProps {
  children: ReactNode
  onSettled?: (settlement: HeightSettlement) => void
}

export default function AnimatedHeight({ children, onSettled }: AnimatedHeightProps) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | 'auto'>('auto')
  const overflow = useMotionValue<'hidden' | 'visible'>('visible')
  const { reducedMotion } = useCalendarMotionPreferences()
  const [focusRevision, setFocusRevision] = useState(0)
  const latestOnSettled = useRef(onSettled)
  const checkHeight = useRef<(() => void) | undefined>(undefined)
  const setupRan = useRef(false)

  useLayoutEffect(() => {
    latestOnSettled.current = onSettled
  }, [onSettled])

  useLayoutEffect(() => {
    setupRan.current = true
    const container = outer.current
    const content = inner.current
    if (!container || !content) return

    let controls: AnimationPlaybackControls | undefined
    let measuredHeight = content.offsetHeight
    let generation = 0
    let disposed = false
    const canAnimate = !reducedMotion && typeof ResizeObserver !== 'undefined'

    const releaseHeight = () => {
      height.set('auto')
      overflow.set('visible')
      container.style.height = 'auto'
      container.style.overflow = 'visible'
    }

    const notifySettled = (immediate: boolean) => {
      if (!disposed) latestOnSettled.current?.({ immediate })
    }

    const updateHeight = () => {
      if (disposed) return
      const nextHeight = content.offsetHeight

      // Keep observing focused content: removing a focused child need not
      // dispatch blur. Check the live DOM focus so later growth can resume.
      if (!canAnimate || container.contains(document.activeElement)) {
        measuredHeight = nextHeight
        generation++
        controls?.stop()
        controls = undefined
        releaseHeight()
        notifySettled(true)
        return
      }
      if (nextHeight === measuredHeight) {
        // An equal-size replacement may still have a pending reveal. Never
        // release it while an earlier growth animation is still running.
        if (!controls) {
          releaseHeight()
          notifySettled(false)
        }
        return
      }

      // While idle, auto height has already adopted the new intrinsic size;
      // start from the previous measured size. During motion read the actual
      // current layout height, unaffected by the ancestor's tilt transform.
      const from = controls ? container.offsetHeight : measuredHeight
      measuredHeight = nextHeight
      const currentGeneration = ++generation
      controls?.stop()
      controls = undefined

      if (from === nextHeight) {
        releaseHeight()
        notifySettled(false)
        return
      }

      height.set(from)
      overflow.set('hidden')
      // Apply the initial bounds before the next paint, including when a
      // ResizeObserver callback follows an intrinsic async-content change.
      container.style.height = `${from}px`
      container.style.overflow = 'hidden'
      controls = animate(height, nextHeight, {
        duration: 0.3,
        ease: 'easeOut',
        onComplete: () => {
          if (disposed || currentGeneration !== generation) return
          if (content.offsetHeight !== measuredHeight) {
            updateHeight()
            return
          }
          controls = undefined
          releaseHeight()
          notifySettled(false)
        },
      })
    }

    checkHeight.current = updateHeight
    // First measurements and preference/focus changes settle immediately,
    // including the modes without an observer. They do not replay growth.
    releaseHeight()
    notifySettled(true)

    const observer = canAnimate ? new ResizeObserver(updateHeight) : undefined
    observer?.observe(content, { box: 'border-box' })
    return () => {
      disposed = true
      generation++
      observer?.disconnect()
      controls?.stop()
      if (checkHeight.current === updateHeight) checkHeight.current = undefined
      // Cleanup releases layout bounds, but cannot release a pending batch.
      releaseHeight()
    }
  }, [height, overflow, reducedMotion, focusRevision])

  useLayoutEffect(() => {
    // Setup already snapped/notified this commit. Otherwise measure children
    // before paint without resetting the previous intrinsic height baseline.
    if (setupRan.current) {
      setupRan.current = false
      return
    }
    checkHeight.current?.()
  }, [children, height, overflow, reducedMotion, focusRevision])

  return (
    <motion.div
      ref={outer}
      style={{ width: '100%', minWidth: 0, height, overflow }}
      onFocusCapture={() => setFocusRevision(revision => revision + 1)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusRevision(revision => revision + 1)
        }
      }}
    >
      <div ref={inner} style={{ display: 'flow-root', minWidth: 0 }}>
        {children}
      </div>
    </motion.div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-sources-sourcesection-tsx-5ae105a6"></a>
### src/components/sources/SourceSection.tsx

1193 bytes · SHA-256 `de8b3c8838b4cd986a3b08818940b6fa4d0dd1b8343c93a97f197df0c68117e0` · utf8

```tsx
import type { ReactNode } from 'react'
import NewUserCard from '../cards/newUserCard/NewUserCard'

// Calendar4's section boilerplate supplies a title/edit row and plain p content:
// src/components/sections/AboutMe/AboutMe.tsx at 7b7e533.
export const DEFAULT_SOURCE_SECTION_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

export type SourceSectionBorderTone = 'aliceblue' | 'slatepurple'

export interface SourceSectionInstance {
  id: string
  text?: string
  borderTone?: SourceSectionBorderTone
}

interface SourceSectionProps extends SourceSectionInstance {
  number: number
  children?: ReactNode
  controls?: ReactNode
}

export default function SourceSection({ id, number, text = DEFAULT_SOURCE_SECTION_TEXT, borderTone = 'aliceblue', children, controls }: SourceSectionProps) {
  const headingId = `source-section-${id}-heading`

  return (
    <NewUserCard
      headingId={headingId}
      title={`Source section ${number}`}
      controls={controls}
      borderTone={borderTone}
      surfaceClassName="workspace-panel-surface"
    >
      {children ?? <p>{text}</p>}
    </NewUserCard>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-sources-sourcesections-tsx-8083ead8"></a>
### src/components/sources/SourceSections.tsx

3805 bytes · SHA-256 `6cbc48ad567164f97f5b0861a0b4d09204df7717828c5afb73b804a8a791de7a` · utf8

```tsx
import { useCallback, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { SourceSectionInstance } from './SourceSection'
import { sourceSectionTemplate } from './sourceSectionTemplate'
import AnimatedHeight, { type HeightSettlement } from './AnimatedHeight'

interface SourceSectionsProps {
  sections: SourceSectionInstance[]
  id?: string
}

interface SourceReveal {
  target: 'visible' | 'settled'
  delay: number
}

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8, transition: { duration: 0 } },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut', delay, when: 'beforeChildren' },
  }),
  settled: {
    opacity: 1,
    y: 0,
    transition: { duration: 0, delay: 0, when: 'beforeChildren' },
  },
}

export default function SourceSections({
  sections,
  id = 'source-sections',
}: SourceSectionsProps) {
  // Already-present sections do not need an entrance. Newly added sections
  // stay in normal layout for measurement, then join the completed batch.
  const [reveals, setReveals] = useState(() => new Map<string, SourceReveal>(
    sections.map(section => [section.id, { target: 'settled', delay: 0 }]),
  ))

  const revealPending = useCallback(({ immediate }: HeightSettlement) => {
    setReveals(current => {
      const next = new Map<string, SourceReveal>()
      let changed = current.size !== sections.length
      let added = 0

      for (const section of sections) {
        const previous = current.get(section.id)
        const reveal: SourceReveal = previous
          ? immediate && previous.target !== 'settled'
            ? { target: 'settled', delay: 0 }
            : previous
          : { target: immediate ? 'settled' : 'visible', delay: immediate ? 0 : added++ * 0.12 }
        next.set(section.id, reveal)
        if (reveal !== previous) changed = true
      }

      return changed ? next : current
    })
  }, [sections])

  const settleReveal = useCallback((id: string) => {
    setReveals(current => {
      if (current.get(id)?.target !== 'visible') return current
      const next = new Map(current)
      next.set(id, { target: 'settled', delay: 0 })
      return next
    })
  }, [])

  return (
    <AnimatedHeight onSettled={revealPending}>
      <div
        id={id}
        style={{
          display: 'grid',
          gap: 24,
          minWidth: 0,
          marginTop: sections.length ? 24 : 0,
          padding: sections.length ? 'clamp(8px, 1.5vw, 16px)' : 0,
          paddingLeft: sections.length ? 'clamp(4px, 0.75vw, 8px)' : 0,
        }}
      >
        {sections.map((section, index) => {
          const reveal = reveals.get(section.id)
          return (
            <motion.div
              key={section.id}
              data-source-reveal={reveal?.target ?? 'waiting'}
              variants={panelVariants}
              initial={reveal?.target === 'settled' ? false : 'hidden'}
              animate={reveal?.target ?? 'hidden'}
              custom={reveal?.delay ?? 0}
              inert={!reveal || undefined}
              aria-hidden={!reveal || undefined}
              style={{ width: '100%', minWidth: 0, visibility: reveal ? 'visible' : 'hidden' }}
              onFocusCapture={() => settleReveal(section.id)}
              onAnimationComplete={definition => {
                if (definition === 'visible') settleReveal(section.id)
              }}
            >
              {sourceSectionTemplate.render(
                {
                  ...section,
                  borderTone: section.borderTone ?? (index % 2 === 0 ? 'aliceblue' : 'slatepurple'),
                },
                index + 1,
              )}
            </motion.div>
          )
        })}
      </div>
    </AnimatedHeight>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-sources-sourcesectiontemplate-tsx-7f370d1e"></a>
### src/components/sources/sourceSectionTemplate.tsx

1446 bytes · SHA-256 `d66913472b9279fe7df11bc4f48ab6a0fb1d9a7bd84123003bdb2046eecb225c` · utf8

```tsx
import type { ReactElement, ReactNode } from 'react'
import SourceSection, { DEFAULT_SOURCE_SECTION_TEXT, type SourceSectionBorderTone, type SourceSectionInstance } from './SourceSection'

const IPSUM_LENGTHS = [1, 4, 12] as const
let nextIpsumLength = 0

function createSection(repeats: number, borderTone?: SourceSectionBorderTone): SourceSectionInstance {
  return {
    id: crypto.randomUUID(),
    text: Array(repeats).fill(DEFAULT_SOURCE_SECTION_TEXT).join(' '),
    borderTone,
  }
}

// Reusable boilerplate: create an instance, then render it with optional output
// and title controls. This module does not depend on App or workspace storage.
export const sourceSectionTemplate = {
  create: (borderTone?: SourceSectionBorderTone): SourceSectionInstance => {
    const repeats = IPSUM_LENGTHS[nextIpsumLength]
    nextIpsumLength = (nextIpsumLength + 1) % IPSUM_LENGTHS.length
    return createSection(repeats, borderTone)
  },
  // A complete ordered trio does not depend on or advance single-create state.
  createBatch: (borderTone?: SourceSectionBorderTone): SourceSectionInstance[] => (
    IPSUM_LENGTHS.map(repeats => createSection(repeats, borderTone))
  ),
  render: (
    section: SourceSectionInstance,
    number: number,
    output?: ReactNode,
    controls?: ReactNode,
  ): ReactElement => (
    <SourceSection key={section.id} {...section} number={number} controls={controls}>
      {output}
    </SourceSection>
  ),
}
```

[Back to contents](#contents)

<a id="file-src-components-sources-usesourcesections-ts-b79d0cd7"></a>
### src/components/sources/useSourceSections.ts

581 bytes · SHA-256 `3bc6b3455836ae9ab13372f3360f1b8033268bbdd87def2fc6e66b360ab1b1cc` · utf8

```ts
import { useState } from 'react'
import type { SourceSectionInstance } from './SourceSection'
import { sourceSectionTemplate } from './sourceSectionTemplate'

export default function useSourceSections() {
  const [sourceSections, setSourceSections] = useState<SourceSectionInstance[]>([])

  function introduceSourceSection() {
    // Allocate each complete trio once, outside React's replayable updater.
    const sections = sourceSectionTemplate.createBatch()
    setSourceSections(current => [...current, ...sections])
  }

  return { sourceSections, introduceSourceSection }
}
```

[Back to contents](#contents)


<a id="group-motion"></a>
## Calendar motion and preferences

<a id="file-src-components-calendarmotion-calendarbutton-tsx-59204ed1"></a>
### src/components/calendarMotion/CalendarButton.tsx

1839 bytes · SHA-256 `54524a473e09124da603aa1ae912081cebe9a86f6141c5b2f58036f245179dd9` · utf8

```tsx
import { useEffect, type ReactNode } from 'react'
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  type HTMLMotionProps,
} from 'framer-motion'
import { useCalendarMotionPreferences } from './useCalendarMotionPreferences'
import './calendarMotion.css'

type CalendarButtonProps = Omit<
  HTMLMotionProps<'button'>,
  'children' | 'aria-label'
> & {
  label: string
  hoverLabel: string
  icon?: ReactNode
}

// The four colors and cycle settings are copied from Calendar4's auth buttons.
const COLOURS = [
  'rgba(159, 158, 158, 0.7)',
  'rgba(159, 158, 158, 0.5)',
  'rgba(130, 129, 129, 0.35)',
  'rgba(189, 188, 188, 0.2)',
]

export default function CalendarButton({
  label,
  hoverLabel,
  icon,
  className,
  style,
  disabled,
  type = 'button',
  ...props
}: CalendarButtonProps) {
  const { reducedMotion } = useCalendarMotionPreferences()
  const colour = useMotionValue(COLOURS[0])
  const border = useMotionTemplate`2px solid ${colour}`

  useEffect(() => {
    if (reducedMotion) {
      colour.set(COLOURS[0])
      return
    }

    const controls = animate(colour, COLOURS, {
      ease: 'easeInOut',
      duration: 10,
      repeat: Infinity,
      repeatType: 'mirror',
    })
    return () => controls.stop()
  }, [colour, reducedMotion])

  return (
    <motion.button
      {...props}
      className={`${className || ''} calendar-motion-button`.trim()}
      type={type}
      disabled={disabled}
      aria-label={label}
      data-calendar-reduced-motion={reducedMotion}
      style={{ ...style, border }}
    >
      <span className="calendar-button-labels" aria-hidden="true">
        <span className="calendar-button-default">{label}</span>
        <span className="calendar-button-hover">
          {icon}
          {hoverLabel}
        </span>
      </span>
    </motion.button>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-calendarmotion-calendarpanel-tsx-72c451ec"></a>
### src/components/calendarMotion/CalendarPanel.tsx

1842 bytes · SHA-256 `b5c8796562ab39d52ab5400e748afee68ec002136c5313a186d77cdc64a8435b` · utf8

```tsx
import { useEffect, useState, type ReactNode } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import { useCalendarMotionPreferences } from './useCalendarMotionPreferences'
import './calendarMotion.css'

export default function CalendarPanel({ children }: { children: ReactNode }) {
  const { reducedMotion, coarsePointer } = useCalendarMotionPreferences()
  const [focusWithin, setFocusWithin] = useState(false)
  const controls = useAnimationControls()
  const tiltEnabled = !reducedMotion && !coarsePointer && !focusWithin

  useEffect(() => {
    if (reducedMotion || focusWithin) {
      controls.stop()
      controls.set({ x: 0 })
    } else {
      // Starting again from the current x also supports StrictMode effect
      // replay. Preference changes never reset x to the off-screen position.
      void controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 70, damping: 20 },
      })
    }

    return () => controls.stop()
  }, [controls, reducedMotion, focusWithin])

  return (
    <motion.div
      className="calendar-panel-entrance"
      initial={{ x: reducedMotion ? 0 : '-100vw' }}
      animate={controls}
      data-calendar-focused={focusWithin}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false)
        }
      }}
    >
      <Tilt
        className={`calendar-panel-tilt${tiltEnabled ? '' : ' calendar-panel-tilt-steady'}`}
        scale={1}
        tiltMaxAngleX={2}
        tiltMaxAngleY={2}
        tiltEnable={tiltEnabled}
        tiltAngleXManual={tiltEnabled ? null : 0}
        tiltAngleYManual={tiltEnabled ? null : 0}
      >
        {children}
      </Tilt>
    </motion.div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-calendarmotion-calendarmotion-css-8053ff84"></a>
### src/components/calendarMotion/calendarMotion.css

2871 bytes · SHA-256 `6939d53c65eb4df71c723e686bf99440ebbaffdd314389f7fd077c6ceb8c351e` · utf8

```css
.calendar-panel-entrance,
.calendar-panel-tilt {
  width: 100%;
  min-width: 0;
}

/* A focused field stays at rest, even if its panel is still entering. */
.calendar-panel-entrance[data-calendar-focused='true'],
.calendar-panel-tilt.calendar-panel-tilt-steady {
  transform: none !important;
  transition: none !important;
}

.calendar-motion-button.button {
  position: relative;
  max-width: 100%;
  box-sizing: border-box;
  /* The constant 2px border reserves space before the color cycle starts. */
  border-width: 2px;
  border-style: solid;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.calendar-motion-button.button .calendar-button-labels {
  display: inline-grid;
  min-width: 0;
  max-width: 100%;
  font: inherit;
  line-height: inherit;
}

.calendar-button-default,
.calendar-button-hover {
  display: flex;
  grid-area: 1 / 1;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.calendar-button-default {
  transform: translateY(0);
  opacity: 1;
}

.calendar-button-hover {
  transform: translateY(-60%);
  opacity: 0;
}

.calendar-motion-button.button:not(:disabled):focus-visible {
  background-color: rgb(56, 137, 110);
  color: aliceblue;
}

.calendar-motion-button:not(:disabled):focus-visible .calendar-button-default {
  transform: translateY(-60%);
  opacity: 0;
}

.calendar-motion-button:not(:disabled):focus-visible .calendar-button-hover {
  transform: translateY(0);
  opacity: 1;
}

@media (hover: hover) {
  .calendar-motion-button.button:not(:disabled):hover {
    background-color: rgb(56, 137, 110);
    color: aliceblue;
  }

  .calendar-motion-button:not(:disabled):hover .calendar-button-default {
    transform: translateY(-60%);
    opacity: 0;
  }

  .calendar-motion-button:not(:disabled):hover .calendar-button-hover {
    transform: translateY(0);
    opacity: 1;
  }
}

.calendar-motion-button[data-calendar-reduced-motion='true'] .calendar-button-default {
  transform: none !important;
  opacity: 1 !important;
  transition: none !important;
}

.calendar-motion-button[data-calendar-reduced-motion='true'] .calendar-button-hover {
  transform: none !important;
  opacity: 0 !important;
  transition: none !important;
}

/* This also takes effect immediately, before the preference listener runs. */
@media (prefers-reduced-motion: reduce) {
  .calendar-panel-entrance,
  .calendar-panel-tilt {
    transform: none !important;
    transition: none !important;
  }

  .calendar-motion-button.button,
  .calendar-button-default,
  .calendar-button-hover {
    transition: none !important;
  }

  .calendar-motion-button .calendar-button-default {
    transform: none !important;
    opacity: 1 !important;
  }

  .calendar-motion-button .calendar-button-hover {
    transform: none !important;
    opacity: 0 !important;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-calendarmotion-usecalendarmotionpreferences-ts-d360d67a"></a>
### src/components/calendarMotion/useCalendarMotionPreferences.ts

1187 bytes · SHA-256 `80bab0383a72496c88823776d5b41d5fabdacb0ef97c24d18eb33d9c78dd336b` · utf8

```ts
import { useEffect, useState } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const coarsePointerQuery = '(pointer: coarse)'

function matches(query: string) {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  )
}

export function useCalendarMotionPreferences() {
  const [preferences, setPreferences] = useState(() => ({
    reducedMotion: matches(reducedMotionQuery),
    coarsePointer: matches(coarsePointerQuery),
  }))

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const reducedMotion = window.matchMedia(reducedMotionQuery)
    const coarsePointer = window.matchMedia(coarsePointerQuery)
    const update = () =>
      setPreferences({
        reducedMotion: reducedMotion.matches,
        coarsePointer: coarsePointer.matches,
      })

    update()
    reducedMotion.addEventListener('change', update)
    coarsePointer.addEventListener('change', update)

    return () => {
      reducedMotion.removeEventListener('change', update)
      coarsePointer.removeEventListener('change', update)
    }
  }, [])

  return preferences
}
```

[Back to contents](#contents)


<a id="group-moon"></a>
## Moon mark and compatibility scene

<a id="file-src-components-misc-moonmark-moonmark-module-css-8925e135"></a>
### src/components/misc/MoonMark/MoonMark.module.css

598 bytes · SHA-256 `2675da56d08541ec6cc6b9f9a6a062499edb4c3fd36b59bb90d55bcba29cb4a3` · utf8

```css
.mark {
  position: relative;
  display: block;
  width: var(--moon-mark-size, 112px);
  height: var(--moon-mark-size, 112px);
  flex-shrink: 0;
  vertical-align: middle;
  overflow: visible;
  pointer-events: none;
}

/* Opacity and the alpha-shaped glow affect only the decorative visual. */
.visual {
  position: absolute;
  inset: 0;
  opacity: 0.84;
  filter: drop-shadow(0 0 5px rgba(232, 240, 255, 0.24));
  background: transparent;
  pointer-events: none;
  overflow: visible;
}

.credit {
  font: inherit;
  color: inherit;
}

.credit a {
  color: inherit;
  text-underline-offset: 2px;
}
```

[Back to contents](#contents)

<a id="file-src-components-misc-moonmark-moonmark-tsx-5568e43c"></a>
### src/components/misc/MoonMark/MoonMark.tsx

3624 bytes · SHA-256 `aa340b2c3ea1c6c307c43ace62162fb1837079d1ddd09eee31f4667682f401a8` · utf8

```tsx
import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'
import { useMoonActivity } from './useMoonActivity'
import type { MoonRotationAxis } from './MoonModel'
import styles from './MoonMark.module.css'

const MoonMarkCanvas = lazy(() => import('./MoonMarkCanvas'))

export interface MoonMarkProps {
  size?: number
  animate?: boolean
  /** Axis in the Moon's parent group; keeps the source mesh orientation intact. */
  rotationAxis?: MoonRotationAxis
  /** Radians per second. The sign sets the direction; zero holds the angle. */
  rotationSpeed?: number
  className?: string
}

class MoonBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onUnavailable()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function MoonMark({
  size = 112, animate = false, rotationAxis, rotationSpeed, className,
}: MoonMarkProps) {
  const element = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const { inViewport, pageVisible, reducedMotion } = useMoonActivity(element)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    mounted.current = true
    setHasWebGL(
      typeof WebGL2RenderingContext !== 'undefined' ||
      typeof WebGLRenderingContext !== 'undefined',
    )
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (inViewport && pageVisible && hasWebGL) setRequested(true)
  }, [inViewport, pageVisible, hasWebGL])

  const onReady = useCallback(() => {
    if (mounted.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!mounted.current) return
    setReady(false)
    setUnavailable(true)
  }, [])

  const canRender = requested && hasWebGL && !unavailable
  const canAnimate = animate && rotationSpeed !== 0 && inViewport && pageVisible && !reducedMotion
  const state = hasWebGL === false || unavailable
    ? 'unavailable'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div
      ref={element}
      className={`${styles.mark}${className ? ` ${className}` : ''}`}
      style={{ '--moon-mark-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
      data-moon-mark
      data-moon-state={state}
      data-moon-animate={Boolean(canRender && canAnimate)}
    >
      <div className={styles.visual} data-moon-visual>
        {canRender && (
          <MoonBoundary onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <MoonMarkCanvas
                animate={canAnimate}
                rotationAxis={rotationAxis}
                rotationSpeed={rotationSpeed}
                onReady={onReady}
                onUnavailable={onUnavailable}
              />
            </Suspense>
          </MoonBoundary>
        )}
      </div>
    </div>
  )
}

export function MoonCredit() {
  return (
    <span className={styles.credit}>
      <a href="https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f" target="_blank" rel="noreferrer">Moon by MaggaModels</a>
      {' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
      {' · packaged and adapted for First Light'}
    </span>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-misc-moonmark-moonmarkcanvas-tsx-dbaa12ed"></a>
### src/components/misc/MoonMark/MoonMarkCanvas.tsx

2803 bytes · SHA-256 `29dff10d4ba403909514b745cc69044d53ea6108f67ae674ea17ddf6a8664fd8` · utf8

```tsx
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import MoonModel from './MoonModel'
import type { MoonRotationAxis } from './MoonModel'
import { useMoonResolution } from './useMoonResolution'

interface MoonMarkCanvasProps {
  animate?: boolean
  rotationAxis?: MoonRotationAxis
  rotationSpeed?: number
  onReady?: () => void
  onUnavailable?: () => void
}

// The source Moon's radius is about 2.8. These explicit bounds leave under
// 0.4% margin and make Fiber preserve the orthographic frustum on resize.
const camera = {
  position: [0, 0, 10] as [number, number, number],
  left: -2.81,
  right: 2.81,
  top: 2.81,
  bottom: -2.81,
  near: 0.1,
  far: 30,
}

export default function MoonMarkCanvas({
  animate = false,
  rotationAxis,
  rotationSpeed,
  onReady,
  onUnavailable,
}: MoonMarkCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const reportedLoss = useRef(false)
  const [unavailable, setUnavailable] = useState(false)
  const dpr = useMoonResolution()
  const rotating = animate && rotationSpeed !== 0

  useLayoutEffect(() => {
    readyCallback.current = onReady
    unavailableCallback.current = onUnavailable
  }, [onReady, onUnavailable])

  const forwardReady = useCallback(() => {
    if (!reportedLoss.current) readyCallback.current?.()
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (unavailable || !element) return

    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (reportedLoss.current) return
      reportedLoss.current = true
      setUnavailable(true)
      unavailableCallback.current?.()
    }

    element.addEventListener('webglcontextlost', onContextLost)
    return () => element.removeEventListener('webglcontextlost', onContextLost)
  }, [unavailable])

  if (unavailable) return null

  return (
    <Canvas
      ref={canvas}
      data-testid="moon-scene"
      orthographic
      camera={camera}
      gl={{ alpha: true, antialias: true }}
      dpr={dpr}
      frameloop={rotating ? 'always' : 'demand'}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        pointerEvents: 'none',
        touchAction: 'auto',
      }}
    >
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#808080', 0.6]} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <directionalLight position={[-4, -2, 1]} intensity={0.25} />
      <Suspense fallback={null}>
        <MoonModel animate={rotating} rotationAxis={rotationAxis} rotationSpeed={rotationSpeed} onReady={forwardReady} />
      </Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-misc-moonmark-moonmodel-tsx-ea70a7a5"></a>
### src/components/misc/MoonMark/MoonModel.tsx

1892 bytes · SHA-256 `0b481cb5843812071c5326565acad0e2f17f87b87c952f873d2c469fba727533` · utf8

```tsx
import { useCallback, useLayoutEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Mesh, type Group } from 'three'

export const MOON_MODEL_URL = `${import.meta.env.BASE_URL}media/moon/moon.glb`

export type MoonRotationAxis = 'x' | 'y' | 'z'

interface MoonModelProps {
  animate?: boolean
  rotationAxis?: MoonRotationAxis
  rotationSpeed?: number
  onReady?: () => void
}

// Locally adapted from Calendar4's Moon: preserve its geometry, material,
// Rx(-PI/2), and composed 0.028 × 100 scale. Framing belongs to the camera.
export default function MoonModel({
  animate = false,
  rotationAxis = 'y',
  rotationSpeed = -0.12,
  onReady,
}: MoonModelProps) {
  const { nodes, materials } = useGLTF(MOON_MODEL_URL)
  const moon = nodes.Moon_Moon_0
  const material = materials.Moon
  if (!(moon instanceof Mesh) || !material) {
    throw new Error('The Moon asset is missing its source mesh or material.')
  }

  const rotation = useRef<Group>(null)
  const rendered = useRef(false)
  const readyCallback = useRef(onReady)

  useLayoutEffect(() => {
    readyCallback.current = onReady
  }, [onReady])

  useFrame((_, delta) => {
    if (animate && rotation.current) {
      // Radians per second, applied to the parent without changing the mesh's source alignment.
      rotation.current.rotation[rotationAxis] += rotationSpeed * delta
    }
  })

  const afterRender = useCallback(() => {
    if (rendered.current) return
    rendered.current = true
    readyCallback.current?.()
  }, [])

  return (
    <group ref={rotation} scale={0.028} dispose={null}>
      <mesh
        geometry={moon.geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={100}
        dispose={null}
        onAfterRender={afterRender}
      />
    </group>
  )
}

useGLTF.preload(MOON_MODEL_URL)
```

[Back to contents](#contents)

<a id="file-src-components-misc-moonmark-moonmarktemplate-tsx-6159c5b4"></a>
### src/components/misc/MoonMark/moonMarkTemplate.tsx

297 bytes · SHA-256 `5a35b192464873ec4424962abc7efaef03cd7ba1e5c4d258418bf6090156899c` · utf8

```tsx
import type { ReactElement } from 'react'
import MoonMark, { type MoonMarkProps } from './MoonMark'

// A reusable scene object; the caller owns navigation. No separate icon layer.
export const moonMarkTemplate = {
  render: (props: MoonMarkProps = {}): ReactElement => <MoonMark {...props} />,
}
```

[Back to contents](#contents)

<a id="file-src-components-misc-moonmark-usemoonactivity-ts-4d569350"></a>
### src/components/misc/MoonMark/useMoonActivity.ts

1332 bytes · SHA-256 `adc3b8aad30e905426571eec96199b99c6e97257510931e899aa66c7262f9f0e` · utf8

```ts
import { useEffect, useState, type RefObject } from 'react'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'

export function useMoonActivity(target: RefObject<HTMLElement | null>) {
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )
  const { reducedMotion } = useCalendarMotionPreferences()

  useEffect(() => {
    const element = target.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return
    }

    let disposed = false
    const observer = new IntersectionObserver(entries => {
      if (disposed) return
      const entry = entries.find(value => value.target === element)
      if (entry) setInViewport(entry.isIntersecting)
    })
    observer.observe(element)
    return () => {
      disposed = true
      observer.disconnect()
    }
  }, [target])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return { inViewport, pageVisible, reducedMotion }
}
```

[Back to contents](#contents)

<a id="file-src-components-misc-moonmark-usemoonresolution-ts-cf2037e9"></a>
### src/components/misc/MoonMark/useMoonResolution.ts

2443 bytes · SHA-256 `cf35ed854043f3a680baa890a177993eb9e7643fa5450c99e0420f816e560fe1` · utf8

```ts
import { useEffect, useState } from 'react'

const MAX_RENDERER_DPR = 4

function positiveFinite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1
}

function readResolution(): number {
  if (typeof window === 'undefined') return 1
  const device = Math.max(1, positiveFinite(window.devicePixelRatio))
  const pinch = Math.max(1, positiveFinite(window.visualViewport?.scale))
  // Desktop page zoom is already reflected in devicePixelRatio. Viewport
  // scale contributes mobile pinch zoom; no extra layout/window ratio is used.
  return Math.min(MAX_RENDERER_DPR, device * pinch)
}

/** Event-driven render-buffer resolution, without changing the source texture. */
export function useMoonResolution(): number {
  const [resolution, setResolution] = useState(readResolution)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const viewport = window.visualViewport
    let disposed = false
    let watchedDpr: number | undefined
    let removeMediaListener = () => {}

    function update() {
      if (disposed) return
      const next = readResolution()
      setResolution(current => current === next ? current : next)

      const dpr = positiveFinite(window.devicePixelRatio)
      if (dpr === watchedDpr) return
      removeMediaListener()
      removeMediaListener = () => {}
      watchedDpr = dpr
      if (typeof window.matchMedia !== 'function') return

      // Re-arm against the current DPR so moving between displays also works
      // when a browser reports that change without a window resize event.
      const media = window.matchMedia(`(resolution: ${dpr}dppx)`)
      const changed = () => {
        watchedDpr = undefined
        update()
      }
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', changed)
        removeMediaListener = () => media.removeEventListener('change', changed)
      } else if (typeof media.addListener === 'function') {
        media.addListener(changed)
        removeMediaListener = () => media.removeListener(changed)
      }
    }

    window.addEventListener('resize', update)
    viewport?.addEventListener?.('resize', update)
    update()
    return () => {
      disposed = true
      window.removeEventListener('resize', update)
      viewport?.removeEventListener?.('resize', update)
      removeMediaListener()
    }
  }, [])

  return resolution
}
```

[Back to contents](#contents)

<a id="file-src-components-react-three-fibre-moonscene-moonscene-tsx-2b0910dd"></a>
### src/components/react three fibre/moonScene/MoonScene.tsx

61 bytes · SHA-256 `ecdda6a0f2fa3942dbbfea1bfc00fdafb913de328b546d111f0a66dc8f24af7f` · utf8

```tsx
export { default } from '../../misc/MoonMark/MoonMarkCanvas'
```

[Back to contents](#contents)

<a id="file-public-media-moon-moon-jsx-8bd8aa08"></a>
### public/media/moon/Moon.jsx

540 bytes · SHA-256 `b0c37c10520d9e9bedacfdd9321d90ad040393b2f1bdd74d2a923c032798b3e2` · utf8

```jsx
/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 moon.gltf
Author: MaggaModels (https://sketchfab.com/MaggaModels)
License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
Source: https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f
Title: Moon
*/

// Original attribution header retained above. This compatibility entrypoint now
// delegates to the application's canonical model instead of duplicating it.
export { default } from '../../../src/components/misc/MoonMark/MoonModel'
```

[Back to contents](#contents)


<a id="group-sun"></a>
## Calendar Sun scene

<a id="file-src-components-react-three-fibre-sunscene-sun-tsx-3d493c6f"></a>
### src/components/react three fibre/sunScene/Sun.tsx

828 bytes · SHA-256 `9b8076f5e219638c5ebac614d55ed71e6c84c63ea8f37b5d8891e473e82356b2` · utf8

```tsx
import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

const SUN_MODEL_URL = `${import.meta.env.BASE_URL}media/sun/sun.gltf`

export default function Model(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF(SUN_MODEL_URL)
  const sunRef = useRef<Group>(null)

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += -0.0075
    }
  })

  return (
    <group ref={sunRef} scale={0.0285} {...props} dispose={null}>
      <mesh
        geometry={(nodes.Sphere_Material002_0 as Mesh).geometry}
        material={materials['Material.002']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={100}
      />
    </group>
  )
}

useGLTF.preload(SUN_MODEL_URL)
```

[Back to contents](#contents)

<a id="file-src-components-react-three-fibre-sunscene-sunscene-tsx-9facbfc3"></a>
### src/components/react three fibre/sunScene/SunScene.tsx

2012 bytes · SHA-256 `860ef3f7594a7c493d8c31cd433ed8c969eb21dda90c7ac5c6a7d18ead9a3194` · utf8

```tsx
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import styles from './styles.module.css'

const Sun = lazy(() => import('./Sun'))

export default function SunScene() {
  const { reducedMotion } = useCalendarMotionPreferences()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return
    }

    let live = true
    const observer = new IntersectionObserver(entries => {
      if (!live) return
      const entry = entries.find(value => value.target === element)
      if (entry) setInViewport(entry.isIntersecting)
    })
    observer.observe(element)
    return () => {
      live = false
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  const interactive = inViewport && pageVisible

  return (
    <Canvas
      ref={canvas}
      className={styles.globeCanvas}
      data-testid="sun-scene"
      aria-hidden="true"
      frameloop={interactive && !reducedMotion ? 'always' : 'demand'}
    >
      <ambientLight intensity={2} />
      <OrbitControls enableZoom={false} enabled={interactive} />
      <Suspense fallback={null}>
        <Sun />
      </Suspense>
      <Environment files={`${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`} />
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-react-three-fibre-sunscene-styles-module-css-072f41a8"></a>
### src/components/react three fibre/sunScene/styles.module.css

167 bytes · SHA-256 `dd7c0b89cf7185edd30ee488993ccfab19c4b01535ce7348591ce68bf0bbd64f` · utf8

```css
.globeCanvas {
  position: relative;
  cursor: grab;
  z-index: 1;
  height: 100% !important;
  width: 100% !important;
  margin-left: auto;
  pointer-events: auto;
}
```

[Back to contents](#contents)


<a id="group-stars"></a>
## Star background

<a id="file-src-components-backgrounds-starsbackground-model-tsx-5e6c0430"></a>
### src/components/backgrounds/starsBackground/Model.tsx

1359 bytes · SHA-256 `e4ff2ee00f6c10439480b60c096c815a53531ad961faa13efecfa0032d5d64e9` · utf8

```tsx
import { memo, useRef } from 'react'
import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { Points } from 'three'

interface ModelProps {
  reducedMotion: boolean
}

// Keep the original prop without changing Drei's star shader. In the source
// version this extra Points property does not set the shader's star colors.
const sourceStarProps = { color: 'red' }
const STAR_ROTATION_RADIANS_PER_SECOND = 0.015

function Model({ reducedMotion }: ModelProps) {
  const stars = useRef<Points>(null)

  useFrame((_state, delta) => {
    if (!reducedMotion && stars.current) {
      // Preserve the original 60 FPS pace and x following y at any frame rate.
      stars.current.rotation.x = stars.current.rotation.y += STAR_ROTATION_RADIANS_PER_SECOND * delta
    }
  })

  return (
    <group>
      <mesh>
        <ambientLight intensity={1} />
        {/* The optional shooting star remains disabled, as in Calendar4. */}
        <Stars
          {...sourceStarProps}
          radius={200}
          count={7500}
          factor={4}
          fade
          ref={stars}
        />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} />
        </EffectComposer>
      </mesh>
    </group>
  )
}

export default memo(Model)
```

[Back to contents](#contents)

<a id="file-src-components-backgrounds-starsbackground-scene-tsx-0857e8dc"></a>
### src/components/backgrounds/starsBackground/Scene.tsx

848 bytes · SHA-256 `07cfa89518faedb91714e0936130540961450092c42c93b259d51921f997dea2` · utf8

```tsx
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import Model from './Model'

interface SceneProps {
  reducedMotion: boolean
}

export default function Scene({ reducedMotion }: SceneProps) {
  return (
    <Canvas
      frameloop={reducedMotion ? 'demand' : 'always'}
      fallback={null}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minHeight: '100%',
        pointerEvents: 'none',
      }}
    >
      <Suspense fallback={null}>
        <directionalLight intensity={3} position={[0, 3, 2]} />
        <Environment
          files={`${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`}
        />
        <Model reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-backgrounds-starsbackground-starbackground-tsx-b6114512"></a>
### src/components/backgrounds/starsBackground/StarBackground.tsx

1791 bytes · SHA-256 `16225bc21aca7070915ba6e7e56b9771ef15a45babfd1bc3145e0ca4d7dc228a` · utf8

```tsx
import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import Scene from './Scene'

interface BoundaryProps {
  children: ReactNode
}

interface BoundaryState {
  failed: boolean
}

class BackgroundBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The decorative renderer must never take down the research workspace.
    // The parent layer already supplies the black fallback.
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export default function StarBackground() {
  const reducedMotion = useReducedMotion()

  return (
    <div
      data-testid="star-background"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <BackgroundBoundary>
        <Scene reducedMotion={reducedMotion} />
      </BackgroundBoundary>
    </div>
  )
}
```

[Back to contents](#contents)


<a id="group-surfaces"></a>
## Shared glass surfaces and panes

<a id="file-src-components-glass-appleglass-module-css-ab4ba2bc"></a>
### src/components/glass/AppleGlass.module.css

405 bytes · SHA-256 `a960296994f11671b01b8f04b5f4fea1c313f1ca328745e6ff9fd96667c5321b` · utf8

```css
/* Local CSS adaptation of the supplied Apple-style HTML/SVG reference.
   No stylesheet or official Apple implementation was supplied. */
.appleGlass {
  --apple-glass-lens: inherit;
  --glassy-backdrop: var(--workspace-glass-blur);
}

@supports (backdrop-filter: url('#gls-liquid-glass-tab-bar-lens')) {
  .appleGlass {
    --glassy-backdrop: var(--apple-glass-lens,) var(--workspace-glass-blur);
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-appleglasslens-tsx-80cc41c4"></a>
### src/components/glass/AppleGlassLens.tsx

1712 bytes · SHA-256 `563659543991514969be904d424e28943dfe6f5da7be0fb65db60bbf3c9bb4d0` · utf8

```tsx
import type { CSSProperties } from 'react'

const LENS_ID = 'gls-liquid-glass-tab-bar-lens'

// Extracted verbatim from the supplied HTML reference, not a replacement map.
const DISPLACEMENT_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3ClinearGradient id='x'%3E%3Cstop offset='0' stop-color='%23800000'/%3E%3Cstop offset='0.12' stop-color='%23cc0000'/%3E%3Cstop offset='0.5' stop-color='%23800000'/%3E%3Cstop offset='0.88' stop-color='%23330000'/%3E%3Cstop offset='1' stop-color='%23800000'/%3E%3C/linearGradient%3E%3ClinearGradient id='y' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23008000'/%3E%3Cstop offset='0.14' stop-color='%2300b300'/%3E%3Cstop offset='0.5' stop-color='%23008000'/%3E%3Cstop offset='0.86' stop-color='%23004d00'/%3E%3Cstop offset='1' stop-color='%23008000'/%3E%3C/linearGradient%3E%3Crect width='1' height='1' fill='url(%23x)'/%3E%3Crect width='1' height='1' fill='url(%23y)' style='mix-blend-mode:screen'/%3E%3C/svg%3E"

export const appleGlassTheme = {
  '--apple-glass-lens': `url(#${LENS_ID})`,
} as CSSProperties

export default function AppleGlassLens() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      data-apple-glass-definitions
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <filter id={LENS_ID} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
        <feImage href={DISPLACEMENT_MAP} preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="20" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-glassysurface-module-css-15793ca8"></a>
### src/components/glass/GlassySurface.module.css

543 bytes · SHA-256 `eeac3f0955b0fe071f3ebfcabab165aaeacbd61ec762b0dbbef806930e9383bc` · utf8

```css
.glass {
  composes: appleGlass from './AppleGlass.module.css';
}

:where(.glass) {
  box-sizing: border-box;
  background-color: var(--workspace-glass-background);
  background-image: none;
  backdrop-filter: var(--glassy-backdrop, var(--workspace-glass-blur));
  -webkit-backdrop-filter: var(--glassy-backdrop, var(--workspace-glass-blur));
  border: var(--workspace-panel-border);
  border-radius: var(--workspace-panel-radius);
  box-shadow: var(--workspace-glass-shadow);
  color: var(--workspace-glass-colour);
  font-family: inherit;
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-appleglassboilerplate-html-8d84c597"></a>
### src/components/glass/appleGlassBoilerplate.html

3011 bytes · SHA-256 `77a86e1a2797710b3c9e126bef8fd2dbe99a92b9a6d5cef941fa638613a63236` · utf8

```html
<div class="gls-liquid-glass-tab-bar">
  <div class="gls-liquid-glass-tab-bar-feed" aria-hidden="true">
    <span></span><span></span><span></span><span></span><span></span><span></span>
    <span></span><span></span><span></span><span></span><span></span><span></span>
  </div>
  <div class="gls-liquid-glass-tab-bar-bar">
    <span class="gls-liquid-glass-tab-bar-drop" aria-hidden="true"></span>
    <label class="gls-liquid-glass-tab-bar-tab">
      <input type="radio" name="gls-liquid-glass-tab-bar-tab" checked aria-label="Home">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.5l8.5 7.2V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.3z"/></svg>
      <span>Home</span>
    </label>
    <label class="gls-liquid-glass-tab-bar-tab">
      <input type="radio" name="gls-liquid-glass-tab-bar-tab" aria-label="Search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
      <span>Search</span>
    </label>
    <label class="gls-liquid-glass-tab-bar-tab">
      <input type="radio" name="gls-liquid-glass-tab-bar-tab" aria-label="Saved">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.9-8 10.6-8 10.6z"/></svg>
      <span>Saved</span>
    </label>
    <label class="gls-liquid-glass-tab-bar-tab">
      <input type="radio" name="gls-liquid-glass-tab-bar-tab" aria-label="Profile">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.2"/><path d="M3.8 21a8.2 8.2 0 0 1 16.4 0z"/></svg>
      <span>Profile</span>
    </label>
  </div>
  <svg class="gls-liquid-glass-tab-bar-svg" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="gls-liquid-glass-tab-bar-lens" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
      <feImage href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3ClinearGradient id='x'%3E%3Cstop offset='0' stop-color='%23800000'/%3E%3Cstop offset='0.12' stop-color='%23cc0000'/%3E%3Cstop offset='0.5' stop-color='%23800000'/%3E%3Cstop offset='0.88' stop-color='%23330000'/%3E%3Cstop offset='1' stop-color='%23800000'/%3E%3C/linearGradient%3E%3ClinearGradient id='y' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23008000'/%3E%3Cstop offset='0.14' stop-color='%2300b300'/%3E%3Cstop offset='0.5' stop-color='%23008000'/%3E%3Cstop offset='0.86' stop-color='%23004d00'/%3E%3Cstop offset='1' stop-color='%23008000'/%3E%3C/linearGradient%3E%3Crect width='1' height='1' fill='url(%23x)'/%3E%3Crect width='1' height='1' fill='url(%23y)' style='mix-blend-mode:screen'/%3E%3C/svg%3E" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="20" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
</div>
```

[Back to contents](#contents)

<a id="file-src-components-panes-panebackground-module-css-b1828d9c"></a>
### src/components/panes/PaneBackground.module.css

100 bytes · SHA-256 `69943706f1334baaff88dbe3e140676cb8e975d95adf996db4de3816282cebc4` · utf8

```css
.background {
  composes: glass from '../glass/GlassySurface.module.css';
  font-family: inherit;
}
```

[Back to contents](#contents)

<a id="file-src-components-panes-panebackground-tsx-6489588a"></a>
### src/components/panes/PaneBackground.tsx

874 bytes · SHA-256 `d32aa8fd21efc8e37057275e255b3145bd5d4e053686b941e848db968c194401` · utf8

```tsx
import { createElement, type ComponentPropsWithRef, type ReactElement } from 'react'
import '../../styles/glass.css'
import styles from './PaneBackground.module.css'

export type PaneBackgroundElement = 'div' | 'section' | 'aside' | 'li' | 'header' | 'input' | 'textarea' | 'select'

export type PaneBackgroundProps<Element extends PaneBackgroundElement = 'div'> = {
  as?: Element
} & Omit<ComponentPropsWithRef<NoInfer<Element>>, 'as'>

export const paneBackgroundClassName = styles.background

export default function PaneBackground<Element extends PaneBackgroundElement = 'div'>({
  as,
  className,
  ...props
}: PaneBackgroundProps<Element>): ReactElement {
  const classes = `${paneBackgroundClassName}${className ? ` ${className}` : ''}`.trim().split(/\s+/)

  return createElement(as ?? 'div', {
    ...props,
    className: [...new Set(classes)].join(' '),
  })
}
```

[Back to contents](#contents)


<a id="group-glass-3d"></a>
## Three.js glass panel and example

<a id="file-src-components-glass-panel-3d-glassmaterial-tsx-92394bc8"></a>
### src/components/glass-panel-3d/GlassMaterial.tsx

459 bytes · SHA-256 `bf32dde8ee4cf389bd39700efc23439c5aeebccab131c585ebdf871ea663f8f4` · utf8

```tsx
// Pale cool glass picks up the environment without an opaque charcoal tint.
// Transmission refracts Three.js content; CSS handles blur over native HTML.
export default function GlassMaterial() {
  return (
    <meshPhysicalMaterial
      color="#cdd2d9"
      transmission={0.95}
      roughness={0.2}
      thickness={0.4}
      ior={1.45}
      envMapIntensity={0.4}
      metalness={0}
      clearcoat={0.75}
      clearcoatRoughness={0.18}
    />
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-glasspanel3d-module-css-8f2208a9"></a>
### src/components/glass-panel-3d/GlassPanel3D.module.css

949 bytes · SHA-256 `60b12714aff4c9e8c3a9b1294b032202788be5f5679d926cc34c3a67875eced2` · utf8

```css
.panel {
  composes: glass from '../glass/GlassySurface.module.css';
  /* A neutral smoked backing lets the scene behind the div stay visible. */
  --workspace-glass-background: rgba(44, 45, 49, .44);
  --workspace-glass-blur: blur(18px) saturate(1.15);
  --workspace-glass-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .09),
    inset 0 -1px 0 rgba(255, 255, 255, .025),
    0 18px 45px rgba(0, 0, 0, .32);
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 8rem;
  padding: clamp(1rem, 4vw, 1.75rem);
  background-image: linear-gradient(135deg, rgba(255, 255, 255, .065), rgba(255, 255, 255, 0) 55%);
}

.visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  /* Only the decorative scene is blended; native content stays fully opaque. */
  opacity: .16;
}

.content {
  position: relative;
  z-index: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-glasspanel3d-tsx-4820d591"></a>
### src/components/glass-panel-3d/GlassPanel3D.tsx

2768 bytes · SHA-256 `1a3aedfcd395f777984f750fb7aad5439182160252e3ff5318e50a0cf2320348` · utf8

```tsx
import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type ComponentPropsWithRef, type ReactNode,
} from 'react'
import '../../styles/glass.css'
import styles from './GlassPanel3D.module.css'

const GlassPanelCanvas = lazy(() => import('./GlassPanelCanvas'))

export type GlassPanel3DProps = ComponentPropsWithRef<'div'> & {
  /** Mounts only the decorative GPU layer. HTML children always remain mounted. */
  mounted?: boolean
  contentClassName?: string
}

class GlassLayerBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

/** Each explicit mount gets fresh readiness/error state and callback guards. */
function MountedGlassLayer() {
  const live = useRef(true)
  const failed = useRef(false)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    live.current = true
    setHasWebGL(
      typeof window.WebGL2RenderingContext !== 'undefined'
      || typeof window.WebGLRenderingContext !== 'undefined',
    )
    return () => { live.current = false }
  }, [])

  const onReady = useCallback(() => {
    if (live.current && !failed.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!live.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
  }, [])

  const state = unavailable || hasWebGL === false ? 'unavailable' : ready ? 'loaded' : 'loading'

  return (
    <div className={styles.visual} aria-hidden="true" data-glass-layer="" data-glass-state={state}>
      {hasWebGL && !unavailable && (
        <GlassLayerBoundary onUnavailable={onUnavailable}>
          <Suspense fallback={null}>
            <GlassPanelCanvas onReady={onReady} onUnavailable={onUnavailable} />
          </Suspense>
        </GlassLayerBoundary>
      )}
    </div>
  )
}

/** Native HTML content over a removable, static Three.js glass surface. */
export default function GlassPanel3D({
  mounted = true, children, className, contentClassName, ...props
}: GlassPanel3DProps) {
  return (
    <div
      {...props}
      className={[styles.panel, className].filter(Boolean).join(' ')}
      data-glass-panel=""
      data-glass-mounted={mounted}
    >
      {mounted && <MountedGlassLayer key="glass-layer" />}
      <div key="content" className={[styles.content, contentClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-glasspanelcanvas-tsx-84952dc4"></a>
### src/components/glass-panel-3d/GlassPanelCanvas.tsx

3724 bytes · SHA-256 `e6b63d4a9ece9f48ef8f27b0b99c75c093ad88de1d636437a3111986bc3e5970` · utf8

```tsx
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, RoundedBox, useEnvironment } from '@react-three/drei'
import GlassMaterial from './GlassMaterial'

export interface GlassPanelCanvasProps {
  onReady?: () => void
  onUnavailable?: () => void
}

export const GLASS_PANEL_ENVIRONMENT_URL = `${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`

const CAMERA_ZOOM = 100
const cameraOptions = {
  position: [0, 0, 5] as [number, number, number],
  zoom: CAMERA_ZOOM,
  near: 0.1,
  far: 50,
}

function GlassPanelMesh({ onDrawn }: { onDrawn: () => void }) {
  const width = useThree(state => state.size.width)
  const height = useThree(state => state.size.height)
  const scene = useThree(state => state.scene)
  // The HDR is shared with existing scenes. Environment's map form restores
  // this scene's environment without disposing the shared loader-cache texture.
  const environment = useEnvironment({ files: GLASS_PANEL_ENVIRONMENT_URL })
  const reportDrawn = useCallback(() => {
    if (scene.environment === environment) onDrawn()
  }, [scene, environment, onDrawn])
  const panelWidth = (width - 2) / CAMERA_ZOOM
  const panelHeight = (height - 2) / CAMERA_ZOOM
  const radius = Math.min(0.06, panelWidth / 4, panelHeight / 4)

  return (
    <>
      <Environment map={environment} background={false} />
      {panelWidth > 0 && panelHeight > 0 && (
        <RoundedBox
          name="glass-panel"
          args={[panelWidth, panelHeight, 0.16]}
          radius={radius}
          smoothness={4}
          bevelSegments={4}
          onAfterRender={reportDrawn}
        >
          <GlassMaterial />
        </RoundedBox>
      )}
    </>
  )
}

export default function GlassPanelCanvas({ onReady, onUnavailable }: GlassPanelCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const mounted = useRef(true)
  const drawn = useRef(false)
  const lost = useRef(false)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const [unavailable, setUnavailable] = useState(false)

  useLayoutEffect(() => {
    readyCallback.current = onReady
    unavailableCallback.current = onUnavailable
  }, [onReady, onUnavailable])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const reportDrawn = useCallback(() => {
    if (!mounted.current || lost.current || drawn.current) return
    drawn.current = true
    readyCallback.current?.()
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (unavailable || !element) return
    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!mounted.current || lost.current) return
      lost.current = true
      setUnavailable(true)
      unavailableCallback.current?.()
    }
    element.addEventListener('webglcontextlost', onContextLost)
    return () => element.removeEventListener('webglcontextlost', onContextLost)
  }, [unavailable])

  if (unavailable) return null

  return (
    <Canvas
      ref={canvas}
      data-testid="glass-panel-canvas"
      aria-hidden="true"
      orthographic
      camera={cameraOptions}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop="demand"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none', touchAction: 'auto' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 3, 5]} intensity={1.5} />
      <Suspense fallback={null}>
        <GlassPanelMesh onDrawn={reportDrawn} />
      </Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-glasspanelexample-module-css-5c79b0ac"></a>
### src/components/glass-panel-3d/GlassPanelExample.module.css

1423 bytes · SHA-256 `8d6f311742324c3da79bafb838e3e819992a0dd8f704210181588680e96a4a41` · utf8

```css
.example {
  position: relative;
  isolation: isolate;
  max-width: 48rem;
  margin: 12vh auto;
  padding: 1.5rem;
}

/* Preview-only lights behind the pane make its transparency easy to inspect. */
.example::before {
  content: '';
  position: absolute;
  inset: 26% 8% 5%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 22% 30%, rgba(163, 179, 195, .42), transparent 48%),
    radial-gradient(ellipse at 82% 75%, rgba(112, 141, 136, .32), transparent 48%);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-bottom: 1.5rem;
}

.sceneExample { margin-top: 3rem; }
.sceneExample .toolbar { align-items: center; justify-content: space-between; }

.toolbar button {
  padding: .7rem 1rem;
  color: inherit;
  background: rgba(35, 37, 49, .65);
  border: var(--workspace-panel-border);
  border-radius: var(--workspace-panel-radius);
}

.content {
  display: grid;
  gap: 1.1rem;
  line-height: 1.6;
}

.content h1 {
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -.035em;
}

.eyebrow {
  color: #c3cad9;
  font-size: .65rem;
  letter-spacing: .13em;
}

.field {
  display: grid;
  gap: .5rem;
  font-size: .85rem;
}

.field input {
  width: 100%;
  padding: .8rem;
  color: inherit;
  background: rgba(18, 20, 29, .25);
  border: var(--workspace-panel-border);
  border-radius: var(--workspace-panel-radius);
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-glasspanelexample-tsx-73100257"></a>
### src/components/glass-panel-3d/GlassPanelExample.tsx

2311 bytes · SHA-256 `bd13eca2d534ac8c02b6f20a5a5bc745f87250dc7362e8859644e0f8afe5eaa5` · utf8

```tsx
import { useState } from 'react'
import GlassPanel3D from './GlassPanel3D'
import { useGlassPanelMount } from './useGlassPanelMount'
import HtmlGlassCard from '../html-glass-card/HtmlGlassCard'
import { TransmissionGallery } from '../transmission/GlassCards'
import { GlassObjectGallery } from '../glass-objects/GlassObjectCards'
import styles from './GlassPanelExample.module.css'

/** Optional example. It is deliberately not mounted in the application. */
export default function GlassPanelExample() {
  const { isMounted, toggle } = useGlassPanelMount()
  const [expanded, setExpanded] = useState(false)
  const [previewError, setPreviewError] = useState(false)

  return (
    <main className={styles.example}>
      <div className={styles.toolbar}>
        <button type="button" onClick={toggle} aria-pressed={isMounted}>
          {isMounted ? 'Unmount 3D glass' : 'Mount 3D glass'}
        </button>
        <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
          {expanded ? 'Less content' : 'More content'}
        </button>
      </div>

      <GlassPanel3D mounted={isMounted} aria-labelledby="glass-panel-title" contentClassName={styles.content}>
        <p className={styles.eyebrow}>FIRST LIGHT / REUSABLE COMPONENT</p>
        <h1 id="glass-panel-title">A little more depth.</h1>
        <p>Your content stays in HTML. A separate Three.js layer gives this panel its glass surface.</p>
        {expanded && <p>The panel grows with its children. Turning off the 3D layer keeps this text and your draft in place, with the shared CSS glass styling underneath.</p>}
        <label className={styles.field}>
          Research draft
          <input name="draft" placeholder="Keep an idea here…" />
        </label>
      </GlassPanel3D>

      <section className={styles.sceneExample}>
        <div className={styles.toolbar}>
          <p className={styles.eyebrow}>HTML INSIDE THE SCENE</p>
          <button type="button" aria-pressed={previewError} onClick={() => setPreviewError(value => !value)}>
            {previewError ? 'Hide input error' : 'Preview input error'}
          </button>
        </div>
        <HtmlGlassCard error={previewError} />
      </section>
      <GlassObjectGallery />
      <TransmissionGallery />
    </main>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-researchdraftpanel-module-css-2a353987"></a>
### src/components/glass-panel-3d/ResearchDraftPanel.module.css

893 bytes · SHA-256 `069fed4dc61b5e300d5bccd92da9b6553eeb9e6e91eb8a4896a6ae1f5111ee14` · utf8

```css
.content {
  display: grid;
  gap: 1.1rem;
  line-height: 1.6;
}

.title {
  margin: 0;
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -.035em;
}

.eyebrow {
  color: #c3cad9;
  font-size: .65rem;
  letter-spacing: .13em;
}

.field {
  display: grid;
  gap: .5rem;
  font-size: .85rem;
}

.field textarea {
  display: block;
  width: 100%;
  min-height: 2.75rem;
  padding: .8rem;
  color: inherit;
  background: rgba(18, 20, 29, .25);
  border: var(--workspace-panel-border);
  border-radius: var(--workspace-panel-radius);
  font: inherit;
  line-height: 1.4;
  resize: vertical;
}

/* Keep the temporary-draft description available without adding a visual row. */
.hint {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-researchdraftpanel-tsx-0a7c8199"></a>
### src/components/glass-panel-3d/ResearchDraftPanel.tsx

1323 bytes · SHA-256 `accd7512621a7ad658d244ced47b0d4a0b2906f7efce2f171b0a6bdcb5ebfd28` · utf8

```tsx
import { useId, useState } from 'react'
import GlassPanel3D from './GlassPanel3D'
import styles from './ResearchDraftPanel.module.css'

export interface ResearchDraftPanelProps {
  /** Remove only the decorative scene; the native draft stays mounted. */
  mounted?: boolean
}

/** The original, simple glass-panel design, with a session-only native draft. */
export default function ResearchDraftPanel({ mounted = true }: ResearchDraftPanelProps) {
  const id = useId()
  const [draft, setDraft] = useState('')

  return (
    <GlassPanel3D mounted={mounted} aria-labelledby={`${id}-title`} contentClassName={styles.content}>
      <p className={styles.eyebrow}>FIRST LIGHT / REUSABLE COMPONENT</p>
      <h2 id={`${id}-title`} className={styles.title}>A little more depth.</h2>
      <p>Your content stays in HTML. A separate Three.js layer gives this panel its glass surface.</p>
      <label className={styles.field}>
        Research draft
        <textarea
          name="draft"
          rows={1}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Keep an idea here…"
          aria-describedby={`${id}-hint`}
        />
      </label>
      <span id={`${id}-hint`} className={styles.hint}>Temporary draft · Clears on reload</span>
    </GlassPanel3D>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-panel-3d-useglasspanelmount-ts-156e0735"></a>
### src/components/glass-panel-3d/useGlassPanelMount.ts

475 bytes · SHA-256 `a68f357aec8eaa4a9af496c3ec061f1bfdcb346f4a13bcbd1bb4f31c67d9b02f` · utf8

```ts
import { useCallback, useState } from 'react'

/** Controls the GPU layer without remounting the panel's HTML children. */
export function useGlassPanelMount(initialMounted = true) {
  const [isMounted, setMounted] = useState(initialMounted)
  const mount = useCallback(() => setMounted(true), [])
  const unmount = useCallback(() => setMounted(false), [])
  const toggle = useCallback(() => setMounted(value => !value), [])

  return { isMounted, mount, unmount, toggle }
}
```

[Back to contents](#contents)

<a id="file-examples-glass-panel-3d-main-tsx-00f7f408"></a>
### examples/glass-panel-3d/main.tsx

300 bytes · SHA-256 `6d1ba81dd1d843898f2aed396634eb06814d3d66a4968fb5891857f632f7764c` · utf8

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GlassPanelExample from '../../src/components/glass-panel-3d/GlassPanelExample'
import '../../src/App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><GlassPanelExample /></StrictMode>,
)
```

[Back to contents](#contents)


<a id="group-html-glass"></a>
## HTML glass card and scene helpers

<a id="file-src-components-html-glass-card-htmlglasscanvas-tsx-68256d4e"></a>
### src/components/html-glass-card/HtmlGlassCanvas.tsx

4911 bytes · SHA-256 `4326cceb3140b97872d5c53ffb3d73e292baa3a22d4c5f463e203933cf0841f4` · utf8

```tsx
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, type ComponentRef, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Html, MeshWobbleMaterial, RoundedBox, useEnvironment } from '@react-three/drei'
import GlassMaterial from '../glass-panel-3d/GlassMaterial'
import { moveHtmlHost } from './moveHtmlHost'

export interface HtmlGlassCanvasProps {
  host: HTMLDivElement
  nativeSlot: RefObject<HTMLDivElement | null>
  htmlPortal: RefObject<HTMLDivElement | null>
  cardWidth: number
  cardHeight: number
  animate: boolean
  onReady: () => void
  onUnavailable: () => void
}

const ZOOM = 100
const camera = { position: [0, 0, 6] as [number, number, number], zoom: ZOOM, near: .1, far: 50 }
const environmentUrl = `${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`

/** This slot contains a single persistent React portal, including native inputs. */
function HtmlMount({ host, nativeSlot, onAttached }: Pick<HtmlGlassCanvasProps, 'host' | 'nativeSlot'> & { onAttached: () => void }) {
  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!slot.current) return
    moveHtmlHost(host, slot.current)
    onAttached()
    return () => {
      if (nativeSlot.current) moveHtmlHost(host, nativeSlot.current)
      else host.remove()
    }
  }, [host, nativeSlot, onAttached])
  return <div ref={slot} data-html-scene-slot="" />
}

function WobbleAccent({ animate, x, y }: { animate: boolean; x: number; y: number }) {
  const material = useRef<ComponentRef<typeof MeshWobbleMaterial>>(null)
  useEffect(() => {
    const ownedMaterial = material.current
    return () => ownedMaterial?.dispose()
  }, [])
  return (
    <mesh name="html-glass-wobble-accent" position={[x, y, -.35]}>
      <torusGeometry args={[.58, .12, 16, 64]} />
      <MeshWobbleMaterial
        ref={material}
        color="#b0c9cb"
        factor={animate ? .08 : 0}
        speed={animate ? .45 : 0}
        roughness={.3}
        metalness={.15}
      />
    </mesh>
  )
}

function Scene({ host, nativeSlot, htmlPortal, cardWidth, cardHeight, animate, onReady }: Omit<HtmlGlassCanvasProps, 'onUnavailable'>) {
  const environment = useEnvironment({ files: environmentUrl })
  const scene = useThree(state => state.scene)
  const invalidate = useThree(state => state.invalidate)
  const size = useThree(state => state.size)
  const attached = useRef(false)
  const reported = useRef(false)
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])
  const onAttached = useCallback(() => { attached.current = true; invalidate() }, [invalidate])
  const onDrawn = useCallback(() => {
    if (!live.current || !attached.current || reported.current || scene.environment !== environment) return
    reported.current = true
    onReady()
  }, [environment, scene, onReady])
  const width = cardWidth / ZOOM
  const height = cardHeight / ZOOM

  return (
    <>
      <Environment map={environment} background={false} />
      <RoundedBox args={[width, height, .16]} radius={.06} smoothness={4} onAfterRender={onDrawn}>
        <GlassMaterial />
      </RoundedBox>
      <WobbleAccent animate={animate}
        x={Math.min(width / 2 - .12, size.width / ZOOM / 2 - .72)}
        y={Math.min(height / 2 - .45, size.height / ZOOM / 2 - .72)} />
      <Html
        portal={htmlPortal as RefObject<HTMLElement>}
        position={[0, 0, .2]}
        center
        transform
        distanceFactor={400 / ZOOM}
        occlude
        zIndexRange={[4, 0]}
        pointerEvents="auto"
      >
        <HtmlMount host={host} nativeSlot={nativeSlot} onAttached={onAttached} />
      </Html>
    </>
  )
}

export default function HtmlGlassCanvas(props: HtmlGlassCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const failureCallback = useRef(props.onUnavailable)
  useLayoutEffect(() => { failureCallback.current = props.onUnavailable }, [props.onUnavailable])
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const lost = (event: Event) => { event.preventDefault(); failureCallback.current() }
    element.addEventListener('webglcontextlost', lost)
    return () => element.removeEventListener('webglcontextlost', lost)
  }, [])

  return (
    <Canvas
      ref={canvas}
      data-testid="html-glass-canvas"
      orthographic
      camera={camera}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop={props.animate ? 'always' : 'demand'}
      onCreated={({ gl }) => { gl.domElement.setAttribute('aria-hidden', 'true') }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={.4} />
      <directionalLight position={[2, 3, 5]} intensity={1.5} />
      <Suspense fallback={null}><Scene {...props} /></Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-html-glass-card-htmlglasscard-module-css-655d53c6"></a>
### src/components/html-glass-card/HtmlGlassCard.module.css

1120 bytes · SHA-256 `2adda41b56e1b16c30d00d202b4b4bff607a33318671c328c04524ad10d02a5a` · utf8

```css
.scene {
  position: relative;
  isolation: isolate;
  width: 100%;
  min-width: 0;
  margin-top: 1rem;
  overflow: hidden;
}

.canvasLayer, .nativeSlot, .htmlPortal {
  position: absolute;
  inset: 0;
}

.canvasLayer { pointer-events: none; }
.htmlPortal { z-index: 1; pointer-events: none; }

.nativeSlot {
  display: grid;
  place-items: center;
  pointer-events: none;
}

.host {
  flex: none;
  pointer-events: auto;
}

/* The canvas alone is decorative; the Html DOM and its controls stay opaque. */
.canvasLayer canvas {
  opacity: .22;
  pointer-events: none;
}

.card {
  composes: panel from '../glass-panel-3d/GlassPanel3D.module.css';
  display: grid;
  gap: .75rem;
  width: 100%;
  padding: 1.25rem;
  line-height: 1.5;
}

.card p { margin: 0; }
.card label { font-size: .8rem; }
.eyebrow { font-size: .65rem; letter-spacing: .12em; color: #c3cad9; }
.hint { font-size: .7rem; color: #c3cad9; }

.note {
  display: block;
  width: 100%;
  height: 100%;
  padding: .25rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: .85rem;
  line-height: 1.5;
  resize: none;
}
```

[Back to contents](#contents)

<a id="file-src-components-html-glass-card-htmlglasscard-tsx-cc6acc96"></a>
### src/components/html-glass-card/HtmlGlassCard.tsx

5531 bytes · SHA-256 `ea34a8a5ebbcd6e9073e49426f3aaf8819585e97993b6eaded91cb1f294dfb03` · utf8

```tsx
import { Component, lazy, Suspense, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import HtmlGlassCardContent from './HtmlGlassCardContent'
import { moveHtmlHost } from './moveHtmlHost'
import { useHtmlSceneActivity } from './useHtmlSceneActivity'
import styles from './HtmlGlassCard.module.css'

const HtmlGlassCanvas = lazy(() => import('./HtmlGlassCanvas'))

export interface HtmlGlassCardProps {
  error?: boolean
  inputHeight?: number | null
  title?: string
  children?: ReactNode
  eyebrow?: string
  noteLabel?: string
  hint?: string
}

class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function HtmlGlassCard({
  error = false, inputHeight = 88, title = 'Hello from 3D.', children,
  eyebrow = 'HTML / THREE.JS', noteLabel = 'Scene research note',
  hint = 'Click or focus the field to see the Calendar4 highlight.',
}: HtmlGlassCardProps) {
  const root = useRef<HTMLDivElement>(null)
  const nativeSlot = useRef<HTMLDivElement>(null)
  const htmlPortal = useRef<HTMLDivElement>(null)
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('div')
    element.className = styles.host
    element.setAttribute('data-html-content-host', '')
    return element
  })
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const focusWithin = useRef(false)
  const lastFocused = useRef<HTMLElement | null>(null)
  const [cardWidth, setCardWidth] = useState(260)
  const [cardHeight, setCardHeight] = useState(300)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const live = useRef(true)
  const failed = useRef(false)
  const fieldId = useId()
  const activity = useHtmlSceneActivity(root)

  useLayoutEffect(() => {
    if (host && nativeSlot.current) moveHtmlHost(host, nativeSlot.current)
  }, [host])

  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => setCardWidth(Math.max(160, Math.min(520, element.clientWidth - 32)))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => { if (host) host.style.width = `${cardWidth}px` }, [host, cardWidth])

  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])
  useEffect(() => {
    if (activity.inViewport && activity.pageVisible && activity.hasWebGL) setRequested(true)
  }, [activity.inViewport, activity.pageVisible, activity.hasWebGL])

  const onReady = useCallback(() => { if (live.current && !failed.current) setReady(true) }, [])
  const onUnavailable = useCallback(() => {
    if (!live.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
    if (host && nativeSlot.current) moveHtmlHost(host, nativeSlot.current)
    // Html may detach its wrapper before an error boundary reports the failure.
    if (focusWithin.current && lastFocused.current?.isConnected) lastFocused.current.focus({ preventScroll: true })
  }, [host])
  const onFocusWithinChange = useCallback((next: boolean) => {
    focusWithin.current = next
    if (next) lastFocused.current = document.activeElement as HTMLElement | null
    setFocused(next)
  }, [])
  const onSize = useCallback((_width: number, height: number) => { if (height > 0) setCardHeight(height) }, [])

  const canRender = requested && activity.hasWebGL === true && !unavailable && host !== null
  const animate = canRender && ready && activity.inViewport && activity.pageVisible && !activity.reducedMotion && !focused
  const state = unavailable || activity.hasWebGL === false ? 'unavailable' : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div
      ref={root}
      className={styles.scene}
      style={{ height: Math.max(360, cardHeight + 80) }}
      data-html-glass-card=""
      data-html-state={state}
      data-html-animate={animate}
    >
      <div ref={nativeSlot} className={styles.nativeSlot} data-html-native-slot="" />
      {host && createPortal(
        <HtmlGlassCardContent
          fieldId={fieldId} value={value} onValueChange={setValue} error={error} inputHeight={inputHeight}
          onFocusWithinChange={onFocusWithinChange} onSize={onSize}
          title={title} eyebrow={eyebrow} noteLabel={noteLabel} hint={hint}
        >
          {children}
        </HtmlGlassCardContent>, host,
      )}
      {canRender && (
        <div className={styles.canvasLayer}>
          <SceneBoundary onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <HtmlGlassCanvas host={host} nativeSlot={nativeSlot} htmlPortal={htmlPortal} cardWidth={cardWidth} cardHeight={cardHeight}
                animate={animate} onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </SceneBoundary>
        </div>
      )}
      <div ref={htmlPortal} className={styles.htmlPortal} data-html-portal="" />
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-html-glass-card-htmlglasscardcontent-tsx-bce2b899"></a>
### src/components/html-glass-card/HtmlGlassCardContent.tsx

2497 bytes · SHA-256 `6d6a16707967b66c4bee1ad0daf0c1aa358f1f65366019e3aaaff2dfb05063ca` · utf8

```tsx
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import ModalInputContainer from '../input/ModalInput/ModalInputContainer'
import ThreeDHeading from '../typography/ThreeDHeading'
import '../../styles/glass.css'
import styles from './HtmlGlassCard.module.css'

export interface HtmlGlassCardContentProps {
  fieldId: string
  value: string
  error: boolean
  inputHeight: number | null
  onValueChange: (value: string) => void
  onFocusWithinChange: (focused: boolean) => void
  onSize: (width: number, height: number) => void
  title: string
  children?: ReactNode
  eyebrow: string
  noteLabel: string
  hint: string
}

export default function HtmlGlassCardContent({
  fieldId, value, error, inputHeight, onValueChange, onFocusWithinChange, onSize,
  title, children, eyebrow, noteLabel, hint,
}: HtmlGlassCardContentProps) {
  const element = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const node = element.current
    if (!node) return
    const measure = () => onSize(node.offsetWidth, node.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [onSize])

  return (
    <div
      ref={element}
      className={styles.card}
      data-html-glass-content=""
      role="group"
      aria-labelledby={`${fieldId}-title`}
      onFocusCapture={() => onFocusWithinChange(true)}
      onBlurCapture={event => {
        if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) onFocusWithinChange(false)
      }}
    >
      <p className={styles.eyebrow}>{eyebrow}</p>
      <ThreeDHeading id={`${fieldId}-title`} title={title}>
        {children === undefined ? <p>This is real HTML inside the scene. The glass and torus are Three.js objects.</p> : children}
      </ThreeDHeading>
      <label htmlFor={fieldId}>{noteLabel}</label>
      <ModalInputContainer text={value} error={error} height={inputHeight}>
        <textarea
          id={fieldId}
          className={styles.note}
          value={value}
          onChange={event => onValueChange(event.target.value)}
          aria-invalid={error}
          aria-describedby={`${fieldId}-hint`}
          placeholder="An idea worth exploring…"
        />
      </ModalInputContainer>
      <p className={styles.hint} id={`${fieldId}-hint`}>
        {error ? 'Preview error: review this note.' : hint}
      </p>
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-html-glass-card-movehtmlhost-ts-fc90908f"></a>
### src/components/html-glass-card/moveHtmlHost.ts

1193 bytes · SHA-256 `0e9ce2e37e79319bd2e292c93128732a302346eddbbecd0006ae7dd7146fe1ff` · utf8

```ts
type MovableElement = HTMLElement & { moveBefore: (node: Node, child: Node | null) => void }

/** Reparent the same native controls between Drei Html and their DOM fallback. */
export function moveHtmlHost(host: HTMLDivElement, target: HTMLElement) {
  if (host.parentElement === target) return
  const active = host.contains(document.activeElement) ? document.activeElement as HTMLElement : null
  const field = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active : null
  const selection = field ? [field.selectionStart, field.selectionEnd, field.selectionDirection] as const : null

  // Newer browsers preserve focus/state through a connected DOM move.
  if (host.isConnected && target.isConnected && typeof (target as MovableElement).moveBefore === 'function') {
    (target as MovableElement).moveBefore(host, null)
  } else {
    target.appendChild(host)
  }
  if (active && active.isConnected && document.activeElement !== active) {
    active.focus({ preventScroll: true })
    if (field && selection && selection[0] !== null && selection[1] !== null) {
      field.setSelectionRange(selection[0], selection[1], selection[2] ?? undefined)
    }
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-html-glass-card-usehtmlsceneactivity-ts-87b6214d"></a>
### src/components/html-glass-card/useHtmlSceneActivity.ts

1852 bytes · SHA-256 `ab193a8397996b31752dc6cb8630552709ceffe45ae75f59f25ddd080a9b4539` · utf8

```ts
import { useEffect, useState, type RefObject } from 'react'

export function useHtmlSceneActivity(target: RefObject<HTMLElement | null>) {
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined'
    && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)

  useEffect(() => {
    setHasWebGL(typeof WebGL2RenderingContext !== 'undefined' || typeof WebGLRenderingContext !== 'undefined')
    const element = target.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return
    }
    let disposed = false
    const observer = new IntersectionObserver(entries => {
      if (disposed) return
      const entry = entries.find(value => value.target === element)
      if (entry) setInViewport(entry.isIntersecting)
    })
    observer.observe(element)
    return () => { disposed = true; observer.disconnect() }
  }, [target])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return { inViewport, pageVisible, reducedMotion, hasWebGL }
}
```

[Back to contents](#contents)


<a id="group-transmission"></a>
## Transmission materials and scene cards

<a id="file-src-components-transmission-glasscards-css-c731421e"></a>
### src/components/transmission/GlassCards.css

2244 bytes · SHA-256 `e1a594c44ba846d156e99a8a70a380607fcda9b0df0b2696ee9aeb74efe3832a` · utf8

```css
.transmission-gallery, .transmission-card { min-width: 0; font-family: inherit; color: inherit; }
.transmission-gallery { display: grid; gap: 1.25rem; margin-top: 3rem; scroll-margin-top: 1rem; }
.transmission-card { overflow: hidden; background: rgba(35,37,49,.5); border: var(--workspace-panel-border, 1px solid rgba(240,248,255,.12)); border-radius: var(--workspace-panel-radius, 6px); }
.transmission-heading { display: grid; gap: .7rem; padding: 1.25rem; }
.transmission-heading p { margin: 0; color: #bdc6d5; font-size: .65rem; letter-spacing: .13em; }
.transmission-heading h3 { margin: 0; font-size: 1.35rem; font-weight: 600; }
.transmission-stage { position: relative; height: clamp(22rem,56vw,32rem); min-width: 0; overflow: hidden; background: #080b14; touch-action: pan-y; }
.transmission-stage canvas { display: block; opacity: 1; }
/* Scene tags stay hidden; the surrounding native card header identifies it. */
.transmission-annotation { display: none; }
.transmission-status { margin: 0; padding: .8rem 1.25rem; color: #bdc6d5; font-size: .75rem; }
.transmission-controls { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; min-width: 0; margin: 0; padding: 1.25rem; border: 0; border-top: 1px solid rgba(240,248,255,.12); }
.transmission-controls legend { padding: 0 .4rem; font-size: .8rem; }
.transmission-controls label, .transmission-selector { display: grid; gap: .45rem; min-width: 0; font-size: .8rem; }
.transmission-controls input, .transmission-controls select, .transmission-selector select, .transmission-controls button { min-width: 0; max-width: 100%; color: inherit; font: inherit; }
.transmission-controls input:not([type="range"]):not([type="checkbox"]), .transmission-controls select, .transmission-selector select, .transmission-controls button { padding: .65rem; background: rgba(18,20,29,.6); border: 1px solid rgba(240,248,255,.18); border-radius: 6px; }
.transmission-controls input[type="range"] { width: 100%; accent-color: #ff9470; }
.transmission-controls .transmission-checkbox { display: flex; align-items: center; gap: .6rem; }
.transmission-controls button { cursor: pointer; }
@media(max-width:560px) { .transmission-controls { grid-template-columns: minmax(0,1fr); } }
```

[Back to contents](#contents)

<a id="file-src-components-transmission-glasscards-tsx-26d03c88"></a>
### src/components/transmission/GlassCards.tsx

9185 bytes · SHA-256 `0bdac200028febc96a5707e808867727b2a1d02ce2be8703976ec8095151c267` · utf8

```tsx
import {
  Component, lazy, Suspense, useCallback, useEffect, useId,
  useMemo, useRef, useState, type ReactNode,
} from 'react'
import { DEFAULT_GLASS_SETTINGS, type GlassSettings } from './GlassPrimitives'
import { useTransmissionActivity } from './useTransmissionActivity'
import { clearTransmissionAssetCache } from './transmissionAssets'
import type { TextPlacement, TransmissionQuality, TransmissionVariant } from './transmissionTypes'
import './GlassCards.css'

const TransmissionCanvas = lazy(() => import('./TransmissionCanvas'))

export interface TransmissionCardProps {
  title?: string
  initialText?: string
  children?: ReactNode
}

class SceneBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

const SLIDERS = [
  ['transmission', 'Transmission', 0, 1, 0.01],
  ['thickness', 'Thickness', 0.2, 1.5, 0.01],
  ['ior', 'Refraction index', 1.1, 1.8, 0.01],
  ['chromaticAberration', 'Chromatic aberration', 0, 0.1, 0.001],
  ['roughness', 'Roughness', 0, 0.25, 0.01],
] as const

function TransmissionCard({
  variant, title, initialText = 'GLASS', children,
}: TransmissionCardProps & { variant: TransmissionVariant }) {
  const id = useId()
  const stage = useRef<HTMLDivElement>(null)
  const activity = useTransmissionActivity(stage)
  const alive = useRef(true)
  const blocked = useRef(false)
  const epoch = useRef(0)
  const failureReason = useRef<'renderer' | 'context'>('renderer')
  const [attempt, setAttempt] = useState(0)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [word, setWord] = useState(initialText)
  const [placement, setPlacement] = useState<TextPlacement>('behind')
  const [textDepth, setTextDepth] = useState(0)
  const [glassText, setGlassText] = useState(false)
  const [quality, setQuality] = useState<TransmissionQuality>('auto')
  const [motion, setMotion] = useState(true)
  const [tuning, setTuning] = useState<GlassSettings>(() => ({ ...DEFAULT_GLASS_SETTINGS }))

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  useEffect(() => {
    if (activity.inView && activity.pageVisible && activity.webgl) setRequested(true)
  }, [activity.inView, activity.pageVisible, activity.webgl])

  const effectiveQuality = quality === 'auto'
    ? activity.coarse ? 'balanced' : 'high'
    : quality
  const high = effectiveQuality === 'high'
  const settings = useMemo(() => ({
    ...tuning,
    samples: high ? 6 : 4,
    resolution: high ? 512 : 256,
    backside: high,
  }), [tuning, high])

  const onReady = useCallback(() => {
    if (alive.current && epoch.current === attempt && !blocked.current) setReady(true)
  }, [attempt])
  const onUnavailable = useCallback((reason: 'renderer' | 'context' = 'renderer') => {
    if (!alive.current || epoch.current !== attempt || blocked.current) return
    blocked.current = true
    failureReason.current = reason
    setFailed(true)
    setReady(false)
  }, [attempt])
  const retry = () => {
    if (failed && failureReason.current !== 'context') clearTransmissionAssetCache()
    epoch.current += 1
    blocked.current = false
    setAttempt(epoch.current)
    setFailed(false)
    setReady(false)
  }

  const canRender = requested && activity.webgl === true && !failed
  const animate = canRender && ready && motion && activity.inView
    && activity.pageVisible && !activity.reduced && !focused
  const state = failed || activity.webgl === false
    ? 'unavailable'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <section className="transmission-card" aria-labelledby={`${id}-title`}
      data-transmission-state={state} data-transmission-animate={animate}
      data-transmission-variant={variant} data-transmission-quality={effectiveQuality}>
      <header className="transmission-heading">
        <p>FIRST LIGHT / GLASS STUDY</p>
        <h3 id={`${id}-title`}>{title ?? (variant === 'panel'
          ? 'Rounded transmission panel' : 'Cinematic refraction')}</h3>
        {children}
      </header>

      <div ref={stage} className="transmission-stage" data-transmission-stage="">
        {canRender && (
          <SceneBoundary key={attempt} onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <TransmissionCanvas variant={variant} text={word.trim().slice(0, 14) || 'GLASS'}
                placement={placement} textDepth={textDepth} glassText={glassText}
                settings={settings} animate={animate}
                interactive={activity.inView && activity.pageVisible && !focused}
                coarse={activity.coarse} high={high}
                onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <p className="transmission-status" role="status">
        {state === 'unavailable' ? '3D preview unavailable. Your settings are kept.'
          : state === 'loaded' ? 'Motion pauses while editing. Drag on desktop to rotate.'
            : state === 'pending' ? 'The 3D scene loads when it comes into view.'
              : 'Loading the local 3D scene…'}
      </p>

      <fieldset className="transmission-controls"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
        }}>
        <legend>Scene controls</legend>
        <label>Lettering
          <input value={word} maxLength={14} onChange={event => setWord(event.currentTarget.value)} />
        </label>
        <label>Text placement
          <select value={placement} onChange={event => setPlacement(event.currentTarget.value as TextPlacement)}>
            <option value="behind">Behind the glass</option>
            <option value="inside">Inside the glass</option>
            <option value="intersecting">Intersecting the surface</option>
          </select>
        </label>
        <label>Quality
          <select value={quality} onChange={event => setQuality(event.currentTarget.value as TransmissionQuality)}>
            <option value="auto">Automatic</option>
            <option value="balanced">Balanced / mobile</option>
            <option value="high">High / desktop</option>
          </select>
        </label>
        <label>Text depth offset: {textDepth.toFixed(2)}
          <input type="range" min={-0.8} max={0.8} step={0.01} value={textDepth}
            onChange={event => setTextDepth(Number(event.currentTarget.value))} />
        </label>
        {SLIDERS.map(([key, label, min, max, step]) => (
          <label key={key}>{label}: {tuning[key].toFixed(3)}
            <input type="range" min={min} max={max} step={step} value={tuning[key]}
              onChange={event => {
                const value = Number(event.currentTarget.value)
                setTuning(previous => ({ ...previous, [key]: value }))
              }} />
          </label>
        ))}
        <label className="transmission-checkbox">
          <input type="checkbox" checked={glassText} onChange={event => setGlassText(event.currentTarget.checked)} />
          Glass lettering
        </label>
        <label className="transmission-checkbox">
          <input type="checkbox" checked={motion} onChange={event => setMotion(event.currentTarget.checked)} />
          Gentle motion
        </label>
        <button type="button" onClick={retry}>{failed ? 'Retry 3D preview' : 'Reset 3D view'}</button>
      </fieldset>
    </section>
  )
}

export function RoundedTransmissionCard(props: TransmissionCardProps) {
  return <TransmissionCard {...props} variant="panel" />
}

export function CinematicTransmissionCard(props: TransmissionCardProps) {
  return <TransmissionCard {...props} variant="cinematic" />
}

export function TransmissionGallery() {
  const [variant, setVariant] = useState<TransmissionVariant>('panel')
  useEffect(() => {
    if (window.location.hash !== '#transmission-studies') return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('transmission-studies')?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  return (
    <section id="transmission-studies" className="transmission-gallery">
      <h2>Transmission studies</h2>
      <label className="transmission-selector">Card version
        <select value={variant} onChange={event => setVariant(event.currentTarget.value as TransmissionVariant)}>
          <option value="panel">Rounded glass panel</option>
          <option value="cinematic">Sphere, torus and 3D text</option>
        </select>
      </label>
      {/* A single active scene bounds the gallery's GPU context count. */}
      <TransmissionCard variant={variant} />
    </section>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-transmission-glassprimitives-tsx-f38b34f5"></a>
### src/components/transmission/GlassPrimitives.tsx

4429 bytes · SHA-256 `c6fbf9e1c7323eecba3c3b57f1937fcafdab33af6f083dfd7a63f020803f3edf` · utf8

```tsx
import { MeshTransmissionMaterial } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

export interface GlassSettings {
  transmission: number
  thickness: number
  roughness: number
  ior: number
  chromaticAberration: number
  anisotropicBlur: number
  distortion: number
  distortionScale: number
  temporalDistortion: number
  backside: boolean
  backsideThickness: number
  samples: number
  resolution: number
  color: string
}

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  transmission: 1,
  thickness: 0.85,
  roughness: 0.08,
  ior: 1.4,
  chromaticAberration: 0.04,
  anisotropicBlur: 0.2,
  distortion: 0.2,
  distortionScale: 0.3,
  temporalDistortion: 0.1,
  backside: true,
  backsideThickness: 0.3,
  samples: 6,
  resolution: 512,
  color: '#e8f4ff',
}

export function TransmissionSurface({
  settings,
  animate = false,
}: {
  settings: GlassSettings
  animate?: boolean
}) {
  const materialProps = {
    // Use automatic scene capture, without an external buffer or shared sampler.
    transmissionSampler: false,
    // Full optical transmission is independent of CSS opacity.
    transmission: settings.transmission,
    // Estimate optical travel distance; actual geometry thickness is separate.
    thickness: settings.thickness,
    // Mild scattering softens otherwise perfectly sharp refraction.
    roughness: settings.roughness,
    // Moderate refraction bends the scene without an extreme lens effect.
    ior: settings.ior,
    // Subtle RGB separation adds a refractive edge.
    chromaticAberration: settings.chromaticAberration,
    // Directional scattering gives the glass a less polished appearance.
    anisotropicBlur: settings.anisotropicBlur,
    // Spatial distortion supplies the liquid-glass character.
    distortion: settings.distortion,
    // Broad distortion patterns avoid finely rippled noise.
    distortionScale: settings.distortionScale,
    // Static mode removes temporal distortion; the parent owns frame scheduling.
    temporalDistortion: animate ? settings.temporalDistortion : 0,
    // Capture the reverse surface to strengthen the sense of volume.
    backside: settings.backside,
    // Estimate optical thickness separately for that reverse-surface pass.
    backsideThickness: settings.backsideThickness,
    // Explicitly select the user's sample count instead of Drei's default ten.
    samples: settings.samples,
    // Drei embeds this count in GLSL; keep quality changes out of Three's old program cache.
    customProgramCacheKey: () => `first-light-transmission-v1:${settings.samples}`,
    // Bound capture size; backside resolution follows this value by default.
    resolution: settings.resolution,
    // Pale cool glass retains light rather than creating an opaque dark fill.
    color: settings.color,
    // Glass is a dielectric, not a metallic surface.
    metalness: 0,
    // Keep environment reflections visible without overpowering transmission.
    envMapIntensity: 0.8,
    // A restrained clear layer defines the surface highlights.
    clearcoat: 0.75,
    // Soften those clearcoat highlights instead of using a hard mirror finish.
    clearcoatRoughness: 0.18,
    // Keep the material opaque for compositing; transmission carries the light.
    opacity: 1,
  }

  return <MeshTransmissionMaterial {...materialProps} />
}

export type GlassPrimitiveProps = Omit<
  ThreeElements['mesh'],
  'args' | 'children' | 'geometry' | 'material'
> & {
  settings: GlassSettings
  animate?: boolean
}

const SPHERE_ARGS: [radius: number, widthSegments: number, heightSegments: number] = [1, 128, 96]
const TORUS_ARGS: [radius: number, tube: number, radialSegments: number, tubularSegments: number] = [1, 0.34, 48, 192]

// One host and one material avoid automatic capture mutating a material array.
// Native mesh props, including refs, pass through without geometry overrides.
export function GlassSphere({ settings, animate = false, ...meshProps }: GlassPrimitiveProps) {
  return (
    <mesh {...meshProps}>
      <sphereGeometry args={SPHERE_ARGS} />
      <TransmissionSurface settings={settings} animate={animate} />
    </mesh>
  )
}

export function GlassTorus({ settings, animate = false, ...meshProps }: GlassPrimitiveProps) {
  return (
    <mesh {...meshProps}>
      <torusGeometry args={TORUS_ARGS} />
      <TransmissionSurface settings={settings} animate={animate} />
    </mesh>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-transmission-glassstudioenvironment-tsx-21c64c8f"></a>
### src/components/transmission/GlassStudioEnvironment.tsx

1481 bytes · SHA-256 `7a17a550357da9917493234cb02af844f515e7ea7291ae63b11809306f0bd6fc` · utf8

```tsx
import { Environment, Lightformer } from '@react-three/drei'
import { memo } from 'react'

// Drei recaptures all cube faces when Environment's children change identity.
// Keep those children stable across unrelated React updates and optical edits.
const StudioEnvironmentContents = memo(function StudioEnvironmentContents({ intensity }: { intensity: number }) {
  return (
    <Environment frames={1} resolution={128} background={false}>
      {/* These softboxes exist only in Environment's separate capture scene.
          They never add shapes to the visible object scene or its backdrop. */}
      <color attach="background" args={['#151820']} />
      <Lightformer form="circle" intensity={4.5 * intensity} color="#f0f5ff"
        scale={[7, 8, 1]} position={[4, 4, 5]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={2.25 * intensity} color="#b8ddff"
        scale={8} position={[-4, 1, 3]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={3 * intensity} color="#fff4e8"
        scale={[3, 12, 1]} position={[0, 5, -2]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={1.25 * intensity} color="#f0f5ff"
        scale={8} position={[0, 0, 5]} target={[0, 0, 0]} />
    </Environment>
  )
})

/** Reflection lighting without a room/city photograph imprinted on the glass. */
export function GlassStudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  return <StudioEnvironmentContents intensity={intensity} />
}
```

[Back to contents](#contents)

<a id="file-src-components-transmission-transmissioncanvas-tsx-a549c86f"></a>
### src/components/transmission/TransmissionCanvas.tsx

8696 bytes · SHA-256 `68f2983ad5c8d2bee52c4612172bcebb236d1b4f783e40e15c19a5e58c4557bf` · utf8

```tsx
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Center, ContactShadows, Float, Html, OrbitControls,
  RoundedBox, Text3D,
} from '@react-three/drei'
import {
  ACESFilmicToneMapping, OrthographicCamera, SRGBColorSpace,
  type Camera, type Group, type Scene, type WebGLRenderer,
} from 'three'
import { GlassSphere, GlassTorus, TransmissionSurface } from './GlassPrimitives'
import type { TransmissionCanvasProps } from './transmissionTypes'
import { TRANSMISSION_FONT_URL } from './transmissionAssets'
import { GlassStudioEnvironment } from './GlassStudioEnvironment'

function VolumeText({ variant, text, placement, textDepth, glassText, settings, animate }: TransmissionCanvasProps) {
  const fit = useRef<Group>(null)
  const invalidate = useThree(state => state.invalidate)
  const textSettings = useMemo(() => ({
    ...settings, thickness: 0.25, backside: false, distortion: 0.08,
  }), [settings])
  const onCentered = useCallback(({ width, height, depth }: { width: number; height: number; depth: number }) => {
    const diagonal = Math.hypot(width, height, depth)
    if (!fit.current || !Number.isFinite(width) || !Number.isFinite(diagonal) || width <= 0 || diagonal <= 0) return
    const scale = placement === 'inside' && variant === 'cinematic'
      ? Math.min(1, 1.65 / diagonal)
      : Math.min(1, (variant === 'panel' ? 4.6 : 3.8) / width)
    fit.current.scale.setScalar(scale)
    invalidate(3)
  }, [invalidate, placement, variant])
  const z = { behind: -1.65, inside: 0, intersecting: 0.3 }[placement] + textDepth

  return (
    <group position={[0, 0, z]}>
      <Float enabled={animate} autoInvalidate={false} speed={0.75}
        rotationIntensity={0.04} floatIntensity={0.35} floatingRange={[-0.05, 0.05]}>
        {/* Measure a fresh subtree at scale 1 after changing word/placement. */}
        <group key={`${variant}:${placement}:${text}`} ref={fit}>
          <Center onCentered={onCentered}>
            <Text3D font={TRANSMISSION_FONT_URL} size={0.72} height={0.28} curveSegments={12}
              bevelEnabled bevelThickness={0.025} bevelSize={0.018} bevelSegments={4}>
              {text}
              {glassText ? <TransmissionSurface settings={textSettings} animate={animate} />
                : <meshStandardMaterial color="#fff0e6" metalness={0.2} roughness={0.3} />}
            </Text3D>
          </Center>
        </group>
      </Float>
    </group>
  )
}

function SceneContents(props: TransmissionCanvasProps) {
  const { variant, settings, animate, interactive, coarse, high, onReady } = props
  const camera = useThree(state => state.camera)
  const size = useThree(state => state.size)
  const invalidate = useThree(state => state.invalidate)
  const reported = useRef(false)
  const designHeight = variant === 'panel' ? 5.6 : 6.1
  const zoom = Math.min(size.width / 7.6, size.height / designHeight)

  useLayoutEffect(() => {
    if (camera instanceof OrthographicCamera && Number.isFinite(zoom) && zoom > 0) {
      camera.zoom = zoom
      camera.updateProjectionMatrix()
      invalidate(3)
    }
  }, [camera, invalidate, zoom])
  useEffect(() => {
    // Finite settling allowance for separate buffers, not recursive convergence.
    invalidate(3)
  }, [invalidate, props.text, props.placement, props.textDepth, props.glassText, settings, animate])

  const reportMainDraw = useCallback((renderer: WebGLRenderer, _scene: Scene, renderedCamera: Camera) => {
    // Readiness excludes transmission and shadow render-target captures.
    if (reported.current || renderer.getRenderTarget() !== null || renderedCamera !== camera) return
    reported.current = true
    onReady()
  }, [camera, onReady])

  return (
    <>
      <color attach="background" args={['#080b14']} />
      <GlassStudioEnvironment />
      <VolumeText {...props} />
      {variant === 'panel' ? (
        <>
          <Float enabled={animate} autoInvalidate={false} speed={0.6}
            rotationIntensity={0.12} floatIntensity={0.3}>
            <RoundedBox name="transmission-rounded-panel" args={[6.3, 3.4, 0.42]}
              radius={0.18} smoothness={8} bevelSegments={8} rotation={[-0.12, 0.15, -0.01]}
              onAfterRender={reportMainDraw}>
              <TransmissionSurface settings={settings} animate={animate} />
            </RoundedBox>
          </Float>
          <GlassTorus name="transmission-torus" position={[-2.05, 0.65, -0.65]}
            rotation={[0.25, -0.35, 0.1]} scale={0.6} settings={settings} animate={animate} />
          <GlassSphere name="transmission-sphere" position={[2, 0.65, -0.65]}
            scale={0.6} settings={settings} animate={animate} />
        </>
      ) : (
        <Float enabled={animate} autoInvalidate={false} speed={0.65}
          rotationIntensity={0.18} floatIntensity={0.5} floatingRange={[-0.05, 0.05]}>
          <GlassSphere name="transmission-sphere" scale={1.1} settings={settings}
            animate={animate} onAfterRender={reportMainDraw} />
          <GlassTorus name="transmission-torus" position={[0, 0, 0.25]}
            rotation={[0.3, -0.35, 0.12]} scale={1.45} settings={settings} animate={animate} />
        </Float>
      )}

      {/* Opaque anchors and bars provide recognizable content to refract. */}
      <mesh position={[-2.2, -1.1, -1.1]} castShadow>
        <sphereGeometry args={[0.3, 48, 32]} />
        <meshPhysicalMaterial color="#d9ad72" metalness={0.35} roughness={0.28} clearcoat={0.6} />
      </mesh>
      <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.08} smoothness={4}
        position={[2.25, -0.9, -1]} rotation={[0.2, 0.4, 0.2]} castShadow>
        <meshStandardMaterial color="#596879" roughness={0.7} />
      </RoundedBox>
      {[0.75, -0.75].map((y, index) => (
        <mesh key={y} position={[0, y, -2]}>
          <boxGeometry args={[5.6, 0.07, 0.06]} />
          <meshStandardMaterial color={index ? '#ff9470' : '#b8e4ff'} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#03050a" roughness={1} envMapIntensity={0.05} />
      </mesh>
      {/* Only executes on scheduled frames; idle demand rendering stays settled. */}
      <ContactShadows position={[0, -2.05, 0]} opacity={0.25} scale={10}
        blur={2.5} far={6} resolution={high ? 256 : 128} />

      {/* Clear of glass: raycast occlusion treats transmission meshes as solid. */}
      <Html position={[0, 2.45, 1.5]} center transform occlude
        distanceFactor={400 / Math.max(zoom, 1)} style={{ pointerEvents: 'none' }}>
        <span className="transmission-annotation">FIRST LIGHT / TRANSMISSION</span>
      </Html>
      {!coarse && <OrbitControls makeDefault enabled={interactive} enableZoom={false}
        enablePan={false} enableDamping={false} minAzimuthAngle={-0.6} maxAzimuthAngle={0.6}
        minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.25}
        onEnd={() => invalidate(3)} />}
    </>
  )
}

export default function TransmissionCanvas(props: TransmissionCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let live = true
    const lost = (event: Event) => {
      event.preventDefault()
      if (live) props.onUnavailable('context')
    }
    element.addEventListener('webglcontextlost', lost)
    return () => {
      live = false
      element.removeEventListener('webglcontextlost', lost)
    }
  }, [props.onUnavailable])

  return (
    <Canvas ref={canvas} data-testid="transmission-canvas" aria-hidden="true" orthographic shadows
      camera={{ position: [0, 0.6, 8], zoom: 70, near: 0.1, far: 40 }}
      dpr={[1, props.high ? 1.75 : 1.25]} gl={{ alpha: false, antialias: true }}
      frameloop={props.animate ? 'always' : 'demand'} style={{ touchAction: 'pan-y' }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.outputColorSpace = SRGBColorSpace
        gl.domElement.style.touchAction = 'pan-y'
        invalidate(3)
      }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={3.5} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 2, -4]} color="#b8ddff" intensity={4} />
      <pointLight position={[-4, 1, 1]} color="#ff9470" intensity={16} distance={9} />
      <Suspense fallback={null}><SceneContents {...props} /></Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-transmission-transmissionassets-ts-aaaad7ce"></a>
### src/components/transmission/transmissionAssets.ts

644 bytes · SHA-256 `9ece30c098b00d51c2928856c3aa08aaa30cfd84e309567b8ec370f970c5893c` · utf8

```ts
import { useEnvironment, useFont } from '@react-three/drei'

export const TRANSMISSION_ENVIRONMENT_URL = `${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`
export const TRANSMISSION_FONT_URL = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`

/** An explicit asset-error retry evicts only this scene's two loader keys.
 * Clearing these entries does not dispose resources retained by other scenes.
 * Context-only retries keep the successful cache entries.
 */
export function clearTransmissionAssetCache() {
  useEnvironment.clear({ files: TRANSMISSION_ENVIRONMENT_URL })
  useFont.clear(TRANSMISSION_FONT_URL)
}
```

[Back to contents](#contents)

<a id="file-src-components-transmission-transmissiontypes-ts-54133895"></a>
### src/components/transmission/transmissionTypes.ts

583 bytes · SHA-256 `7883e5b1bff3393fc4b66a9f304bb760f97a70f7355488e2065ecd8cceb22896` · utf8

```ts
import type { GlassSettings } from './GlassPrimitives'

export type TransmissionVariant = 'panel' | 'cinematic'
export type TextPlacement = 'behind' | 'inside' | 'intersecting'
export type TransmissionQuality = 'auto' | 'balanced' | 'high'

export interface TransmissionCanvasProps {
  variant: TransmissionVariant
  text: string
  placement: TextPlacement
  textDepth: number
  glassText: boolean
  settings: GlassSettings
  animate: boolean
  interactive: boolean
  coarse: boolean
  high: boolean
  onReady: () => void
  onUnavailable: (reason?: 'renderer' | 'context') => void
}
```

[Back to contents](#contents)

<a id="file-src-components-transmission-usetransmissionactivity-ts-6c4da281"></a>
### src/components/transmission/useTransmissionActivity.ts

2078 bytes · SHA-256 `952e64c7f7bb177491530d90fa42e5744757cbb92a735ea0b3ddb9a5f4412cfb` · utf8

```ts
import { useEffect, useState, type RefObject } from 'react'

export function useTransmissionActivity(target: RefObject<HTMLDivElement | null>) {
  const [activity, setActivity] = useState({
    inView: false,
    pageVisible: true,
    reduced: true,
    coarse: true,
    webgl: null as boolean | null,
  })

  useEffect(() => {
    let live = true
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const pointer = window.matchMedia?.('(pointer: coarse)')
    const update = () => {
      if (!live) return
      setActivity(previous => ({
        ...previous,
        pageVisible: document.visibilityState !== 'hidden',
        reduced: motion?.matches ?? true,
        coarse: pointer?.matches ?? true,
        webgl: typeof window.WebGL2RenderingContext !== 'undefined'
          || typeof window.WebGLRenderingContext !== 'undefined',
      }))
    }
    const watch = (query: MediaQueryList | undefined) => {
      if (!query) return () => {}
      if (query.addEventListener) {
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
      }
      query.addListener(update)
      return () => query.removeListener(update)
    }
    const stopMotion = watch(motion)
    const stopPointer = watch(pointer)
    document.addEventListener('visibilitychange', update)
    update()

    const element = target.current
    const observer = element && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
          if (!live) return
          const entry = entries.find(value => value.target === element)
          if (entry) setActivity(previous => ({ ...previous, inView: entry.isIntersecting }))
        })
      : null
    if (observer && element) observer.observe(element)
    else setActivity(previous => ({ ...previous, inView: true }))

    return () => {
      live = false
      observer?.disconnect()
      stopMotion()
      stopPointer()
      document.removeEventListener('visibilitychange', update)
    }
  }, [target])

  return activity
}
```

[Back to contents](#contents)


<a id="group-glass-objects"></a>
## Isolated glass objects and rotation

<a id="file-src-components-glass-objects-glassobjectcanvas-tsx-0ec44c1a"></a>
### src/components/glass-objects/GlassObjectCanvas.tsx

5019 bytes · SHA-256 `f07a593a4708b24bb712689145c5a2d6c909df8c842f510256683dcb922a74c1` · utf8

```tsx
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  ACESFilmicToneMapping, OrthographicCamera, SRGBColorSpace,
  type Camera, type Mesh, type Scene, type WebGLRenderer,
} from 'three'
import { GlassStudioEnvironment } from '../transmission/GlassStudioEnvironment'
import GlassTorusObject from './GlassTorusObject'
import GlassPanelObject from './GlassPanelObject'
import type { GlassObjectCanvasProps } from './glassObjectSceneTypes'

function ObjectScene(props: GlassObjectCanvasProps) {
  const { kind, settings, spin, rotationAxis, rotationSpeed, interactive, coarse, onReady } = props
  const camera = useThree(state => state.camera)
  const size = useThree(state => state.size)
  const invalidate = useThree(state => state.invalidate)
  const reported = useRef(false)
  // Fit a bounding sphere rather than the front face, so every spin axis fits.
  const designSize = kind === 'torus' ? 4.6 : 6.8
  const zoom = Math.min(size.width, size.height) / designSize

  useLayoutEffect(() => {
    reported.current = false
    if (camera instanceof OrthographicCamera && Number.isFinite(zoom) && zoom > 0) {
      camera.zoom = zoom
      camera.updateProjectionMatrix()
      invalidate(3)
    }
  }, [camera, invalidate, kind, zoom])
  useEffect(() => {
    // Finite refresh for optical/camera changes; no recursive idle invalidation.
    invalidate(3)
  }, [invalidate, settings, spin, rotationAxis, rotationSpeed, props.lightingIntensity])

  const reportMainDraw = useCallback((renderer: WebGLRenderer, scene: Scene, renderedCamera: Camera) => {
    if (reported.current || renderer.getRenderTarget() !== null || renderedCamera !== camera) return
    reported.current = true
    const meshes: Mesh[] = []
    scene.traverse(object => {
      if ((object as Mesh).isMesh && object.visible) meshes.push(object as Mesh)
    })
    // Diagnostics describe the real scene after its first main draw, not a mock.
    const canvas = renderer.domElement
    canvas.dataset.glassObjectMeshCount = String(meshes.length)
    canvas.dataset.glassObjectGeometry = meshes[0]?.geometry.type ?? ''
    const geometry = meshes[0]?.geometry
    canvas.dataset.glassObjectTriangles = String(geometry
      ? (geometry.index?.count ?? geometry.attributes.position.count) / 3 : 0)
    onReady()
  }, [camera, onReady])

  const objectProps = { settings, spin, rotationAxis, rotationSpeed, onRendered: reportMainDraw }
  return (
    <>
      <color attach="background" args={['#080b14']} />
      <GlassStudioEnvironment intensity={props.lightingIntensity} />
      {/* Exactly one visible mesh. No text, tags, shadow planes or extra shapes. */}
      {kind === 'torus'
        ? <GlassTorusObject {...objectProps} name="isolated-glass-torus" />
        : <GlassPanelObject {...objectProps} name="isolated-glass-panel" />}
      {!coarse && <OrbitControls makeDefault enabled={interactive}
        enableZoom={false} enablePan={false} enableDamping={false}
        minAzimuthAngle={-0.6} maxAzimuthAngle={0.6}
        minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.25}
        onEnd={() => invalidate(3)} />}
    </>
  )
}

/** One renderer for one isolated object. The surrounding card owns its activity. */
export default function GlassObjectCanvas(props: GlassObjectCanvasProps) {
  const lightingIntensity = props.lightingIntensity ?? 1
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let live = true
    const lost = (event: Event) => {
      event.preventDefault()
      if (live) props.onUnavailable('context')
    }
    element.addEventListener('webglcontextlost', lost)
    return () => {
      live = false
      element.removeEventListener('webglcontextlost', lost)
    }
  }, [props.onUnavailable])

  return (
    <Canvas ref={canvas} data-testid="glass-object-canvas" data-glass-environment="studio-lights"
      aria-hidden="true" orthographic
      camera={{ position: [0, 0.35, 8], zoom: 70, near: 0.1, far: 40 }}
      dpr={[1, props.high ? 1.75 : 1.25]} gl={{ alpha: false, antialias: true }}
      frameloop={props.spin ? 'always' : 'demand'} style={{ touchAction: 'pan-y' }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.outputColorSpace = SRGBColorSpace
        gl.domElement.style.touchAction = 'pan-y'
        invalidate(3)
      }}>
      <ambientLight intensity={0.7 * lightingIntensity} />
      <directionalLight position={[3, 5, 6]} intensity={3.5 * lightingIntensity} />
      <directionalLight position={[-3, 2, -4]} color="#b8ddff" intensity={4 * lightingIntensity} />
      <pointLight position={[-4, 1, 1]} color="#ff9470" intensity={16 * lightingIntensity} distance={9} />
      <Suspense fallback={null}><ObjectScene {...props} /></Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-glassobjectcards-css-c8823ea3"></a>
### src/components/glass-objects/GlassObjectCards.css

370 bytes · SHA-256 `1efd2581e36e437aa0b2a4b022bb8bfd5567f28b5c9e3512dfe3776991fef56d` · utf8

```css
/* Match the existing card design; keep every label outside the 3D objects. */
.glass-object-card .transmission-heading > :not(h3):not(p) { margin: 0; }
.glass-object-stage { isolation: isolate; }
.glass-object-controls :is(input, select, button):focus-visible,
.glass-object-gallery > label select:focus-visible {
  outline: 2px solid #ff9470;
  outline-offset: 3px;
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-glassobjectcards-tsx-6093911e"></a>
### src/components/glass-objects/GlassObjectCards.tsx

8758 bytes · SHA-256 `04cfced1d3f0b5db72fb70da3bc43baf448898210b8ba5963c35a8ac1e5983be` · utf8

```tsx
import {
  Component, lazy, memo, Suspense, useCallback, useEffect, useId,
  useMemo, useRef, useState, type ReactNode,
} from 'react'
import { DEFAULT_GLASS_SETTINGS, type GlassSettings } from '../transmission/GlassPrimitives'
import { useTransmissionActivity } from '../transmission/useTransmissionActivity'
import type { TransmissionQuality } from '../transmission/transmissionTypes'
import type { GlassObjectCardProps, GlassObjectKind } from './glassObjectSceneTypes'
import type { RotationAxis } from './useObjectRotation'
import '../transmission/GlassCards.css'
import './GlassObjectCards.css'

export type { GlassObjectCardProps } from './glassObjectSceneTypes'

const GlassObjectCanvas = lazy(() => import('./GlassObjectCanvas'))

class ObjectBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

const SLIDERS = [
  ['transmission', 'Transmission', 0, 1, 0.01],
  ['thickness', 'Thickness', 0.2, 1.5, 0.01],
  ['ior', 'Refraction index', 1.1, 1.8, 0.01],
  ['chromaticAberration', 'Chromatic aberration', 0, 0.1, 0.001],
  ['roughness', 'Roughness', 0, 0.25, 0.01],
] as const

const GlassObjectCard = memo(function GlassObjectCard({
  kind, title, children, initialSpin = true, initialRotationAxis = 'y',
  initialRotationSpeed = 0.3, initialMaterial, lightingIntensity = 1,
}: GlassObjectCardProps & { kind: GlassObjectKind }) {
  const id = useId()
  const stage = useRef<HTMLDivElement>(null)
  const activity = useTransmissionActivity(stage)
  const alive = useRef(true)
  const blocked = useRef(false)
  const epoch = useRef(0)
  const [attempt, setAttempt] = useState(0)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [motion, setMotion] = useState(initialSpin)
  const [axis, setAxis] = useState<RotationAxis>(initialRotationAxis)
  const [speed, setSpeed] = useState(initialRotationSpeed)
  const [quality, setQuality] = useState<TransmissionQuality>('auto')
  const [tuning, setTuning] = useState<GlassSettings>(() => ({ ...DEFAULT_GLASS_SETTINGS, ...initialMaterial }))

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  useEffect(() => {
    if (activity.inView && activity.pageVisible && activity.webgl) setRequested(true)
  }, [activity.inView, activity.pageVisible, activity.webgl])

  const effectiveQuality = quality === 'auto' ? activity.coarse ? 'balanced' : 'high' : quality
  const high = effectiveQuality === 'high'
  const settings = useMemo(() => ({
    ...tuning, samples: high ? 6 : 4, resolution: high ? 512 : 256, backside: high,
  }), [tuning, high])
  const onReady = useCallback(() => {
    if (alive.current && epoch.current === attempt && !blocked.current) setReady(true)
  }, [attempt])
  const onUnavailable = useCallback(() => {
    if (!alive.current || epoch.current !== attempt || blocked.current) return
    blocked.current = true
    setFailed(true)
    setReady(false)
  }, [attempt])
  const retry = () => {
    epoch.current += 1
    blocked.current = false
    setAttempt(epoch.current)
    setFailed(false)
    setReady(false)
  }

  const canRender = requested && activity.webgl === true && !failed
  const spin = canRender && ready && motion && Number.isFinite(speed) && speed !== 0
    && activity.inView && activity.pageVisible && !activity.reduced && !focused
  const state = failed || activity.webgl === false
    ? 'unavailable' : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <section className="transmission-card glass-object-card" aria-labelledby={`${id}-title`}
      data-glass-object-state={state} data-glass-object-spin={spin}
      data-glass-object-kind={kind} data-glass-object-quality={effectiveQuality}
      data-glass-object-lighting={lightingIntensity}>
      <header className="transmission-heading">
        <p>FIRST LIGHT / GLASS OBJECT</p>
        <h3 id={`${id}-title`}>{title ?? (kind === 'torus' ? 'Spinning glass torus' : 'A single glass panel')}</h3>
        {children}
      </header>

      <div ref={stage} className="transmission-stage glass-object-stage" data-glass-object-stage="">
        {canRender && (
          <ObjectBoundary key={attempt} onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <GlassObjectCanvas kind={kind} settings={settings} spin={spin}
                rotationAxis={axis} rotationSpeed={speed}
                interactive={activity.inView && activity.pageVisible && !focused}
                coarse={activity.coarse} high={high} lightingIntensity={lightingIntensity}
                onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </ObjectBoundary>
        )}
      </div>

      <p className="transmission-status" role="status">
        {state === 'unavailable' ? '3D preview unavailable. Your settings are kept.'
          : state === 'pending' ? 'The object loads when it comes into view.'
            : state === 'loading' ? 'Loading the local glass scene…'
              : 'Spin pauses while editing, offscreen and with reduced motion. Drag on desktop to turn the view.'}
      </p>

      <fieldset className="transmission-controls glass-object-controls"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
        }}>
        <legend>Object controls</legend>
        <label>Rotation axis
          <select value={axis} onChange={event => setAxis(event.currentTarget.value as RotationAxis)}>
            <option value="x">X axis</option><option value="y">Y axis</option><option value="z">Z axis</option>
          </select>
        </label>
        <label>Rotation speed: {speed.toFixed(2)} rad/s
          <input type="range" min={-1} max={1} step={0.01} value={speed}
            onChange={event => setSpeed(Number(event.currentTarget.value))} />
        </label>
        <label>Quality
          <select value={quality} onChange={event => setQuality(event.currentTarget.value as TransmissionQuality)}>
            <option value="auto">Automatic</option>
            <option value="balanced">Balanced / mobile</option>
            <option value="high">High / desktop</option>
          </select>
        </label>
        {SLIDERS.map(([key, label, min, max, step]) => (
          <label key={key}>{label}: {tuning[key].toFixed(3)}
            <input type="range" min={min} max={max} step={step} value={tuning[key]}
              onChange={event => {
                const value = Number(event.currentTarget.value)
                setTuning(previous => ({ ...previous, [key]: value }))
              }} />
          </label>
        ))}
        <label className="transmission-checkbox">
          <input type="checkbox" checked={motion} onChange={event => setMotion(event.currentTarget.checked)} />Spin
        </label>
        <button type="button" onClick={retry}>{failed ? 'Retry 3D preview' : 'Reset 3D view'}</button>
      </fieldset>
    </section>
  )
})

/** Native card + one torus scene, ready to reuse outside this example. */
export function GlassTorusCard(props: GlassObjectCardProps) {
  return <GlassObjectCard {...props} kind="torus" />
}

/** Native card + one blank panel scene. No text or other meshes inside it. */
export function GlassPanelCard(props: GlassObjectCardProps) {
  return <GlassObjectCard {...props} kind="panel" />
}

export function GlassObjectGallery() {
  const [kind, setKind] = useState<GlassObjectKind>('torus')
  useEffect(() => {
    if (window.location.hash !== '#glass-objects') return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('glass-objects')?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  return (
    <section id="glass-objects" className="transmission-gallery glass-object-gallery">
      <h2>Individual glass objects</h2>
      <label className="transmission-selector">Glass object
        <select value={kind} onChange={event => setKind(event.currentTarget.value as GlassObjectKind)}>
          <option value="torus">Glass torus</option><option value="panel">Glass panel</option>
        </select>
      </label>
      {/* Switch only the mesh: one new canvas and the same native controls. */}
      <GlassObjectCard kind={kind} />
    </section>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-glasspanelobject-tsx-4f9bd3ee"></a>
### src/components/glass-objects/GlassPanelObject.tsx

1244 bytes · SHA-256 `e513717fa52fc1759d43636a5d3cdd255f360d43fc855dce2e2a0edfd4cc41c0` · utf8

```tsx
import { useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { DEFAULT_GLASS_SETTINGS, TransmissionSurface } from '../transmission/GlassPrimitives'
import type { ObjectProps } from './glassObjectTypes'
import { useObjectRotation } from './useObjectRotation'

export interface PanelProps extends ObjectProps {
  size?: [width: number, height: number, depth: number]
  radius?: number
}

const DEFAULT_PANEL_SIZE: [number, number, number] = [4.8, 3, 0.42]

/** One blank rounded panel; the outer group retains caller transforms/ref. */
export function GlassPanelObject({
  settings = DEFAULT_GLASS_SETTINGS,
  spin,
  rotationAxis,
  rotationSpeed,
  onRendered,
  size = DEFAULT_PANEL_SIZE,
  radius = 0.18,
  ...groupProps
}: PanelProps) {
  const rotation = useRef<Group>(null)
  useObjectRotation(rotation, { spin, rotationAxis, rotationSpeed })

  return (
    <group {...groupProps}>
      <group ref={rotation}>
        <RoundedBox args={size} radius={radius} smoothness={8} bevelSegments={8} onAfterRender={onRendered}>
          <TransmissionSurface settings={settings} animate={false} />
        </RoundedBox>
      </group>
    </group>
  )
}

export default GlassPanelObject
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-glasstorusobject-tsx-e34da6e7"></a>
### src/components/glass-objects/GlassTorusObject.tsx

835 bytes · SHA-256 `98f444ebfce8ab2caa6cc0d5dff2db74ac00ed57b6a3c4b20db3fe98b593b6c0` · utf8

```tsx
import { useRef } from 'react'
import type { Group } from 'three'
import { DEFAULT_GLASS_SETTINGS, GlassTorus } from '../transmission/GlassPrimitives'
import type { ObjectProps } from './glassObjectTypes'
import { useObjectRotation } from './useObjectRotation'

/** One torus: 1.35 mesh scale gives a 3.618-unit outer diameter. */
export function GlassTorusObject({
  settings = DEFAULT_GLASS_SETTINGS,
  spin,
  rotationAxis,
  rotationSpeed,
  onRendered,
  ...groupProps
}: ObjectProps) {
  const rotation = useRef<Group>(null)
  useObjectRotation(rotation, { spin, rotationAxis, rotationSpeed })

  return (
    <group {...groupProps}>
      <group ref={rotation}>
        <GlassTorus settings={settings} scale={1.35} animate={false} onAfterRender={onRendered} />
      </group>
    </group>
  )
}

export default GlassTorusObject
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-glassobjectscenetypes-ts-1e871685"></a>
### src/components/glass-objects/glassObjectSceneTypes.ts

1020 bytes · SHA-256 `313ff5205163dc8ab1d5fc404a6d4287ff9bbd5e67e8cf8e4ede50c67d005a32` · utf8

```ts
import type { ReactNode } from 'react'
import type { GlassSettings } from '../transmission/GlassPrimitives'
import type { RotationAxis } from './useObjectRotation'

export type GlassObjectKind = 'torus' | 'panel'

export interface GlassObjectCardProps {
  title?: string
  /** Native content in the surrounding header; never inserted into the scene. */
  children?: ReactNode
  initialSpin?: boolean
  initialRotationAxis?: RotationAxis
  /** Radians per second. A negative value reverses the spin. */
  initialRotationSpeed?: number
  initialMaterial?: Partial<GlassSettings>
  /** Multiplier for studio and local lights; 1 keeps the example's lighting. */
  lightingIntensity?: number
}

export interface GlassObjectCanvasProps {
  kind: GlassObjectKind
  settings: GlassSettings
  spin: boolean
  rotationAxis: RotationAxis
  rotationSpeed: number
  interactive: boolean
  coarse: boolean
  high: boolean
  lightingIntensity?: number
  onReady: () => void
  onUnavailable: (reason?: 'renderer' | 'context') => void
}
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-glassobjecttypes-ts-e1d62c5f"></a>
### src/components/glass-objects/glassObjectTypes.ts

514 bytes · SHA-256 `1e3dfcb1ec0e324cf81a56caea3ab73c02ab94272d516b01745777e989ff63e5` · utf8

```ts
import type { ThreeElements } from '@react-three/fiber'
import type { GlassSettings } from '../transmission/GlassPrimitives'
import type { ObjectRotationOptions } from './useObjectRotation'

export type ObjectProps = Omit<ThreeElements['group'], 'children' | 'onAfterRender'> & ObjectRotationOptions & {
  settings?: GlassSettings
  /** Mesh draw callback; the scene owner can exclude offscreen capture passes. */
  onRendered?: ThreeElements['mesh']['onAfterRender']
}

export type GlassObjectProps = ObjectProps
```

[Back to contents](#contents)

<a id="file-src-components-glass-objects-useobjectrotation-ts-15db3c06"></a>
### src/components/glass-objects/useObjectRotation.ts

1266 bytes · SHA-256 `3610a7f62e55d2acac84f078b016c7b53bb45aa459a296e28bd6fee75e633424` · utf8

```ts
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

export type RotationAxis = 'x' | 'y' | 'z'

export interface ObjectRotationOptions {
  spin?: boolean
  rotationAxis?: RotationAxis
  /** Radians per second; negative values reverse the direction. */
  rotationSpeed?: number
}

export function useObjectRotation(
  ref: RefObject<Group | null>,
  { spin = true, rotationAxis = 'y', rotationSpeed = 0.3 }: ObjectRotationOptions = {},
) {
  const active = spin && Number.isFinite(rotationSpeed) && rotationSpeed !== 0
  const previouslyActive = useRef(active)
  const resumeFrame = useRef(false)

  useLayoutEffect(() => {
    if (active && !previouslyActive.current) resumeFrame.current = true
    previouslyActive.current = active
  }, [active])

  useFrame((_state, delta) => {
    if (!active || !ref.current || !Number.isFinite(delta) || delta < 0) return
    // Demand rendering can deliver the whole idle interval on resume. Discard
    // just that first frame; subsequent irregular deltas are never clamped.
    if (resumeFrame.current) {
      resumeFrame.current = false
      return
    }
    ref.current.rotation[rotationAxis] += rotationSpeed * delta
  })
}
```

[Back to contents](#contents)


<a id="group-input"></a>
## Modal input container and outside-click hook

<a id="file-src-components-input-modalinput-modalinputcontainer-module-css-6254925b"></a>
### src/components/input/ModalInput/ModalInputContainer.module.css

977 bytes · SHA-256 `4fa3072e9a186416bfd3f1ea02b21f7424018075fd03b9bd4aaf3eba31da8ce9` · utf8

```css
/* Container rules copied verbatim from Calendar4 ModalInput.module.css,
   blob bf1d9eb5808f1914e62fe67a02b85a5d380befa2. */
#inputContainer{
    width: 90%;
    height: 50px;
    border: 1px solid rgb(106, 106, 106);
    border-radius: 6px;
    margin-right: 5px;
    padding-left: 2.5%;
    padding-top: 2%;
    position: relative;
    z-index: 4;
    pointer-events: auto;
    background: black;
}

#glowingInputContainer{
    width: 90%;
    height: 50px;
    border: 2px solid rgb(42, 111, 87);
    border-radius: 6px;
    margin-right: 5px;
    padding-left: 2.5%;
    padding-top: 2%;
    position: relative;
    z-index: 4;
    pointer-events: auto;
    background: black;
}

#glowingInputContainerError{
    width: 90%;
    height: 50px;
    border: 2px solid rgb(200, 60, 60);
    border-radius: 6px;
    margin-right: 5px;
    padding-left: 2.5%;
    padding-top: 2%;
    position: relative;
    z-index: 4;
    pointer-events: auto;
    background-color: black;
}
```

[Back to contents](#contents)

<a id="file-src-components-input-modalinput-modalinputcontainer-tsx-4e26eac1"></a>
### src/components/input/ModalInput/ModalInputContainer.tsx

1746 bytes · SHA-256 `2f7980fa412fd966a1db104872275bc58b2445bf27a800302112406e20dddc61` · utf8

```tsx
import { useCallback, useRef, useState, type ComponentPropsWithoutRef, type FocusEvent, type MouseEvent as ReactMouseEvent } from 'react'
import useOutsideClick from '../outsideClick'
import style from './ModalInputContainer.module.css'

export interface ModalInputContainerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'id'> {
  text?: string
  error?: boolean
  height?: number | null
}

// Calendar4 ModalInput.tsx, blob a8c5104262ef6cd1c8ae772ee38247a2c4a1bd18:
// retain its container IDs/clicked state, without the original auth/input logic.
export default function ModalInputContainer({
  children,
  text = '',
  error = false,
  height,
  onClick,
  onFocusCapture,
  style: nativeStyle,
  ...nativeDivProps
}: ModalInputContainerProps) {
  const [clicked, setClicked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unclickContent = useCallback(() => {
    if (text.trim() === '') setClicked(false)
  }, [text])
  useOutsideClick(ref, unclickContent)

  const handleClickedContent = (event: ReactMouseEvent<HTMLDivElement>) => {
    setClicked(true)
    onClick?.(event)
  }
  const handleFocusedContent = (event: FocusEvent<HTMLDivElement>) => {
    setClicked(true)
    onFocusCapture?.(event)
  }

  return (
    <div
      {...nativeDivProps}
      onClick={handleClickedContent}
      onFocusCapture={handleFocusedContent}
      id={clicked ? error ?
        style.glowingInputContainerError
        :
        style.glowingInputContainer
        : style.inputContainer}
      ref={ref}
      data-modal-input-state={clicked ? error ? 'error' : 'active' : 'idle'}
      style={{
        ...nativeStyle,
        height: height ? `${height}px` : undefined,
      }}
    >
      {children}
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-input-outsideclick-tsx-418bbec8"></a>
### src/components/input/outsideClick.tsx

871 bytes · SHA-256 `2788e739db4693875b1161e2b8e22e55d87d549bba7ca7a90e4ef4ee1c6a4497` · utf8

```tsx
import { useEffect, type RefObject } from 'react'

export type OutsideClickEvent = MouseEvent | TouchEvent

// Calendar4 outsideClick.tsx, blob f147b4208995724f1154f6827a1acfd9b65e6c72,
// with typed refs/targets and a conventional React hook name.
export default function useOutsideClick<Element extends Node>(
  ref: RefObject<Element | null>,
  handler: (event: OutsideClickEvent) => void,
) {
  useEffect(() => {
    function listener(event: OutsideClickEvent) {
      if (!ref.current || !(event.target instanceof Node) || ref.current.contains(event.target)) return
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler, ref])
}
```

[Back to contents](#contents)


<a id="group-typography"></a>
## 3D typography and footer scene

<a id="file-src-components-typography-footertextcanvas-tsx-619ac822"></a>
### src/components/typography/FooterTextCanvas.tsx

5548 bytes · SHA-256 `42cc45914442797c828b8f98fb5481e2eb6f59437d954e84b9bf9bc24ad4235b` · utf8

```tsx
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Center, Float, Text3D } from '@react-three/drei'
import type { Group, OrthographicCamera } from 'three'
import { useObjectRotation } from '../glass-objects/useObjectRotation'

export const FOOTER_FONT_URL = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`

export interface FooterTextCanvasProps {
  text: string
  animate: boolean
  /** Radians per second; zero preserves the existing non-spinning presentation. */
  rotationSpeed?: number
  onReady?: () => void
  onUnavailable?: () => void
}

const cameraOptions = { position: [0, 0, 12] as [number, number, number], zoom: 40, near: 0.1, far: 100 }

function FittedText({ text, animate, rotationSpeed, onDrawn }: { text: string; animate: boolean; rotationSpeed: number; onDrawn: () => void }) {
  const camera = useThree(state => state.camera) as OrthographicCamera
  const width = useThree(state => state.size.width)
  const height = useThree(state => state.size.height)
  const invalidate = useThree(state => state.invalidate)
  const rotation = useRef<Group>(null)
  const textSize = useRef<{ width: number; height: number; depth: number } | null>(null)
  useObjectRotation(rotation, { spin: animate, rotationAxis: 'y', rotationSpeed })

  // Camera fitting runs only after measurement, resize, or a speed change.
  const fit = useCallback(() => {
    if (!textSize.current || !camera.isOrthographicCamera) return
    const size = textSize.current
    const fullTurn = (Number.isFinite(rotationSpeed) && rotationSpeed !== 0) || (rotation.current?.rotation.y ?? 0) !== 0
    // A Y turn projects both width and extrusion depth onto the horizontal axis.
    // Keep that fit while paused, with room for the existing gentle Float motion.
    const turnWidth = Math.hypot(size.width, size.depth)
    const fittedWidth = fullTurn ? turnWidth * 1.04 : size.width
    const fittedHeight = fullTurn ? size.height + turnWidth * 0.015 + 0.065 : size.height
    const zoom = Math.min(width / (fittedWidth * 1.15), height / (fittedHeight * 1.15))
    if (!Number.isFinite(zoom) || zoom <= 0) return
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, width, height, invalidate, rotationSpeed])

  const onCentered = useCallback((size: { width: number; height: number; depth: number }) => {
    textSize.current = { width: size.width, height: size.height, depth: size.depth }
    fit()
  }, [fit])

  useLayoutEffect(fit, [fit])

  return (
    <group ref={rotation}>
      <Center cacheKey={text} onCentered={onCentered}>
        <Float enabled={animate} autoInvalidate={false} speed={0.75} rotationIntensity={0.12} floatIntensity={0.65} floatingRange={[-0.05, 0.05]}>
          <Text3D
            font={FOOTER_FONT_URL}
            size={0.8}
            height={0.28}
            curveSegments={8}
            bevelEnabled
            bevelThickness={0.025}
            bevelSize={0.018}
            bevelSegments={3}
            rotation={[-0.14, -0.22, 0]}
            onAfterRender={onDrawn}
          >
            {text}
            <meshStandardMaterial attach="material-0" color="#f3f4f7" roughness={0.45} />
            <meshStandardMaterial attach="material-1" color="#ff9470" roughness={0.5} />
          </Text3D>
        </Float>
      </Center>
    </group>
  )
}

export default function FooterTextCanvas({ text, animate, rotationSpeed = 0, onReady, onUnavailable }: FooterTextCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const mounted = useRef(true)
  const drawn = useRef(false)
  const lost = useRef(false)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const [unavailable, setUnavailable] = useState(false)

  useLayoutEffect(() => {
    readyCallback.current = onReady
    unavailableCallback.current = onUnavailable
  }, [onReady, onUnavailable])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const reportDrawn = useCallback(() => {
    if (!mounted.current || lost.current || drawn.current) return
    drawn.current = true
    readyCallback.current?.()
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (unavailable || !element) return
    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!mounted.current || lost.current) return
      lost.current = true
      setUnavailable(true)
      unavailableCallback.current?.()
    }
    element.addEventListener('webglcontextlost', onContextLost)
    return () => element.removeEventListener('webglcontextlost', onContextLost)
  }, [unavailable])

  if (unavailable) return null

  return (
    <Canvas
      ref={canvas}
      data-testid="footer-text-scene"
      aria-hidden="true"
      orthographic
      camera={cameraOptions}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop={animate ? 'always' : 'demand'}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none', touchAction: 'auto' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 6]} intensity={2} />
      <directionalLight position={[-4, -1, 2]} intensity={0.6} />
      <Suspense fallback={null}>
        <FittedText text={text} animate={animate} rotationSpeed={rotationSpeed} onDrawn={reportDrawn} />
      </Suspense>
    </Canvas>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-typography-footertextscene-module-css-7ee8c7ed"></a>
### src/components/typography/FooterTextScene.module.css

537 bytes · SHA-256 `0e4335b939739f1bb3b5d4a794ecf5749c93f28f28058bc6c14a0d9a02528f70` · utf8

```css
.scene {
  position: relative;
  width: 100%;
  max-width: 660px;
  min-width: 0;
  height: 112px;
  margin: 24px auto 0;
  background: transparent;
  pointer-events: none;
  touch-action: auto;
}

.fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0 12px;
  color: var(--ink, #f3f4f7);
  font-family: inherit;
  font-size: clamp(14px, 1.5vw, 20px);
  font-weight: 700;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 720px) {
  .scene {
    height: 90px;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-typography-footertextscene-tsx-8ca2a2d9"></a>
### src/components/typography/FooterTextScene.tsx

2812 bytes · SHA-256 `f89208787bbc00b7a1e0a3e494231bd40ff671e39af693af7cc263a4fa4914f1` · utf8

```tsx
import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type ReactNode,
} from 'react'
import { useFooterTextActivity } from './useFooterTextActivity'
import styles from './FooterTextScene.module.css'

const FooterTextCanvas = lazy(() => import('./FooterTextCanvas'))

export interface FooterTextSceneProps {
  text?: string
  motion?: boolean
  /** Radians per second around the centered text's Y axis; zero keeps its pose. */
  rotationSpeed?: number
  className?: string
}

class FooterTextBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onUnavailable()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function FooterTextScene({ text = 'Make learning tangible.', motion = true, rotationSpeed = 0, className }: FooterTextSceneProps) {
  const element = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const failed = useRef(false)
  const { inViewport, pageVisible, reducedMotion, hasWebGL } = useFooterTextActivity(element)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (inViewport && pageVisible && hasWebGL) setRequested(true)
  }, [inViewport, pageVisible, hasWebGL])

  const onReady = useCallback(() => {
    if (mounted.current && !failed.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!mounted.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
  }, [])

  const canRender = requested && hasWebGL === true && !unavailable
  const animate = motion && canRender && inViewport && pageVisible && !reducedMotion
  const state = unavailable || hasWebGL === false
    ? 'unavailable'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div
      ref={element}
      className={`${styles.scene}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={text}
      data-footer-text-state={state}
      data-footer-text-animate={animate}
    >
      {!ready && <p className={styles.fallback} aria-hidden="true">{text}</p>}
      {canRender && (
        <FooterTextBoundary onUnavailable={onUnavailable}>
          <Suspense fallback={null}>
            <FooterTextCanvas text={text} animate={animate} rotationSpeed={rotationSpeed} onReady={onReady} onUnavailable={onUnavailable} />
          </Suspense>
        </FooterTextBoundary>
      )}
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-typography-threedheading-module-css-5f49d170"></a>
### src/components/typography/ThreeDHeading.module.css

579 bytes · SHA-256 `25f66ef6896eb71a06082b044a5b20d50277b48b125d094dcccba0722514d0ac` · utf8

```css
.container {
  position: relative;
  min-width: 0;
}

/* Native heading semantics remain present without duplicating visual text. */
.heading {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.visual {
  width: 100%;
  min-width: 0;
  pointer-events: none;
}

.visual .scene {
  height: 90px;
  margin: 0;
}

.visual .scene > p {
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 700;
}

@media (max-width: 720px) {
  .visual .scene {
    height: 72px;
  }
}
```

[Back to contents](#contents)

<a id="file-src-components-typography-threedheading-tsx-c460028a"></a>
### src/components/typography/ThreeDHeading.tsx

719 bytes · SHA-256 `5216cc7765fef1d2efad85c13965466689a6dfb4b00b2439d3abb7a1c0fdb00b` · utf8

```tsx
import type { ReactNode } from 'react'
import FooterTextScene from './FooterTextScene'
import styles from './ThreeDHeading.module.css'

export interface ThreeDHeadingProps {
  title?: string
  children?: ReactNode
  id?: string
  level?: 'h1' | 'h2' | 'h3'
}

export default function ThreeDHeading({
  title = 'Default Title',
  children,
  id,
  level: Heading = 'h2',
}: ThreeDHeadingProps) {
  return (
    <div className={styles.container} data-three-d-heading>
      <Heading id={id} className={styles.heading}>{title}</Heading>
      <div className={styles.visual} aria-hidden="true">
        <FooterTextScene text={title} motion={false} className={styles.scene} />
      </div>
      {children}
    </div>
  )
}
```

[Back to contents](#contents)

<a id="file-src-components-typography-usefootertextactivity-ts-7e8a705d"></a>
### src/components/typography/useFooterTextActivity.ts

1944 bytes · SHA-256 `98221697f1d680c89edbaa2e1918a1506210889f8f03b159c8411f7a4798c6b9` · utf8

```ts
import { useEffect, useState, type RefObject } from 'react'

export function useFooterTextActivity(target: RefObject<HTMLElement | null>) {
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)

  useEffect(() => {
    setHasWebGL(typeof WebGL2RenderingContext !== 'undefined' || typeof WebGLRenderingContext !== 'undefined')
  }, [])

  useEffect(() => {
    const element = target.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return
    }
    let disposed = false
    const observer = new IntersectionObserver(entries => {
      if (disposed) return
      const entry = entries.find(value => value.target === element)
      if (entry) setInViewport(entry.isIntersecting)
    })
    observer.observe(element)
    return () => {
      disposed = true
      observer.disconnect()
    }
  }, [target])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return { inViewport, pageVisible, reducedMotion, hasWebGL }
}
```

[Back to contents](#contents)
