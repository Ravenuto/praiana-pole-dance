import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Listar usuários ativados
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Listar todos os convites
    const allInvitations = await base44.asServiceRole.entities.StudentInvitation.list();
    const invitations = allInvitations.filter(inv => inv.status === "pending");

    console.log(`Total de usuários: ${allUsers.length}`);
    console.log(`Total de convites pendentes: ${invitations.length}`);

    // Combinar usuários e convites
    const combinedUsers = [
      ...allUsers,
      ...invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        full_name: inv.full_name || inv.email,
        role: inv.role || 'user',
        is_invited: true,
        created_date: inv.invited_date || inv.created_date
      }))
    ];

    return Response.json({ users: combinedUsers });
  } catch (error) {
    console.error('Erro em getAllUsers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});