import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import { ITEM_POCKETS, ITEM_CATALOG } from "../data/itemCatalog.js";
import {
  IconBackpack,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconMinus,
  IconX,
} from "../components/Icons.jsx";
import { capitalize, getTypeColor } from "../utils.js";
import { EVOLUTION_STONE_MAP } from "../utils/pokemonFactory.js";
import {
  playMartBuySound,
  playItemUseSound,
  playLevelUpSound,
  playEvolutionJingle,
} from "../utils/soundEffects.js";

function BagAndMartPage() {
  const {
    trainer,
    team,
    inventory,
    getInventoryList,
    applyItemToPokemon,
    buyItem,
    sellItem,
  } = useGame();

  // Active top-level tab: 'bag' | 'mart'
  const [activeTab, setActiveTab] = useState("bag");

  // Bag states
  const [selectedPocket, setSelectedPocket] = useState("all");
  const [bagSearchQuery, setBagSearchQuery] = useState("");
  const [activeUseItem, setActiveUseItem] = useState(null); // Item to use on party
  const [toastMessage, setToastMessage] = useState(null);

  // Mart states
  const [martSubMode, setMartSubMode] = useState("buy"); // 'buy' | 'sell'
  const [martCategory, setMartCategory] = useState("all");
  const [buyQuantities, setBuyQuantities] = useState({});
  const [sellQuantities, setSellQuantities] = useState({});

  function showToast(msg, isSuccess = true) {
    setToastMessage({ text: msg, isSuccess });
    setTimeout(() => setToastMessage(null), 3500);
  }

  // ------------------------------------------------------
  // Bag Calculations
  // ------------------------------------------------------
  const allInventoryItems = getInventoryList();

  const filteredBagItems = allInventoryItems.filter((item) => {
    // 1. Pocket filter
    if (selectedPocket !== "all" && item.category !== selectedPocket) {
      return false;
    }
    // 2. Search filter
    if (bagSearchQuery.trim() !== "") {
      const q = bagSearchQuery.trim().toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle using item on a specific party Pokemon
  function handleConfirmUse(targetPokemon) {
    if (!activeUseItem) return;
    const result = applyItemToPokemon(activeUseItem.id, targetPokemon.instanceId);
    showToast(result.message, result.success);

    if (result.success) {
      if (activeUseItem.effect.type === "level_up") {
        playLevelUpSound();
      } else if (activeUseItem.effect.type === "evolution_stone") {
        playEvolutionJingle();
      } else {
        playItemUseSound();
      }
    }

    // If item count drops to 0, close modal
    const updatedCount = (inventory[activeUseItem.id] || 1) - 1;
    if (updatedCount <= 0) {
      setActiveUseItem(null);
    }
  }

  // ------------------------------------------------------
  // Mart Calculations
  // ------------------------------------------------------
  const martStock = Object.values(ITEM_CATALOG);
  const filteredMartStock = martStock.filter((item) => {
    if (martCategory !== "all" && item.category !== martCategory) return false;
    return true;
  });

  function getBuyQty(itemId) {
    return buyQuantities[itemId] || 1;
  }

  function setBuyQty(itemId, val) {
    const safeVal = Math.max(1, Math.min(99, parseInt(val, 10) || 1));
    setBuyQuantities((prev) => ({ ...prev, [itemId]: safeVal }));
  }

  function handleBuy(item) {
    const qty = getBuyQty(item.id);
    const result = buyItem(item.id, qty);
    showToast(result.message, result.success);
    if (result.success) {
      playMartBuySound();
      setBuyQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    }
  }

  function setMaxAffordable(item) {
    const maxAfford = Math.max(1, Math.floor(trainer.money / item.price));
    setBuyQty(item.id, maxAfford);
  }

  // Sell functions
  function getSellQty(itemId, maxAvailable) {
    const current = sellQuantities[itemId];
    if (current === undefined) return 1;
    return Math.min(maxAvailable, Math.max(1, current));
  }

  function setSellQty(itemId, val, maxAvailable) {
    const safeVal = Math.max(1, Math.min(maxAvailable, parseInt(val, 10) || 1));
    setSellQuantities((prev) => ({ ...prev, [itemId]: safeVal }));
  }

  function handleSell(item) {
    const qty = getSellQty(item.id, item.count);
    const result = sellItem(item.id, qty);
    showToast(result.message, result.success);
    if (result.success) {
      playMartBuySound();
      setSellQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    }
  }

  return (
    <div className="bag-mart-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`toast-notification ${
            toastMessage.isSuccess ? "toast-success" : "toast-error"
          }`}
        >
          {toastMessage.isSuccess ? (
            <IconCheck size={18} className="toast-icon" />
          ) : (
            <IconAlertTriangle size={18} className="toast-icon" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bag-mart-hero">
        <div className="hero-text-group">
          <h1 className="hero-title">Bag & Mart</h1>
          <p className="hero-subtitle">
            Manage your inventory, use items on your party, and purchase supplies.
          </p>
        </div>

        {/* Trainer Wallet Balance */}
        <div className="trainer-wallet-badge" title="PokéDollars">
          <div className="wallet-meta">
            <span className="wallet-label">Balance</span>
            <span className="wallet-amount">₽{trainer.money.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Top Tab Navigator: Bag vs Mart */}
      <div className="tab-navigator">
        <button
          type="button"
          onClick={() => setActiveTab("bag")}
          className={`tab-btn ${activeTab === "bag" ? "tab-btn-active" : ""}`}
        >
          <span>Bag</span>
          <span className="tab-count-pill">{allInventoryItems.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mart")}
          className={`tab-btn ${activeTab === "mart" ? "tab-btn-active" : ""}`}
        >
          <span>Mart</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: TRAINER BAG (5 POCKETS)
          ======================================================== */}
      {activeTab === "bag" && (
        <div className="bag-section">
          {/* Pockets Filter Bar */}
          <div className="pockets-bar">
            <div className="pocket-chips-row">
              {ITEM_POCKETS.map((pocket) => {
                const countInPocket =
                  pocket.id === "all"
                    ? allInventoryItems.length
                    : allInventoryItems.filter((i) => i.category === pocket.id).length;

                return (
                  <button
                    key={pocket.id}
                    type="button"
                    onClick={() => setSelectedPocket(pocket.id)}
                    className={`pocket-chip ${
                      selectedPocket === pocket.id ? "pocket-chip-active" : ""
                    }`}
                  >
                    <span>{pocket.name}</span>
                    <span className="pocket-count-tag">{countInPocket}</span>
                  </button>
                );
              })}
            </div>

            {/* Bag Search Input */}
            <div className="bag-search-wrapper">
              <input
                type="text"
                value={bagSearchQuery}
                onChange={(e) => setBagSearchQuery(e.target.value)}
                placeholder="Search items in bag…"
                className="bag-search-input"
              />
              {bagSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBagSearchQuery("")}
                  className="bag-search-clear"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bag Items Grid */}
          {filteredBagItems.length === 0 ? (
            <div className="bag-empty-state">
              <IconBackpack size={36} className="empty-icon-box" />
              <h3>No items found</h3>
              <p>
                {allInventoryItems.length === 0
                  ? "Your bag is empty. Visit the Mart to purchase supplies."
                  : "No items match your active pocket or search."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("mart");
                  setMartSubMode("buy");
                }}
                className="btn-primary"
              >
                Go to Mart
              </button>
            </div>
          ) : (
            <div className="bag-items-grid">
              {filteredBagItems.map((item) => (
                <div key={item.id} className="bag-item-card">
                  <div className="item-card-header">
                    <span className="item-pocket-tag">{item.pocket}</span>
                    <span className="item-qty-badge">×{item.count}</span>
                  </div>

                  <div className="item-sprite-box">
                    <img
                      src={item.sprite}
                      alt={item.name}
                      className="item-sprite-img"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-description">{item.description}</p>
                  </div>

                  <div className="item-card-footer">
                    {item.isUsableOnPokemon ? (
                      <button
                        type="button"
                        onClick={() => setActiveUseItem(item)}
                        className="btn-use-item"
                      >
                        Use
                      </button>
                    ) : (
                      <span className="item-unusable-tag">
                        {item.category === "pokeballs"
                          ? "Auto-used in Wild"
                          : item.category === "valuable"
                          ? `Sell for ₽${item.sellPrice.toLocaleString()}`
                          : "Held item"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: POKÉ MART VENDOR (BUY & SELL)
          ======================================================== */}
      {activeTab === "mart" && (
        <div className="mart-section">
          {/* Shop Sub-mode Switcher: Buy vs Sell */}
          <div className="mart-submode-bar">
            <div className="submode-toggles">
              <button
                type="button"
                onClick={() => setMartSubMode("buy")}
                className={`submode-btn ${
                  martSubMode === "buy" ? "submode-btn-active" : ""
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setMartSubMode("sell")}
                className={`submode-btn ${
                  martSubMode === "sell" ? "submode-btn-active" : ""
                }`}
              >
                Sell
              </button>
            </div>

            {/* Category filter if in Buy mode */}
            {martSubMode === "buy" && (
              <div className="mart-category-chips">
                {[
                  { id: "all", name: "All" },
                  { id: "pokeballs", name: "Poké Balls" },
                  { id: "medicine", name: "Medicine" },
                  { id: "berries", name: "Berries" },
                  { id: "evolution", name: "Evolution" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMartCategory(cat.id)}
                    className={`cat-chip ${
                      martCategory === cat.id ? "cat-chip-active" : ""
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BUY MODE CATALOG */}
          {martSubMode === "buy" && (
            <div className="mart-catalog-grid">
              {filteredMartStock.map((item) => {
                const qty = getBuyQty(item.id);
                const totalCost = item.price * qty;
                const canAfford = trainer.money >= totalCost;

                return (
                  <div key={item.id} className="mart-card">
                    <div className="mart-card-top">
                      <div className="mart-item-sprite-box">
                        <img
                          src={item.sprite}
                          alt={item.name}
                          className="mart-sprite-img"
                        />
                      </div>
                      <div className="mart-item-meta">
                        <h4 className="mart-item-name">{item.name}</h4>
                        <span className="mart-item-pocket">{item.pocket}</span>
                        <div className="mart-price-tag">
                          <span>₽{item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mart-item-desc">{item.description}</p>

                    {/* Stepper & Buy Action */}
                    <div className="mart-card-actions">
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() => setBuyQty(item.id, qty - 1)}
                          disabled={qty <= 1}
                          className="stepper-btn"
                          aria-label="Decrease quantity"
                        >
                          <IconMinus size={13} />
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setBuyQty(item.id, e.target.value)}
                          min={1}
                          max={99}
                          className="stepper-input"
                        />
                        <button
                          type="button"
                          onClick={() => setBuyQty(item.id, qty + 1)}
                          className="stepper-btn"
                          aria-label="Increase quantity"
                        >
                          <IconPlus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaxAffordable(item)}
                          className="stepper-max-btn"
                          title="Buy maximum affordable"
                        >
                          Max
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`btn-mart-buy ${
                          !canAfford ? "btn-disabled" : ""
                        }`}
                      >
                        <span>Buy • ₽{totalCost.toLocaleString()}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SELL MODE CATALOG */}
          {martSubMode === "sell" && (
            <div className="mart-sell-container">
              {allInventoryItems.length === 0 ? (
                <div className="bag-empty-state">
                  <IconBackpack size={36} className="empty-icon-box" />
                  <h3>No items to sell</h3>
                  <p>Your Bag is currently empty.</p>
                </div>
              ) : (
                <div className="mart-sell-grid">
                  {allInventoryItems.map((item) => {
                    const sellQty = getSellQty(item.id, item.count);
                    const totalReward = item.sellPrice * sellQty;

                    return (
                      <div key={item.id} className="mart-sell-card">
                        <div className="mart-card-top">
                          <div className="mart-item-sprite-box">
                            <img
                              src={item.sprite}
                              alt={item.name}
                              className="mart-sprite-img"
                            />
                          </div>
                          <div className="mart-item-meta">
                            <h4 className="mart-item-name">{item.name}</h4>
                            <span className="mart-stock-tag">In Bag: ×{item.count}</span>
                            <div className="mart-sell-price-tag">
                              <span>₽{item.sellPrice.toLocaleString()} each</span>
                            </div>
                          </div>
                        </div>

                        <div className="mart-sell-actions">
                          <div className="qty-stepper">
                            <button
                              type="button"
                              onClick={() => setSellQty(item.id, sellQty - 1, item.count)}
                              disabled={sellQty <= 1}
                              className="stepper-btn"
                            >
                              <IconMinus size={13} />
                            </button>
                            <input
                              type="number"
                              value={sellQty}
                              onChange={(e) =>
                                setSellQty(item.id, e.target.value, item.count)
                              }
                              min={1}
                              max={item.count}
                              className="stepper-input"
                            />
                            <button
                              type="button"
                              onClick={() => setSellQty(item.id, sellQty + 1, item.count)}
                              disabled={sellQty >= item.count}
                              className="stepper-btn"
                            >
                              <IconPlus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSellQty(item.id, item.count, item.count)}
                              className="stepper-max-btn"
                            >
                              All
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSell(item)}
                            className="btn-mart-sell"
                          >
                            <span>Sell • +₽{totalReward.toLocaleString()}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ITEM TARGET PICKER MODAL (USE ITEM ON PARTY MEMBER)
          ======================================================== */}
      {activeUseItem && (
        <div className="modal-backdrop" onClick={() => setActiveUseItem(null)}>
          <div
            className="item-picker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <img
                  src={activeUseItem.sprite}
                  alt={activeUseItem.name}
                  className="modal-item-sprite"
                />
                <div>
                  <h3>Use {activeUseItem.name}</h3>
                  <p className="modal-item-desc">
                    In Bag: <strong>×{activeUseItem.count}</strong> • {activeUseItem.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveUseItem(null)}
                className="btn-modal-close"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="picker-prompt">
                Select a Pokémon from your party:
              </p>

              {team.length === 0 ? (
                <div className="modal-empty-party">
                  <p>You have no Pokémon in your active team.</p>
                  <Link to="/" className="btn-primary">
                    PokéDex
                  </Link>
                </div>
              ) : (
                <div className="party-picker-list">
                  {team.map((pokemon) => {
                    const primaryType = pokemon.types[0] || "normal";
                    const theme = getTypeColor(primaryType);
                    const hpPercent = Math.max(
                      0,
                      Math.round((pokemon.currentHp / pokemon.maxHp) * 100)
                    );
                    const isFainted = pokemon.currentHp <= 0;

                    let hpBarColor = "#38a169";
                    if (hpPercent <= 20) hpBarColor = "#e53e3e";
                    else if (hpPercent <= 50) hpBarColor = "#dd6b20";

                    let compatBadge = null;
                    const effect = activeUseItem?.effect;

                    if (effect?.type === "evolution_stone") {
                      const evoTarget = EVOLUTION_STONE_MAP[pokemon.name]?.[activeUseItem.id];
                      if (evoTarget) {
                        compatBadge = (
                          <span className="compat-badge-evolve">
                            Evolves to {capitalize(evoTarget.name)}
                          </span>
                        );
                      } else {
                        compatBadge = <span className="compat-badge-incompatible">No Effect</span>;
                      }
                    } else if (effect?.type === "heal_hp" || effect?.type === "heal_full") {
                      if (isFainted) {
                        compatBadge = <span className="compat-badge-warning">Fainted</span>;
                      } else if (pokemon.currentHp >= pokemon.maxHp) {
                        compatBadge = <span className="compat-badge-disabled">Full HP</span>;
                      } else {
                        compatBadge = <span className="compat-badge-ready">Can Heal</span>;
                      }
                    } else if (effect?.type === "revive") {
                      if (isFainted) {
                        compatBadge = <span className="compat-badge-revive">Can Revive</span>;
                      } else {
                        compatBadge = <span className="compat-badge-disabled">Healthy</span>;
                      }
                    } else if (effect?.type === "level_up") {
                      if (pokemon.level >= 100) {
                        compatBadge = <span className="compat-badge-disabled">Max Lv. 100</span>;
                      } else {
                        compatBadge = (
                          <span className="compat-badge-level">
                            Level Up → Lv. {pokemon.level + 1}
                          </span>
                        );
                      }
                    }

                    return (
                      <div
                        key={pokemon.instanceId}
                        onClick={() => handleConfirmUse(pokemon)}
                        className={`picker-pokemon-card ${
                          isFainted ? "picker-card-fainted" : ""
                        }`}
                        style={{
                          "--picker-theme": theme.primary,
                        }}
                      >
                        <div className="picker-left">
                          <img
                            src={pokemon.sprites.animated || pokemon.sprites.static}
                            alt={pokemon.name}
                            className="picker-sprite"
                            onError={(e) => {
                              e.target.src = pokemon.sprites.static;
                            }}
                          />
                          <div className="picker-info">
                            <div className="picker-name-row">
                              <span className="picker-nick">{pokemon.nickname}</span>
                              <span className="picker-level">Lv. {pokemon.level}</span>
                            </div>
                            <span className="picker-species">{capitalize(pokemon.name)}</span>
                            {compatBadge}
                          </div>
                        </div>

                        <div className="picker-right">
                          <div className="picker-hp-meta">
                            <span className="picker-hp-text">
                              {pokemon.currentHp} / {pokemon.maxHp} HP
                            </span>
                            {isFainted && (
                              <span className="picker-fainted-badge">FAINTED</span>
                            )}
                          </div>
                          <div className="picker-hp-track">
                            <div
                              className="picker-hp-fill"
                              style={{
                                width: `${hpPercent}%`,
                                backgroundColor: hpBarColor,
                              }}
                            ></div>
                          </div>
                          <button type="button" className="btn-apply-item">
                            Apply
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setActiveUseItem(null)}
                className="btn-secondary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BagAndMartPage;
