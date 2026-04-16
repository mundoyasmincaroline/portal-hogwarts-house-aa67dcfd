import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { type House, HOUSES } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import MagicalParticles from "@/components/MagicalParticles";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", username: "", age: "", house: "" as House | "", email: "", password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Nome é obrigatório";
    if (!form.username.trim()) errs.username = "Username é obrigatório";
    if (form.username.includes(" ")) errs.username = "Sem espaços";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    if (!form.password || form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    const age = parseInt(form.age);
    if (!form.age || isNaN(age)) errs.age = "Idade é obrigatória";
    else if (age < 13 || age > 17) errs.age = "Apenas bruxos de 13 a 17 anos";
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
    const result = await register({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      username: form.username,
      age: parseInt(form.age),
      house: form.house as House,
    });
    setLoading(false);
    if (result.success) {
      setStep(3);
    } else {
      setErrors({ general: result.error || "Erro ao criar conta" });
    }
  };

  const houses = Object.values(HOUSES);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <MagicalParticles />
      <div className="glass rounded-2xl p-8 w-full max-w-lg z-20 animate-fade-in-up">
        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl text-gold-gradient mb-2">Solicitar Vaga</h1>
          <p className="text-muted-foreground text-sm">Preencha sua ficha de matrícula</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-1 rounded-full ${step >= s ? "bg-primary" : "bg-secondary"}`} />
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
              <Input type="number" min={13} max={17} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="13-17" className="bg-secondary/50" />
              {errors.age && <p className="text-destructive text-xs mt-1">{errors.age}</p>}
            </div>
            {errors.general && <p className="text-destructive text-sm">{errors.general}</p>}
            <Button variant="magical" className="w-full font-heading" onClick={handleNext}>
              Próximo → Escolher Casa
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm mb-4">Escolha a casa que mais combina com você</p>
            <div className="grid grid-cols-2 gap-3">
              {houses.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setForm({ ...form, house: h.id })}
                  className={`glass rounded-xl p-4 text-center transition-all hover:scale-[1.02] ${form.house === h.id ? "ring-2 ring-primary animate-pulse-glow" : ""}`}
                >
                  <HouseCrest house={h.id} size="md" />
                  <p className="font-heading text-sm mt-2 text-foreground">{h.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{h.motto}</p>
                </button>
              ))}
            </div>
            {errors.house && <p className="text-destructive text-xs text-center">{errors.house}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-heading" onClick={() => setStep(1)}>← Voltar</Button>
              <Button variant="magical" className="flex-1 font-heading" onClick={handleSubmit} disabled={loading}>
                {loading ? "Enviando..." : "Enviar Matrícula"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4 py-8">
            <div className="text-5xl animate-float">⚡</div>
            <h2 className="font-heading text-2xl text-foreground">Matrícula Enviada!</h2>
            <p className="text-muted-foreground text-sm">
              Sua conta foi criada! Faça login para acessar o portal.
            </p>
            <Button variant="magical" onClick={() => navigate("/login")} className="font-heading">
              Ir para o Login
            </Button>
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
