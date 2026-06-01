import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.filter({ is_active: true })
  });

  return (
    <div className="font-body">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Pole Dance & Artes
            </div>
            <div className="flex justify-center mb-4">
              <img src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png" alt="Praiana Pole Dance" className="w-32 h-32 object-contain dark:bg-white dark:rounded-2xl dark:p-2 opacity-90 dark:opacity-100" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Praiana
              <span className="text-primary italic"> Pole Dance</span>
              <span className="block text-2xl sm:text-3xl font-normal text-muted-foreground mt-2">& Artes</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">O aplicativo do nosso estúdio. Marque as suas aulas, fique por dentro d

            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full px-8 font-medium">
                <Link to="/aulas">
                  Agendar Aula <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-medium">
                <Link to="/minhas-reservas">Minhas Reservas</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modalidades */}
      {classTypes.length > 0 &&
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
            transition={{ duration: 0.4, delay: i * 0.1 }}>
            
                <Link
              to="/aulas"
              className="group block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              
                  {ct.image_url ?
              <div className="aspect-[4/3] overflow-hidden">
                      <img
                  src={ct.image_url}
                  alt={ct.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                    </div> :

              <div
                className="aspect-[4/3] flex items-center justify-center"
                style={{ backgroundColor: ct.color || "hsl(320, 45%, 45%)", opacity: 0.15 }}>
                
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
              }
                  <div className="p-5">
                    <h3 className="font-heading text-xl font-semibold">{ct.name}</h3>
                    {ct.description &&
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ct.description}</p>
                }
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {ct.duration_minutes || 60}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Até {ct.max_students || 8} alunas
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
          )}
          </div>
        </section>
      }

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
          <img src="https://media.base44.com/images/public/6a0b29752977eaee21c7da55/c2269a69d_Logo_PRAIANA.png" alt="Praiana" className="w-12 h-12 object-contain mx-auto mb-2 dark:bg-white dark:rounded-xl dark:p-1 opacity-60 dark:opacity-100" />
          <p className="font-heading text-lg font-semibold text-foreground mb-1">Praiana Pole Dance & Artes</p>
        </div>
      </footer>
    </div>);

}