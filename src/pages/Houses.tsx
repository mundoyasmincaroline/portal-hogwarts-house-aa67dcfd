import { HOUSES, type House } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";

export default function Houses() {
  const sortedHouses = Object.values(HOUSES).sort((a, b) => b.points - a.points);
  const topHouse = sortedHouses[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">As Quatro Casas</h1>
        <p className="text-muted-foreground text-sm">Compita com sua casa e traga glória ao seu nome</p>
      </div>

      {/* Highlight */}
      <div className="glass rounded-2xl p-6 text-center animate-pulse-glow">
        <p className="text-xs font-heading text-primary tracking-widest uppercase mb-2">🏆 Casa da Semana</p>
        <HouseCrest house={topHouse.id as House} size="lg" />
        <h2 className="font-heading text-2xl text-foreground mt-3">{topHouse.name}</h2>
        <p className="text-primary font-heading text-lg">{topHouse.points} pontos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {sortedHouses.map((house, i) => (
          <div key={house.id} className="glass rounded-xl p-6 hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <HouseCrest house={house.id as House} size="md" />
              <div>
                <h3 className="font-heading text-lg text-foreground">{house.name}</h3>
                <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
              </div>
              <span className="ml-auto text-2xl font-heading text-primary">#{i + 1}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{house.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {house.traits.map((t) => (
                <span key={t} className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">{t}</span>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{house.members} membros</span>
              <span className="font-heading text-primary">{house.points} pts</span>
            </div>
            {/* Points bar */}
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(house.points / sortedHouses[0].points) * 100}%`,
                  background: house.colors.primary,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
