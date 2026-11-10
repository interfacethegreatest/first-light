# PaneBackground object

This is a structural extraction. The current glass appearance is preserved; pane design is deferred. Publication follows the repository's existing GitHub Pages workflow.

`src/components/panes/PaneBackground.tsx` renders the requested native HTML tag and attaches `PaneBackground.module.css`. The module now explicitly composes `GlassySurface.module.css`, which owns the shared paint. The React module directly imports the values from `src/styles/glass.css` so CSS composition cannot omit them from the bundle. Layout stays with the existing application/card/header styles. The later [glass inheritance update](glass-inheritance.md) isolates the supplied SVG lens and its CSS adapter.

```tsx
import PaneBackground from './components/panes/PaneBackground'

<PaneBackground as="section" className="panel source-panel">
  <form className="entry-form">{/* Existing form contents */}</form>
</PaneBackground>
```

The default tag is `div`; supported `as` values also include `section`, `aside`, `li`, `header`, `input`, `textarea` and `select`. Native props, event handlers, children, class names, inline styles and React 19 refs are forwarded. Each call produces one native element, preserving the existing DOM hierarchy and form ownership.

App panes and native form fields, source-card sections and header frames now use the component. The existing animated Sun badge uses the exported `paneBackgroundClassName` on its original `motion.div`, retaining its variants and circular geometry. Duplicate paint/fallback rules have been removed from the card and header stylesheets; the shared zero-specificity class lets local layout/shape rules continue to apply.

Ownership was bounded: one agent created the component/module, then integrated the disjoint card/header files after the core was accepted; the coordinator integrated App.tsx/App.css and extracted the tokens; a separate verifier owns only browser evidence. Design values, data handling, scene files, dependencies and deployment configuration are unchanged by this extraction.

Verification passes: all 135 existing application tests, TypeScript and the repository-path production build (`index-4tRpy0dg.js`, `index-BR56W4Eg.css`), plus whitespace review. The existing bundle-size advisory remains.

The [browser comparison](pane-background-browser-verification.json) confirms identical native tags, parent/form ancestry, child order, labels, computed appearance, typography and sizes for 16 surfaces/controls at 1440px and 320px. No horizontal overflow or page errors occur. Input/textarea/select drafts survive mouse and keyboard source creation; focus, actual JSON export and storage preservation pass. These bounded checks isolate the unchanged GPU scenes and do not revalidate assets or hardware performance.
