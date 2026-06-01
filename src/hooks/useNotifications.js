import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export function useUnreadCount(userEmail) {
  const { data = [] } = useQuery({
    queryKey: ["notifCount", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail, read: false }, "-created_date", 50),
    enabled: !!userEmail,
    refetchInterval: 30000, // atualiza a cada 30s
  });
  return data.length;
}

export async function createNotification({ user_email, type, title, message, link, actor_name }) {
  await base44.entities.Notification.create({ user_email, type, title, message, link, actor_name, read: false });
}