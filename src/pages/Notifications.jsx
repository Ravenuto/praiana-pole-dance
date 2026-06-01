import React from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Heart, MessageCircle, Calendar, CreditCard, Megaphone, ImageIcon, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const TYPE_CONFIG = {
  new_post: { icon: ImageIcon, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  new_notice: { icon: Megaphone, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
  schedule_change: { icon: Calendar, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  credits_added: { icon: CreditCard, color: "text-green-500 bg-green-50 dark:bg-green-950" },
  like: { icon: Heart, color: "text-red-500 bg-red-50 dark:bg-red-950" },
  comment: { icon: MessageCircle, color: "text-primary bg-primary/10" },
  booking_made: { icon: Calendar, color: "text-green-500 bg-green-50 dark:bg-green-950" },
  booking_cancelled: { icon: Calendar, color: "text-destructive bg-destructive/10" },
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifCount"] });
    toast.success("Todas marcadas como lidas");
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      await base44.entities.Notification.update(notif.id, { read: true });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifCount"] });
    }
    if (notif.link) navigate(notif.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await base44.entities.Notification.delete(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifCount"] });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Notificações
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-sm rounded-full px-2 py-0.5">{unreadCount}</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1 text-xs text-muted-foreground">
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas lidas
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhuma notificação ainda</p>
            <p className="text-sm mt-1">Você será notificada quando houver novidades!</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.new_post;
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onClick={() => handleClick(notif)}
                  className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    notif.read ? "border-border bg-card opacity-70" : "border-primary/20 bg-card shadow-sm"
                  }`}
                >
                  {!notif.read && (
                    <div className="absolute top-3.5 left-3.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${notif.read ? "" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {format(new Date(notif.created_date), "d MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}