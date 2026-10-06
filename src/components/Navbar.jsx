import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import TrainerPassportModal from "./TrainerPassportModal.jsx";
import {
  IconBook,
  IconParty,
  IconBackpack,
  IconTrees,
  IconScale,
  IconSwords,
  IconCrown,
  IconVolume,
  IconVolumeMute,
  IconDungeon,
  IconTower,
  IconTrophy,
  IconChevronDown,
} from "./Icons.jsx";

function Navbar() {
  const { trainer, team, getTotalItemCount, isMuted, toggleSound } = useGame();
  const [showPassport, setShowPassport] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const totalItemCount = getTotalItemCount();

  const gameModePaths = [
    "/wilderness",
    "/gym",
    "/battle",
    "/league",
    "/championship",
    "/dungeons",
    "/tower",
    "/compare",
    "/link",
    "/pvp",
  ];
  const isGameModeActive = gameModePaths.some((path) =>
    location.pathname.startsWith(path)
  );



  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            <span className="brand-title">PokéDex</span>
          </div>
        </Link>

        <nav className="navbar-nav" aria-label="Main Navigation">
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

          {/* Unified Game Modes Dropdown */}
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`nav-dropdown-trigger ${
                isDropdownOpen || isGameModeActive ? "active" : ""
              }`}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <IconSwords size={16} />
              <span className="nav-label">Game Modes</span>
              <IconChevronDown
                size={14}
                className={`dropdown-chevron ${isDropdownOpen ? "open" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div
                className="nav-dropdown-menu"
                role="menu"
                onClick={() => setIsDropdownOpen(false)}
              >
                <div className="dropdown-section-header">Challenges & Battle</div>

                <NavLink
                  to="/wilderness"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconTrees size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Wilderness</span>
                    <span className="dropdown-item-desc">
                      Catch wild Pokémon across biomes
                    </span>
                  </div>
                </NavLink>

                <NavLink
                  to="/gym"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconSwords size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Gym Arena</span>
                    <span className="dropdown-item-desc">
                      Battle 8 Regional Gym Leaders
                    </span>
                  </div>
                </NavLink>

                <NavLink
                  to="/league"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconCrown size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Pokémon League</span>
                    <span className="dropdown-item-desc">
                      Elite Four & Champion Tournament
                    </span>
                  </div>
                </NavLink>

                <NavLink
                  to="/dungeons"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconDungeon size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Dungeons & Raids</span>
                    <span className="dropdown-item-desc">
                      Boss encounters and ancient relics
                    </span>
                  </div>
                </NavLink>

                <NavLink
                  to="/tower"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconTower size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Battle Tower</span>
                    <span className="dropdown-item-desc">
                      Endless streak battle challenge
                    </span>
                  </div>
                </NavLink>

                <div className="dropdown-divider"></div>
                <div className="dropdown-section-header">Tools & Multiplayer</div>

                <NavLink
                  to="/compare"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconScale size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Stat Comparison</span>
                    <span className="dropdown-item-desc">
                      Compare stats and type match-ups
                    </span>
                  </div>
                </NavLink>

                <NavLink
                  to="/link"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  role="menuitem"
                >
                  <IconSwords size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">PvP Link Battle</span>
                    <span className="dropdown-item-desc">
                      Multiplayer tab-to-tab battle
                    </span>
                  </div>
                </NavLink>

                <button
                  type="button"
                  onClick={() => {
                    setShowPassport(true);
                    setIsDropdownOpen(false);
                  }}
                  className="dropdown-item dropdown-btn-item"
                  role="menuitem"
                >
                  <IconTrophy size={16} />
                  <div className="dropdown-item-text">
                    <span className="dropdown-item-title">Trainer Passport</span>
                    <span className="dropdown-item-desc">
                      Badges, stats & trainer ID
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Utility Bar */}
        <div className="navbar-actions">
          {/* Money Pill Indicator */}
          <Link
            to="/bag"
            className="navbar-money-pill"
            title="Trainer Balance"
          >
            <span className="navbar-money-currency">₽</span>
            <span className="money-amount">
              {trainer.money.toLocaleString()}
            </span>
          </Link>

          {/* Master Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`navbar-sound-btn ${
              isMuted ? "sound-muted" : "sound-active"
            }`}
            title={isMuted ? "Unmute audio" : "Mute audio"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <IconVolumeMute size={16} /> : <IconVolume size={16} />}
          </button>
        </div>
      </div>

      <TrainerPassportModal
        isOpen={showPassport}
        onClose={() => setShowPassport(false)}
      />
    </header>
  );
}

export default Navbar;
