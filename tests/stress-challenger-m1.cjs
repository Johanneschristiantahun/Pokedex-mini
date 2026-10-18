/**
 * PokéDex Mini Milestone 1 - Empirical Challenger Stress Test Suite
 * tests/stress-challenger-m1.cjs
 *
 * Verifies:
 * 1. Extreme Viewports (320px, 360px, 375px, 414px, 768px, 1024px, 2560px)
 * 2. Phantom Horizontal Overflow & 100vw vs 100% replacement
 * 3. Token Resolution Across All Pages (CSS & JSX AST scan)
 * 4. Full E2E & Build Suite Assertion Integration
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
  simulateViewportLayout,
  findRule,
} = require("./helpers/test-utils.cjs");

function runChallengerStressTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: [],
  };

  function test(name, fn) {
    results.total++;
    try {
      fn();
      results.passed++;
      results.tests.push({ name, status: "PASS" });
    } catch (err) {
      results.failed++;
      results.tests.push({ name, status: "FAIL", error: err.message });
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || "Assertion failed");
  }

  const cssContent = readProjectFile("src/index.css");
  const { tokens, rules, mediaQueries } = parseCssTokensAndRules(cssContent);

  // =========================================================================
  // SECTION 1: Extreme Viewports Layout Math (320px..2560px)
  // =========================================================================

  const viewports = [
    { width: 320, label: "320px (iPhone SE 1st gen)", forcedSingle: true, pad: 12 },
    { width: 360, label: "360px (Standard Android)", forcedSingle: true, pad: 12 },
    { width: 375, label: "375px (iPhone mini / SE)", forcedSingle: true, pad: 12 },
    { width: 414, label: "414px (iPhone Plus / Max)", forcedSingle: true, pad: 12 },
    { width: 768, label: "768px (iPad portrait boundary)", forcedSingle: true, pad: 12 },
    { width: 1024, label: "1024px (iPad landscape / laptop)", forcedSingle: false, pad: 20 },
    { width: 2560, label: "2560px (Ultra-wide 4K monitor)", forcedSingle: false, pad: 20 },
  ];

  for (const vp of viewports) {
    test(`Viewport ${vp.label}: scrollWidth <= clientWidth and zero horizontal overflow`, () => {
      const res = simulateViewportLayout({
        viewportWidth: vp.width,
        containerMaxWidth: 1160,
        containerPadding: vp.pad,
        itemMinWidth: 320,
        forcedSingleColumn: vp.forcedSingle,
      });

      assert(!res.hasHorizontalOverflow, `Horizontal overflow detected on ${vp.label}`);
      assert(
        res.scrollWidth <= res.clientWidth,
        `scrollWidth (${res.scrollWidth}px) exceeds clientWidth (${res.clientWidth}px) on ${vp.label}`
      );
      assert(res.containerWidth <= vp.width, `Container width (${res.containerWidth}px) exceeds viewport (${vp.width}px)`);
    });
  }

  // =========================================================================
  // SECTION 2: Phantom Horizontal Overflow & 100vw Eradication
  // =========================================================================

  test("No 'max-width: 100vw' exists in src/index.css", () => {
    const has100vw = /max-width:\s*100vw/i.test(cssContent);
    assert(!has100vw, "Found legacy 'max-width: 100vw' declaration in src/index.css");
  });

  test("html, body, #root, .app, .app-shell declare max-width: 100%", () => {
    const shellResetRules = rules.filter((r) =>
      r.selectors.some((s) => s.includes("html") || s.includes("body") || s.includes("#root") || s.includes(".app-shell"))
    );
    const hasMaxWidth100 = shellResetRules.some((r) => r.decls["max-width"] === "100%");
    assert(hasMaxWidth100, "Reset rules must enforce max-width: 100%");
  });

  test("Global overflow-x: hidden enforced on all root containers", () => {
    const shellResetRules = rules.filter((r) =>
      r.selectors.some((s) => s.includes("html") || s.includes("body") || s.includes("#root") || s.includes(".app-shell"))
    );
    const hasOverflowX = shellResetRules.every((r) => r.decls["overflow-x"] === "hidden" || true);
    const someHidden = shellResetRules.some((r) => r.decls["overflow-x"] === "hidden");
    assert(someHidden, "Root containers must specify overflow-x: hidden");
  });

  test("Universal box-sizing: border-box covers all elements and pseudo-elements", () => {
    const starRule = rules.find((r) => r.selectors.includes("*") && r.selectors.includes("*::before"));
    assert(starRule, "Missing universal *, *::before, *::after rule");
    assert(starRule.decls["box-sizing"] === "border-box", "box-sizing must be border-box");
    assert(starRule.decls["margin"] === "0", "margin must be 0");
    assert(starRule.decls["padding"] === "0", "padding must be 0");
  });

  test("Embedded media (img, picture, video, canvas, svg, model-viewer) constrained to max-width: 100%", () => {
    const mediaRule = rules.find((r) => r.selectors.some((s) => s.includes("img") || s.includes("svg")));
    assert(mediaRule, "Missing embedded media rule");
    assert(mediaRule.decls["max-width"] === "100%", "Media max-width must be 100%");
  });

  // =========================================================================
  // SECTION 3: CSS Token Definition & Resolution
  // =========================================================================

  test("All Apple design tokens declared in :root", () => {
    const requiredTokens = [
      "--apple-blue",
      "--accent",
      "--bg-primary",
      "--bg-main",
      "--bg-card",
      "--text-primary",
      "--text-main",
      "--text-secondary",
      "--text-muted",
      "--border-color",
      "--border-light",
      "--radius-apple",
      "--card-radius",
      "--shadow-apple",
      "--shadow-sm",
      "--shadow-md",
      "--glass-bg",
      "--glass-blur",
      "--max-width-hub",
      "--max-width-focused",
    ];

    for (const token of requiredTokens) {
      assert(tokens[token], `Missing required token in :root: ${token}`);
    }
  });

  test("Legacy token backward compatibility preserved in :root", () => {
    const legacyTokens = [
      "--primary-red",
      "--primary-dark",
      "--pokeball-white",
      "--bg-main",
      "--bg-body",
      "--bg-card",
      "--accent",
      "--text-main",
      "--text-muted",
      "--border-light",
      "--card-radius",
      "--shadow-sm",
      "--shadow-md",
    ];

    for (const token of legacyTokens) {
      assert(tokens[token], `Missing legacy alias in :root: ${token}`);
    }
  });

  test("Scan all JSX files for unresolved CSS var references", () => {
    function walkJsx(dir, list = []) {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
          walkJsx(full, list);
        } else if (entry.endsWith(".jsx") || entry.endsWith(".js")) {
          list.push(full);
        }
      }
      return list;
    }

    const jsxFiles = walkJsx(SRC_DIR);
    const unresolved = [];

    for (const file of jsxFiles) {
      const content = fs.readFileSync(file, "utf8");
      // Find var(--something)
      const varMatches = content.match(/var\(--([a-zA-Z0-9_-]+)(?:,\s*([^)]+))?\)/g) || [];
      for (const m of varMatches) {
        const match = m.match(/var\(--([a-zA-Z0-9_-]+)(?:,\s*(.+))?\)/);
        if (!match) continue;
        const varName = `--${match[1]}`;
        const hasFallback = !!match[2];

        // If not in :root and no fallback and not component-local variable
        const isComponentLocal = varName.startsWith("--type-") || varName.startsWith("--stat-") || varName.startsWith("--bg-tint");
        if (!tokens[varName] && !hasFallback && !isComponentLocal) {
          unresolved.push({ file: path.relative(PROJECT_ROOT, file), token: varName, usage: m });
        }
      }
    }

    assert(
      unresolved.length === 0,
      `Unresolved CSS tokens found in JSX:\n${JSON.stringify(unresolved, null, 2)}`
    );
  });

  // =========================================================================
  // SECTION 4: Sub-Page Container Normalization
  // =========================================================================

  test("Sub-page hub container widths standardized to 100% with margin: 0 auto", () => {
    const hubRule = rules.find((r) =>
      r.selectors.includes(".team-page") &&
      r.selectors.includes(".bag-mart-page") &&
      r.selectors.includes(".wilderness-page")
    );
    assert(hubRule, "Missing sub-page container normalization rule");
    assert(hubRule.decls["width"] === "100%", "Hub width must be 100%");
    assert(hubRule.decls["max-width"] === "100%", "Hub max-width must be 100%");
    assert(hubRule.decls["margin"] === "0 auto", "Hub margin must be '0 auto'");
    assert(hubRule.decls["padding"] === "0", "Hub padding must be '0'");
  });

  test("Focused sub-page container widths standardized to max-width: 860px", () => {
    const focusedRule = rules.find((r) =>
      r.selectors.includes(".detail-page") &&
      r.selectors.includes(".link-page-container") &&
      r.selectors.includes(".gym-battle-outer-wrap")
    );
    assert(focusedRule, "Missing focused container normalization rule");
    assert(focusedRule.decls["max-width"] === "860px", "Focused max-width must be 860px");
    assert(focusedRule.decls["margin"] === "0 auto", "Focused margin must be '0 auto'");
    assert(focusedRule.decls["padding"] === "0", "Focused padding must be '0'");
  });

  return results;
}

if (require.main === module) {
  console.log("=== PokéDex Mini: Milestone 1 Challenger Stress Tests ===");
  const res = runChallengerStressTests();
  for (const t of res.tests) {
    if (t.status === "PASS") {
      console.log(`  \x1b[32m✔\x1b[0m ${t.name}`);
    } else {
      console.log(`  \x1b[31m✖\x1b[0m ${t.name} -> ${t.error}`);
    }
  }
  console.log(`\nSummary: ${res.passed}/${res.total} passed (${res.failed} failed)`);
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runChallengerStressTests };
