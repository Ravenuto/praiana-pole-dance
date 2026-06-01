import React from "react";
import { Heart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function InactivePlanScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Praiana Pole Dance
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Oii! Seu acesso ainda está sendo liberado. 💙
          </p>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Assim que sua professora confirmar seu plano, você já poderá agendar suas aulas normalmente. Se tiver dúvidas, entre em contato!
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            className="rounded-full gap-2"
            onClick={() => window.open("https://wa.me/55", "_blank")}
          >
            <Phone className="w-4 h-4" />
            Falar pelo WhatsApp
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm"
            onClick={() => base44.auth.logout()}
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}