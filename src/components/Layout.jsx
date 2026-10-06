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
          <p>
            <strong>PokéDex Mini</strong> • Web & Mobile Application Development Project
          </p>
          <p className="footer-sub">
            Built with React, Vite & PokéAPI. Sprites & Pokémon are copyright of Nintendo / Game Freak.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
