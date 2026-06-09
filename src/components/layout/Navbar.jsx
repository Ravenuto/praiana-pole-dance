import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

import { base44 } from "@/api/base44Client";
import { useUnreadCount } from "@/hooks/useNotifications";
import {
  Menu, X, LogOut, ChevronDown,
  Home, CalendarDays, Bookmark, Megaphone, ImageIcon, CreditCard, User, ShieldCheck, Bell, Settings, Users } from
"lucide-react";

const MINHA_CONTA_LINKS = [
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const MINHAS_AULAS_LINKS = [
  { to: "/aulas", label: "Agenda", icon: CalendarDays },
  { to: "/minhas-reservas", label: "Minhas Reservas", icon: Bookmark },
];

const COMUNIDADE_LINKS = [
  { to: "/feed", label: "Feed", icon: ImageIcon },
  { to: "/recados", label: "Recados", icon: Megaphone },
  { to: "/planos", label: "Planos", icon: CreditCard },
];

const SIDEBAR_GROUPS = [
  { key: "minhas_aulas", label: "Minhas Aulas", icon: CalendarDays, links: MINHAS_AULAS_LINKS, expandable: false },
  { key: "comunidade", label: "Comunidade", icon: Users, links: COMUNIDADE_LINKS, expandable: true },
  { key: "minha_conta", label: "Minha Conta", icon: User, links: MINHA_CONTA_LINKS, expandable: false },
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
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png"

            alt="Praiana"
            className="w-7 h-7 object-contain dark:bg-white dark:rounded dark:p-0.5 opacity-80 dark:opacity-100" />
            
            <span className="font-heading text-base font-semibold tracking-tight">Praiana</span>
          </Link>

          {/* Desktop links - simple layout */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                isActive("/") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Início
            </Link>
            {SIDEBAR_GROUPS.map((group) => (
              <Link
                key={group.key}
                to={group.links[0].to}
                className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                  group.links.some(l => isActive(l.to)) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {group.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                  isActive("/admin") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Admin
              </Link>
            )}
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

        {/* Mobile Sidebar Overlay */}
        <div 
          className={`md:hidden fixed inset-0 top-14 z-30 bg-black/50 transition-opacity ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile Sidebar */}
        <div 
          className={`md:hidden fixed left-0 top-14 bottom-0 w-64 bg-card border-r border-border overflow-y-auto z-40 transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 space-y-1">
            {/* Primary link */}
            <Link
              to="/"
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/") ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              }`}
            >
              <Home className="h-6 w-6" />
              <span className="font-medium">Início</span>
            </Link>

            {/* Sidebar Groups */}
            {SIDEBAR_GROUPS.map((group) => {
              const Icon = group.icon;
              const isExpanded = expandedGroups[group.key];
              const isGroupActive = group.links.some(l => isActive(l.to));
              
              return (
                <div key={group.key}>
                  <button
                    onClick={() => group.expandable && toggleGroup(group.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isGroupActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    <span className="font-medium flex-1 text-left">{group.label}</span>
                    {group.expandable && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    )}
                  </button>

                  {/* Expanded submenu */}
                  {group.expandable && isExpanded && (
                    <div className="pl-8 py-1 space-y-1">
                      {group.links.map((link) => {
                        const LinkIcon = link.icon;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={handleNavClick}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                              isActive(link.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <LinkIcon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {!group.expandable && (
                    <div className="pl-8 py-1 space-y-1">
                      {group.links.map((link) => {
                        const LinkIcon = link.icon;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={handleNavClick}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                              isActive(link.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <LinkIcon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  <div className="my-2 border-b border-border/50" />
                </div>
              );
            })}

            {/* Admin group */}
            {isAdmin && (
              <>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-foreground hover:bg-muted"
                >
                  <ShieldCheck className="h-6 w-6 flex-shrink-0" />
                  <span className="font-medium flex-1 text-left">Admin</span>
                </button>
                <div className="pl-8 py-1 space-y-1">
                  <Link
                    to="/admin"
                    onClick={handleNavClick}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      isActive("/admin") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Dashboard
                  </Link>
                </div>
                <div className="my-2 border-b border-border/50" />
              </>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-border">
              <div className="px-4 py-3 text-xs text-muted-foreground">
                {user?.full_name || user?.email}
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>);

}