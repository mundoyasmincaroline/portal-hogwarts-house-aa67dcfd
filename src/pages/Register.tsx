import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../lib/auth";
import { type House, HOUSES } from "@/lib/store";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import MagicalParticles from "@/components/MagicalParticles";
import { supabase } from "@/integrations/supabase/client";
import AcceptanceLetter from "@/components/AcceptanceLetter";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    fullName: "", username: "", age: "", house: "" as House | "", email: "", password: "", referralCode: "", avatarUrl: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Captcha State
  const [captchaParams, setCaptchaParams] = useState({ num1: Math.floor(Math.random() * 10) + 1, num2: Math.floor(Math.random() * 10) + 1 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Nome é obrigatório";
    if (!form.username.trim()) errs.username = "Username é obrigatório";
    if (form.username.includes(" ")) errs.username = "Sem espaços";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    if (!form.password || form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    const age = parseInt(form.age);
    if (!form.age || isNaN(age)) errs.age = "Idade é obrigatória";
    else if (age <= 0) errs.age = "Idade inválida";
    const expectedAnswer = captchaParams.num1 + captchaParams.num2;
    if (parseInt(captchaAnswer) !== expectedAnswer) errs.captcha = "Resposta incorreta";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.house) {
      setErrors({ house: "Escolha sua casa" });
      return;
    }
    setLoading(true);

    // If user selected a file, upload it to Supabase Storage first
    let finalAvatarUrl = form.avatarUrl || "";

    if (avatarFile) {
      // We need to sign up first to get the user ID, then upload
      // So we'll store the file temporarily and upload after account creation
      // For now, create object URL as placeholder — we'll upload post-signup
    }

    const result = await register({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      username: form.username,
      age: parseInt(form.age),
      house: form.house as House,
      avatarUrl: finalAvatarUrl || undefined,
    });

    // If signup succeeded and we have a file, sign in and upload
    if (result.success && avatarFile) {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (signInData?.user) {
          const ext = avatarFile.name.split(".").pop();
          const path = `${signInData.user.id}/avatar.${ext}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
            const bustedUrl = `${publicUrl}?t=${Date.now()}`;
            await supabase.from("profiles").update({ avatar_url: bustedUrl } as never).eq("user_id", signInData.user.id);
          }
          await supabase.auth.signOut();
        }
      } catch (e) {
        // Avatar upload failed silently — user can update later
      }
    }

    setLoading(false);
    if (result.success) {
      if (form.referralCode.trim()) {
        localStorage.setItem("pending_referral", form.referralCode.trim().toLowerCase().replace("@", ""));
      }
      setStep(3);
    } else {
      toast.error(result.error || "Erro ao criar conta");
      setErrors({ general: result.error || "Erro ao criar conta" });
    }
  };

  const houses = Object.values(HOUSES);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* ── CINEMATIC BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
         <img src="/hogwarts_entrance.png" className="w-full h-full object-cover opacity-40 scale-105" alt="Hogwarts Entrance" />
         <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-blue-950/60" />
      </div>
      
      <MagicalParticles />
      <div className="relative glass rounded-[3rem] p-1 md:p-1 w-full max-w-xl z-20 animate-fade-in-up border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Parchment Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-5 pointer-events-none" />
        
        <div className="relative glass-dark rounded-[2.8rem] p-10 md:p-12 border border-white/5 space-y-10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-5xl text-gold-gradient mb-3 drop-shadow-2xl tracking-tighter uppercase">Ficha de Matrícula</h1>
            <p className="text-primary/60 text-xs font-bold uppercase tracking-[0.4em]">O Ministério da Magia exige sua identificação</p>
            <div className="flex justify-center gap-4 mt-10">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-2 rounded-full transition-all duration-700 ${step === s ? "w-16 bg-primary shadow-[0_0_20px_rgba(212,175,55,0.8)]" : step > s ? "w-8 bg-primary/40" : "w-8 bg-white/5"}`} />
              ))}
            </div>
          </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Nome Completo</label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Seu nome completo" className="bg-secondary/50" />
              {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">@Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} placeholder="seu_username" className="bg-secondary/50" />
              {errors.username && <p className="text-destructive text-xs mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" className="bg-secondary/50" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Senha</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" className="bg-secondary/50" />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Idade</label>
              <Input type="number" min={1} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Sua idade" className="bg-secondary/50" />
              {errors.age && <p className="text-destructive text-xs mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Código de Convite (Opcional)</label>
              <Input value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value })} placeholder="Quem te chamou? (Ex: harry)" className="bg-secondary/50" />
            </div>

            {/* FOTO DE PERFIL */}
            <div className="bg-secondary/30 p-4 rounded-xl border border-border">
              <label className="text-sm font-heading text-muted-foreground block mb-3">📷 Foto de Perfil (Opcional)</label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🧙</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    📁 Fazer upload de foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                      setForm(f => ({ ...f, avatarUrl: "" }));
                    }}
                  />
                  {/* OR URL */}
                  <Input
                    value={form.avatarUrl}
                    onChange={(e) => {
                      setForm({ ...form, avatarUrl: e.target.value });
                      setAvatarPreview(e.target.value);
                      setAvatarFile(null);
                    }}
                    placeholder="Ou cole o link da sua foto..."
                    className="bg-secondary/50 text-xs h-8"
                  />
                </div>
              </div>
            </div>
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
              <label className="text-sm font-heading text-primary block mb-1 flex items-center gap-2">
                <span>🛡️</span> Prove que não é um trasgo (Bot)
              </label>
              <p className="text-xs text-muted-foreground mb-2">Resolva a soma: {captchaParams.num1} + {captchaParams.num2} = ?</p>
              <Input type="number" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} placeholder="Sua resposta..." className="bg-secondary/50 border-primary/50" />
              {errors.captcha && <p className="text-destructive text-xs mt-1 font-bold">{errors.captcha}</p>}
            </div>
            {errors.general && <p className="text-destructive text-sm">{errors.general}</p>}
            <Button variant="plaque" className="w-full h-20 rounded-[2rem] font-heading text-lg bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 border-none shadow-[0_20px_50px_rgba(234,179,8,0.4)] text-black" onClick={handleNext}>
              PRÓXIMO → ESCOLHER CASA
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-center text-primary/60 text-xs font-bold uppercase tracking-[0.3em] mb-4">Escolha sua linhagem de sangue</p>
            <div className="grid grid-cols-2 gap-4">
              {houses.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setForm({ ...form, house: h.id })}
                  className={`glass rounded-[2rem] p-6 text-center transition-all hover:scale-[1.05] ${form.house === h.id ? "ring-4 ring-primary animate-pulse-glow bg-primary/10 shadow-[0_0_30px_rgba(212,175,55,0.4)]" : "border-white/5"}`}
                >
                  <HouseCrest house={h.id} size="md" />
                  <p className="font-heading text-lg mt-3 text-gold-gradient">{h.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{h.motto}</p>
                </button>
              ))}
            </div>
            {errors.house && <p className="text-destructive text-xs text-center font-bold">{errors.house}</p>}
            {errors.general && <p className="text-destructive text-sm text-center font-bold bg-destructive/10 p-4 rounded-2xl border border-destructive/20">{errors.general}</p>}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1 h-20 rounded-[2rem] font-heading border-white/10 hover:bg-white/5" onClick={() => setStep(1)}>← VOLTAR</Button>
              <Button variant="plaque" className="flex-1 h-20 rounded-[2rem] font-heading text-lg bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 border-none shadow-[0_20px_50px_rgba(234,179,8,0.4)] text-black" onClick={handleSubmit} disabled={loading}>
                {loading ? "ENVIANDO..." : "ENVIAR MATRÍCULA"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <AcceptanceLetter 
            fullName={form.fullName} 
            onContinue={() => navigate("/login")} 
          />
        )}

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Voltar ao início</Link>
        </div>
      </div>
    </div>
  </div>
);
}
