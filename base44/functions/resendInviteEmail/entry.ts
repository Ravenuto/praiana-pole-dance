import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Reenviar convite usando o SDK
    await base44.asServiceRole.users.inviteUser(email, 'user');

    return Response.json({ success: true, message: 'Convite reenviado para ' + email });
  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});