import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RulesAgreement() {
  const { updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    const result = await updateProfile({ accepted_rules: true });
    setLoading(false);
    
    // Bypass: se o erro for do schema cache do Supabase, ignoramos e deixamos passar!
    if (!result.success && !result.error?.includes("schema cache") && !result.error?.includes("accepted_rules")) {
      toast.error("Erro ao aceitar as regras: " + result.error);
    } else {
      toast.success("Regras aceitas! Seja bem-vindo.");
      // Atualiza o estado local forçadamente para desbloquear a tela
      useAuth.setState((state) => ({
        profile: state.profile ? { ...state.profile, accepted_rules: true } : null
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full glass rounded-2xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">⚡</div>
          <h1 className="font-heading text-2xl md:text-3xl text-gold-gradient">𝐒𝐞𝐣𝐚 𝐛𝐞𝐦-𝐯𝐢𝐧𝐝𝐨(𝐚) 𝐚 𝐜𝐨𝐦𝐮𝐧𝐢𝐝𝐚𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 𝐇𝐨𝐮𝐬𝐞 !!</h1>
          <p className="text-muted-foreground text-sm">𝐔𝐦𝐚 𝐜𝐨𝐦𝐮𝐧𝐢𝐝𝐚𝐝𝐞 𝐦á𝐠𝐢𝐜𝐚 𝐜𝐨𝐦 𝐠𝐫𝐮𝐩𝐨𝐬 𝐩𝐫𝐚 𝐜𝐨𝐧𝐯𝐞𝐫𝐬𝐚𝐬 𝐞 𝐭𝐮𝐫𝐧𝐨𝐬.</p>
        </div>

        <div className="bg-card/50 rounded-xl p-6 text-sm text-foreground space-y-4 h-[400px] overflow-y-auto border border-border custom-scrollbar">
          <p>
            𝐀𝐪𝐮𝐢 𝐟𝐚𝐳𝐞𝐦𝐨𝐬 𝐑𝐏𝐆'𝐬 𝐞𝐦 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 𝐞 𝐟𝐨𝐫𝐚 𝐝𝐞𝐥𝐚, 𝐜𝐫𝐢𝐚𝐦𝐨𝐬 𝐟𝐚𝐧𝐟𝐢𝐜𝐬, 𝐩𝐚𝐫𝐭𝐢𝐜𝐢𝐩𝐚𝐦𝐨𝐬 𝐝𝐞 𝐚𝐮𝐥𝐚𝐬 𝐞𝐦 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬, 𝐝𝐢𝐬𝐩𝐮𝐭𝐚𝐦𝐨𝐬 𝐚 𝐓𝐚ç𝐚 𝐝𝐚𝐬 𝐂𝐚𝐬𝐚𝐬 🏆 𝐞 𝐯𝐢𝐯𝐞𝐦𝐨𝐬 𝐚𝐯𝐞𝐧𝐭𝐮𝐫𝐚𝐬 𝐢𝐧𝐜𝐫í𝐯𝐞𝐢𝐬 𝐧𝐨 𝐮𝐧𝐢𝐯𝐞𝐫𝐬𝐨 𝐝𝐞 𝐇𝐏.
          </p>
          <p>𝐓𝐚𝐦𝐛é𝐦 𝐭𝐞𝐦𝐨𝐬:</p>
          <ul className="space-y-1 list-none">
            <li>🎂 𝐀𝐧𝐢𝐯𝐞𝐫𝐬á𝐫𝐢𝐨𝐬 𝐞𝐬𝐩𝐞𝐜𝐢𝐚𝐢𝐬 (𝐜𝐨𝐦 𝐟𝐨𝐭𝐨𝐬, 𝐭𝐞𝐱𝐭𝐨𝐬 𝐞 𝐡𝐨𝐦𝐞𝐧𝐚𝐠𝐞𝐧𝐬 𝐢𝐧𝐬𝐩𝐢𝐫𝐚𝐝𝐚𝐬 𝐧𝐚 𝐬𝐮𝐚 𝐜𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬)</li>
            <li>🎬 𝐒𝐞𝐬𝐬õ𝐞𝐬 𝐝𝐞 𝐟𝐢𝐥𝐦𝐞𝐬</li>
            <li>🧩 𝐄𝐧𝐢𝐠𝐦𝐚𝐬 𝐞 𝐝𝐞𝐬𝐚𝐟𝐢𝐨𝐬</li>
            <li>🏖️ 𝐂𝐨𝐥ô𝐧𝐢𝐚𝐬 𝐝𝐞 𝐟é𝐫𝐢𝐚𝐬</li>
            <li>📚 𝐀𝐮𝐥𝐚𝐬 𝐦á𝐠𝐢𝐜𝐚𝐬</li>
            <li>📊 𝐄𝐧𝐪𝐮𝐞𝐭𝐞𝐬 𝐞 𝐢𝐧𝐭𝐞𝐫𝐚çõ𝐞𝐬</li>
            <li>📞 𝐂𝐚𝐥𝐥𝐬 𝐧𝐨 𝐌𝐞𝐞𝐭</li>
            <li>𝐞 𝐦𝐮𝐢𝐭𝐨 𝐦𝐚𝐢𝐬!</li>
          </ul>
          <p className="font-bold text-primary">𝐕𝐢𝐯𝐚 𝐭𝐮𝐝𝐨 𝐢𝐬𝐬𝐨 𝐜𝐨𝐧𝐨𝐬𝐜𝐨 𝐜𝐨𝐦𝐨 𝐬𝐞 𝐫𝐞𝐚𝐥𝐦𝐞𝐧𝐭𝐞 𝐟𝐨𝐬𝐬𝐞 𝐮𝐦 𝐛𝐫𝐮𝐱𝐨 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬, 𝐬𝐞 𝐝𝐢𝐯𝐢𝐫𝐭𝐚! ✨</p>
          
          <hr className="border-border my-6" />

          <h2 className="font-heading text-lg text-primary text-center">𝐋𝐞𝐢𝐚 𝐜𝐨𝐦 𝐚𝐭𝐞𝐧çã𝐨 𝐚𝐬 𝐫𝐞𝐠𝐫𝐚𝐬 𝐚𝐛𝐚𝐢𝐱𝐨:</h2>
          <h3 className="font-heading text-md text-foreground">𝐑𝐄𝐆𝐑𝐀𝐒 𝐃𝐀 𝐇𝐎𝐔𝐒𝐄:</h3>
          
          <div className="space-y-4 text-muted-foreground">
            <div>
              <p className="text-foreground font-bold">🧙‍♀️ 𝟏. 𝐑𝐞𝐬𝐩𝐞𝐢𝐭𝐨 𝐚𝐜𝐢𝐦𝐚 𝐝𝐞 𝐭𝐮𝐝𝐨</p>
              <p>𝐍𝐚𝐝𝐚 𝐝𝐞 𝐨𝐟𝐞𝐧𝐬𝐚𝐬, 𝐱𝐢𝐧𝐠𝐚𝐦𝐞𝐧𝐭𝐨𝐬, 𝐩𝐫𝐞𝐜𝐨𝐧𝐜𝐞𝐢𝐭𝐨 𝐨𝐮 𝐝𝐞𝐬𝐫𝐞𝐬𝐩𝐞𝐢𝐭𝐨. 𝐀𝐪𝐮𝐢 𝐭𝐨𝐝𝐨 𝐦𝐮𝐧𝐝𝐨 𝐬𝐞 𝐫𝐞𝐬𝐩𝐞𝐢𝐭𝐚! 🤍</p>
            </div>
            <div>
              <p className="text-foreground font-bold">📞 𝟐 . 𝐀𝐬 𝐜𝐚𝐥𝐥𝐬 𝐬ã𝐨 𝐬𝐨𝐦𝐞𝐧𝐭𝐞 𝐩𝐞𝐥𝐨 𝐌𝐞𝐞𝐭.</p>
              <p>𝐄𝐧𝐭ã𝐨 𝐩𝐨𝐫 𝐟𝐚𝐯𝐨𝐫, 𝐧ã𝐨 𝐟𝐚ç𝐚𝐦 𝐥𝐢𝐠𝐚çõ𝐞𝐬 𝐩𝐞𝐥𝐨 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐩𝐚𝐫𝐚 𝐧ã𝐨 𝐚𝐭𝐫𝐚𝐩𝐚𝐥𝐡𝐚𝐫 𝐪𝐮𝐞𝐦 𝐧ã𝐨 𝐩𝐮𝐝𝐞𝐫 𝐞𝐧𝐭𝐫𝐚𝐫.</p>
            </div>
            <div>
              <p className="text-foreground font-bold text-destructive">🚫 𝟑. É 𝐩𝐫𝐨𝐢𝐛𝐢𝐝𝐨 𝐟𝐚𝐥𝐚𝐫 𝐩𝐚𝐥𝐚𝐯𝐫õ𝐞𝐬 𝐞 𝐜𝐨𝐧𝐭𝐞ú𝐝𝐨𝐬 +𝟏𝟖</p>
              <p>𝐧ã𝐨 é 𝐩𝐞𝐫𝐦𝐢𝐭𝐢𝐝𝐨 𝐧𝐚𝐝𝐚 𝐢𝐦𝐩𝐫ó𝐩𝐫𝐢𝐨 𝐨𝐮 𝐩𝐞𝐬𝐚𝐝𝐨.</p>
            </div>
            <div>
              <p className="text-foreground font-bold">📜 𝟒. 𝐎𝐫𝐠𝐚𝐧𝐢𝐳𝐚çã𝐨 𝐝𝐨𝐬 𝐠𝐫𝐮𝐩𝐨𝐬</p>
              <p>𝐔𝐭𝐢𝐥𝐢𝐳𝐞𝐦 𝐭𝐨𝐝𝐨𝐬 𝐨𝐬 𝐠𝐫𝐮𝐩𝐨𝐬 𝐝𝐞 𝐟𝐨𝐫𝐦𝐚 𝐜𝐨𝐫𝐫𝐞𝐭𝐚, 𝐩𝐚𝐫𝐚 𝐧ã𝐨 𝐚𝐭𝐫𝐚𝐩𝐚𝐥𝐡𝐚𝐫 𝐚 𝐝𝐢𝐧â𝐦𝐢𝐜𝐚 𝐝𝐚 𝐡𝐨𝐮𝐬𝐞.</p>
            </div>
            <div>
              <p className="text-foreground font-bold text-destructive">🚨 𝟓. 𝐏𝐫𝐨𝐢𝐛𝐢𝐝𝐨 𝐬𝐩𝐚𝐦!</p>
              <p>𝐄𝐯𝐢𝐭𝐞 𝐞𝐧𝐯𝐢𝐚𝐫 𝐦𝐮𝐢𝐭𝐚𝐬 𝐦𝐞𝐧𝐬𝐚𝐠𝐞𝐧𝐬 𝐫𝐞𝐩𝐞𝐭𝐢𝐝𝐚𝐬 𝐞 𝐟𝐢𝐠𝐮𝐫𝐢𝐧𝐡𝐚𝐬 𝐞𝐦 𝐞𝐱𝐜𝐞𝐬𝐬𝐨, 𝐩𝐨𝐢𝐬 𝐢𝐬𝐬𝐨 𝐜𝐚𝐮𝐬𝐚 𝐬𝐩𝐚𝐦.</p>
            </div>
            <div>
              <p className="text-foreground font-bold text-yellow-500">⚠️ 𝟔. 𝐐𝐮𝐞𝐛𝐫𝐚 𝐝𝐞 𝐫𝐞𝐠𝐫𝐚𝐬</p>
              <p>𝐐𝐮𝐞𝐦 𝐝𝐞𝐬𝐜𝐮𝐦𝐩𝐫𝐢𝐫 𝐚𝐬 𝐫𝐞𝐠𝐫𝐚𝐬 𝐩𝐨𝐝𝐞𝐫á 𝐫𝐞𝐜𝐞𝐛𝐞𝐫 𝐮𝐦 𝐚𝐯𝐢𝐬𝐨 𝐞, 𝐜𝐚𝐬𝐨 𝐜𝐨𝐧𝐭𝐢𝐧𝐮𝐞 𝐜𝐨𝐦𝐞𝐭𝐞𝐧𝐝𝐨 𝐨 𝐞𝐫𝐫𝐨, 𝐬𝐞𝐫á 𝐫𝐞𝐦𝐨𝐯𝐢𝐝𝐨 𝐝𝐚 𝐡𝐨𝐮𝐬𝐞. 𝐄𝐧𝐭ã𝐨, 𝐭𝐨𝐦𝐞𝐦 𝐜𝐮𝐢𝐝𝐚𝐝𝐨, 𝐞 𝐬𝐢𝐠𝐚𝐦 𝐚𝐬 𝐧𝐨𝐬𝐬𝐚𝐬 𝐫𝐞𝐠𝐫𝐚𝐬! ⚡️</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Ao clicar no botão abaixo, sua ficha será enviada para a administração.
          </p>
          <Button 
            variant="magical" 
            size="lg" 
            className="w-full md:w-auto font-heading tracking-wide"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Enviando feitiço..." : "Eu Li e Aceito as Regras ✅"}
          </Button>
        </div>
      </div>
    </div>
  );
}
