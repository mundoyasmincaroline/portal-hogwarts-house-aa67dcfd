import { useEffect, lazy, Suspense, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Wand2 } from "lucide-react";

// Routes
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ParentsGuide = lazy(() => import("./pages/ParentsGuide"));
const Support = lazy(() => import("./pages/Support"));
import { DashboardRoutes } from "@/routes/DashboardRoutes";
// (Loaded on demand but prioritized)
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
    <div className="relative z-10 animate-float drop-shadow-[0_0_25px_hsl(var(--primary)/0.6)] text-primary">
      <Wand2 size={64} strokeWidth={1.5} />
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
                <Route path="/support" element={<Support />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  {DashboardRoutes}
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
