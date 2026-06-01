import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const testEmail = `aluna.teste.${Date.now()}@praiana.app`;
    
    // Criar usuário diretamente via asServiceRole
    const newUser = await base44.asServiceRole.entities.User.create({
      email: testEmail,
      full_name: "Aluna Teste",
      role: "user",
      plan: "4_aulas",
      credits: 4,
      plan_start_date: "2026-05-20",
      last_payment_date: "2026-05-20",
      is_active: true,
      phone: "(11) 98765-4321",
      birth_date: "1995-03-15",
      notes: ""
    });
    
    return Response.json({ 
      success: true, 
      message: `✅ Aluna teste criada com sucesso!`,
      email: testEmail,
      userId: newUser.id
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});