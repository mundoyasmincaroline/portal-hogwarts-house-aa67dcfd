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

import Ficha from "./pages/Ficha";
import Chats from "./pages/Chats";
import ChatRoom from "./pages/ChatRoom";
import InstaHogwarts from "./pages/InstaHogwarts";

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
              <Route path="instahogwarts" element={<InstaHogwarts />} />
              <Route path="houses" element={<Houses />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="challenges" element={<Challenges />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<Admin />} />
              <Route path="ficha" element={<Ficha />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthInit>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
