import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PokemonCard from "./PokemonCard.jsx";
import { API_BASE_URL, GENERATIONS } from "../config.js";
import {
  TYPE_COLORS,
  capitalize,
  genDataCache,
  pokemonDetailCache,
  formatPokemonId,
} from "../utils.js";
import { IconSearch, IconX, IconAlertTriangle } from "./Icons.jsx";

const BATCH_SIZE = 24;

const ALL_GEN = {
  id: "all",
  name: "All Generations",
  offset: 0,
  limit: 1025,
  region: "National Dex",
};

function PokemonList() {
  const navigate = useNavigate();
  // Restore previously selected generation from session if available
  const savedGenId = sessionStorage.getItem("pokedex_last_gen_id");
  const initialGen =
    savedGenId === "all"
      ? ALL_GEN
      : GENERATIONS.find((g) => g.id.toString() === savedGenId) || GENERATIONS[0];

  const [selectedGen, setSelectedGen] = useState(initialGen);
  const [selectedType, setSelectedType] = useState("all");
  const [liveQuery, setLiveQuery] = useState("");
  const [sortBy, setSortBy] = useState("id-asc");
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
      const cached = genDataCache[selectedGen.id];
      queueMicrotask(() => {
        if (!isCurrent) return;
        setPokemons(cached.pokemons);
        setOffset(cached.offset);
        setIsLoading(false);
        setError(null);
      });
      return () => {
        isCurrent = false;
      };
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

  function handleGenChange(e) {
    const value = e.target.value;
    sessionStorage.setItem("pokedex_last_gen_id", value);
    if (value === "all") {
      setSelectedGen(ALL_GEN);
    } else {
      const found = GENERATIONS.find((g) => g.id.toString() === value);
      if (found) setSelectedGen(found);
    }
    setSelectedType("all");
    setLiveQuery("");
  }

  // Filter by Type & Live Query (Name or ID)
  const cleanQuery = liveQuery.trim().toLowerCase();
  const queryDigitsOnly = cleanQuery.replace(/^#/, "").replace(/^0+/, "");

  const filteredPokemons = pokemons.filter((p) => {
    // 1. Type filter
    if (selectedType !== "all") {
      const types = p.types?.map((t) => t.type?.name || t) || [];
      if (!types.includes(selectedType)) return false;
    }

    // 2. Live text filter (Name or ID)
    if (cleanQuery !== "") {
      const nameMatches = p.name.toLowerCase().includes(cleanQuery);
      const pIdStr = p.id ? p.id.toString() : "";
      const idMatches =
        pIdStr === cleanQuery ||
        (queryDigitsOnly !== "" && pIdStr === queryDigitsOnly) ||
        formatPokemonId(p.id).toLowerCase().includes(cleanQuery);
      return nameMatches || idMatches;
    }

    return true;
  });

  // Sort filtered pokemons based on selected sort criteria
  const sortedPokemons = [...filteredPokemons].sort((a, b) => {
    if (sortBy === "id-asc" || sortBy === "id_asc") {
      return (a.id || 0) - (b.id || 0);
    }
    if (sortBy === "id-desc" || sortBy === "id_desc") {
      return (b.id || 0) - (a.id || 0);
    }
    if (sortBy === "name-asc" || sortBy === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "name-desc" || sortBy === "name_desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (sortBy === "bst-desc" || sortBy === "bst_desc") {
      const bstA =
        a.stats?.reduce((sum, s) => sum + (s.base_stat || 0), 0) || 0;
      const bstB =
        b.stats?.reduce((sum, s) => sum + (s.base_stat || 0), 0) || 0;
      return bstB - bstA;
    }
    if (sortBy === "atk-desc" || sortBy === "atk_desc") {
      const atkA =
        a.stats?.find((s) => s.stat?.name === "attack")?.base_stat || 0;
      const atkB =
        b.stats?.find((s) => s.stat?.name === "attack")?.base_stat || 0;
      return atkB - atkA;
    }
    if (sortBy === "spd-desc" || sortBy === "spd_desc") {
      const spdA =
        a.stats?.find((s) => s.stat?.name === "speed")?.base_stat || 0;
      const spdB =
        b.stats?.find((s) => s.stat?.name === "speed")?.base_stat || 0;
      return spdB - spdA;
    }
    return 0;
  });

  function handleInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = liveQuery.trim().toLowerCase();
      if (!q) return;
      if (sortedPokemons.length > 0) {
        navigate(`/pokemon/${sortedPokemons[0].name}`);
      } else {
        navigate(`/pokemon/${q}`);
      }
    }
  }

  const maxOffset = selectedGen.offset + selectedGen.limit;
  const hasMore = offset < maxOffset;

  return (
    <section className="pokedex-section">
      {/* Consolidated Control Bar */}
      <section className="pokedex-controls-section pokedex-controls">
        <div className="control-bar">
          <div className="search-wrapper">
            <IconSearch size={16} className="search-input-icon" />
            <input
              type="text"
              id="pokedex-search"
              value={liveQuery}
              onChange={(e) => setLiveQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search Pokémon by name or #..."
              aria-label="Search Pokémon by name or ID"
            />
            {liveQuery && (
              <button
                type="button"
                onClick={() => setLiveQuery("")}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          <div className="filter-wrapper">
            <select
              id="generation-filter"
              value={selectedGen.id}
              onChange={handleGenChange}
              aria-label="Filter by Generation"
            >
              <option value="all">All Generations</option>
              {GENERATIONS.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {gen.name}
                </option>
              ))}
            </select>

            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by Type"
            >
              <option value="all">All Types</option>
              {Object.keys(TYPE_COLORS).map((typeKey) => (
                <option key={typeKey} value={typeKey}>
                  {capitalize(typeKey)}
                </option>
              ))}
            </select>

            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort Pokémon"
            >
              <option value="id-asc">Pokédex # (Lowest)</option>
              <option value="id-desc">Pokédex # (Highest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="bst-desc">Total Base Stats (BST)</option>
              <option value="atk-desc">Highest Attack</option>
              <option value="spd-desc">Highest Speed</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Count Meta */}
      <div className="pokedex-meta-bar">
        <span className="results-count-text">
          Showing <strong>{sortedPokemons.length}</strong> of{" "}
          <strong>{pokemons.length}</strong> Pokémon
          {selectedGen.id !== "all" ? ` in ${selectedGen.name}` : ""}
          {selectedType !== "all" ? ` (${capitalize(selectedType)} type)` : ""}
        </span>
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
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                {liveQuery.trim() && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/pokemon/${liveQuery.trim().toLowerCase()}`)
                    }
                    className="btn-primary"
                  >
                    Search "{liveQuery}" Globally in PokéDex →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("all");
                    setLiveQuery("");
                  }}
                  className="btn-secondary"
                >
                  Reset All Filters
                </button>
              </div>
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

          {/* Load More Button */}
          {hasMore && selectedType === "all" && liveQuery === "" && (
            <div className="load-more-container">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="btn-load-more"
              >
                {isLoadingMore
                  ? "Loading more Pokémon…"
                  : `Load More ${selectedGen.region} Pokémon (${
                      selectedGen.limit - offset
                    } remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default PokemonList;
