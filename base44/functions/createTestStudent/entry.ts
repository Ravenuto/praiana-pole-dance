import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const testEmail = `aluna.teste.${Date.now()}@praiana.app`;
    
    // Convidar o usuário com role "user"
    await base44.users.inviteUser(testEmail, "user");
    
    // Registrar também na entidade StudentInvitation para rastreamento
    const invitation = await base44.asServiceRole.entities.StudentInvitation.create({
      email: testEmail,
      full_name: "Aluna Teste",
      role: "user",
      plan: "4_aulas",
      credits: 4,
      status: "pending",
      invited_date: new Date().toISOString()
    });
    
    return Response.json({ 
      success: true, 
      message: `✅ Aluna teste criada com sucesso!`,
      email: testEmail,
      userId: invitation.id
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});