import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { type House, HOUSES } from "@/lib/store";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import MagicalParticles from "@/components/MagicalParticles";
import { supabase } from "@/integrations/supabase/client";
import AcceptanceLetter from "@/components/AcceptanceLetter";
import { Sparkles, Feather, Droplet, Wand2, ArrowLeft } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   CADASTRO-RITO  ✦  Cinematic onboarding
   7 telas-pergunta. Cada escolha é guardada e ressurge no
   primeiro CharacterCreation como rascunho de Ficha #1.
   ──────────────────────────────────────────────────────────── */

const WAND_WOODS = [
  { id: "carvalho", label: "Carvalho", hint: "Lealdade, força" },
  { id: "azevinho", label: "Azevinho", hint: "Coragem, proteção" },
  { id: "videira", label: "Videira", hint: "Intuição rara" },
  { id: "teixo", label: "Teixo", hint: "Vida e morte" },
  { id: "olmo", label: "Olmo", hint: "Elegância, dignidade" },
  { id: "salgueiro", label: "Salgueiro", hint: "Cura, instinto" },
];
const WAND_CORES = [
  { id: "fenix", label: "Pena de Fênix", hint: "Rara. Escolhe pouquíssimos." },
  { id: "dragao", label: "Corda de Coração de Dragão", hint: "Poder bruto, lealdade." },
  { id: "unicornio", label: "Crina de Unicórnio", hint: "Pura, fiel ao primeiro dono." },
];
const BLOODS = [
  { id: "pure-blood",  label: "Puro-sangue",     desc: "Toda sua família é bruxa, há gerações." },
  { id: "half-blood",  label: "Mestiço(a)",      desc: "Magia e mundo trouxa misturados no seu sangue." },
  { id: "muggle-born", label: "Nascido(a)-trouxa", desc: "Você é o primeiro bruxo da família. A coruja foi um espanto." },
];

export default function Register() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);

  const [step, setStep] = useState(0); // 0=convocação ... 6=carta
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "", username: "", age: "", email: "", password: "",
    referralCode: "", avatarUrl: "",
    house: "" as House | "",
    blood: "" as string,
    wandWood: "" as string,
    wandCore: "" as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captcha] = useState({ num1: Math.floor(Math.random() * 10) + 1, num2: Math.floor(Math.random() * 10) + 1 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const totalSteps = 6; // não conta a carta final
  const houses = Object.values(HOUSES);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  /* ── validações por etapa ── */
  const validateIdentity = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Como devemos te chamar?";
    if (!form.username.trim()) e.username = "Escolha um @";
    if (form.username.includes(" ")) e.username = "Sem espaços";
    if (!form.email.trim()) e.email = "Email é obrigatório";
    if (!form.password || form.password.length < 6) e.password = "Mínimo 6 caracteres";
    const a = parseInt(form.age);
    if (!a || a < 13 || a > 17) e.age = "Apenas bruxos de 13 a 17 anos";
    if (parseInt(captchaAnswer) !== captcha.num1 + captcha.num2) e.captcha = "Resposta incorreta";
    setErrors(e);
    return !Object.keys(e).length;
  };

  /* ── envio final ── */
  const handleSubmit = async () => {
    setLoading(true);
    const result = await register({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      username: form.username,
      age: parseInt(form.age),
      house: form.house as House,
      avatarUrl: form.avatarUrl || undefined,
    });

    if (result.success && avatarFile) {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (signInData?.user) {
          const ext = avatarFile.name.split(".").pop();
          const path = `${signInData.user.id}/avatar.${ext}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
            await supabase.from("profiles").update({ avatar_url: `${publicUrl}?t=${Date.now()}` } as never).eq("user_id", signInData.user.id);
          }
          await supabase.auth.signOut();
        }
      } catch { /* ignore */ }
    }

    setLoading(false);
    if (!result.success) {
      toast.error(result.error || "Erro ao criar conta");
      setErrors({ general: result.error || "Erro ao criar conta" });
      return;
    }

    // Rito guardado pra primeira ficha (CharacterCreation lê como rascunho)
    localStorage.setItem("pending_character_draft", JSON.stringify({
      blood_status: form.blood,
      wand_wood: form.wandWood,
      wand_core: form.wandCore,
      house: form.house,
    }));
    if (form.referralCode.trim()) {
      localStorage.setItem("pending_referral", form.referralCode.trim().toLowerCase().replace("@", ""));
    }
    setStep(6); // carta de aceitação
  };

  /* ── moldura cinematográfica ── */
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1547756536-cde3673fa2e5?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-20 grayscale scale-110" alt="" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/85 to-blue-950/40" />
      </div>
      <MagicalParticles />

      <div key={step} className="relative z-20 w-full max-w-xl animate-fade-in-up">
        {/* Progress bar discreta — some na convocação e na carta */}
        {step > 0 && step < 6 && (
          <div className="flex justify-center gap-1.5 mb-6">
            {Array.from({ length: totalSteps - 1 }).map((_, i) => (
              <div key={i} className={`h-0.5 w-10 rounded-full transition-all ${i + 1 <= step ? "bg-primary" : "bg-white/15"}`} />
            ))}
          </div>
        )}

        <div className="glass rounded-[2rem] p-8 md:p-10 border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">

          {/* ─── STEP 0 — CONVOCAÇÃO ─── */}
          {step === 0 && (
            <div className="text-center space-y-6 py-6">
              <Feather className="w-12 h-12 mx-auto text-primary opacity-80" />
              <h1 className="font-heading text-3xl md:text-4xl text-gold-gradient leading-tight">
                Uma coruja chegou.
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                Não é por acaso que você está aqui. O castelo abre uma vaga
                e quer saber quem você é — antes de qualquer feitiço.
              </p>
              <p className="text-xs text-primary/70 italic">São sete passos. Respire.</p>
              <Button variant="magical" className="font-heading mt-4" onClick={next}>
                Abrir a carta <Sparkles className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ─── STEP 1 — IDENTIDADE ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <header className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Pergaminho I</p>
                <h2 className="font-heading text-2xl text-foreground">Quem responde a esta coruja?</h2>
              </header>

              <Field label="Nome completo" error={errors.fullName}>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Seu nome de batismo" className="bg-secondary/50" />
              </Field>
              <Field label="@ Como te chamarão no castelo" error={errors.username}>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} placeholder="seu_username" className="bg-secondary/50" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" error={errors.email}>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" className="bg-secondary/50" />
                </Field>
                <Field label="Senha" error={errors.password}>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6+ caracteres" className="bg-secondary/50" />
                </Field>
              </div>
              <Field label="Idade (13–17)" error={errors.age}>
                <Input type="number" min={13} max={17} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Quantos anos você tem?" className="bg-secondary/50" />
              </Field>

              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20">
                <label className="text-xs text-primary/80 block mb-1.5">🛡️ Prove que não é um trasgo: {captcha.num1} + {captcha.num2} = ?</label>
                <Input type="number" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} placeholder="…" className="bg-secondary/50 h-9" />
                {errors.captcha && <p className="text-destructive text-xs mt-1">{errors.captcha}</p>}
              </div>

              <NavRow onBack={back} onNext={() => validateIdentity() && next()} />
            </div>
          )}

          {/* ─── STEP 2 — FRASCO DE SANGUE ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <header>
                <Droplet className="w-8 h-8 text-primary mb-2" />
                <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Pergaminho II</p>
                <h2 className="font-heading text-2xl text-foreground">O Frasco de Sangue</h2>
                <p className="text-sm text-muted-foreground mt-1">De onde sua magia vem?</p>
              </header>
              <div className="space-y-2">
                {BLOODS.map((b) => (
                  <button key={b.id} onClick={() => setForm({ ...form, blood: b.id })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${form.blood === b.id ? "border-primary bg-primary/10 shadow-[0_0_30px_-10px_hsl(var(--primary))]" : "border-white/10 bg-secondary/30 hover:border-white/30"}`}>
                    <p className="font-heading text-foreground">{b.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </button>
                ))}
              </div>
              <NavRow onBack={back} onNext={next} disabled={!form.blood} />
            </div>
          )}

          {/* ─── STEP 3 — VARINHA ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <header>
                <Wand2 className="w-8 h-8 text-primary mb-2" />
                <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Pergaminho III</p>
                <h2 className="font-heading text-2xl text-foreground">A varinha escolhe o bruxo</h2>
                <p className="text-sm text-muted-foreground mt-1">Mas sussurre o que te chama.</p>
              </header>

              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Madeira</p>
                <div className="grid grid-cols-2 gap-2">
                  {WAND_WOODS.map((w) => (
                    <button key={w.id} onClick={() => setForm({ ...form, wandWood: w.id })}
                      className={`p-3 rounded-lg border text-left transition-all ${form.wandWood === w.id ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/30 hover:border-white/30"}`}>
                      <p className="text-sm font-heading text-foreground">{w.label}</p>
                      <p className="text-[10px] text-muted-foreground">{w.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Núcleo</p>
                <div className="space-y-2">
                  {WAND_CORES.map((c) => (
                    <button key={c.id} onClick={() => setForm({ ...form, wandCore: c.id })}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${form.wandCore === c.id ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/30 hover:border-white/30"}`}>
                      <p className="text-sm font-heading text-foreground">{c.label}</p>
                      <p className="text-[10px] text-muted-foreground">{c.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <NavRow onBack={back} onNext={next} disabled={!form.wandWood || !form.wandCore} />
            </div>
          )}

          {/* ─── STEP 4 — CHAPÉU SELETOR ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <header className="text-center">
                <p className="text-4xl mb-2">🎩</p>
                <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Pergaminho IV</p>
                <h2 className="font-heading text-2xl text-foreground">"Hmm… deixe-me ver."</h2>
                <p className="text-sm text-muted-foreground mt-1 italic">O Chapéu sussurra. Onde seu coração responde mais alto?</p>
              </header>
              <div className="grid grid-cols-2 gap-3">
                {houses.map((h) => (
                  <button key={h.id} onClick={() => setForm({ ...form, house: h.id })}
                    className={`glass rounded-xl p-4 text-center transition-all hover:scale-[1.02] ${form.house === h.id ? "ring-2 ring-primary animate-pulse-glow" : "ring-1 ring-white/5"}`}>
                    <HouseCrest house={h.id} size="md" />
                    <p className="font-heading text-sm mt-2 text-foreground">{h.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{h.motto}</p>
                  </button>
                ))}
              </div>
              <NavRow onBack={back} onNext={next} disabled={!form.house} />
            </div>
          )}

          {/* ─── STEP 5 — DETALHES FINAIS ─── */}
          {step === 5 && (
            <div className="space-y-5">
              <header>
                <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Pergaminho V</p>
                <h2 className="font-heading text-2xl text-foreground">Um rosto e um padrinho</h2>
                <p className="text-sm text-muted-foreground mt-1">Opcional. Você pode mudar depois.</p>
              </header>

              <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                <label className="text-xs text-muted-foreground block mb-3 uppercase tracking-widest">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🧙</span>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full text-xs py-2 px-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      📁 Fazer upload
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        if (f.size > 5 * 1024 * 1024) return toast.error("Imagem muito grande (máx 5MB)");
                        setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); setForm((p) => ({ ...p, avatarUrl: "" }));
                      }} />
                    <Input value={form.avatarUrl} onChange={(e) => { setForm({ ...form, avatarUrl: e.target.value }); setAvatarPreview(e.target.value); setAvatarFile(null); }} placeholder="Ou cole um link…" className="bg-secondary/50 text-xs h-8" />
                  </div>
                </div>
              </div>

              <Field label="Quem te chamou? (Código de convite)">
                <Input value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value })} placeholder="@harry" className="bg-secondary/50" />
              </Field>

              {errors.general && <p className="text-destructive text-sm font-bold bg-destructive/10 p-2 rounded-lg border border-destructive/20">{errors.general}</p>}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="font-heading" onClick={back}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                <Button variant="magical" className="flex-1 font-heading" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Selando a carta…" : "Selar e enviar coruja"}
                  <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 6 — CARTA FINAL ─── */}
          {step === 6 && (
            <AcceptanceLetter fullName={form.fullName} onContinue={() => navigate("/login")} />
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers internos ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

function NavRow({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled?: boolean }) {
  return (
    <div className="flex gap-3 pt-3">
      <Button variant="outline" className="font-heading" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />Voltar
      </Button>
      <Button variant="magical" className="flex-1 font-heading" onClick={onNext} disabled={disabled}>
        Continuar <Sparkles className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}