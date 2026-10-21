const dots = ["#eb1c52", "#f58a1f", "#f5c518", "#6bb04a", "#2f8fd8", "#7b4aa3"];

/** Marca provisória: roseta de pontos + nome. Trocar pelo logo oficial quando houver o vetor. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        {dots.map((color, i) => {
          const angle = (i / dots.length) * Math.PI * 2;
          return (
            <circle
              key={color}
              cx={14 + Math.cos(angle) * 9}
              cy={14 + Math.sin(angle) * 9}
              r={3.2}
              fill={color}
            />
          );
        })}
      </svg>
      <span className="font-display text-2xl font-bold text-forest">VerTintas</span>
    </span>
  );
}
