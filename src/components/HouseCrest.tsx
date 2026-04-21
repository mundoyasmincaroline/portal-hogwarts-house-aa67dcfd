import { type House } from "@/lib/store";

const crests: Record<House, { img: string; bg: string }> = {
  gryffindor: { img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=80", bg: "from-red-900 via-red-800 to-amber-900" },
  slytherin: { img: "https://images.unsplash.com/photo-1531386151447-fd76ad500b2a?w=400&q=80", bg: "from-green-900 via-green-800 to-emerald-950" },
  ravenclaw: { img: "https://images.unsplash.com/photo-1433162653888-a571db5ccccf?w=400&q=80", bg: "from-blue-900 via-blue-800 to-indigo-950" },
  hufflepuff: { img: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&q=80", bg: "from-yellow-700 via-amber-600 to-stone-900" },
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
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-white/30 relative font-heading font-bold transition-transform hover:scale-105`}
      title={safeHouse.charAt(0).toUpperCase() + safeHouse.slice(1)}
    >
      <div className="absolute inset-0 bg-black/20 mix-blend-overlay z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-0" />
      <img src={c.img} alt={safeHouse} className="z-10 w-full h-full object-cover opacity-80 mix-blend-screen group-hover:scale-110 transition-transform" />
    </div>
  );
}
