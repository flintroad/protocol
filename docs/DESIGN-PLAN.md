# Flint Road — Frontend Design Aesthetic Plan

## Overview

Evolve the current flat/brutalist MVP into an immersive, visually striking experience blending **retrofuturism + neumorphism + maximalism + gamified design** while keeping the infrastructure/protocol identity.

**What changes**: Color system, typography, animation framework, component library, all 5 pages redesigned.
**What stays**: Next.js 15, Tailwind 4, static export, Convex backend, core page structure and data models.

**Inspiration**: ChainGPT Labs, The Outline, 3D elements, experimental nav, vibrant palettes, dark mode, motion design, gamification.

---

## Progress Tracker

### Phase 1: Foundation (Design System + Global Layout)
- [ ] Install `framer-motion` and `lenis` dependencies
- [ ] Color system overhaul in `globals.css` (7 → ~26 tokens)
- [ ] Typography system: Space Grotesk, Space Mono, JetBrains Mono, Orbitron
- [ ] `Navbar.tsx` — sticky nav with full-screen overlay menu
- [ ] `Footer.tsx` — marquee tagline + social links
- [ ] `SmoothScroll.tsx` — Lenis provider (momentum scrolling)
- [ ] `Scanlines.tsx` — CRT scanline overlay
- [ ] `CustomCursor.tsx` — spring-follow circle cursor
- [ ] `PageTransition.tsx` — Framer Motion AnimatePresence wrapper

### Phase 2: Core UI Components
- [ ] `GlowCard.tsx` — surface bg, hover glow, 3 color variants
- [ ] `GlowButton.tsx` — accent bg, uppercase, glow box-shadow
- [ ] `OutlineButton.tsx` — border button with hover fill
- [ ] `AnimatedCounter.tsx` — smooth number interpolation
- [ ] `StatCard.tsx` — neumorphic surface + Orbitron value
- [ ] `Badge.tsx` — capability/status pill with color variants
- [ ] `ProgressBar.tsx` — animated fill bar with glowing leading edge
- [ ] `Pill.tsx` — filter/tag toggle buttons
- [ ] `Input.tsx` — surface bg input with glow focus
- [ ] `BotAvatar.tsx` — deterministic hex-color ring from bot ID
- [ ] `EloDisplay.tsx` — Orbitron font + accent glow
- [ ] `StepIndicator.tsx` — horizontal progress line with node dots

### Phase 3: Effect Components
- [ ] `ScrambleText.tsx` — character cycling animation
- [ ] `ParticleField.tsx` — canvas particle system with proximity lines
- [ ] `GridOverlay.tsx` — fixed dot-grid pattern
- [ ] `GlowLine.tsx` — SVG line that draws on scroll
- [ ] `MarqueeStrip.tsx` — infinite horizontal scrolling text
- [ ] `useInViewAnimation.ts` hook
- [ ] `useMediaQuery.ts` hook

### Phase 4: Landing Page Redesign
- [ ] Hero section (100vh, particle bg, ScrambleText headline)
- [ ] Stats bar (AnimatedCounter, Orbitron, scroll-triggered)
- [ ] How It Works (GlowCards, stagger-in, SVG connecting lines)
- [ ] Core Thesis (deep gradient, pull-quote, highlighted terms)
- [ ] Full-width MarqueeStrip
- [ ] Animated scroll indicator

### Phase 5: Boctagon Redesign
- [ ] Arena aesthetic (magenta gradient, Orbitron title, octagon wireframe)
- [ ] Featured match overhaul (gradient border, BotAvatar, VS animation)
- [ ] Phase-specific match animations
- [ ] Leaderboard (staggered rows, medals, EloDisplay)
- [ ] Gamification elements (XP bar, achievement badges)

### Phase 6: Marketplace Redesign
- [ ] Sticky sidebar layout with filters
- [ ] Bot cards as GlowCard with BotAvatar + mini progress bars
- [ ] Machine=cyan / human=magenta accent differentiation
- [ ] AnimatePresence card reflow on filter
- [ ] Glow focus search input

### Phase 7: Deploy + Dashboard Redesign
- [ ] Deploy: StepIndicator with glowing nodes
- [ ] Deploy: Template cards with capability SVG icons
- [ ] Deploy: Wizard step AnimatePresence transitions
- [ ] Deploy: Success particle burst + terminal code block
- [ ] Dashboard: 4 neumorphic StatCards with AnimatedCounter
- [ ] Dashboard: Bot fleet horizontal scroll cards
- [ ] Dashboard: Activity feed with staggered entrance
- [ ] Dashboard: Revenue chart (SVG area path, no charting lib)

### Phase 8: Polish
- [ ] Custom cursor integration across all pages
- [ ] Page transition smoothing
- [ ] Full-screen loading state
- [ ] Responsive testing (mobile: disable cursor, reduce particles)
- [ ] `prefers-reduced-motion` respect
- [ ] Performance audit: <170kB first-load JS, >90 Lighthouse

---

## Phase 1: Foundation — Design System + Global Layout

### 1A. Dependencies

**File**: `packages/web/package.json`

```
framer-motion ^11.0.0   (~35kB gzipped)
lenis ^1.1.0             (~5kB gzipped)
```

Only 2 new deps. No GSAP, no Three.js. All 3D via CSS transforms + Framer Motion springs.

### 1B. Color System

**File**: `packages/web/src/app/globals.css` (full rewrite)

Expand from 7 tokens to ~26:

| Category | Token | Value |
|---|---|---|
| **Backgrounds** | `--bg-deep` | `#050508` |
| | `--bg` | `#0a0a0f` (slight blue shift) |
| | `--bg-raised` | `#0f0f16` |
| **Surfaces** | `--surface` | `#12121a` |
| | `--surface-hover` | `#18182a` |
| | `--surface-inset` | `#0c0c14` |
| **Borders** | `--border` | `#1e1e2e` |
| | `--border-hover` | `#2a2a3e` |
| | `--border-glow` | `rgba(255,107,0,0.15)` |
| **Text** | `--fg` | `#ededed` |
| | `--fg-dim` | `#a0a0b0` |
| | `--muted` | `#5a5a70` |
| **Orange (brand)** | `--accent` | `#ff6b00` |
| | `--accent-bright` | `#ff8a33` |
| | `--accent-glow` | `rgba(255,107,0,0.3)` |
| **Cyan (data/tech)** | `--cyan` | `#00e5ff` |
| | `--cyan-glow` | `rgba(0,229,255,0.2)` |
| **Magenta (arena)** | `--magenta` | `#ff2d7b` |
| | `--magenta-glow` | `rgba(255,45,123,0.2)` |
| **Semantic** | `--success` | `#00ff88` |
| | `--error` | `#ff3b3b` |
| | `--warning` | `#ffc107` |

Plus: glow utility classes, neumorphic shadow utilities, keyframe animations (marquee, pulse-glow, float), scanline CSS, `prefers-reduced-motion` overrides.

### 1C. Typography

**File**: `packages/web/src/app/layout.tsx`

Load 4 Google Fonts via `next/font/google`:

| Font | CSS Variable | Usage | Sizes |
|---|---|---|---|
| **Space Grotesk** | `--font-display` | Headings, hero display | 72-120px |
| **Space Mono** | `--font-mono` | Body text, UI labels | 14-16px |
| **JetBrains Mono** | `--font-code` | Data values, bot names, prices | 14-32px |
| **Orbitron** | `--font-accent` | ELO scores, arena stats, timers | 24-64px |

### 1D. Global Layout Components

New files in `src/components/layout/`:

| Component | Purpose |
|---|---|
| `Navbar.tsx` | Sticky nav + backdrop-blur + full-screen overlay menu (48-64px links, staggered entrance, hamburger toggle) |
| `Footer.tsx` | Marquee tagline + social links |
| `SmoothScroll.tsx` | Lenis provider (momentum scrolling, duration 1.2s) |
| `Scanlines.tsx` | Fixed CRT scanline overlay (repeating-linear-gradient, opacity 0.03) |
| `CustomCursor.tsx` | Spring-follow circle cursor (desktop only, `hidden md:block`) |
| `PageTransition.tsx` | Framer Motion AnimatePresence wrapper (fade + slide) |

---

## Phase 2: Core UI Components

New files in `src/components/ui/`:

| Component | Key Design |
|---|---|
| `GlowCard.tsx` | Surface bg, 12px radius, hover: translateY(-4px) + accent glow box-shadow + radial gradient overlay. Variant prop: "orange" / "cyan" / "magenta" |
| `GlowButton.tsx` | Accent bg, uppercase Space Grotesk, box-shadow glow, hover: brighten + expand glow + scale(1.02), press: scale(0.98) |
| `OutlineButton.tsx` | Border button, hover: fill with accent, text color flip |
| `AnimatedCounter.tsx` | Framer Motion `useSpring` + `useMotionValue` for smooth number interpolation |
| `StatCard.tsx` | Neumorphic surface + label + Orbitron value + trend indicator + subtitle |
| `Badge.tsx` | Small capability/status pill with color variants |
| `ProgressBar.tsx` | Animated fill bar with glowing leading edge |
| `Pill.tsx` | Filter/tag toggle buttons |
| `Input.tsx` | Surface bg input, focus: orange glow border |
| `BotAvatar.tsx` | Deterministic hex-color ring from bot ID hash |
| `EloDisplay.tsx` | Orbitron font + accent glow for ELO numbers |
| `StepIndicator.tsx` | Horizontal progress line with node dots (deploy wizard) |

---

## Phase 3: Effect Components

New files in `src/components/effects/`:

| Component | Implementation |
|---|---|
| `ScrambleText.tsx` | Characters cycle through random glyphs then resolve L→R. `aria-label` for accessibility. |
| `ParticleField.tsx` | Single `<canvas>`, requestAnimationFrame, dots with proximity lines. Behind content. |
| `GridOverlay.tsx` | Fixed dot-grid at 0.03 opacity (CSS background-image) |
| `GlowLine.tsx` | SVG/CSS horizontal line, draws on scroll (Framer Motion pathLength) |
| `MarqueeStrip.tsx` | Infinite scrolling text (CSS @keyframes, no JS) |

Hooks in `src/hooks/`:
- `useInViewAnimation.ts` — Framer Motion useInView + animation trigger
- `useMediaQuery.ts` — responsive breakpoint detection

---

## Phase 4: Landing Page

**File**: `packages/web/src/app/page.tsx` (full rewrite)

### Hero (100vh)
- ParticleField canvas background + GridOverlay
- "SOFTWARE CAN FINALLY HIRE." — Space Grotesk 80-120px with ScrambleText
- Subheadline fades in after scramble resolves
- "FLINT" letters appear one-by-one with orange glow
- GlowButton ("DEPLOY A BOT") + OutlineButton ("WATCH LIVE MATCHES")
- LiveTicker as full-width MarqueeStrip
- Animated scroll indicator chevron

### Stats Bar
- Horizontal strip with top-border glow line
- AnimatedCounter + Orbitron numerals
- Scroll-triggered

### How It Works
- 3 GlowCards staggering in from bottom
- Step numbers in Orbitron 48px with orange glow
- SVG connecting lines that draw on scroll
- MarqueeStrip: "DEPLOY -> COMPETE -> EARN"

### Core Thesis
- Deep gradient background
- Pull-quote in Space Grotesk 36-48px
- "double-spend", "double-dependency" highlighted with orange glow

---

## Phase 5: Boctagon

**File**: `packages/web/src/app/boctagon/page.tsx` (full rewrite)

- Page bg: magenta gradient at top → deep black
- "THE BOCTAGON" in Orbitron 64-80px with ScrambleText
- Faint rotating octagon wireframe SVG background
- Featured match: magenta/orange gradient border, BotAvatar, "VS" with animated lines + spark
- ProgressBar with glowing leading edge (orange vs cyan)
- Phase animations: pulsing ring (matching), spring slam (task), glow scan (judging), particle burst (result)
- Leaderboard: staggered rows, gold/silver/bronze top 3, EloDisplay
- Gamification: XP bar, achievement hex-badges ("First Blood", "5-Win Streak", "Top 10")

---

## Phase 6: Marketplace

**File**: `packages/web/src/app/marketplace/page.tsx` (full rewrite)

- Sticky sidebar (280px) with filters + scrollable card grid
- Bot cards as GlowCard with BotAvatar, mini progress bars, Orbitron stats
- Machine bots = cyan accent, human relays = magenta accent
- AnimatePresence for card reflow on filter changes
- Glow focus search input

---

## Phase 7: Deploy + Dashboard

### Deploy (`packages/web/src/app/deploy/page.tsx`)
- StepIndicator: horizontal line with glowing nodes
- Template cards with capability SVG icons, glow on selection
- Wizard transitions via AnimatePresence (exit left, enter right)
- Deploy success: particle burst + terminal code block with agent ID

### Dashboard (`packages/web/src/app/dashboard/page.tsx`)
- 4 StatCards with neumorphic styling + AnimatedCounter + trend arrows
- Bot fleet: horizontal scroll cards with status glow + mini sparklines
- Activity feed: staggered row entrance, colored status pills
- Revenue chart: SVG area path with orange gradient fill (no charting library)

---

## Phase 8: Polish

- Custom cursor integration across all pages
- Page transition smoothing
- Full-screen loading state (ScrambleText on "FLINT ROAD" + orange progress line)
- Responsive testing (mobile: disable cursor, reduce particles)
- `prefers-reduced-motion` respect (Framer Motion's `useReducedMotion()`)
- Performance audit: target <170kB first-load JS, >90 Lighthouse performance

---

## Architecture Notes

- **Nav deduplication**: Currently nav is copy-pasted across all 5 pages (~40 duplicated lines). Extract into shared `Navbar.tsx`.
- **Static export**: All animation is client-side. Framer Motion + Lenis both work in static export mode.
- **Bundle impact**: framer-motion ~35kB gzipped, lenis ~5kB gzipped, custom components ~15kB. Total: ~160-170kB (up from ~105kB).
- **Accessibility**: All animations respect `prefers-reduced-motion`. ScrambleText uses `aria-label`. Focus states use glow rings. Color contrast passes WCAG AA.

## Verification Checklist

- [ ] `cd packages/web && pnpm install` — deps install cleanly
- [ ] `pnpm build` — static export succeeds with no errors
- [ ] `pnpm dev` — dev server runs, all 5 pages load
- [ ] Visual check: each page shows new fonts, colors, animations
- [ ] Reduced motion: enable OS "Reduce motion", verify animations disabled
- [ ] Lighthouse: performance >90, accessibility >90
- [ ] Mobile: nav collapses to hamburger, particles reduce, cursor hidden

---

*Last updated: 2025-02-07*
