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
    const newUser = await base44.asServiceRole.users.inviteUser(testEmail, "user");
    
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