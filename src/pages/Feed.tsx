import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { HOUSES, MOCK_MEMBERS, MOCK_CHALLENGES } from "@/lib/store";
import UserCard from "@/components/UserCard";
import HouseCrest from "@/components/HouseCrest";
import { Button } from "@/components/ui/button";

const MOCK_POSTS = [
  { id: "1", author: MOCK_MEMBERS[0], content: "Bem-vindos ao Portal Hogwarts House! 🏰✨ Que a magia comece!", time: "Há 2 horas", reactions: [{ emoji: "⚡", count: 12 }, { emoji: "❤️", count: 8 }] },
  { id: "2", author: MOCK_MEMBERS[1], content: "Acabei de resolver o Enigma do Dia! +50 XP 🎉 Quem mais conseguiu?", time: "Há 4 horas", reactions: [{ emoji: "🦅", count: 5 }, { emoji: "👏", count: 3 }] },
  { id: "3", author: MOCK_MEMBERS[3], content: "Lufa-Lufa está subindo no ranking! Vamos, time! 🦡💛", time: "Há 6 horas", reactions: [{ emoji: "🦡", count: 7 }, { emoji: "💪", count: 4 }] },
];

export default function Feed() {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const sortedHouses = Object.values(HOUSES).sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="glass rounded-2xl p-6">
        <h1 className="font-heading text-2xl text-gold-gradient mb-1">
          Bem-vindo, {user?.fullName?.split(" ")[0]}! ⚡
        </h1>
        <p className="text-muted-foreground text-sm">O que você vai fazer hoje no mundo mágico?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Feed column */}
        <div className="md:col-span-2 space-y-4">
          {/* New post */}
          <div className="glass rounded-xl p-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Compartilhe algo mágico..."
              className="w-full bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[80px]"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2 text-lg">
                <button className="hover:scale-110 transition-transform">📷</button>
                <button className="hover:scale-110 transition-transform">✨</button>
                <button className="hover:scale-110 transition-transform">🪄</button>
              </div>
              <Button variant="magical" size="sm" className="font-heading text-xs" disabled={!newPost.trim()}>
                Publicar
              </Button>
            </div>
          </div>

          {/* Posts */}
          {MOCK_POSTS.map((post) => (
            <div key={post.id} className="glass rounded-xl p-4 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-primary">
                  {post.author.fullName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{post.author.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{post.author.username} • {post.time}</p>
                </div>
                <HouseCrest house={post.author.house} size="sm" />
              </div>
              <p className="text-sm text-foreground mb-3">{post.content}</p>
              <div className="flex gap-2">
                {post.reactions.map((r, i) => (
                  <button key={i} className="glass px-3 py-1 rounded-full text-xs hover:bg-secondary/80 transition-colors">
                    {r.emoji} {r.count}
                  </button>
                ))}
                <button className="glass px-3 py-1 rounded-full text-xs text-muted-foreground hover:bg-secondary/80 transition-colors">
                  💬 Comentar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* House standings */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">🏆 Ranking das Casas</h3>
            <div className="space-y-2">
              {sortedHouses.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <HouseCrest house={h.id} size="sm" />
                  <span className="text-sm flex-1 text-foreground">{h.name}</span>
                  <span className="text-xs font-heading text-primary">{h.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active challenges */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">⚔️ Desafios Ativos</h3>
            <div className="space-y-2">
              {MOCK_CHALLENGES.filter((c) => c.active).map((c) => (
                <div key={c.id} className="p-2 bg-secondary/30 rounded-lg">
                  <p className="text-xs font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.xpReward} XP • {c.type === "daily" ? "Diário" : "Semanal"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
