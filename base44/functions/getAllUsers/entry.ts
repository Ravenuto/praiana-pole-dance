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

    // Usa asServiceRole para listar TODOS os usuários sem restrições
    const allUsers = await base44.asServiceRole.entities.User.list();

    return Response.json({ users: allUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});