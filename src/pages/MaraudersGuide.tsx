import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function MaraudersGuide() {
  const [activePage, setActivePage] = useState(1);
  const [sworn, setSworn] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async () => {
    if (user && !(profile as any)?.has_read_marauders_guide) {
      setFinishing(true);
      try {
        await supabase.from("profiles").update({ has_read_marauders_guide: true } as any).eq("user_id", user.id);
        useAuth.setState((state) => ({
          profile: state.profile ? { ...state.profile, has_read_marauders_guide: true } : null
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setFinishing(false);
      }
    }
    navigate("/dashboard");
  };

  if (!sworn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="text-6xl mb-6 animate-float"><EmojiIcon e="📜" /></div>
          <h1 className="font-heading text-3xl text-gold-gradient">O Mapa do Maroto</h1>
          <p className="text-muted-foreground italic">"Os senhores Aluado, Rabicho, Almofadinhas e Pontas têm o prazer de apresentar..."</p>
          <p className="text-xs text-primary/60 uppercase tracking-widest pt-4">Segredos aguardam os bruxos de boa vontade.</p>
        </motion.div>
        
        <Button 
          variant="magical" 
          size="lg" 
          onClick={() => {
            setSworn(true);
            toast.success("Juro solenemente não fazer nada de bom! ✨");
          }}
          className="px-12 py-8 h-auto text-xl rounded-2xl group relative overflow-hidden"
        >
          <span className="relative z-10">Eu juro solenemente não fazer nada de bom</span>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </Button>
      </div>
    );
  }

  const guidePages = [
    {
      title: "🪄 Primeiros Passos — Bem-vindo a Hogwarts",
      content: (
        <div className="space-y-4">
          <p>Antes de qualquer feitiço, ambiente-se. Faça estes 5 passos para destravar tudo:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li><strong>Complete seu perfil:</strong> Menu → <Link to="/dashboard/profile" className="text-primary underline">Perfil</Link>. Adicione bio, avatar, casa e tipo sanguíneo. Cada campo dá XP.</li>
            <li><strong>Crie seu personagem (OC):</strong> Menu → Perfil → Personagens. Seu OC é quem aparece nos RPs e duelos.</li>
            <li><strong>Escolha sua varinha:</strong> Visite <Link to="/dashboard/wand" className="text-primary underline">Olivaras</Link> e forje a sua. Cada combinação tem bônus único.</li>
            <li><strong>Descubra seu Patrono:</strong> <Link to="/dashboard/patronus" className="text-primary underline">Patrono</Link> revela seu animal-guia e desbloqueia a defesa contra Dementadores.</li>
            <li><strong>Faça login todo dia:</strong> O check-in mensal acumula XP, Galeões e itens raros. Não quebre a sequência!</li>
          </ol>
          <p className="text-xs text-primary italic">Dica: assim que terminar esses 5 passos, você já estará no Nível 3 e poderá entrar em Clubes, Duelos PvP e Quadribol.</p>
        </div>
      ),
    },
    {
      title: "🗺️ Navegando o Castelo",
      content: (
        <div className="space-y-4">
          <p>O Portal é gigante. Use o menu lateral (ou o ícone de menu no celular) para se localizar. As áreas estão divididas em quatro grupos:</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-blue-400"><EmojiIcon e="🏰" /> Mundo Bruxo</strong>
              <p className="text-muted-foreground text-xs mt-1">Castelo, Mapa, Diário, Crônicas, NPCs e Profecias — o cenário e a lore.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-purple-400"><EmojiIcon e="⚔️" /> Atividades</strong>
              <p className="text-muted-foreground text-xs mt-1">Duelos, Quadribol, Desafios, Torneios, Aulas e RPGs — onde a ação acontece.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-yellow-400"><EmojiIcon e="💰" /> Economia &amp; Itens</strong>
              <p className="text-muted-foreground text-xs mt-1">Lojas, Mercado, Leilões, Cofre, Inventário e Pacto Mágico.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-red-400"><EmojiIcon e="🦁" /> Hogwarts</strong>
              <p className="text-muted-foreground text-xs mt-1">Ranking, Casas, Regras, Azkaban e Ministério — a estrutura social.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/dashboard/castle-map">Abrir Mapa do Castelo <EmojiIcon e="🗺️" /></Link>
          </Button>
        </div>
      ),
    },
    {
      title: "🔮 A Magia do Roleplay no Chat",
      content: (
        <div className="space-y-4">
          <p>O Salão Principal agora entende as suas intenções mágicas. Use os comandos abaixo para tornar sua interpretação mais imersiva:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li><strong>Ação Oculta:</strong> Escreva <code>*saca a varinha*</code> para deixar o texto em itálico e cor de destaque.</li>
            <li><strong>Comando Rápido:</strong> Comece a mensagem com <code>/acao pega o livro</code> para transformar a mensagem inteira numa ação.</li>
            <li><strong>Pensamentos:</strong> Escreva <code>(Será que eu vou passar de ano?)</code> e o texto ficará acinzentado e itálico.</li>
            <li><strong>Falas Normais:</strong> Coloque <code>"Estupefaça!"</code> entre aspas para negritar e destacar sua voz.</li>
            <li><strong>Marcar Membros:</strong> Digite <code>@nome</code> no chat para marcar outro bruxo — ele receberá uma notificação! <EmojiIcon e="✨" /></li>
          </ul>
          <p className="text-xs text-primary italic mt-2">Dica: O Chat também possui a "Penseira". No canto superior direito da sala, você pode escolher uma data antiga para ler as fofocas de ontem!</p>
        </div>
      )
    },
    {
      title: "⚔️ Duelos & Combate — Aprenda a Lutar",
      content: (
        <div className="space-y-4">
          <p>Hogwarts tem três modalidades de combate. Comece pelo modo solo antes de desafiar outros bruxos:</p>
          <div className="space-y-3 text-sm">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🎯" /> Duelos Solo</strong>
              <p className="text-muted-foreground">Pratique contra bots em <Link to="/dashboard/duels" className="text-primary underline">Duelos</Link>. Escolha um feitiço da sua mochila e descubra seu estilo de combate.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="⚡" /> Duelos PvP</strong>
              <p className="text-muted-foreground">Em <Link to="/dashboard/duels-pvp" className="text-primary underline">Duelos PvP</Link> você desafia bruxos reais em tempo real. Cada vitória sobe seu ranking.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🏆" /> Ranqueado &amp; Torneios</strong>
              <p className="text-muted-foreground">Quando atingir Nv 5, entre em <Link to="/dashboard/ranked" className="text-primary underline">Ranqueado</Link>, <Link to="/dashboard/tournaments" className="text-primary underline">Torneios</Link> e o lendário <Link to="/dashboard/triwizard" className="text-primary underline">Torneio Tribruxo</Link>.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-red-500/20">
              <strong className="text-red-400"><EmojiIcon e="🐉" /> Chefe Raid</strong>
              <p className="text-muted-foreground">Junte-se a outros bruxos no <Link to="/dashboard/raid" className="text-primary underline">Chefe Raid</Link> para derrotar bosses coletivos e ganhar prêmios épicos.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "🧹 Quadribol & Equipes",
      content: (
        <div className="space-y-4">
          <p>O esporte oficial de Hogwarts. Veja como entrar em campo:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li>Acesse <Link to="/dashboard/quidditch" className="text-primary underline">Quadribol</Link>.</li>
            <li>Escolha um time da sua casa (ou crie um novo se for o capitão).</li>
            <li>Marque uma partida — outro bruxo precisa aceitar o desafio.</li>
            <li>Durante a partida, escolha sua posição: Apanhador, Artilheiro, Batedor ou Goleiro.</li>
            <li>Ganhe pontos para sua casa a cada gol e ao capturar o Pomo de Ouro.</li>
          </ol>
          <p className="text-xs text-primary italic">Quer uma vibe mais teatral? Forme uma <Link to="/dashboard/rp-teams" className="text-primary underline">Equipe de RP</Link> — squads narrativos com seus amigos.</p>
        </div>
      ),
    },
    {
      title: "🏰 Clubes & Sala Precisa",
      content: (
        <div className="space-y-4">
          <p>Clubes e salas privadas são o coração da vida social do castelo.</p>
          <div className="space-y-3 text-sm">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🛡️" /> Clubes</strong>
              <p className="text-muted-foreground">Em <Link to="/dashboard/clubs" className="text-primary underline">Clubes</Link> você cria ou entra em grupos temáticos (Duelo, Coral, Xadrez Bruxo...). Ao entrar, clique em "Entrar no Salão" para acessar o mural e chat exclusivos do clube.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🚪" /> Sala Precisa</strong>
              <p className="text-muted-foreground">Em <Link to="/dashboard/room" className="text-primary underline">Sala Precisa</Link> você materializa uma sala privada com até 6 bruxos. Útil para reuniões secretas, planejamento de RPs e ensaios.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="⚔️" /> Guildas &amp; Facções</strong>
              <p className="text-muted-foreground">Para a alta política do castelo, junte-se a uma <Link to="/dashboard/guilds" className="text-primary underline">Guilda</Link> ou <Link to="/dashboard/factions" className="text-primary underline">Facção</Link>. Disputas entre facções liberam eventos lendários.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "📚 Aulas, N.O.M.s e Carreira Acadêmica",
      content: (
        <div className="space-y-4">
          <p>Você está em uma escola — então sim, há aulas. Mas elas dão MUITO XP.</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li><strong className="text-foreground">Aulas e Aulas Canon:</strong> respondem questões do universo HP — XP e Galeões na hora.</li>
            <li><strong className="text-foreground">N.O.M.s &amp; Exames:</strong> ao atingir Nv 5, libere os exames oficiais e suba de ano escolar.</li>
            <li><strong className="text-foreground">Grimório:</strong> sua biblioteca pessoal de feitiços desbloqueados.</li>
            <li><strong className="text-foreground">Estufa &amp; Laboratório de Poções:</strong> colete ingredientes e fabrique poções de bônus.</li>
            <li><strong className="text-foreground">Criaturas Mágicas:</strong> aprenda a lidar com bichos e ganhe figurinhas raras.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "✈️ Mundo Mágico Além do Castelo",
      content: (
        <div className="space-y-4">
          <p>Hogwarts é só o começo. Você pode viajar pelo mundo bruxo:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li><strong className="text-foreground">Hogsmeade:</strong> a vila bruxa — Três Vassouras, Dedosdemel, Zonko's.</li>
            <li><strong className="text-foreground">Beco Diagonal:</strong> ingredientes raros, livros e itens lendários.</li>
            <li><strong className="text-foreground">Mapa do Mundo &amp; Viagens Mágicas:</strong> aparate para Beauxbatons, Durmstrang, Salem e mais. Cada destino tem missões únicas.</li>
            <li><strong className="text-foreground">Diário de Viagem:</strong> seu registro de tudo que você descobriu.</li>
            <li><strong className="text-foreground">Ministério da Magia:</strong> burocracia bruxa, decretos, julgamentos e cargos públicos.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "🎵 InstaHogwarts & Mensagens Diretas",
      content: (
        <div className="space-y-4">
          <p>Compartilhar momentos mágicos agora tem trilha sonora — e conversas privadas!</p>
          <div className="space-y-3">
            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1"><EmojiIcon e="📸" /> InstaHogwarts</strong>
              <p>Ao criar uma postagem, cole um link do Spotify para adicionar trilha sonora. Um Player Mágico aparecerá na sua foto!</p>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1"><EmojiIcon e="💬" /> Mensagens Diretas (DM)</strong>
              <p>Clique em <strong>"Mensagens"</strong> no menu lateral ou visite o perfil de um membro e clique em <strong>"<EmojiIcon e="💬" /> Mensagem"</strong>. As conversas acontecem em tempo real — como WhatsApp, mas dentro do castelo! Você verá um badge com quantas mensagens não lidas tem.</p>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full text-[10px] uppercase tracking-widest rounded-xl border-primary/20 hover:bg-primary/10">
                <Link to="/dashboard/instahogwarts">Ir para InstaHogwarts <EmojiIcon e="📸" /></Link>
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "⚔️ Desafios & Missões — Guia Completo",
      content: (
        <div className="space-y-4">
          <p>Vá na aba <strong>Desafios</strong> para ver todas as missões disponíveis. Cada tipo funciona de um jeito:</p>
          <div className="space-y-3">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="⚙️" /> Missões Automáticas (Diárias / Semanais)</strong>
              <p className="text-sm text-muted-foreground mt-1">Participar de chats, postar no InstaHogwarts, etc. O sistema detecta e concede XP automaticamente. A barra de progresso atualiza sozinha!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="📱" /> Missões de Redes Sociais</strong>
              <p className="text-sm text-muted-foreground mt-1">Fez um TikTok ou Reels sobre o portal? Clique no desafio → cole o link público → envie. A administração avalia em até 24h e libera o XP!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🦉" /> Enigmas (Quiz Mágico)</strong>
              <p className="text-sm text-muted-foreground mt-1">Clique no desafio com charada → responda corretamente → XP imediato! Errou? Aguarde o cooldown e tente de novo.</p>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full text-[10px] uppercase tracking-widest rounded-xl border-primary/20 hover:bg-primary/10">
                <Link to="/dashboard/challenges">Explorar Desafios <EmojiIcon e="⚔️" /></Link>
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🧭 Missão Coletiva — Liderar & Participar",
      content: (
        <div className="space-y-4">
          <p>Missões coletivas são eventos onde um membro <strong>lidera</strong> e outros <strong>participam</strong> — <em>todos ganham XP!</em></p>
          <div className="space-y-3">
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/30">
              <strong className="text-primary"><EmojiIcon e="👑" /> Para o Líder da Missão:</strong>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-2">
                <li>Vá em <strong>Desafios</strong> e clique no desafio "Liderar Missão".</li>
                <li>Crie um post no <strong>InstaHogwarts</strong> descrevendo a missão e o que os participantes devem fazer.</li>
                <li>Marque os participantes com <code>@nome</code> no post ou no chat da sala.</li>
                <li>Após a missão acontecer, cole o link do post como comprovação e envie.</li>
                <li>Admin aprova → Líder e <strong>todos os participantes marcados</strong> recebem XP automaticamente! <EmojiIcon e="⚡" /></li>
              </ol>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🤝" /> Para Participar:</strong>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-2">
                <li>Aguarde ser marcado pelo líder com @.</li>
                <li>Participe da atividade combinada.</li>
                <li>Quando o líder enviar a comprovação e for aprovada, o XP cai automaticamente na sua conta!</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🦉 Enigmas de Hogwarts",
      content: (
        <div className="space-y-4">
          <p>Os Enigmas são charadas do universo de Harry Potter. Responda corretamente e ganhe XP na hora!</p>
          <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 space-y-2 text-sm text-muted-foreground">
            <p><EmojiIcon e="🔮" /> <strong>Como funciona:</strong> Clique num desafio do tipo Enigma → leia a charada → escreva sua resposta → envie.</p>
            <p><EmojiIcon e="✅" /> <strong>Acertou?</strong> XP concedido imediatamente e pontos para sua Casa!</p>
            <p><EmojiIcon e="❌" /> <strong>Errou?</strong> Não entre em pânico — aguarde o cooldown mágico e tente novamente.</p>
            <p><EmojiIcon e="📚" /> <strong>Dica:</strong> A Biblioteca de Hogwarts (e seus livros favoritos de HP) contém todas as respostas. Boa sorte!</p>
          </div>
          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center">
            <p className="text-xs text-primary font-heading">Enigmas novos são adicionados pela administração regularmente. Fique atento! <EmojiIcon e="🦉" /><EmojiIcon e="✨" /></p>
          </div>
        </div>
      )
    },
    {
      title: "🪙 Gringotts — Galeões & Loja Mágica",
      content: (
        <div className="space-y-4">
          <p>O Portal tem sua própria moeda mágica: os <strong>Galeões</strong>! Use-os para comprar itens exclusivos, varinhas, roupas e skins na Loja Gringotts.</p>
          <div className="space-y-3">
            <div className="bg-secondary/50 p-4 rounded-xl border border-yellow-500/20 text-sm text-muted-foreground">
              <strong className="text-yellow-400 block mb-1"><EmojiIcon e="🪙" /> Como ganhar Galeões</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Comprando pacotes na Loja Gringotts (Pix ou Cartão via InfinitePay)</li>
                <li>Crédito da administração por eventos e premiações</li>
                <li>Bônus mensais de assinaturas VIP</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-purple-500/20 text-sm text-muted-foreground">
              <strong className="text-purple-400 block mb-1"><EmojiIcon e="👑" /> Planos VIP</strong>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-blue-400"><EmojiIcon e="✨" /> Premium (R$9,90/mês)</strong> — +50% XP, badge exclusivo, acesso a salas Premium</li>
                <li><strong className="text-purple-400"><EmojiIcon e="🥇" /> Auror VIP (R$19,90/mês)</strong> — Tudo do Premium + 200<EmojiIcon e="🪙" />/mês + nome dourado</li>
                <li><strong className="text-yellow-400"><EmojiIcon e="👑" /> Fundador (R$39,90/mês)</strong> — Tudo do VIP + 500<EmojiIcon e="🪙" />/mês + Conselho Secreto</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1"><EmojiIcon e="🏪" /> Loja Gringotts</strong>
              <p>Acesse pelo menu lateral → <strong>Gringotts <EmojiIcon e="🪙" /></strong>. Roupas de cada casa, varinhas lendárias, acessórios e skins de perfil. Seu saldo aparece sempre no sidebar!</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🤝 Trocas, Mercado e Leilões",
      content: (
        <div className="space-y-4">
          <p>Tem um item duplicado ou precisa daquela varinha lendária? Use a economia jogador a jogador:</p>
          <div className="space-y-3 text-sm">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🤝" /> Trocas de Itens</strong>
              <p className="text-muted-foreground">Em <Link to="/dashboard/item-trades" className="text-primary underline">Trocas</Link> você propõe um item seu por outro de qualquer bruxo.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🛒" /> Mercado Aberto</strong>
              <p className="text-muted-foreground">No <Link to="/dashboard/marketplace" className="text-primary underline">Mercado</Link>, qualquer um pode listar itens por Galeões. Compre e venda à vontade.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="🔨" /> Leilões</strong>
              <p className="text-muted-foreground">Para itens raríssimos, use os <Link to="/dashboard/auctions" className="text-primary underline">Leilões</Link> e dispute com outros bruxos em tempo real.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "🎭 Eventos, RP e Vida Social",
      content: (
        <div className="space-y-4">
          <p>O castelo está sempre vivo. Estes são os pontos de encontro:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li><strong>Eventos Mágicos:</strong> programação diária com horários — apareça ao vivo para ganhar XP/Galeões.</li>
            <li><strong>Eventos ao Vivo:</strong> bailes, banquetes e reuniões agendadas pelos admins.</li>
            <li><strong>InstaHogwarts:</strong> a rede social do castelo. Poste fotos com música do Spotify.</li>
            <li><strong>Chats RPG:</strong> salas temáticas (Salão Principal, Sala Comunal, Floresta Proibida...) onde acontece o roleplay.</li>
            <li><strong>Aventuras &amp; Crônicas:</strong> missões narrativas com escolhas que afetam sua história.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "📨 Recrutamento — Convide Bruxos",
      content: (
        <div className="space-y-4">
          <p>Trazer amigos para Hogwarts é a melhor forma de subir rápido:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li>Acesse <Link to="/dashboard/referrals" className="text-primary underline">Indicações</Link>.</li>
            <li>Copie seu link mágico e mande para amigos.</li>
            <li>Quando o convidado se matricular, ele já ganha 500 Galeões + Baú Lendário.</li>
            <li>Quando ele atingir o Nv 2, você recebe <strong className="text-primary">+100 Galeões e +50 XP</strong>.</li>
            <li>A cada 5 amigos aprovados, ganhe uma medalha exclusiva no perfil.</li>
          </ol>
          <Button asChild variant="magical" className="w-full">
            <Link to="/dashboard/referrals">Abrir Sistema de Indicação <EmojiIcon e="📨" /></Link>
          </Button>
        </div>
      ),
    },
    {
      title: "🚨 Regras, Segurança & Suporte",
      content: (
        <div className="space-y-4">
          <p>Antes de qualquer coisa, leia as <Link to="/dashboard/rules" className="text-primary underline">Regras do Castelo</Link>. Comportamento tóxico vai parar em <Link to="/dashboard/azkaban" className="text-primary underline">Azkaban</Link>.</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-primary/20">
            <li>Nunca compartilhe dados pessoais reais — só seu personagem.</li>
            <li>Reporte abuso pelo perfil do usuário → botão "Reportar".</li>
            <li>Bloqueie quem te incomoda — DMs e marcações ficam silenciadas.</li>
            <li>Precisa de ajuda? Vá em <Link to="/dashboard/support" className="text-primary underline">Suporte</Link> e abra um chamado.</li>
            <li>Esqueceu uma regra do RP? <Link to="/dashboard/rp-history" className="text-primary underline">Histórico de RP</Link> mostra tudo o que rolou na sua sala.</li>
          </ul>
          <p className="text-xs text-primary italic">Lembre-se: Hogwarts é um lugar mágico, mas também é uma comunidade real. Trate cada bruxo com respeito.</p>
        </div>
      ),
    },
    {
      title: "🤝 Amigos, DMs & Comunidade",
      content: (
        <div className="space-y-4">
          <p>O Portal Hogwarts House é uma comunidade! Conecte-se com outros bruxos, faça amigos e gerencie suas relações sociais.</p>
          <div className="space-y-3">
            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1"><EmojiIcon e="➕" /> Como adicionar amigos</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Visite o perfil de qualquer membro → clique em <strong>"Adicionar Amigo +"</strong></li>
                <li>Ou acesse <strong>Menu → Membros</strong> para ver todos os bruxos</li>
                <li>Quando o convite for aceito, vocês se tornam amigos oficialmente!</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1"><EmojiIcon e="💬" /> Mensagens Diretas (DM)</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Clique em <strong>Mensagens</strong> no menu para ver todas as conversas</li>
                <li>No perfil de qualquer membro → botão <strong>"<EmojiIcon e="💬" /> Mensagem"</strong></li>
                <li>Badge vermelho no menu mostra mensagens não lidas em tempo real</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1"><EmojiIcon e="🚫" /> Bloquear usuários</strong>
              <p>No perfil de um membro, clique em <strong>"Bloquear <EmojiIcon e="🚫" />"</strong>. Membros bloqueados não podem enviar DMs. Você pode desbloquear a qualquer momento.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🎁 Loja, Recrutamento & Álbum",
      content: (
        <div className="space-y-4">
          <p>Seja recompensado por explorar e divulgar o Castelo:</p>
          <div className="space-y-3">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">Loja Borgin &amp; Burkes</strong>
              <p className="text-sm text-muted-foreground">Acumulou XP? Troque por insígnias e Emojis Raros que aparecem no seu perfil e no chat!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">Recrutamento Mágico</strong>
              <p className="text-sm text-muted-foreground">Convide novos bruxos com seu código (Perfil → Recrutamento). Quando o convidado atingir Nível 2, você ganha <strong>500 XP</strong>!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground"><EmojiIcon e="📗" /> Álbum de Figurinhas</strong>
              <p className="text-sm text-muted-foreground">Complete desafios e eventos para desbloquear figurinhas mágicas no seu Álbum. Colecione todas!</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-1 sm:px-0">
      <div className="rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden border border-amber-800/30 bg-[#e3d5b0] shadow-xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')] opacity-20"></div>
        <div className="relative z-10 text-amber-950">
          <span className="text-5xl drop-shadow-md"><EmojiIcon e="📜" /></span>
          <h1 className="font-heading text-3xl mt-4 mb-2 tracking-tighter">O Guia do Maroto</h1>
          <p className="text-amber-800/80 text-sm italic">Juro solenemente não fazer nada de bom.</p>
          <p className="text-xs text-amber-900/60 mt-1 uppercase tracking-[0.2em]">Conheça as novas atualizações do castelo.</p>
        </div>
      </div>

      {/* Índice rápido com busca e links */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-xl border border-primary/10 w-full">
          <div className="relative w-full sm:w-auto flex-1">
            <EmojiIcon e="🔍" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <Input 
              placeholder="Procurar tópico (comandos, missões, VIP)..." 
              className="pl-10 bg-background/50 border-primary/30"
              onChange={(e) => {
                const query = e.target.value.toLowerCase();
                if (!query) return;
                const index = guidePages.findIndex(p => p.title.toLowerCase().includes(query));
                if (index !== -1) setActivePage(index + 1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="animate-pulse bg-primary/10 border-primary/30 text-primary">Novidade!</Badge>
             <span className="text-[10px] text-muted-foreground uppercase tracking-wider">v.2.4.0</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {guidePages.map((page, i) => (
            <button
              key={i}
              onClick={() => setActivePage(i + 1)}
              className={`text-xs px-3 py-1.5 rounded-full font-heading transition-all border ${
                activePage === i + 1
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-background/70 backdrop-blur-md border-primary/30 text-foreground hover:border-primary/50"
              }`}
            >
              {page.title.split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5 sm:p-10 border border-amber-800/20 bg-[#f4ebd0] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')] opacity-10 pointer-events-none"></div>
        <div className="flex justify-between items-center mb-6 border-b border-amber-800/10 pb-4 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePage(p => Math.max(1, p - 1))}
            disabled={activePage === 1}
          >
            ← Anterior
          </Button>
          <span className="font-heading text-amber-900 text-sm">
            Página {activePage} de {guidePages.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePage(p => Math.min(guidePages.length, p + 1))}
            disabled={activePage === guidePages.length}
          >
            Próxima →
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activePage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
          <h2 className="font-heading text-2xl text-amber-950 mb-6 flex items-center gap-3">
            {guidePages[activePage - 1].title}
          </h2>
          <div className="text-amber-950 leading-relaxed [&_p]:text-amber-950 [&_li]:text-amber-900 [&_strong]:text-amber-950 [&_code]:bg-amber-200/60 [&_code]:text-amber-950 [&_code]:px-1.5 [&_code]:rounded [&_a]:text-amber-700 [&_a]:underline [&_a:hover]:text-amber-900 [&_.bg-secondary\/50]:bg-amber-100/80 [&_.bg-secondary\/50]:border-amber-700/30 [&_.text-muted-foreground]:!text-amber-900/90 [&_.text-foreground]:!text-amber-950 [&_.text-primary]:!text-amber-700">
            {guidePages[activePage - 1].content}
          </div>
          </motion.div>
        </AnimatePresence>

        {activePage === guidePages.length && (
          <div className="mt-10 text-center animate-fade-in-up">
            <h3 className="font-heading text-lg text-amber-800 mb-3">Malfeito, feito!</h3>
            <Button onClick={handleFinish} disabled={finishing} variant="magical" size="lg" className="font-heading">
              {finishing ? "Finalizando..." : "Concluir Leitura e Avançar"} <EmojiIcon e="⚡" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
