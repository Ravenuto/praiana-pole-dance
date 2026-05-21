import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, LogOut, Sun, Moon,
  Home, CalendarDays, Bookmark, Megaphone, ImageIcon, CreditCard, User, ShieldCheck } from
"lucide-react";

const NAV_LINKS = [
{ to: "/", label: "Início", icon: Home },
{ to: "/aulas", label: "Aulas", icon: CalendarDays },
{ to: "/minhas-reservas", label: "Reservas", icon: Bookmark },
{ to: "/recados", label: "Recados", icon: Megaphone },
{ to: "/feed", label: "Feed", icon: ImageIcon },
{ to: "/planos", label: "Planos", icon: CreditCard },
{ to: "/perfil", label: "Perfil", icon: User }];


const ADMIN_LINK = { to: "/admin", label: "Admin", icon: ShieldCheck };

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const links = isAdmin ? [...NAV_LINKS, ADMIN_LINK] : NAV_LINKS;
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png"

            alt="Praiana"
            className="w-7 h-7 object-contain rounded bg-white p-0.5" />
            
            <span className="font-heading text-base font-semibold tracking-tight">Praiana</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) =>
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
              isActive(link.to) ?
              "bg-primary/10 text-primary" :
              "text-muted-foreground hover:text-foreground hover:bg-muted"}`
              }>
              
                {link.label}
              </Link>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground" title="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground font-body truncate max-w-32 ml-1">
              {user?.full_name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen &&
        <div className="md:hidden pb-4 pt-2">
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              const adminLink = link.to === "/admin";
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-center transition-colors ${
                  active ?
                  "bg-primary/10 text-primary" :
                  adminLink ?
                  "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100" :
                  "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                  }>
                  
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-tight">{link.label}</span>
                  </Link>);

            })}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                {user?.full_name || user?.email}
              </span>
              <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
              
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </div>
        }
      </div>
    </nav>);

}