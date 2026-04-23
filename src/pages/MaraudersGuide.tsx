import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MaraudersGuide() {
  const [activePage, setActivePage] = useState(1);

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
            <li><strong>Marcar Membros:</strong> Digite <code>@nome</code> no chat para marcar outro bruxo — ele receberá uma notificação! ✨</li>
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
              <strong className="text-foreground block mb-1">📸 InstaHogwarts</strong>
              <p>Ao criar uma postagem, cole um link do Spotify para adicionar trilha sonora. Um Player Mágico aparecerá na sua foto!</p>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1">💬 Mensagens Diretas (DM)</strong>
              <p>Clique em <strong>"Mensagens"</strong> no menu lateral ou visite o perfil de um membro e clique em <strong>"💬 Mensagem"</strong>. As conversas acontecem em tempo real — como WhatsApp, mas dentro do castelo! Você verá um badge com quantas mensagens não lidas tem.</p>
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
              <strong className="text-foreground">⚙️ Missões Automáticas (Diárias / Semanais)</strong>
              <p className="text-sm text-muted-foreground mt-1">Participar de chats, postar no InstaHogwarts, etc. O sistema detecta e concede XP automaticamente. A barra de progresso atualiza sozinha!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">📱 Missões de Redes Sociais</strong>
              <p className="text-sm text-muted-foreground mt-1">Fez um TikTok ou Reels sobre o portal? Clique no desafio → cole o link público → envie. A administração avalia em até 24h e libera o XP!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">🦉 Enigmas (Quiz Mágico)</strong>
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
              <strong className="text-primary">👑 Para o Líder da Missão:</strong>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-2">
                <li>Vá em <strong>Desafios</strong> e clique no desafio "Liderar Missão".</li>
                <li>Crie um post no <strong>InstaHogwarts</strong> descrevendo a missão e o que os participantes devem fazer.</li>
                <li>Marque os participantes com <code>@nome</code> no post ou no chat da sala.</li>
                <li>Após a missão acontecer, cole o link do post como comprovação e envie.</li>
                <li>Admin aprova → Líder e <strong>todos os participantes marcados</strong> recebem XP automaticamente! ⚡</li>
              </ol>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">🤝 Para Participar:</strong>
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
            <p>🔮 <strong>Como funciona:</strong> Clique num desafio do tipo Enigma → leia a charada → escreva sua resposta → envie.</p>
            <p>✅ <strong>Acertou?</strong> XP concedido imediatamente e pontos para sua Casa!</p>
            <p>❌ <strong>Errou?</strong> Não entre em pânico — aguarde o cooldown mágico e tente novamente.</p>
            <p>📚 <strong>Dica:</strong> A Biblioteca de Hogwarts (e seus livros favoritos de HP) contém todas as respostas. Boa sorte!</p>
          </div>
          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center">
            <p className="text-xs text-primary font-heading">Enigmas novos são adicionados pela administração regularmente. Fique atento! 🦉✨</p>
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
              <strong className="text-yellow-400 block mb-1">🪙 Como ganhar Galeões</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Comprando pacotes na Loja Gringotts (Pix ou Cartão via InfinitePay)</li>
                <li>Crédito da administração por eventos e premiações</li>
                <li>Bônus mensais de assinaturas VIP</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-purple-500/20 text-sm text-muted-foreground">
              <strong className="text-purple-400 block mb-1">👑 Planos VIP</strong>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-blue-400">✨ Premium (R$9,90/mês)</strong> — +50% XP, badge exclusivo, acesso a salas Premium</li>
                <li><strong className="text-purple-400">🥇 Auror VIP (R$19,90/mês)</strong> — Tudo do Premium + 200🪙/mês + nome dourado</li>
                <li><strong className="text-yellow-400">👑 Fundador (R$39,90/mês)</strong> — Tudo do VIP + 500🪙/mês + Conselho Secreto</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1">🏪 Loja Gringotts</strong>
              <p>Acesse pelo menu lateral → <strong>Gringotts 🪙</strong>. Roupas de cada casa, varinhas lendárias, acessórios e skins de perfil. Seu saldo aparece sempre no sidebar!</p>
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
              <strong className="text-foreground block mb-1">➕ Como adicionar amigos</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Visite o perfil de qualquer membro → clique em <strong>"Adicionar Amigo +"</strong></li>
                <li>Ou acesse <strong>Menu → Membros</strong> para ver todos os bruxos</li>
                <li>Quando o convite for aceito, vocês se tornam amigos oficialmente!</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1">💬 Mensagens Diretas (DM)</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Clique em <strong>Mensagens</strong> no menu para ver todas as conversas</li>
                <li>No perfil de qualquer membro → botão <strong>"💬 Mensagem"</strong></li>
                <li>Badge vermelho no menu mostra mensagens não lidas em tempo real</li>
              </ul>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20 text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1">🚫 Bloquear usuários</strong>
              <p>No perfil de um membro, clique em <strong>"Bloquear 🚫"</strong>. Membros bloqueados não podem enviar DMs. Você pode desbloquear a qualquer momento.</p>
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
              <strong className="text-foreground">📗 Álbum de Figurinhas</strong>
              <p className="text-sm text-muted-foreground">Complete desafios e eventos para desbloquear figurinhas mágicas no seu Álbum. Colecione todas!</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="glass rounded-[3rem] p-12 text-center relative overflow-hidden border border-primary/40 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent" />
        <div className="relative z-10 space-y-4">
          <div className="relative w-24 h-24 mx-auto mb-6 group">
             <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
             <span className="relative z-10 text-7xl drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] block animate-float">📜</span>
          </div>
          <h1 className="font-heading text-6xl text-gold-gradient mb-2 tracking-tighter drop-shadow-2xl uppercase">O Guia do Maroto</h1>
          <p className="text-primary text-xs font-bold uppercase tracking-[0.8em] opacity-60">Juro solenemente não fazer nada de bom</p>
          <div className="pt-6">
             <span className="glass-badge border-primary/20 text-primary px-6 py-2">MODO 10 PASSOS ZION ATIVADO</span>
          </div>
        </div>
      </div>

      {/* Índice rápido */}
      <div className="flex flex-wrap gap-2">
        {guidePages.map((page, i) => (
          <button
            key={i}
            onClick={() => setActivePage(i + 1)}
            className={`text-xs px-3 py-1.5 rounded-full font-heading transition-all border ${
              activePage === i + 1
                ? "bg-primary/20 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {page.title.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 sm:p-10 border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
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

        <div className="animate-fade-in" key={activePage}>
          <h2 className="font-heading text-2xl text-foreground mb-6 flex items-center gap-3">
            {guidePages[activePage - 1].title}
          </h2>
          <div className="text-foreground/90 leading-relaxed">
            {guidePages[activePage - 1].content}
          </div>
        </div>

        {activePage === guidePages.length && (
          <div className="mt-10 text-center animate-fade-in-up">
            <h3 className="font-heading text-lg text-primary mb-3">Malfeito, feito!</h3>
            <Link to="/dashboard">
              <Button variant="magical" size="lg" className="font-heading">
                Voltar para o Salão Principal ⚡
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
