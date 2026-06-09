import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

import { base44 } from "@/api/base44Client";
import { useUnreadCount } from "@/hooks/useNotifications";
import {
  Menu, X, LogOut, ChevronDown,
  Home, CalendarDays, Bookmark, Megaphone, ImageIcon, CreditCard, User, ShieldCheck, Bell, Settings } from
"lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const PRIMARY_LINKS = [
  { to: "/", label: "Início", icon: Home }
];

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

const ADMIN_LINK = { to: "/admin", label: "Admin", icon: ShieldCheck };

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const unreadCount = useUnreadCount(user?.email);

  const isActive = (path) => location.pathname === path;
  
  const renderNavGroup = (label, links, icon) => {
    const Icon = icon;
    const isGroupActive = links.some(link => isActive(link.to));
    
    return (
      <DropdownMenu key={label}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors gap-1 ${
              isGroupActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {label}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {links.map((link) => {
            const LinkIcon = link.icon;
            return (
              <DropdownMenuItem key={link.to} asChild>
                <Link to={link.to} className="flex items-center gap-2 cursor-pointer">
                  <LinkIcon className="h-4 w-4" />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
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

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors ${
                  isActive(link.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {renderNavGroup("Minhas Aulas", MINHAS_AULAS_LINKS, CalendarDays)}
            {renderNavGroup("Comunidade", COMUNIDADE_LINKS, Megaphone)}
            {renderNavGroup("Minha Conta", MINHA_CONTA_LINKS, User)}
            {isAdmin && renderNavGroup("Admin", [ADMIN_LINK], ShieldCheck)}
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
            {/* Sino fora do menu mobile */}
            <Link to="/notificacoes" className="relative p-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen &&
        <div className="md:hidden pb-4 pt-2">
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {PRIMARY_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-center transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-tight">{link.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="space-y-1.5 mb-3">
              {[
                { label: "Minhas Aulas", links: MINHAS_AULAS_LINKS },
                { label: "Comunidade", links: COMUNIDADE_LINKS },
                { label: "Minha Conta", links: MINHA_CONTA_LINKS },
                ...(isAdmin ? [{ label: "Admin", links: [ADMIN_LINK] }] : []),
              ].map((group) => (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between h-8 text-xs"
                    >
                      {group.label}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {group.links.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.to} asChild>
                          <Link to={link.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 cursor-pointer">
                            <Icon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
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