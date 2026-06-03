import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function MaraudersGuide() {
  const [activePage, setActivePage] = useState(1);
  const [sworn, setSworn] = useState(false);

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
                const index = guidePages.findIndex(p => p.title.toLowerCase().includes(query) || p.content.toString().toLowerCase().includes(query));
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
          <span className="font-heading text-primary text-sm">
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
          <h2 className="font-heading text-2xl text-foreground mb-6 flex items-center gap-3">
            {guidePages[activePage - 1].title}
          </h2>
          <div className="text-foreground/90 leading-relaxed">
            {guidePages[activePage - 1].content}
          </div>
          </motion.div>
        </AnimatePresence>

        {activePage === guidePages.length && (
          <div className="mt-10 text-center animate-fade-in-up">
            <h3 className="font-heading text-lg text-primary mb-3">Malfeito, feito!</h3>
            <Link to="/dashboard">
              <Button variant="magical" size="lg" className="font-heading">
                Voltar para o Salão Principal <EmojiIcon e="⚡" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
