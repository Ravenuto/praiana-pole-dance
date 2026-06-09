import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useAuth } from "@/lib/AuthContext";
import InactivePlanScreen from "@/components/shared/InactivePlanScreen";

export default function AppLayout() {
  const { user } = useAuth();

  // Alunas (não admin) precisam ter plano ativo para acessar o app
  if (user && user.role !== "admin" && !user.plan) {
    return <InactivePlanScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileHeader />
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}