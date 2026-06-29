import { Link } from "react-router-dom";

export const HakkivedaLogo = ({ variant = "green", size = "md" }) => {
  const colorMap = {
    green: "#0F5B3A",
    gold: "#C9A227",
    ivory: "#FAF8F3",
    charcoal: "#222222",
  };
  const c = colorMap[variant] || colorMap.green;
  const sizeMap = { sm: { w: 130, h: 34 }, md: { w: 170, h: 44 }, lg: { w: 220, h: 56 } };
  const s = sizeMap[size];
  return (
    <Link to="/" data-testid="hk-logo" className="inline-flex items-center gap-2 group" aria-label="HAKKIVEDA Home">
      <svg width={s.h} height={s.h} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" stroke={c} strokeWidth="1.2" />
        <path d="M24 10 C 18 18, 18 26, 24 36 C 30 26, 30 18, 24 10 Z" fill={c} opacity="0.9"/>
        <path d="M24 14 L 24 34" stroke="#C9A227" strokeWidth="0.6" opacity="0.85"/>
        <circle cx="24" cy="24" r="2.2" fill="#C9A227"/>
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className="font-serif tracking-[0.22em] font-semibold"
          style={{ color: c, fontSize: size === "sm" ? "1.05rem" : size === "lg" ? "1.7rem" : "1.3rem" }}
        >
          HAKKIVEDA
        </span>
        <span className="text-[9px] tracking-[0.32em] uppercase" style={{ color: variant === "ivory" ? "#FAF8F3" : "#6B8E23", opacity: 0.85 }}>
          Tribal · Ayurveda
        </span>
      </div>
    </Link>
  );
};
