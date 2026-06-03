import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, profile, isAdmin, isLoading, isAuthenticated, isFaciallyValidated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    if (!isLoading) {
      if (!isAuthenticated) {
        if (isMounted) navigate("/login", { state: { from: location.pathname }, replace: true });
      } else {
        // Check facial validation if enabled
        if (profile?.facial_verification_enabled && !isFaciallyValidated) {
          if (isMounted) navigate("/login", { state: { from: location.pathname, facialRequired: true }, replace: true });
        } else if (adminOnly && !isAdmin) {
          if (isMounted) navigate("/dashboard", { replace: true });
        }
      }
    }

    return () => { isMounted = false; };
  }, [isLoading, isAuthenticated, isAdmin, adminOnly, navigate, location.pathname, profile?.facial_verification_enabled, isFaciallyValidated]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="text-4xl animate-float mb-4"><EmojiIcon e="⚡" /></div>
          <p className="font-heading text-muted-foreground uppercase tracking-widest text-[10px]">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && !isAdmin) return null;

  return <>{children}</>;
}
