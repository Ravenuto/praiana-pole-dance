import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Users, CreditCard, UserPlus, ClipboardCheck } from "lucide-react";
import ManageClassTypes from "@/components/admin/ManageClassTypes";
import ManageSessions from "@/components/admin/ManageSessions";
import ManageBookings from "@/components/admin/ManageBookings";
import ManagePlansAdmin from "@/components/admin/ManagePlansAdmin";
import ManageStudents from "@/components/admin/ManageStudents";
import AttendanceBySchedule from "@/components/admin/AttendanceBySchedule";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Painel Admin</h1>
        <p className="mt-2 text-muted-foreground">Gerencie modalidades, horários e reservas</p>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" /> Horários
          </TabsTrigger>
          <TabsTrigger value="classTypes" className="gap-2">
            <BookOpen className="h-4 w-4" /> Modalidades
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Users className="h-4 w-4" /> Reservas
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <CreditCard className="h-4 w-4" /> Planos
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <UserPlus className="h-4 w-4" /> Alunas
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <ClipboardCheck className="h-4 w-4" /> Presenças
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <ManageSessions />
        </TabsContent>
        <TabsContent value="classTypes">
          <ManageClassTypes />
        </TabsContent>
        <TabsContent value="bookings">
          <ManageBookings />
        </TabsContent>
        <TabsContent value="plans">
          <ManagePlansAdmin />
        </TabsContent>
        <TabsContent value="students">
          <ManageStudents />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceBySchedule />
        </TabsContent>
      </Tabs>
    </div>
  );
}