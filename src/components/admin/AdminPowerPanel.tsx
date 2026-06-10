import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, KeyRound, Loader2 } from "lucide-react";

const HOUSES = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff"];

export default function AdminPowerPanel({ onCreated }: { onCreated?: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // create user form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [house, setHouse] = useState("gryffindor");
  const [age, setAge] = useState("");

  // reset form
  const [resetEmail, setResetEmail] = useState("");

  const call = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleCreate = async () => {
    if (!email || !password) { toast.error("E-mail e senha obrigatórios"); return; }
    setBusy(true);
    try {
      await call({
        action: "create_user",
        email, password,
        full_name: fullName || username || email,
        username: username || email.split("@")[0],
        house, age: age ? Number(age) : null,
      });
      toast.success(`✨ Conta criada para ${email}`);
      setCreateOpen(false);
      setEmail(""); setPassword(""); setFullName(""); setUsername(""); setAge("");
      onCreated?.();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!resetEmail) { toast.error("Informe o e-mail"); return; }
    setBusy(true);
    try {
      const data = await call({ action: "send_password_reset", email: resetEmail, redirect_to: `${window.location.origin}/reset-password` });
      if (data?.action_link) {
        await navigator.clipboard.writeText(data.action_link).catch(() => {});
        toast.success("Link de redefinição gerado e copiado!");
      } else {
        toast.success("E-mail de redefinição enviado.");
      }
      setResetOpen(false); setResetEmail("");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 border border-primary/20">
      <h3 className="font-heading text-base text-gold-gradient mb-3">Poderes do Ministério</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="magical" onClick={() => setCreateOpen(true)}><UserPlus size={14} className="mr-2" /> Nova Conta</Button>
        <Button variant="outline" onClick={() => setResetOpen(true)}><KeyRound size={14} className="mr-2" /> Redefinir Senha</Button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Criar nova conta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input placeholder="Senha temporária" type="text" value={password} onChange={e => setPassword(e.target.value)} />
            <Input placeholder="Nome completo" value={fullName} onChange={e => setFullName(e.target.value)} />
            <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <select value={house} onChange={e => setHouse(e.target.value)} className="bg-secondary border border-border rounded-md px-3 py-2 text-sm">
                {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <Input placeholder="Idade" type="number" value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <Button variant="magical" className="w-full" disabled={busy} onClick={handleCreate}>
              {busy ? <Loader2 className="animate-spin mr-2" size={14}/> : null}
              Criar conta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="E-mail do usuário" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground">Vamos gerar um link de recuperação e copiar para sua área de transferência.</p>
            <Button variant="magical" className="w-full" disabled={busy} onClick={handleReset}>
              {busy ? <Loader2 className="animate-spin mr-2" size={14}/> : null}
              Gerar link de redefinição
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}