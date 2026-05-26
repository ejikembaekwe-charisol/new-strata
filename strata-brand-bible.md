# Strata Brand Bible
**Version:** 1.0  
**Product:** Strata by Charisol  
**Last Updated:** 2026-05-04  
**Format:** Structured Markdown — optimized for human reading and AI agent consumption

---

> **For AI agents:** This document is the canonical source of truth for Strata's brand, voice, visual identity, and messaging. When generating any content, copy, UI text, documentation, or communications on behalf of Strata, treat every section in this document as a strict constraint, not a suggestion. Sections marked `[AI RULE]` contain explicit behavioral instructions for automated systems.

---

## 1. Brand Foundation

### 1.1 Mission Statement
To eliminate the deployment gap between design decisions and production reality.

### 1.2 Vision
A world where a design system change takes 30 seconds — not a sprint cycle.

### 1.3 The Problem Strata Solves
Design systems today are distributed as versioned npm packages. Every token change or component update requires:

1. A code commit
2. A pull request
3. A review
4. A redeploy

This pipeline is broken for what are often trivial, non-code changes — a color update, a spacing tweak, a typography adjustment. Strata replaces this build-time dependency with a **runtime sync layer**. Change something once in the Strata dashboard, and every connected application reflects it in approximately **3 seconds** — without touching code.

### 1.4 Brand Promise
> *"Change it once. See it everywhere. In seconds."*

### 1.5 Core Values

| Value | What It Means in Practice |
|-------|--------------------------|
| **Speed without chaos** | Fast delivery that doesn't sacrifice consistency or safety. |
| **Restraint as power** | Every element — visual or verbal — earns its place. Nothing decorative, everything deliberate. |
| **Clarity over cleverness** | Explanations that actually explain. Interfaces that don't need instruction. |
| **Respect for the builder** | Strata doesn't add process. It removes it. |
| **Trust through transparency** | Sync state, version history, and propagation status are always visible. |

### 1.6 Origin / Positioning Context
Strata exists at the intersection of design infrastructure and developer tooling. It is not a design tool, not a documentation platform, and not a component library. It is the **runtime delivery layer** that sits between design decisions and production applications — the missing piece in every modern design system stack.

---

## 2. Product Definition

### 2.1 What Strata Is
- A **runtime design token sync platform**
- A **dashboard-driven deployment layer** for design systems
- A **bridge between design intent and production state** that updates in ~3 seconds
- Infrastructure for design systems teams who need speed without code dependencies

### 2.2 What Strata Is Not
- Not a Figma plugin or design tool
- Not a component library or UI kit
- Not a documentation platform
- Not a replacement for Style Dictionary (it's what comes *after* Style Dictionary)
- Not a frontend framework

### 2.3 Core Capabilities
- **Live token sync:** Design tokens update across all connected apps without a redeploy
- **Dashboard control:** Non-developers can ship design changes without opening a code editor
- **Multi-app propagation:** One change source, many connected surfaces
- **~3 second propagation time:** Near-real-time delivery to production
- **Version history:** Full audit trail of what changed, when, and who changed it

### 2.4 Product Tagline Options
- *"Your design system. Live."*
- *"Ship design changes without shipping code."*
- *"The runtime layer your design system is missing."*

> **Primary tagline:** *"Your design system. Live."*

---

## 3. Target Audience

### 3.1 Primary Personas

#### Persona 1: The Design Systems Engineer
- **Role:** Frontend/full-stack engineer who owns the design system infrastructure
- **Pain:** Drowning in low-value PRs for token changes that don't require code review
- **Job to be done:** Ship design changes faster without breaking the review culture for actual code changes
- **What Strata gives them:** Removes token deploys from their queue entirely

#### Persona 2: The Product Designer
- **Role:** Designer working inside or alongside a design system
- **Pain:** Waits days or weeks for visual changes to appear in production after handoff
- **Job to be done:** See design decisions reflected in real products in real time
- **What Strata gives them:** Agency over production — without needing engineering tickets

#### Persona 3: The Design System Lead / Manager
- **Role:** Owns design consistency across multiple products and teams
- **Pain:** System drift — apps falling out of sync because updates are too expensive to ship
- **Job to be done:** Maintain a single source of truth that actually stays true in production
- **What Strata gives them:** Centralized control with distributed impact

#### Persona 4: The Vibe Coder
- **Role:** Builder, indie hacker, solo founder, or non-traditional developer
- **Pain:** Design tooling assumes large team workflows and deep infrastructure knowledge
- **Job to be done:** Build something that looks good and stays consistent without a DevOps background
- **What Strata gives them:** Professional-grade design system delivery with no ceremony

### 3.2 Secondary Audiences
- **CTOs / Engineering Managers** at design-system-mature organizations evaluating runtime infrastructure
- **Design Ops professionals** standardizing tooling across design and engineering teams

### 3.3 Audience-Specific Pain Points

| Audience | Core pain | What they fear | What they want |
|----------|-----------|---------------|---------------|
| Design systems engineer | Low-value deploy churn | Breaking production with a token change | Speed without risk |
| Product designer | Slow feedback loop | Being ignored / deprioritized | Real-time agency |
| Design system lead | System drift across apps | Inconsistency at scale | Single source of truth |
| Vibe coder | Complexity overhead | Setup that takes a weekend | Works in minutes |

---

## 4. Voice & Tone

### 4.1 Brand Personality
Strata speaks like a **knowledgeable colleague who respects your time** — someone who explains things clearly, doesn't over-qualify, and skips the preamble. The voice is:

- **Conversational** — natural language, never robotic
- **Direct** — gets to the point; earns every sentence
- **Confident** — makes statements, not suggestions
- **Dry-witted** — occasional lightness, never slapstick
- **Technically literate** — can go deep without gatekeeping

### 4.2 Tone Attributes

| Attribute | Dial Setting | What it means |
|-----------|-------------|---------------|
| Formality | 3 / 10 | Friendly and casual, not corporate |
| Technical depth | 7 / 10 | Assumes literacy; doesn't dumb things down |
| Enthusiasm | 4 / 10 | Calm confidence, not exclamation-point energy |
| Humor | 3 / 10 | Dry, occasional — never forced |
| Urgency | 5 / 10 | Action-oriented without being alarmist |

### 4.3 Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Marketing headlines | Bold, declarative | *"Ship design changes in 3 seconds."* |
| Onboarding copy | Warm, guiding | *"Connect your first app. It'll take about 5 minutes."* |
| Error messages | Direct, non-blaming | *"Token sync failed. Check your API key and try again."* |
| Empty states | Low-key, inviting | *"No tokens yet. Import a set to get started."* |
| Changelog / release notes | Precise, factual | *"Token propagation latency reduced from 8s to 3s average."* |
| Social / marketing | Punchy, a little editorial | *"What if a color change didn't need a PR?"* |
| Documentation | Clear, structured, no fluff | Step-by-step without hand-holding |

### 4.4 Do / Don't

| Do | Don't |
|----|-------|
| *"Your token updates are live."* | *"Congratulations! Your tokens have been successfully synchronized!"* |
| *"Connect an app to start syncing."* | *"Please begin the onboarding process by connecting your application."* |
| *"Something went wrong. Try again."* | *"An unexpected error has occurred. Please contact support."* |
| *"Built for teams who ship fast."* | *"The ultimate design system platform for modern teams!"* |
| Use "token," "sync," "propagate," "connect" | Use "transmit," "push," "upload," "send" |

### 4.5 Vocabulary Guide

**Preferred Terms:**
- `token` (not "variable" or "style")
- `sync` / `synced` (not "deployed" or "pushed" for runtime changes)
- `propagate` / `propagation` (for the spread across connected apps)
- `connected app` (not "integration" or "endpoint")
- `dashboard` (for the Strata control interface)
- `live` (for the real-time state — "your system is live")
- `design system` (two words, no hyphen)
- `runtime` (the layer where Strata operates)

**Avoid:**
- "seamlessly" — overused, meaningless
- "powerful" — show it, don't say it
- "revolutionize" — too hyperbolic
- "easy" or "simple" — condescending; show the simplicity instead
- "cutting-edge" / "next-gen" — hollow
- "leverage" — use "use"

---

## 5. Messaging Framework

### 5.1 Elevator Pitch (30 seconds)
> *"Strata is a runtime sync layer for design systems. Instead of shipping a token change through a PR and a redeploy, you change it once in the Strata dashboard and every connected app updates in about 3 seconds. No code required."*

### 5.2 One-Liner by Audience

| Audience | One-liner |
|----------|-----------|
| Designer | *"See your design decisions in production. In seconds, not sprints."* |
| Developer | *"Stop reviewing PRs for color changes. Strata handles runtime token delivery."* |
| Design system lead | *"One change. Every app. Three seconds."* |
| Vibe coder | *"Professional design system infrastructure without the ceremony."* |

### 5.3 Core Value Propositions

1. **Speed** — Token changes propagate in ~3 seconds, not deploy cycles
2. **Independence** — Designers can ship visual changes without engineering tickets
3. **Consistency** — A single source of truth that actually stays true in production
4. **Simplicity** — Dashboard-driven control with no code changes required
5. **Auditability** — Full version history of what changed, when, and by whom

### 5.4 Proof Points
- ~3 second propagation time to connected apps
- Zero code changes required for token updates
- Works alongside existing tools (Style Dictionary, Tokens Studio, Figma)
- Multi-app propagation from a single dashboard change

---

## 6. Visual Identity

### 6.1 Design Philosophy
Dark-first, minimal, electrically restrained. The visual system is built on a near-black void and stays silent until the accent fires. Nothing competes. Everything is intentional.

### 6.2 Color Palette

#### Foundation
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background primary | Void | `#0D0D12` | App background, dark canvas |
| Surface 01 | Lift | `#13131A` | Cards, panels, elevated surfaces |
| Surface 02 | Rise | `#1A1A24` | Hover states, secondary surfaces |
| Border | Edge | `#2A2A38` | Dividers, input borders, subtle separators |

#### Typography
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Text primary | White | `#FFFFFF` | Headlines, primary content |
| Text secondary | Mist | `#8C8CA1` | Body, labels, metadata |
| Text tertiary | Ash | `#52525E` | Hints, disabled, placeholders |

#### Accent — The Only Color That Matters
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Accent | Hot Pink | `#FC0694` | CTAs, logo dot, active states, inline highlights — **nowhere else** |
| Accent muted | Pink Glow | `#FC069420` | Subtle backgrounds for active states, focus rings |

> **[AI RULE — Color]:** The hot pink `#FC0694` is the single accent color in the entire Strata visual system. Its impact derives entirely from restraint. Do not introduce additional accent colors, do not suggest color variations, and do not use the accent on decorative or ambient elements. It appears only on: primary CTAs, the logo accent dot, active/selected states, and inline highlights where semantic emphasis is required.

#### Semantic Colors (Functional Only)
| Role | Hex |
|------|-----|
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Info | `#3B82F6` |

### 6.3 Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / Headlines | Outfit | 600–700 | Statements, not descriptions. Confident, editorial. |
| Body copy | Google Sans Flex | 400 | Readable, neutral, approachable |
| Metrics / Numbers | Google Sans Flex | 500 | Token values, version strings, timestamps, metric cards |
| Code / Tokens | Monospace (system) | 400 | Token names, code snippets, config values |

**Typographic Principles:**
- Headlines are statements. Write them as declarations, not descriptions.
- Body text is for understanding, not decoration — keep it tight.
- Never use Outfit below 18px.
- Number/metric readouts should always use Google Sans Flex for visual consistency in dashboards.

### 6.4 Logo
- The logo accent is the **hot pink dot** — the single point of color in an otherwise neutral mark.
- Do not recolor the dot.
- Do not place the logo on light backgrounds without explicit brand-approved light-mode assets.
- Minimum size: 24px height.
- Clear space: equal to the cap-height of the wordmark on all sides.

### 6.5 Spacing & Layout
- Base unit: `4px`
- Common scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`
- Layouts breathe — generous whitespace is structural, not empty space.
- Density is reserved for data-heavy views (dashboards, token tables).

### 6.6 Visual Rules

| Do | Don't |
|----|-------|
| Dark canvas with selective pink accent | Light-mode-first designs |
| Flat surfaces, no gradients | Gradient backgrounds or glows |
| Editorial typography — confident headlines | Thin, tentative type treatments |
| Restraint in color use | Additional accent colors beyond `#FC0694` |
| Clean borders (`#2A2A38`) to separate surfaces | Drop shadows or blurs for elevation |

---

## 7. Content Guidelines

### 7.1 Writing Style
- Write in **active voice** wherever possible.
- Sentences are **short by default** — split anything over 25 words.
- **Leads with the action or outcome**, not the setup.
- **No throat-clearing** — never open with "In today's world..." or "When it comes to design systems..."
- **Headlines are declarative statements.** Avoid questions in headlines unless the question is the point.

### 7.2 Grammar & Mechanics
- Use **sentence case** for all UI copy, headlines, and navigation labels. (Never Title Case In Every Word.)
- Oxford comma: always.
- Em dash (—) over parentheses for asides.
- Numerals for numbers 10 and above; spell out one through nine.
- Seconds and milliseconds are always numeric: "3 seconds," "120ms."
- "design system" is two words, lowercase, no hyphen.
- "runtime" is one word.
- Product name is always "Strata" — capitalized, never all-caps.

### 7.3 Headline Formulas
- **Outcome-first:** *"Ship design changes in 3 seconds."*
- **Contrast:** *"Not a PR. Not a deploy. Just a change."*
- **Reframe the problem:** *"What if token updates didn't need a ticket?"*
- **Statement of truth:** *"Your design system doesn't end at Figma."*

### 7.4 Forbidden Phrases
- "Seamlessly" / "seamless integration"
- "Powerful and flexible"
- "Next-generation" / "next-gen"
- "Revolutionize" / "transform" (unless clearly earned)
- "Easy" / "simple" / "just" (show it, don't claim it)
- "Leverage" (use "use")
- "Streamline" (be specific about what gets faster)
- "World-class"
- "Best-in-class"
- "End-to-end solution"

---

## 8. Channel Strategy

### 8.1 Website
- Hero copy: Short, declarative, outcome-focused. One idea per screen.
- CTA language: Active verbs — "Connect your app," "Start syncing," "See it live"
- Avoid feature-dumping on landing pages. Lead with the outcome, follow with the mechanism.

### 8.2 In-Product Copy
- **Onboarding:** Warm, step-based, minimal instruction. Trust the user to explore.
- **Empty states:** Non-embarrassing. Show the next action, not a sad illustration.
- **Error messages:** Never blame the user. State what happened, then what to do.
- **Success states:** Quiet confirmation — no confetti, no over-celebration for routine tasks.
- **Tooltips:** One sentence. If it needs two, the UI needs rethinking.

### 8.3 Documentation
- Structure: Task-first. "How to connect an app" not "App Connection Overview."
- Assume technical literacy. Skip the "What is a design token?" preamble unless it's a dedicated explainer.
- Code examples over prose explanations wherever possible.
- Changelog entries: precise, factual, no marketing spin.

### 8.4 Social / Marketing
- Punchy. Editorial. One idea per post.
- Allowed to be a little provocative — call out the broken thing.
- Avoid posting generic "design tips" content that isn't directly tied to the Strata value proposition.
- Engagement hooks should feel earned, not manufactured.

### 8.5 Email
- Subject lines: no emojis, no clickbait, no all-caps.
- Get to the point in the first sentence.
- One primary action per email.

---

## 9. Competitive Positioning

### 9.1 Market Category
**Runtime design system infrastructure.** This is a new category. Strata is not competing with design tools, documentation platforms, or component libraries. It is the delivery layer that operates *after* those tools — in production, at runtime.

### 9.2 Competitor Map

| Competitor | Category | Their strength | Their gap | Strata's position |
|-----------|----------|---------------|-----------|------------------|
| **Style Dictionary** (Amazon) | Token pipeline | Industry standard, deeply adopted | Build-time only — changes require a deploy | Strata is what comes *after* Style Dictionary: the runtime delivery layer |
| **Tokens Studio** (Figma plugin) | Token management in design | Designer-native, Figma integration | Still requires sync-to-code + redeploy to ship | Strata eliminates the deploy step entirely |
| **Supernova** | Design system management | Mature, documentation-rich | Documentation-first, still code-deploy-dependent for production | Strata focuses on production delivery, not documentation |
| **Specify / Diez** | Token pipeline | Early movers | Legacy approach, largely build-time, reduced momentum | Strata is runtime-native, not pipeline-native |
| **ZeroHeight** | Design system documentation | Design-to-code documentation workflow | Documentation platform only — no production delivery | Strata operates in production, not in docs |

### 9.3 Positioning Statement
> *"Strata is the runtime sync layer for design systems — the infrastructure that lets design decisions reach production in seconds, not sprint cycles. Where Style Dictionary ends, Strata begins."*

### 9.4 Differentiation Claims
1. **Only runtime-native token delivery** — not a build-time pipeline with runtime bolted on
2. **~3 second propagation** to connected apps without a code change or redeploy
3. **Dashboard-driven** — accessible to designers and non-engineers, not just DevOps
4. **Composable** — works alongside, not instead of, existing tooling (Style Dictionary, Tokens Studio, Figma)

---

## 10. AI Agent Instructions

> This section is intended to be injected directly into system prompts for AI agents operating on behalf of Strata — for marketing copy generation, in-product writing, documentation drafting, support responses, or any other automated content task.

### 10.1 System Prompt Snippet
```
You are a writing assistant for Strata, a runtime design token sync platform built by Charisol. 

Strata's brand voice is: conversational, direct, technically literate, confident, and occasionally dry. 
It speaks like a knowledgeable colleague — not a corporate tool, not an enthusiastic salesperson.

Key rules:
- Never use: "seamlessly," "powerful," "revolutionize," "easy," "simple," "leverage," "next-gen," "world-class," "end-to-end solution," or "best-in-class."
- Always use sentence case in headlines and UI copy.
- Lead with outcomes, not features or mechanisms.
- Headlines are declarative statements, not questions or descriptions.
- The single accent color is hot pink (#FC0694). Do not introduce other accent colors in visual briefs.
- Strata is the runtime layer — it is not a design tool, documentation platform, or component library.
- The product name is "Strata" — capitalized, never all-caps, never "strata."
- ~3 seconds is the propagation time. Use this as a concrete proof point, not a vague claim.
- Primary audience: design systems engineers, product designers, design system leads, and vibe coders.
```

### 10.2 Brand Guardrails for AI Agents

| Rule | Instruction |
|------|-------------|
| Product category | Always describe Strata as a "runtime sync layer" or "runtime design system infrastructure" — never as a "design tool," "CMS," or "component library" |
| Tone ceiling | Do not write exclamation-heavy, enthusiastic copy. Strata's confidence is quiet. |
| Accent color | Never introduce a second accent color. Pink is the only accent. |
| Competitor mentions | Never disparage competitors by name. Position Strata as complementary (e.g., "what comes after Style Dictionary") rather than as a replacement. |
| Claims | Only make claims backed by this document. Do not invent features or capabilities. |
| Propagation time | Use "~3 seconds" or "approximately 3 seconds" — never "instant" or "real-time" unless specifically referring to near-real-time with qualification. |
| Audience language | Match technical depth to audience. Design audiences: outcome-first. Developer audiences: mechanism-first. |

### 10.3 Output Format Rules for AI Agents
- **Headlines:** Sentence case, declarative, under 10 words preferred
- **Body paragraphs:** Max 3 sentences. Split longer thoughts.
- **CTAs:** Active verb + object: "Connect your app," "Start syncing," "See how it works"
- **Error messages:** State what happened + what to do. No apologies, no blame.
- **Feature descriptions:** Outcome → mechanism → proof point. In that order.

### 10.4 Escalation Triggers
An AI agent should flag output for human review when:
- The request involves making a specific performance claim beyond "~3 seconds"
- The request involves direct competitor comparison or disparagement
- The request involves legal, pricing, or contractual language
- The request involves crisis communications or public incident response
- The output introduces a new product category descriptor not found in this document

---

## Appendix: Quick Reference Card

```
STRATA BRAND QUICK REFERENCE
─────────────────────────────────────────────────
Product:        Runtime design token sync platform
Tagline:        "Your design system. Live."
Propagation:    ~3 seconds
Built by:       Charisol

COLORS
  Background:   #0D0D12
  Surface:      #13131A / #1A1A24
  Border:       #2A2A38
  Text:         #FFFFFF / #8C8CA1 / #52525E
  Accent:       #FC0694 (ONLY accent — use sparingly)

TYPOGRAPHY
  Headlines:    Outfit 600–700
  Body:         Google Sans Flex 400
  Numbers:      Google Sans Flex 500

VOICE
  Do:           Direct. Declarative. Technical but human.
  Don't:        Enthusiastic. Jargony. Vague. Corporate.

FORBIDDEN WORDS
  seamlessly, powerful, revolutionize, easy, simple,
  leverage, next-gen, world-class, end-to-end, best-in-class

COMPETITORS (never disparage — only position)
  Style Dictionary → Strata comes after it (runtime vs build-time)
  Tokens Studio    → Strata removes the deploy step
  Supernova        → Strata is delivery, not documentation
  ZeroHeight       → Strata operates in production, not in docs

AUDIENCE
  Design systems engineers, product designers,
  design system leads, vibe coders
─────────────────────────────────────────────────
```

---

*This document is maintained by the Strata brand team at Charisol. For updates, versioning, or questions, refer to the product team.*
