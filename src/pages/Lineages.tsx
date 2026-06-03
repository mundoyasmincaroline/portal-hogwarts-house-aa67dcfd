import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Crown, TreeDeciduous, Handshake, Scroll, Search } from "lucide-react";

interface Family { id:string; name:string; motto:string|null; crest_emoji:string|null; blood_status:string; founder_id:string; }
interface Member { family_id:string; user_id:string; role:string; full_name?:string; }
interface Relation { id:string; user_id:string; related_user_id:string; relation:string; full_name?:string; }
interface Alliance { id:string; user_a:string; user_b:string; alliance_type:string; status:string; other_name?:string; }
interface Inheritance { id:string; from_user:string; to_user:string; item_description:string|null; galleons:number; note:string|null; declared_at:string; other_name?:string; direction:'sent'|'received'; }
interface ProfileLite { user_id:string; full_name:string|null; }

export default function Lineages() {
  const [uid, setUid] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [myMembership, setMyMembership] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [inheritances, setInheritances] = useState<Inheritance[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);

  // forms
  const [famName, setFamName] = useState(""); const [famMotto, setFamMotto] = useState("");
  const [famBlood, setFamBlood] = useState("mestico"); const [famCrest, setFamCrest] = useState("⚜️");
  const [relTarget, setRelTarget] = useState(""); const [relKind, setRelKind] = useState("irmao");
  const [allyTarget, setAllyTarget] = useState(""); const [allyType, setAllyType] = useState("aliado");
  const [heirTarget, setHeirTarget] = useState(""); const [heirItem, setHeirItem] = useState("");
  const [heirGold, setHeirGold] = useState("0"); const [heirNote, setHeirNote] = useState("");
  const [busy, setBusy] = useState(false);

  const [profileSearch, setProfileSearch] = useState("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const me = u.user?.id || null;
    setUid(me);

    const [{ data: fams }, { data: profs }] = await Promise.all([
      supabase.from("wizard_families").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name").limit(500),
    ]);
    setFamilies((fams as Family[]) || []);
    const profileList = (profs as ProfileLite[]) || [];
    setProfiles(profileList);
    const nameOf = (id: string) => profileList.find((p) => p.user_id === id)?.full_name || "Bruxo";

    if (me) {
      const { data: myMem } = await supabase.from("family_members").select("*").eq("user_id", me).maybeSingle();
      setMyMembership((myMem as Member) || null);
      if (myMem) {
        const { data: mems } = await supabase.from("family_members").select("*").eq("family_id", (myMem as Member).family_id);
        setMembers(((mems as Member[]) || []).map((m) => ({ ...m, full_name: nameOf(m.user_id) })));
      } else setMembers([]);

      const { data: rels } = await supabase.from("family_relations").select("*").eq("user_id", me);
      setRelations(((rels as Relation[]) || []).map((r) => ({ ...r, full_name: nameOf(r.related_user_id) })));

      const { data: als } = await supabase.from("magical_alliances").select("*").or(`user_a.eq.${me},user_b.eq.${me}`);
      setAlliances(((als as Alliance[]) || []).map((a) => ({ ...a, other_name: nameOf(a.user_a === me ? a.user_b : a.user_a) })));

      const { data: ih } = await supabase.from("inheritances").select("*").or(`from_user.eq.${me},to_user.eq.${me}`).order("declared_at", { ascending: false });
      setInheritances(((ih as Inheritance[]) || []).map((i) => ({
        ...i,
        direction: i.from_user === me ? 'sent' : 'received',
        other_name: nameOf(i.from_user === me ? i.to_user : i.from_user),
      })));
    }
  };

  useEffect(() => { load(); }, []);

  const createFamily = async () => {
    if (!famName.trim()) { toast.error("Dê um nome à família"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("create_family", { p_name: famName, p_motto: famMotto, p_blood: famBlood, p_crest: famCrest });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Família fundada!"); setFamName(""); setFamMotto(""); load();
  };

  const joinFamily = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("join_family", { p_family: id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo à família."); load();
  };

  const leaveFamily = async () => {
    if (!confirm("Sair da família?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("leave_family");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Você deixou a família."); load();
  };

  const addRelation = async () => {
    if (!relTarget) { toast.error("Selecione um bruxo"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("add_relation", { p_related: relTarget, p_relation: relKind });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Relação registrada."); load();
  };

  const propose = async () => {
    if (!allyTarget) { toast.error("Selecione um bruxo"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("propose_alliance", { p_other: allyTarget, p_type: allyType });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pacto proposto."); load();
  };

  const accept = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("accept_alliance", { p_alliance: id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pacto selado."); load();
  };

  const declareInheritance = async () => {
    if (!heirTarget) { toast.error("Escolha um herdeiro"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("declare_inheritance", {
      p_to: heirTarget, p_item: heirItem, p_galleons: parseInt(heirGold) || 0, p_note: heirNote,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Herança declarada."); setHeirItem(""); setHeirGold("0"); setHeirNote(""); load();
  };

  const otherProfiles = profiles.filter((p) => 
    p.user_id !== uid && 
    (!profileSearch || p.full_name?.toLowerCase().includes(profileSearch.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TreeDeciduous className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl">Linhagens Bruxas</h1>
          <p className="text-sm text-foreground/60">Funde sua família, registre sua árvore e sele pactos eternos.</p>
        </div>
      </div>

      <Tabs defaultValue="family">
        <TabsList>
          <TabsTrigger value="family"><Crown className="h-4 w-4 mr-1" />Família</TabsTrigger>
          <TabsTrigger value="tree"><TreeDeciduous className="h-4 w-4 mr-1" />Árvore</TabsTrigger>
          <TabsTrigger value="alliances"><Handshake className="h-4 w-4 mr-1" />Pactos</TabsTrigger>
          <TabsTrigger value="heritage"><Scroll className="h-4 w-4 mr-1" />Heranças</TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="mt-4 space-y-4">
          {myMembership ? (
            <Card className="border-primary/40 bg-card/60">
              <CardHeader><CardTitle className="font-heading">Sua Família</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const f = families.find((x) => x.id === myMembership.family_id);
                  if (!f) return null;
                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{f.crest_emoji}</span>
                        <div>
                          <h3 className="font-heading text-xl">{f.name}</h3>
                          <p className="text-xs italic text-foreground/60">"{f.motto || '—'}"</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto capitalize">Sangue {f.blood_status}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-2">Membros ({members.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {members.map((m) => (
                            <Badge key={m.user_id} variant={m.role === 'chefe' ? 'default' : 'outline'}>
                              {m.role === 'chefe' && '👑 '}{m.full_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={leaveFamily}>Sair da Família</Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/30 bg-card/60">
              <CardHeader><CardTitle className="font-heading">Fundar uma Família</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="Nome da família (ex: Black)" value={famName} onChange={(e) => setFamName(e.target.value)} maxLength={50} />
                <Input placeholder="Lema" value={famMotto} onChange={(e) => setFamMotto(e.target.value)} maxLength={120} />
                <div className="flex gap-2">
                  <Input placeholder="Brasão (emoji)" value={famCrest} onChange={(e) => setFamCrest(e.target.value)} maxLength={4} className="w-24" />
                  <Select value={famBlood} onValueChange={setFamBlood}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="puro">Sangue Puro</SelectItem>
                      <SelectItem value="mestico">Mestiço</SelectItem>
                      <SelectItem value="trouxa">Nascido-Trouxa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createFamily} disabled={busy}>Fundar Família</Button>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="font-heading text-xl mb-3">Famílias Existentes</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {families.map((f) => (
                <Card key={f.id} className="border-border/50 bg-card/60">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <span className="text-2xl">{f.crest_emoji}</span>
                    <CardTitle className="font-heading text-base">{f.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs italic text-foreground/60">"{f.motto || '—'}"</p>
                    <Badge variant="outline" className="capitalize">{f.blood_status}</Badge>
                    {!myMembership && (
                      <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={() => joinFamily(f.id)}>Juntar-se</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tree" className="mt-4 space-y-4">
          <Card className="border-primary/30 bg-card/60">
            <CardHeader><CardTitle className="font-heading">Registrar Relação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Procurar bruxo..." 
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={relTarget} onValueChange={setRelTarget}>
                  <SelectTrigger className="md:w-64"><SelectValue placeholder="Selecione um bruxo" /></SelectTrigger>
                  <SelectContent>
                    {otherProfiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Bruxo"}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={relKind} onValueChange={setRelKind}>
                  <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pai">Pai</SelectItem>
                    <SelectItem value="mae">Mãe</SelectItem>
                    <SelectItem value="filho">Filho(a)</SelectItem>
                    <SelectItem value="irmao">Irmão/Irmã</SelectItem>
                    <SelectItem value="padrinho">Padrinho</SelectItem>
                    <SelectItem value="madrinha">Madrinha</SelectItem>
                    <SelectItem value="afilhado">Afilhado(a)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addRelation} disabled={busy}>Registrar</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/60">
            <CardHeader><CardTitle className="font-heading">Sua Árvore Genealógica</CardTitle></CardHeader>
            <CardContent>
              {relations.length === 0 ? (
                <p className="text-foreground/60">Você ainda não registrou parentes.</p>
              ) : (
                <ul className="space-y-2">
                  {relations.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 rounded-md border border-border/50 p-2">
                      <Badge variant="secondary" className="capitalize">{r.relation}</Badge>
                      <span>{r.full_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alliances" className="mt-4 space-y-4">
          <Card className="border-primary/30 bg-card/60">
            <CardHeader><CardTitle className="font-heading">Propor Pacto</CardTitle></CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-2">
              <Select value={allyTarget} onValueChange={setAllyTarget}>
                <SelectTrigger className="md:w-64"><SelectValue placeholder="Selecione um bruxo" /></SelectTrigger>
                <SelectContent>
                  {otherProfiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Bruxo"}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={allyType} onValueChange={setAllyType}>
                <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aliado">Aliado de Honra</SelectItem>
                  <SelectItem value="padrinho">Apadrinhamento</SelectItem>
                  <SelectItem value="herdeiro">Herdeiro Nomeado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={propose} disabled={busy}>Propor</Button>
            </CardContent>
          </Card>
          <div className="grid gap-2 md:grid-cols-2">
            {alliances.map((a) => {
              const incoming = a.user_b === uid && a.status === 'pending';
              return (
                <Card key={a.id} className="border-border/50 bg-card/60">
                  <CardContent className="flex items-center justify-between gap-2 pt-4">
                    <div>
                      <p className="font-medium">{a.other_name}</p>
                      <p className="text-xs text-foreground/60 capitalize">{a.alliance_type}</p>
                    </div>
                    {a.status === 'sealed' ? (
                      <Badge>Selado</Badge>
                    ) : incoming ? (
                      <Button size="sm" onClick={() => accept(a.id)} disabled={busy}>Aceitar</Button>
                    ) : (
                      <Badge variant="outline">Aguardando</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {alliances.length === 0 && <p className="text-foreground/60">Nenhum pacto registrado.</p>}
          </div>
        </TabsContent>

        <TabsContent value="heritage" className="mt-4 space-y-4">
          <Card className="border-primary/30 bg-card/60">
            <CardHeader><CardTitle className="font-heading">Declarar Herança</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Select value={heirTarget} onValueChange={setHeirTarget}>
                <SelectTrigger><SelectValue placeholder="Escolha o herdeiro" /></SelectTrigger>
                <SelectContent>
                  {otherProfiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "Bruxo"}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Item ou artefato (opcional)" value={heirItem} onChange={(e) => setHeirItem(e.target.value)} maxLength={120} />
              <Input type="number" min={0} placeholder="Galeões" value={heirGold} onChange={(e) => setHeirGold(e.target.value)} />
              <Textarea placeholder="Mensagem ao herdeiro..." value={heirNote} onChange={(e) => setHeirNote(e.target.value)} maxLength={500} />
              <Button onClick={declareInheritance} disabled={busy}>Selar com Magia</Button>
              <p className="text-xs text-foreground/60">Apenas declarativo. Aplicação real à carteira depende do destinatário coletar pelo admin.</p>
            </CardContent>
          </Card>

          <div className="grid gap-2 md:grid-cols-2">
            {inheritances.map((i) => (
              <Card key={i.id} className="border-border/50 bg-card/60">
                <CardHeader>
                  <CardTitle className="font-heading text-base">
                    {i.direction === 'sent' ? `Para ${i.other_name}` : `De ${i.other_name}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {i.item_description && <p>🎁 {i.item_description}</p>}
                  {i.galleons > 0 && <p>💰 {i.galleons} galeões</p>}
                  {i.note && <p className="italic text-foreground/70">"{i.note}"</p>}
                  <p className="text-xs text-foreground/50">{new Date(i.declared_at).toLocaleDateString("pt-BR")}</p>
                </CardContent>
              </Card>
            ))}
            {inheritances.length === 0 && <p className="text-foreground/60">Nenhuma herança declarada ainda.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}