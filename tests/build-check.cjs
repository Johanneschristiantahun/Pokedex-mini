/**
 * PokéDex Mini E2E Test Suite - Build & Dist Integrity Checker
 * tests/build-check.cjs
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");
const SRC_DIR = path.join(PROJECT_ROOT, "src");

function runBuildChecks() {
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

  // 1. package.json build script check
  test("package.json has valid build and dev scripts", () => {
    const pkgPath = path.join(PROJECT_ROOT, "package.json");
    if (!fs.existsSync(pkgPath)) throw new Error("package.json missing");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (!pkg.scripts || !pkg.scripts.build) {
      throw new Error("Missing 'build' script in package.json");
    }
    if (!pkg.scripts.dev) {
      throw new Error("Missing 'dev' script in package.json");
    }
  });

  // 2. vite.config.js existence and syntax
  test("vite.config.js exists and has valid configuration", () => {
    const vitePath = path.join(PROJECT_ROOT, "vite.config.js");
    if (!fs.existsSync(vitePath)) throw new Error("vite.config.js missing");
    const content = fs.readFileSync(vitePath, "utf8");
    if (!content.includes("defineConfig") && !content.includes("export default")) {
      throw new Error("vite.config.js missing default export or defineConfig");
    }
  });

  // 3. dist/ directory structure
  test("dist/ directory contains valid build output", () => {
    if (!fs.existsSync(DIST_DIR)) {
      throw new Error("dist/ directory missing; run npm run build first");
    }
    const htmlPath = path.join(DIST_DIR, "index.html");
    if (!fs.existsSync(htmlPath)) throw new Error("dist/index.html missing");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");
    if (!htmlContent.includes("<div id=\"root\">")) {
      throw new Error("dist/index.html missing root mounting element");
    }
  });

  // 4. dist/assets bundle existence & size
  test("dist/assets contains compiled JS and CSS bundles", () => {
    const assetsDir = path.join(DIST_DIR, "assets");
    if (!fs.existsSync(assetsDir)) throw new Error("dist/assets missing");
    const files = fs.readdirSync(assetsDir);
    const jsBundles = files.filter((f) => f.endsWith(".js"));
    const cssBundles = files.filter((f) => f.endsWith(".css"));

    if (jsBundles.length === 0) throw new Error("No .js bundle in dist/assets");
    if (cssBundles.length === 0) throw new Error("No .css bundle in dist/assets");

    const jsSize = fs.statSync(path.join(assetsDir, jsBundles[0])).size;
    const cssSize = fs.statSync(path.join(assetsDir, cssBundles[0])).size;

    if (jsSize < 50000) throw new Error(`JS bundle unexpectedly small: ${jsSize} bytes`);
    if (cssSize < 10000) throw new Error(`CSS bundle unexpectedly small: ${cssSize} bytes`);
  });

  // 5. PWA & Static Assets in dist
  test("dist contains manifest.json, favicon.svg, and icons.svg", () => {
    const requiredFiles = ["favicon.svg", "icons.svg", "manifest.json"];
    for (const f of requiredFiles) {
      const p = path.join(DIST_DIR, f);
      if (!fs.existsSync(p)) throw new Error(`dist/${f} is missing`);
      if (fs.statSync(p).size === 0) throw new Error(`dist/${f} is 0 bytes`);
    }
  });

  // 6. Source directory syntax validity scan
  test("All JavaScript files in src/ have valid syntax", () => {
    function walk(dir, list = []) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          walk(full, list);
        } else if (file.endsWith(".js")) {
          list.push(full);
        }
      }
      return list;
    }

    const jsFiles = walk(SRC_DIR);
    for (const f of jsFiles) {
      const content = fs.readFileSync(f, "utf8");
      // Strip import/export statements for vm syntax parsing
      const scriptCode = content
        .replace(/import\s+[^;]+;/g, "// import")
        .replace(/export\s+default\s+/g, "const _default = ")
        .replace(/export\s+(async\s+)?(function|const|let|var|class)/g, "$1$2")
        .replace(/export\s*\{[^}]*\};?/g, "// export");
      try {
        new vm.Script(scriptCode);
      } catch (err) {
        const rel = path.relative(PROJECT_ROOT, f);
        throw new Error(`Syntax error in ${rel}: ${err.message}`);
      }
    }
  });

  // 7. Monolithic CSS file non-empty and well-formed
  test("src/index.css is present and well-formed", () => {
    const cssPath = path.join(SRC_DIR, "index.css");
    if (!fs.existsSync(cssPath)) throw new Error("src/index.css missing");
    const stat = fs.statSync(cssPath);
    if (stat.size < 50000) {
      throw new Error(`src/index.css unexpectedly small: ${stat.size} bytes`);
    }
  });

  return results;
}

// Standalone execution support
if (require.main === module) {
  console.log("=== PokéDex Mini: Build & Dist Integrity Checks ===");
  const results = runBuildChecks();
  for (const t of results.tests) {
    if (t.status === "PASS") {
      console.log(`  \x1b[32m✔\x1b[0m ${t.name}`);
    } else {
      console.log(`  \x1b[31m✖\x1b[0m ${t.name} -> ${t.error}`);
    }
  }
  console.log(`\nSummary: ${results.passed}/${results.total} passed (${results.failed} failed)`);
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runBuildChecks };
