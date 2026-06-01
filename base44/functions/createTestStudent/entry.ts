import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const testEmail = "aluna.teste@praiana.app";
    
    // Verificar se já existe
    let existingUsers = await base44.asServiceRole.entities.User.filter({ email: testEmail });
    
    if (existingUsers.length > 0) {
      // Já existe, atualiza dados
      const testUser = existingUsers[0];
      await base44.asServiceRole.entities.User.update(testUser.id, {
        full_name: "Aluna Teste",
        plan: "4_aulas",
        credits: 4,
        plan_start_date: "2026-05-20",
        last_payment_date: "2026-05-20",
        is_active: true,
        phone: "(11) 98765-4321",
        birth_date: "1995-03-15"
      });
      return Response.json({ 
        success: true, 
        message: "✅ Aluna teste atualizada com sucesso!",
        email: testEmail
      });
    }

    // Convidar para criar a conta
    await base44.users.inviteUser(testEmail, "user");
    
    // Aguardar criação em background (não bloqueia)
    // Retorna sucesso imediato
    return Response.json({ 
      success: true, 
      message: "✅ Convite enviado! A aluna será criada em breve.",
      email: testEmail
    });

  } catch (error) {
    console.error('Erro ao criar aluna teste:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});