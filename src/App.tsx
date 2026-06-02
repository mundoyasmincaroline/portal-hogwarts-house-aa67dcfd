import { useEffect, lazy, Suspense, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Critical Routes (Loaded on demand but prioritized)
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const Feed = lazy(() => import("./pages/Feed"));

// Lazy Routes
const Houses = lazy(() => import("./pages/Houses"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Events = lazy(() => import("./pages/Events"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const AdminCharacters = lazy(() => import("./pages/AdminCharacters"));
const Chats = lazy(() => import("./pages/Chats"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const InstaHogwarts = lazy(() => import("./pages/InstaHogwarts"));
const StickerAlbum = lazy(() => import("./pages/StickerAlbum"));
const Classes = lazy(() => import("./pages/Classes"));
const CanonLessons = lazy(() => import("./pages/CanonLessons"));
const Rules = lazy(() => import("./pages/Rules"));
const MaraudersGuide = lazy(() => import("./pages/MaraudersGuide"));
const DMInbox = lazy(() => import("./pages/DMInbox"));
const DMChat = lazy(() => import("./pages/DMChat"));
const Friends = lazy(() => import("./pages/Friends"));
const StickerTrades = lazy(() => import("./pages/StickerTrades"));
const Azkaban = lazy(() => import("./pages/Azkaban"));
const Members = lazy(() => import("./pages/Members"));
const GringottsStore = lazy(() => import("./pages/GringottsStore"));
const Duels = lazy(() => import("./pages/Duels"));
const Wallet = lazy(() => import("./pages/Wallet"));
const BattlePass = lazy(() => import("./pages/BattlePass"));
const Clubs = lazy(() => import("./pages/Clubs"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ParentsGuide = lazy(() => import("./pages/ParentsGuide"));
const RPHistory = lazy(() => import("./pages/RPHistory"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const Quests = lazy(() => import("./pages/Quests"));
const SortingHatAI = lazy(() => import("./pages/SortingHatAI"));
const ProphetDaily = lazy(() => import("./pages/ProphetDaily"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const Guilds = lazy(() => import("./pages/Guilds"));
const RaidBoss = lazy(() => import("./pages/RaidBoss"));
const Auctions = lazy(() => import("./pages/Auctions"));
const Gringotts = lazy(() => import("./pages/Gringotts"));
const WorldEditor = lazy(() => import("./pages/WorldEditor"));
const RankedLadder = lazy(() => import("./pages/RankedLadder"));
const DuelsPvP = lazy(() => import("./pages/DuelsPvP"));
const Quidditch = lazy(() => import("./pages/Quidditch"));
const RoomOfRequirement = lazy(() => import("./pages/RoomOfRequirement"));
const WandCrafting = lazy(() => import("./pages/WandCrafting"));
const Patronus = lazy(() => import("./pages/Patronus"));

const LoadingFallback = () => (
  <div className="relative flex h-screen flex-col items-center justify-center bg-background overflow-hidden">
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(var(--primary)/0.18) 0%, transparent 70%)",
      }}
    />
    {Array.from({ length: 12 }).map((_, i) => (
      <span
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/70 animate-sparkle"
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          boxShadow: "0 0 10px hsl(var(--primary))",
          animationDelay: `${Math.random() * 1.5}s`,
        }}
      />
    ))}
    <div className="relative z-10 text-6xl animate-float drop-shadow-[0_0_25px_hsl(var(--primary)/0.6)]">
      🪄
    </div>
    <p className="relative z-10 mt-6 font-heading text-sm uppercase tracking-[0.4em] text-foreground/70">
      Aparatando…
    </p>
  </div>
);

import { useAuth } from "@/lib/auth";

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuth((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return <>{children}</>;
}

function NotFoundRedirect() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
}

const App = () => {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthInit>
          <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/parents" element={<ParentsGuide />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Feed />} />
                  <Route path="chats" element={<Chats />} />
                  <Route path="chat/:roomId" element={<ChatRoom />} />
                  <Route path="instahogwarts" element={<InstaHogwarts />} />
                  <Route path="album" element={<StickerAlbum />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="canon-lessons" element={<CanonLessons />} />
                  <Route path="battle-pass" element={<BattlePass />} />
                  <Route path="clubs" element={<Clubs />} />
                  <Route path="houses" element={<Houses />} />
                  <Route path="ranking" element={<Ranking />} />
                  <Route path="challenges" element={<Challenges />} />
                  <Route path="events" element={<Events />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:userId" element={<Profile />} />
                  
                  {/* Admin Only Routes */}
                  <Route path="admin" element={
                    <ProtectedRoute adminOnly>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/finance" element={
                    <ProtectedRoute adminOnly>
                      <AdminFinance />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/characters" element={
                    <ProtectedRoute adminOnly>
                      <AdminCharacters />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="rules" element={<Rules />} />
                  <Route path="guide" element={<MaraudersGuide />} />
                  <Route path="dm" element={<DMInbox />} />
                  <Route path="dm/:userId" element={<DMChat />} />
                  <Route path="friends" element={<Friends />} />
                  <Route path="trades" element={<StickerTrades />} />
                  <Route path="azkaban" element={<Azkaban />} />
                  <Route path="members" element={<Members />} />
                  <Route path="store" element={<GringottsStore />} />
                  <Route path="duels" element={<Duels />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="rp-history" element={<RPHistory />} />
                  <Route path="tournaments" element={<Tournaments />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="settings/notifications" element={<NotificationPreferences />} />
                  <Route path="quests" element={<Quests />} />
                  <Route path="sorting-hat" element={<SortingHatAI />} />
                  <Route path="prophet" element={<ProphetDaily />} />
                  <Route path="guilds" element={<Guilds />} />
                  <Route path="raid" element={<RaidBoss />} />
                  <Route path="auctions" element={<Auctions />} />
                  <Route path="gringotts" element={<Gringotts />} />
                  <Route path="world-editor" element={<WorldEditor />} />
                  <Route path="ranked" element={<RankedLadder />} />
                  <Route path="duels-pvp" element={<DuelsPvP />} />
                  <Route path="quidditch" element={<Quidditch />} />
                  <Route path="room" element={<RoomOfRequirement />} />
                  <Route path="wand" element={<WandCrafting />} />
                  <Route path="patronus" element={<Patronus />} />
                  <Route path="admin/analytics" element={
                    <ProtectedRoute adminOnly>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } />
                  {/* Wildcard dentro do dashboard: rota inválida → volta ao Salão Principal */}
                  <Route path="*" element={<Feed />} />
                </Route>
                
                <Route path="*" element={<NotFoundRedirect />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthInit>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
