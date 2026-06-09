import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, email } = await req.json();
    if (!userId && !email) {
      return Response.json({ error: 'userId ou email obrigatório' }, { status: 400 });
    }

    // Busca o usuário se só tiver email
    let targetId = userId;
    if (!targetId && email) {
      const users = await base44.asServiceRole.entities.User.filter({ email }, '-created_date', 1);
      targetId = users?.[0]?.id;
    }

    if (!targetId) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Deleta o usuário completamente (auth + dados)
    await base44.asServiceRole.entities.User.delete(targetId);

    // Limpa também StudentInvitation se existir
    if (email) {
      const invitations = await base44.asServiceRole.entities.StudentInvitation.filter({ email });
      for (const inv of invitations) {
        await base44.asServiceRole.entities.StudentInvitation.delete(inv.id);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});