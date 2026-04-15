import { MOCK_CHALLENGES } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Challenges() {
  const daily = MOCK_CHALLENGES.filter((c) => c.type === "daily");
  const weekly = MOCK_CHALLENGES.filter((c) => c.type === "weekly");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">Desafios & Missões</h1>
        <p className="text-muted-foreground text-sm">Complete desafios para ganhar XP e pontos para sua casa</p>
      </div>

      {/* Daily */}
      <div>
        <h2 className="font-heading text-lg text-foreground mb-3">📅 Missões Diárias</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {daily.map((c) => (
            <div key={c.id} className="glass rounded-xl p-5 hover:scale-[1.01] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-heading text-foreground">{c.title}</h3>
                <span className="text-xs font-heading bg-primary/20 text-primary px-2 py-1 rounded-full">{c.xpReward} XP</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
              <Button variant="magical" size="sm" className="font-heading text-xs w-full">
                Aceitar Desafio ⚡
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly */}
      <div>
        <h2 className="font-heading text-lg text-foreground mb-3">🏆 Desafios Semanais</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {weekly.map((c) => (
            <div key={c.id} className="glass rounded-xl p-5 ring-1 ring-primary/20 hover:scale-[1.01] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-heading text-foreground">{c.title}</h3>
                <span className="text-xs font-heading bg-primary/20 text-primary px-2 py-1 rounded-full">{c.xpReward} XP</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
              <Button variant="magical" size="sm" className="font-heading text-xs w-full">
                Participar do Desafio ⚔️
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* RPG Teaser */}
      <div className="glass rounded-2xl p-6 text-center animate-pulse-glow">
        <div className="text-4xl mb-3">🪄</div>
        <h2 className="font-heading text-xl text-gold-gradient mb-2">Eventos RPG</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Em breve, eventos RPG ao vivo onde cada membro assume seu personagem! Prepare-se para duelos, poções e aventuras no castelo.
        </p>
      </div>
    </div>
  );
}
