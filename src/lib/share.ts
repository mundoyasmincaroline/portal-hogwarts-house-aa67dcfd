const SHARE_BASE = "https://portal-hogwarts-house.lovable.app";

export async function shareContent(opts: {
  title: string;
  text: string;
  url?: string;
}) {
  const url = opts.url || SHARE_BASE;
  const fullText = `${opts.text}\n\n${url}`;

  // Try native share first (mobile)
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: opts.title, text: opts.text, url });
      return "shared" as const;
    } catch (err: any) {
      if (err?.name === "AbortError") return "cancelled" as const;
      // fallback to clipboard
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(fullText);
    return "copied" as const;
  } catch {
    return "failed" as const;
  }
}

export function buildStickerShareText(name: string, rarity: string, house?: string | null) {
  const rarityLabel = rarity === "gold" ? "Lendária 🥇" : rarity === "silver" ? "Incomum 🥈" : "Comum 🥉";
  return `✨ Acabei de desbloquear a figurinha ${rarityLabel} de ${name}${house ? ` (${house})` : ""} no Portal Hogwarts House! Vem trocar comigo 🪄`;
}

export function buildAlbumShareText(owned: number, total: number, gold: number) {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  const complete = owned >= total && total > 0;
  if (complete) {
    return `🏆 ÁLBUM COMPLETO! Coletei todas as ${total} figurinhas mágicas do Portal Hogwarts House e me tornei uma LENDA de Hogwarts! 🪄✨`;
  }
  return `🪄 Estou colecionando figurinhas mágicas no Portal Hogwarts House! Já tenho ${owned}/${total} (${pct}%) — incluindo ${gold} lendárias 🥇. Vem completar o álbum comigo!`;
}