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
    const existing = await base44.asServiceRole.entities.User.filter({ email: testEmail });
    if (existing.length > 0) {
      // Já existe, só retorna
      return Response.json({ 
        success: true, 
        message: "Aluna teste já existe!" 
      });
    }

    // Criar novo usuário convidando via email
    await base44.users.inviteUser(testEmail, "user");
    
    // Esperar a criação
    await new Promise(r => setTimeout(r, 3000));

    // Buscar o usuário criado com retry
    let testUser = null;
    for (let i = 0; i < 8; i++) {
      const users = await base44.asServiceRole.entities.User.filter({ email: testEmail });
      if (users.length > 0) {
        testUser = users[0];
        break;
      }
      if (i < 7) await new Promise(r => setTimeout(r, 1500));
    }

    if (testUser) {
      // Atualizar com dados de teste
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
        message: `Aluna teste criada! ID: ${testUser.id}`,
        userId: testUser.id
      });
    } else {
      return Response.json({ 
        error: 'Aluna foi convidada mas não foi encontrada no sistema. Aguarde alguns minutos e tente novamente.' 
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});