import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconSearch, IconX } from "./Icons.jsx";

function SearchForm() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    const name = query.trim().toLowerCase();

    if (name === "") {
      setError("Please type a Pokémon name or number first.");
      return;
    }

    setError(null);
    navigate(`/pokemon/${name}`);
  }

  function handleQuickSearch(name) {
    navigate(`/pokemon/${name.toLowerCase()}`);
  }

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-bar-form">
        <div className="search-input-wrapper">
          <IconSearch size={18} className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Search by name or number (e.g. Pikachu, 6, Mewtwo)…"
            className="search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="search-clear-btn"
              aria-label="Clear search"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-search">
          Search
        </button>
      </form>

      {error && <p className="status status-error">{error}</p>}

      {/* Quick Search Chips */}
      <div className="quick-search-chips">
        <span className="quick-label">Trending:</span>
        {["Pikachu", "Charizard", "Gengar", "Lucario", "Mewtwo", "Eevee"].map(
          (name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleQuickSearch(name)}
              className="chip-btn"
            >
              {name}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default SearchForm;
