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
          </ul>
          <p className="text-xs text-primary italic mt-2">Dica: O Chat também possui a "Penseira". No canto superior direito da sala, você pode escolher uma data antiga para ler as fofocas de ontem!</p>
        </div>
      )
    },
    {
      title: "🎵 O Novo InstaHogwarts",
      content: (
        <div className="space-y-4">
          <p>Compartilhar momentos agora tem trilha sonora!</p>
          <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20 text-sm text-muted-foreground">
            <p>Ao criar uma nova postagem no Feed, você verá um novo campo: <strong>"Link de Música (Spotify ou MP3)"</strong>.</p>
            <p className="mt-2">Basta colar um link do Spotify (Ex: de uma música do Harry Potter ou sua banda favorita) e um Player Mágico aparecerá na sua foto para todos escutarem enquanto dão like!</p>
          </div>
        </div>
      )
    },
    {
      title: "🎁 Missões, Redes Sociais e Loja",
      content: (
        <div className="space-y-4">
          <p>Seja recompensado por explorar e divulgar o Castelo:</p>
          <div className="space-y-3">
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">Embaixador Mágico (Ganhe XP Fácil)</strong>
              <p className="text-sm text-muted-foreground">Vá na aba "Desafios". Você encontrará as missões de Redes Sociais. Fez um TikTok do portal? Cole o link lá, a direção vai aprovar e você ganha <strong>500 XP</strong>!</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">Loja Borgin & Burkes</strong>
              <p className="text-sm text-muted-foreground">Vá na aba "Loja". Acumulou muito XP? Troque-o por insígnias e Emojis Raros (Vira-Tempo, Marca Negra) que aparecerão no seu perfil e no chat.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-primary/20">
              <strong className="text-foreground">Eventos Sazonais e Encontros</strong>
              <p className="text-sm text-muted-foreground">Uma vez por dia, ao entrar, você esbarrará numa cena aleatória de RPG para ganhar XP. E preste atenção ao clima: o castelo muda de acordo com a época do ano!</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-8 text-center relative overflow-hidden border border-primary/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')] opacity-10"></div>
        <div className="relative z-10">
          <span className="text-5xl drop-shadow-md">📜</span>
          <h1 className="font-heading text-3xl text-gold-gradient mt-4 mb-2">O Guia do Maroto</h1>
          <p className="text-muted-foreground text-sm">Juro solenemente não fazer nada de bom.</p>
          <p className="text-xs text-foreground/80 mt-1">Conheça as novas atualizações do castelo.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-10 border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActivePage(p => Math.max(1, p - 1))}
            disabled={activePage === 1}
          >
            ← Capítulo Anterior
          </Button>
          <span className="font-heading text-primary text-sm">Página {activePage} de {guidePages.length}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActivePage(p => Math.min(guidePages.length, p + 1))}
            disabled={activePage === guidePages.length}
          >
            Próximo Capítulo →
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
