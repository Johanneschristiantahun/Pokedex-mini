import { createContext, useContext, useState, useEffect } from "react";
import {
  createPokemonInstance,
  recalculatePokemonStats,
  checkLevelEvolution,
  checkStoneEvolution,
} from "../utils/pokemonFactory.js";
import {
  playPokemonCry,
  capitalize,
  getAnimatedSpriteUrl,
  getAnimatedShinySpriteUrl,
  getArtworkUrl,
  getArtworkShinyUrl,
} from "../utils.js";
import {
  ITEM_CATALOG,
  DEFAULT_TRAINER_INVENTORY,
} from "../data/itemCatalog.js";
import {
  setMasterMute,
  getMasterMute,
  playCatchSuccessJingle,
  playLevelUpSound,
} from "../utils/soundEffects.js";

const GameContext = createContext();

const STORAGE_KEYS = {
  TRAINER: "pokesphere_trainer",
  TEAM: "pokesphere_team",
  BOX: "pokesphere_box",
  INVENTORY: "pokesphere_inventory_v2",
  LEGACY_INVENTORY: "pokesphere_inventory",
  HAS_STARTER: "pokesphere_has_starter",
  HALL_OF_FAME: "pokesphere_hall_of_fame",
};

// Helper: Normalize inventory state from storage
function loadInitialInventory() {
  try {
    // 1. Try modern dictionary format
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }

    // 2. Migration from legacy array format [{ name, count }]
    const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_INVENTORY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy)) {
        const migrated = { ...DEFAULT_TRAINER_INVENTORY };
        parsedLegacy.forEach((item) => {
          if (item?.name && typeof item.count === "number") {
            migrated[item.name] = (migrated[item.name] || 0) + item.count;
          }
        });
        localStorage.removeItem(STORAGE_KEYS.LEGACY_INVENTORY);
        return migrated;
      }
    }
  } catch (err) {
    console.error("Failed to load inventory from storage:", err);
  }

  return { ...DEFAULT_TRAINER_INVENTORY };
}

export function GameProvider({ children }) {
  // 1. Trainer Profile
  const [trainer, setTrainer] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRAINER);
      return saved
        ? JSON.parse(saved)
        : { name: "Trainer Red", money: 3500, badges: [] };
    } catch {
      return { name: "Trainer Red", money: 3500, badges: [] };
    }
  });

  // 2. Active Party (max 6)
  const [team, setTeam] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAM);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2b. PC Storage Box (Unlimited reserve storage)
  const [box, setBox] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOX);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Inventory Bag { [itemKey]: quantity }
  const [inventory, setInventory] = useState(loadInitialInventory);

  // 4. Has Chosen Starter Status
  const [hasStarter, setHasStarter] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HAS_STARTER) === "true";
    } catch {
      return false;
    }
  });

  // 5. Global Sound Mute State
  const [isMuted, setIsMuted] = useState(() => getMasterMute());

  // 6. Hall of Fame League Records
  const [hallOfFame, setHallOfFame] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HALL_OF_FAME);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 7. Active Evolution In Progress Cutscene State
  const [pendingEvolution, setPendingEvolution] = useState(null);

  function toggleSound() {
    const next = !isMuted;
    setIsMuted(next);
    setMasterMute(next);
  }

  // Auto-unlock Web Audio API on first user touch/click (resolves mobile Safari/Chrome autoplay lock)
  useEffect(() => {
    function unlockAudio() {
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          if (tempCtx.state === "suspended") {
            tempCtx.resume();
          }
        }
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    }
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Synchronize state with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRAINER, JSON.stringify(trainer));
  }, [trainer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOX, JSON.stringify(box));
  }, [box]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HAS_STARTER, hasStarter.toString());
  }, [hasStarter]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HALL_OF_FAME, JSON.stringify(hallOfFame));
  }, [hallOfFame]);

  // Action: Choose Starter
  function chooseStarter(starterData, nickname) {
    const starterInstance = {
      ...createPokemonInstance(starterData, 5, nickname),
      isStarter: true,
    };
    setTeam([starterInstance]);
    setHasStarter(true);
    playPokemonCry(starterData.id);
  }

  // Action: Add Pokemon to Team
  function addToTeam(pokemonData, level = 5) {
    if (team.length >= 6) {
      return {
        success: false,
        message: "Your party is full (6/6)! Release a Pokémon first.",
      };
    }

    const isAlreadyInTeam = team.some((p) => p.name === pokemonData.name.toLowerCase());
    const newInstance = createPokemonInstance(pokemonData, level);

    setTeam((prev) => [...prev, newInstance]);
    playPokemonCry(pokemonData.id);

    return {
      success: true,
      message: `${newInstance.nickname} joined your active team!`,
      isDuplicate: isAlreadyInTeam,
    };
  }

  // Action: Add Pokemon directly to PC Storage Box
  function addToBox(pokemonData, level = 5) {
    const isAlreadyInBox = box.some((p) => p.name === pokemonData.name.toLowerCase());
    const newInstance = createPokemonInstance(pokemonData, level);

    setBox((prev) => [...prev, newInstance]);
    playPokemonCry(pokemonData.id);

    return {
      success: true,
      message: `${newInstance.nickname} was stored safely in PC Storage Box!`,
      isDuplicate: isAlreadyInBox,
    };
  }

  // Action: Remove from Team
  function removeFromTeam(instanceId) {
    if (team.length <= 1) {
      return {
        success: false,
        message: "You cannot release your last remaining Pokémon partner!",
      };
    }
    const target = team.find((p) => p.instanceId === instanceId);
    setTeam((prev) => prev.filter((p) => p.instanceId !== instanceId));
    return {
      success: true,
      message: `${target?.nickname || "Pokémon"} was released back into the wild.`,
    };
  }

  // Action: Pokémon Center Full Healing
  function healAllPokemon() {
    setTeam((prev) =>
      prev.map((pokemon) => ({
        ...pokemon,
        currentHp: pokemon.maxHp,
        status: null,
      }))
    );
  }

  // Action: Get item quantity
  function getItemCount(itemKey) {
    return inventory[itemKey] || 0;
  }

  // Action: Get total quantity of all items in bag
  function getTotalItemCount() {
    return Object.values(inventory).reduce((sum, count) => sum + count, 0);
  }

  // Action: Get full item list populated with ITEM_CATALOG metadata
  function getInventoryList() {
    return Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([itemKey, count]) => {
        const meta = ITEM_CATALOG[itemKey] || {
          id: itemKey,
          name: capitalize(itemKey.replace("-", " ")),
          pocket: "Treasures & Loot",
          category: "valuable",
          price: 100,
          sellPrice: 50,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemKey}.png`,
          description: "A mysterious item.",
          isUsableOnPokemon: false,
        };
        return {
          ...meta,
          count,
        };
      });
  }

  // Action: Extensible Use Item Engine on a specific Pokémon
  function applyItemToPokemon(itemKey, instanceId) {
    const count = getItemCount(itemKey);
    const itemMeta = ITEM_CATALOG[itemKey];

    if (!itemMeta) {
      return { success: false, message: "Unknown item." };
    }

    if (count <= 0) {
      return { success: false, message: `You don't have any ${itemMeta.name} in your Bag!` };
    }

    const target = team.find((p) => p.instanceId === instanceId);
    if (!target) {
      return { success: false, message: "Target Pokémon not found in party." };
    }

    const isFainted = target.currentHp <= 0;
    const effect = itemMeta.effect;

    // 1. HP Healing items (Potion, Super Potion, Hyper Potion, Oran Berry, Sitrus Berry)
    if (effect.type === "heal_hp" || effect.type === "heal_full") {
      if (isFainted) {
        return {
          success: false,
          message: `${target.nickname} has fainted! Use a Revive instead.`,
        };
      }
      if (target.currentHp >= target.maxHp) {
        return {
          success: false,
          message: `${target.nickname}'s HP is already full!`,
        };
      }

      const healAmount =
        effect.type === "heal_full"
          ? target.maxHp - target.currentHp
          : Math.min(effect.amount, target.maxHp - target.currentHp);

      const newHp = target.currentHp + healAmount;

      setTeam((prev) =>
        prev.map((p) =>
          p.instanceId === instanceId ? { ...p, currentHp: newHp } : p
        )
      );

      // Decrement item count
      setInventory((prev) => ({
        ...prev,
        [itemKey]: Math.max(0, (prev[itemKey] || 1) - 1),
      }));

      return {
        success: true,
        message: `Restored +${healAmount} HP to ${target.nickname}! (${newHp}/${target.maxHp} HP)`,
      };
    }

    // 2. Revive items (Revive, Max Revive)
    if (effect.type === "revive") {
      if (!isFainted) {
        return {
          success: false,
          message: `${target.nickname} is healthy and does not need reviving!`,
        };
      }

      const revivedHp = Math.max(
        1,
        Math.floor((target.maxHp * effect.percent) / 100)
      );

      setTeam((prev) =>
        prev.map((p) =>
          p.instanceId === instanceId
            ? { ...p, currentHp: revivedHp, status: null }
            : p
        )
      );

      setInventory((prev) => ({
        ...prev,
        [itemKey]: Math.max(0, (prev[itemKey] || 1) - 1),
      }));

      return {
        success: true,
        message: `${target.nickname} was revived with ${revivedHp} HP!`,
      };
    }

    // 3. Rare Candy (Level Up)
    if (effect.type === "level_up") {
      if (target.level >= 100) {
        return {
          success: false,
          message: `${target.nickname} is already at the maximum level 100!`,
        };
      }

      const newLevel = target.level + (effect.levels || 1);
      const updatedPokemon = recalculatePokemonStats(target, newLevel);

      setTeam((prev) =>
        prev.map((p) => (p.instanceId === instanceId ? updatedPokemon : p))
      );

      setInventory((prev) => ({
        ...prev,
        [itemKey]: Math.max(0, (prev[itemKey] || 1) - 1),
      }));

      playPokemonCry(target.id);

      // Check if Rare Candy triggered level evolution!
      const evoTarget = checkLevelEvolution(updatedPokemon);
      if (evoTarget) {
        setTimeout(() => {
          triggerEvolution(updatedPokemon, evoTarget, "level");
        }, 1200);
      }

      return {
        success: true,
        message: `${target.nickname} grew to Level ${newLevel}! Max HP is now ${updatedPokemon.maxHp}!`,
      };
    }

    // 4. Status Cure (Full Heal, Pecha Berry, Lum Berry)
    if (effect.type === "cure_status") {
      if (!target.status) {
        return {
          success: false,
          message: `${target.nickname} does not have any status condition!`,
        };
      }

      if (effect.targetStatus && target.status !== effect.targetStatus) {
        return {
          success: false,
          message: `This item can only cure ${effect.targetStatus}!`,
        };
      }

      setTeam((prev) =>
        prev.map((p) =>
          p.instanceId === instanceId ? { ...p, status: null } : p
        )
      );

      setInventory((prev) => ({
        ...prev,
        [itemKey]: Math.max(0, (prev[itemKey] || 1) - 1),
      }));

      return {
        success: true,
        message: `${target.nickname}'s status was completely cured!`,
      };
    }

    // 5. Evolution Stones
    if (effect.type === "evolution_stone") {
      const evoTarget = checkStoneEvolution(target, itemKey);
      if (!evoTarget) {
        return {
          success: false,
          message: `The ${itemMeta.name} has no effect on ${target.nickname}!`,
        };
      }

      // Deduct stone from inventory
      setInventory((prev) => ({
        ...prev,
        [itemKey]: Math.max(0, (prev[itemKey] || 1) - 1),
      }));

      // Trigger Authentic Evolution Cinematic Modal
      triggerEvolution(target, evoTarget, "stone");

      return {
        success: true,
        message: `${target.nickname} began reacting to the ${itemMeta.name}!`,
      };
    }

    return {
      success: false,
      message: `The ${itemMeta.name} cannot be used directly right now.`,
    };
  }

  // Backward compatibility alias for TeamPage
  function applyPotion(instanceId) {
    return applyItemToPokemon("potion", instanceId);
  }

  // Action: Poké Mart Purchase
  function buyItem(itemKey, quantity = 1) {
    const itemMeta = ITEM_CATALOG[itemKey];
    if (!itemMeta) {
      return { success: false, message: "Item not in Mart inventory." };
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const totalCost = itemMeta.price * qty;

    if (trainer.money < totalCost) {
      return {
        success: false,
        message: `Not enough PokéDollars! You need ₽${totalCost.toLocaleString()} but only have ₽${trainer.money.toLocaleString()}.`,
      };
    }

    // Deduct money and add item
    setTrainer((prev) => ({ ...prev, money: prev.money - totalCost }));
    setInventory((prev) => ({
      ...prev,
      [itemKey]: (prev[itemKey] || 0) + qty,
    }));

    return {
      success: true,
      message: `Purchased ${qty}x ${itemMeta.name} for ₽${totalCost.toLocaleString()}!`,
    };
  }

  // Action: Poké Mart Sell
  function sellItem(itemKey, quantity = 1) {
    const itemMeta = ITEM_CATALOG[itemKey];
    if (!itemMeta) {
      return { success: false, message: "Item cannot be sold." };
    }

    const currentCount = getItemCount(itemKey);
    const qty = Math.min(currentCount, Math.max(1, parseInt(quantity, 10) || 1));

    if (qty <= 0) {
      return { success: false, message: `You have no ${itemMeta.name} to sell.` };
    }

    const totalReward = itemMeta.sellPrice * qty;

    // Add money and deduct item
    setTrainer((prev) => ({ ...prev, money: prev.money + totalReward }));
    setInventory((prev) => {
      const nextCount = (prev[itemKey] || 0) - qty;
      const nextInv = { ...prev };
      if (nextCount <= 0) {
        delete nextInv[itemKey];
      } else {
        nextInv[itemKey] = nextCount;
      }
      return nextInv;
    });

    return {
      success: true,
      message: `Sold ${qty}x ${itemMeta.name} for ₽${totalReward.toLocaleString()}!`,
    };
  }

  // Action: Add loot discovered from exploration/battle
  function addLoot(itemKey, quantity = 1) {
    const qty = Math.max(1, quantity);
    setInventory((prev) => ({
      ...prev,
      [itemKey]: (prev[itemKey] || 0) + qty,
    }));
  }

  // Action: Rename Pokemon
  function renamePokemon(instanceId, newNickname) {
    if (!newNickname || !newNickname.trim()) return;
    setTeam((prev) =>
      prev.map((p) =>
        p.instanceId === instanceId ? { ...p, nickname: newNickname.trim() } : p
      )
    );
  }

  // Action: Reorder / Set Leader (moves to slot 1)
  function setTeamLeader(instanceId) {
    const target = team.find((p) => p.instanceId === instanceId);
    if (!target) return;
    const rest = team.filter((p) => p.instanceId !== instanceId);
    setTeam([target, ...rest]);
  }

  // Action: Adjust Money
  function addMoney(amount) {
    setTrainer((prev) => ({ ...prev, money: Math.max(0, prev.money + amount) }));
  }

  // Action: Award Official Gym Badge & Prize Money
  function awardBadge(badgeId, prizeMoney = 0) {
    if (!badgeId) return false;
    let isNewlyAwarded = false;

    setTrainer((prev) => {
      const currentBadges = Array.isArray(prev.badges) ? prev.badges : [];
      if (currentBadges.includes(badgeId)) {
        return {
          ...prev,
          money: prev.money + (prizeMoney || 0),
        };
      }
      isNewlyAwarded = true;
      return {
        ...prev,
        badges: [...currentBadges, badgeId],
        money: prev.money + (prizeMoney || 0),
      };
    });

    return isNewlyAwarded;
  }

  // Check if Trainer owns badge
  function hasBadge(badgeId) {
    return Array.isArray(trainer?.badges) && trainer.badges.includes(badgeId);
  }

  // Action: Distribute EXP across entire active team (used after defeating Gym Leader)
  function givePartyExp(expAmount) {
    if (!expAmount || team.length === 0) return [];
    const share = Math.max(10, Math.floor(expAmount / team.length));
    const leveledUp = [];

    setTeam((prev) =>
      prev.map((mon) => {
        if (mon.level >= 100) return mon;
        let exp = (mon.exp || 0) + share;
        let lvl = mon.level;
        let up = mon;
        let didUp = false;

        while (
          lvl < 100 &&
          exp >= (up.expToNextLevel || Math.pow(lvl + 1, 3))
        ) {
          lvl += 1;
          didUp = true;
          up = recalculatePokemonStats(up, lvl);
        }

        if (didUp) {
          leveledUp.push({ name: mon.nickname, newLevel: lvl });
        }

        return {
          ...up,
          exp,
        };
      })
    );

    if (leveledUp.length > 0) {
      playLevelUpSound();

      // Check if any Pokémon reached evolution threshold
      setTimeout(() => {
        setTeam((currentTeam) => {
          const eligible = currentTeam.find((mon) => checkLevelEvolution(mon));
          if (eligible) {
            const evo = checkLevelEvolution(eligible);
            triggerEvolution(eligible, evo, "level");
          }
          return currentTeam;
        });
      }, 1400);
    }

    return leveledUp;
  }

  // Action: Set Trainer Name
  function setTrainerName(newName) {
    if (!newName || !newName.trim()) return;
    setTrainer((prev) => ({ ...prev, name: newName.trim() }));
  }

  // Action: Reset Game / New Journey
  function resetGameSession() {
    const defaultTrainer = { name: "Trainer Red", money: 3500, badges: [] };
    setTrainer(defaultTrainer);
    setTeam([]);
    setBox([]);
    setInventory({ ...DEFAULT_TRAINER_INVENTORY });
    setHasStarter(false);
    setHallOfFame([]);
    setPendingEvolution(null);

    localStorage.removeItem(STORAGE_KEYS.TRAINER);
    localStorage.removeItem(STORAGE_KEYS.TEAM);
    localStorage.removeItem(STORAGE_KEYS.BOX);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.HAS_STARTER);
    localStorage.removeItem(STORAGE_KEYS.HALL_OF_FAME);
  }

  // Action: Record Induction into League Hall of Fame
  function recordHallOfFame(teamSnapshot) {
    const activeRoster = (teamSnapshot || team).map((p) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname,
      level: p.level,
      types: p.types,
      isShiny: Boolean(p.isShiny),
      sprites: p.sprites,
      moves: p.moves,
      maxHp: p.maxHp,
      attack: p.attack,
      defense: p.defense,
      speed: p.speed,
    }));

    const newEntry = {
      id: `hof_${Date.now()}`,
      date: new Date().toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      trainerName: trainer.name,
      team: activeRoster,
    };

    setHallOfFame((prev) => [newEntry, ...prev]);
    return newEntry;
  }

  // Action: Trigger Cinematic Evolution
  function triggerEvolution(pokemon, targetEvo, trigger = "level") {
    setPendingEvolution({ pokemon, targetEvo, trigger });
  }

  // Action: Complete Evolution (Persists to team & box)
  function completeEvolution(evolvedPokemon) {
    setTeam((prev) =>
      prev.map((p) => (p.instanceId === evolvedPokemon.instanceId ? evolvedPokemon : p))
    );
    setBox((prev) =>
      prev.map((p) => (p.instanceId === evolvedPokemon.instanceId ? evolvedPokemon : p))
    );
    setPendingEvolution(null);
  }

  // Action: Cancel Evolution
  function cancelEvolution() {
    setPendingEvolution(null);
  }

  // Action: Move Pokemon position up (-1) or down (+1) in party
  function movePokemonInTeam(instanceId, direction) {
    const index = team.findIndex((p) => p.instanceId === instanceId);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= team.length) return;

    const newTeam = [...team];
    const [moved] = newTeam.splice(index, 1);
    newTeam.splice(targetIndex, 0, moved);
    setTeam(newTeam);
  }

  // Action: Set active party leader (slot 0) for battle
  function setTeamLeader(instanceId) {
    const index = team.findIndex((p) => p.instanceId === instanceId);
    if (index <= 0) return;
    const newTeam = [...team];
    const [leader] = newTeam.splice(index, 1);
    newTeam.unshift(leader);
    setTeam(newTeam);
  }

  // Action: Update single Pokemon HP (persisted to team & localStorage)
  function updatePokemonHp(instanceId, newHp) {
    setTeam((prev) =>
      prev.map((p) => {
        if (p.instanceId !== instanceId) return p;
        const clamped = Math.max(0, Math.min(p.maxHp, Math.round(newHp)));
        return {
          ...p,
          currentHp: clamped,
        };
      })
    );
  }

  // Action: Damage current active leader directly
  function damageTeamLeader(amount) {
    if (team.length === 0) return { newHp: 0, isFainted: true };
    const leader = team[0];
    const newHp = Math.max(0, (leader.currentHp || 0) - amount);
    updatePokemonHp(leader.instanceId, newHp);
    return {
      newHp,
      isFainted: newHp <= 0,
      pokemon: leader,
    };
  }

  // Action: Catch Wild Pokemon with ball from inventory
  function catchWildPokemon(wildPokemon, ballKey = "poke-ball") {
    const ballCount = getItemCount(ballKey);
    const ballMeta = ITEM_CATALOG[ballKey];

    if (!ballMeta || ballCount <= 0) {
      return {
        success: false,
        message: `You don't have any ${ballMeta?.name || "Poké Balls"} in your Bag!`,
        shakes: 0,
      };
    }

    // Deduct ball from inventory
    setInventory((prev) => ({
      ...prev,
      [ballKey]: Math.max(0, (prev[ballKey] || 1) - 1),
    }));

    const maxHp = wildPokemon.maxHp || 40;
    const currentHp = Math.max(1, wildPokemon.currentHp || 1);
    const catchRate = wildPokemon.catchRate || 190;
    const ballMultiplier = ballMeta.effect?.catchMultiplier || 1.0;

    // Master Ball is 100% guaranteed
    if (ballKey === "master-ball" || ballMultiplier >= 255) {
      const baseInst = createPokemonInstance(wildPokemon, wildPokemon.level);
      const caughtInstance = {
        ...baseInst,
        isShiny: Boolean(wildPokemon.isShiny),
        sprites: {
          ...baseInst.sprites,
          animated: wildPokemon.isShiny
            ? getAnimatedShinySpriteUrl(wildPokemon.id)
            : getAnimatedSpriteUrl(wildPokemon.id),
          artwork: wildPokemon.isShiny
            ? getArtworkShinyUrl(wildPokemon.id)
            : getArtworkUrl(wildPokemon.id),
        },
      };

      let sentToBox = false;
      if (team.length < 6) {
        setTeam((prev) => [...prev, caughtInstance]);
      } else {
        setBox((prev) => [...prev, caughtInstance]);
        sentToBox = true;
      }

      playCatchSuccessJingle();
      playPokemonCry(wildPokemon.id);

      return {
        success: true,
        shakes: 3,
        caughtPokemon: caughtInstance,
        sentToBox,
        message: `Gotcha! ${capitalize(wildPokemon.name)} was caught!`,
      };
    }

    // Official Catch Chance: a = ((3 * MaxHP - 2 * CurrentHP) * CatchRate * BallMultiplier) / (3 * MaxHP)
    const a = Math.min(
      255,
      Math.floor(
        ((3 * maxHp - 2 * currentHp) * catchRate * ballMultiplier) / (3 * maxHp)
      )
    );

    const roll = Math.random() * 255;
    const isSuccess = roll <= a;

    if (isSuccess) {
      const baseInst = createPokemonInstance(wildPokemon, wildPokemon.level);
      const caughtInstance = {
        ...baseInst,
        isShiny: Boolean(wildPokemon.isShiny),
        sprites: {
          ...baseInst.sprites,
          animated: wildPokemon.isShiny
            ? getAnimatedShinySpriteUrl(wildPokemon.id)
            : getAnimatedSpriteUrl(wildPokemon.id),
          artwork: wildPokemon.isShiny
            ? getArtworkShinyUrl(wildPokemon.id)
            : getArtworkUrl(wildPokemon.id),
        },
      };

      let sentToBox = false;
      if (team.length < 6) {
        setTeam((prev) => [...prev, caughtInstance]);
      } else {
        setBox((prev) => [...prev, caughtInstance]);
        sentToBox = true;
      }

      playCatchSuccessJingle();
      playPokemonCry(wildPokemon.id);

      return {
        success: true,
        shakes: 3,
        caughtPokemon: caughtInstance,
        sentToBox,
        message: `Gotcha! ${capitalize(wildPokemon.name)} was caught!`,
      };
    } else {
      const ratio = a / (roll + 1);
      const shakes = Math.min(2, Math.floor(ratio * 3));
      const failMsg =
        shakes === 0
          ? `Oh no! The wild ${capitalize(wildPokemon.name)} broke out immediately!`
          : shakes === 1
          ? `Aww! It appeared to be caught! (1 shake)`
          : `Aargh! Almost had it! (2 shakes)`;

      return {
        success: false,
        shakes,
        message: failMsg,
      };
    }
  }

  // Action: Award EXP to party leader from battle / grinding
  function gainExpToLeader(expAmount) {
    if (team.length === 0 || expAmount <= 0) return null;

    const leader = team[0];
    if (leader.level >= 100) {
      return {
        didLevelUp: false,
        expGained: 0,
        level: 100,
        message: `${leader.nickname} is at max level 100!`,
      };
    }

    let currentExp = (leader.exp || 0) + expAmount;
    let currentLevel = leader.level;
    let didLevelUp = false;

    let updatedLeader = leader;
    while (
      currentLevel < 100 &&
      currentExp >= (updatedLeader.expToNextLevel || Math.pow(currentLevel + 1, 3))
    ) {
      currentLevel += 1;
      didLevelUp = true;
      updatedLeader = recalculatePokemonStats(updatedLeader, currentLevel);
    }

    if (didLevelUp) {
      updatedLeader = { ...updatedLeader, exp: currentExp };
      setTeam((prev) => [updatedLeader, ...prev.slice(1)]);
      playLevelUpSound();
      playPokemonCry(updatedLeader.id);

      // Check for level-up evolution
      const evoTarget = checkLevelEvolution(updatedLeader);
      if (evoTarget) {
        setTimeout(() => {
          triggerEvolution(updatedLeader, evoTarget, "level");
        }, 1500);
      }

      return {
        didLevelUp: true,
        oldLevel: leader.level,
        newLevel: currentLevel,
        newHp: updatedLeader.maxHp,
        pokemonName: leader.nickname,
        message: `${leader.nickname} grew to Level ${currentLevel}!`,
      };
    } else {
      const updated = { ...leader, exp: currentExp };
      setTeam((prev) => [updated, ...prev.slice(1)]);
      return {
        didLevelUp: false,
        expGained: expAmount,
        currentExp,
        level: currentLevel,
        message: `${leader.nickname} gained +${expAmount} EXP!`,
      };
    }
  }

  // Action: PC Box Management
  function depositToBox(instanceId) {
    if (team.length <= 1) {
      return {
        success: false,
        message: "You must keep at least 1 Pokémon in your active party!",
      };
    }
    const target = team.find((p) => p.instanceId === instanceId);
    if (!target) return { success: false, message: "Pokémon not found in party." };

    setTeam((prev) => prev.filter((p) => p.instanceId !== instanceId));
    setBox((prev) => [...prev, target]);
    return { success: true, message: `${target.nickname} was deposited to PC Box.` };
  }

  function withdrawFromBox(instanceId) {
    if (team.length >= 6) {
      return {
        success: false,
        message: "Your active party is already full (6/6)! Deposit one first.",
      };
    }
    const target = box.find((p) => p.instanceId === instanceId);
    if (!target) return { success: false, message: "Pokémon not found in PC Box." };

    setBox((prev) => prev.filter((p) => p.instanceId !== instanceId));
    setTeam((prev) => [...prev, target]);
    return { success: true, message: `${target.nickname} joined your active party!` };
  }

  function releaseFromBox(instanceId) {
    const target = box.find((p) => p.instanceId === instanceId);
    setBox((prev) => prev.filter((p) => p.instanceId !== instanceId));
    return {
      success: true,
      message: `${target?.nickname || "Pokémon"} was released from PC Box.`,
    };
  }

  const value = {
    trainer,
    team,
    box,
    inventory,
    hasStarter,
    isMuted,
    toggleSound,
    chooseStarter,
    addToTeam,
    addToBox,
    removeFromTeam,
    healAllPokemon,
    getItemCount,
    getTotalItemCount,
    getInventoryList,
    applyItemToPokemon,
    applyPotion,
    useItemOnPokemon: applyItemToPokemon,
    usePotion: applyPotion,
    buyItem,
    sellItem,
    addLoot,
    renamePokemon,
    setTeamLeader,
    movePokemonInTeam,
    updatePokemonHp,
    damageTeamLeader,
    catchWildPokemon,
    gainExpToLeader,
    depositToBox,
    withdrawFromBox,
    releaseFromBox,
    addMoney,
    awardBadge,
    hasBadge,
    givePartyExp,
    setTrainerName,
    resetGameSession,
    hallOfFame,
    recordHallOfFame,
    pendingEvolution,
    triggerEvolution,
    completeEvolution,
    cancelEvolution,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

