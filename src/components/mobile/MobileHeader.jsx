import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const MOBILE_ONLY_ROUTES = ["/perfil", "/configuracoes", "/sobre", "/admin"];

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSubRoute = MOBILE_ONLY_ROUTES.some(route => location.pathname.startsWith(route));

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="md:hidden sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between h-14 px-4">
        {isSubRoute ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-heading text-sm font-semibold">
              {location.pathname === "/perfil" && "Perfil"}
              {location.pathname === "/configuracoes" && "Configurações"}
              {location.pathname === "/sobre" && "Sobre"}
              {location.pathname.startsWith("/admin") && "Admin"}
            </span>
            <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png"
                alt="Praiana"
                className="w-6 h-6 object-contain dark:bg-white dark:rounded dark:p-0.5 opacity-80 dark:opacity-100"
              />
              <span className="font-heading text-sm font-semibold">Praiana</span>
            </Link>
            <div className="flex-1" />
          </>
        )}
      </div>
    </div>
  );
}