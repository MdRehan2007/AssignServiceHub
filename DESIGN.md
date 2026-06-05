# Design Brief: AssignFlow + Maintenance Mode

## Tone & Direction
Corporate-utilitarian, professional, trustworthy. Blue/white enterprise SaaS dashboard with clean, focused UI. Maintenance mode uses full-screen overlay with centered card, soft animations, and status indicators.

## Color Palette (Light & Dark)

| Token | OKLCH | Light | Dark | Purpose |
|-------|-------|-------|------|----------|
| Primary | 0.52 0.18 265 | Indigo | Light Indigo | Corporate reliability, primary actions |
| Secondary | 0.60 0.12 255 | Slate Blue | Light Slate | Alternative accent, agent actions |
| Accent | 0.71 0.16 82 | Amber | Light Amber | Highlights, status indicators |
| Status: Waiting | 0.72 0.08 250 | Gray | Light Gray | Neutral, queued state |
| Status: Called | 0.71 0.16 82 | Amber | Light Amber | Attention required |
| Status: Serving | 0.52 0.18 265 | Indigo | Light Indigo | Active, in-progress |
| Status: Completed | 0.62 0.16 155 | Green | Light Green | Success state |
| Destructive | 0.57 0.24 25 | Alert Red | Light Red | Warnings |
| Background | 0.98 0.01 250 | Near-white | Deep Navy | Base surface |
| Card | 0.99 0 0 | Pure White | Dark Card | Elevated containers |
| Border | 0.90 0.02 250 | Light Gray | Subtle Divider | Subtle divisions |
| Muted | 0.92 0.02 250 | Off-white | Dark Gray | Secondary backgrounds |

## Typography
- **Display**: GeneralSans 600 (headlines, dashboard titles, timer numbers — geometric, modern)
- **Body**: DM Sans 400 (content, labels, form fields)
- **Mono**: GeistMono 400 (queue IDs, timestamps, token codes)
- **Scale**: 28px (timer) → 22px (h2) → 16px (body) → 12px (label)

## Dark Mode Implementation
- **Toggle**: Header shows sun/moon icon. Preference saved to `localStorage` as `theme-preference`.
- **Tuning**: Dark mode uses L ≥ 0.68 for text, L ≤ 0.20 for background. Status colors remain semantically consistent.
- **Contrast**: All text meets WCAG AA+ (lightness diff ≥ 0.7) in both light and dark.

## Structural Zones (Responsive)
| Zone | Light Treatment | Dark Treatment | Purpose |
|------|-----------------|-----------------|----------|
| Header/Nav | `bg-card border-b` white | `bg-card border-b` dark card | Top bar, branding, user menu |
| Sidebar/Nav | `bg-sidebar` white | `bg-sidebar` dark | Role navigation, queue filter |
| Main Content | `bg-background` light gray | `bg-background` deep navy | Queue board, dashboard, forms |
| Cards/Panels | `surface-elevated` white | `surface-elevated` dark | Queue entry, counter panel, stat card |
| Maintenance Overlay | `gradient overlay` navy | `gradient overlay` navy-dark | Full-screen maintenance banner |
| Maintenance Card | `bg-card` white/dark-card | `bg-card` white/dark-card | Centered maintenance info panel |

## Maintenance Mode Components
- **Overlay**: Full-screen dark gradient background (#0f2d4d to #1a3d5c), fixed positioning, z-index 9999
- **Card**: Centered white card, 12px rounded corners, shadow, 6-12px responsive padding
- **Icon**: Large emoji/icon (3rem), pulsing animation 2s ease-in-out
- **Title**: GeneralSans bold, indigo text
- **Timer**: 5xl font-bold primary color, HH:MM:SS format
- **Status Pill**: Amber background (15% opacity), amber border, live indicator dot
- **Message**: Muted gray text, small font, centered

## Component Patterns
- **Call Next Button**: Large `.button-call-next` (lg shadow, bold font, 32px+ height) — primary agent action
- **Token Display**: `.text-token-number` (4xl, indigo, bold) — prominent queue number
- **Cards**: `.card-compact` (4px padding, vertical spacing) — information density
- **Buttons**: `.button-primary`, `.button-secondary`, `.button-outline` — 8px radius, 2px borders
- **Maintenance Classes**: `.maintenance-overlay`, `.maintenance-card`, `.maintenance-timer`, `.maintenance-status-pill`

## Spacing & Rhythm
- **Grid**: 4px base unit. Padding: 12px (cards), 16px (sections), 20px (page margins).
- **Gaps**: 8px (compact), 12px (standard), 16px (large).
- **Mobile**: Full-width cards, stacked layout. Desktop: grid-based layout.
- **Maintenance**: 48px-96px padding top/bottom on desktop, responsive on mobile.

## Motion & Interaction
- **Transition**: `transition-smooth` (300ms, cubic-bezier 0.4 0 0.2 1) on all interactive elements.
- **Maintenance Animations**: Fade-in overlay (500ms), slide-up card (500ms, 100ms delay), pulsing icon/status-dot (2s infinite)
- **Dark Mode Toggle**: Smooth color shift, no flash.
- **Status Transitions**: Semantic badge color changes on queue state update.

## Signature Detail
Semantic status badge colors (waiting, called, serving, completed) provide instant visual feedback. Dense information layout with compact spacing optimizes for high-volume queue environments. Maintenance mode uses soft, non-intrusive animations with a professional overlay gradient. No unnecessary decoration — every element serves function.

## Accessibility & Constraints
- **Contrast**: WCAG AA+ (L diff ≥ 0.7) in light and dark modes.
- **Responsive**: Mobile-first. Cards stack on mobile, grid on tablet+. Maintenance overlay maintains full coverage on all screens.
- **Dark Mode**: Fully supported. Preference persisted. Maintenance mode respects dark/light preference.
- **Status Indicators**: Color + text labels for non-color-dependent understanding.
- **Input Validation**: Clear error states with destructive color and descriptive messages.
- **Maintenance Messaging**: Non-blocking, informative, centered. Text readable at all zoom levels.
