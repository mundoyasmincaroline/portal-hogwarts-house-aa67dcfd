import { type House } from "@/lib/store";

const crests: Record<House, { img: string; bg: string }> = {
  gryffindor: { img: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Blason_Gryffondor.svg", bg: "from-gryffindor to-gryffindor-gold" },
  slytherin: { img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Blason_Serpentard.svg", bg: "from-slytherin to-slytherin-silver" },
  ravenclaw: { img: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Blason_Serdaigle.svg", bg: "from-ravenclaw to-ravenclaw-bronze" },
  hufflepuff: { img: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Blason_Poufsouffle.svg", bg: "from-hufflepuff to-hufflepuff-black" },
};

export default function HouseCrest({ house, size = "md" }: { house: House; size?: "sm" | "md" | "lg" }) {
  const c = crests[house] || crests.gryffindor;
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20 relative`}
      title={house.charAt(0).toUpperCase() + house.slice(1)}
    >
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay z-0" />
      <img src={c.img} alt={`${house} crest`} className="w-[80%] h-[80%] object-contain drop-shadow-md z-10" />
    </div>
  );
}
