import { NavLink, Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import {
  IconBook,
  IconParty,
  IconBackpack,
  IconTrees,
  IconScale,
  IconSwords,
  IconCrown,
  IconCoin,
  IconVolume,
  IconVolumeMute,
  IconDungeon,
  IconTower,
} from "./Icons.jsx";

function Navbar() {
  const { trainer, team, getTotalItemCount, isMuted, toggleSound } = useGame();
  const totalItemCount = getTotalItemCount();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="pokeball-icon">
            <div className="pokeball-top"></div>
            <div className="pokeball-center"></div>
            <div className="pokeball-bottom"></div>
          </div>
          <div className="brand-text">
            <span className="brand-title">PokéSphere</span>
            <span className="brand-tag">RPG & Dex</span>
          </div>
        </Link>

        <nav className="navbar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconBook size={17} />
            <span className="nav-label">PokéDex</span>
          </NavLink>

          <NavLink
            to="/team"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconParty size={17} />
            <span className="nav-label">My Team</span>
            <span className="nav-team-count">{team.length}/6</span>
          </NavLink>

          <NavLink
            to="/bag"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconBackpack size={17} />
            <span className="nav-label">Bag & Mart</span>
            <span className="nav-bag-count">{totalItemCount}</span>
          </NavLink>

          <NavLink
            to="/wilderness"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconTrees size={17} />
            <span className="nav-label">Wilderness</span>
            <span className="nav-badge nav-badge-live">Live</span>
          </NavLink>

          <NavLink
            to="/gym"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconSwords size={17} />
            <span className="nav-label">Gym Arena</span>
            <span className="nav-badge nav-badge-live">Live</span>
          </NavLink>

          <NavLink
            to="/league"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconCrown size={17} />
            <span className="nav-label">League</span>
            <span className="nav-badge nav-badge-champ">Elite 4</span>
          </NavLink>

          <NavLink
            to="/dungeons"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconDungeon size={17} />
            <span className="nav-label">Dungeons</span>
            <span className="nav-badge nav-badge-dungeon">Raids</span>
          </NavLink>

          <NavLink
            to="/tower"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconTower size={17} />
            <span className="nav-label">Tower</span>
            <span className="nav-badge nav-badge-tower">Endless</span>
          </NavLink>

          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <IconScale size={17} />
            <span className="nav-label">Compare</span>
            <span className="nav-badge nav-badge-live">Live</span>
          </NavLink>

          {/* Money Pill Indicator */}
          <Link to="/bag" className="navbar-money-pill" title="Trainer PokéDollars - Click to open Poké Mart">
            <IconCoin size={15} className="money-coin-svg" />
            <span className="money-amount">
              ₽ {trainer.money.toLocaleString()}
            </span>
          </Link>

          {/* Master Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`navbar-sound-btn ${isMuted ? "sound-muted" : "sound-active"}`}
            title={isMuted ? "Sound: Muted (Click to enable retro audio)" : "Sound: Active (Click to mute)"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <IconVolumeMute size={16} /> : <IconVolume size={16} />}
            <span className="sound-btn-tooltip">{isMuted ? "Muted" : "Audio"}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
