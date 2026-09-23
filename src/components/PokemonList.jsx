import { useState, useEffect, useRef } from "react";
import PokemonCard from "./PokemonCard.jsx";
import { API_BASE_URL, GENERATIONS } from "../config.js";
import {
  TYPE_COLORS,
  capitalize,
  genDataCache,
  pokemonDetailCache,
  formatPokemonId,
} from "../utils.js";
import { IconSparkles, IconX, IconAlertTriangle } from "./Icons.jsx";

const BATCH_SIZE = 24;

function PokemonList() {
  // Restore previously selected generation from session if available
  const savedGenId = sessionStorage.getItem("pokedex_last_gen_id");
  const initialGen =
    GENERATIONS.find((g) => g.id.toString() === savedGenId) || GENERATIONS[0];

  const [selectedGen, setSelectedGen] = useState(initialGen);
  const [selectedType, setSelectedType] = useState("all");
  const [liveQuery, setLiveQuery] = useState("");
  const [sortBy, setSortBy] = useState("id_asc");
  const [pokemons, setPokemons] = useState(
    () => genDataCache[initialGen.id]?.pokemons || []
  );
  const [offset, setOffset] = useState(
    () => genDataCache[initialGen.id]?.offset || initialGen.offset
  );
  const [isLoading, setIsLoading] = useState(
    () => !genDataCache[initialGen.id]
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const isRestoringScroll = useRef(false);

  // Restore scroll position after list renders
  useEffect(() => {
    const savedPos = sessionStorage.getItem("pokedex_scroll_pos");
    if (savedPos && pokemons.length > 0 && !isRestoringScroll.current) {
      isRestoringScroll.current = true;
      requestAnimationFrame(() => {
        window.scrollTo({
          top: parseInt(savedPos, 10),
          behavior: "instant",
        });
        sessionStorage.removeItem("pokedex_scroll_pos");
      });
    }
  }, [pokemons]);

  // When Generation changes
  useEffect(() => {
    let isCurrent = true;

    // Check cache first for 0ms instant load
    if (genDataCache[selectedGen.id]) {
      setPokemons(genDataCache[selectedGen.id].pokemons);
      setOffset(genDataCache[selectedGen.id].offset);
      setIsLoading(false);
      setError(null);
      return;
    }

    async function fetchGenInitial() {
      setIsLoading(true);
      setError(null);
      setPokemons([]);
      setOffset(selectedGen.offset);

      try {
        const fetchLimit = Math.min(BATCH_SIZE, selectedGen.limit);
        const res = await fetch(
          `${API_BASE_URL}/pokemon?limit=${fetchLimit}&offset=${selectedGen.offset}`
        );

        if (!res.ok) {
          throw new Error(`Failed to load Pokémon (Status: ${res.status})`);
        }

        const data = await res.json();

        // Fetch details in parallel with cache check
        const detailedList = await Promise.all(
          data.results.map(async (item) => {
            if (pokemonDetailCache[item.name]) {
              return pokemonDetailCache[item.name];
            }
            try {
              const detailRes = await fetch(item.url);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                pokemonDetailCache[item.name] = detailData;
                return detailData;
              }
            } catch {}
            return { name: item.name, url: item.url, types: [] };
          })
        );

        if (isCurrent) {
          const nextOffset = selectedGen.offset + fetchLimit;
          setPokemons(detailedList);
          setOffset(nextOffset);

          // Save to in-memory cache
          genDataCache[selectedGen.id] = {
            pokemons: detailedList,
            offset: nextOffset,
          };
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    fetchGenInitial();

    return () => {
      isCurrent = false;
    };
  }, [selectedGen]);

  // Load More handler
  async function handleLoadMore() {
    const maxOffset = selectedGen.offset + selectedGen.limit;
    if (offset >= maxOffset) return;

    setIsLoadingMore(true);
    const remaining = maxOffset - offset;
    const nextLimit = Math.min(BATCH_SIZE, remaining);

    try {
      const res = await fetch(
        `${API_BASE_URL}/pokemon?limit=${nextLimit}&offset=${offset}`
      );
      if (!res.ok) throw new Error("Failed to load more Pokémon.");

      const data = await res.json();
      const detailedList = await Promise.all(
        data.results.map(async (item) => {
          if (pokemonDetailCache[item.name]) {
            return pokemonDetailCache[item.name];
          }
          try {
            const detailRes = await fetch(item.url);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              pokemonDetailCache[item.name] = detailData;
              return detailData;
            }
          } catch {}
          return { name: item.name, url: item.url, types: [] };
        })
      );

      const updatedList = [...pokemons, ...detailedList];
      const nextOffset = offset + nextLimit;

      setPokemons(updatedList);
      setOffset(nextOffset);

      // Update in-memory cache
      genDataCache[selectedGen.id] = {
        pokemons: updatedList,
        offset: nextOffset,
      };
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Filter by Type & Live Query (Name or ID)
  const cleanQuery = liveQuery.trim().toLowerCase();

  const filteredPokemons = pokemons.filter((p) => {
    // 1. Type filter
    if (selectedType !== "all") {
      const types = p.types?.map((t) => t.type?.name || t) || [];
      if (!types.includes(selectedType)) return false;
    }

    // 2. Live text filter
    if (cleanQuery !== "") {
      const nameMatches = p.name.toLowerCase().includes(cleanQuery);
      const idMatches =
        p.id?.toString() === cleanQuery ||
        formatPokemonId(p.id).toLowerCase().includes(cleanQuery);
      return nameMatches || idMatches;
    }

    return true;
  });

  // Sort filtered pokemons based on selected sort criteria
  const sortedPokemons = [...filteredPokemons].sort((a, b) => {
    if (sortBy === "id_asc") {
      return (a.id || 0) - (b.id || 0);
    }
    if (sortBy === "id_desc") {
      return (b.id || 0) - (a.id || 0);
    }
    if (sortBy === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "bst_desc") {
      const bstA =
        a.stats?.reduce((sum, s) => sum + (s.base_stat || 0), 0) || 0;
      const bstB =
        b.stats?.reduce((sum, s) => sum + (s.base_stat || 0), 0) || 0;
      return bstB - bstA;
    }
    if (sortBy === "atk_desc") {
      const atkA =
        a.stats?.find((s) => s.stat?.name === "attack")?.base_stat || 0;
      const atkB =
        b.stats?.find((s) => s.stat?.name === "attack")?.base_stat || 0;
      return atkB - atkA;
    }
    if (sortBy === "spd_desc") {
      const spdA =
        a.stats?.find((s) => s.stat?.name === "speed")?.base_stat || 0;
      const spdB =
        b.stats?.find((s) => s.stat?.name === "speed")?.base_stat || 0;
      return spdB - spdA;
    }
    return 0;
  });

  const maxOffset = selectedGen.offset + selectedGen.limit;
  const hasMore = offset < maxOffset;

  return (
    <section className="pokedex-section">
      {/* Generation Tabs */}
      <div className="gen-tabs-container">
        <div className="gen-tabs-scroll">
          {GENERATIONS.map((gen) => (
            <button
              key={gen.id}
              onClick={() => {
                sessionStorage.setItem("pokedex_last_gen_id", gen.id.toString());
                setSelectedGen(gen);
                setSelectedType("all");
                setLiveQuery("");
              }}
              className={`gen-tab ${selectedGen.id === gen.id ? "gen-tab-active" : ""}`}
            >
              {gen.name}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="type-filters-container">
        <button
          onClick={() => setSelectedType("all")}
          className={`type-filter-pill ${selectedType === "all" ? "active" : ""}`}
        >
          All Types
        </button>
        {Object.keys(TYPE_COLORS).map((typeKey) => (
          <button
            key={typeKey}
            onClick={() => setSelectedType(typeKey)}
            className={`type-filter-pill ${selectedType === typeKey ? "active" : ""}`}
            style={{
              "--pill-color": TYPE_COLORS[typeKey].primary,
            }}
          >
            {capitalize(typeKey)}
          </button>
        ))}
      </div>

      {/* Live Grid Filter, Sort & Generation Info Bar */}
      <div className="grid-controls-bar">
        <div className="live-filter-wrapper">
          <IconSparkles size={16} className="live-filter-icon" />
          <input
            type="text"
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            placeholder={`Filter ${selectedGen.region} list (e.g. "pika", "025")…`}
            className="live-filter-input"
          />
          {liveQuery && (
            <button
              type="button"
              onClick={() => setLiveQuery("")}
              className="live-clear-btn"
              aria-label="Clear filter"
            >
              <IconX size={14} />
            </button>
          )}
        </div>

        <div className="grid-right-controls">
          <div className="sort-control-wrap">
            <span className="sort-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select-dropdown"
              aria-label="Sort Pokémon list"
            >
              <option value="id_asc">Pokédex # (Lowest)</option>
              <option value="id_desc">Pokédex # (Highest)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="bst_desc">Total Base Stats (BST)</option>
              <option value="atk_desc">Highest Attack</option>
              <option value="spd_desc">Highest Speed</option>
            </select>
          </div>

          <div className="gen-info-bar">
            <span>
              <strong>{sortedPokemons.length}</strong> / {pokemons.length}
            </span>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="pokemon-grid">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton-id"></div>
              <div className="skeleton-sprite"></div>
              <div className="skeleton-name"></div>
              <div className="skeleton-types"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="error-box">
          <p className="status status-error">
            <IconAlertTriangle size={18} /> {error}
          </p>
          <button
            onClick={() => setSelectedGen({ ...selectedGen })}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pokemon Grid */}
      {!isLoading && !error && (
        <>
          {sortedPokemons.length === 0 ? (
            <div className="empty-state">
              <p>
                No Pokémon match your filter criteria in {selectedGen.name}.
              </p>
              <button
                onClick={() => {
                  setSelectedType("all");
                  setLiveQuery("");
                }}
                className="btn-secondary"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="pokemon-grid">
              {sortedPokemons.map((pokemon) => (
                <PokemonCard
                  key={pokemon.name}
                  pokemon={pokemon}
                  details={pokemon}
                  genId={selectedGen.id}
                />
              ))}
            </div>
          )}

          {/* Load More Button (Hidden if actively filtering) */}
          {hasMore && selectedType === "all" && liveQuery === "" && (
            <div className="load-more-container">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="btn-load-more"
              >
                {isLoadingMore
                  ? "Loading more Pokémon…"
                  : `Load More ${selectedGen.region} Pokémon (${selectedGen.limit - offset} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default PokemonList;
