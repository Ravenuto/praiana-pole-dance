import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import NoticeCard from "./NoticeCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function NoticesHome() {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => base44.entities.Notice.filter({}, "-updated_date", 10)
  });

  const pinnedNotices = notices.filter(n => n.pinned);
  const regularNotices = notices.filter(n => !n.pinned).slice(0, 3);

  if (isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-b border-border">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl font-bold">Recados</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (notices.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-b border-border">
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold">Recados</h2>
      </div>

      <div className="space-y-4">
        {/* Pinned notices */}
        {pinnedNotices.map((notice, i) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <NoticeCard notice={notice} />
          </motion.div>
        ))}

        {/* Regular notices */}
        {regularNotices.map((notice, i) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (pinnedNotices.length + i) * 0.1 }}
          >
            <NoticeCard notice={notice} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}