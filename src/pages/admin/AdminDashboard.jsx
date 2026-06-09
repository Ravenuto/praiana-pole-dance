import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { BookOpen, Calendar, Users, CreditCard, UserPlus, ClipboardCheck, Bell } from "lucide-react";
import ManageClassTypes from "@/components/admin/ManageClassTypes";
import ManageSessions from "@/components/admin/ManageSessions";
import ManageBookings from "@/components/admin/ManageBookingsMobile";
import ManagePlansAdmin from "@/components/admin/ManagePlansAdmin";
import ManageStudents from "@/components/admin/ManageStudents";
import AttendanceBySchedule from "@/components/admin/AttendanceBySchedule";
import StudentRequests from "@/components/admin/StudentRequests";

const TABS = [
  { key: "sessions",    label: "Horários",    icon: Calendar },
  { key: "classTypes",  label: "Modalidades", icon: BookOpen },
  { key: "bookings",    label: "Reservas",    icon: Users },
  { key: "plans",       label: "Planos",      icon: CreditCard },
  { key: "students",    label: "Alunas",      icon: UserPlus },
  { key: "attendance",  label: "Presenças",   icon: ClipboardCheck },
  { key: "requests",    label: "Solicitações", icon: Bell },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("sessions");
  const [presencasDate, setPresencasDate] = useState("");

  // Ler query params ao carregar (ex: ?aba=presencas&data=2024-06-01)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aba = params.get("aba");
    const data = params.get("data");
    if (aba === "presencas") {
      setActiveTab("attendance");
      if (data) setPresencasDate(data);
    }
  }, []);

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-body">
      <div className="mb-6">
         <h1 className="font-heading text-lg font-semibold">Painel Admin</h1>
         <p className="mt-1 text-muted-foreground text-xs">Gerencie modalidades, horários e reservas</p>
       </div>

      {/* Tab nav — grid para caber na tela em mobile */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-center transition-colors text-xs font-medium ${
              activeTab === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "sessions"    && <ManageSessions />}
        {activeTab === "classTypes"  && <ManageClassTypes />}
        {activeTab === "bookings"    && <ManageBookings />}
        {activeTab === "plans"       && <ManagePlansAdmin />}
        {activeTab === "students"    && <ManageStudents />}
        {activeTab === "attendance"  && <AttendanceBySchedule initialDate={presencasDate} />}
        {activeTab === "requests"    && <StudentRequests onApproved={() => setActiveTab("students")} />}
      </div>
    </div>
  );
}