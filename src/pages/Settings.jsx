import React from "react";
import ChangePassword from "@/components/settings/ChangePassword";

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Configurações</h1>
      </div>
      <ChangePassword />
    </div>
  );
}