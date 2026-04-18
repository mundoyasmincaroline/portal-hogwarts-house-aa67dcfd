import { type House } from "@/lib/store";

const crests: Record<House, { emoji: string; bg: string }> = {
  gryffindor: { emoji: "🦁", bg: "from-gryffindor to-gryffindor-gold" },
  slytherin: { emoji: "🐍", bg: "from-slytherin to-slytherin-silver" },
  ravenclaw: { emoji: "🦅", bg: "from-ravenclaw to-ravenclaw-bronze" },
  hufflepuff: { emoji: "🦡", bg: "from-hufflepuff to-hufflepuff-black" },
};

export default function HouseCrest({ house, size = "md" }: { house: House; size?: "sm" | "md" | "lg" }) {
  const c = crests[house] || crests.gryffindor;
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-xl",
    lg: "w-20 h-20 text-4xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg`}
    >
      <span>{c.emoji}</span>
    </div>
  );
}
