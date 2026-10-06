import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { STARTER_POKEMON } from "../utils/pokemonFactory.js";
import TypeBadge from "./TypeBadge.jsx";
import { IconPokeball, IconSparkles } from "./Icons.jsx";
import { capitalize } from "../utils.js";

function StarterModal() {
  const { hasStarter, chooseStarter } = useGame();
  const [selectedStarter, setSelectedStarter] = useState(STARTER_POKEMON[1]); // Charmander default
  const [nickname, setNickname] = useState("");
  const [isOpen, setIsOpen] = useState(!hasStarter);

  if (hasStarter || !isOpen) return null;

  function handleConfirm() {
    chooseStarter(selectedStarter, nickname);
    setIsOpen(false);
  }

  return (
    <div className="modal-backdrop">
      <div className="starter-modal">
        {/* Header */}
        <div className="starter-modal-header">
          <div className="oak-badge">
            <IconPokeball size={14} />
            <span>Professor Oak's Laboratory</span>
          </div>
          <h2>Choose Your Starter Pokémon</h2>
          <p className="starter-subtitle">
            Select your initial companion to begin your journey.
          </p>
        </div>

        {/* 4 Starter Choice Cards */}
        <div className="starter-grid">
          {STARTER_POKEMON.map((starter) => {
            const isSelected = selectedStarter.id === starter.id;

            return (
              <button
                type="button"
                key={starter.id}
                onClick={() => {
                  setSelectedStarter(starter);
                  setNickname("");
                }}
                className={`starter-card ${isSelected ? "starter-card-selected" : ""}`}
                aria-pressed={isSelected}
              >
                <div className="starter-sprite-box">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${starter.id}.gif`}
                    alt={starter.name}
                    className="starter-animated-gif"
                  />
                </div>
                <h4 className="starter-name">{capitalize(starter.name)}</h4>
                <span className="starter-genus">{starter.genus}</span>
                <div className="starter-types">
                  {starter.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Starter Preview & Nickname */}
        <div className="starter-customization-box">
          <div className="starter-stat-summary">
            <span>HP: <strong>{selectedStarter.baseStats.hp}</strong></span>
            <span>Atk: <strong>{selectedStarter.baseStats.attack}</strong></span>
            <span>Def: <strong>{selectedStarter.baseStats.defense}</strong></span>
            <span>Speed: <strong>{selectedStarter.baseStats.speed}</strong></span>
          </div>

          <div className="starter-nickname-input-box">
            <label htmlFor="starter-nickname">
              Give <strong>{capitalize(selectedStarter.name)}</strong> a nickname (optional):
            </label>
            <input
              id="starter-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={`e.g. ${capitalize(selectedStarter.name)}`}
              maxLength={14}
              className="nickname-field"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="starter-actions">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-secondary btn-skip"
          >
            Explore Pokédex First
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary btn-choose-starter"
          >
            <span>Choose {nickname.trim() || capitalize(selectedStarter.name)}</span>
            <IconSparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default StarterModal;
