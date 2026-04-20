import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";

interface Props {
  userId: string;
  isOwner?: boolean; // true = o próprio membro vendo sua ficha
}

const HOUSE_LABELS: Record<string, string> = {
  gryffindor: "🦁 Gryffindor",
  slytherin:  "🐍 Slytherin",
  ravenclaw:  "🦅 Ravenclaw",
  hufflepuff: "🦡 Hufflepuff",
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-heading">{label}</p>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="font-heading text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-1">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function CharacterSheetView({ userId, isOwner }: Props) {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChar, setActiveChar] = useState(0);

  useEffect(() => {
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at")
      .then(({ data }) => {
        if (data) setCharacters(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p className="text-center text-muted-foreground py-8 text-sm">Consultando registros do Ministério...</p>;

  if (characters.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3">📜</div>
        <p className="text-muted-foreground text-sm">
          {isOwner ? "Você ainda não registrou nenhuma ficha de personagem." : "Este membro não registrou fichas ainda."}
        </p>
      </div>
    );
  }

  const char = characters[activeChar];

  return (
    <div className="space-y-4">
      {/* Tab selector se tiver mais de 1 ficha */}
      {characters.length > 1 && (
        <div className="flex gap-2">
          {characters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveChar(i)}
              className={`px-4 py-1.5 rounded-full text-xs font-heading transition-colors ${
                i === activeChar
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary border border-transparent"
              }`}
            >
              {c.character_type === "oc" ? "⭐ OC" : "📖 Canon"}: {c.full_name || "—"}
            </button>
          ))}
        </div>
      )}

      {/* Ficha Card */}
      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        {/* Header com foto */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="shrink-0">
              <SafeImage
                src={char.avatar_url}
                alt={char.full_name}
                fallbackEmoji="🧙"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-primary/30 shadow-xl"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <span className="text-xs uppercase tracking-widest text-primary/70 font-heading">
                  {char.character_type === "oc" ? "⭐ Personagem Original (OC)" : "📖 Personagem Canon (Saga)"}
                </span>
              </div>
              <h2 className="font-heading text-2xl text-foreground">{char.full_name}</h2>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                {char.house && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {HOUSE_LABELS[char.house] || char.house}
                  </span>
                )}
                {char.age && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.age} anos
                  </span>
                )}
                {char.gender && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.gender === "female" ? "Feminino" : "Masculino"}
                  </span>
                )}
                {char.age_category && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.age_category === "student" ? "Aluno(a)" : "Adulto(a)"}
                  </span>
                )}
                {char.adult_job && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.adult_job}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
                <span>Nível <strong className="text-primary">{char.level || 1}</strong></span>
                <span><strong className="text-primary">{char.xp || 0}</strong> XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo da ficha */}
        <div className="p-6 space-y-6">

          {/* Dados Básicos */}
          <Section title="📋 Dados Básicos">
            <Field label="Status Sanguíneo" value={char.blood_status} />
            <Field label="Faceclaim (Ator / Atriz)" value={char.actor_faceclaim} />
            <Field label="Instagram do Personagem" value={char.instagram} />
          </Section>

          {/* Magia */}
          <Section title="🪄 Magia & Habilidades">
            <Field label="Varinha" value={char.wand} />
            <Field label="Patrono" value={char.patronus} />
            <Field label="Feitiço Favorito" value={char.favorite_spell} />
            <Field label="Matéria Favorita" value={char.favorite_class} />
          </Section>

          {/* Personalidade */}
          {char.personality && (
            <div className="space-y-2">
              <h4 className="font-heading text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-1">🧠 Personalidade</h4>
              <p className="text-sm text-foreground/90 leading-relaxed italic">{char.personality}</p>
            </div>
          )}

          {/* Pontos & Medos */}
          <Section title="⚖️ Pontos Forte, Fraco & Medos">
            <Field label="Ponto Forte" value={char.strength} />
            <Field label="Ponto Fraco" value={char.weakness} />
            <Field label="Medos" value={char.fears} />
            <Field label="Sonhos" value={char.dreams} />
          </Section>

          {/* Segredos & Quotes */}
          {(char.secrets || char.quotes) && (
            <Section title="🔐 Segredos & Citações">
              <div className="sm:col-span-2 space-y-3">
                {char.secrets && (
                  <div className="bg-secondary/40 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-heading mb-1">Segredos</p>
                    <p className="text-sm text-foreground/90 italic">{char.secrets}</p>
                  </div>
                )}
                {char.quotes && (
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-[10px] uppercase tracking-widest text-primary/70 font-heading mb-1">Citações</p>
                    <p className="text-sm text-foreground/90 italic">"{char.quotes}"</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Família */}
          {(char.family_mother || char.family_father || char.family_siblings || char.family_relatives) && (
            <Section title="👨‍👩‍👧 Família">
              <Field label="Mãe" value={char.family_mother} />
              <Field label="Pai" value={char.family_father} />
              <Field label="Irmãos" value={char.family_siblings} />
              <Field label="Outros Parentes" value={char.family_relatives} />
            </Section>
          )}

          {/* Pet */}
          {(char.pet || char.pet_name) && (
            <Section title="🦉 Pet / Familiar">
              <Field label="Tipo de Pet" value={char.pet} />
              <Field label="Nome do Pet" value={char.pet_name} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
