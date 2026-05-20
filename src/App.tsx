import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Critical Routes (Loaded immediately)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/DashboardLayout";
import Feed from "./pages/Feed";

// Lazy Routes (Loaded on demand for better performance)
const Houses = lazy(() => import("./pages/Houses"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Events = lazy(() => import("./pages/Events"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const Chats = lazy(() => import("./pages/Chats"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const InstaHogwarts = lazy(() => import("./pages/InstaHogwarts"));
const StickerAlbum = lazy(() => import("./pages/StickerAlbum"));
const Classes = lazy(() => import("./pages/Classes"));
const Rules = lazy(() => import("./pages/Rules"));
const MaraudersGuide = lazy(() => import("./pages/MaraudersGuide"));
const DMInbox = lazy(() => import("./pages/DMInbox"));
const DMChat = lazy(() => import("./pages/DMChat"));
const Friends = lazy(() => import("./pages/Friends"));
const StickerTrades = lazy(() => import("./pages/StickerTrades"));
const Azkaban = lazy(() => import("./pages/Azkaban"));
const Members = lazy(() => import("./pages/Members"));
const GringottsStore = lazy(() => import("./pages/GringottsStore"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ParentsGuide = lazy(() => import("./pages/ParentsGuide"));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-4xl animate-float">⚡</div>
  </div>
);

const queryClient = new QueryClient();

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuth((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthInit>
        <BrowserRouter>
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
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthInit>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;