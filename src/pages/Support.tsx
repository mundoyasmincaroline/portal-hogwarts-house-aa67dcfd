import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import MagicalParticles from "@/components/MagicalParticles";
import { toast } from "sonner";
import { LifeBuoy, ArrowLeft, CheckCircle2 } from "lucide-react";

const ticketSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  subject: z.string().trim().min(3, "Assunto muito curto").max(150),
  category: z.string().min(1),
  message: z.string().trim().min(10, "Conte um pouco mais (mín. 10 caracteres)").max(2000),
});

export default function Support() {
  const [form, setForm] = useState({
    name: "", email: "", subject: "", category: "geral", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = ticketSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_tickets").insert({
      ...parsed.data,
      user_id: user?.id ?? null,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar chamado. Tente novamente.");
      return;
    }
    setSent(true);
    toast.success("Chamado enviado à equipe Hogwarts House! ✦");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={new URL('../assets/hogwarts_night.png', import.meta.url).href}
          alt="Hogwarts"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.10),_transparent_55%)]" />
      </div>
      <MagicalParticles />

      <div className="glass-premium relative z-20 w-full max-w-2xl rounded-[2rem] p-8 md:p-10 border-primary/30 bg-background/85 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.95)]">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft size={14} /> Voltar ao início
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <LifeBuoy className="text-primary" size={26} />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-gold-gradient mb-2">Suporte Hogwarts</h1>
          <p className="text-sm text-muted-foreground">
            Conte o que aconteceu — nossa equipe responde em até 24h.
          </p>
        </div>

        {sent ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 className="mx-auto text-green-500" size={56} />
            <h2 className="font-heading text-2xl text-gold-gradient">Sua coruja foi enviada!</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Recebemos seu chamado. A equipe administrativa entrará em contato pelo e-mail informado.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", category: "geral", message: "" }); }}>
                Enviar outro chamado
              </Button>
              <Link to="/login">
                <Button variant="magical">Ir para o login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-muted-foreground block mb-1">Seu nome</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Como podemos te chamar?"
                  maxLength={100}
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-heading text-muted-foreground block mb-1">E-mail</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                  maxLength={255}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-muted-foreground block mb-1">Categoria</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acesso">Problemas de acesso / login</SelectItem>
                    <SelectItem value="conta">Minha conta</SelectItem>
                    <SelectItem value="bug">Reportar um bug</SelectItem>
                    <SelectItem value="pagamento">Pagamentos & Galeões</SelectItem>
                    <SelectItem value="denuncia">Denunciar usuário</SelectItem>
                    <SelectItem value="sugestao">Sugestão / Ideia</SelectItem>
                    <SelectItem value="geral">Outro assunto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-heading text-muted-foreground block mb-1">Assunto</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Resumo em uma linha"
                  maxLength={150}
                />
                {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Mensagem</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva com detalhes o que está acontecendo..."
                rows={6}
                maxLength={2000}
                className="resize-none"
              />
              <div className="flex justify-between mt-1">
                {errors.message ? <p className="text-destructive text-xs">{errors.message}</p> : <span />}
                <span className="text-xs text-muted-foreground">{form.message.length}/2000</span>
              </div>
            </div>

            <Button type="submit" variant="magical" className="w-full font-heading" disabled={loading}>
              {loading ? "Enviando coruja..." : "Enviar chamado"}
            </Button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Atendimento: 24h em dias úteis · Privacidade garantida ✦
            </p>
          </form>
        )}
      </div>
    </div>
  );
}