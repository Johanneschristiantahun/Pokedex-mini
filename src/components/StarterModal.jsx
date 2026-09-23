import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { STARTER_POKEMON } from "../utils/pokemonFactory.js";
import TypeBadge from "./TypeBadge.jsx";
import { IconPokeball, IconSparkles } from "./Icons.jsx";
import { capitalize, getTypeColor } from "../utils.js";

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

  const theme = getTypeColor(selectedStarter.type);

  return (
    <div className="modal-backdrop">
      <div className="starter-modal">
        {/* Header */}
        <div className="starter-modal-header">
          <div className="oak-badge">
            <IconPokeball size={15} />
            <span>Professor Oak's Lab</span>
          </div>
          <h2>Choose Your Starter Pokémon!</h2>
          <p className="starter-subtitle">
            Every great journey begins with a trusted partner. Select your first companion to lead your team!
          </p>
        </div>

        {/* 4 Starter Choice Cards */}
        <div className="starter-grid">
          {STARTER_POKEMON.map((starter) => {
            const isSelected = selectedStarter.id === starter.id;
            const cardTheme = getTypeColor(starter.type);

            return (
              <div
                key={starter.id}
                onClick={() => {
                  setSelectedStarter(starter);
                  setNickname("");
                }}
                className={`starter-card ${isSelected ? "starter-card-selected" : ""}`}
                style={{
                  "--type-color": cardTheme.primary,
                  "--type-bg": cardTheme.bg,
                }}
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
              </div>
            );
          })}
        </div>

        {/* Selected Starter Preview & Nickname */}
        <div className="starter-customization-box">
          <div className="starter-preview-info">
            <p className="starter-desc">"{selectedStarter.description}"</p>
            <div className="starter-stat-summary">
              <span>HP: <strong>{selectedStarter.baseStats.hp}</strong></span>
              <span>Atk: <strong>{selectedStarter.baseStats.attack}</strong></span>
              <span>Def: <strong>{selectedStarter.baseStats.defense}</strong></span>
              <span>Speed: <strong>{selectedStarter.baseStats.speed}</strong></span>
            </div>
          </div>

          <div className="starter-nickname-input-box">
            <label htmlFor="starter-nickname">
              Give <strong>{capitalize(selectedStarter.name)}</strong> a Nickname (Optional):
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
            className="btn-skip"
          >
            Explore PokéDex First
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-choose-starter"
            style={{
              backgroundColor: theme.primary,
            }}
          >
            <span>I Choose You, {nickname.trim() || capitalize(selectedStarter.name)}!</span>
            <IconSparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default StarterModal;
