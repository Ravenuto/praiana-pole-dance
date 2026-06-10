import { base44 } from "@/api/base44Client";

// Defaults caso não haja registro no banco
export const DEFAULTS = {
  booking_min_hours: "4",
  cancel_min_hours: "4",
  late_tolerance_minutes: "15",
  credits_validity_days: "31",
  rule_credits: "Os créditos têm validade de 1 mês a partir da data de início do plano. Créditos não utilizados dentro do período não são transferidos.",
  rule_waitlist: "Quando a aula estiver lotada, você pode entrar na fila de espera. Ao surgir uma vaga, você será notificada automaticamente.",
  rule_holidays: "Nos feriados marcados no sistema não haverá aulas. Verifique o calendário antes de reservar.",
};

let _cache = null;

export async function getStudioSettings() {
  if (_cache) return _cache;
  const rows = await base44.entities.StudioSettings.list();
  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });
  _cache = map;
  return map;
}

export function clearSettingsCache() {
  _cache = null;
}