// ========================================================
// PokéSphere Dexter Talking Pokédex Voice Engine
// Powered by HTML5 Web Speech Synthesis API
// Provides authentic robotic voice narration for Pokémon entries
// ========================================================

let currentUtterance = null;

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakPokemonEntry(pokemon, onStart, onEnd) {
  if (!isSpeechSupported()) {
    console.warn("Web Speech API not supported in this browser.");
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const name = pokemon.nickname || pokemon.name;
  const types = (pokemon.types || []).join(" and ");
  const flavor = pokemon.description || `${name} is a powerful ${types} type Pokémon discovered in the Kanto region.`;

  const script = `${name}. The ${types} Pokémon. ${flavor}`;

  const utterance = new SpeechSynthesisUtterance(script);
  currentUtterance = utterance;

  // Dexter voice pitch and rate
  utterance.pitch = 0.95;
  utterance.rate = 1.05;
  utterance.lang = "en-US";

  // Attempt to select robotic / clear English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("David"))) || voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = () => {
      currentUtterance = null;
      onEnd();
    };
    utterance.onerror = () => {
      currentUtterance = null;
      onEnd();
    };
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking() {
  return isSpeechSupported() && (window.speechSynthesis.speaking || currentUtterance !== null);
}
