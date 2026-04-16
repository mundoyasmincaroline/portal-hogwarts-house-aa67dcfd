import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import { HOUSES } from "@/lib/store";

const NAV_ITEMS = [
  { icon: "🏠", label: "Feed", path: "/dashboard" },
  { icon: "🏰", label: "Casas", path: "/dashboard/houses" },
  { icon: "🏆", label: "Ranking", path: "/dashboard/ranking" },
  { icon: "⚔️", label: "Desafios", path: "/dashboard/challenges" },
  { icon: "👤", label: "Perfil", path: "/dashboard/profile" },
];

const ADMIN_ITEMS = [
  { icon: "⚙️", label: "Admin", path: "/dashboard/admin" },
];

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⚡</div>
          <p className="font-heading text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const house = HOUSES[profile.house];
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-heading text-lg text-gold-gradient">Hogwarts House</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-heading text-xs tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3">
            <HouseCrest house={profile.house} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading truncate text-foreground">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{house.name}</p>
            </div>
            <button onClick={() => { logout(); navigate("/"); }} className="text-muted-foreground hover:text-destructive text-xs">
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="text-xl">☰</button>
          <span className="font-heading text-sm text-gold-gradient">Hogwarts House</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
