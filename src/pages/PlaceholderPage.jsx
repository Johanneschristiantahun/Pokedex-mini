import { Link } from "react-router-dom";
import { IconSparkles, IconArrowLeft } from "../components/Icons.jsx";

function PlaceholderPage({ title, stage, icon: IconComponent, description, features = [] }) {
  return (
    <div className="placeholder-container">
      <div className="placeholder-card">
        <div className="placeholder-icon-box">
          {typeof IconComponent === "function" ? (
            <IconComponent size={36} />
          ) : (
            IconComponent
          )}
        </div>
        <span className="placeholder-badge">Planned for {stage}</span>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-description">{description}</p>

        {features.length > 0 && (
          <div className="placeholder-features">
            <h4>Key Features in this Milestone:</h4>
            <ul>
              {features.map((feat, idx) => (
                <li key={idx}>
                  <IconSparkles size={14} className="feature-icon" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="placeholder-actions">
          <Link to="/" className="btn-primary">
            <IconArrowLeft size={16} />
            <span>Explore PokéDex</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
