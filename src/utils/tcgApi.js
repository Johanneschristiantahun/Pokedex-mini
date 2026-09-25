// ========================================================
// PokéSphere Pokémon Trading Card Game (TCG) API Integration
// Powered by Pokémon TCG API (pokemontcg.io)
// Fetches real collectible holographic cards for each Pokémon
// ========================================================

const TCG_CACHE = new Map();

export async function fetchPokemonTcgCards(pokedexNumber) {
  if (!pokedexNumber) return [];

  const cacheKey = `tcg_${pokedexNumber}`;
  if (TCG_CACHE.has(cacheKey)) {
    return TCG_CACHE.get(cacheKey);
  }

  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=nationalPokedexNumbers:${pokedexNumber}&pageSize=6&orderBy=-set.releaseDate`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`TCG API responded with ${res.status}`);
    }

    const data = await res.json();
    const cards = (data.data || []).map((c) => ({
      id: c.id,
      name: c.name,
      supertype: c.supertype,
      subtypes: c.subtypes || [],
      hp: c.hp,
      types: c.types || [],
      rarity: c.rarity || "Common",
      artist: c.artist || "Ken Sugimori",
      setName: c.set?.name || "Pokémon TCG",
      series: c.set?.series || "Classic",
      releaseDate: c.set?.releaseDate || "1999/01/09",
      imageSmall: c.images?.small,
      imageLarge: c.images?.large,
      marketPriceUsd: c.cardmarket?.prices?.averageSellPrice || c.tcgplayer?.prices?.holofoil?.market || null,
    }));

    TCG_CACHE.set(cacheKey, cards);
    return cards;
  } catch (err) {
    console.warn(`Failed to fetch TCG cards for #${pokedexNumber}:`, err);
    return [];
  }
}
