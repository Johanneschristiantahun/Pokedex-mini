/**
 * PokéDex Mini E2E Test Suite - Shared Utilities & Test Helpers
 * tests/helpers/test-utils.cjs
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

// ========================================================
// 1. File Inspection & Source Retrieval
// ========================================================

function readProjectFile(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

function fileExists(relPath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relPath));
}

// ========================================================
// 2. CSS Parser & AST-like Analyzer
// ========================================================

function parseCssTokensAndRules(cssText) {
  const tokens = {};
  const rules = [];
  const mediaQueries = [];

  // 1. Extract :root variables
  const rootMatches = cssText.match(/:root\s*\{([^}]+)\}/g) || [];
  rootMatches.forEach((rootBlock) => {
    const varMatches = rootBlock.match(/--[\w-]+:\s*[^;]+;/g) || [];
    varMatches.forEach((decl) => {
      const parts = decl.split(":");
      const varName = parts[0].trim();
      const varVal = parts.slice(1).join(":").replace(/;$/, "").trim();
      tokens[varName] = varVal;
    });
  });

  const commentStrippedCss = cssText.replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Extract media queries
  const mediaRegex = /@media\s*([^{]+)\{([\s\S]*?\}\s*)\}/g;
  let mediaMatch;
  while ((mediaMatch = mediaRegex.exec(commentStrippedCss)) !== null) {
    const query = mediaMatch[1].trim();
    const mediaBody = mediaMatch[2];
    const innerRules = [];

    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let rMatch;
    while ((rMatch = ruleRegex.exec(mediaBody)) !== null) {
      const selectors = rMatch[1].trim().split(",").map((s) => s.trim());
      const decls = parseDeclarations(rMatch[2]);
      innerRules.push({ selectors, decls, raw: rMatch[0] });
    }

    mediaQueries.push({ query, rules: innerRules });
  }

  // 3. Extract top-level rules (stripping media queries first)
  const strippedCss = commentStrippedCss.replace(/@media\s*[^{]+\{[\s\S]*?\}\s*\}/g, "");
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let rMatch;
  while ((rMatch = ruleRegex.exec(strippedCss)) !== null) {
    const rawSel = rMatch[1].trim();
    if (rawSel.startsWith("@") || rawSel.startsWith("/*")) continue;
    const selectors = rawSel.split(",").map((s) => s.trim());
    const decls = parseDeclarations(rMatch[2]);
    rules.push({ selectors, decls, raw: rMatch[0] });
  }

  return { tokens, rules, mediaQueries };
}

function parseDeclarations(block) {
  const decls = {};
  const lines = block.split(";");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("/*")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
      const val = trimmed.slice(colonIdx + 1).trim();
      decls[prop] = val;
    }
  }
  return decls;
}

function findRule(rules, selector) {
  return rules.filter((r) => r.selectors.includes(selector));
}

// ========================================================
// 3. Viewport & Layout Math Simulation
// ========================================================

function simulateViewportLayout({
  viewportWidth,
  containerMaxWidth = 1200,
  containerPadding = 20,
  itemMinWidth = 320,
  gap = 12,
  forcedSingleColumn = false,
}) {
  const effectiveContainerWidth = Math.min(
    viewportWidth,
    containerMaxWidth
  ) - (containerPadding * 2);

  if (forcedSingleColumn || effectiveContainerWidth <= itemMinWidth) {
    return {
      viewportWidth,
      containerWidth: effectiveContainerWidth,
      columns: 1,
      columnWidth: effectiveContainerWidth,
      hasHorizontalOverflow: effectiveContainerWidth > viewportWidth,
      scrollWidth: Math.max(viewportWidth, effectiveContainerWidth + containerPadding * 2),
      clientWidth: viewportWidth,
    };
  }

  const columns = Math.max(
    1,
    Math.floor((effectiveContainerWidth + gap) / (itemMinWidth + gap))
  );
  const columnWidth = (effectiveContainerWidth - (columns - 1) * gap) / columns;

  const totalContentWidth = columns * columnWidth + (columns - 1) * gap;
  const scrollWidth = totalContentWidth + containerPadding * 2;

  return {
    viewportWidth,
    containerWidth: effectiveContainerWidth,
    columns,
    columnWidth,
    hasHorizontalOverflow: scrollWidth > viewportWidth,
    scrollWidth,
    clientWidth: viewportWidth,
  };
}

// ========================================================
// 4. Color & Contrast Calculation (WCAG 2.1)
// ========================================================

function parseColorToRgb(colorStr) {
  if (!colorStr) return [0, 0, 0];
  const s = colorStr.trim().toLowerCase();

  // Hex (#fff or #ffffff)
  if (s.startsWith("#")) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  // rgb/rgba
  const rgbMatch = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }

  // Named fallbacks
  if (s === "white") return [255, 255, 255];
  if (s === "black") return [0, 0, 0];

  return [0, 0, 0];
}

function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(fgColor, bgColor) {
  const [r1, g1, b1] = parseColorToRgb(fgColor);
  const [r2, g2, b2] = parseColorToRgb(bgColor);

  const lum1 = getRelativeLuminance(r1, g1, b1);
  const lum2 = getRelativeLuminance(r2, g2, b2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

// ========================================================
// 5. Game State & Party Counter Simulator
// ========================================================

function createMockGameSimulator(initialTeam = []) {
  let team = initialTeam.map((p) => ({ ...p, name: (p.name || "").toLowerCase() }));
  let box = [];
  let inventory = {
    "poke-ball": 10,
    "potion": 5,
    "rare-candy": 2,
    "fire-stone": 1,
  };
  let money = 3500;
  let listeners = [];

  function onStateChange(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  function notify() {
    listeners.forEach((l) => l({ team, box, inventory, money, countStr: `${team.length}/6` }));
  }

  function addToTeam(pokemon, level = 5) {
    if (team.length >= 6) {
      return {
        success: false,
        message: "Your party is full (6/6)! Release a Pokémon first.",
      };
    }
    const instance = {
      instanceId: `inst_${Date.now()}_${Math.random()}`,
      id: pokemon.id || 1,
      name: (pokemon.name || "Pikachu").toLowerCase(),
      nickname: pokemon.nickname || pokemon.name || "Pikachu",
      level,
      currentHp: 20,
      maxHp: 20,
    };
    team.push(instance);
    notify();
    return {
      success: true,
      message: `${instance.nickname} joined your active team!`,
      instance,
    };
  }

  function removeFromTeam(instanceId) {
    if (team.length <= 1) {
      return {
        success: false,
        message: "You cannot release your last remaining Pokémon partner!",
      };
    }
    const idx = team.findIndex((p) => p.instanceId === instanceId);
    if (idx === -1) {
      return { success: false, message: "Pokémon not found in party." };
    }
    const removed = team.splice(idx, 1)[0];
    notify();
    return {
      success: true,
      message: `${removed.nickname} was released back into the wild.`,
    };
  }

  function reorderTeam(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      fromIndex >= team.length ||
      toIndex < 0 ||
      toIndex >= team.length
    ) {
      return false;
    }
    const [moved] = team.splice(fromIndex, 1);
    team.splice(toIndex, 0, moved);
    notify();
    return true;
  }

  function setTeamLeader(instanceId) {
    const idx = team.findIndex((p) => p.instanceId === instanceId);
    if (idx <= 0) return;
    const [leader] = team.splice(idx, 1);
    team.unshift(leader);
    notify();
  }

  function buyItem(itemKey, qty = 1, price = 200) {
    const total = price * qty;
    if (money < total) {
      return { success: false, message: `Not enough PokéDollars! Need ₽${total}` };
    }
    money -= total;
    inventory[itemKey] = (inventory[itemKey] || 0) + qty;
    notify();
    return { success: true, message: `Purchased ${qty}x ${itemKey}!` };
  }

  function sellItem(itemKey, qty = 1, sellPrice = 100) {
    const current = inventory[itemKey] || 0;
    if (current < qty || qty <= 0) {
      return { success: false, message: "Invalid quantity or insufficient items." };
    }
    const total = sellPrice * qty;
    money += total;
    inventory[itemKey] -= qty;
    if (inventory[itemKey] === 0) delete inventory[itemKey];
    notify();
    return { success: true, message: `Sold ${qty}x ${itemKey} for ₽${total}!` };
  }

  function simulateStorageEvent(newTeamJson) {
    try {
      const parsed = JSON.parse(newTeamJson);
      if (Array.isArray(parsed)) {
        team = parsed;
        notify();
      }
    } catch {
      // ignore
    }
  }

  return {
    getTeam: () => [...team],
    getMoney: () => money,
    getInventory: () => ({ ...inventory }),
    getPartyCountString: () => `${team.length}/6`,
    addToTeam,
    removeFromTeam,
    reorderTeam,
    setTeamLeader,
    buyItem,
    sellItem,
    simulateStorageEvent,
    onStateChange,
  };
}

module.exports = {
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
  getRelativeLuminance,
  calculateContrastRatio,
  createMockGameSimulator,
};
