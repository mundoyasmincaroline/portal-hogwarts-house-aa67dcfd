import { type House } from "@/lib/store";

const crests: Record<House, { letter: string; bg: string }> = {
  gryffindor: { letter: "G", bg: "from-gryffindor to-gryffindor-gold" },
  slytherin: { letter: "S", bg: "from-slytherin to-slytherin-silver" },
  ravenclaw: { letter: "R", bg: "from-ravenclaw to-ravenclaw-bronze" },
  hufflepuff: { letter: "H", bg: "from-hufflepuff to-hufflepuff-black" },
};

export default function HouseCrest({ house, size = "md" }: { house: House; size?: "sm" | "md" | "lg" }) {
  const safeHouse = house || "gryffindor";
  const c = crests[safeHouse] || crests.gryffindor;
  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-20 h-20 text-5xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-white/30 relative font-heading font-bold text-white transition-transform hover:scale-105`}
      title={safeHouse.charAt(0).toUpperCase() + safeHouse.slice(1)}
    >
      <div className="absolute inset-0 bg-black/20 mix-blend-overlay z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-0" />
      <span className="z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest">{c.letter}</span>
    </div>
  );
}
