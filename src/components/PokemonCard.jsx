import { useState } from "react";
import { Link } from "react-router-dom";
import TypeBadge from "./TypeBadge.jsx";
import { IconVolume } from "./Icons.jsx";
import {
  getIdFromUrl,
  formatPokemonId,
  capitalize,
  getAnimatedSpriteUrl,
  getSpriteUrl,
  playPokemonCry,
  getTypeColor,
} from "../utils.js";

function PokemonCard({ pokemon, details, genId }) {
  const id = pokemon.id || getIdFromUrl(pokemon.url);
  const types = details?.types?.map((t) => t.type.name) || pokemon.types || [];
  const primaryType = types[0] || "normal";
  const theme = getTypeColor(primaryType);

  const [imgSrc, setImgSrc] = useState(getAnimatedSpriteUrl(id));
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  function handleImageError() {
    setImgSrc(getSpriteUrl(id));
  }

  function handlePlayCry(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsPlayingAudio(true);
    playPokemonCry(id);
    setTimeout(() => setIsPlayingAudio(false), 1200);
  }

  function handleCardClick() {
    // Save scroll position and active generation for restoration
    sessionStorage.setItem("pokedex_scroll_pos", window.scrollY.toString());
    if (genId) {
      sessionStorage.setItem("pokedex_last_gen_id", genId.toString());
    }
  }

  return (
    <Link
      to={`/pokemon/${pokemon.name}`}
      onClick={handleCardClick}
      className="pokemon-card"
      style={{
        "--type-accent": theme.primary,
        "--type-bg": theme.bg,
      }}
    >
      <div className="card-top">
        <span className="card-id">{formatPokemonId(id)}</span>
        <button
          type="button"
          onClick={handlePlayCry}
          className={`cry-button ${isPlayingAudio ? "playing" : ""}`}
          title="Play Pokémon Cry"
          aria-label={`Play ${pokemon.name} cry sound`}
        >
          <IconVolume size={14} />
        </button>
      </div>

      <div className="card-sprite-container">
        <img
          className="card-animated-sprite"
          src={imgSrc}
          alt={pokemon.name}
          loading="lazy"
          onError={handleImageError}
        />
      </div>

      <div className="card-info">
        <h3 className="card-name">{capitalize(pokemon.name)}</h3>
        {types.length > 0 && (
          <div className="card-types">
            {types.map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default PokemonCard;
