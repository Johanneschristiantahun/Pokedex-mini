#!/usr/bin/env node
/**
 * PokéDex Mini - Automated E2E Test Suite Runner
 * tests/run-e2e.cjs
 *
 * Usage:
 *   node tests/run-e2e.cjs
 *   node tests/run-e2e.cjs --verbose
 *   node tests/run-e2e.cjs --tier=1
 *   node tests/run-e2e.cjs --feature=F4
 *   node tests/run-e2e.cjs --json
 */

const { runE2eSuite } = require("./e2e-runner.cjs");
const { runBuildChecks } = require("./build-check.cjs");

// ANSI color constants
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";

function main() {
  const args = process.argv.slice(2);
  const isVerbose = args.includes("--verbose") || args.includes("-v");
  const isJson = args.includes("--json");
  const tierFilter = (args.find((a) => a.startsWith("--tier=")) || "").replace("--tier=", "");
  const featureFilter = (args.find((a) => a.startsWith("--feature=")) || "").replace("--feature=", "");

  const startTime = Date.now();

  // Run build checks
  const buildResults = runBuildChecks();

  // Run E2E suite
  const suiteResults = runE2eSuite({ isVerbose });

  const durationMs = Date.now() - startTime;

  if (isJson) {
    console.log(JSON.stringify({ build: buildResults, suite: suiteResults, durationMs }, null, 2));
    process.exit(buildResults.failed + suiteResults.failed > 0 ? 1 : 0);
  }

  // CLI Header
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  PokéDex Mini UI/UX Refactor: Automated E2E Test Suite${RESET}`);
  console.log(`${DIM}  Requirements: ORIGINAL_REQUEST.md & TEST_INFRA.md | Apple Product Design${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  // Section 1: Build & Dist Verification
  console.log(`${BOLD}1. Build & Bundle Integrity (${buildResults.passed}/${buildResults.total})${RESET}`);
  for (const t of buildResults.tests) {
    if (t.status === "PASS") {
      if (isVerbose) console.log(`   ${GREEN}✔${RESET} ${DIM}${t.name}${RESET}`);
    } else {
      console.log(`   ${RED}✖${RESET} ${BOLD}${t.name}${RESET}\n     ${RED}Error: ${t.error}${RESET}`);
    }
  }
  if (!isVerbose && buildResults.failed === 0) {
    console.log(`   ${GREEN}✔${RESET} All ${buildResults.total} build integrity assertions passed.`);
  }

  // Section 2: E2E Tiers Breakdown
  console.log(`\n${BOLD}2. E2E Requirement Tiers Breakdown${RESET}`);

  const tierMap = [
    { key: "tier1", label: "Tier 1: Functional Feature Coverage (5 per feature)", target: 75 },
    { key: "tier2", label: "Tier 2: Boundary & Corner Cases (5 per feature)", target: 75 },
    { key: "tier3", label: "Tier 3: Pairwise Cross-Feature Combinations", target: 15 },
    { key: "tier4", label: "Tier 4: Real-World Application Scenarios", target: 5 },
  ];

  for (const t of tierMap) {
    const tierData = suiteResults.tiers[t.key];
    const passRatio = tierData.total > 0 ? (tierData.passed / tierData.total) * 100 : 0;
    const color = tierData.failed === 0 ? GREEN : RED;
    const badge = tierData.failed === 0 ? "PASSED" : "FAILED";

    console.log(`   ${BOLD}${t.label}${RESET}`);
    console.log(`   └─ Status: ${color}${BOLD}[${badge}]${RESET} ${tierData.passed}/${tierData.total} passed (${passRatio.toFixed(1)}%)`);

    if (isVerbose || tierData.failed > 0) {
      for (const item of tierData.tests) {
        if (item.status === "PASS") {
          if (isVerbose) console.log(`      ${GREEN}✔${RESET} ${DIM}[${item.id}] ${item.description}${RESET}`);
        } else {
          console.log(`      ${RED}✖${RESET} ${BOLD}[${item.id}] ${item.description}${RESET}\n        ${RED}Error: ${item.error}${RESET}`);
        }
      }
    }
  }

  // Section 3: Feature Coverage Matrix
  console.log(`\n${BOLD}3. Feature Inventory Coverage Matrix (F1 to F15)${RESET}`);
  console.log(`   ${DIM}Feature | Total | Passed | Failed | Status${RESET}`);
  console.log(`   ${DIM}--------+-------+--------+--------+-------${RESET}`);

  for (let i = 1; i <= 15; i++) {
    const fKey = `F${i}`;
    const fData = suiteResults.features[fKey] || { total: 0, passed: 0, failed: 0 };
    const stCol = fData.failed === 0 ? GREEN : RED;
    const stText = fData.failed === 0 ? "OK" : "DEFECT";
    const fPad = fKey.padEnd(7);
    const totPad = String(fData.total).padStart(5);
    const passPad = String(fData.passed).padStart(6);
    const failPad = String(fData.failed).padStart(6);
    console.log(`   ${fPad} | ${totPad} | ${passPad} | ${failPad} | ${stCol}${stText}${RESET}`);
  }

  // Section 4: Final Summary
  const grandTotal = buildResults.total + suiteResults.total;
  const grandPassed = buildResults.passed + suiteResults.passed;
  const grandFailed = buildResults.failed + suiteResults.failed;
  const overallRatio = (grandPassed / grandTotal) * 100;

  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}  FINAL SUITE SUMMARY${RESET}`);
  console.log(`  Total Assertions Tested : ${BOLD}${grandTotal}${RESET} (Threshold >= 170)`);
  console.log(`  Passed Assertions       : ${GREEN}${BOLD}${grandPassed}${RESET}`);
  console.log(`  Failed Assertions       : ${grandFailed === 0 ? GREEN : RED}${BOLD}${grandFailed}${RESET}`);
  console.log(`  Pass Rate               : ${grandFailed === 0 ? GREEN : YELLOW}${BOLD}${overallRatio.toFixed(1)}%${RESET}`);
  console.log(`  Duration                : ${durationMs}ms`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  if (grandFailed === 0) {
    console.log(`${GREEN}${BOLD}✔ ALL TEST SUITE REQUIREMENTS SATISFIED (Exit Code: 0)${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}✖ TEST FAILURES DETECTED (Exit Code: 1)${RESET}\n`);
    process.exit(1);
  }
}

main();
