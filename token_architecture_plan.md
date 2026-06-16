# Strata Token & Component Architecture Plan

Based on the design discussion, here's the breakdown of the conceptual model and the work needed to implement it.

---

## The Core Mental Model

### Token Hierarchy (3 Layers)

```
Brand Tokens  →  Semantic Tokens  →  Component Tokens
    (source)          (alias)             (scoped)
```

| Layer | Description | Examples |
|---|---|---|
| **Brand Tokens** | The raw, primitive values that define brand identity. Defined in the Brand Bible. | `#FC0694`, `Outfit`, `16px` |
| **Semantic Tokens** | Named aliases that *reference* brand tokens with meaningful intent. Reusable across components. | `color.action`, `color.danger`, `text.body` |
| **Component Tokens** | Tokens scoped **only** to a specific component. Reference semantic tokens. | `button.bg`, `button.text`, `card.shadow` |

### Component Tiers (Default vs. Custom)

| Tier | Description | Examples |
|---|---|---|
| **Default / Presets** | Atomic, universal components every design system must have. Pre-built, non-removable. | Button, Input, Badge, Card, Typography |
| **Custom** | User-defined components built on top of Strata primitives. | Header, HeroBanner, ProductCard |

---

## Checklist of Points to Work On

### 1. Token Architecture — 3-Layer Hierarchy

- [ ] **Restructure the token data model** to support three distinct layers: `brand`, `semantic`, and `component`.
- [ ] **Brand Tokens tab/section** — surfaced inside or linked from the Brand Bible. These are the raw hex values, font names, and scale values set at the highest level.
- [ ] **Semantic Tokens** — a new layer where tokens can *reference* brand tokens (e.g. `color.action → {brand.color.primary}`). Aliasing/reference syntax to be decided (e.g. `{token.name}` syntax from the W3C Design Token spec).
- [ ] **Component Tokens** — tokens scoped to a single component. Auto-created when a component is added. E.g. adding a Button creates `button.bg`, `button.text`, `button.radius`, etc.
- [ ] **Token inheritance / reference chain** — the value of a component token traces upward: `button.bg → color.action → brand.color.primary`. UI should visualize this chain (e.g. a breadcrumb trail or tooltip).
- [ ] **Sidebar categories update** — the left sidebar on the Tokens tab should reflect the 3-layer model, not just type categories (Color, Typography, etc.).

---

### 2. Component Architecture — Default vs. Custom

- [ ] **"Presets" section above custom components** — a collapsible section at the top of the Components tab showing the minimal atomic set every design system ships with: Button, Input, Badge, Checkbox, Typography scale, etc.
- [ ] **Presets are non-deletable** — they can be configured (token mappings edited) but not removed.
- [ ] **Custom components section** — everything the user creates from scratch lives below the presets.
- [ ] **"Fragment" builder concept** — a more advanced mode allowing users to compose complex components (like a Header) from atomic presets using a simple layout syntax.

---

### 3. Brand Bible ↔ Token Sync

- [ ] **Brand Bible should auto-generate Brand Tokens** — when a user sets `Primary Color = #FC0694` in the Brand Bible, Strata should automatically create/update the `brand.color.primary` token.
- [ ] **Brand Bible fields map to Brand Token layer** — Primary Color, Secondary Color, Accent, Heading Font, Body Font, and base spacing all live at the Brand Token level.
- [ ] **Changes propagate downward** — updating a Brand Token should cascade to any Semantic or Component token referencing it.

---

### 4. UI / Visual Representation

- [ ] **Token sidebar redesign** — top-level grouping becomes `Brand / Semantic / Component` layers, not just categories.
- [ ] **Reference indicator** — tokens that alias another token should show a link/chain icon and the source token name in the value column.
- [ ] **Inheritance path tooltip** — hovering a component token shows the full resolution chain: `button.bg → color.action (#FC0694)`.
- [ ] **Component token auto-scaffold** — adding a component should offer to auto-create a set of scoped component tokens pre-wired to relevant semantic tokens.

---

## Open Design Questions

> [!IMPORTANT]
> These need team alignment before implementation begins.

1. **Aliasing syntax** — What format should token references use? Options: `{token.name}` (W3C spec), `$token.name` (Theo style), or a custom Strata syntax?
2. **Where do component tokens live in the sidebar?** — Under a global "Component" layer, or nested inside each component's card in the Components tab?
3. **Are Semantic tokens mandatory?** — Can a component token reference a Brand token directly, skipping the semantic layer? (Probably yes, but the UI should warn/discourage it.)
4. **Fragment builder scope** — Is this v1 or a later milestone? It likely requires its own canvas/layout editor.
