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
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Hero Header - MONSTER QUALITY */}
      <div className="relative group overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-12 text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
           <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 animate-float">
              <span className="text-5xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">📜</span>
           </div>
           <div className="space-y-2">
              <h1 className="font-heading text-4xl text-white tracking-tighter uppercase italic">O Guia do Maroto</h1>
              <p className="text-[10px] font-heading text-primary uppercase tracking-[0.6em] animate-pulse">Juro solenemente não fazer nada de bom</p>
           </div>
           <div className="flex justify-center gap-4 pt-4">
              <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[8px] font-heading text-white/40 uppercase tracking-widest">Versão 3.0</div>
              <div className="px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-heading text-primary uppercase tracking-widest">Protocolo Morpheus</div>
           </div>
        </div>
      </div>

      {/* Índice rápido - MONSTER QUALITY */}
      <div className="flex flex-wrap justify-center gap-3 relative z-20">
        {guidePages.map((page, i) => (
          <button
            key={i}
            onClick={() => setActivePage(i + 1)}
            className={`px-6 py-3 rounded-2xl font-heading text-[9px] uppercase tracking-[0.2em] transition-all border duration-500 shadow-xl ${
              activePage === i + 1
                ? "bg-primary text-white border-primary shadow-[0_10px_20px_rgba(251,191,36,0.3)] scale-110"
                : "bg-black/40 text-white/30 border-white/5 hover:border-white/20 hover:text-white"
            }`}
          >
            {page.title.split(" ").slice(1, 3).join(" ")}
          </button>
        ))}
      </div>

      {/* Parchment Content - MONSTER QUALITY */}
      <div className="relative group/book">
        <div className="absolute -inset-4 bg-primary/10 blur-3xl opacity-0 group-hover/book:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative z-10 bg-[#f4e4bc] text-[#4a3728] rounded-[3rem] p-8 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden border-[12px] border-[#3d2b1f]/20 transform hover:rotate-1 transition-transform duration-700">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full min-h-[500px]">
             {/* Navigation Controls */}
             <div className="flex justify-between items-center mb-12 border-b border-[#3d2b1f]/10 pb-6">
                <button
                  onClick={() => setActivePage(p => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                  className="w-12 h-12 rounded-full border border-[#3d2b1f]/20 flex items-center justify-center hover:bg-[#3d2b1f]/5 transition-all disabled:opacity-20"
                >
                  <span className="text-xl">⇠</span>
                </button>
                
                <div className="text-center">
                   <p className="font-heading text-[9px] uppercase tracking-[0.4em] mb-1 opacity-40 text-[#3d2b1f]">Capítulo Mágico</p>
                   <p className="font-heading text-sm text-[#3d2b1f]">0{activePage} — 0{guidePages.length}</p>
                </div>

                <button
                  onClick={() => setActivePage(p => Math.min(guidePages.length, p + 1))}
                  disabled={activePage === guidePages.length}
                  className="w-12 h-12 rounded-full border border-[#3d2b1f]/20 flex items-center justify-center hover:bg-[#3d2b1f]/5 transition-all disabled:opacity-20"
                >
                  <span className="text-xl">⇢</span>
                </button>
             </div>

             {/* Page Content */}
             <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-700" key={activePage}>
                <div className="flex items-center gap-6 mb-10">
                   <div className="w-16 h-16 rounded-full bg-[#3d2b1f]/5 border border-[#3d2b1f]/10 flex items-center justify-center text-3xl">
                      {guidePages[activePage - 1].title.split(" ")[0]}
                   </div>
                   <h2 className="font-heading text-3xl text-[#3d2b1f] tracking-tight leading-none uppercase italic">
                      {guidePages[activePage - 1].title.split(" ").slice(1).join(" ")}
                   </h2>
                </div>
                
                <div className="font-serif text-lg leading-relaxed space-y-6 opacity-90 first-letter:text-5xl first-letter:font-heading first-letter:mr-3 first-letter:float-left first-letter:text-[#3d2b1f]">
                   {guidePages[activePage - 1].content}
                </div>
             </div>

             {/* Footer Button */}
             {activePage === guidePages.length && (
               <div className="mt-16 text-center animate-in fade-in zoom-in duration-1000">
                  <div className="w-24 h-px bg-[#3d2b1f]/20 mx-auto mb-8" />
                  <h3 className="font-heading text-xl text-[#3d2b1f] mb-6 italic uppercase">Malfeito, feito!</h3>
                  <Link to="/dashboard">
                    <button className="px-12 py-5 bg-[#3d2b1f] text-[#f4e4bc] font-heading text-[10px] tracking-[0.4em] rounded-[2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all uppercase">
                      Fechar o Mapa ⚡
                    </button>
                  </Link>
               </div>
             )}
          </div>
          
          {/* Decorative Corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#3d2b1f]/10" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#3d2b1f]/10" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#3d2b1f]/10" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#3d2b1f]/10" />
        </div>
      </div>
      
      {/* Tip Box - MONSTER QUALITY */}
      <div className="bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 flex items-center gap-8 shadow-2xl group">
         <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform duration-500">💡</div>
         <div className="flex-1">
            <p className="text-[9px] font-heading text-primary uppercase tracking-[0.4em] mb-1">Dica de Bruxo</p>
            <p className="text-sm text-white/40 font-serif italic">"O mapa revela-se apenas para quem tem sede de conhecimento. Explore cada página para dominar os segredos do portal."</p>
         </div>
      </div>
    </div>
  );
}
