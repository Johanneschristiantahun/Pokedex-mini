import { getTypeColor, capitalize } from "../utils.js";

function TypeBadge({ type, size = "md" }) {
  if (!type) return null;
  const theme = getTypeColor(type);

  return (
    <span
      className={`type-badge type-badge-${size}`}
      style={{
        backgroundColor: theme.primary,
        color: theme.text,
      }}
    >
      {capitalize(type)}
    </span>
  );
}

export default TypeBadge;
