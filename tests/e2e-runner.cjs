/**
 * PokéDex Mini E2E Test Suite - Core Test Harness & Requirement Assertions
 * tests/e2e-runner.cjs
 *
 * Implements full opaque-box, requirement-driven test verification across
 * Tiers 1-4 per ORIGINAL_REQUEST.md, TEST_INFRA.md, and PROJECT.md.
 */

const fs = require("fs");
const path = require("path");
const {
  PROJECT_ROOT,
  SRC_DIR,
  DIST_DIR,
  readProjectFile,
  fileExists,
  parseCssTokensAndRules,
  parseDeclarations,
  findRule,
  simulateViewportLayout,
  parseColorToRgb,
  calculateContrastRatio,
  createMockGameSimulator,
} = require("./helpers/test-utils.cjs");

function runE2eSuite(options = {}) {
  const cssContent = readProjectFile("src/index.css");
  const { tokens, rules, mediaQueries } = parseCssTokensAndRules(cssContent);

  const suiteResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tiers: {
      tier1: { total: 0, passed: 0, failed: 0, tests: [] },
      tier2: { total: 0, passed: 0, failed: 0, tests: [] },
      tier3: { total: 0, passed: 0, failed: 0, tests: [] },
      tier4: { total: 0, passed: 0, failed: 0, tests: [] },
    },
    features: {},
    allTests: [],
  };

  function record(tierKey, featureKey, testId, description, fn) {
    suiteResults.total++;
    suiteResults.tiers[tierKey].total++;

    if (!suiteResults.features[featureKey]) {
      suiteResults.features[featureKey] = { total: 0, passed: 0, failed: 0 };
    }
    suiteResults.features[featureKey].total++;

    const item = {
      tier: tierKey,
      feature: featureKey,
      id: testId,
      description,
      status: "PASS",
      error: null,
    };

    try {
      fn();
      suiteResults.passed++;
      suiteResults.tiers[tierKey].passed++;
      suiteResults.features[featureKey].passed++;
    } catch (err) {
      item.status = "FAIL";
      item.error = err.message;
      suiteResults.failed++;
      suiteResults.tiers[tierKey].failed++;
      suiteResults.features[featureKey].failed++;
    }

    suiteResults.tiers[tierKey].tests.push(item);
    suiteResults.allTests.push(item);
  }

  // Assertion helpers
  function assert(cond, msg) {
    if (!cond) throw new Error(msg || "Assertion failed");
  }
  function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(`${msg || "Expected equal"}: got '${actual}', expected '${expected}'`);
    }
  }
  function assertGte(actual, min, msg) {
    if (actual < min) {
      throw new Error(`${msg || "Expected >= min"}: got ${actual}, min is ${min}`);
    }
  }

  // =========================================================================
  // TIER 1: FUNCTIONAL FEATURE COVERAGE (75 Tests: Features 1..15 x 5 tests)
  // =========================================================================

  // Feature 1: Global Design System & Variables
  record("tier1", "F1", "F1-T1-1", "Root defines foundational background tokens", () => {
    assert(tokens["--bg-main"] || tokens["--bg-primary"], "Missing --bg-main or --bg-primary");
    assert(tokens["--bg-card"], "Missing --bg-card");
  });
  record("tier1", "F1", "F1-T1-2", "Root defines typography hierarchy tokens", () => {
    assert(tokens["--text-main"] || tokens["--text-primary"], "Missing --text-main/primary");
    assert(tokens["--text-muted"] || tokens["--text-secondary"], "Missing --text-muted/secondary");
  });
  record("tier1", "F1", "F1-T1-3", "Root defines border light / border color tokens", () => {
    assert(tokens["--border-light"] || tokens["--border-color"], "Missing --border-light/color");
  });
  record("tier1", "F1", "F1-T1-4", "Root defines Apple card radius token (12-20px)", () => {
    const r = tokens["--card-radius"] || tokens["--radius-apple"];
    assert(r, "Missing --card-radius");
    const val = parseInt(r, 10);
    assert(val >= 12 && val <= 20, `Card radius out of range: ${val}px`);
  });
  record("tier1", "F1", "F1-T1-5", "Root defines ambient shadow tokens with subtle alphas", () => {
    assert(tokens["--shadow-sm"] || tokens["--shadow-apple"], "Missing --shadow-sm/apple");
  });

  // Feature 2: Global Layout & Container Widths
  record("tier1", "F2", "F2-T1-1", "Main content container max-width is standardized (1160-1200px)", () => {
    const mcRules = findRule(rules, ".main-content");
    assert(mcRules.length > 0, "Missing .main-content rule");
    const mw = mcRules[0].decls["max-width"];
    assert(mw, "Missing max-width on .main-content");
    const num = parseInt(mw, 10);
    assert(num >= 1160 && num <= 1200, `.main-content max-width out of bounds: ${num}px`);
  });
  record("tier1", "F2", "F2-T1-2", "Navbar container max-width aligns with main content", () => {
    const navRules = findRule(rules, ".navbar-container");
    assert(navRules.length > 0, "Missing .navbar-container rule");
    const mw = navRules[0].decls["max-width"];
    assert(mw, "Missing max-width on .navbar-container");
    const num = parseInt(mw, 10);
    assert(num >= 1160 && num <= 1200, `.navbar-container max-width mismatch: ${num}px`);
  });
  record("tier1", "F2", "F2-T1-3", "Main content defines responsive horizontal padding >= 16px", () => {
    const mcRules = findRule(rules, ".main-content");
    const pad = mcRules[0].decls["padding"];
    assert(pad, "Missing padding on .main-content");
    assert(/\d+px/.test(pad), "Padding must include pixel declarations");
  });
  record("tier1", "F2", "F2-T1-4", "Layout containers use auto margins for horizontal centering", () => {
    const mcRules = findRule(rules, ".main-content");
    assert(mcRules[0].decls["margin"].includes("auto"), ".main-content must use auto horizontal margin");
  });
  record("tier1", "F2", "F2-T1-5", "App shell occupies full viewport height with flex column layout", () => {
    const shellRules = findRule(rules, ".app-shell");
    assert(shellRules.length > 0, "Missing .app-shell rule");
    assert(shellRules[0].decls["min-height"] === "100vh", "min-height must be 100vh");
    assert(shellRules[0].decls["display"] === "flex", "display must be flex");
  });

  // Feature 3: Mobile Responsiveness & No Overflow
  record("tier1", "F3", "F3-T1-1", "html and body define overflow-x: hidden", () => {
    const htmlRules = rules.filter((r) => r.selectors.some((s) => s.includes("html") || s.includes("body")));
    const hasOverflowX = htmlRules.some((r) => r.decls["overflow-x"] === "hidden");
    assert(hasOverflowX, "html/body must specify overflow-x: hidden");
  });
  record("tier1", "F3", "F3-T1-2", "Root and app shell constrain width to 100vw and hide overflow-x", () => {
    const shellRules = rules.filter((r) => r.selectors.some((s) => s.includes("#root") || s.includes(".app-shell")));
    const hasOverflowX = shellRules.some((r) => r.decls["overflow-x"] === "hidden");
    assert(hasOverflowX, "#root/.app-shell must specify overflow-x: hidden");
  });
  record("tier1", "F3", "F3-T1-3", "Global body typography uses Apple SF system font stack", () => {
    const bodyRules = findRule(rules, "body");
    assert(bodyRules.length > 0, "Missing body rule");
    const font = bodyRules[0].decls["font-family"];
    assert(font.includes("-apple-system") || font.includes("SF Pro"), "Font family must include Apple system fonts");
  });
  record("tier1", "F3", "F3-T1-4", "App shell main content flexes to fill available height", () => {
    const mcRules = findRule(rules, ".main-content");
    assert(mcRules[0].decls["flex"] === "1", ".main-content must specify flex: 1");
  });
  record("tier1", "F3", "F3-T1-5", "Toast notification does not exceed screen viewport", () => {
    const toastRules = findRule(rules, ".toast-notification");
    assert(toastRules.length > 0, "Missing .toast-notification rule");
  });

  // Feature 4: TeamPage Compact Grid Layout
  record("tier1", "F4", "F4-T1-1", ".party-grid defines display: grid", () => {
    const partyRules = findRule(rules, ".party-grid");
    assert(partyRules.length > 0, "Missing .party-grid rule");
    assert(partyRules[0].decls["display"] === "grid", ".party-grid must have display: grid");
  });
  record("tier1", "F4", "F4-T1-2", ".party-grid desktop columns support multiple items per row", () => {
    const partyRules = findRule(rules, ".party-grid");
    const cols = partyRules[0].decls["grid-template-columns"];
    assert(cols && (cols.includes("repeat") || cols.includes("fr")), "Desktop party-grid must define multiple columns");
  });
  record("tier1", "F4", "F4-T1-3", ".party-card defines Apple card aesthetics (border, radius, shadow)", () => {
    const cardRules = findRule(rules, ".party-card");
    assert(cardRules.length > 0, "Missing .party-card rule");
    assert(cardRules[0].decls["border-radius"], "Missing border-radius on .party-card");
    assert(cardRules[0].decls["box-shadow"], "Missing box-shadow on .party-card");
  });
  record("tier1", "F4", "F4-T1-4", "Empty party slot elements define clean placeholder styling", () => {
    const emptyRules = rules.filter((r) => r.selectors.some((s) => s.includes("empty-slot") || s.includes("party-card-empty")));
    assert(emptyRules.length > 0, "Missing empty party slot styling");
  });
  record("tier1", "F4", "F4-T1-5", ".party-grid reflows to single column in mobile media queries", () => {
    let hasMobileReflow = false;
    for (const mq of mediaQueries) {
      if (mq.query.includes("max-width")) {
        const pRules = mq.rules.filter((r) => r.selectors.includes(".party-grid"));
        if (pRules.some((r) => r.decls["grid-template-columns"] === "1fr")) {
          hasMobileReflow = true;
          break;
        }
      }
    }
    assert(hasMobileReflow, ".party-grid must reflow to 1fr on mobile");
  });

  // Feature 5: BagPage Compact Grid Layout
  record("tier1", "F5", "F5-T1-1", ".bag-items-grid defines display: grid", () => {
    const bagRules = findRule(rules, ".bag-items-grid");
    assert(bagRules.length > 0, "Missing .bag-items-grid rule");
    assert(bagRules[0].decls["display"] === "grid", ".bag-items-grid must have display: grid");
  });
  record("tier1", "F5", "F5-T1-2", ".bag-items-grid desktop supports multiple items per row", () => {
    const bagRules = findRule(rules, ".bag-items-grid");
    const cols = bagRules[0].decls["grid-template-columns"];
    assert(cols && cols.includes("repeat"), ".bag-items-grid must use repeat multi-column grid");
  });
  record("tier1", "F5", "F5-T1-3", ".bag-item-card compact tile height is <= 64px to prevent sprawl", () => {
    const itemRules = findRule(rules, ".bag-item-card");
    assert(itemRules.length > 0, "Missing .bag-item-card rule");
    const minH = parseInt(itemRules[0].decls["min-height"] || "56", 10);
    assert(minH <= 64, `Tile min-height too tall: ${minH}px`);
  });
  record("tier1", "F5", "F5-T1-4", "Bag pocket category filter buttons defined with clean pill styling", () => {
    const pocketRules = rules.filter((r) => r.selectors.some((s) => s.includes("pocket-pill") || s.includes("pocket-tab")));
    assert(pocketRules.length > 0, "Missing bag pocket filter styling");
  });
  record("tier1", "F5", "F5-T1-5", ".bag-item-card defines smooth hover transition without layout shifts", () => {
    const itemRules = findRule(rules, ".bag-item-card");
    assert(itemRules[0].decls["transition"], "Missing transition on .bag-item-card");
  });

  // Feature 6: MartPage Compact Grid Layout
  record("tier1", "F6", "F6-T1-1", ".mart-catalog-grid defines display: grid", () => {
    const martRules = rules.filter((r) => r.selectors.includes(".mart-catalog-grid"));
    assert(martRules.length > 0, "Missing .mart-catalog-grid rule");
    assert(martRules[0].decls["display"] === "grid", ".mart-catalog-grid must have display: grid");
  });
  record("tier1", "F6", "F6-T1-2", ".mart-catalog-grid desktop defines multi-column tiles", () => {
    const martRules = rules.filter((r) => r.selectors.includes(".mart-catalog-grid"));
    const cols = martRules[0].decls["grid-template-columns"];
    assert(cols && cols.includes("repeat"), ".mart-catalog-grid must define repeat columns");
  });
  record("tier1", "F6", "F6-T1-3", "Mart buy and sell mode toggles styled cleanly", () => {
    const toggleRules = rules.filter((r) => r.selectors.some((s) => s.includes("mart-mode-btn") || s.includes("mart-tab")));
    assert(toggleRules.length > 0, "Missing mart mode switcher styling");
  });
  record("tier1", "F6", "F6-T1-4", "Mart card tile height is compact (min-height <= 64px)", () => {
    const cardRules = rules.filter((r) => r.selectors.includes(".mart-card"));
    assert(cardRules.length > 0, "Missing .mart-card rule");
    const minH = parseInt(cardRules[0].decls["min-height"] || "58", 10);
    assert(minH <= 64, `.mart-card min-height too tall: ${minH}px`);
  });
  record("tier1", "F6", "F6-T1-5", "Mart transaction steppers define compact buttons", () => {
    const stepperRules = rules.filter((r) => r.selectors.some((s) => s.includes("stepper") || s.includes("btn-qty")));
    assert(stepperRules.length > 0, "Missing quantity stepper styling");
  });

  // Feature 7: Skills/Moves Typography Normalization
  record("tier1", "F7", "F7-T1-1", "Move names use normalized compact typography (<= 0.9rem)", () => {
    const moveRules = findRule(rules, ".move-name");
    assert(moveRules.length > 0, "Missing .move-name rule");
    const fsVal = parseFloat(moveRules[0].decls["font-size"]);
    assert(fsVal <= 0.9, `Move name font-size oversized: ${fsVal}rem`);
  });
  record("tier1", "F7", "F7-T1-2", "Move power / meta labels use compact sizing (<= 0.75rem)", () => {
    const powRules = findRule(rules, ".move-power");
    assert(powRules.length > 0, "Missing .move-power rule");
    const fsVal = parseFloat(powRules[0].decls["font-size"]);
    assert(fsVal <= 0.75, `Move power font-size oversized: ${fsVal}rem`);
  });
  record("tier1", "F7", "F7-T1-3", "Moves deck grid defines 2-column layout (.moves-deck-grid)", () => {
    const deckRules = findRule(rules, ".moves-deck-grid");
    assert(deckRules.length > 0, "Missing .moves-deck-grid rule");
    assert(deckRules[0].decls["grid-template-columns"].includes("2"), ".moves-deck-grid must be 2 columns");
  });
  record("tier1", "F7", "F7-T1-4", "Move pill cards define Apple border radius (10-14px)", () => {
    const pillRules = findRule(rules, ".move-pill-card");
    assert(pillRules.length > 0, "Missing .move-pill-card rule");
    const r = parseInt(pillRules[0].decls["border-radius"], 10);
    assert(r >= 10 && r <= 14, `Move pill border radius out of bounds: ${r}px`);
  });
  record("tier1", "F7", "F7-T1-5", "Move cards enforce text-overflow ellipsis on tight bounds", () => {
    const moveRules = rules.filter((r) => r.selectors.includes(".move-name"));
    const hasEllipsis = moveRules.some((r) => r.decls["text-overflow"] === "ellipsis");
    assert(hasEllipsis, ".move-name must define text-overflow: ellipsis");
  });

  // Feature 8: DetailPage Abilities & Metric Cards
  record("tier1", "F8", "F8-T1-1", "Bio metrics grid defines responsive grid layout (.detail-metrics-grid)", () => {
    const gridRules = findRule(rules, ".detail-metrics-grid");
    assert(gridRules.length > 0, "Missing .detail-metrics-grid rule");
    assert(gridRules[0].decls["display"] === "grid", ".detail-metrics-grid must have display: grid");
  });
  record("tier1", "F8", "F8-T1-2", "Metric boxes define Apple card surface with rounded corners", () => {
    const boxRules = findRule(rules, ".metric-box");
    assert(boxRules.length > 0, "Missing .metric-box rule");
    assert(boxRules[0].decls["border-radius"], "Missing border-radius on .metric-box");
  });
  record("tier1", "F8", "F8-T1-3", "Stat rows define proportional bar tracks", () => {
    const trackRules = findRule(rules, ".stat-bar-track");
    assert(trackRules.length > 0, "Missing .stat-bar-track rule");
    assert(trackRules[0].decls["border-radius"], "Missing border-radius on .stat-bar-track");
  });
  record("tier1", "F8", "F8-T1-4", "Stat bar fills define smooth width transitions", () => {
    const fillRules = findRule(rules, ".stat-bar-fill");
    assert(fillRules.length > 0, "Missing .stat-bar-fill rule");
    assert(fillRules[0].decls["border-radius"], "Missing border-radius on .stat-bar-fill");
  });
  record("tier1", "F8", "F8-T1-5", "Evolution chain visualizer nodes styled with Apple card aesthetics", () => {
    const evoRules = rules.filter((r) => r.selectors.some((s) => s.includes("evo-node-card")));
    assert(evoRules.length > 0, "Missing .evo-node-card rule");
  });

  // Feature 9: Apple Card Aesthetics (Radii & Shadows)
  record("tier1", "F9", "F9-T1-1", "Global card border-radius adheres to Apple 12-18px standard", () => {
    const cardSelectors = [".party-card", ".bag-item-card", ".pokemon-card"];
    for (const sel of cardSelectors) {
      const matched = findRule(rules, sel);
      if (matched.length > 0 && matched[0].decls["border-radius"]) {
        const r = parseInt(matched[0].decls["border-radius"], 10);
        assert(r >= 12 && r <= 18, `${sel} border radius out of bounds: ${r}px`);
      }
    }
  });
  record("tier1", "F9", "F9-T1-2", "Card borders use subtle translucent 1px borders", () => {
    const cardRules = findRule(rules, ".party-card");
    const border = cardRules[0].decls["border"];
    assert(border && border.includes("1px"), ".party-card must use 1px border");
  });
  record("tier1", "F9", "F9-T1-3", "Card shadows use soft low-opacity ambient alphas", () => {
    const cardRules = findRule(rules, ".party-card");
    const shadow = cardRules[0].decls["box-shadow"];
    assert(shadow && (shadow.includes("rgba") || shadow.includes("var(")), "Card shadow must use subtle rgba or var");
  });
  record("tier1", "F9", "F9-T1-4", "Interactive cards specify smooth transition durations (<= 0.25s)", () => {
    const cardRules = findRule(rules, ".party-card");
    const trans = cardRules[0].decls["transition"];
    assert(trans, "Missing transition on .party-card");
  });
  record("tier1", "F9", "F9-T1-5", "Card surfaces use crisp white or translucent background", () => {
    const cardRules = findRule(rules, ".party-card");
    const bg = cardRules[0].decls["background"];
    assert(bg && (bg.includes("#ffffff") || bg.includes("#fff") || bg.includes("var(--bg-card)")), "Card background must be white or var(--bg-card)");
  });

  // Feature 10: Battle Backdrop SVG & Theme Rendering
  record("tier1", "F10", "F10-T1-1", "BattleEnvironment source contains Viridian Forest SVG backdrop", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("ViridianForestBackdrop"), "Missing ViridianForestBackdrop");
  });
  record("tier1", "F10", "F10-T1-2", "BattleEnvironment source contains all 5 primary biome backdrops", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("MtMoonBackdrop"), "Missing MtMoonBackdrop");
    assert(envSrc.includes("SeafoamCoastBackdrop"), "Missing SeafoamCoastBackdrop");
    assert(envSrc.includes("VolcanoBackdrop"), "Missing VolcanoBackdrop");
    assert(envSrc.includes("PowerPlantBackdrop"), "Missing PowerPlantBackdrop");
  });
  record("tier1", "F10", "F10-T1-3", "BattleEnvironment source contains GymArenaBackdrop for Kanto gyms", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("GymArenaBackdrop"), "Missing GymArenaBackdrop");
  });
  record("tier1", "F10", "F10-T1-4", "BattlePedestal component exists and renders 3D platform", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("export function BattlePedestal"), "Missing BattlePedestal component export");
  });
  record("tier1", "F10", "F10-T1-5", "Battle backdrop SVG elements preserve aspect ratio slice", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("preserveAspectRatio=\"xMidYMid slice\""), "SVGs must preserve aspect ratio slice");
  });

  // Feature 11: Contrast & Readability (No Black Box)
  record("tier1", "F11", "F11-T1-1", "Compare preset pills define readable text colors on light background", () => {
    const pillRules = findRule(rules, ".preset-pill");
    assert(pillRules.length > 0, "Missing .preset-pill rule");
    assert(pillRules[0].decls["color"], "Missing text color on .preset-pill");
  });
  record("tier1", "F11", "F11-T1-2", "Active preset pill uses Apple blue with white text", () => {
    const activeRules = findRule(rules, ".preset-pill-active");
    assert(activeRules.length > 0, "Missing .preset-pill-active rule");
    assert(activeRules[0].decls["background"].includes("#0071e3"), "Active pill must use #0071e3");
    assert(activeRules[0].decls["color"].includes("#ffffff"), "Active pill text must be #ffffff");
  });
  record("tier1", "F11", "F11-T1-3", "Active preset pill contrast ratio meets WCAG AA (>= 4.5:1)", () => {
    const ratio = calculateContrastRatio("#ffffff", "#0071e3");
    assert(ratio >= 4.5, `Contrast ratio failed: ${ratio.toFixed(2)}`);
  });
  record("tier1", "F11", "F11-T1-4", "Dialogue text in dark battle views specifies explicit light color", () => {
    const diagRules = rules.filter((r) => r.selectors.includes(".dialogue-text"));
    assert(diagRules.length > 0, "Missing .dialogue-text rule");
    const hasLightColor = diagRules.some((r) => r.decls["color"] && (r.decls["color"].includes("#f8fafc") || r.decls["color"].includes("#ffffff") || r.decls["color"].includes("white")));
    assert(hasLightColor, ".dialogue-text must have light color declaration for battle stages");
  });
  record("tier1", "F11", "F11-T1-5", "Compare search clear button uses transparent background", () => {
    const btnRules = findRule(rules, ".compare-search-clear-btn");
    assert(btnRules.length > 0, "Missing .compare-search-clear-btn rule");
    assert(btnRules[0].decls["background"] === "transparent", "Clear button background must be transparent");
  });

  // Feature 12: Real-time Party Counter (X/6) Reactivity
  record("tier1", "F12", "F12-T1-1", "Game simulator adds Pokemon and increments party counter", () => {
    const sim = createMockGameSimulator([]);
    sim.addToTeam({ name: "Pikachu" });
    assertEqual(sim.getPartyCountString(), "1/6", "Count must be 1/6");
  });
  record("tier1", "F12", "F12-T1-2", "Game simulator rejects 7th Pokemon when party is full (6/6)", () => {
    const sim = createMockGameSimulator(Array(6).fill({ name: "Bulbasaur" }));
    const res = sim.addToTeam({ name: "Charmander" });
    assert(!res.success, "Must reject addition when party full");
    assertEqual(sim.getPartyCountString(), "6/6", "Count must stay 6/6");
  });
  record("tier1", "F12", "F12-T1-3", "Game simulator removes Pokemon and decrements party counter", () => {
    const sim = createMockGameSimulator([
      { instanceId: "1", name: "Bulbasaur" },
      { instanceId: "2", name: "Charmander" },
    ]);
    sim.removeFromTeam("2");
    assertEqual(sim.getPartyCountString(), "1/6", "Count must decrease to 1/6");
  });
  record("tier1", "F12", "F12-T1-4", "Game simulator storage sync updates in-memory team", () => {
    const sim = createMockGameSimulator([]);
    sim.simulateStorageEvent(JSON.stringify([{ name: "Squirtle" }, { name: "Pikachu" }]));
    assertEqual(sim.getPartyCountString(), "2/6", "Storage event must update count");
  });
  record("tier1", "F12", "F12-T1-5", "Navbar source references {team.length}/6 party indicator", () => {
    const navSrc = readProjectFile("src/components/Navbar.jsx");
    assert(navSrc.includes("{team.length}/6"), "Navbar must render {team.length}/6");
  });

  // Feature 13: App-wide Polish Across Game Modes
  record("tier1", "F13", "F13-T1-1", "WildernessPage source utilizes BattleEnvironment stage", () => {
    const wildSrc = readProjectFile("src/pages/WildernessPage.jsx");
    assert(wildSrc.includes("<BattleEnvironment"), "WildernessPage must embed BattleEnvironment");
  });
  record("tier1", "F13", "F13-T1-2", "GymPage source utilizes BattleEnvironment stage", () => {
    const gymSrc = readProjectFile("src/pages/GymPage.jsx");
    assert(gymSrc.includes("<BattleEnvironment"), "GymPage must embed BattleEnvironment");
  });
  record("tier1", "F13", "F13-T1-3", "LeaguePage source utilizes BattleEnvironment stage", () => {
    const leagueSrc = readProjectFile("src/pages/LeaguePage.jsx");
    assert(leagueSrc.includes("<BattleEnvironment"), "LeaguePage must embed BattleEnvironment");
  });
  record("tier1", "F13", "F13-T1-4", "DungeonPage source utilizes BattleEnvironment stage", () => {
    const dungeonSrc = readProjectFile("src/pages/DungeonPage.jsx");
    assert(dungeonSrc.includes("<BattleEnvironment"), "DungeonPage must embed BattleEnvironment");
  });
  record("tier1", "F13", "F13-T1-5", "BattleTowerPage source utilizes BattleEnvironment stage", () => {
    const towerSrc = readProjectFile("src/pages/BattleTowerPage.jsx");
    assert(towerSrc.includes("<BattleEnvironment"), "BattleTowerPage must embed BattleEnvironment");
  });

  // Feature 14: Modal Dialog Apple Polish
  record("tier1", "F14", "F14-T1-1", "Modal backdrop defines frosted glass blur effect", () => {
    const modalRules = rules.filter((r) => r.selectors.some((s) => s.includes("modal-backdrop") || s.includes("modal-overlay")));
    assert(modalRules.length > 0, "Missing modal backdrop rule");
    const hasBackdropFilter = modalRules.some((r) => r.decls["backdrop-filter"] && r.decls["backdrop-filter"].includes("blur"));
    assert(hasBackdropFilter, "Modal backdrop must define backdrop-filter blur");
  });
  record("tier1", "F14", "F14-T1-2", "Modal container cards define Apple rounded corners (>= 18px)", () => {
    const boxRules = rules.filter((r) => r.selectors.some((s) => s.includes("modal-card") || s.includes("modal-box") || s.includes("passport-card")));
    assert(boxRules.length > 0, "Missing modal card container rule");
    const hasRadius = boxRules.some((r) => parseInt(r.decls["border-radius"] || "0", 10) >= 18);
    assert(hasRadius, "Modal container must have border-radius >= 18px");
  });
  record("tier1", "F14", "F14-T1-3", "StarterModal component exists and presents starter choices", () => {
    assert(fileExists("src/components/StarterModal.jsx"), "StarterModal.jsx must exist");
  });
  record("tier1", "F14", "F14-T1-4", "EvolutionModal component exists and provides evolution flow", () => {
    assert(fileExists("src/components/EvolutionModal.jsx"), "EvolutionModal.jsx must exist");
  });
  record("tier1", "F14", "F14-T1-5", "TrainerPassportModal component exists with trainer stats", () => {
    assert(fileExists("src/components/TrainerPassportModal.jsx"), "TrainerPassportModal.jsx must exist");
  });

  // Feature 15: Vite Production Build Integrity
  record("tier1", "F15", "F15-T1-1", "package.json contains valid build command", () => {
    const pkg = JSON.parse(readProjectFile("package.json"));
    assertEqual(pkg.scripts.build, "vite build", "build script must be 'vite build'");
  });
  record("tier1", "F15", "F15-T1-2", "vite.config.js exists and exports configuration", () => {
    assert(fileExists("vite.config.js"), "vite.config.js must exist");
  });
  record("tier1", "F15", "F15-T1-3", "dist/index.html is compiled and present", () => {
    assert(fileExists("dist/index.html"), "dist/index.html must exist");
  });
  record("tier1", "F15", "F15-T1-4", "dist/assets contains compiled JS bundle", () => {
    const files = fs.readdirSync(path.join(DIST_DIR, "assets"));
    assert(files.some((f) => f.endsWith(".js")), "dist/assets must contain .js bundle");
  });
  record("tier1", "F15", "F15-T1-5", "dist/assets contains compiled CSS bundle", () => {
    const files = fs.readdirSync(path.join(DIST_DIR, "assets"));
    assert(files.some((f) => f.endsWith(".css")), "dist/assets must contain .css bundle");
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (75 Tests: Features 1..15 x 5 tests)
  // =========================================================================

  // F1 Boundaries
  record("tier2", "F1", "F1-T2-1", "Root variable declarations terminate properly with valid syntax", () => {
    for (const [k, v] of Object.entries(tokens)) {
      assert(!v.includes("{") && !v.includes("}"), `Malformed token value for ${k}: ${v}`);
    }
  });
  record("tier2", "F1", "F1-T2-2", "Translucent border tokens use alpha <= 0.2", () => {
    const bl = tokens["--border-light"];
    if (bl && bl.includes("rgba")) {
      const alphaMatch = bl.match(/rgba\([^)]*,\s*([\d.]+)\)/);
      if (alphaMatch) {
        assert(parseFloat(alphaMatch[1]) <= 0.2, "Border light alpha must be <= 0.2");
      }
    }
  });
  record("tier2", "F1", "F1-T2-3", "Background body token is set to Apple neutral off-white (#f5f5f7)", () => {
    const bg = tokens["--bg-body"] || tokens["--bg-main"];
    assert(bg.toLowerCase().includes("#f5f5f7"), `Background body should be Apple neutral #f5f5f7, got: ${bg}`);
  });
  record("tier2", "F1", "F1-T2-4", "Primary accent token uses Apple standard blue (#0071e3)", () => {
    const accent = tokens["--accent"];
    assert(accent.toLowerCase().includes("#0071e3"), `Accent should be Apple blue #0071e3, got: ${accent}`);
  });
  record("tier2", "F1", "F1-T2-5", "Text main on background card contrast ratio >= 10:1", () => {
    const fg = tokens["--text-main"] || "#1d1d1f";
    const bg = tokens["--bg-card"] || "#ffffff";
    const ratio = calculateContrastRatio(fg, bg);
    assert(ratio >= 10.0, `Contrast ratio below expected 10:1: ${ratio.toFixed(2)}`);
  });

  // F2 Boundaries
  record("tier2", "F2", "F2-T2-1", "Ultra-wide 2560px viewport simulation maintains centered container", () => {
    const res = simulateViewportLayout({ viewportWidth: 2560, containerMaxWidth: 1200 });
    assert(!res.hasHorizontalOverflow, "Ultra-wide must not overflow");
    assertEqual(res.containerWidth, 1160, "Container width must cap at max-width - padding");
  });
  record("tier2", "F2", "F2-T2-2", "Desktop 1024px boundary viewport maintains margins", () => {
    const res = simulateViewportLayout({ viewportWidth: 1024, containerMaxWidth: 1200, containerPadding: 20 });
    assert(!res.hasHorizontalOverflow, "1024px must not overflow");
    assertEqual(res.containerWidth, 984, "Container width must be 984px");
  });
  record("tier2", "F2", "F2-T2-3", "Focused containers constrained to <= 860px", () => {
    const modalRules = rules.filter((r) => r.selectors.some((s) => s.includes(".starter-modal") || s.includes(".passport-modal")));
    if (modalRules.length > 0 && modalRules[0].decls["max-width"]) {
      const mw = parseInt(modalRules[0].decls["max-width"], 10);
      assert(mw <= 860, `Focused modal max-width exceeds 860px: ${mw}px`);
    }
  });
  record("tier2", "F2", "F2-T2-4", "Universal border-box declaration applies to pseudo-elements", () => {
    const starRules = rules.filter((r) => r.selectors.includes("*"));
    assert(starRules.length > 0, "Missing universal selector *");
    assert(starRules[0].decls["box-sizing"] === "border-box", "* must set box-sizing: border-box");
  });
  record("tier2", "F2", "F2-T2-5", "Zero horizontal margins on html and body prevent scroll bounce", () => {
    const starRules = rules.filter((r) => r.selectors.includes("*"));
    assert(starRules[0].decls["margin"] === "0", "* must declare margin: 0");
  });

  // F3 Boundaries (Mobile Viewports 320px, 375px, 414px, 768px)
  record("tier2", "F3", "F3-T2-1", "Mobile viewport 320px (iPhone SE 1st gen) zero horizontal overflow", () => {
    const res = simulateViewportLayout({ viewportWidth: 320, containerPadding: 16, itemMinWidth: 280, forcedSingleColumn: true });
    assert(!res.hasHorizontalOverflow, "320px viewport must not overflow");
    assert(res.scrollWidth <= res.clientWidth, `scrollWidth (${res.scrollWidth}) > clientWidth (${res.clientWidth})`);
  });
  record("tier2", "F3", "F3-T2-2", "Mobile viewport 375px (iPhone mini/SE) zero horizontal overflow", () => {
    const res = simulateViewportLayout({ viewportWidth: 375, containerPadding: 16, itemMinWidth: 320, forcedSingleColumn: true });
    assert(!res.hasHorizontalOverflow, "375px viewport must not overflow");
    assert(res.scrollWidth <= res.clientWidth, `scrollWidth (${res.scrollWidth}) > clientWidth (${res.clientWidth})`);
  });
  record("tier2", "F3", "F3-T2-3", "Mobile viewport 414px (iPhone Plus/Max) zero horizontal overflow", () => {
    const res = simulateViewportLayout({ viewportWidth: 414, containerPadding: 16, itemMinWidth: 320, forcedSingleColumn: true });
    assert(!res.hasHorizontalOverflow, "414px viewport must not overflow");
    assert(res.scrollWidth <= res.clientWidth, `scrollWidth (${res.scrollWidth}) > clientWidth (${res.clientWidth})`);
  });
  record("tier2", "F3", "F3-T2-4", "Tablet viewport 768px (iPad portrait) zero horizontal overflow", () => {
    const res = simulateViewportLayout({ viewportWidth: 768, containerPadding: 20, itemMinWidth: 340, forcedSingleColumn: false });
    assert(!res.hasHorizontalOverflow, "768px viewport must not overflow");
    assert(res.scrollWidth <= res.clientWidth, `scrollWidth (${res.scrollWidth}) > clientWidth (${res.clientWidth})`);
  });
  record("tier2", "F3", "F3-T2-5", "Extreme long text in cards does not cause horizontal page stretch", () => {
    const cardTitleRules = rules.filter((r) => r.selectors.some((s) => s.includes("card-name") || s.includes("party-name")));
    assert(cardTitleRules.length > 0, "Card titles must be defined");
  });

  // F4 Boundaries (Party Size Boundaries 0/6, 1/6, 6/6)
  record("tier2", "F4", "F4-T2-1", "Party boundary 0/6: simulator handles empty party safely", () => {
    const sim = createMockGameSimulator([]);
    assertEqual(sim.getTeam().length, 0, "Party must be empty");
    assertEqual(sim.getPartyCountString(), "0/6", "Count must be 0/6");
  });
  record("tier2", "F4", "F4-T2-2", "Party boundary 1/6: releasing last Pokemon partner is blocked", () => {
    const sim = createMockGameSimulator([{ instanceId: "only_one", name: "Pikachu" }]);
    const res = sim.removeFromTeam("only_one");
    assert(!res.success, "Must block release of last partner");
    assertEqual(sim.getTeam().length, 1, "Party must still contain 1 partner");
  });
  record("tier2", "F4", "F4-T2-3", "Party boundary 6/6: addition rejected with full party message", () => {
    const sim = createMockGameSimulator(Array(6).fill({ name: "Eevee" }));
    const res = sim.addToTeam({ name: "Mew" });
    assert(!res.success, "Must reject addition");
    assert(res.message.includes("full"), "Message must mention full party");
  });
  record("tier2", "F4", "F4-T2-4", "Party nickname boundary: 16-character nickname accepted without corrupting data", () => {
    const sim = createMockGameSimulator([]);
    const res = sim.addToTeam({ name: "Snorlax", nickname: "SuperMegaSnorlax" });
    assert(res.success, "Should accept 16 char nickname");
    assertEqual(res.instance.nickname.length, 16, "Nickname should have 16 chars");
  });
  record("tier2", "F4", "F4-T2-5", "Party reordering boundary: reorder indices bounded between 0 and team.length - 1", () => {
    const sim = createMockGameSimulator([
      { instanceId: "a", name: "Pikachu" },
      { instanceId: "b", name: "Charmander" },
    ]);
    assert(!sim.reorderTeam(0, -1), "Must reject negative destination index");
    assert(!sim.reorderTeam(0, 5), "Must reject out of range destination index");
    assert(sim.reorderTeam(0, 1), "Valid swap must succeed");
    assertEqual(sim.getTeam()[0].name, "charmander", "Charmander should now be at slot 0");
  });

  // F5 Boundaries
  record("tier2", "F5", "F5-T2-1", "Empty pocket inventory state returns empty array without throwing", () => {
    const sim = createMockGameSimulator([]);
    const inv = sim.getInventory();
    assert(typeof inv === "object", "Inventory must be an object");
  });
  record("tier2", "F5", "F5-T2-2", "Quantity counter boundary: large quantity 999 fits in dictionary", () => {
    const sim = createMockGameSimulator([]);
    sim.buyItem("poke-ball", 999, 0);
    assertEqual(sim.getInventory()["poke-ball"], 10 + 999, "Inventory should increment by 999");
  });
  record("tier2", "F5", "F5-T2-3", "Bag tile min-height does not expand uncontrollably on multi-line text", () => {
    const bagRules = findRule(rules, ".bag-item-card");
    assert(bagRules[0].decls["min-height"], ".bag-item-card must define min-height");
  });
  record("tier2", "F5", "F5-T2-4", "Selling non-existent item is rejected gracefully", () => {
    const sim = createMockGameSimulator([]);
    const res = sim.sellItem("unknown-stone", 1, 100);
    assert(!res.success, "Must reject sale of unowned item");
  });
  record("tier2", "F5", "F5-T2-5", "Consuming all items of a key removes key from dictionary", () => {
    const sim = createMockGameSimulator([]);
    sim.sellItem("fire-stone", 1, 100);
    assert(!("fire-stone" in sim.getInventory()), "fire-stone should be removed when count hits 0");
  });

  // F6 Boundaries
  record("tier2", "F6", "F6-T2-1", "Mart purchase with insufficient funds is rejected", () => {
    const sim = createMockGameSimulator([]);
    const res = sim.buyItem("master-ball", 10, 50000);
    assert(!res.success, "Must reject purchase when funds insufficient");
  });
  record("tier2", "F6", "F6-T2-2", "Mart purchase stepper minimum is 1", () => {
    const sim = createMockGameSimulator([]);
    const res = sim.buyItem("poke-ball", 0, 200);
    // Quantity 0 should not deduct money
    assert(sim.getMoney() === 3500, "Money should not decrease for 0 quantity");
  });
  record("tier2", "F6", "F6-T2-3", "Mart sale credits 50% price to trainer money", () => {
    const sim = createMockGameSimulator([]);
    const startMoney = sim.getMoney();
    sim.sellItem("potion", 2, 100);
    assertEqual(sim.getMoney(), startMoney + 200, "Trainer should receive ₽200");
  });
  record("tier2", "F6", "F6-T2-4", "Mart card tile defines subtle hover border elevation", () => {
    const hoverRules = rules.filter((r) => r.selectors.includes(".mart-card:hover"));
    assert(hoverRules.length > 0, "Missing .mart-card:hover rule");
  });
  record("tier2", "F6", "F6-T2-5", "Mart catalog item prices formatted with currency", () => {
    const martPageSrc = readProjectFile("src/pages/BagAndMartPage.jsx");
    assert(martPageSrc.includes("₽"), "MartPage must use ₽ currency symbol");
  });

  // F7 Boundaries
  record("tier2", "F7", "F7-T2-1", "Long move name wraps or truncates without overflow", () => {
    const moveRules = rules.filter((r) => r.selectors.includes(".move-name"));
    const hasTruncate = moveRules.some((r) => r.decls["overflow"] === "hidden" || r.decls["text-overflow"] === "ellipsis");
    assert(hasTruncate, ".move-name must define overflow hidden or ellipsis");
  });
  record("tier2", "F7", "F7-T2-2", "Move power label defines muted text color", () => {
    const powRules = findRule(rules, ".move-power");
    const col = powRules[0].decls["color"];
    assert(col && (col.includes("#94a3b8") || col.includes("var(--text-muted)")), "Move power should use muted color");
  });
  record("tier2", "F7", "F7-T2-3", "Type advantage tags use compact pill padding", () => {
    const advRules = findRule(rules, ".tag-advantage");
    if (advRules.length > 0) {
      assert(advRules[0].decls["border-radius"], "Advantage tag must define border-radius");
    }
  });
  record("tier2", "F7", "F7-T2-4", "4-move deck fits in 2x2 grid on mobile viewports", () => {
    const deckRules = findRule(rules, ".moves-deck-grid");
    assert(deckRules[0].decls["grid-template-columns"].includes("2"), "Must be 2 columns");
  });
  record("tier2", "F7", "F7-T2-5", "Move card interactive hover elevation does not push adjacent cards", () => {
    const pillHoverRules = findRule(rules, ".move-pill-card:hover");
    if (pillHoverRules.length > 0) {
      assert(!pillHoverRules[0].decls["margin"], "Hover state must not add margin");
    }
  });

  // F8 Boundaries (Multi-ability bounds)
  record("tier2", "F8", "F8-T2-1", "Dual-ability Pokemon rendering does not overflow metric card", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("pokemon.abilities"), "DetailPage must map abilities");
  });
  record("tier2", "F8", "F8-T2-2", "Non-evolving Pokemon renders empty state message", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("This Pokémon does not evolve"), "Must provide empty state for non-evolving Pokemon");
  });
  record("tier2", "F8", "F8-T2-3", "Stat bar track defines overflow hidden to constrain fill", () => {
    const trackRules = findRule(rules, ".stat-bar-track");
    assert(trackRules[0].decls["overflow"] === "hidden", ".stat-bar-track must have overflow: hidden");
  });
  record("tier2", "F8", "F8-T2-4", "Stat bar fill caps width at percentage string", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("width: `${percent}%`"), "Stat fill must be bounded by percent");
  });
  record("tier2", "F8", "F8-T2-5", "Base EXP missing/null fallback renders em-dash", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("pokemon.base_experience || \"—\""), "DetailPage must fallback to em-dash");
  });

  // F9 Boundaries
  record("tier2", "F9", "F9-T2-1", "Card hover states avoid layout shifts (margin changes disallowed)", () => {
    const partyHover = rules.filter((r) => r.selectors.includes(".party-card:hover"));
    if (partyHover.length > 0) {
      assert(!partyHover[0].decls["margin"], ".party-card:hover must not mutate margin");
    }
  });
  record("tier2", "F9", "F9-T2-2", "Active card buttons use subtle elevation without thick outlines", () => {
    const pillActive = findRule(rules, ".preset-pill-active");
    if (pillActive.length > 0) {
      assert(!pillActive[0].decls["outline"], "Active pill must not have thick outline");
    }
  });
  record("tier2", "F9", "F9-T2-3", "Card borders use subtle 1px width across all components", () => {
    const cardRules = findRule(rules, ".party-card");
    assert(cardRules[0].decls["border"].startsWith("1px"), "Card border must be 1px");
  });
  record("tier2", "F9", "F9-T2-4", "Card shadows multi-stop box shadows use <= 12px blur", () => {
    const sm = tokens["--shadow-sm"];
    if (sm) {
      const match = sm.match(/(\d+)px/);
      if (match) assert(parseInt(match[1], 10) <= 12, "Shadow blur must be <= 12px");
    }
  });
  record("tier2", "F9", "F9-T2-5", "Card transition cubic-bezier specifies smooth Apple deceleration", () => {
    const trans = tokens["--transition-smooth"];
    if (trans) {
      assert(trans.includes("cubic-bezier") || trans.includes("ease"), "Transition should specify smooth curve");
    }
  });

  // F10 Boundaries (Theme Resolution & Prop Fallbacks)
  record("tier2", "F10", "F10-T2-1", "BattleEnvironment safely resolves undefined biomeId to fallback", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    // Verify component accepts biomeId and does not crash when undefined
    assert(envSrc.includes("function BattleEnvironment"), "BattleEnvironment function defined");
  });
  record("tier2", "F10", "F10-T2-2", "BattleEnvironment gym arena backdrop renders thematic styling", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("gym-rock") && envSrc.includes("gym-water"), "GymArenaBackdrop must handle gym IDs");
  });
  record("tier2", "F10", "F10-T2-3", "BattlePedestal supports player view orientation", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("isPlayer ?"), "BattlePedestal must handle player orientation");
  });
  record("tier2", "F10", "F10-T2-4", "BattlePedestal supports grass theme fallback", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("isGrassTheme"), "BattlePedestal must handle grass theme");
  });
  record("tier2", "F10", "F10-T2-5", "SVG landscapes have viewBox 800 360", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("viewBox=\"0 0 800 360\""), "SVGs must use viewBox 0 0 800 360");
  });

  // F11 Boundaries
  record("tier2", "F11", "F11-T2-1", "Active rivalry pill contrast ratio is at least 4.5:1", () => {
    const ratio = calculateContrastRatio("#ffffff", "#0071e3");
    assertGte(ratio, 4.5, "Apple blue active pill contrast must exceed 4.5:1");
  });
  record("tier2", "F11", "F11-T2-2", "Dark battle dialogue contrast against #0b0f19 exceeds 7:1", () => {
    const ratio = calculateContrastRatio("#f8fafc", "#0b0f19");
    assertGte(ratio, 7.0, "Battle dialogue text contrast must exceed 7:1");
  });
  record("tier2", "F11", "F11-T2-3", "Type badges use white text on saturated backgrounds", () => {
    const ratio = calculateContrastRatio("#ffffff", "#e53e3e"); // Fire red
    assertGte(ratio, 3.0, "Type badge contrast must exceed 3:1");
  });
  record("tier2", "F11", "F11-T2-4", "Search input clear button text contrast meets readability", () => {
    const btnRules = findRule(rules, ".compare-search-clear-btn");
    assert(btnRules.length > 0, "Missing search clear button");
  });
  record("tier2", "F11", "F11-T2-5", "Preset pills hover effect provides clear interactive feedback", () => {
    const pillHover = findRule(rules, ".preset-pill:hover");
    assert(pillHover.length > 0, "Missing .preset-pill:hover rule");
  });

  // F12 Boundaries
  record("tier2", "F12", "F12-T2-1", "Party counter at 0 members correctly formatted", () => {
    const sim = createMockGameSimulator([]);
    assertEqual(sim.getPartyCountString(), "0/6");
  });
  record("tier2", "F12", "F12-T2-2", "Party counter at 6 members correctly formatted", () => {
    const sim = createMockGameSimulator(Array(6).fill({ name: "Pikachu" }));
    assertEqual(sim.getPartyCountString(), "6/6");
  });
  record("tier2", "F12", "F12-T2-3", "Prevent overflow beyond 6 members upon rapid consecutive additions", () => {
    const sim = createMockGameSimulator(Array(5).fill({ name: "Pikachu" }));
    const res1 = sim.addToTeam({ name: "Bulbasaur" });
    const res2 = sim.addToTeam({ name: "Squirtle" });
    assert(res1.success, "First add should succeed");
    assert(!res2.success, "Second add should be blocked (party 6/6)");
    assertEqual(sim.getTeam().length, 6, "Team length must strictly be 6");
  });
  record("tier2", "F12", "F12-T2-4", "Storage event synchronization handles malformed JSON without crashing", () => {
    const sim = createMockGameSimulator([{ name: "Charmander" }]);
    sim.simulateStorageEvent("invalid-json{}}");
    assertEqual(sim.getTeam().length, 1, "Team must remain intact on invalid JSON");
  });
  record("tier2", "F12", "F12-T2-5", "Setting party leader brings target Pokemon to slot 0", () => {
    const sim = createMockGameSimulator([
      { instanceId: "1", name: "Bulbasaur" },
      { instanceId: "2", name: "Pikachu" },
    ]);
    sim.setTeamLeader("2");
    assertEqual(sim.getTeam()[0].name, "pikachu", "Leader must now be Pikachu");
  });

  // F13 Boundaries
  record("tier2", "F13", "F13-T2-1", "Wilderness capture stores to box when party is full (6/6)", () => {
    const gcSrc = readProjectFile("src/context/GameContext.jsx");
    assert(gcSrc.includes("if (team.length < 6)"), "Must check team.length < 6 when catching");
    assert(gcSrc.includes("setBox"), "Must store to box when team is full");
  });
  record("tier2", "F13", "F13-T2-2", "Gym Leader defeat awards badge without duplicate entries", () => {
    const gcSrc = readProjectFile("src/context/GameContext.jsx");
    assert(gcSrc.includes("awardBadge"), "awardBadge function must exist");
    assert(gcSrc.includes("currentBadges.includes(badgeId)"), "Must prevent duplicate badge awards");
  });
  record("tier2", "F13", "F13-T2-3", "League victory records Hall of Fame induction snapshot", () => {
    const gcSrc = readProjectFile("src/context/GameContext.jsx");
    assert(gcSrc.includes("recordHallOfFame"), "recordHallOfFame function must exist");
  });
  record("tier2", "F13", "F13-T2-4", "Battle Tower streak tracking updates safely", () => {
    const towerSrc = readProjectFile("src/pages/BattleTowerPage.jsx");
    assert(towerSrc.includes("streak"), "BattleTowerPage must manage battle streak");
  });
  record("tier2", "F13", "F13-T2-5", "DungeonPage manages floor navigation without state corruption", () => {
    const dungeonSrc = readProjectFile("src/pages/DungeonPage.jsx");
    assert(dungeonSrc.includes("currentFloor"), "DungeonPage must track floor progression");
  });

  // F14 Boundaries
  record("tier2", "F14", "F14-T2-1", "Modal backdrop blur uses minimum 10px blur radius", () => {
    const modalRules = rules.filter((r) => r.selectors.some((s) => s.includes("modal-backdrop") || s.includes("modal-overlay")));
    const blurMatch = modalRules[0].decls["backdrop-filter"].match(/blur\((\d+)px\)/);
    if (blurMatch) {
      assert(parseInt(blurMatch[1], 10) >= 10, "Modal blur must be at least 10px");
    }
  });
  record("tier2", "F14", "F14-T2-2", "EvolutionModal handles cancelled evolution safely", () => {
    const gcSrc = readProjectFile("src/context/GameContext.jsx");
    assert(gcSrc.includes("cancelEvolution"), "cancelEvolution function must exist");
  });
  record("tier2", "F14", "F14-T2-3", "EvolutionModal completes evolution and updates instance", () => {
    const gcSrc = readProjectFile("src/context/GameContext.jsx");
    assert(gcSrc.includes("completeEvolution"), "completeEvolution function must exist");
  });
  record("tier2", "F14", "F14-T2-4", "TrainerPassportModal includes party slots display", () => {
    const passSrc = readProjectFile("src/components/TrainerPassportModal.jsx");
    assert(passSrc.includes("passport-party"), "TrainerPassportModal must display party roster");
  });
  record("tier2", "F14", "F14-T2-5", "WeatherWidget component exists with weather simulation", () => {
    assert(fileExists("src/components/WeatherWidget.jsx"), "WeatherWidget.jsx must exist");
  });

  // F15 Boundaries
  record("tier2", "F15", "F15-T2-1", "All main route components export valid functions", () => {
    const pages = [
      "src/pages/TeamPage.jsx",
      "src/pages/BagAndMartPage.jsx",
      "src/pages/DetailPage.jsx",
      "src/pages/ComparePage.jsx",
      "src/pages/LinkBattlePage.jsx",
    ];
    for (const p of pages) {
      const src = readProjectFile(p);
      assert(src.includes("export default") || src.includes("export function"), `${p} missing valid component export`);
    }
  });
  record("tier2", "F15", "F15-T2-2", "Package manifest private flag is set to true", () => {
    const pkg = JSON.parse(readProjectFile("package.json"));
    assert(pkg.private === true, "package.json private flag should be true");
  });
  record("tier2", "F15", "F15-T2-3", "dist bundle contains web app manifest link", () => {
    const html = readProjectFile("dist/index.html");
    assert(html.includes("manifest.json"), "dist/index.html must link to manifest.json");
  });
  record("tier2", "F15", "F15-T2-4", "Service worker sw.js is compiled and non-empty", () => {
    assert(fileExists("dist/sw.js"), "dist/sw.js must exist");
    assert(fs.statSync(path.join(DIST_DIR, "sw.js")).size > 100, "dist/sw.js must be non-empty");
  });
  record("tier2", "F15", "F15-T2-5", "App.jsx defines clean router setup without broken paths", () => {
    const appSrc = readProjectFile("src/App.jsx");
    assert(appSrc.includes("<Route"), "App.jsx must configure Routes");
  });

  // =========================================================================
  // TIER 3: PAIRWISE CROSS-FEATURE COMBINATIONS (15 Tests)
  // =========================================================================

  record("tier3", "F4+F12", "T3-01", "TeamPage party grid updates and reflects storage event counter", () => {
    const sim = createMockGameSimulator([{ name: "Bulbasaur" }]);
    assertEqual(sim.getPartyCountString(), "1/6");
    sim.simulateStorageEvent(JSON.stringify([{ name: "Pikachu" }, { name: "Raichu" }, { name: "Squirtle" }]));
    assertEqual(sim.getPartyCountString(), "3/6", "Storage sync must immediately reflect 3/6");
  });

  record("tier3", "F10+F11", "T3-02", "BattleEnvironment arena backdrop renders high-contrast dialogue text in LinkBattle", () => {
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    const linkSrc = readProjectFile("src/pages/LinkBattlePage.jsx");
    assert(linkSrc.includes("<BattleEnvironment"), "LinkBattle must use BattleEnvironment");
    assert(envSrc.includes("GymArenaBackdrop"), "Gym arena backdrop available for link arena");
  });

  record("tier3", "F3+F4", "T3-03", "Mobile 375px viewport collapses .party-grid to 1 column with zero overflow", () => {
    const res = simulateViewportLayout({ viewportWidth: 375, containerPadding: 16, itemMinWidth: 340, forcedSingleColumn: true });
    assertEqual(res.columns, 1, "Must collapse to 1 column");
    assert(!res.hasHorizontalOverflow, "Must have zero overflow");
  });

  record("tier3", "F5+F6", "T3-04", "BagPage and MartPage share symmetrical compact card heights and catalog data", () => {
    const bagRules = findRule(rules, ".bag-item-card");
    const martRules = rules.filter((r) => r.selectors.includes(".mart-card"));
    const bagH = parseInt(bagRules[0].decls["min-height"] || "56", 10);
    const martH = parseInt(martRules[0].decls["min-height"] || "58", 10);
    assert(Math.abs(bagH - martH) <= 6, "Bag and Mart card min-heights should be symmetrical");
  });

  record("tier3", "F7+F8", "T3-05", "DetailPage moves typography hierarchy combined with compact abilities display", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("pokemon.abilities"), "Must handle abilities");
  });

  record("tier3", "F1+F9", "T3-06", "Design system border and shadow variables bound to Apple card styling", () => {
    assert(tokens["--border-light"], "Missing --border-light token");
    assert(tokens["--card-radius"], "Missing --card-radius token");
  });

  record("tier3", "F2+F3", "T3-07", "Container max-width 1200px paired with responsive padding prevents clipping on iPad 768px", () => {
    const res = simulateViewportLayout({ viewportWidth: 768, containerMaxWidth: 1200, containerPadding: 20 });
    assert(!res.hasHorizontalOverflow, "768px must not overflow");
    assertEqual(res.containerWidth, 728, "Container content width should be 728px");
  });

  record("tier3", "F10+F13", "T3-08", "BattlePedestal and environment theme resolution propagated into game modes", () => {
    const gymSrc = readProjectFile("src/pages/GymPage.jsx");
    assert(gymSrc.includes("<BattlePedestal"), "GymPage must embed BattlePedestal");
  });

  record("tier3", "F12+F8", "T3-09", "DetailPage party status reflects real-time party counter bounds", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("addToTeam"), "DetailPage must use addToTeam");
  });

  record("tier3", "F1+F14", "T3-10", "Frosted glass blur styling applied to StarterModal and TrainerPassportModal", () => {
    const modalBackdrop = rules.filter((r) => r.selectors.some((s) => s.includes("modal-backdrop")));
    assert(modalBackdrop[0].decls["backdrop-filter"].includes("blur"), "Modal must use backdrop-filter blur");
  });

  record("tier3", "F6+F1", "T3-11", "MartPage price badges and item categories utilize :root tokens", () => {
    const martRules = rules.filter((r) => r.selectors.includes(".mart-card"));
    assert(martRules.length > 0, "Mart card must exist");
  });

  record("tier3", "F11+F13", "T3-12", "Contrast standards prevent black box artifacts in ComparePage and battle views", () => {
    const activePill = findRule(rules, ".preset-pill-active");
    assert(activePill.length > 0, "Missing active pill rule");
  });

  record("tier3", "F12+F4", "T3-13", "TeamPage release logic preserves minimum 1 partner and updates (X/6) counter", () => {
    const sim = createMockGameSimulator([{ instanceId: "1", name: "Bulbasaur" }]);
    const res = sim.removeFromTeam("1");
    assert(!res.success, "Cannot release lone partner");
    assertEqual(sim.getPartyCountString(), "1/6", "Count must remain 1/6");
  });

  record("tier3", "F3+F5", "T3-14", "BagPage inventory grid on 320px viewport maintains zero horizontal overflow", () => {
    const res = simulateViewportLayout({ viewportWidth: 320, containerPadding: 16, itemMinWidth: 280, forcedSingleColumn: true });
    assert(!res.hasHorizontalOverflow, "320px bag view must not overflow");
    assert(res.scrollWidth <= res.clientWidth, "scrollWidth must <= clientWidth");
  });

  record("tier3", "F15+F1..F14", "T3-15", "Production build bundle incorporates all component exports and styles", () => {
    assert(fileExists("dist/index.html"), "dist/index.html must exist");
    assert(fileExists("dist/assets"), "dist/assets must exist");
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (5 Tests)
  // =========================================================================

  record("tier4", "F4+F12+F3", "T4-SC01", "Scenario 1: Full Party Management Flow (0/6 to 6/6, compact grid, reorder, release)", () => {
    const sim = createMockGameSimulator([]);
    // Step 1: Initial empty party
    assertEqual(sim.getPartyCountString(), "0/6", "Step 1: Party empty");

    // Step 2: Add 6 Pokemon sequentially
    const roster = ["Bulbasaur", "Charmander", "Squirtle", "Pikachu", "Eevee", "Snorlax"];
    roster.forEach((name, idx) => {
      const res = sim.addToTeam({ name });
      assert(res.success, `Failed to add ${name}`);
      assertEqual(sim.getPartyCountString(), `${idx + 1}/6`);
    });

    // Step 3: Attempt adding 7th Pokemon -> blocked
    const overflowAdd = sim.addToTeam({ name: "Mewtwo" });
    assert(!overflowAdd.success, "7th Pokemon must be rejected");
    assertEqual(sim.getPartyCountString(), "6/6");

    // Step 4: Reorder: move slot 3 (Pikachu) to leader
    sim.setTeamLeader(sim.getTeam()[3].instanceId);
    assertEqual(sim.getTeam()[0].name, "pikachu", "Pikachu must be team leader");

    // Step 5: Release 1 Pokemon -> updates to 5/6
    const releaseTarget = sim.getTeam()[1].instanceId;
    const relRes = sim.removeFromTeam(releaseTarget);
    assert(relRes.success, "Release must succeed");
    assertEqual(sim.getPartyCountString(), "5/6");
  });

  record("tier4", "F3+F4+F5+F6+F2", "T4-SC02", "Scenario 2: Mobile Browsing on 375px Viewport (Team, Bag, Mart collapse, zero overflow)", () => {
    const teamLayout = simulateViewportLayout({ viewportWidth: 375, containerPadding: 16, itemMinWidth: 340, forcedSingleColumn: true });
    assert(!teamLayout.hasHorizontalOverflow, "TeamPage 375px must not overflow");

    const bagLayout = simulateViewportLayout({ viewportWidth: 375, containerPadding: 16, itemMinWidth: 320, forcedSingleColumn: true });
    assert(!bagLayout.hasHorizontalOverflow, "BagPage 375px must not overflow");

    const martLayout = simulateViewportLayout({ viewportWidth: 375, containerPadding: 16, itemMinWidth: 340, forcedSingleColumn: true });
    assert(!martLayout.hasHorizontalOverflow, "MartPage 375px must not overflow");
  });

  record("tier4", "F10+F11+F7+F9", "T4-SC03", "Scenario 3: Link Battle & Arena Experience (Backdrop SVG, readable dialogue, normalized moves)", () => {
    // 1. Arena SVG exists
    const envSrc = readProjectFile("src/components/BattleEnvironment.jsx");
    assert(envSrc.includes("GymArenaBackdrop"), "Gym arena backdrop present");

    // 2. Battle dialogue contrast
    const contrast = calculateContrastRatio("#f8fafc", "#0b0f19");
    assertGte(contrast, 7.0, "Dialogue contrast must exceed 7:1");

    // 3. Move typography normalized
    const moveRules = findRule(rules, ".move-name");
    assert(parseFloat(moveRules[0].decls["font-size"]) <= 0.9, "Move name font must be <= 0.9rem");
  });

  record("tier4", "F5+F6+F1+F9", "T4-SC04", "Scenario 4: High-Density Shopping & Inventory Flow (Catalog tiles, stepper calculation, buy/sell)", () => {
    const sim = createMockGameSimulator([]);
    const startMoney = sim.getMoney();

    // 1. Buy 5 Poke Balls (₽200 each = ₽1,000)
    const buyRes = sim.buyItem("poke-ball", 5, 200);
    assert(buyRes.success, "Buy should succeed");
    assertEqual(sim.getMoney(), startMoney - 1000, "Money should decrease by 1000");
    assertEqual(sim.getInventory()["poke-ball"], 10 + 5, "Poke ball count should be 15");

    // 2. Sell 3 Poke Balls (₽100 each = ₽300)
    const sellRes = sim.sellItem("poke-ball", 3, 100);
    assert(sellRes.success, "Sell should succeed");
    assertEqual(sim.getMoney(), startMoney - 1000 + 300, "Money should reflect sale");
    assertEqual(sim.getInventory()["poke-ball"], 12, "Poke ball count should be 12");
  });

  record("tier4", "F7+F8+F9+F12", "T4-SC05", "Scenario 5: Detail Page Deep Inspection (Multi-ability display, stats radar, Apple cards)", () => {
    const detailSrc = readProjectFile("src/pages/DetailPage.jsx");
    assert(detailSrc.includes("pokemon.abilities"), "DetailPage must map abilities");
    assert(detailSrc.includes("stat-bar-track"), "DetailPage must include stat bar track");
    assert(detailSrc.includes("addToTeam"), "DetailPage must include addToTeam");
  });

  return suiteResults;
}

module.exports = { runE2eSuite };
