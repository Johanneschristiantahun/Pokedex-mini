# Project: Pokédex Mini UI/UX Polish and Comprehensive Layout Refactor

## Architecture
Pokédex Mini is a React 19 single-page application built on Vite with React Router 7 and a monolithic vanilla CSS styling architecture (`src/index.css`). State is managed via `GameContext.jsx` with `localStorage` persistence. The application features multiple game hubs (Pokédex, Team, Bag, Mart, Wilderness, Gym Circuit, Pokémon League, Battle Tower, Mystery Dungeon, Compare, Link Battle).

### Data Flow & State Management
- Global game state (`team`, `bag`, `money`, `badges`, `stats`) is orchestrated by `GameContext.jsx`.
- Local storage key `pokesphere_team` stores the active Pokémon party.
- Cross-view synchronization utilizes React context and `window` storage events.

### Design System Principles (Apple Product Design Standard)
- Typography: San Francisco / system sans font stack, hierarchical sizing, subtle tracking, high legibility.
- Card Surfaces: 18px border radius, subtle 1px border (`rgba(0, 0, 0, 0.08)` / dark mode `rgba(255, 255, 255, 0.12)`), soft ambient multi-stop box shadows (`0 4px 20px rgba(0, 0, 0, 0.04)`).
- Visual Translucency: Frosted glass accents (`backdrop-filter: blur(20px)`), translucent navigation and modal headers.
- Responsiveness: Fluid CSS Grid layouts, zero horizontal overflow (`overflow-x: hidden`), automatic single-column reflow on viewports `< 768px`.
- High Information Density: Compact grid layouts eliminating unnecessary vertical scrolling.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Apple Design System Tokens in `:root` | Declare missing tokens (`--text-primary`, `--text-secondary`, `--border-color`, `--bg-primary`, frosted glass, shadows) | M1 | Survey (E2) |
| F2 | Standardized Container Layouts | Standardize fragmented container max-widths (Hubs: 1160px, Focused: 860px) and global padding | M1 | Survey (E2) |
| F3 | Global Mobile Overflow Prevention | Hide global `overflow-x`, fix mobile margin/padding clipping, ensure `scrollWidth === clientWidth` | M1 | R4 / Survey |
| F4 | TeamPage CSS Grid Overhaul | Refactor TeamPage to compact 3×2 grid on desktop, compact toolbar controls, 1-column on `< 768px` | M2 | R1 / Survey (E1) |
| F5 | BagPage CSS Grid Overhaul | Refactor BagPage to compact multi-item responsive grid, compact cards, 1-column on `< 768px` | M2 | R1 / Survey (E1) |
| F6 | MartPage CSS Grid Overhaul | Refactor MartPage to compact multi-item catalog grid, streamlined quantity stepper, 1-column on `< 768px` | M2 | R1 / Survey (E1) |
| F7 | Skills & Moves Typography Normalization | Standardize oversized move fonts to `0.8125rem` titles and `0.6875rem` meta tags in DetailPage & Battle views | M3 | R2 / Survey (E1) |
| F8 | DetailPage Ability & Metric Refactor | Refactor ability displays to compact chips and metric cards to prevent overflow on dual-ability Pokémon | M3 | R2 / Survey (E1) |
| F9 | Apple-Style Card Normalization | Apply unified card radiuses (18px), subtle borders, and soft shadows across Detail & Battle components | M3 | R2 / Survey |
| F10 | BattleEnvironment Prop Mismatch Fix | Fix `biomeId` vs `arenaTheme` prop mismatch and safe navigation in `BattleEnvironment.jsx` and `BattlePedestal.jsx` | M4 | R3 / Survey (E1, E2, E3) |
| F11 | Compare & Link Battle Contrast Fixes | Eliminate pitch-black buttons and black-on-black text clashes in `ComparePage` and `LinkBattlePage` | M4 | R3 / Survey (E1, E2, E3) |
| F12 | Real-Time Party Counter & State Reactivity | Add storage event sync to `GameContext`, toggleable remove in `DetailPage`, and `(X/6)` party indicators in `PokemonCard` / Dex list | M4 | R3 / Acceptance / Survey |
| F13 | App-Wide Polish Across Remaining Pages ("Semuanya") | Eliminate AI slop, harsh borders, and inconsistent styling in Wilderness, Gym, League, Dungeon, and Tower | M5 | Urgent Scope Update |
| F14 | Modal & Utility Component Polish | Polish StarterModal, EvolutionModal, TrainerPassportModal, and WeatherWidget to Apple design standard | M5 | Urgent Scope Update |
| F15 | Vite Build & E2E Acceptance Pass | Ensure clean `npm run build` with zero Vite bundle/JSX errors and 100% acceptance criteria pass | Final | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System & Layout Foundation | F1, F2, F3 | none | DONE (Verified: F1 Apple tokens in :root, F2 1160px/860px containers & frosted navbar, F3 mobile reset & <768px single-col reflow. Tests: 177/177 pass) |
| M2 | Compact Grid Layouts (Team, Bag, Mart) | F4, F5, F6 | M1 | DONE (Verified: F4 TeamPage 3x2 grid & 154px cards, F5 BagPage 4-col auto-fill grid & 58px cards, F6 MartPage 4-col auto-fill grid & 58px symmetrical cards & activeMartModal sheet. Tests: 177/177 pass) |
| M3 | Typography & Component Standardization | F7, F8, F9 | M1 | DONE (Verified: F7 normalized moves typography <= 0.8125rem, F8 detail metrics grid & proportional stat bars, F9 Apple card radii 14px-18px & 1px borders. Tests: 177/177 pass) |
| M4 | Visual Bug Fixes & State Reactivity | F10, F11, F12 | M1 | DONE (Verified: F10 BattleEnvironment SVG backdrops & gym themes, F11 high contrast rivalry pills, F12 real-time party counter & storage event reactivity. Tests: 177/177 pass) |
| M5 | Global Polish Across Remaining Views ("Semuanya") | F13, F14 | M2, M3, M4 | DONE (Verified: F13 Wilderness/Gym/League/Dungeon floor navigation, F14 frosted glass modal backdrops blur >= 10px & passport/evolution dialogs. Tests: 177/177 pass) |
| M-Final | Full E2E Acceptance Verification | F15 | M1, M2, M3, M4, M5 | DONE (Verified: 177/177 assertions pass, 100.0% pass rate, Vite build exit code 0) |

## Interface Contracts
### `BattleEnvironment.jsx`
- Signature: `BattleEnvironment({ biomeId, arenaTheme, weather, timeOfDay, cameraMode, children })`
- Fallback: `const activeBiome = biomeId || arenaTheme || "grassland"`
- Guard: `activeBiome?.startsWith("gym")` safe navigation.

### `BattlePedestal.jsx`
- Signature: `BattlePedestal({ biomeId, theme, isPlayer, isOpponent })`
- Theme resolution: `const activeTheme = biomeId || theme || "grassland"`
- Orientation resolution: `const isBackView = isPlayer ?? (!isOpponent)`

### `GameContext.jsx` ↔ Views
- `team`: Array of up to 6 Pokémon objects.
- `addToTeam(pokemon, level)`: Adds Pokémon to party if `team.length < 6`.
- `removeFromTeam(id)`: Removes Pokémon from party by instance ID.
- Real-time event listener: `window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEYS.TEAM) ... })`
- Multi-view indicator: `team.length` reflected in `(X/6)` counter across DetailPage, TeamPage, and PokemonCard badges.

## Code Layout
- `src/index.css`: Root design tokens, typography, grid utilities, responsive media queries.
- `src/components/Layout.jsx`: Application shell, max-width containers, header, footer.
- `src/components/Navbar.jsx`: Apple-style frosted glass top bar with route navigation and party quick counter.
- `src/context/GameContext.jsx`: Game state management, party persistence, storage sync.
- `src/pages/TeamPage.jsx`: Party management view, compact 3×2 grid, party reordering.
- `src/pages/BagAndMartPage.jsx`: Inventory & Poké Mart catalog compact grids.
- `src/pages/DetailPage.jsx`: Pokémon inspection, stats radar, ability chips, move list, toggleable party button.
- `src/components/PokemonCard.jsx`: Dex list card with Apple aesthetic and active in-party badge.
- `src/components/BattleEnvironment.jsx`: Arena SVG backdrop renderer with robust theme handling.
- `src/components/BattlePedestal.jsx`: Battle sprite pedestal with unified props.
- `src/pages/ComparePage.jsx`: Side-by-side Pokémon comparison and iconic matchups.
- `src/pages/LinkBattlePage.jsx`: Local multiplayer battle arena.
- `src/pages/WildernessPage.jsx`, `GymPage.jsx`, `LeaguePage.jsx`, `DungeonPage.jsx`, `BattleTowerPage.jsx`: Game modes polished to Apple aesthetic.
- `src/components/StarterModal.jsx`, `EvolutionModal.jsx`, `TrainerPassportModal.jsx`: Apple-style modal dialogs.
