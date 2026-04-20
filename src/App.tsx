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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="admin" element={<Admin />} />
              <Route path="shop" element={<EmojiShop />} />
              <Route path="rules" element={<Rules />} />
              <Route path="guide" element={<MaraudersGuide />} />
              <Route path="dm" element={<DMInbox />} />
              <Route path="dm/:userId" element={<DMChat />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthInit>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
