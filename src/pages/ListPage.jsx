import PokemonList from "../components/PokemonList.jsx";

function ListPage() {
  return (
    <div className="list-page">
      <div className="hero-banner">
        <h1 className="hero-title">PokéDex</h1>
        <p className="hero-subtitle">
          Explore complete data, animated sprites, and stats across all 9 generations.
        </p>
      </div>

      <PokemonList />
    </div>
  );
}

export default ListPage;
