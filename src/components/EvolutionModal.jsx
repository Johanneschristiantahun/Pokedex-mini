// ========================================================
// PokéDex Mini Authentic Cinematic Evolution Cutscene
// Pulsing Silhouette Transformation, Cancel [B] Mechanism,
// Official Web Audio Chimes, and Stat Boost Preview
// ========================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { evolvePokemonInstance } from "../utils/pokemonFactory.js";
import {
  capitalize,
  getAnimatedSpriteUrl,
  getAnimatedShinySpriteUrl,
  playPokemonCry,
} from "../utils.js";
import {
  playEvolutionPulseSound,
  playEvolutionJingle,
  playCancelSound,
} from "../utils/soundEffects.js";
import { IconSparkles, IconCheck, IconX } from "./Icons.jsx";

export default function EvolutionModal({ pendingEvolution, onComplete, onCancel }) {
  if (!pendingEvolution) return null;

  return (
    <EvolutionCutscene
      pendingEvolution={pendingEvolution}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}

function EvolutionCutscene({ pendingEvolution, onComplete, onCancel }) {
  const { pokemon, targetEvo } = pendingEvolution;

  // Evolution Phases: "INTRO" | "PULSING" | "FLASH" | "COMPLETE" | "CANCELLED"
  const [phase, setPhase] = useState("PULSING");
  const [displaySilhouette, setDisplaySilhouette] = useState(0); // 0 = pre-evo, 1 = post-evo
  const [flashScreen, setFlashScreen] = useState(false);
  const [evolvedResult, setEvolvedResult] = useState(null);

  const pulseTimerRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const evolutionTimeoutRef = useRef(null);

  // Pre-calculate evolved form stats for comparison
  const preStats = {
    hp: pokemon.maxHp,
    attack: pokemon.attack,
    defense: pokemon.defense,
    spAttack: pokemon.spAttack,
    spDefense: pokemon.spDefense,
    speed: pokemon.speed,
  };

  const evolvedInst = useMemo(
    () => evolvePokemonInstance(pokemon, targetEvo),
    [pokemon, targetEvo]
  );

  const statDiffs = {
    hp: evolvedInst.maxHp - preStats.hp,
    attack: evolvedInst.attack - preStats.attack,
    defense: evolvedInst.defense - preStats.defense,
    spAttack: evolvedInst.spAttack - preStats.spAttack,
    spDefense: evolvedInst.spDefense - preStats.spDefense,
    speed: evolvedInst.speed - preStats.speed,
  };

  const targetId = targetEvo.targetId;

  useEffect(() => {
    let speedMs = 380;
    let flip = 0;
    let activePulseTimer = null;
    let activeEvolutionTimeout = null;

    // Start pulsating loop
    const runPulse = () => {
      activePulseTimer = setTimeout(() => {
        pulseTimerRef.current = activePulseTimer;
        flip = flip === 0 ? 1 : 0;
        setDisplaySilhouette(flip);
        playEvolutionPulseSound();

        // Accelerate pulse frequency
        speedMs = Math.max(90, speedMs * 0.88);
        runPulse();
      }, speedMs);
      pulseTimerRef.current = activePulseTimer;
    };

    runPulse();

    // 4.2 seconds evolution duration
    activeEvolutionTimeout = setTimeout(() => {
      clearTimeout(activePulseTimer);

      // Trigger white flash
      setPhase("FLASH");
      setFlashScreen(true);

      setTimeout(() => {
        setFlashScreen(false);
        setPhase("COMPLETE");
        setEvolvedResult(evolvedInst);
        playEvolutionJingle();
        playPokemonCry(targetId);
      }, 500);
    }, 4200);
    evolutionTimeoutRef.current = activeEvolutionTimeout;

    return () => {
      clearTimeout(activePulseTimer);
      clearTimeout(activeEvolutionTimeout);
    };
  }, [evolvedInst, targetId]);

  function handleCancelEvolution() {
    clearTimeout(pulseTimerRef.current);
    clearInterval(soundIntervalRef.current);
    clearTimeout(evolutionTimeoutRef.current);

    setPhase("CANCELLED");
    playCancelSound();

    setTimeout(() => {
      if (onCancel) onCancel();
    }, 1800);
  }

  function handleFinish() {
    if (onComplete && evolvedResult) {
      onComplete(evolvedResult);
    }
  }

  const isShiny = Boolean(pokemon.isShiny);
  const currentSpriteId = displaySilhouette === 0 ? pokemon.id : targetEvo.targetId;
  const currentSpriteUrl = isShiny
    ? getAnimatedShinySpriteUrl(currentSpriteId)
    : getAnimatedSpriteUrl(currentSpriteId);

  return (
    <div className="evolution-modal-backdrop">
      {/* Intense White Screen Flash Transition */}
      {flashScreen && <div className="evolution-flash-overlay"></div>}

      <div className="evolution-modal-chamber">
        {/* Background Energy Vortex Rays */}
        <div className="evolution-aura-ring ring-outer"></div>
        <div className="evolution-aura-ring ring-inner"></div>

        {/* Phase 1 & Phase 2: PULSING (In Progress) */}
        {(phase === "PULSING" || phase === "FLASH") && (
          <div className="evolution-scene-wrap">
            <div className="evolution-banner-pill">
              <IconSparkles size={16} />
              <span>EVOLUTION IN PROGRESS</span>
            </div>

            <h2 className="evolution-main-title">
              What? <strong>{pokemon.nickname.toUpperCase()}</strong> is evolving!
            </h2>

            {/* Glowing Silhouette Transforming Sprite */}
            <div className="evolution-sprite-stage">
              <div className="evolution-podium-shadow"></div>
              <img
                src={currentSpriteUrl}
                alt="Evolving Pokémon"
                className="evolution-pulsing-silhouette"
                onError={(e) => {
                  e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentSpriteId}.png`;
                }}
              />
            </div>

            <p className="evolution-hint-text">
              Hold tight! Your companion is channeling latent evolutionary energy...
            </p>

            {/* Interactive Cancel [ B ] Button */}
            <button
              type="button"
              onClick={handleCancelEvolution}
              className="btn-cancel-evolution"
              title="Cancel evolution and keep original form"
            >
              <span className="key-b-badge">B</span>
              <span>Cancel Evolution</span>
            </button>
          </div>
        )}

        {/* Phase 3: CANCELLED */}
        {phase === "CANCELLED" && (
          <div className="evolution-scene-wrap anim-fade-in">
            <div className="evolution-banner-pill pill-cancelled">
              <IconX size={16} />
              <span>EVOLUTION HALTED</span>
            </div>

            <h2 className="evolution-main-title">
              Huh? <strong>{pokemon.nickname}</strong> stopped evolving!
            </h2>

            <div className="evolution-sprite-stage">
              <img
                src={
                  isShiny
                    ? getAnimatedShinySpriteUrl(pokemon.id)
                    : getAnimatedSpriteUrl(pokemon.id)
                }
                alt={pokemon.nickname}
                className="evolution-normal-sprite"
              />
            </div>

            <p className="evolution-hint-text">
              Evolution cancelled. {pokemon.nickname} will remain in its current form!
            </p>
          </div>
        )}

        {/* Phase 4: COMPLETE (Success Celebration) */}
        {phase === "COMPLETE" && evolvedResult && (
          <div className="evolution-scene-wrap anim-reveal-evolved">
            <div className="evolution-banner-pill pill-success">
              <IconCheck size={16} />
              <span>EVOLUTION COMPLETE!</span>
            </div>

            <h2 className="evolution-main-title">
              Congratulations! Your {capitalize(pokemon.name)} evolved into{" "}
              <span className="evolved-name-highlight">
                {capitalize(targetEvo.targetName)}
              </span>
              !
            </h2>

            {/* Radiant Evolved Sprite with Sparkles */}
            <div className="evolution-sprite-stage">
              <div className="evolution-podium-glow"></div>
              <img
                src={
                  isShiny
                    ? getAnimatedShinySpriteUrl(targetEvo.targetId)
                    : getAnimatedSpriteUrl(targetEvo.targetId)
                }
                alt={targetEvo.targetName}
                className="evolution-revealed-sprite"
                onError={(e) => {
                  e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${targetEvo.targetId}.png`;
                }}
              />
            </div>

            {/* Type Capsules */}
            <div className="evolution-types-row">
              {evolvedResult.types?.map((t) => (
                <span key={t} className={`evolution-type-tag type-${t}`}>
                  {t.toUpperCase()}
                </span>
              ))}
            </div>

            {/* Stat Boosts Diff Grid */}
            <div className="evolution-stat-diff-card">
              <h4 className="stat-card-title">Power Growth & Attributes Boost:</h4>
              <div className="stat-diff-grid">
                <div className="stat-diff-item">
                  <span className="stat-diff-label">MAX HP</span>
                  <span className="stat-diff-val">
                    {evolvedResult.maxHp}{" "}
                    <strong className="stat-diff-plus">+{statDiffs.hp}</strong>
                  </span>
                </div>
                <div className="stat-diff-item">
                  <span className="stat-diff-label">ATTACK</span>
                  <span className="stat-diff-val">
                    {evolvedResult.attack}{" "}
                    <strong className="stat-diff-plus">+{statDiffs.attack}</strong>
                  </span>
                </div>
                <div className="stat-diff-item">
                  <span className="stat-diff-label">DEFENSE</span>
                  <span className="stat-diff-val">
                    {evolvedResult.defense}{" "}
                    <strong className="stat-diff-plus">+{statDiffs.defense}</strong>
                  </span>
                </div>
                <div className="stat-diff-item">
                  <span className="stat-diff-label">SP. ATK</span>
                  <span className="stat-diff-val">
                    {evolvedResult.spAttack}{" "}
                    <strong className="stat-diff-plus">+{statDiffs.spAttack}</strong>
                  </span>
                </div>
                <div className="stat-diff-item">
                  <span className="stat-diff-label">SP. DEF</span>
                  <span className="stat-diff-val">
                    {evolvedResult.spDefense}{" "}
                    <strong className="stat-diff-plus">+{statDiffs.spDefense}</strong>
                  </span>
                </div>
                <div className="stat-diff-item">
                  <span className="stat-diff-label">SPEED</span>
                  <span className="stat-diff-val">
                    {evolvedResult.speed}{" "}
                    <strong className="stat-diff-plus">+{statDiffs.speed}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm & Return Button */}
            <button
              type="button"
              onClick={handleFinish}
              className="btn-finish-evolution"
            >
              <span>Continue Adventure</span>
              <IconSparkles size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
