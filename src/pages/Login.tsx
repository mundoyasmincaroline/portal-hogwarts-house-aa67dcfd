import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import MagicalParticles from "@/components/MagicalParticles";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <MagicalParticles />
      <div className="glass rounded-2xl p-8 w-full max-w-md z-20 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-gold-gradient mb-2">Entrar</h1>
          <p className="text-muted-foreground text-sm">Acesse o Portal Hogwarts House</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-heading text-muted-foreground block mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-secondary/50 border-border"
            />
          </div>
          <div>
            <label className="text-sm font-heading text-muted-foreground block mb-1">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary/50 border-border"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" variant="magical" className="w-full font-heading" disabled={loading}>
            {loading ? "Entrando..." : "Entrar no Portal"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Ainda não tem vaga?{" "}
            <Link to="/register" className="text-primary hover:underline font-heading">
              Solicitar acesso
            </Link>
          </p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary mt-2 inline-block">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
