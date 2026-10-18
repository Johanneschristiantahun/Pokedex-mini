# E2E Test Infra: Pokédex Mini UI/UX Refactor

## Test Philosophy
- Opaque-box, requirement-driven testing derived from `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
- Pass/Fail Semantics:
  - Exit code 0 for all automated test scripts.
  - DOM/CSS validation confirms no horizontal overflow (`scrollWidth <= clientWidth`), multi-column grids on desktop (`>= 1024px`), single-column reflow on mobile (`< 768px`), readable non-clashing colors, and real-time party counter reactivity.
  - Vite build compilation test (`npm run build`) exits with code 0 and produces valid dist bundle.

## Feature Inventory & Test Matrix
| # | Feature | Source | Tier 1 (Functional) | Tier 2 (Boundary/Edge) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|--------|:-------------------:|:----------------------:|:----------------------:|:-----------------:|
| 1 | Global Design System & Variables | R2, Urgent Update | 5 | 5 | ✓ | ✓ |
| 2 | Global Layout & Container Widths | R4, Urgent Update | 5 | 5 | ✓ | ✓ |
| 3 | Mobile Responsiveness & No Overflow | R4, Acceptance | 5 | 5 | ✓ | ✓ |
| 4 | TeamPage Compact Grid Layout | R1, Acceptance | 5 | 5 | ✓ | ✓ |
| 5 | BagPage Compact Grid Layout | R1, Acceptance | 5 | 5 | ✓ | ✓ |
| 6 | MartPage Compact Grid Layout | R1, Acceptance | 5 | 5 | ✓ | ✓ |
| 7 | Skills/Moves Typography Normalization | R2 | 5 | 5 | ✓ | ✓ |
| 8 | DetailPage Abilities & Metric Cards | R2 | 5 | 5 | ✓ | ✓ |
| 9 | Apple Card Aesthetics (Radii/Shadows) | R2, Urgent Update | 5 | 5 | ✓ | ✓ |
| 10 | Battle Backdrop SVG & Theme Rendering | R3, Acceptance | 5 | 5 | ✓ | ✓ |
| 11 | Contrast & Readability (No Black Box) | R3, Acceptance | 5 | 5 | ✓ | ✓ |
| 12 | Real-time Party Counter (X/6) Reactivity | R3, Acceptance | 5 | 5 | ✓ | ✓ |
| 13 | App-wide Polish Across Game Modes | Urgent Update | 5 | 5 | ✓ | ✓ |
| 14 | Modal Dialog Apple Polish | Urgent Update | 5 | 5 | ✓ | ✓ |
| 15 | Vite Production Build Integrity | Acceptance | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js automated test harness (`tests/e2e-runner.cjs` and `tests/build-check.cjs`).
- Automated headless browser/DOM inspection and static style assertions verifying:
  1. CSS AST rules for `.party-grid`, `.bag-items-grid`, `.mart-catalog-grid` media queries at `< 768px`.
  2. Mobile viewport simulation at 320px, 375px, 414px, and 768px ensuring zero horizontal overflow (`scrollWidth === clientWidth`).
  3. Real-time party state updates across `DetailPage`, `TeamPage`, and Dex cards.
  4. BattleEnvironment backdrop resolution for `arenaTheme="gym-champion"`, `towerTheme`, and `selectedDungeon.theme`.
  5. Contrast ratios for dialogue text and search buttons.
  6. `npm run build` exits 0 with no syntax/bundle errors.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Acceptance Target |
|---|----------|--------------------|-------------------|
| 1 | Full Party Management Flow | F4, F12, F3 | User adds 6 Pokémon across Dex and Detail, inspects compact 3×2 grid, deletes/reorders, counter updates (0/6 to 6/6) |
| 2 | Mobile Browsing on 375px Viewport | F3, F4, F5, F6, F2 | User navigates Team, Bag, Mart on iPhone viewport; all grids collapse to 1 column, zero horizontal scrolling |
| 3 | Link Battle & Arena Experience | F10, F11, F7, F9 | User enters Link Battle, arena renders vivid SVG backdrop (no black void), dialogue text is clear and readable |
| 4 | High-Density Shopping & Inventory Flow | F5, F6, F1, F9 | User opens Bag and Mart, items display compactly in multi-item rows on desktop, stepper works cleanly |
| 5 | Detail Page Deep Inspection | F7, F8, F9, F12 | User inspects multi-ability Pokémon, ability chips fit neatly without truncation, moves use standardized SF typography |

## Coverage Thresholds
- Tier 1: 5 test cases per feature (75 tests total)
- Tier 2: 5 boundary/corner test cases per feature (75 tests total)
- Tier 3: Pairwise combinations across features (15 tests)
- Tier 4: 5 realistic end-to-end user application workflows
- Total: >= 170 test assertions
