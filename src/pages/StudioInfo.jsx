import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Clock, Users, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function StudioInfo() {
  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.filter({ is_active: true })
  });

  return (
    <div className="font-body">
      {/* Studio Info Header */}
      <section className="relative overflow-hidden py-12 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight">
              Praiana Pole Dance & Artes
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça nosso estúdio e as modalidades que oferecemos
            </p>
          </motion.div>

          {/* Contact Info */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Endereço</h3>
                  <p className="text-sm text-muted-foreground">
                    Rua da Praia, 123<br />
                    Rio de Janeiro, RJ 20000-000
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Contato</h3>
                  <p className="text-sm text-muted-foreground">
                    <a href="tel:+5521999999999" className="hover:text-foreground">
                      (21) 99999-9999
                    </a><br />
                    <a href="mailto:contato@praiana.com" className="hover:text-foreground">
                      contato@praiana.com
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modalidades */}
      {classTypes.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">Nossas Modalidades</h2>
            <p className="mt-3 text-muted-foreground">Escolha a aula perfeita para você</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classTypes.map((ct, i) =>
              <motion.div
                key={ct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="block rounded-2xl overflow-hidden border border-border bg-card">
                  {ct.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={ct.image_url}
                        alt={ct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="aspect-[4/3] flex items-center justify-center"
                      style={{ backgroundColor: ct.color || "hsl(320, 45%, 45%)", opacity: 0.15 }}
                    >
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-heading text-xl font-semibold">{ct.name}</h3>
                    {ct.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {ct.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {ct.duration_minutes || 60}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Até {ct.max_students || 8} alunas
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}