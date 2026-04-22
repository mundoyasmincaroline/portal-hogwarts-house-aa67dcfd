import React from "react";
import { ShieldCheck, Heart, Lock, Users, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ParentsGuide() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-serif selection:bg-primary/30">
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <ShieldCheck className="mx-auto text-primary w-16 h-16 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-heading tracking-tight">Guia para Pais e Responsáveis</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic">
            "A segurança dos nossos pequenos bruxos é a base sobre a qual construímos este castelo."
          </p>
        </div>

        {/* Introduction */}
        <div className="glass rounded-[3rem] p-8 md:p-12 border border-white/10 space-y-6 leading-relaxed">
          <h2 className="text-2xl font-heading text-primary flex items-center gap-3">
            <Heart size={24} /> Nosso Compromisso com a Segurança
          </h2>
          <p>
            O Portal Hogwarts House foi criado por fãs e para fãs, com o objetivo de ser um ambiente de entretenimento saudável, educativo e imersivo. Sabemos que a internet pode ser um lugar vasto, e por isso implementamos camadas rigorosas de proteção para garantir que a experiência do seu filho seja mágica e segura.
          </p>
        </div>

        {/* Pillars of Safety */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-8 border border-white/5 space-y-4">
            <Lock className="text-blue-400 w-8 h-8" />
            <h3 className="font-heading text-xl text-blue-300">Moderação Ativa (Vigia)</h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos inteligência artificial e moderação humana para monitorar salas de bate-papo em tempo real. Filtros automáticos bloqueiam palavras de baixo calão, conteúdo inapropriado e compartilhamento de dados pessoais (telefones e redes sociais externas).
            </p>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/5 space-y-4">
            <Users className="text-green-400 w-8 h-8" />
            <h3 className="font-heading text-xl text-green-300">Comunidade Saudável</h3>
            <p className="text-sm text-muted-foreground">
              Promovemos um ambiente de respeito mútuo baseado nos valores das casas de Hogwarts. Qualquer comportamento de bullying ou assédio resulta em banimento imediato e permanente.
            </p>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/5 space-y-4">
            <Sparkles className="text-yellow-400 w-8 h-8" />
            <h3 className="font-heading text-xl text-yellow-300">Transparência Financeira</h3>
            <p className="text-sm text-muted-foreground">
              Todas as transações financeiras são processadas por intermediadores de pagamento seguros (Infinite Pay). Não armazenamos dados de cartões de crédito em nossos servidores. Compras de itens virtuais são finais e destinadas ao entretenimento dentro da plataforma.
            </p>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/5 space-y-4">
            <MessageSquare className="text-purple-400 w-8 h-8" />
            <h3 className="font-heading text-xl text-purple-300">Privacidade de Dados</h3>
            <p className="text-sm text-muted-foreground">
              Cumprimos rigorosamente a LGPD (Lei Geral de Proteção de Dados). Os dados dos usuários são protegidos e nunca vendidos a terceiros. O cadastro exige um e-mail válido para comunicação direta com os responsáveis em caso de necessidade.
            </p>
          </div>
        </div>

        {/* Advice for Parents */}
        <div className="bg-primary/5 rounded-[2.5rem] p-8 md:p-12 border border-primary/20 space-y-6">
          <h2 className="text-2xl font-heading text-primary">Dicas para uma Magia Segura</h2>
          <ul className="space-y-4 text-sm md:text-base list-disc list-inside text-muted-foreground">
            <li>Converse com seu filho sobre a importância de nunca compartilhar senhas.</li>
            <li>Incentive-o a reportar qualquer comportamento estranho de outros usuários aos nossos moderadores.</li>
            <li>Lembre-o de que, embora Hogwarts seja mágica, os bruxos reais do outro lado da tela devem sempre ser tratados com educação.</li>
            <li>Acompanhe as conquistas e o progresso dele no sistema de XP e casas!</li>
          </ul>
        </div>

        {/* Contact and Footer */}
        <div className="text-center space-y-6 pb-12">
          <p className="text-muted-foreground font-serif italic">
            Dúvidas legais ou preocupações? Entre em contato com nosso conselho de bruxos em:
          </p>
          <p className="text-primary font-bold text-xl">suporte@portalhogwartshouse.com.br</p>
          <div className="flex justify-center gap-4">
            <Link to="/">
              <Button variant="outline" className="rounded-xl">Voltar ao Início</Button>
            </Link>
            <Link to="/terms">
              <Button variant="ghost" className="text-muted-foreground">Termos de Uso</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
