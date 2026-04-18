import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import MagicalParticles from "@/components/MagicalParticles";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  
  // Recovery Mode State
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      } else if (session?.user && !isRecoveryMode) {
        // Se já estiver logado e não for recuperação, manda pro painel
        navigate("/dashboard");
      }
    });

    // Fallback: Check se já tem sessão ativa ao montar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !window.location.hash.includes("recovery")) {
        navigate("/dashboard");
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, [navigate, isRecoveryMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResetting) {
      handleResetPassword();
      return;
    }
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

  const handleResetPassword = async () => {
    if (!email) {
      setError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.success) {
      setResetMessage("Um e-mail mágico foi enviado com o link de recuperação!");
      setIsResetting(false);
    } else {
      setError(result.error || "Erro ao solicitar recuperação.");
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
    } else {
      toast.success("Senha atualizada com sucesso! Bem-vindo de volta.");
      setIsRecoveryMode(false);
      navigate("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <MagicalParticles />
      <div className="glass rounded-2xl p-8 w-full max-w-md z-20 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-gold-gradient mb-2">
            {isRecoveryMode ? "Nova Senha" : "Entrar"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRecoveryMode ? "Defina sua nova senha mágica abaixo" : "Acesse o Portal Hogwarts House"}
          </p>
        </div>

        {isRecoveryMode ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Nova Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-secondary/50 border-border pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm font-medium">{error}</p>}
            <Button type="submit" variant="magical" className="w-full font-heading" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-heading text-muted-foreground block mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-secondary/50 border-border"
                required
              />
            </div>
          
          {!isResetting && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-heading text-muted-foreground block">Senha</label>
                <button 
                  type="button" 
                  onClick={() => setIsResetting(true)}
                  className="text-xs text-primary hover:underline font-heading"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 border-border pr-10"
                  required={!isResetting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
          {resetMessage && <p className="text-green-500 text-sm font-medium">{resetMessage}</p>}

          <Button type="submit" variant="magical" className="w-full font-heading" disabled={loading}>
            {loading ? "Aguarde..." : isResetting ? "Recuperar Senha" : "Entrar no Portal"}
          </Button>

          {isResetting && (
            <button 
              type="button"
              onClick={() => { setIsResetting(false); setError(""); setResetMessage(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground mt-2"
            >
              Voltar para o Login
            </button>
          )}
        </form>

        <div className="text-center mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">
            Ainda não tem vaga?{" "}
            <Link to="/register" className="text-primary hover:underline font-heading">
              Solicitar acesso
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Problemas com o acesso? Contate o suporte:<br/>
            <a href="mailto:mundoyasmincaroline@gmail.com" className="text-primary hover:underline">mundoyasmincaroline@gmail.com</a>
          </p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary mt-4 inline-block">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
