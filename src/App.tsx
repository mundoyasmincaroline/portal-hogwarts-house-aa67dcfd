import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/DashboardLayout";
import Feed from "./pages/Feed";
import Houses from "./pages/Houses";
import Ranking from "./pages/Ranking";
import Challenges from "./pages/Challenges";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Chats from "./pages/Chats";
import ChatRoom from "./pages/ChatRoom";
import CineHogwarts from "./pages/CineHogwarts";
import InstaHogwarts from "./pages/InstaHogwarts";
import StickerAlbum from "./pages/StickerAlbum";
import Classes from "./pages/Classes";
import EmojiShop from "./components/EmojiShop";
import Rules from "./pages/Rules";
import MaraudersGuide from "./pages/MaraudersGuide";
import DMInbox from "./pages/DMInbox";
import DMChat from "./pages/DMChat";
import Friends from "./pages/Friends";
import StickerTrades from "./pages/StickerTrades";
import Azkaban from "./pages/Azkaban";
import Members from "./pages/Members";
import GringottsStore from "./pages/GringottsStore";
import Wallet from "./pages/Wallet";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ParentsGuide from "./pages/ParentsGuide";
import MagicalSagas from "./pages/MagicalSagas";

import AdminFinance from "./pages/AdminFinance";
import MagicalGames from "./pages/MagicalGames";
import MatrixPortal from "./pages/MatrixPortal";
import YasminWorld from "./pages/YasminWorld";
import BFFWorld from "./pages/BFFWorld";
import FamilyDecisions from "./pages/FamilyDecisions";
import ZionVault from "./pages/ZionVault";
import GodDashboard from "./pages/GodDashboard";
// import MagicalTournaments from "./components/MagicalTournaments";


import MagicalSyncOverlay from "./components/MagicalSyncOverlay";

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuth((s) => s.init);
  const [isSyncing, setIsSyncing] = React.useState(false);
  
  useEffect(() => { 
    init(); 
    
    // Protocolo 10 Passos à Frente: Auto-Update Monitor
    const checkVersion = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "portal_version")
        .maybeSingle();
      
      if (data) {
        const remoteVersion = (data.setting_value as any)?.version;
        const localVersion = localStorage.getItem("portal_version");
        
        if (remoteVersion && localVersion && remoteVersion !== localVersion) {
          console.log("REVOLUTION SYNC: Nova versão detectada via nuvem. Reiniciando...");
          setIsSyncing(true);
          
          setTimeout(async () => {
            localStorage.setItem("portal_version", remoteVersion);
            if ('caches' in window) {
              const names = await caches.keys();
              for (let name of names) await caches.delete(name);
            }
            window.location.reload();
          }, 3000); // 3 segundos de imersão cinematográfica
        }
      }
    };

    checkVersion();
    
    // Realtime listener para atualizações forçadas pelo Arquiteto
    const channel = supabase
      .channel('portal_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, payload => {
        if (payload.new.setting_key === 'portal_version') {
          const newVer = payload.new.setting_value?.version;
          if (newVer && newVer !== localStorage.getItem("portal_version")) {
            setIsSyncing(true);
            setTimeout(() => window.location.reload(), 3000);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [init]);
  
  return (
    <>
      {isSyncing && <MagicalSyncOverlay />}
      {children}
    </>
  );
}



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MagicalErrorBoundary>
        <AuthInit>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MagicalMeta />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/parents" element={<ParentsGuide />} />
              <Route path="/dashboard" element={<DashboardLayout />}>

                <Route index element={<Feed />} />
                <Route path="chats" element={<Chats />} />
                <Route path="chat/:roomId" element={<ChatRoom />} />
                <Route path="cinema" element={<CineHogwarts />} />
                <Route path="instahogwarts" element={<InstaHogwarts />} />

                <Route path="album" element={<StickerAlbum />} />
                <Route path="classes" element={<Classes />} />
                <Route path="houses" element={<Houses />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="challenges" element={<Challenges />} />
                <Route path="events" element={<Events />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:userId" element={<Profile />} />
                <Route path="admin" element={<Admin />} />
                <Route path="admin/finance" element={<AdminFinance />} />
                <Route path="shop" element={<EmojiShop />} />
                <Route path="rules" element={<Rules />} />
                <Route path="guide" element={<MaraudersGuide />} />
                <Route path="dm" element={<DMInbox />} />
                <Route path="dm/:userId" element={<DMChat />} />
                <Route path="friends" element={<Friends />} />
                <Route path="trades" element={<StickerTrades />} />
                <Route path="azkaban" element={<Azkaban />} />
                <Route path="members" element={<Members />} />
                <Route path="store" element={<GringottsStore />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="sagas" element={<MagicalSagas />} />
                <Route path="games" element={<MagicalGames />} />
                <Route path="matrix" element={<MatrixPortal />} />
                <Route path="yasmin-world" element={<YasminWorld />} />
                <Route path="bff-world" element={<BFFWorld />} />
                <Route path="decisions" element={<FamilyDecisions />} />
                <Route path="zion" element={<ZionVault />} />
                <Route path="god" element={<GodDashboard />} />

                {/* Rotas de Expansão (Fallbacks para evitar tela branca) */}
                <Route path="camera" element={<Feed />} />
                <Route path="tournament" element={<Ranking />} />
                <Route path="hall" element={<Feed />} />
                <Route path="duel" element={<Challenges />} />
                <Route path="library" element={<Classes />} />

              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthInit>
      </MagicalErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
