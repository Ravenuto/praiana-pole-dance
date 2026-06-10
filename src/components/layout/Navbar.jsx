import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

import { base44 } from "@/api/base44Client";
import { useUnreadCount } from "@/hooks/useNotifications";
import {
  Menu, X, LogOut, ChevronDown, MoreVertical,
  Calendar, Bookmark, Megaphone, Image as ImageIcon, CreditCard, User, ShieldCheck, Bell, Settings, Info } from
"lucide-react";

const PRIMARY_TABS = [
  { path: "/aulas", label: "Agenda", icon: Calendar },
  { path: "/recados", label: "Recados", icon: Megaphone },
  { path: "/feed", label: "Feed", icon: ImageIcon },
  { path: "/perfil", label: "Perfil", icon: User },
];

const MORE_TABS = [
  { path: "/minhas-reservas", label: "Minhas Reservas", icon: Bookmark },
  { path: "/planos", label: "Planos", icon: CreditCard },
  { path: "/sobre", label: "Sobre", icon: Info },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const unreadCount = useUnreadCount(user?.email);

  const isActive = (path) => location.pathname === path;

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png"

            alt="Praiana"
            className="w-7 h-7 object-contain dark:bg-white dark:rounded dark:p-0.5 opacity-80 dark:opacity-100" />
            
            <span className="font-heading text-base font-semibold tracking-tight">Praiana</span>
          </Link>

          {/* Desktop tabs - identical to mobile */}
          <div className="hidden md:flex items-center gap-2">
            {PRIMARY_TABS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive(tab.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </Link>
              );
            })}

            {/* Mais menu */}
            <div className="relative group">
              <button
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  MORE_TABS.some(tab => isActive(tab.path))
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <MoreVertical className="h-5 w-5" />
                <span className="text-xs font-medium">Mais</span>
              </button>
              <div className="absolute hidden group-hover:block right-0 mt-1 bg-card border border-border rounded-lg shadow-lg min-w-max z-50">
                {MORE_TABS.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive(tab.path)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive("/admin")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-body truncate max-w-32 ml-1">
              {user?.full_name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <Link to="/notificacoes" className="relative p-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>


      </div>
    </nav>);

}