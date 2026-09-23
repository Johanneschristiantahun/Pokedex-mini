import SearchForm from "../components/SearchForm.jsx";
import PokemonList from "../components/PokemonList.jsx";

function ListPage() {
  return (
    <div className="list-page">
      <div className="hero-banner">
        <h1 className="hero-title">PokéDex Encyclopedia</h1>
        <p className="hero-subtitle">
          Explore animated sprites, authentic stats, sound effects, and all 9
          generations from the Pokémon universe.
        </p>
      </div>

      <SearchForm />
      <PokemonList />
    </div>
  );
}

export default ListPage;
