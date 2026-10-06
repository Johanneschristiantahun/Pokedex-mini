import { useState } from "react";
import { Link } from "react-router-dom";
import TypeBadge from "./TypeBadge.jsx";
import { IconVolume2 } from "./Icons.jsx";
import {
  getIdFromUrl,
  formatPokemonId,
  capitalize,
  getAnimatedSpriteUrl,
  getSpriteUrl,
  playPokemonCry,
} from "../utils.js";

function PokemonCard({ pokemon, details, genId }) {
  const id = pokemon.id || getIdFromUrl(pokemon.url);
  const types =
    details?.types?.map((t) => t.type?.name || t) || pokemon.types || [];

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
    >
      <div className="card-header">
        <span className="card-id">{formatPokemonId(id)}</span>
        <button
          type="button"
          onClick={handlePlayCry}
          className={`card-audio-btn ${isPlayingAudio ? "playing" : ""}`}
          title="Play Pokémon Cry"
          aria-label={`Play ${pokemon.name} cry sound`}
        >
          <IconVolume2 size={15} />
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
