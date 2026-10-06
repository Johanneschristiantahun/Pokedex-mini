import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-sub">
            PokéDex • Powered by PokéAPI. Pokémon and Pokémon character names are trademarks of Nintendo.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
