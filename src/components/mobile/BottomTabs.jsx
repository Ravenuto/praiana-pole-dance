import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Zap, User } from "lucide-react";

export default function BottomTabs() {
  const location = useLocation();
  
  const tabs = [
    { path: "/", label: "Início", icon: Home },
    { path: "/aulas", label: "Agenda", icon: Calendar },
    { path: "/feed", label: "Feed", icon: Zap },
    { path: "/perfil", label: "Perfil", icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden sm:hidden md:hidden lg:hidden xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 pb-[max(0rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive(tab.path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}