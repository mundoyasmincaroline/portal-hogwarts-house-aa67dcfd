import { type House } from "@/lib/store";

const crests: Record<House, { letter: string; bg: string }> = {
  gryffindor: { letter: "G", bg: "from-gryffindor to-gryffindor-gold" },
  slytherin: { letter: "S", bg: "from-slytherin to-slytherin-silver" },
  ravenclaw: { letter: "R", bg: "from-ravenclaw to-ravenclaw-bronze" },
  hufflepuff: { letter: "H", bg: "from-hufflepuff to-hufflepuff-black" },
};

export default function HouseCrest({ house, size = "md" }: { house: House; size?: "xs" | "sm" | "md" | "lg" }) {
  const safeHouse = house || "gryffindor";
  const c = crests[safeHouse] || crests.gryffindor;
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-lg",
    md: "w-14 h-14 text-3xl",
    lg: "w-24 h-24 text-6xl",
  };

  const roundingClasses = {
    xs: "rounded-lg",
    sm: "rounded-[0.8rem]",
    md: "rounded-[1.5rem]",
    lg: "rounded-[2.5rem]",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${roundingClasses[size]} bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden border-t-2 border-white/40 border-l-2 border-white/20 relative font-heading font-bold transition-all duration-500 hover:scale-110 hover:shadow-[0_20px_45px_rgba(0,0,0,0.8)] group`}
      title={safeHouse.charAt(0).toUpperCase() + safeHouse.slice(1)}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/30 z-0" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      <span className="z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] tracking-[0.1em] text-white brightness-125 group-hover:scale-110 transition-transform">{c.letter}</span>
    </div>
  );
}
