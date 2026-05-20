import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Menu, X, LogOut } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const links = [
    { to: "/", label: "Início" },
    { to: "/aulas", label: "Aulas" },
    { to: "/minhas-reservas", label: "Reservas" },
    { to: "/recados", label: "Recados" },
    { to: "/feed", label: "Feed" },
    { to: "/planos", label: "Planos" },
    { to: "/perfil", label: "Perfil" },
  ];

  if (isAdmin) links.push({ to: "/admin", label: "Admin" });

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/943b83331_5.png" alt="Praiana" className="w-7 h-7 object-contain" />
            <span className="font-heading text-base font-semibold tracking-tight">Praiana</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                  isActive(link.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-body truncate max-w-32">{user?.full_name || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-center px-2 py-2 rounded-lg text-xs font-body font-medium transition-colors text-center ${
                    isActive(link.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground truncate">{user?.full_name || user?.email}</span>
              <button onClick={() => base44.auth.logout()} className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}