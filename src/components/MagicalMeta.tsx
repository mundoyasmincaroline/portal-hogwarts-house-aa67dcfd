import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * MagicalMeta - Gerenciador de SEO "10 Passos à Frente".
 * Atualiza o título e as meta-tags dinamicamente para garantir imersão e visibilidade em 2026.
 */
export default function MagicalMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "Hogwarts Portal";
    let description = "O mundo mágico espera por você. Entre e viva sua própria história.";

    if (path.includes("/dashboard")) {
      title = "Dashboard | Salão Comunal";
      description = "Gerencie sua vida em Hogwarts, veja o feed e confira seus Galeões.";
    } else if (path.includes("/store")) {
      title = "Gringotts Store | Beco Diagonal";
      description = "Os melhores artefatos mágicos e relíquias para o seu personagem.";
    } else if (path.includes("/profile")) {
      title = "Perfil Bruxo | Hogwarts";
      description = "Veja suas conquistas, XP e casa oficial.";
    } else if (path.includes("/chats")) {
      title = "Salas de Conversa | Mistérios do Castelo";
      description = "Converse com outros bruxos em tempo real.";
    } else if (path.includes("/admin")) {
      title = "Sala do Diretor | Controle Mágico";
      description = "Painel de administração secreta de Hogwarts.";
    }

    document.title = title;
    
    // Atualizar Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Atualizar OpenGraph (Social Sharing)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute("content", "https://portal-hogwarts-house-60feca43.vercel.app/og-image.png");

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute("content", "https://portal-hogwarts-house-60feca43.vercel.app/og-image.png");

  }, [location]);

  return null;
}
