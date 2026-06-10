import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, User, MoreVertical, Bookmark, CreditCard, Settings, Info, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function BottomTabs() {
  const location = useLocation();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryTabs = [
    { path: "/aulas", label: "Agenda", icon: Calendar },
    { path: "/minhas-reservas", label: "Reservas", icon: Bookmark },
    { path: "/perfil", label: "Perfil", icon: User },
  ];

  const moreTabs = [
    { path: "/planos", label: "Planos", icon: CreditCard },
    { path: "/sobre", label: "Sobre", icon: Info },
    { path: "/configuracoes", label: "Configurações", icon: Settings },
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  const isActive = (path) => location.pathname === path;
  const isMoreActive = moreTabs.some(tab => isActive(tab.path));

  const handleTabClick = () => {
    setMoreOpen(false);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 pb-[max(0rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around h-16">
          {primaryTabs.map((tab) => {
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

          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MoreVertical className="h-5 w-5" />
            <span className="text-xs font-medium">Mais</span>
          </button>
        </div>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-6">
            {moreTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={handleTabClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(tab.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}